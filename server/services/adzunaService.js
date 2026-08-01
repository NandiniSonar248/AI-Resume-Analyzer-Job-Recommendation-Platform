/**
 * adzunaService.js — Adzuna Job Search API Client
 * =====================================================================
 * WHAT IT IS:
 *   Adzuna is a real job aggregator operating in 16 countries. Their API
 *   is free up to 250 requests/day. It gives us genuine, live job listings
 *   from employer career sites, recruitment agencies, and job boards.
 *
 * HOW ADZUNA'S API WORKS (internally):
 *   - Auth: Two query params: app_id + app_key. No OAuth, no bearer tokens.
 *   - Endpoint: GET /v1/api/jobs/{country}/search/{page}
 *   - Country codes: in (India), us (USA), gb (UK), au, ca, de, fr, nl, nz,
 *     pl, ru, sg, za, br, at
 *   - Key response fields:
 *       results[].id              — Adzuna's internal job ID
 *       results[].title           — Job title
 *       results[].company.display_name — Company name
 *       results[].location.display_name — Location string
 *       results[].description     — Job description (plain text, may contain HTML)
 *       results[].salary_min/max  — Salary in local currency (may be absent)
 *       results[].redirect_url    — Real apply link (goes through Adzuna tracker)
 *       results[].created         — ISO timestamp of listing creation
 *       results[].category.label  — Job category (e.g. "IT Jobs")
 *
 * HOW IT CONNECTS TO THE SYSTEM:
 *   - Called by: jobAggregator.js (never directly by routes or frontend)
 *   - Input:  query (string), location (string), page (int, default 1)
 *   - Output: Array<NormalizedJob> — same shape as remoteOkService and
 *             jSearchService so jobAggregator can merge all three blindly
 *   - Env vars consumed: ADZUNA_APP_ID, ADZUNA_API_KEY
 *
 * WHY THIS APPROACH:
 *   Adzuna is the cleanest free job API with India support. No OAuth
 *   complexity, genuine data, salary ranges included. The main alternative
 *   (JSearch) covers more sources but has a monthly cap; having both gives
 *   us complementary coverage.
 */

import dotenv from "dotenv";
dotenv.config();

// Adzuna country code map — expand as needed
const COUNTRY_MAP = {
  india: "in",
  "united states": "us",
  usa: "us",
  us: "us",
  uk: "gb",
  "united kingdom": "gb",
  gb: "gb",
  australia: "au",
  canada: "ca",
  singapore: "sg",
  remote: "gb", // Default remote jobs to GB endpoint (broadest coverage)
};

/**
 * Resolve a human-readable location string to an Adzuna country code.
 * If the location doesn't match any known country, defaults to "in" (India)
 * since this app primarily targets Indian job seekers.
 */
function resolveCountryCode(location) {
  if (!location) return "in";
  const lower = location.toLowerCase();

  // Check exact matches first
  if (COUNTRY_MAP[lower]) return COUNTRY_MAP[lower];

  // Check partial matches (e.g. "Mumbai, India" → "in")
  for (const [key, code] of Object.entries(COUNTRY_MAP)) {
    if (lower.includes(key)) return code;
  }

  return "in"; // Default to India
}

/**
 * Format salary from raw Adzuna numbers to a readable string.
 * Adzuna returns salary in local currency units (no currency symbol).
 * For India (INR), salaries are in actual rupees (e.g. 800000 = ₹8L).
 * For US/UK, they're in USD/GBP annual.
 */
function formatSalary(salaryMin, salaryMax, countryCode) {
  if (!salaryMin && !salaryMax) return null;

  if (countryCode === "in") {
    // Convert to Lakhs for readability
    const minL = salaryMin ? (salaryMin / 100000).toFixed(1) : null;
    const maxL = salaryMax ? (salaryMax / 100000).toFixed(1) : null;
    if (minL && maxL) return `₹${minL}L – ₹${maxL}L`;
    if (minL) return `₹${minL}L+`;
    if (maxL) return `Up to ₹${maxL}L`;
  } else if (countryCode === "us") {
    const minK = salaryMin ? `$${Math.round(salaryMin / 1000)}K` : null;
    const maxK = salaryMax ? `$${Math.round(salaryMax / 1000)}K` : null;
    if (minK && maxK) return `${minK} – ${maxK}`;
    if (minK) return `${minK}+`;
  } else {
    // UK and others — GBP
    const minK = salaryMin ? `£${Math.round(salaryMin / 1000)}K` : null;
    const maxK = salaryMax ? `£${Math.round(salaryMax / 1000)}K` : null;
    if (minK && maxK) return `${minK} – ${maxK}`;
    if (minK) return `${minK}+`;
  }
  return null;
}

