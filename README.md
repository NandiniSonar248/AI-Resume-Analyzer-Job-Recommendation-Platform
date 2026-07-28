# 🎯 AI Job Matcher Pro - ATS Resume Optimizer

A full-stack MERN application that uses AI to optimize your resume for ATS (Applicant Tracking System) and matches it against job descriptions. Get instant AI-powered feedback on how well your resume aligns with job requirements.

**📚 Documentation:**
- 🚀 **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete step-by-step setup instructions
- 🛠️ **[TECH_STACK.md](./TECH_STACK.md)** - Detailed technology documentation
- 📖 **[README.md](./README.md)** - This file with features and API overview

## ✨ Features

- 🤖 **AI-Powered ATS Analysis** - Real-time resume analysis using Groq's Llama 3 AI
- 📊 **Smart Keyword Matching** - Identifies matched and missing keywords from job descriptions
- ✅ **Instant Improvements** - AI-generated suggestions to improve your resume
- 📝 **Resume Rewriter** - Automatically generates improved resume versions tailored to job descriptions
- 🔐 **Secure Authentication** - Email verification, JWT tokens, and secure password handling
- 👤 **User Profiles** - Save analysis history, access past results
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
- 💾 **Database Integration** - MongoDB for storing user data and analysis history
- 🔒 **Email Validation** - Prevents fake email registration with DNS MX record checking
- 📄 **Multi-Format Support** - Upload PDF, DOCX, DOC, or TXT files

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library for building interactive interfaces
- **Vite 5** - Modern frontend build tool for fast development
- **React Router 6** - Client-side routing
- **Axios** - HTTP client for API requests
- **React Hot Toast** - Toast notifications
- **CSS3** - Modern responsive styling with CSS variables and flexbox

