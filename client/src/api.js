/**
 * API Service
 * ============================================
 * PURPOSE: Centralized API calls to backend
 * 
 * INTERVIEW EXPLANATION:
 * - Uses Axios for HTTP requests
 * - Automatically adds JWT token to headers
 * - Handles 401 errors (token expired)
 * - Uses environment variable for API URL
 * 
 * WHY CENTRALIZED API:
 * - Single place to manage all API calls
 * - Easy to add auth headers
 * - Consistent error handling
 */

import axios from "axios";

// Use environment variable for API URL (Vite uses import.meta.env)
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000, // 30 seconds timeout
});

// Add auth token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors (token expired)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      // Don't reload on login/register pages
      if (!window.location.pathname.includes("/login") && 
          !window.location.pathname.includes("/register")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ============ Resume Analysis ============
export const analyzeResume = async (formData) => {
  const response = await api.post("/analyze", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const getAnalysisHistory = async () => {
  const response = await api.get("/analyze/history");
  return response.data;
};

export const deleteAnalysis = async (id) => {
  const response = await api.delete(`/analyze/history/${id}`);
  return response.data;
};

// ============ Authentication ============
export const loginUser = async (email, password) => {
  const response = await api.post("/auth/login", { email, password });
  return response.data;
};

export const registerUser = async (name, email, password) => {
  const response = await api.post("/auth/register", { name, email, password });
  return response.data;
};

export const verifyEmail = async (email, otp) => {
  const response = await api.post("/auth/verify-email", { email, otp });
  return response.data;
};

export const resendOTP = async (email) => {
  const response = await api.post("/auth/resend-otp", { email });
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

export const resetPassword = async (token, password) => {
  const response = await api.post("/auth/reset-password", { token, password });
  return response.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const response = await api.put("/auth/change-password", { currentPassword, newPassword });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await api.put("/auth/update", data);
  return response.data;
};

export const deleteAccount = async () => {
  const response = await api.delete("/auth/delete-account");
  return response.data;
};

// ============ Job Search ============
export const searchJobs = async (query, location = "India") => {
  const response = await api.get(`/jobs/search?q=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`);
  return response.data;
};

export const matchJobsWithSkills = async (skills, location = "India") => {
  const response = await api.post("/jobs/match", { skills, location });
  return response.data;
};

export const getTrendingJobs = async () => {
  const response = await api.get("/jobs/trending");
  return response.data;
};

// ============ Resume Builder ============
export const optimizeResume = async (userData, jobDescription, keywords) => {
  const response = await api.post("/resume/optimize", { userData, jobDescription, keywords });
  return response.data;
};

export const generatePDFResume = async (resumeData) => {
  const response = await api.post("/resume/generate-pdf", { resumeData }, {
    responseType: "blob"
  });
  return response.data;
};

export const getResumeTemplates = async () => {
  const response = await api.get("/resume/templates");
  return response.data;
};

export const analyzeKeywords = async (jobDescription) => {
  const response = await api.post("/resume/analyze-keywords", { jobDescription });
  return response.data;
};

// ============ Health Check ============
export const checkHealth = async () => {
  const response = await api.get("/health");
  return response.data;
};

export default api;