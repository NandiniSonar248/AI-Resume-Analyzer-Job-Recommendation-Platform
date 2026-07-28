# ⚡ Quick Reference - AI Job Matcher Pro

## 🚀 5-Minute Quick Start

### Prerequisites
```bash
# Check Node.js & MongoDB
node --version    # v16+
npm --version     # v8+
mongod --version  # or Atlas account
```

### Backend (Terminal 1)
```bash
cd server
cp .env.example .env        # Configure with Groq API key
npm install
npm run dev                  # Runs on http://localhost:5000
```

### Frontend (Terminal 2)
```bash
cd client
npm install
npm run dev                 # Runs on http://localhost:5173
```

### Visit
Open browser: **http://localhost:5173**

---

## 📋 .env Configuration Template

```env
# Database
MONGO_URI=mongodb://127.0.0.1:27017/ats_ai_db

# API Keys
GROQ_API_KEY=gsk_your_key_from_console.groq.com
JWT_SECRET=generate_with_openssl_rand_-base64_32

# Email (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=16_char_app_password_from_myaccount.google.com

# Ports
PORT=5000
FRONTEND_URL=http://localhost:5173
```

---

## 🔑 Getting Required Keys/Credentials

| Service | Where to Get | Free? |
|---------|-------------|-------|
| Groq API | https://console.groq.com/keys | ✅ Yes (7000 req/day) |
| MongoDB | Local: `mongod` or MongoDB Atlas | ✅ Yes (cloud free tier) |
| Gmail | https://myaccount.google.com/apppasswords | ✅ Yes (your account) |
| JWT Secret | `openssl rand -base64 32` | ✅ Yes (generate locally) |

---

## 📁 Key File Locations

```
server/
├── services/
│   ├── emailValidationService.js   ← Email validation (no fake emails)
│   ├── resumeRewriterService.js    ← AI resume improvement
│   ├── aiService.js                ← AI suggestions
│   └── resumeParser.js             ← PDF/DOCX parsing
├── routes/
│   ├── authRoutes.js               ← Registration, login, email verify
│   ├── analyzeRoutes.js            ← Resume analysis
│   └── resumeRoutes.js             ← Resume builder & rewriter
└── .env.example                    ← Copy to .env and configure

client/
├── src/
│   ├── pages/Dashboard.jsx         ← Main application
│   ├── components/
│   │   ├── ResumeForm.jsx          ← Upload & analyze
│   │   └── ResultPanel.jsx         ← Results & improved resume
│   ├── style.css                   ← Global styles
│   └── api.js                      ← API client
```

---

## 🧪 Testing Checklist

- [ ] Can register with real email (gmail.com, outlook.com, etc.)
- [ ] Cannot register with fake email (tempmail.com, etc.) ← NEW FIX
- [ ] Received OTP verification email
- [ ] Can verify email with OTP code (works with copied code)
- [ ] Can login after verification
- [ ] Can upload PDF/DOCX resume
- [ ] Can paste job description
- [ ] Analysis shows ATS score, keywords, AI suggestions
- [ ] "Get Improved Resume" button appears
- [ ] Improved resume generated successfully ← NEW FEATURE
- [ ] Can download improved resume
- [ ] Can see analysis history (if logged in)

---

## 🐛 Common Issues & Quick Fixes

| Problem | Solution |
|---------|----------|
| **Port 5000 in use** | Change PORT in .env, or kill process: `lsof -i :5000` |
| **MongoDB won't connect** | Run `mongod` in separate terminal, or check Atlas credentials |
| **Groq API failing** | Check key at https://console.groq.com/keys, ensure it's active |
| **Email not sending** | Use 16-char app password from Gmail, not regular password |
| **Fake emails still registering** | Restart server, check emailValidationService.js is loaded |
| **OTP verification fails** | Make sure server has latest VerifyEmail.jsx with .trim() calls |
| **Improved resume not generating** | Check if resumeRewriterService.js exists and is imported |
| **npm install fails** | Delete `node_modules`, run `npm cache clean --force`, retry |

---

## 📞 Support Resources

| Need | Resource |
|------|----------|
| **How to set up** | Read [SETUP_GUIDE.md](./SETUP_GUIDE.md) |
| **Tech details** | Read [TECH_STACK.md](./TECH_STACK.md) |
| **Features overview** | Read [README.md](./README.md) |
| **What was changed** | Read [CHANGES_SUMMARY.md](./CHANGES_SUMMARY.md) |
| **Full API docs** | See README.md → API Endpoints section |
| **Troubleshooting** | See README.md → Troubleshooting or SETUP_GUIDE.md |

---

## 🎯 Features Overview

### ✅ What Works Out of the Box

| Feature | Status | Notes |
|---------|--------|-------|
| Resume Upload | ✅ | PDF, DOCX, DOC, TXT (10MB max) |
| Resume Parsing | ✅ | Automatic text extraction |
| ATS Analysis | ✅ | Real-time keyword matching |
| AI Suggestions | ✅ | Uses Groq Llama 3 AI |
| Resume Improvement | ✅ NEW | AI rewrites resume for job |
| User Registration | ✅ | Email verification required |
| Email Validation | ✅ FIXED | Blocks fake email domains |
| OTP Verification | ✅ FIXED | Whitespace handling fixed |
| Analysis History | ✅ | Save past analyses |
| Modern UI | ✅ IMPROVED | Professional design |

