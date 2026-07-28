# AI JOB MATCHER PRO — Industry-Ready Rebuild Spec

> Save this file as `SPEC.md` in your project repo. Paste one phase-prompt at a
> time into Antigravity, in order. Every prompt below includes a standing rule:
> **Antigravity must explain what it builds, how each piece connects to the
> rest of the system, and why that approach was chosen — before or alongside
> writing the code.** Don't skip that explanation when it responds — read it,
> ask follow-up questions if something doesn't make sense, then verify and
> move to the next prompt.

---

## 1. PROJECT VISION

AI Job Matcher Pro becomes a complete, honest, end-to-end career platform:
upload a resume + a job description → get a real, explainable ATS match score
→ get a tailored resume and cover letter → practice a realistic, adaptive,
voice-based mock interview across multiple rounds → discover real, live jobs
from real job portals matched to your actual resume → track applications
through to offer. Built securely, with no fake/demo data anywhere in
production paths.

**Core principle for every feature built below: never fabricate data.**
No fake job listings, no invented resume achievements, no simulated "AI
confidence" without a real signal behind it. If real data isn't available,
show an honest empty state — never synthetic filler dressed up as real.

---

## 2. FINAL FEATURE LIST

1. **Resume ↔ Job Description ATS Match Scoring**
   - Rule-based scoring layer (keyword frequency, required-skills coverage,
     section/formatting parseability) running alongside an AI scoring layer.
   - Weighted sub-scores shown separately (keyword match %, skills coverage,
     experience match, formatting compatibility) — not one opaque number.
   - Sentence-level explainability: highlight resume text green/red with a
     reason on hover, showing exactly what helped or hurt the score.
   - ATS parseability check: flags tables, columns, images, non-standard
     fonts that break real ATS parsers.

2. **AI Resume Tailoring**
   - JD-specific rewrite suggestions, anchored to actual JD requirements.
   - Hard guardrail: AI may only rephrase/reframe what the user already
     wrote — never invents skills, employers, metrics, or experience.
   - Generates a downloadable tailored resume variant per job, with a
     visible disclaimer to human-review before use.

3. **AI Cover Letter Generation**
   - JD-matched, using the same resume + JD context already gathered.

4. **Skill-Gap Learning Roadmap**
   - For each missing required skill, generates a short structured path:
     what it is, a free resource to learn it, a project idea to demonstrate
     it, and how to phrase it on a resume once learned.

5. **Mock Interview — multi-round, adaptive, voice-based**
   - Rounds: HR/Behavioral, Technical (JD-specific), and Coding (if the JD
     is a development role).
   - Adaptive follow-up questions: the next question depends on the
     previous answer, not a fixed pre-generated list.
   - Voice input (Web Speech API SpeechRecognition) and voice output
     (SpeechSynthesis) for a real conversational feel.
   - Speech analytics: filler-word count ("um," "like"), speaking pace
     (words/min), pause pattern — computed from real transcription timing
     data, shown in a post-interview report.
   - End-of-session scoring: overall performance summary, strengths,
     weaknesses, across all rounds.

6. **Real-Time Job Matching (multi-source, real data only)**
   - RemoteOK (free, no key) + Adzuna (free tier, requires signup) +
     JSearch via RapidAPI (aggregates Google for Jobs/LinkedIn/Indeed/
     Glassdoor, free tier) — combined and deduplicated.
   - Matched to the user's resume-extracted skills automatically on upload.
   - "Apply" button redirects to the real job posting on its source site —
     no fake in-platform "one-click apply" (not achievable without portal
     partnerships/APIs that don't exist for this use case; this redirect
     pattern is the same one real aggregators like Indeed/Glassdoor use).
   - No synthetic fallback listings — if real sources return nothing, show
     an honest "no matching live listings found right now" state.
   - Optional: salary range overlay per role/city using Adzuna's salary
     endpoint.

7. **Application Tracker**
   - Kanban board: Applied → Interview → Offer → Rejected, with notes and
     reminder dates, for jobs the user found or was matched with.

8. **Security (end-to-end, applies to every feature above)**
   - Secrets management: no secrets in repo, proper `.env` hygiene.
   - JWT access + refresh tokens with rotation, enforced email
     verification, account lockout after repeated failed logins.
   - Input validation and sanitization on all user text before it reaches
     any LLM prompt (prompt-injection defense).
   - File upload validation by actual content type (not just extension),
     size limits enforced.
   - Rate limiting per-user and per-IP, especially on AI endpoints and auth
     endpoints.
   - HTTPS enforced, secure cookie flags, CORS locked to the real frontend
     origin only.
   - Authorization checks on every route so no user can access another
     user's data by manipulating an ID (IDOR protection).
   - Dependency vulnerability scanning as a routine check.

