# 📘 AI Job Matcher Pro — Complete Project Documentation

Welcome to the comprehensive documentation for **AI Job Matcher Pro**. This document details the entire architecture, feature workflows, technical stack, authentication mechanics, and the specific challenges (and solutions) encountered during the rebuild to make it an industry-ready application.

---

## 🛠️ 1. Technology Stack

**Frontend:**
- **React (Vite)**: Lightning-fast development environment and optimized production builds.
- **CSS3 / CSS Variables**: Pure CSS implementation (~6,800+ lines) with zero heavy UI libraries for maximum performance.
- **Web Speech API**: Browser-native Speech-to-Text (STT) and Text-to-Speech (TTS) for the mock interview feature.

**Backend:**
- **Node.js & Express**: Core server framework.
- **Socket.io**: Real-time, bidirectional, event-based communication for voice interviews.
- **Mongoose**: ODM for MongoDB.
- **Node.js Native Test Runner**: Used for the 25-test suite (no Jest/Mocha required).

**Database:**
- **MongoDB**: NoSQL database for storing users, applications, and analysis history.

**AI & External APIs:**
- **Groq API**: Ultra-fast LLM inference (using `qwen/qwen3.8-27b` and `gpt-oss` fallback chains).
- **Adzuna API & RapidAPI (JSearch)**: Live job data aggregation.

**DevOps & Security:**
- **Docker & Docker Compose**: Multi-stage builds and isolated container orchestration.
- **Nginx**: Reverse proxy, SPA routing, and caching for the frontend container.
- **Helmet, express-rate-limit, express-validator**: Enterprise-grade API security.

---

## 🔐 2. Deep Dive: JWT Authentication & Security Flow

The application uses a highly secure **Access + Refresh Token** strategy combined with robust brute-force defenses.

### How the JWT Flow Works
1. **Login (`POST /api/auth/login`)**: 
   - User submits email/password.
   - Server checks the `User` model. If password matches, it generates two JSON Web Tokens (JWTs):
     - **Access Token (Short-lived)**: Expires in 15 minutes. Used to access protected routes.
     - **Refresh Token (Long-lived)**: Expires in 7 days. Used *only* to get a new Access Token.
2. **Making Requests**:
   - The frontend (`client/src/api.js`) attaches the Access Token to the `Authorization: Bearer <token>` header of every request.
   - The backend `authenticate` middleware verifies the token. If valid, `req.user` is populated and the request proceeds.
3. **Silent Refresh (The Interceptor)**:
   - When the 15-minute Access Token expires, the backend returns a `401 Unauthorized` error.
   - Axios interceptors in `api.js` catch this `401` globally *before* the user sees an error.
   - The interceptor automatically makes a background request to `/api/auth/refresh` using the stored Refresh Token.
   - If successful, it saves the new Access Token and **seamlessly retries the original request**. The user never notices the token expired.

### Additional Security Defenses
- **Brute-Force Lockout**: The `User` model tracks `failedLoginAttempts`. After 5 failed attempts, `lockoutUntil` is set to 15 minutes in the future. The `isLocked()` method explicitly blocks logins until the timer expires.
- **Password Hashing**: `bcryptjs` is used in a Mongoose `pre('save')` hook to salt and hash passwords. Plaintext passwords never touch the database.

---

## ⚙️ 3. Core Features & Workflows

### Phase 1: Real-Time Job Aggregation
- **Workflow**: When a user searches for jobs, the backend `jobAggregator.js` makes parallel API calls to Adzuna and RapidAPI (JSearch).
- **Deduplication**: Results from both APIs are merged. The aggregator normalizes titles and company names to remove duplicate postings for the same role.
- **Auto-Matching**: When a resume is uploaded, the frontend automatically calls `/jobs/match-by-resume`, extracting keywords from the resume to instantly fetch live, highly relevant jobs.

### Phase 2: Hybrid ATS Scoring Engine
Instead of just asking an AI "is this resume good?", we built a dual-layer, deterministic scoring engine.
- **Rule-Based Scorer (4-Factor Model)**:
  1. **Skills Coverage (35%)**: Hard match against required tools (React, Node, etc.).
  2. **Keyword Frequency (25%)**: Term-frequency matching using NLP stemmers (`natural` library).
  3. **Experience Alignment (20%)**: Regex extraction of years of experience required vs. candidate's years.
  4. **Parseability (20%)**: Structural check for tables, columns, embedded images, and non-standard fonts.
- **Explainability Engine**: Splits the resume into sentences. Sentences with action verbs + metrics + keywords are highlighted **Green** (Positive ATS Signal). Fluff or vague sentences are highlighted **Red** (Improvement Needed).
- **AI Recruiter Layer**: Runs in parallel to provide a qualitative human-like assessment (Strengths, Weaknesses, Tone).

### Phase 3: AI Resume Tailoring & Career Tools
- **Tailoring Service**: Rewrites resumes to match a specific Job Description. 
- **Cover Letter Generator**: Uses the candidate's actual experience to generate a 3-paragraph letter.
- **Skill Gap Roadmap**: Identifies missing skills and provides a learning path, a free resource link, and a project idea.

