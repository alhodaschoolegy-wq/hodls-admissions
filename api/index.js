import { ApplicationController } from "./controllers/ApplicationController.js";
import { AdminController } from "./controllers/AdminController.js";
import { validateSessionCookie } from "./utils/security.js";

/**
 * Parse incoming request body safely
 */
function parseBody(req) {
  if (typeof req.body === "object" && req.body !== null) return req.body;
  if (typeof req.body === "string" && req.body.trim()) {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

/**
 * Safe CORS configuration
 */
function handleCors(req, res) {
  const origin = req.headers.origin;
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5000",
    "http://127.0.0.1:5500",
  ];

  if (origin) {
    if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app") || origin.includes("alhodaschool")) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
      res.setHeader("Access-Control-Allow-Origin", "null");
    }
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
}

/**
 * Main Serverless API Entry Point
 */
export default async function handler(req, res) {
  handleCors(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const query = req.query || {};
  const body = parseBody(req);
  const action = query.action || body.action || "stats";

  try {
    const isPost = req.method === "POST";

    // ========================================================
    // 🌐 1. PUBLIC ENDPOINTS
    // ========================================================
    const publicRoutes = {
      getSettings: () => AdminController.getSettings(req, res),
      getApplicationStatus: () => ApplicationController.getStatus(req, res, query),
      submit: () => isPost ? ApplicationController.submit(req, res, body) : null,
      submitApplication: () => isPost ? ApplicationController.submit(req, res, body) : null,
      parentUpdateApplication: () => isPost ? ApplicationController.parentUpdate(req, res, body) : null,
      login: () => isPost ? AdminController.login(req, res, body) : null,
      logout: () => AdminController.logout(req, res)
    };

    if (publicRoutes[action]) {
      const handlerFn = publicRoutes[action]();
      if (handlerFn) return await handlerFn;
    }

    // ========================================================
    // 🔐 2. PROTECTED ADMIN ENDPOINTS
    // ========================================================
    const authUser = validateSessionCookie(req);

    if (action === "me") {
      return await AdminController.me(req, res, authUser);
    }

    if (!authUser) {
      return res.status(401).json({ success: false, message: "انتهت جلسة العمل، يرجى إعادة تسجيل الدخول." });
    }

    const protectedRoutes = {
      changePassword: () => isPost ? AdminController.changePassword(req, res, authUser, body) : null,
      stats: () => ApplicationController.stats(req, res),
      applications: () => ApplicationController.list(req, res),
      updateApplication: () => isPost ? ApplicationController.update(req, res, body) : null,
      updateStatus: () => isPost ? ApplicationController.update(req, res, body) : null,
      "update-status": () => isPost ? ApplicationController.update(req, res, body) : null,
      deleteApplication: () => isPost ? ApplicationController.delete(req, res, body) : null,
      deleteStudent: () => isPost ? ApplicationController.delete(req, res, body) : null,
      export: () => ApplicationController.exportCsv(req, res),
      
      listUsers: () => AdminController.listUsers(req, res, authUser),
      createUser: () => isPost ? AdminController.createUser(req, res, authUser, body) : null,
      deleteUser: () => isPost ? AdminController.deleteUser(req, res, authUser, body) : null,
      resetUserPassword: () => isPost ? AdminController.resetUserPassword(req, res, authUser, body) : null,
      
      updateAcademicYear: () => isPost ? AdminController.updateAcademicYear(req, res, authUser, body) : null,
      updateParentEditSettings: () => isPost ? AdminController.updateParentEditSettings(req, res, authUser, body) : null,
      updateCategoryVisibility: () => isPost ? AdminController.updateCategoryVisibility(req, res, authUser, body) : null,
      addSchoolPhoto: () => isPost ? AdminController.addSchoolPhoto(req, res, authUser, body) : null,
      deleteSchoolPhoto: () => isPost ? AdminController.deleteSchoolPhoto(req, res, authUser, body) : null,
    };

    if (protectedRoutes[action]) {
      const handlerFn = protectedRoutes[action]();
      if (handlerFn) return await handlerFn;
    }

    // Fallback for unknown action
    return res.status(404).json({ success: false, message: `الإجراء المطلوب (${action}) غير معروف أو غير مدعوم بهذه الطريقة.` });

  } catch (err) {
    console.error("API Error:", err);
    return res.status(500).json({
      success: false,
      message: "حدث خطأ غير متوقع أثناء معالجة الطلب.",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
}
