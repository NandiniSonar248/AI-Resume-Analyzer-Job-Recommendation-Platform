/**
 * jSearchService.js — JSearch via RapidAPI Job Search Client
 * =====================================================================
 * WHAT IT IS:
 *   JSearch is a job aggregation API hosted on RapidAPI. It scrapes Google
 *   for Jobs, which itself aggregates from LinkedIn, Indeed, Glassdoor,
 *   ZipRecruiter, and employer career sites using structured job schema markup.
 *
 * HOW IT WORKS — THE FULL CHAIN:
 *   Your request → RapidAPI gateway (auth + rate limiting)
 *                → JSearch scraper → Google for Jobs
 *                                  → LinkedIn / Indeed / Glassdoor feeds
 *   Result: live listings from all major job boards via one API call.
 *
 * HOW RAPIDAPI WORKS AS A MARKETPLACE LAYER:
 *   RapidAPI sits in front of thousands of third-party APIs. They handle:
 *   - Auth: One X-RapidAPI-Key header authenticates you across all RapidAPI-
 *     hosted APIs (you don't need a separate account for each)
 *   - Billing: Tracks request counts per API, enforces plan limits
 *   - Routing: X-RapidAPI-Host tells the gateway which backend to route to
 *   - Monitoring: RapidAPI logs all requests so you can debug in their console
 *   Free tier: 200 requests/month (sufficient for development + demo)
 *
 * JSEARCH API STRUCTURE:
 *   Endpoint: GET https://jsearch.p.rapidapi.com/search
 *   Auth headers:
 *     X-RapidAPI-Key:  your key
 *     X-RapidAPI-Host: jsearch.p.rapidapi.com
 *   Query params:
 *     query     — "react developer in India" style natural language query
 *     page      — page number (1-indexed)
 *     num_pages — number of pages to return (use 1 for free tier efficiency)
 *     date_posted — "all" | "today" | "3days" | "week" | "month"
 *   Key response fields (per job):
 *     job_id              — JSearch internal ID
 *     job_title           — Job title
 *     employer_name       — Company name
 *     employer_logo       — Company logo URL (may be null)
 *     job_city / job_state / job_country — Location parts
 *     job_description     — Full job description text (can be very long)
 *     job_apply_link      — Direct URL to job posting on its source site
 *     job_posted_at_datetime_utc — ISO timestamp
 *     job_min_salary / job_max_salary / job_salary_currency — Salary data
 *     job_required_skills — Array of required skills (may be null)
 *     job_highlights.Qualifications / Responsibilities — Structured highlights
 *
 * HOW IT CONNECTS TO THE SYSTEM:
 *   - Called by: jobAggregator.js only
 *   - Input:  query (string), location (string)
 *   - Output: Array<NormalizedJob> — same unified shape as adzunaService
 *   - Env vars: RAPIDAPI_KEY
 */

import dotenv from "dotenv";
dotenv.config();

const JSEARCH_BASE_URL = "https://jsearch.p.rapidapi.com/search";
const JSEARCH_HOST = "jsearch.p.rapidapi.com";

/**
 * Build a JSearch-friendly query string.
 * JSearch accepts natural language: "react developer in Mumbai" performs better
 * than just "react developer" because Google for Jobs is a semantic search engine.
 *
 * When location is a general country ("India", "Remote"), we append it to the
 * query. When it's a specific city (Mumbai, Bangalore), we include city name.
 */
function buildSearchQuery(query, location) {
  const locationLower = location?.toLowerCase() || "india";

  // For remote, let JSearch find remote-tagged jobs globally
  if (locationLower === "remote") {
    return `${query} remote`;
  }

  // For "India" or "All India", keep it broad
  if (locationLower === "india" || locationLower === "all india") {
    return `${query} in India`;
  }

  // For specific cities/states, include them for better geo-filtering
  return `${query} in ${location}`;
}

/**
 * Build a human-readable location string from JSearch's separate city/state/country fields.
 * JSearch stores location split into parts; we reassemble for display.
 */
function buildLocationString(job) {
  const parts = [job.job_city, job.job_state, job.job_country]
    .filter(Boolean)
    .filter((part) => part.toLowerCase() !== "anywhere");

  if (parts.length === 0) {
    return job.job_is_remote ? "Remote" : "Location not specified";
  }
  return parts.join(", ");
}

/**
 * Format salary from JSearch's min/max/currency fields.
 * JSearch salary data is annual in the listed currency.
 * Not all jobs have salary data — returns null if absent.
 */
