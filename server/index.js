import express from "express";
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
import logger from "./utils/logger.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const isDev = process.env.NODE_ENV !== "production";

// Security middleware
app.use(helmet()); // Security headers

// Rate limiting - prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 1000 : 100, // Limit each IP (more lenient in dev)
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false
});
app.use("/api/", limiter);

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

// Routes
app.use("/api/analyze", analyzeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/interview", interviewRoutes);

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
  
  app.listen(PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${PORT}`);
    logger.info(`📊 API endpoint: http://localhost:${PORT}/api/analyze`);
    logger.info(`🔐 Auth endpoint: http://localhost:${PORT}/api/auth`);
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

startServer();