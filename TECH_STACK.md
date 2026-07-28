# 🛠️ Complete Tech Stack Documentation

## Overview

AI Job Matcher Pro is built using the **MERN Stack** (MongoDB, Express, React, Node.js) with AI integration through Groq API and advanced NLP capabilities.

---

## 🖥️ FRONTEND TECHNOLOGIES

### Core Framework
- **React 18.2.0** - JavaScript library for building user interfaces with component-based architecture
  - Provides reactive UI updates
  - Virtual DOM for performance
  - Context API for state management
  - Hooks for component logic

- **Vite 5.0.8** - Next-generation frontend build tool
  - Instant server start with Hot Module Replacement (HMR)
  - Lightning-fast builds using native ES modules
  - Optimized for modern browsers
  - Better developer experience

### Routing
- **React Router DOM 6.30.2** - Client-side routing library
  - Declarative navigation
  - Nested routes support
  - Route guards for protected pages
  - History management

### HTTP Client
- **Axios 1.6.7** - Promise-based HTTP client
  - Request/response interceptors for auth tokens
  - Automatic JSON transformation
  - Timeout handling
  - Error handling with proper status codes

### UI/UX
- **React Hot Toast 2.6.0** - Toast notifications library
  - Non-blocking notifications
  - Multiple toast types (success, error, loading)
  - Customizable styling
  - Auto-dismiss functionality

### Styling
- **CSS3** - Native CSS with modern features
  - CSS Custom Properties (variables) for theming
  - Flexbox and Grid layouts
  - Media queries for responsive design
  - CSS animations and transitions
  - No CSS frameworks dependency (pure CSS)

### Build & Development Tools
- **@vitejs/plugin-react 4.2.1** - Vite plugin for React
  - Automatic JSX transformation
  - Fast refresh for development
  - Optimized production builds

---

## ⚙️ BACKEND TECHNOLOGIES

### Runtime & Framework
- **Node.js 16+** - JavaScript runtime environment
  - Event-driven, non-blocking I/O
  - NPM ecosystem
  - Production-ready

- **Express 4.19.2** - Minimal and flexible web application framework
  - Lightweight routing
  - Middleware support
  - Error handling
  - Static file serving

### Database
- **MongoDB 8.3.1** - NoSQL document database
  - Flexible schema
  - Horizontal scalability
  - Real-time data analysis
  - JSON-like document format (BSON)

- **Mongoose 8.3.1** - MongoDB Object Modeling
  - Schema validation
  - Middleware hooks (pre/post)
  - Query builders
  - Virtual properties
  - Relationship modeling

### Authentication & Security
- **jsonwebtoken 9.0.2** - JWT implementation
  - Stateless authentication
  - Token generation and verification
  - Expiration handling
  - Payload encoding

- **bcryptjs 2.4.3** - Password hashing library
  - Salting and hashing (12 rounds)
  - Compare encrypted passwords
  - Prevents rainbow table attacks

- **Helmet 7.1.0** - Security middleware
  - Sets security HTTP headers
  - Protects against common attacks
  - HSTS, CSP, XSS Protection, etc.

- **express-validator 7.0.1** - Input validation middleware
  - Schema validation
  - Sanitization
  - Custom validators
  - Error messages

### File Handling
- **Multer 1.4.5-lts.1** - File upload middleware
  - Multi-part form data handling
  - File size limitations
  - Disk storage configuration
  - File filtering

- **pdf-parse 1.1.1** - PDF text extraction
  - PDF file parsing
  - Text extraction
  - Metadata reading
  - Works with file buffers

- **Mammoth 1.6.0** - DOCX file parser
  - Word document text extraction
  - Formatting preservation
  - Styling conversion
  - Image extraction

### NLP & AI
- **Natural 6.10.0** - Node.js NLP library
  - Tokenization
  - Stemming
  - Classification
  - TF-IDF calculations
  - Keyword extraction

- **Groq SDK 0.3.3** - Groq AI API integration
  - Access to Llama 3.3 70B model
  - Fast inference
  - Streaming support
  - Low latency

### Email
- **Nodemailer 6.10.1** - Email sending library
  - SMTP support
  - Multiple transports
  - Template support
  - Attachment handling
  - Authentication providers (Gmail, etc.)

### Utilities
- **dotenv 16.4.5** - Environment variable management
  - Load .env files
  - Type coercion
  - Parsing support

- **cors 2.8.5** - Cross-Origin Resource Sharing
  - Allow specific origins
  - Credential handling
  - Preflight request management
  - Method and header configuration

- **express-rate-limit 7.1.5** - Rate limiting middleware
  - IP-based limiting
  - Custom key generators
  - Store backends (memory, Redis, etc.)
  - Skip conditions

- **Winston 3.11.0** - Logging library
  - Multiple transports
  - Log levels
  - Metadata logging
  - Custom formatters
  - Security-focused (no sensitive data)

---

## 🔌 EXTERNAL APIs & SERVICES