function formatSalary(job) {
  const min = job.job_min_salary;
  const max = job.job_max_salary;
  const currency = job.job_salary_currency || "USD";

  if (!min && !max) return null;

  const symbols = { USD: "$", GBP: "£", EUR: "€", INR: "₹", CAD: "CA$", AUD: "A$" };
  const sym = symbols[currency] || currency + " ";

  if (currency === "INR") {
    const minL = min ? (min / 100000).toFixed(1) : null;
    const maxL = max ? (max / 100000).toFixed(1) : null;
    if (minL && maxL) return `₹${minL}L – ₹${maxL}L`;
    if (minL) return `₹${minL}L+`;
    return `Up to ₹${maxL}L`;
  }

  const minK = min ? `${sym}${Math.round(min / 1000)}K` : null;
  const maxK = max ? `${sym}${Math.round(max / 1000)}K` : null;
  if (minK && maxK) return `${minK} – ${maxK}/yr`;
  if (minK) return `${minK}+/yr`;
  return `Up to ${maxK}/yr`;
}

/**
 * Extract skill tags from JSearch response.
 * JSearch may provide job_required_skills array, or we can pull from highlights.
 * Capped at 8 tags for display purposes.
 */
function extractTags(job) {
  const tags = [];

  // job_required_skills is sometimes an array of skill strings
  if (Array.isArray(job.job_required_skills)) {
    tags.push(...job.job_required_skills.slice(0, 8));
  }

  return tags.slice(0, 8);
}

/**
 * Truncate and clean job description for card display.
 * JSearch descriptions are often very long (full job posting text).
 * Strip excessive whitespace, normalize newlines, cap at 350 chars.
 */
function cleanDescription(raw) {
  if (!raw) return "";
  return raw
    .replace(/\n{3,}/g, "\n\n")    // Collapse triple+ newlines
    .replace(/\t/g, " ")            // Replace tabs with spaces
    .replace(/  +/g, " ")           // Collapse multiple spaces
    .trim()
    .substring(0, 350);
}

/**
 * Normalize a raw JSearch API result into our unified Job shape.
 * See adzunaService.js for the full unified Job shape documentation.
 */
function normalizeJob(raw) {
  return {
    id: `jsearch-${raw.job_id}`,
    title: raw.job_title || "Untitled Position",
    company: raw.employer_name || "Company not listed",
    location: buildLocationString(raw),
    salary: formatSalary(raw),
    description: cleanDescription(raw.job_description),
    url: raw.job_apply_link || raw.job_google_link || null,
    logo: raw.employer_logo || null,
    source: "JSearch",
    sourceIcon: "🔍",
    postedAt: raw.job_posted_at_datetime_utc || new Date().toISOString(),
    tags: extractTags(raw),
    isRemote: raw.job_is_remote || false,
  };
}

/**
 * fetchJSearchJobs — The main exported function.
 *
 * Makes a GET request to JSearch via RapidAPI, normalizes results to the
 * unified Job shape, and returns them.
 *
 * Rate limiting note: Free tier is 200 requests/month. We request 1 page
 * (10 results) per call. At this rate, 200 calls = 2000 jobs/month — more
 * than enough for development and demo purposes.
 *
 * @param {string} query    — search keywords
 * @param {string} location — location string
 * @param {number} page     — page number (1-indexed), default 1
 * @returns {Promise<NormalizedJob[]>}
 */
export async function fetchJSearchJobs(query, location = "India", page = 1) {
  const apiKey = process.env.RAPIDAPI_KEY;

  if (!apiKey) {
    console.warn("[JSearch] Missing RAPIDAPI_KEY in .env — skipping");
    return [];
  }

  const searchQuery = buildSearchQuery(query, location);

  const params = new URLSearchParams({
    query: searchQuery,
    page: String(page),
    num_pages: "1",         // 1 page = 10 results; don't waste monthly quota
    date_posted: "all",     // "all" | "today" | "3days" | "week" | "month"
    remote_jobs_only: "false",
    employment_types: "FULLTIME,PARTTIME,INTERN,CONTRACTOR",
  });

  try {
    const response = await fetch(`${JSEARCH_BASE_URL}?${params.toString()}`, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": JSEARCH_HOST,
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(10000), // 10-second timeout (JSearch can be slow)
    });

    if (!response.ok) {
      const text = await response.text();
      console.warn(`[JSearch] API returned ${response.status}: ${text.substring(0, 200)}`);
      return [];
    }

    const data = await response.json();
    const results = data.data || [];

    // Filter out jobs without an apply link (they'd be useless to the user)
    const withLinks = results.filter(
      (job) => job.job_apply_link || job.job_google_link
    );

    console.log(
      `[JSearch] Fetched ${results.length} jobs (${withLinks.length} with apply links) for "${searchQuery}"`
    );

    return withLinks.map(normalizeJob);
  } catch (error) {
    if (error.name === "TimeoutError") {
      console.warn(`[JSearch] Request timed out for query "${query}"`);
    } else {
      console.warn(`[JSearch] Fetch failed: ${error.message}`);
    }
    return [];
  }
}

export default { fetchJSearchJobs };
