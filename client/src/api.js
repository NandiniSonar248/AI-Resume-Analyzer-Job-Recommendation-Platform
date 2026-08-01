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

// Track refresh state to prevent concurrent refresh calls
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Handle 401 errors — attempt token refresh before redirecting to login
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't already tried refreshing for this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't try to refresh on auth endpoints themselves
      if (originalRequest.url?.includes("/auth/login") ||
          originalRequest.url?.includes("/auth/register") ||
          originalRequest.url?.includes("/auth/refresh")) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request until the refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        // No refresh token — force login
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        if (!window.location.pathname.includes("/login") &&
            !window.location.pathname.includes("/register")) {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE}/auth/refresh`, {
          refreshToken: refreshToken
        });

        const { token: newToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem("token", newToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        processQueue(null, newToken);

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        if (!window.location.pathname.includes("/login") &&
            !window.location.pathname.includes("/register")) {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
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

export const refreshTokenCall = async (refreshToken) => {
  const response = await api.post("/auth/refresh", { refreshToken });
  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post("/auth/logout");
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

/**
 * matchJobsByResumeText — Auto-matching endpoint for post-upload flow.
 * Sends raw resume text to the server; server extracts skills and returns
 * scored job matches without any user input required.
 */
export const matchJobsByResumeText = async (resumeText, location = "India") => {
  const response = await api.post("/jobs/match-by-resume", { resumeText, location });
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