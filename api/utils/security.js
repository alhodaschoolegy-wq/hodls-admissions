import jwt from "jsonwebtoken";
import sanitizeHtml from "sanitize-html";
import { Redis } from "@upstash/redis";

const JWT_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured");
}

let redis = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

/**
 * Sanitize text inputs against XSS and injection
 */
export function clean(input) {
  if (typeof input !== "string") return "";
  const sanitized = sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
  });
  return sanitized.trim();
}

/**
 * Generate cryptographically signed JWT Token
 */
export function generateJwtToken(payload, expiresIn = "8h") {
  return jwt.sign(payload, JWT_SECRET, {
    algorithm: "HS256",
    expiresIn,
  });
}

/**
 * Verify and decode JWT Token
 */
export function verifyJwtToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
  } catch (err) {
    return null;
  }
}

/**
 * Create secure HttpOnly Cookie with JWT Token
 */
export function makeSessionCookie(cookieName, token, maxAgeSeconds = 28800) {
  const secure = process.env.NODE_ENV === "production" ? "Secure;" : "";
  return `${cookieName}=${token}; Path=/; HttpOnly; ${secure} SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

/**
 * Clear Session Cookie Header
 */
export function clearSessionCookie(cookieName) {
  const secure = process.env.NODE_ENV === "production" ? "Secure;" : "";
  return `${cookieName}=; Path=/; HttpOnly; ${secure} SameSite=Lax; Max-Age=0`;
}

/**
 * Validate JWT session from request cookies
 */
export function validateSessionCookie(req, cookieName = "hodls_admin_session") {
  const cookieHeader = req.headers.get ? req.headers.get("cookie") || "" : req.headers.cookie || "";
  const match = cookieHeader.match(new RegExp(`${cookieName}=([^;]+)`));
  if (!match) return null;

  const token = match[1];
  return verifyJwtToken(token);
}

/**
 * Redis-backed Rate Limiter
 */
export async function checkRateLimit(key, limit = 5, windowMs = 15 * 60 * 1000) {
  if (!redis) {
    console.warn("Redis is not configured for rate limiting. Pass UPSTASH_REDIS_REST_URL.");
    return { allowed: true, remaining: limit, resetIn: 0 };
  }

  const now = Date.now();
  const windowKey = `${key}_${Math.floor(now / windowMs)}`;
  
  try {
    const current = await redis.incr(windowKey);
    if (current === 1) {
      await redis.pexpire(windowKey, windowMs);
    }
    
    const allowed = current <= limit;
    const remaining = Math.max(0, limit - current);
    return { allowed, remaining, resetIn: Math.ceil(windowMs / 1000) };
  } catch (err) {
    console.error("Rate limit error:", err);
    return { allowed: true, remaining: limit, resetIn: 0 };
  }
}

/**
 * Extract Client IP address safely
 */
export function getClientIp(req) {
  if (req.headers.get) {
    return (
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1"
    );
  }
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "127.0.0.1";
}

/**
 * Fast JSON Response Helper
 */
export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers,
    },
  });
}
