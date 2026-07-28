import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";

// Fail fast if JWT_SECRET is not set
if (!JWT_SECRET) {
  console.error("FATAL: JWT_SECRET environment variable is not set. Server cannot start securely.");
  process.exit(1);
}
/**
 * Generate JWT token
 */
export function generateToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Generate a refresh token (long-lived, 7 days)
 * Used for token rotation — client exchanges this for a new access + refresh token pair.
 */
export function generateRefreshToken(userId) {
  return jwt.sign({ id: userId, type: "refresh" }, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Verify JWT token
 */
export function verifyToken(token, expectedType = null) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (expectedType && decoded.type !== expectedType) {
      return null;
    }
    return decoded;
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