---

## 3. TECH STACK — and why each piece is used

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Vite | Already your existing stack — fast dev server, component reuse for the new features (interview UI, Kanban board, score breakdown panels). |
| Backend | Node.js + Express | Already your existing stack — no migration cost, mature ecosystem for auth, file handling, rate limiting middleware. |
| Database | MongoDB + Mongoose | Already your existing stack — flexible schema is genuinely useful here since resumes/JDs/interview sessions are naturally document-shaped, not rigidly tabular. |
| AI | Groq API (Llama 3.3 70B) | Already integrated, free tier, fast inference — good fit for real-time interview follow-ups where latency matters (a slow AI response breaks the "real interview" feeling). |
| Voice I/O | Web Speech API (browser-native) | Free, no external service dependency, works directly in Chrome/Edge — matches how you already researched voice for your other project, consistent approach. |
| Real-time transport | Socket.io | Needed for the adaptive interview loop (server needs to push the next question the moment speech-to-text finishes) and for live progress updates during resume analysis — this is what makes the app feel genuinely "real-time" instead of request/response. |
| Job data | RemoteOK (free) + Adzuna (free tier) + JSearch/RapidAPI (free tier) | Combining three real, free-tier sources gives broad, genuinely live coverage without needing paid enterprise job-board partnerships, which aren't realistic to obtain for a student/portfolio project. |
| File parsing | pdf-parse, Mammoth (already in use) | Already integrated and working — no reason to replace. |
| Auth | JWT (jsonwebtoken) + bcrypt (already in use) | Already integrated — this rebuild strengthens the existing implementation (refresh rotation, lockout) rather than replacing it. |
| Security middleware | Helmet, express-rate-limit, express-validator | Industry-standard, lightweight middleware for the exact gaps identified in the security review — no heavy new framework needed. |
| Testing | Jest + Supertest | Standard Node/Express testing stack — needed to legitimately claim "production ready," since the current repo has no tests despite docs claiming otherwise. |
| Containerization | Docker + Docker Compose | Consistent environment for grading/demoing/deploying — matches the pattern from your other project. |
| Deployment | Vercel (frontend) + Railway/Render (backend) + MongoDB Atlas | Free tiers sufficient for a portfolio-grade live demo; gives you a real clickable link for your resume instead of "runs on my laptop." |

---

## 4. FINAL PROJECT STRUCTURE

```
/client
  /src
    /pages         (Dashboard, ResumeAnalysis, MockInterview, JobSearch, ApplicationTracker, Login, Register)
    /components
      /analysis    (ScoreBreakdown, SentenceHighlighter, ParseabilityCheck, SkillGapRoadmap)
      /interview   (InterviewRoom, VoiceControls, RoundSelector, SpeechAnalyticsReport, ScoreSummary)
      /jobs        (JobCard, JobFilterPanel, SalaryOverlay)
      /tracker     (KanbanBoard, ApplicationCard)
    /hooks         (useSpeechRecognition, useSpeechSynthesis, useSocket, useAuth)
    /context
    /api           (axios clients per feature area)
/server
  /routes          (auth, resume, analysis, interview, jobs, tracker, user)
  /services
    /ats           (ruleBasedScorer.js, aiScorer.js, parseabilityChecker.js, explainability.js)
    /resume         (tailoringService.js, coverLetterService.js, skillGapService.js)
    /interview      (interviewOrchestrator.js, questionGenerator.js, speechAnalytics.js, sessionScorer.js)
    /jobs           (remoteOkService.js, adzunaService.js, jSearchService.js, jobAggregator.js)
    /security       (validators.js, sanitizers.js)
  /models          (User, Resume, AnalysisResult, InterviewSession, Application)
  /middleware      (auth, rateLimiter, validator, errorHandler)
  /sockets         (interviewSocket.js — real-time question/answer loop)
  /tests           (auth.test.js, ats.test.js, jobs.test.js)
docker-compose.yml
README.md
SPEC.md
PROGRESS.md
```

---

## 5. BUILD PLAN — phased, in order

- **Phase 0** — Security foundation & cleanup
- **Phase 1** — Real job data (multi-source, honest, no fake fallback)
- **Phase 2** — ATS scoring overhaul (rule-based + AI + explainability + parseability)
- **Phase 3** — Resume tailoring, cover letter, skill-gap roadmap
- **Phase 4** — Mock interview overhaul (multi-round, voice, adaptive, speech analytics)
- **Phase 5** — Application tracker
- **Phase 6** — Full security hardening, tests, Docker, deployment

Each phase below is a ready-to-paste prompt. Verify each phase actually
works (run it, click through it yourself) before sending the next prompt.

---

## PHASE 0 — Security foundation & cleanup

