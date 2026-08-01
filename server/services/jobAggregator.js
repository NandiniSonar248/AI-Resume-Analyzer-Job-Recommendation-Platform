/**
 * jobAggregator.js — Multi-Source Job Search Orchestrator
 * =====================================================================
 * WHAT IT IS:
 *   The single entry point for all job search operations. Calls RemoteOK,
 *   Adzuna, and JSearch in parallel, deduplicates cross-source results,
 *   normalizes them to one consistent shape, and returns a ranked list.
 *
 *   This is the ONLY file that jobRoutes.js imports from. Routes don't know
 *   or care whether a job came from Adzuna, JSearch, or RemoteOK.
 *
 * PARALLEL CALL STRATEGY — WHY Promise.allSettled:
 *   Promise.allSettled fires all 3 API calls simultaneously and waits for
 *   ALL of them to either succeed or fail — it never short-circuits.
 *   Total wait time = max(remoteOK_time, adzuna_time, jsearch_time)
 *   instead of their sum.
 *
 *   Why not Promise.all? Promise.all rejects the entire batch the moment
 *   any single source throws. Since these are independent external APIs that
 *   can go down independently (JSearch has a 10s timeout, RemoteOK sometimes
 *   returns 429, Adzuna may temporarily exceed quota), we want partial results
 *   — 2 sources working is far better than 0 because the 3rd errored.
 *
 * DEDUPLICATION STRATEGY:
 *   Problem: The same job listing can appear in both JSearch (which scrapes
 *   LinkedIn) and Adzuna (which independently indexes from the same sources).
 *   We use a composite key: normalize(title) + "||" + normalize(company)
 *
 *   normalize() = lowercase + strip all punctuation + collapse whitespace
 *   Example: "Senior React.js Developer" + "TCS" →
 *            "senior reactjs developer" + "||" + "tcs"
 *
 *   Why not use URL? Different per aggregator for the same job.
 *   Why not just title? Same company posts multiple similar-titled roles.
 *   Why not job ID? Each source generates its own IDs.
 *   Why title+company? This is precise enough to catch true duplicates
 *   (same role, same company) without eliminating different roles at same company.
 *
 * REMOTEOK INTEGRATION:
 *   RemoteOK's API is free with no key. It requires a User-Agent header
 *   and returns the first item in the array as metadata (to be skipped).
 *   We filter by keyword match since RemoteOK doesn't support server-side
 *   query filtering — it returns ALL jobs and we filter client-side.
 *
 * HOW IT CONNECTS TO THE SYSTEM:
 *   - Called by: jobRoutes.js (GET /api/jobs/search, POST /api/jobs/match,
 *                             POST /api/jobs/match-by-resume)
 *   - Calls: fetchAdzunaJobs, fetchJSearchJobs (internal services)
 *   - Also calls RemoteOK directly (simple enough, no separate file needed)
 *   - Exports: searchJobs(), matchJobsWithResume(), extractSkillsFromText()
 *   - Env vars: none directly (API keys read by individual services)
 *
 * NO FAKE FALLBACK:
 *   If all 3 real sources return 0 results, this function returns [].
 *   There is no fallback generator. The route will return { jobs: [], count: 0 }
 *   and the frontend will show an honest "no live listings" empty state.
 *   This is the correct behavior per SPEC.md's core principle.
 */

import { fetchAdzunaJobs } from "./adzunaService.js";
import { fetchJSearchJobs } from "./jSearchService.js";
import dotenv from "dotenv";
dotenv.config();

// ─── Cache ───────────────────────────────────────────────────────────────────
// In-memory cache keyed by `${query}-${location}-${page}`.
// TTL: 5 minutes — fresh enough for live feel, short enough to avoid
// showing stale listings in a fast-moving job market.
const jobCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCached(key) {
  const entry = jobCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    jobCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  jobCache.set(key, { data, timestamp: Date.now() });
}