### AI/ML
- **Groq API** (FREE)
  - Model: `llama-3.3-70b-versatile`
  - 7000 req/day free tier
  - Used for: Resume suggestions, resume rewriting, keyword analysis
  - [Get API Key](https://console.groq.com/keys)

### Email Service
- **Gmail SMTP** (optional)
  - Email verification
  - Password reset
  - Requires App Password (not regular password)
  - [Setup Guide](https://myaccount.google.com/apppasswords)

### Database
- **MongoDB Cloud (Atlas)** (optional)
  - Cloud hosting for MongoDB
  - Automatic backups
  - Built-in monitoring
  - Free tier available

---

## 🏗️ ARCHITECTURE

### Frontend Architecture
```
Components Hierarchy:
├── App (Router)
├── AuthContext (Global Auth State)
├── Dashboard (Main Layout)
│   ├── ResumeForm (Input)
│   ├── ResultPanel (Results + Improvements)
│   ├── JobsPage
│   ├── ResumeBuilder
│   └── History
└── Auth Pages (Login, Register, Verify)
```

### Backend Architecture
```
HTTP Request Flow:
Request → Express Server
    ↓
CORS/Rate Limit Middleware
    ↓
Route Handlers
    ↓
Validation Middleware
    ↓
Business Logic (Services)
    ↓
Database (MongoDB/Mongoose)
    ↓
API Response
```

### Data Flow
```
User Resume Upload
    ↓
Multer Handles File
    ↓
File Parsing (PDF/DOCX/TXT)
    ↓
Resume Text Extraction
    ↓
ATS Calculation & Analysis
    ↓
Groq AI Suggestions
    ↓
Save to MongoDB
    ↓
Return Results to Frontend
    ↓
Display in React Component
```

---

## 📊 KEY FEATURES & THEIR TECH

| Feature | Technology Used |
|---------|-----------------|
| File Upload | Multer |
| PDF Parsing | pdf-parse |
| DOCX Parsing | Mammoth |
| Resume Analysis | Natural (NLP) |
| ATS Scoring | Custom Algorithm + NLP |
| AI Suggestions | Groq API (Llama 3) |
| Resume Rewriting | Groq API (Llama 3) |
| Email Verification | Nodemailer + JWT |
| Authentication | JWT + bcryptjs |
| Database Storage | MongoDB + Mongoose |
| Real-time UI | React + Axios |
| Styling | CSS3 + Responsive Design |
| Security | Helmet + Express Validator |
| Rate Limiting | express-rate-limit |
| Logging | Winston |

---

## 🔄 Request/Response Cycle Example

### Resume Analysis Request
```javascript
// Frontend
const formData = new FormData();
formData.append("resume", pdfFile);
formData.append("jobDescription", "Senior React Developer...");
axios.post("/api/analyze", formData)

// Backend
1. Multer extracts file
2. pdf-parse extracts text
3. calculateATS() scores resume
4. generateAISuggestions() calls Groq API
5. Analysis.create() saves to MongoDB
6. Response sent with results + resumeText + jobDescription

// Frontend
ResultPanel receives data
Shows score, keywords, suggestions
Button available to generate improved resume
```

### Improved Resume Generation
```javascript
// Frontend
axios.post("/api/resume/rewrite", {
  resumeText: "...",
  jobDescription: "..."
})

// Backend
1. rewriteResumeForJob() calls Groq API with prompt
2. AI returns improved resume text
3. getResumeChangeSummary() generates comparison
4. Both returned to frontend

// Frontend
Display improved resume
Show change summary
Offer download button
```

---

## 📦 Dependencies Summary

### Frontend (4 main packages)
- react, react-dom
- react-router-dom
- axios
- react-hot-toast

### Backend (13 main packages)
- express, cors
- mongoose, mongodb
- jsonwebtoken, bcryptjs
- multer, mammoth, pdf-parse
- groq-sdk
- nodemailer
- natural
- winston, helmet, express-validator, express-rate-limit
- dotenv

### Total: ~17 production dependencies

---

## 🚀 Performance Optimizations

### Frontend
- Vite for instant HMR and fast builds
- React.memo for component optimization
- Code splitting via React Router
- CSS variables for efficient theming
- Async loading of routes

### Backend
- Database indexing on frequently queried fields
- Rate limiting to prevent abuse
- File upload cleanup
- Request timeouts
- Middleware optimization
- Connection pooling for MongoDB

---

## 🔐 Security Implementation

### Passwords
- Hashed with bcryptjs (12 salt rounds)
- Never stored in plain text
- Compared securely

### Authentication
- JWT tokens with 7-day expiration
- HttpOnly cookie storage (for future)
- Token refresh mechanism

### Input Validation
- Express-validator on all inputs
- Server-side validation (never trust client)
- Sanitization of input strings

### Data Protection
- CORS enabled with specific origins
- Helmet for security headers
- No sensitive data in logs
- Email validation with DNS MX records

---

## 🔄 CI/CD & Deployment Ready

The application is structured for easy deployment to:
- **Heroku** (with Procfile)
- **Vercel** (frontend)
- **Railway** (backend)
- **AWS/Google Cloud** (Docker ready)
- **DigitalOcean** (any Node.js host)

---

## 📈 Scalability Considerations

1. **Database**: MongoDB Atlas supports horizontal scaling
2. **API**: Express can run on multiple processes (PM2)
3. **File Storage**: Can migrate to S3/Cloud Storage
4. **Caching**: Redis integration ready (express-rate-limit supports it)
5. **Load Balancing**: Stateless JWT auth supports load balancers
6. **CDN**: Frontend can be served from any CDN

---

## 🧪 Testing Setup Ready

Infrastructure supports:
- Jest for unit testing
- React Testing Library for component tests
- Supertest for API testing
- Mock data with factories

---

**Last Updated**: 2026-04-18  
**Stack Version**: MERN 2.0 with Groq AI Integration
