# Progress — AI Job Matcher Pro (Industry-Ready Rebuild)

## Status: Phase 1 complete, starting Phase 2

## Done
- [x] **Phase 0 (Security foundation):** 
  - Validated `.env`, removed hardcoded JWT fallback
  - Implemented 3-tier rate limiting (auth, AI, general)
  - Configured Helmet with custom CSP
  - Added input validation & LLM prompt injection sanitization (XML delimiters)
  - Added magic-byte file upload validation
  - Implemented JWT refresh token rotation + account lockout logic
  - Cleared major npm audit vulnerabilities
- [x] Existing MERN app already built (auth, resume upload, ATS scoring v1,
      resume rewriting v1, mock interview v1, job search v1)
- [x] Fixed pre-existing bug in interviewPrepService.js (was using wrong
      Groq SDK call format — client.messages.create instead of
      client.chat.completions.create)
- [x] SPEC.md (industry-ready rebuild spec) added to repo

- [x] **Phase 1 (Real job data, multi-source):**
  - Integrated Adzuna API (`adzunaService.js`)
  - Integrated JSearch/RapidAPI (`jSearchService.js`)
  - Built `jobAggregator.js` for parallel fetching, deduplication (by title+company), and relevance ranking
  - Removed `jobSearchService.js` and all synthetic/fake job fallback generation completely
  - Wired auto-matching on resume upload (Dashboard calls `/jobs/match-by-resume` with extracted text)
  - Updated `JobsPage.jsx` UI with source badges, empty states, and standard redirect-to-source Apply buttons

## In progress
- Phase 2: ATS scoring overhaul (rule-based + AI + explainability)

## Not started
- Phase 3: Resume tailoring, cover letter, skill-gap roadmap
- Phase 4: Mock interview overhaul (multi-round, voice, adaptive)
- Phase 5: Application tracker
- Phase 6: Full security hardening, tests, Docker, deployment

## Known issues / notes
- IMPORTANT: server/.env previously contained real, exposed secrets
  (Groq API key, email app password). These should already have been
  rotated. Confirm this was done before Phase 0 auditing begins.
- Current job search feature mixes real data (RemoteOK) with a fabricated
  fallback generator (generateSmartJobSuggestions) — this must be removed
  entirely in Phase 1, not just deprioritized.
- Root of repo currently has ~14 markdown docs (SETUP_GUIDE, SYSTEM_STATUS,
  TECH_STACK, etc.) — to be consolidated into one README in Phase 6.
- **Dependency Resolution (Phase 0 Audit):** The `npm audit fix --force` command upgraded `react-router-dom` to `^7.18.1` to fix the Open Redirect vulnerability (GHSA-wrjc-x8rr-h8h6), but introduced a CSRF vulnerability (GHSA-qwww-vcr4-c8h2, fixed in `8.3.0`). We have intentionally pinned to `7.18.1` because the CSRF exploit requires React Server Components (RSC) and framework routing. Since we exclusively use `<BrowserRouter>` for standard Client-Side Routing, this CSRF vulnerability is unexploitable here. We also upgraded `@vitejs/plugin-react` to the latest version to resolve peer dependency conflicts with `vite@8.1.5`.
- Standing rule for all future work: Antigravity must explain what it
  builds, how it connects to the rest of the system, and why that approach
  was chosen, for every piece of work in every phase (see SPEC.md intro).

## Next step
Begin Phase 2 (ATS scoring overhaul). We need to build `ruleBasedScorer.js` and `parseabilityChecker.js`, keep existing AI scoring as a parallel layer, and build explainability UI (`SentenceHighlighter`).
