/**
 * jobSearchService.js — DEPRECATED AND REPLACED
 * =====================================================================
 * This file has been replaced by the new three-service architecture:
 *   - server/services/adzunaService.js   (Adzuna API client)
 *   - server/services/jSearchService.js  (JSearch/RapidAPI client)
 *   - server/services/jobAggregator.js   (orchestrator — use this)
 *
 * The fake job generator (generateSmartJobSuggestions) that previously
 * lived in this file has been permanently deleted. No code path in the
 * new architecture can generate synthetic job listings.
 *
 * This file exists only as a tombstone. It exports nothing.
 * All imports should be updated to use jobAggregator.js.
 */

// DELETED — do not import from this file.
// Use: import { searchJobs, matchJobsWithResume } from "./jobAggregator.js";
