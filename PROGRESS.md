# Progress — AI Job Matcher Pro (Industry-Ready Rebuild)

## Status: Not started — about to begin Phase 0

## Done
- [x] Existing MERN app already built (auth, resume upload, ATS scoring v1,
      resume rewriting v1, mock interview v1, job search v1)
- [x] Fixed pre-existing bug in interviewPrepService.js (was using wrong
      Groq SDK call format — client.messages.create instead of
      client.chat.completions.create)
- [x] SPEC.md (industry-ready rebuild spec) added to repo

## In progress
(nothing yet)

## Not started
- Phase 0: Security foundation & cleanup
- Phase 1: Real job data (multi-source, no fake fallback)
- Phase 2: ATS scoring overhaul (rule-based + AI + explainability)
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
- Standing rule for all future work: Antigravity must explain what it
  builds, how it connects to the rest of the system, and why that approach
  was chosen, for every piece of work in every phase (see SPEC.md intro).

## Next step
Begin Phase 0 (Security foundation & cleanup) exactly as scoped in
SPEC.md.