```
This is an existing MERN project being rebuilt for industry readiness. Read
SPEC.md fully first, and read through the existing /client and /server
directories to understand what's already built before changing anything.

IMPORTANT STANDING RULE for this entire project, every phase: as you build
each piece, explain to me in plain language (1) what you just built, (2) how
it connects to the rest of the system (which files call it, what data flows
in and out), and (3) why you chose this specific approach over alternatives.
Do this explanation before or alongside the code, not just a one-line commit
message. I want to actually understand the system as it's built, not just
receive finished files.

Phase 0 tasks:
1. Confirm .env is properly gitignored, and confirm no secrets exist
   anywhere else in the tracked codebase (check git history too if this is
   a git repo already).
2. Add express-rate-limit on auth routes and AI endpoints.
3. Add Helmet with a real (non-default) CSP configuration appropriate for
   this app.
4. Add express-validator input validation + sanitization on every route
   that accepts user text (resume content, job descriptions, interview
   answers) — explain specifically how this defends against prompt
   injection into the Groq calls.
5. Audit file upload handling: validate by actual file content/magic bytes,
   not just extension; enforce size limits.
6. Add JWT refresh token rotation if not already fully correct, and account
   lockout after repeated failed logins.
7. Run npm audit on both /client and /server and report findings.

Explain each of these as you go, per the standing rule above. Commit as
separate, clearly-messaged units. Update PROGRESS.md after each.
```

---

## PHASE 1 — Real job data, multiple sources, no fake fallback

```
Read SPEC.md section 2, feature 6, and section 3 for the job-data tech
choices. Follow the standing explain-as-you-go rule from Phase 0 throughout.

1. Set up Adzuna API credentials (guide me through getting a free API key
   if I don't have one) and wire it into a real adzunaService.js.
2. Set up JSearch via RapidAPI similarly (guide me through the free tier
   signup) and build jSearchService.js.
3. Build jobAggregator.js that calls RemoteOK + Adzuna + JSearch in
   parallel, deduplicates results (explain your dedup strategy), and
   returns a unified job list.
4. DELETE the existing fake/generated job fallback function entirely — do
   not keep it as a "just in case" path. If all three real sources return
   nothing, the API should return an honest empty result, and the frontend
   should show a clear "no live listings found for this search right now"
   state — never synthetic data.
5. Wire automatic job matching to trigger right after resume upload,
   using the resume's extracted skills, showing results on the dashboard
   without the user needing a separate manual search.
6. Update the "Apply" button to open the real source-site URL in a new
   tab — explain why in-platform application submission isn't realistically
   buildable here (no API access from LinkedIn/Indeed/Naukri for this).

After building, actually run a search and show me real results with their
real source URLs so I can verify these are genuine live postings, not
placeholders.

Commit as separate units per source integration. Update PROGRESS.md.
```

---

## PHASE 2 — ATS scoring overhaul

```
Read SPEC.md section 2, feature 1. Follow the standing explain-as-you-go
rule.

1. Build ruleBasedScorer.js: keyword frequency matching against the JD,
   required-skills coverage percentage, and experience-level matching —
   explain the exact scoring formula you use for each sub-score.
2. Build parseabilityChecker.js: detect tables, multi-column layouts,
   embedded images, and non-standard fonts in the uploaded resume file
   that would break a real ATS parser. Explain how you're detecting each
   of these from a PDF/DOCX file structurally.
3. Keep the existing AI-based scoring (Groq) as a second, separate layer —
   don't merge it into one number. Show both the rule-based breakdown and
   the AI qualitative assessment side by side.
4. Build explainability.js + a frontend SentenceHighlighter component:
   highlight resume sentences that helped the score in green and ones
   that hurt it in red, with a hover tooltip explaining why. Explain how
   you're mapping AI/rule-based findings back to specific sentence spans
   in the original resume text.
5. Update the frontend ResumeAnalysis page to show: overall score, the
   4 weighted sub-scores individually, the parseability check results,
   and the sentence-level explainability view.

Test with a real resume + JD pair and walk me through the actual score
breakdown output before committing.

Commit as separate units. Update PROGRESS.md.
```

---

## PHASE 3 — Resume tailoring, cover letter, skill-gap roadmap

```
Read SPEC.md section 2, features 2-4. Follow the standing explain-as-you-go
rule.

1. Build tailoringService.js: generates a JD-tailored resume rewrite.
   CRITICAL: implement and explain the exact guardrail prompt/logic that
   prevents the AI from inventing skills, employers, metrics, or
   experience the user didn't already provide — this must only rephrase
   and reframe existing content.
2. Add a downloadable tailored resume export (PDF or DOCX), with a visible
   disclaimer telling the user to review it before use.
3. Build coverLetterService.js: JD-matched cover letter generation reusing
   the resume + JD context already gathered elsewhere in the app.
4. Build skillGapService.js: for each required JD skill missing from the
   resume, generate a short structured learning path (what it is, one free
   resource, one project idea, how to phrase it once learned).
5. Wire all three into a new section of the ResumeAnalysis page.

Test each with a real resume + JD pair and show me actual output before
committing — specifically show me a case where the guardrail correctly
refuses to fabricate an experience the resume doesn't support.

Commit as separate units. Update PROGRESS.md.
```

