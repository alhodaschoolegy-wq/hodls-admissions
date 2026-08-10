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
 * Main Serverless API Entry Point
 */
export default async function handler(req, res) {
  // 1. CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const query = req.query || {};
  const body = parseBody(req);
  const action = query.action || body.action || "stats";

  try {
    // ========================================================
    // 🌐 1. PUBLIC ENDPOINTS (No Authentication Required)
    // ========================================================
    
    // A. School Settings (Academic Year & Photos)
    if (action === "getSettings") {
      return await AdminController.getSettings(req, res);
    }

    // B. Public Check Application Status
    if (action === "getApplicationStatus") {
      return await ApplicationController.getStatus(req, res, query);
    }

    // C. Submit New Admission Application
    if ((action === "submit" || action === "submitApplication") && req.method === "POST") {
      return await ApplicationController.submit(req, res, body);
    }

    // D. Admin Login
    if (action === "login" && req.method === "POST") {
      return await AdminController.login(req, res, body);
    }

    // E. Admin Logout
    if (action === "logout") {
      return await AdminController.logout(req, res);
    }

    // ========================================================
    // 🔐 2. PROTECTED ADMIN ENDPOINTS (Requires Valid JWT Session)
    // ========================================================
    const authUser = validateSessionCookie(req);

    // Session Check
    if (action === "me") {
      return await AdminController.me(req, res, authUser);
    }

    // Require Auth for remaining endpoints
    if (!authUser) {
      return res.status(401).json({ success: false, message: "انتهت جلسة العمل، يرجى إعادة تسجيل الدخول." });
    }

    // A. Change Personal Password
    if (action === "changePassword" && req.method === "POST") {
      return await AdminController.changePassword(req, res, authUser, body);
    }

    // B. Dashboard KPI Stats
    if (action === "stats") {
      return await ApplicationController.stats(req, res);
    }

    // C. List Applications (Table)
    if (action === "applications") {
      return await ApplicationController.list(req, res);
    }

    // D. Update Application (Status & Full Details)
    if ((action === "updateApplication" || action === "updateStatus" || action === "update-status") && req.method === "POST") {
      return await ApplicationController.update(req, res, body);
    }

    // E. Delete Application
    if ((action === "deleteApplication" || action === "deleteStudent") && req.method === "POST") {
      return await ApplicationController.delete(req, res, body);
    }

    // F. Export CSV
    if (action === "export") {
      return await ApplicationController.exportCsv(req, res);
    }

    // G. User Management (Master Admin)
    if (action === "listUsers") {
      return await AdminController.listUsers(req, res, authUser);
    }
    if (action === "createUser" && req.method === "POST") {
      return await AdminController.createUser(req, res, authUser, body);
    }
    if (action === "deleteUser" && req.method === "POST") {
      return await AdminController.deleteUser(req, res, authUser, body);
    }
    if (action === "resetUserPassword" && req.method === "POST") {
      return await AdminController.resetUserPassword(req, res, authUser, body);
    }

    // H. Settings Management (Master Admin)
    if (action === "updateAcademicYear" && req.method === "POST") {
      return await AdminController.updateAcademicYear(req, res, authUser, body);
    }
    if (action === "addSchoolPhoto" && req.method === "POST") {
      return await AdminController.addSchoolPhoto(req, res, authUser, body);
    }
    if (action === "deleteSchoolPhoto" && req.method === "POST") {
      return await AdminController.deleteSchoolPhoto(req, res, authUser, body);
    }

    // Fallback for unknown action
    return res.status(404).json({ success: false, message: `الإجراء المطلوب (${action}) غير معروف.` });

  } catch (err) {
    console.error("API Serverless Handler Exception:", err);
    return res.status(500).json({
      success: false,
      message: "حدث خطأ غير متوقع في معالجة الطلب.",
      error: err.message,
    });
  }
}