// ─── RemoteOK ─────────────────────────────────────────────────────────────────
// RemoteOK is free, no API key, returns all remote jobs then we filter locally.
// The first item in their array is always a metadata object — we skip it with slice(1).
async function fetchRemoteOKJobs(query) {
  try {
    const response = await fetch("https://remoteok.com/api", {
      headers: {
        "User-Agent": "AIJobMatcherPro/1.0 (Portfolio project; contact: dev@example.com)",
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      console.warn(`[RemoteOK] API returned ${response.status}`);
      return [];
    }

    const data = await response.json();

    // Keyword filtering — RemoteOK has no server-side search, so we match locally
    const keywords = query
      .toLowerCase()
      .split(/[\s,+]+/)
      .filter((kw) => kw.length > 2);

    const filtered = data
      .slice(1) // Skip metadata item at index 0
      .filter((job) => {
        if (!job.position && !job.company) return false; // Skip malformed entries
        const searchable = [
          job.position,
          job.company,
          ...(job.tags || []),
          job.description,
        ]
          .join(" ")
          .toLowerCase();
        return keywords.some((kw) => searchable.includes(kw));
      });

    const normalized = filtered.slice(0, 10).map((job) => ({
      id: `remoteok-${job.id}`,
      title: job.position || "Position",
      company: job.company || "Company",
      location: job.location || "Remote",
      salary: job.salary || null,
      description: job.description
        ? job.description.replace(/<[^>]+>/g, " ").trim().substring(0, 350)
        : "Remote position. See full listing for details.",
      url: job.url,
      logo: job.company_logo || null,
      source: "RemoteOK",
      sourceIcon: "🌍",
      postedAt: job.date || new Date().toISOString(),
      tags: job.tags || [],
      isRemote: true,
    }));

    console.log(`[RemoteOK] Fetched ${normalized.length} jobs for "${query}"`);
    return normalized;
  } catch (error) {
    if (error.name === "TimeoutError") {
      console.warn("[RemoteOK] Request timed out");
    } else {
      console.warn(`[RemoteOK] Fetch failed: ${error.message}`);
    }
    return [];
  }
}

// ─── Normalization ───────────────────────────────────────────────────────────
/**
 * Normalize a string for deduplication comparison.
 * Converts to lowercase, removes all non-alphanumeric characters,
 * collapses whitespace. This makes "React.js Developer" === "reactjs developer"
 * and "Sr. Node Developer" ≈ "sr node developer".
 */
function normalizeForDedup(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "") // Remove punctuation, dots, slashes
    .replace(/\s+/g, " ")         // Collapse whitespace
    .trim();
}

/**
 * Remove duplicate jobs across sources.
 * Key: normalize(title) + "||" + normalize(company)
 * When a duplicate is found, we keep the FIRST occurrence.
 * Source priority order in jobAggregator: JSearch → Adzuna → RemoteOK
 * (JSearch tends to have richer data and more current listings)
 */
function deduplicateJobs(jobs) {
  const seen = new Map(); // key → true
  const unique = [];

  for (const job of jobs) {
    const key =
      normalizeForDedup(job.title) + "||" + normalizeForDedup(job.company);

    if (!seen.has(key)) {
      seen.set(key, true);
      unique.push(job);
    }
    // Duplicate found — silently skip it
  }

  console.log(
    `[Aggregator] Dedup: ${jobs.length} total → ${unique.length} unique`
  );
  return unique;
}

/**
 * Filter out unusable jobs — those without a real apply URL.
 * A job card without a "Apply Now" link is useless to the user.
 * JSearch sometimes returns jobs with null apply links.
 */
function filterUnusable(jobs) {
  return jobs.filter((job) => {
    if (!job.url) return false;
    if (typeof job.url !== "string") return false;
    if (!job.url.startsWith("http")) return false;
    return true;
  });
}

/**
 * Score and sort jobs by keyword relevance to the search query.
 * Titles that contain the search keywords rank higher.
 * This is a simple heuristic — we're not building a search engine here.
 */
function rankByRelevance(jobs, query) {
  const keywords = query
    .toLowerCase()
    .split(/[\s,+]+/)
    .filter((kw) => kw.length > 2);

  return jobs
    .map((job) => {
      const titleText = job.title.toLowerCase();
      const titleMatches = keywords.filter((kw) => titleText.includes(kw)).length;

      const descText = (job.description || "").toLowerCase();
      const descMatches = keywords.filter((kw) => descText.includes(kw)).length;

      const tagText = (job.tags || []).join(" ").toLowerCase();
      const tagMatches = keywords.filter((kw) => tagText.includes(kw)).length;

      // Weighted relevance: title match worth 3x, tag match 2x, desc match 1x
      const relevanceScore = titleMatches * 3 + tagMatches * 2 + descMatches;

      return { ...job, _relevanceScore: relevanceScore };
    })
    .sort((a, b) => b._relevanceScore - a._relevanceScore)
    .map(({ _relevanceScore, ...job }) => job); // Strip internal score field
}

// ─── Main Export: searchJobs ──────────────────────────────────────────────────
/**
 * searchJobs — Core function: orchestrates all 3 sources in parallel.
 *
 * Flow:
 * 1. Check in-memory cache (5-min TTL)
 * 2. Fire RemoteOK + Adzuna + JSearch simultaneously via Promise.allSettled
 * 3. Collect fulfilled results (ignore failures gracefully)
 * 4. Filter out jobs without apply URLs
 * 5. Deduplicate by title+company
 * 6. Rank by relevance
 * 7. Cache and return
 *
 * If all 3 sources return 0 results → returns []. No fake fallback.
 *
 * @param {string} query    — search keywords (e.g. "react developer")
 * @param {string} location — location string (e.g. "India", "Remote")
 * @param {number} page     — page number for pagination (default 1)
 * @returns {Promise<NormalizedJob[]>}
 */
export async function searchJobs(query, location = "India", page = 1) {
  if (!query || query.trim().length < 2) return [];

  const cacheKey = `${query.trim().toLowerCase()}-${location.toLowerCase()}-${page}`;
  const cached = getCached(cacheKey);
  if (cached) {
    console.log(`[Aggregator] Cache hit for "${query}" in ${location}`);
    return cached;
  }

  console.log(`[Aggregator] Fetching jobs for "${query}" in ${location} (page ${page})`);
  const startTime = Date.now();

  // Fire all 3 sources simultaneously — Promise.allSettled never throws
  const [remoteOKResult, adzunaResult, jSearchResult] = await Promise.allSettled([
    fetchRemoteOKJobs(query),
    fetchAdzunaJobs(query, location, page),
    fetchJSearchJobs(query, location, page),
  ]);

  // Collect only fulfilled results — failed sources are silently skipped
  const allJobs = [];

  if (jSearchResult.status === "fulfilled" && Array.isArray(jSearchResult.value)) {
    allJobs.push(...jSearchResult.value);
  } else if (jSearchResult.status === "rejected") {
    console.warn("[Aggregator] JSearch failed:", jSearchResult.reason?.message);
  }

  if (adzunaResult.status === "fulfilled" && Array.isArray(adzunaResult.value)) {
    allJobs.push(...adzunaResult.value);
  } else if (adzunaResult.status === "rejected") {
    console.warn("[Aggregator] Adzuna failed:", adzunaResult.reason?.message);
  }

  if (remoteOKResult.status === "fulfilled" && Array.isArray(remoteOKResult.value)) {
    allJobs.push(...remoteOKResult.value);
  } else if (remoteOKResult.status === "rejected") {
    console.warn("[Aggregator] RemoteOK failed:", remoteOKResult.reason?.message);
  }

  console.log(`[Aggregator] Raw combined: ${allJobs.length} jobs from all sources`);

  // Pipeline: filter unusable → dedup → rank
  const withUrls = filterUnusable(allJobs);
  const unique = deduplicateJobs(withUrls);
  const ranked = rankByRelevance(unique, query);

  const elapsedMs = Date.now() - startTime;
  console.log(
    `[Aggregator] Final: ${ranked.length} jobs returned in ${elapsedMs}ms`
  );

  // Cache the result
  setCache(cacheKey, ranked);

  return ranked;
}

// ─── Main Export: matchJobsWithResume ─────────────────────────────────────────
/**
 * matchJobsWithResume — Score jobs against extracted resume skills.
 *
 * Used for the auto-matching flow: after resume upload, the extracted
 * `matchedKeywords` from the ATS analysis are passed here.
 *
 * Flow:
 * 1. Build a search query from the top 5 skills (most relevant signal)
 * 2. Call searchJobs with those skills as keywords
 * 3. Score each returned job by how many skills appear in title/description/tags
 * 4. Attach matchScore (0–100) and matchedSkills array to each job
 * 5. Sort by matchScore descending
 *
 * @param {string[]} skills  — array of skill strings from resume parsing
 * @param {string}   location — preferred location
 * @returns {Promise<ScoredJob[]>}
 */
export async function matchJobsWithResume(skills, location = "India") {
  if (!skills || skills.length === 0) return [];

  // Use top 5 skills as the search query
  // More than 5 makes the query too specific and returns fewer results
  const topSkills = skills.slice(0, 5);
  const query = topSkills.join(" ");

  const jobs = await searchJobs(query, location, 1);

  // Score each job by skill overlap
  const scored = jobs.map((job) => {
    const jobText = [
      job.title,
      job.description,
      ...(job.tags || []),
    ]
      .join(" ")
      .toLowerCase();

    const matchedSkills = skills.filter((skill) =>
      jobText.includes(skill.toLowerCase())
    );

    const matchScore =
      skills.length > 0
        ? Math.round((matchedSkills.length / skills.length) * 100)
        : 0;

    return { ...job, matchScore, matchedSkills };
  });

  // Sort: highest match score first
  return scored.sort((a, b) => b.matchScore - a.matchScore);
}

// ─── Export: extractSkillsFromText ────────────────────────────────────────────
/**
 * extractSkillsFromText — Simple skill extractor for resume text.
 *
 * Used by the POST /api/jobs/match-by-resume route when the caller sends
 * raw resume text rather than a pre-extracted skills array.
 *
 * Strategy: scan for known tech terms using a keyword list. This is not
 * NLP — it's a dictionary lookup. Sufficient for generating a search query.
 * The ATS engine already does the authoritative extraction; this is a quick
 * path for the jobs endpoint when it receives raw text.
 *
 * @param {string} resumeText
 * @returns {string[]} array of matched skill strings
 */
export function extractSkillsFromText(resumeText) {
  if (!resumeText) return [];

  const text = resumeText.toLowerCase();

  const skillKeywords = [
    // Languages
    "javascript", "typescript", "python", "java", "c++", "c#", "go", "rust",
    "ruby", "php", "kotlin", "swift", "scala", "r", "matlab", "bash",
    // Frontend
    "react", "vue", "angular", "next.js", "nuxt", "svelte", "html", "css",
    "sass", "tailwind", "bootstrap", "webpack", "vite",
    // Backend
    "node.js", "express", "django", "flask", "fastapi", "spring", "laravel",
    "rails", "graphql", "rest api", "microservices",
    // Databases
    "mongodb", "postgresql", "mysql", "sqlite", "redis", "elasticsearch",
    "dynamodb", "firebase", "supabase",
    // Cloud & DevOps
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ansible",
    "ci/cd", "jenkins", "github actions", "linux",
    // Data & ML
    "machine learning", "deep learning", "tensorflow", "pytorch", "pandas",
    "numpy", "scikit-learn", "data analysis", "sql", "tableau", "power bi",
    // Other
    "git", "agile", "scrum", "jira", "figma", "selenium", "cypress",
    "jest", "mocha", "swagger", "kafka", "rabbitmq",
  ];

  return skillKeywords.filter((skill) => text.includes(skill));
}

export default { searchJobs, matchJobsWithResume, extractSkillsFromText };