---

## PHASE 4 — Mock interview overhaul (the core differentiator)

```
Read SPEC.md section 2, feature 5, and section 3 for why Socket.io is used
here specifically. Follow the standing explain-as-you-go rule closely —
this is the most complex phase, I want to understand the real-time
architecture as it's built, not just see it appear.

1. Set up Socket.io on the backend and connect it to the frontend. Explain
   how the socket connection lifecycle works alongside the existing REST
   API — what stays REST, what becomes socket-based, and why.
2. Build interviewOrchestrator.js: manages a stateful interview session
   across rounds (HR/Behavioral, Technical, Coding-if-applicable), tracking
   conversation history per session.
3. Build questionGenerator.js: generates the NEXT question dynamically
   based on the previous answer (not a pre-generated fixed list) — explain
   how you're feeding conversation history into the prompt to make this
   adaptive.
4. Frontend: build the InterviewRoom component with voice input
   (SpeechRecognition) and voice output (SpeechSynthesis) using the
   useSpeechRecognition/useSpeechSynthesis hooks — explain the real-time
   flow: user speaks -> transcribed -> sent via socket -> next question
   generated -> spoken back.
5. Build speechAnalytics.js: from the Web Speech API's transcription and
   timing data, compute filler-word count, speaking pace (words/min), and
   pause patterns. Explain exactly what timing data the API provides and
   how you're deriving these metrics from it.
6. Build sessionScorer.js: end-of-session summary combining round-by-round
   performance and the speech analytics into one report.
7. Build the RoundSelector and SpeechAnalyticsReport frontend components.

This is a big phase — after each of the 7 steps, pause, show me it working,
and let me confirm before continuing to the next step within this phase.

Commit as separate units per step. Update PROGRESS.md after each.
```

---

## PHASE 5 — Application tracker

```
Read SPEC.md section 2, feature 7. Follow the standing explain-as-you-go
rule.

1. Build the Application model (job details, status, notes, reminder date,
   linked to the user).
2. Build backend routes for creating/updating/deleting tracked
   applications, with proper authorization (a user can only see/edit their
   own — explain how you're preventing IDOR here specifically).
3. Add a "Track this application" action on job cards (from Phase 1's job
   search results) and on manually-added entries.
4. Build the KanbanBoard frontend component: Applied -> Interview ->
   Offer -> Rejected columns, drag-and-drop status updates, notes and
   reminder date per card.

Test by tracking a real job through a few status changes.

Commit as separate units. Update PROGRESS.md.
```

---

## PHASE 6 — Full security hardening, tests, Docker, deployment

```
Read SPEC.md section 2, feature 8 in full, and section 3 for the testing/
deployment stack choices. Follow the standing explain-as-you-go rule.

1. Full security pass: re-verify every item in SPEC.md section 2 feature 8
   against the CURRENT state of the app (not just Phase 0's baseline,
   since Phases 1-5 added new routes/data flows that need the same
   protections). Report explicitly what's covered and what's still a gap.
2. Add Jest + Supertest tests: at minimum, auth flow, ATS scoring
   endpoint, job aggregation endpoint, and interview session creation —
   explain what each test actually verifies.
3. Add/update Dockerfiles for client and server, and docker-compose.yml
   including MongoDB.
4. Confirm the full stack boots with docker-compose up and walk me through
   testing it end to end: register, upload resume + JD, see ATS score,
   see real job matches, run a mock interview round, track an application.
5. Prepare deployment: guide me through deploying client to Vercel, server
   to Railway or Render, and database to MongoDB Atlas — explain what
   environment variables need to be set on each platform and why.
6. Finalize README.md with full setup instructions, and clean up the
   existing 14 root-level markdown docs into one consolidated README.

Commit as separate units. Update PROGRESS.md to mark the project complete,
with a full summary of what was built across all 6 phases.
```

---

## 6. IF YOU HIT A USAGE LIMIT MID-PHASE

Send: *"Stop here. Commit everything working right now, update PROGRESS.md
with exactly what's done and what's next, don't start anything new."*

Resume in a fresh session with: *"Ongoing project. Read SPEC.md and
PROGRESS.md, verify PROGRESS.md against the actual code, then continue from
the 'Next step' listed — and keep following the explain-as-you-go standing
rule from SPEC.md for everything from here on."*
