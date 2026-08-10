import jwt from "jsonwebtoken";
import crypto from "node:crypto";

const JWT_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET || "HODLS_ENTERPRISE_JWT_KEY_2026_!@#$%^&*()_+";
const RATE_LIMIT_STORE = new Map();

/**
 * Sanitize text inputs against XSS and injection
 */
export function clean(input) {
  if (typeof input !== "string") return "";
  return input
    .replace(/[<>]/g, "")
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
    .trim();
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
  return `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

/**
 * Clear Session Cookie Header
 */
export function clearSessionCookie(cookieName) {
  return `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
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
 * In-Memory Sliding-Window Rate Limiter
 */
export function checkRateLimit(key, limit = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const record = RATE_LIMIT_STORE.get(key) || { count: 0, resetAt: now + windowMs };

  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + windowMs;
  }

  record.count += 1;
  RATE_LIMIT_STORE.set(key, record);

  const allowed = record.count <= limit;
  const remaining = Math.max(0, limit - record.count);
  const resetIn = Math.ceil((record.resetAt - now) / 1000);

  return { allowed, remaining, resetIn };
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