### Phase 4: Live Voice Mock Interview
The flagship feature of the app. It simulates a real technical interview.
- **Workflow**:
  1. User joins an `InterviewRoom`. The client connects to the backend via **Socket.io**.
  2. `interviewOrchestrator.js` initializes a state machine (rounds: HR, Technical, Coding).
  3. The backend generates a question using `questionGenerator.js` based on the user's uploaded resume and target job.
  4. The frontend speaks the question aloud using `useSpeechSynthesis`.
  5. The user answers using their microphone (`useSpeechRecognition`).
  6. The backend evaluates the answer, generates a dynamic follow-up, and updates the score.
- **Speech Analytics**: Analyzes WPM (Words Per Minute) and filler words ("um", "like") to grade delivery confidence.
- **Final Report**: After 5-6 turns, `sessionScorer.js` generates a "Hiring Committee Verdict".

### Phase 5: Application Tracker (Kanban)
- **Workflow**: Users click "📌 Track Job" on any job card. This saves it to their personal database.
- **Kanban Board**: An HTML5 Drag-and-Drop board with 5 columns: *Wishlist, Applied, Interviewing, Offer, Rejected*.
- **Security (IDOR Defense)**: Every single CRUD operation strictly filters by `{ _id: documentId, userId: req.user.id }`. This makes Insecure Direct Object Reference (IDOR) attacks mathematically impossible, as an attacker cannot manipulate documents they don't own.

---

## 🚧 4. Limitations Encountered & Solutions Implemented

Building a production-ready AI application requires navigating strict limitations. Here is how we solved them:

### Challenge 1: LLM Hallucinations in Resume Tailoring
* **Limitation**: AI models tend to "hallucinate" or invent experience (e.g., giving a junior dev 10 years of senior experience to match the JD).
* **Solution (The 5-Layer Guardrail)**: We built a robust anti-hallucination system in `tailoringService.js`:
  1. **Strict Persona**: Prompted the AI to act as a strict editor, not an author.
  2. **Prohibited Rules**: Explicitly banned inventing metrics, jobs, or degrees.
  3. **Fact-Anchoring**: Forced the AI to map every generated bullet point to an original claim.
  4. **Disclaimers**: Appended a UI warning that users must review the AI's output.

### Challenge 2: Groq Model Deprecations
* **Limitation**: Free AI models frequently change or get decommissioned (e.g., `llama3-70b-8192` was removed mid-development). Hardcoding a model caused 404 errors.
* **Solution (Fallback Chain)**: Implemented an array of candidate models. If the primary model (`qwen3.8-27b` via `.env`) fails with a `model_not_found` or `404` error, the `try-catch` block gracefully catches the error and retries the request with the next model in the list (`gpt-oss-20b`, etc.).

### Challenge 3: NPM Audit Vulnerabilities
* **Limitation**: Running `npm audit` flagged vulnerabilities in `nodemailer` and `uuid` (via the `natural` NLP library). Running `npm audit fix --force` would downgrade packages and break our modern ES Modules (`"type": "module"`).
* **Solution**: Risk Acceptance and Mitigation. 
  - *Nodemailer* is only used for server-generated emails (verification/reset), meaning untrusted user input never touches the vulnerable address parser. 
  - *Natural* is used purely offline in `ruleBasedScorer.js` for stemming text, with no external network exposure. 

### Challenge 4: Helmet CSP Blocking WebSockets
* **Limitation**: Implementing Helmet for security added a strict Content Security Policy (CSP), which immediately broke the Socket.io mock interview feature (blocked `ws://` connections).
* **Solution**: Overrode the default Helmet CSP config to explicitly allow `'self'` alongside `ws:` and `wss:` protocols in the `connectSrc` directive.

### Challenge 5: File Upload Spoofing
* **Limitation**: Relying on `req.file.mimetype` or file extensions (`.pdf`) allows attackers to upload malicious executables disguised as PDFs (e.g., `virus.exe` renamed to `resume.pdf`).
* **Solution**: Implemented **Magic-Byte Validation** in Phase 0. Before parsing, the server reads the raw binary header of the file buffer (e.g., checking for `%PDF-1.4` or `PK` zip headers for DOCX). If the binary signature doesn't match the extension, the file is rejected immediately.

---

## 🚢 5. DevOps, Testing, & Deployment

### Testing (Node.js Native)
Instead of installing heavy frameworks like Jest, we utilized the built-in `node:test` module.
- **25 automated tests** cover security (IDOR, lockout, magic bytes), ATS scoring math bounds, and deep integration testing of the MongoDB Application Tracker lifecycle.

### Docker Multi-Stage Builds
- **Client**: Uses a multi-stage Dockerfile. Stage 1 installs dependencies and builds the Vite React app. Stage 2 copies *only* the compiled `/dist` folder into a lightweight Nginx Alpine image. The resulting image is incredibly small (~25MB) and fast.
- **Server**: Uses an Alpine Node.js image with `--only=production` to strip out dev dependencies. Employs `dumb-init` as PID 1 to ensure graceful shutdown and signal handling.
- **Nginx Proxy**: The `nginx.conf` acts as a reverse proxy, handling static file caching, SPA fallback routing for React, and routing `/api/*` and `/socket.io/*` directly to the Node container.

---
*Document generated for AI Job Matcher Pro. Stack: MERN + Socket.io + Groq AI.*
