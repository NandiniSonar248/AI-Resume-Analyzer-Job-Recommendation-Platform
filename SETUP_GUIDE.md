# 🚀 Complete Setup Guide - AI Job Matcher Pro

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [MongoDB Setup](#mongodb-setup)
3. [Groq API Setup](#groq-api-setup)
4. [Gmail Setup (Optional)](#gmail-setup-optional)
5. [Backend Setup](#backend-setup)
6. [Frontend Setup](#frontend-setup)
7. [Running the Application](#running-the-application)
8. [Testing the Features](#testing-the-features)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Make sure you have the following installed:

### 1. Node.js & npm
Check if installed:
```bash
node --version   # Should be v16 or higher
npm --version    # Should be v8 or higher
```

If not installed:
- **Windows/Mac**: Download from [nodejs.org](https://nodejs.org/)
- **Linux (Ubuntu/Debian)**:
  ```bash
  sudo apt update
  sudo apt install nodejs npm
  ```

### 2. MongoDB
You have two options:

**Option A: Local MongoDB** (Recommended for development)
- **Windows**: Download from [mongodb.com](https://www.mongodb.com/try/download/community)
- **Mac**: 
  ```bash
  brew tap mongodb/brew
  brew install mongodb-community
  brew services start mongodb-community
  ```
- **Linux**:
  ```bash
  sudo apt-get install -y mongodb
  sudo systemctl start mongodb
  ```

**Option B: MongoDB Cloud (Atlas)**
- Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Sign up (free tier available)
- Create a cluster
- Get connection string (looks like: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`)

### 3. Git (Optional, for version control)
```bash
git --version
# If not installed, download from https://git-scm.com/
```

---

## MongoDB Setup

### Local MongoDB

**Windows:**
1. Install MongoDB Community Server from the website
2. MongoDB should start automatically as a service
3. Verify it's running: Open terminal and run `mongod`

**macOS:**
```bash
# Start MongoDB
brew services start mongodb-community

# Verify it's running
mongo --version
```

**Linux:**
```bash
# Start MongoDB
sudo systemctl start mongodb

# Verify it's running
mongo --eval "db.version()"
```

### MongoDB Cloud (Atlas)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Create an account"
3. Fill in your details and sign up
4. Create a new project
5. Create a cluster (free tier is fine)
6. Under "Security" → "Database Access", create a user:
   - Username: `jobmatcher`
   - Password: `YourSecurePassword123`
   - Remember these credentials!
7. Under "Network Access", add your IP (or allow 0.0.0.0/0 for development)
8. Click "Connect" on your cluster
9. Choose "Connect your application"
10. Copy the connection string
11. Replace `<username>`, `<password>`, and `<dbname>`

---

## Groq API Setup

1. Go to [Groq Console](https://console.groq.com/)
2. Sign up with email (FREE - no credit card needed!)
3. Verify your email
4. Go to "API Keys" section
5. Click "Create API Key"
6. Copy the key (starts with `gsk_`)
7. Store it safely - you'll need it in `.env`

---

## Gmail Setup (Optional)

For email verification and password reset features:

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Click "Security" in the left sidebar
3. Enable "2-Step Verification" if not already enabled
4. Go to "App passwords" (only appears after 2FA is on)
5. Select: App: "Mail", Device: "Windows/Mac/Linux"
6. Google will generate a 16-character password
7. Copy this password (you'll use it in `.env`, not your regular password)

---

## Backend Setup

### Step 1: Navigate to Server Directory

```bash
cd "Full Stack Development/Ai Job Matcher Project/server"
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs all required packages from `package.json`.

### Step 3: Create Environment File

Copy the example file:

**Windows (Command Prompt):**
```cmd
copy .env.example .env
```

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**Mac/Linux:**
```bash
cp .env.example .env
```

### Step 4: Configure .env File

Open `.env` with your text editor and fill in:

```env
# Server
PORT=5000
NODE_ENV=development

# Database - Choose ONE:
# For Local MongoDB:
MONGO_URI=mongodb://127.0.0.1:27017/ats_ai_db

# OR for MongoDB Atlas (use your connection string):
# MONGO_URI=mongodb+srv://jobmatcher:YourPassword@cluster.mongodb.net/ats_ai_db

# JWT (Generate with: openssl rand -base64 32)
JWT_SECRET=your-generated-secret-here
JWT_EXPIRES_IN=7d

# Groq API Key (Get from https://console.groq.com/keys)
GROQ_API_KEY=gsk_your_api_key_here

# Email Configuration (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-char-app-password
EMAIL_FROM="JobMatch Pro <noreply@jobmatchpro.com>"

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Step 5: Generate JWT Secret (Optional but Recommended)

Instead of a placeholder, generate a secure secret:

**Windows (PowerShell):**
```powershell
# Requires OpenSSL (comes with Git Bash)
openssl rand -base64 32
```

**Mac/Linux:**
```bash
openssl rand -base64 32
```

Copy the generated string and paste it in `JWT_SECRET` in `.env`.

### Step 6: Test MongoDB Connection

```bash
node -e "const mongoose = require('mongoose'); mongoose.connect('mongodb://127.0.0.1:27017/ats_ai_db').then(() => console.log('✅ MongoDB connected!')).catch(err => console.error('❌ Connection failed:', err.message))"
```

You should see `✅ MongoDB connected!`

### Step 7: Start Backend Server

```bash
npm run dev
```

You should see:
```
🚀 Server running on http://localhost:5000
✅ MongoDB connected successfully
```

Keep this terminal open! Your backend is now running.

---

## Frontend Setup

### Step 1: Open New Terminal and Navigate to Client

```bash
cd "Full Stack Development/Ai Job Matcher Project/client"
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Create .env.local (Optional)

```bash
# Windows
echo VITE_API_URL=http://localhost:5000/api > .env.local

# Mac/Linux
echo "VITE_API_URL=http://localhost:5000/api" > .env.local
```

If this doesn't work, create the file manually with contents:
```
VITE_API_URL=http://localhost:5000/api
```

### Step 4: Start Frontend Development Server

```bash
npm run dev
```

You should see:
```
VITE v5.0.8  ready in XXX ms

➜  Local:   http://localhost:5173/
```

---

## Running the Application

### Full Startup Sequence

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
# Shows: 🚀 Server running on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
# Shows: http://localhost:5173/
```

**Step 3: Open in Browser**

Open your browser and go to: `http://localhost:5173`

You should see the JobMatch Pro landing page!

---

## Testing the Features

### Test 1: User Registration with Fake Email (Should Fail Now!)

1. Click "Sign Up"
2. Try to register with `test@tempmail.com` or similar
3. Should see error: "Invalid email domain"
4. Use a real email like `test@gmail.com`
5. Check your email for OTP code

### Test 2: Resume Analysis

1. Login with your account
2. Go to "ATS Analyzer"
3. Upload a resume (any PDF/DOCX/TXT with job-related content)
4. Paste a job description
5. Click "Analyze Resume"
6. You should see:
   - ATS Score (0-100)
   - Matched keywords
   - Missing keywords
   - AI suggestions from Groq

### Test 3: Improved Resume Generation

1. After analysis, click "✨ Get Improved Resume"
2. The system will:
   - Call Groq AI
   - Rewrite your resume
   - Show comparison
3. Download the improved resume
4. Compare with original

### Test 4: Analysis History

1. Go to "History" tab
2. Should see all past analyses
3. Each shows score, date, matched/missing keywords

---

## Troubleshooting

### Backend Won't Start

**Error: "Port 5000 already in use"**
```bash
# Change port in .env
PORT=5001

# Or kill existing process (Mac/Linux)
lsof -i :5000
kill -9 <PID>

# Or (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Error: "MongoDB connection failed"**
- Check if MongoDB is running:
  - Local: Try `mongod` in terminal
  - Cloud: Verify connection string in `.env`
  - Check IP whitelist in MongoDB Atlas

**Error: "GROQ_API_KEY is invalid"**
- Get new key from https://console.groq.com/keys
- Make sure key starts with `gsk_`
- Paste entire key (no extra spaces)

### Frontend Won't Start

**Error: "EADDRINUSE 5173"**
```bash
# Change port
npm run dev -- --port 5174
```

**Error: "Cannot find module"**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

### Email Not Sending

**Check:**
1. EMAIL_USER is a Gmail address
2. EMAIL_PASS is your 16-character app password (not regular password)
3. 2-Step Verification is enabled on your Gmail
4. App password was created for "Mail" app

### AI Suggestions Not Working

**Check:**
1. GROQ_API_KEY is correct (starts with `gsk_`)
2. No quotes around the key in `.env`
3. Key is active at https://console.groq.com/keys
4. API rate limit not exceeded (7000 req/day free tier)

### Resume Upload Failing

**Check:**
1. File size is under 10MB
2. File format is PDF, DOCX, DOC, or TXT
3. File is not corrupted
4. Try a different file

### Can't Login After Registration

**Solutions:**
1. Check spam folder for verification email
2. Click "Resend OTP" if code expired
3. Make sure email was verified (should see "Email verified" message)

### Can't Connect to MongoDB Atlas

**Check:**
1. Connection string in `.env` is correct
2. Username and password have no special characters (or are URL-encoded)
3. IP address is whitelisted (0.0.0.0/0 for development)
4. Database user was created in "Database Access"
5. Cluster status is "Running" (not paused)

---

## Performance Tips

### Speed Up Development

1. **Use SSD**: Development is faster on SSDs
2. **Close unused apps**: Free up RAM
3. **Use npm ci**: Instead of `npm install` (faster)
   ```bash
   npm ci
   ```
4. **Cache node_modules**: Increase disk space

### Database Optimization

1. **Add indexes**: MongoDB automatically indexes `_id`
2. **Use pagination**: For large result sets
3. **Monitor connections**: Check connection pool settings

---

## Next Steps

1. ✅ Application is running
2. Read [README.md](./README.md) for feature overview
3. Read [TECH_STACK.md](./TECH_STACK.md) for technical details
4. Explore the codebase and make customizations
5. Deploy to production (see deployment guides)

---

## Getting Help

If you encounter issues:

1. **Check troubleshooting section above**
2. **Read error messages carefully** - they usually indicate the problem
3. **Check .env file** - most issues are configuration-related
4. **Check terminal output** - look for error stack traces
5. **Google the error** - search "[Error message] + MongoDB/Node.js/React"

---

## Success Checklist

- [ ] Node.js & npm installed
- [ ] MongoDB running (local or Atlas)
- [ ] Groq API key obtained
- [ ] Backend `.env` configured
- [ ] Frontend `.env.local` configured (optional)
- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173
- [ ] Application loads in browser
- [ ] Can register with real email
- [ ] Can upload and analyze resume
- [ ] AI suggestions appear
- [ ] Can generate improved resume

**Once all checked, you're ready to use AI Job Matcher Pro! 🎉**

---

**Last Updated**: 2026-04-18  
**Version**: 1.0
