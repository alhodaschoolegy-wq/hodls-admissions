import crypto from "node:crypto";

const RATE_LIMIT_CACHE = new Map();
const RATE_LIMIT_CLEANUP_INTERVAL = 60000;
let lastCleanup = Date.now();

export function clean(val) {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

export function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[m]));
}

export function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.trim().length < 16) {
    if (process.env.NODE_ENV === "production") {
      console.warn("⚠️ تحذير أمني: يرجى ضبط SESSION_SECRET قوي في إعدادات Netlify!");
    }
    return secret || "HODLS_SUPER_SECRET_KEY_PROD_2026_DEFAULT_SECURE_TOKEN_#";
  }
  return secret.trim();
}

export function sign(payload, secret = getSessionSecret()) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifySignature(payload, signature, secret = getSessionSecret()) {
  const expected = sign(payload, secret);
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export function makeSessionCookie(cookieName, hoursValid = 8) {
  const expiresAt = Date.now() + 1000 * 60 * 60 * hoursValid;
  const payload = `admin.${expiresAt}`;
  const signature = sign(payload);
  const token = `${payload}.${signature}`;
  return `${cookieName}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${hoursValid * 3600}`;
}

export function clearSessionCookie(cookieName) {
  return `${cookieName}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export function validateSessionCookie(req, cookieName) {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`${cookieName}=([^;]+)`));
  if (!match) return false;

  const parts = match[1].split(".");
  if (parts.length !== 3 || parts[0] !== "admin") return false;

  const payload = parts.slice(0, 2).join(".");
  const expiresAt = Number(parts[1]);
  const signature = parts[2];

  if (Number.isNaN(expiresAt) || expiresAt <= Date.now()) return false;
  return verifySignature(payload, signature);
}

export function checkRateLimit(identifier, maxLimit = 10, windowMs = 60000) {
  const now = Date.now();
  if (now - lastCleanup > RATE_LIMIT_CLEANUP_INTERVAL) {
    for (const [key, record] of RATE_LIMIT_CACHE.entries()) {
      if (now > record.resetTime) {
        RATE_LIMIT_CACHE.delete(key);
      }
    }
    lastCleanup = now;
  }

  const record = RATE_LIMIT_CACHE.get(identifier) || { count: 0, resetTime: now + windowMs };
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
  } else {
    record.count += 1;
  }
  RATE_LIMIT_CACHE.set(identifier, record);

  return {
    allowed: record.count <= maxLimit,
    remaining: Math.max(0, maxLimit - record.count),
    resetIn: Math.ceil((record.resetTime - now) / 1000),
  };
}

export function getClientIp(req) {
  return req.headers.get("x-nf-client-connection-ip") ||
         req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
         "127.0.0.1";
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "x-content-type-options": "nosniff",
      "x-frame-options": "DENY",
      "strict-transport-security": "max-age=31536000; includeSubDomains",
      ...headers,
    },
  });
}