/**
 * Strip HTML tags from Adzuna descriptions (they sometimes include <b>, <li>).
 * Also truncates to 350 chars for consistent card display.
 */
function cleanDescription(raw) {
  if (!raw) return "";
  return raw
    .replace(/<[^>]+>/g, " ")    // Remove HTML tags
    .replace(/\s+/g, " ")         // Collapse whitespace
    .trim()
    .substring(0, 350);
}

/**
 * Normalize a raw Adzuna API result object into our unified Job shape.
 * Every service (Adzuna, JSearch, RemoteOK) must output this same shape
 * so jobAggregator.js can merge them without knowing the source.
 *
 * Unified Job shape:
 * {
 *   id:          string   — unique, prefixed with source name
 *   title:       string
 *   company:     string
 *   location:    string
 *   salary:      string | null
 *   description: string   — plain text, max ~350 chars
 *   url:         string   — direct apply/view link on source site
 *   source:      string   — "Adzuna"
 *   sourceIcon:  string   — emoji
 *   postedAt:    string   — ISO date string
 *   tags:        string[] — category/skill tags
 *   isRemote:    boolean
 * }
 */
function normalizeJob(raw, countryCode) {
  const location = raw.location?.display_name || "Location not specified";
  const isRemote =
    location.toLowerCase().includes("remote") ||
    raw.title?.toLowerCase().includes("remote");

  return {
    id: `adzuna-${raw.id}`,
    title: raw.title || "Untitled Position",
    company: raw.company?.display_name || "Company not listed",
    location: location,
    salary: formatSalary(raw.salary_min, raw.salary_max, countryCode),
    description: cleanDescription(raw.description),
    url: raw.redirect_url,
    source: "Adzuna",
    sourceIcon: "🔷",
    postedAt: raw.created || new Date().toISOString(),
    tags: raw.category?.label ? [raw.category.label] : [],
    isRemote,
  };
}

/**
 * fetchAdzunaJobs — The main exported function.
 *
 * Makes a GET request to the Adzuna API, normalizes all results, and
 * returns them as an array of unified Job objects.
 *
 * If credentials are missing, logs a warning and returns [] rather than
 * throwing — this lets jobAggregator continue with the other two sources.
 *
 * If the API call fails (network, 4xx, 5xx), also returns [] gracefully.
 *
 * @param {string} query    — search keywords (e.g. "react developer")
 * @param {string} location — location string (e.g. "India", "Mumbai")
 * @param {number} page     — page number (1-indexed), default 1
 * @returns {Promise<NormalizedJob[]>}
 */
export async function fetchAdzunaJobs(query, location = "India", page = 1) {
  const appId = process.env.ADZUNA_APP_ID;
  const apiKey = process.env.ADZUNA_API_KEY;

  if (!appId || !apiKey) {
    console.warn("[Adzuna] Missing ADZUNA_APP_ID or ADZUNA_API_KEY in .env — skipping");
    return [];
  }

  const countryCode = resolveCountryCode(location);

  // Build query params
  const params = new URLSearchParams({
    app_id: appId,
    app_key: apiKey,
    what: query,                     // Job title / skills keywords
    results_per_page: "15",          // Max allowed on free tier per request
    sort_by: "relevance",            // "relevance" | "date" | "salary"
    content_type: "application/json",
  });

  // Add location filter only when it's a specific city/region, not just "India"
  const locationLower = location.toLowerCase();
  if (locationLower !== "india" && locationLower !== "remote" && locationLower !== "all india") {
    params.append("where", location);
  }

  const url = `https://api.adzuna.com/v1/api/jobs/${countryCode}/search/${page}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "AIJobMatcherPro/1.0",
      },
      signal: AbortSignal.timeout(8000), // 8-second timeout
    });

    if (!response.ok) {
      const text = await response.text();
      console.warn(`[Adzuna] API returned ${response.status}: ${text.substring(0, 200)}`);
      return [];
    }

    const data = await response.json();
    const results = data.results || [];

    console.log(`[Adzuna] Fetched ${results.length} jobs for "${query}" in ${location}`);

    return results.map((job) => normalizeJob(job, countryCode));
  } catch (error) {
    if (error.name === "TimeoutError") {
      console.warn(`[Adzuna] Request timed out for query "${query}"`);
    } else {
      console.warn(`[Adzuna] Fetch failed: ${error.message}`);
    }
    return [];
  }
}

export default { fetchAdzunaJobs };
