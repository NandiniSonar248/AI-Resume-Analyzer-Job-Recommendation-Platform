import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import fs from "fs";
import path from "path";
import analyzeRoutes from "./routes/analyzeRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import interviewRoutes from "./routes/interviewRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import { initInterviewSocket } from "./sockets/interviewSocket.js";
import logger from "./utils/logger.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const isDev = process.env.NODE_ENV !== "production";

// Security middleware
// ============================================
// Helmet — Security headers with custom CSP
// ============================================
// WHY custom CSP: Default CSP breaks Google Fonts, React inline styles,
// and WebSocket connections. ws: and wss: are allowed for Socket.io.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
    }
  },
  crossOriginEmbedderPolicy: false,
}));

// ============================================
// Rate Limiting — per-route configuration
// ============================================
// WHY three limiters: Auth routes face brute-force attacks (tight limit),
// AI routes cost Groq API credits (moderate limit), everything else is cheaper.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many authentication attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "AI request limit reached. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false
});

// CORS configuration
app.use(cors({
  origin: isDev ? "*" : process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json({ limit: "10mb" }));

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Clean old uploads on startup
const cleanOldUploads = () => {
  try {
    const files = fs.readdirSync(uploadsDir);
    files.forEach(file => {
      const filePath = path.join(uploadsDir, file);
      fs.unlinkSync(filePath);
    });
    if (files.length > 0) {
      console.log(`Old uploads cleaned`);
    }
  } catch (err) {
    console.warn("Upload cleanup warning");
  }
};
cleanOldUploads();

// MongoDB connection with retry logic
const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ats_ai_db";
  
  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10
    });
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.warn("⚠️ MongoDB connection failed");
    console.log("ℹ️ App will continue without database (history won't be saved");
  }
};

// Handle MongoDB connection events
mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB error");
});

// Root route
app.get("/", (req, res) => {
  res.json({
    name: "AI Job Matcher Pro API",
    version: "2.0.0",
    status: "running",
    endpoints: {
      analyze: "POST /api/analyze - Upload resume and job description for ATS analysis",
      jobs: "GET /api/jobs/search - Search for matching jobs",
      resume: "POST /api/resume/optimize - Generate ATS-optimized resume",
      auth: "POST /api/auth/login - User authentication",
      health: "GET /api/health - Check server status"
    },
    frontend: "http://localhost:5173"
  });
});

// Routes — each with appropriate rate limiter
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/analyze", aiLimiter, analyzeRoutes);
app.use("/api/resume", aiLimiter, resumeRoutes);
app.use("/api/interview", aiLimiter, interviewRoutes);
app.use("/api/chat", aiLimiter, chatRoutes);
app.use("/api/jobs", generalLimiter, jobRoutes);
app.use("/api/applications", generalLimiter, applicationRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error("Server error");
  res.status(500).json({ error: "Internal server error" });
});

// Start server
const startServer = async () => {
  await connectDB();
  
  const server = http.createServer(app);
  initInterviewSocket(server, process.env.FRONTEND_URL || "http://localhost:5173");

  server.listen(PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${PORT}`);
    logger.info(`🎙️ WebSocket ready for live mock interviews`);
    logger.info(`📊 API endpoint: http://localhost:${PORT}/api/analyze`);
    logger.info(`🔐 Auth endpoint: http://localhost:${PORT}/api/auth`);
    console.log(`🚀 Server with Socket.io running on http://localhost:${PORT}`);
  });
};

startServer();