### Backend
- **Node.js & Express 4** - Server runtime and web framework
- **MongoDB 8** - NoSQL database for data persistence
- **Mongoose** - MongoDB ODM for schema validation
- **Groq AI API** - Llama 3 LLM for AI suggestions
- **JWT (jsonwebtoken)** - Authentication tokens
- **Bcryptjs** - Password hashing
- **Multer** - File upload handling
- **pdf-parse** - PDF file parsing
- **Mammoth** - DOCX file parsing
- **Nodemailer** - Email sending (verification, password reset)
- **Natural** - NLP library for text processing
- **Winston** - Logging with security
- **Helmet** - Security headers
- **CORS** - Cross-Origin Resource Sharing
- **Rate Limiting** - Prevent abuse

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js 16+** - [Download](https://nodejs.org/)
- **MongoDB** - [Local](https://docs.mongodb.com/manual/installation/) or [Cloud](https://www.mongodb.com/cloud/atlas)
- **Groq API Key** - [Get Free Key](https://console.groq.com/keys)
- **Gmail Account** - For email verification (optional, or use other email service)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
cd "Full Stack Development/Ai Job Matcher Project"
```

### 2. Backend Setup

```bash
cd server

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env with your values:
# - MONGO_URI: Your MongoDB connection string
# - GROQ_API_KEY: Your Groq API key
# - EMAIL_USER, EMAIL_PASS: Gmail credentials
# - JWT_SECRET: Generate with: openssl rand -base64 32

# Start backend server
npm run dev
# Server will run on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd ../client

# Install dependencies
npm install

# Create .env.local file (optional)
# VITE_API_URL=http://localhost:5000/api

# Start frontend development server
npm run dev
# Frontend will run on http://localhost:5173
```

### 4. Access the Application

Open your browser and navigate to: **http://localhost:5173**

## 🔧 Environment Variables

### Server (.env)

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://127.0.0.1:27017/ats_ai_db

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Groq AI (Get from https://console.groq.com/keys)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxx

# Email Service
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM="JobMatch Pro <noreply@jobmatchpro.com>"

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Client (.env.local - optional)

```env
VITE_API_URL=http://localhost:5000/api
```

## 📊 How It Works

### 1. **Resume Upload**
   - Upload your resume (PDF, DOCX, DOC, or TXT)
   - Paste a job description
   - System extracts resume text automatically

### 2. **ATS Analysis**
   - Calculates ATS compatibility score (0-100)
   - Identifies matched keywords from job description
   - Lists missing keywords that should be added
   - Provides match percentage

### 3. **AI Suggestions**
   - Uses Groq's Llama 3 AI to generate recommendations
   - Specific advice on what to add/remove
   - Actionable improvements for each section
   - Estimated score improvement

### 4. **Resume Improvement**
   - Click "Get Improved Resume" button
   - AI rewrites your resume to match job requirements
   - Shows what changed in comparison
   - Download improved version as text file

### 5. **Analysis History**
   - All analyses saved to your account
   - Track scores over time
   - Review past recommendations

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/verify-email` - Verify email with OTP
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `PUT /api/auth/change-password` - Change password (authenticated)
- `GET /api/auth/me` - Get current user info

### Resume Analysis
- `POST /api/analyze` - Analyze resume against job description
- `GET /api/analyze/history` - Get user's analysis history
- `DELETE /api/analyze/history/:id` - Delete specific analysis
- `POST /api/resume/rewrite` - Generate improved resume
- `POST /api/resume/compare` - Compare original vs improved resume

### Resume Builder
- `POST /api/resume/optimize` - Optimize resume content
- `POST /api/resume/generate-pdf` - Generate PDF version
- `GET /api/resume/templates` - Get available templates
- `POST /api/resume/analyze-keywords` - Extract keywords from job posting

### Jobs
- `GET /api/jobs/search` - Search for job listings
- `POST /api/jobs/match` - Match jobs with user skills
- `GET /api/jobs/trending` - Get trending jobs

### Health Check
- `GET /api/health` - Server status and database connection

## 🔐 Security Features

- ✅ **Password Hashing** - Bcryptjs with 12 salt rounds
- ✅ **Email Verification** - OTP-based email confirmation
- ✅ **JWT Authentication** - Secure session management
- ✅ **Rate Limiting** - Prevent brute force attacks
- ✅ **Input Validation** - Server-side validation on all inputs
- ✅ **Helmet Security** - Security headers protection
- ✅ **CORS Configuration** - Restrict cross-origin access
- ✅ **Secure Logging** - No sensitive data in logs
- ✅ **Email Validation** - DNS MX record checking for real domains
- ✅ **No Fake Emails** - Blacklist of temporary email services

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Check MONGO_URI in .env file
- Try connecting with MongoDB Compass

### Groq API Not Working
- Verify GROQ_API_KEY is correct
- Check API key is active at https://console.groq.com/keys
- Current supported model: `llama-3.3-70b-versatile`

### Email Verification Not Working
- Check EMAIL_USER and EMAIL_PASS are correct
- For Gmail: Use [App Password](https://myaccount.google.com/apppasswords), not your regular password
- Check spam folder for emails

### Resume Upload Issues
- File size must be less than 10MB
- Supported formats: PDF, DOCX, DOC, TXT
- Ensure file is not corrupted

### Port Already in Use
- Change PORT in .env (default: 5000)
- Or find and kill existing process:
  ```bash
  lsof -i :5000  # Find process
  kill -9 <PID>  # Kill it
  ```

## 📚 Project Structure

```
AI Job Matcher Project/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components (Dashboard, Login, Register, etc.)
│   │   ├── components/    # Reusable components (ResumeForm, ResultPanel)
│   │   ├── context/       # React Context (AuthContext)
│   │   ├── api.js         # API client
│   │   ├── style.css      # Global styles
│   │   └── main.jsx       # Entry point
│   └── package.json
│
├── server/                 # Express backend
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   │   ├── aiService.js            # AI integration
│   │   ├── atsEngine.js            # ATS calculation
│   │   ├── resumeParser.js         # Resume parsing
│   │   ├── resumeRewriterService.js # Resume improvement
│   │   ├── emailValidationService.js # Email validation
│   │   └── emailService.js         # Email sending
│   ├── models/            # MongoDB schemas (User, Analysis, etc.)
│   ├── middleware/        # Auth, error handling
│   ├── utils/             # Helper functions
│   ├── index.js           # Server entry point
│   ├── .env.example       # Environment template
│   └── package.json
│
└── README.md              # This file
```

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙌 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact: support@jobmatchpro.com
- Check the troubleshooting section above

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Additional resume templates
- [ ] Job application tracker
- [ ] LinkedIn profile optimization
- [ ] Interview prep AI assistant
- [ ] Resume version control
- [ ] Team/family account collaboration

## 📊 Tech Stats

- **Build Time**: ~45 minutes
- **Lines of Code**: ~5000+
- **Components**: 15+
- **API Endpoints**: 20+
- **Test Coverage**: Ready for testing

---

**Made with ❤️ using MERN Stack**

Last updated: 2026-04-18