---

## 🔐 Security Features

- ✅ Password hashing (bcryptjs, 12 rounds)
- ✅ JWT authentication (7-day tokens)
- ✅ Email verification (OTP codes)
- ✅ Rate limiting (prevent brute force)
- ✅ Input validation (server-side)
- ✅ Email validation (DNS MX records, domain blacklist)
- ✅ No sensitive logging (user data protected)
- ✅ CORS (restrict cross-origin)
- ✅ Helmet (security headers)

---

## 📊 Performance Stats

- **Frontend Build Time**: ~10 seconds
- **Backend Startup Time**: ~3 seconds
- **Resume Analysis Time**: ~2-5 seconds
- **AI Suggestion Time**: ~5-10 seconds (depends on Groq API)
- **Improved Resume Time**: ~10-15 seconds
- **Database Query Time**: <100ms (local)

---

## 🚢 Deployment Ready

Application can be deployed to:
- **Vercel** (frontend)
- **Heroku/Railway** (backend)
- **AWS/GCP/Azure** (both)
- **DigitalOcean** (droplet)
- **Any Node.js host**

See [TECH_STACK.md](./TECH_STACK.md) for deployment details.

---

## 📚 Documentation Files

| File | Purpose | Read If... |
|------|---------|-----------|
| [README.md](./README.md) | Feature overview & API | You want to understand the app |
| [SETUP_GUIDE.md](./SETUP_GUIDE.md) | Step-by-step setup | You're setting up for first time |
| [TECH_STACK.md](./TECH_STACK.md) | Technology details | You want technical deep-dive |
| [CHANGES_SUMMARY.md](./CHANGES_SUMMARY.md) | All changes made | You want to see what was changed |

---

## 💡 Pro Tips

1. **Development**: Keep both terminals open (server & client)
2. **Debugging**: Check browser DevTools Network tab for API calls
3. **Email Testing**: Use Gmail, Outlook, or real domain emails only
4. **Resume Files**: Use real resumes with job-related content for better analysis
5. **Job Description**: Use complete job postings (not just titles)
6. **AI Quality**: Longer, detailed prompts = better AI responses
7. **Database**: Use MongoDB Atlas for cloud, local mongod for dev
8. **Performance**: Close unused apps to free RAM during development
9. **Caching**: npm dependencies cache helps on reinstall
10. **Logging**: Check terminal for detailed error messages

---

## ✨ New Features This Session

### 🆕 Resume Rewriter
- Click "Get Improved Resume" after analysis
- AI rewrites entire resume for job description
- Shows what changed in detailed comparison
- Download improved version

### 🆕 Better AI Suggestions
- Specific action items (not generic advice)
- Exactly what text to add/remove
- Which resume section to modify
- Examples for each recommendation
- Predicted score improvement

### 🆕 Email Validation
- Prevents fake email registration
- Validates against temporary email services
- DNS MX record checking
- Real domain verification

### 🆕 Modern UI
- Professional gradient design
- Card-based layouts
- Smooth animations
- Responsive on all devices
- Better visual hierarchy

---

## 🎓 Learning Resources

- **React**: [react.dev](https://react.dev)
- **Express**: [expressjs.com](https://expressjs.com)
- **MongoDB**: [docs.mongodb.com](https://docs.mongodb.com)
- **Groq AI**: [console.groq.com/docs](https://console.groq.com/docs)
- **This Project**: Check the documentation files above

---

## 📞 Troubleshooting Decision Tree

### Server won't start?
```
→ Check: npm run dev output
  → "Port 5000 in use"? Change PORT in .env
  → "MongoDB error"? Run mongod or check Atlas credentials
  → Module not found? Run npm install
  → Other error? Google the error message
```

### Frontend won't load?
```
→ Check: Browser address bar
  → Wrong URL? Go to http://localhost:5173
  → Page blank? Check DevTools Console (F12) for errors
  → npm error? Delete node_modules, run npm install
```

### Feature not working?
```
→ Check: Browser Network tab (F12)
  → Red X on /api request? Backend issue
  → 200 OK but no data? Frontend issue
  → 401/403? Authentication problem
  → 500 error? Check server terminal output
```

### Can't register?
```
→ Email rejected? Use real email domain (not tempmail.com)
→ No verification email? Check spam, resend OTP
→ Email verified but can't login? Make sure password matches
```

---

## 🎉 You're Ready!

If you can check all items below, you're set:

- ✅ Node.js & npm installed
- ✅ MongoDB running (local or Atlas)
- ✅ Groq API key obtained
- ✅ Backend .env configured
- ✅ npm install completed (both server & client)
- ✅ npm run dev working (server on 5000, client on 5173)
- ✅ Browser shows application
- ✅ Can register with real email
- ✅ AI features working

**You're ready to use AI Job Matcher Pro! 🚀**

---

**Version**: 2.0 with AI Resume Rewriter  
**Last Updated**: 2026-04-18  
**Status**: Production Ready ✅
