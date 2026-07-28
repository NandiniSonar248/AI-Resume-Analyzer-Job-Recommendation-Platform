import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * Generate JWT token
 */
export function generateToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Authentication middleware - protects routes
 * Adds req.user if authenticated
 */
export async function authenticate(req, res, next) {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        error: "Access denied. Please login to continue.",
        code: "NO_TOKEN"
      });
    }

    const token = authHeader.split(" ")[1];
    
    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ 
        error: "Invalid or expired token. Please login again.",
        code: "INVALID_TOKEN"
      });
    }

    // Get user from database
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ 
        error: "User not found. Please login again.",
        code: "USER_NOT_FOUND"
      });
    }

    // Add user to request
    req.user = user;
    next();
  } catch (err) {
    console.error("Auth middleware error");
    return res.status(500).json({
      error: "Authentication failed. Please try again.",
      code: "AUTH_ERROR"
    });
  }
}

/**
 * Optional authentication - doesn't block request if no token
 * Just adds req.user if token is valid
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = verifyToken(token);
      
      if (decoded) {
        const user = await User.findById(decoded.id).select("-password");
        if (user) {
          req.user = user;
        }
      }
    }
    next();
  } catch (err) {
    // Don't fail, just continue without user
    next();
  }
}
