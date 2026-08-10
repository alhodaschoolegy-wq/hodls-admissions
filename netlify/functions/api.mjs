import { ApplicationController } from "./controllers/ApplicationController.mjs";
import { AdminController } from "./controllers/AdminController.mjs";
import { json } from "./utils/security.mjs";

export default async (req) => {
  // Method restrictions
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, POST, OPTIONS",
        "access-control-allow-headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || url.pathname.split("/").pop();

    // 1. Public Application Routes
    if (req.method === "POST" && action === "submitApplication") {
      return await ApplicationController.submit(req);
    }

    if (req.method === "GET" && action === "getApplicationStatus") {
      return await ApplicationController.getStatus(req);
    }

    // 2. Admin Auth Routes
    if (req.method === "POST" && action === "login") {
      return await AdminController.login(req);
    }

    if (req.method === "POST" && action === "logout") {
      return await AdminController.logout(req);
    }

    if (req.method === "GET" && action === "me") {
      return await AdminController.me(req);
    }

    // 3. Admin Protected Routes
    if (req.method === "GET" && action === "stats") {
      return await AdminController.stats(req);
    }

    if (req.method === "GET" && action === "applications") {
      return await AdminController.listApplications(req);
    }

    if (req.method === "POST" && action === "update-status") {
      return await AdminController.updateStatus(req);
    }

    if (req.method === "GET" && action === "export") {
      return await AdminController.exportData(req);
    }

    // Fallback 404
    return json({
      success: false,
      message: "المسار المطلوب غير موجود في النظام.",
    }, 404);
  } catch (err) {
    console.error("🔥 Global API Handler Error:", err);
    return json({
      success: false,
      message: "حدث خطأ داخلي في معالجة الطلب. يرجى إعادة المحاولة لاحقاً.",
    }, 500);
  }
};
