import { AdminSessionModel } from "../models/AdminSessionModel.js";
import { ApplicationModel } from "../models/ApplicationModel.js";
import { json, clean, validateSessionCookie } from "../utils/security.js";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  if (url && key) return createClient(url.trim(), key.trim());
  return null;
}

// In-Memory Settings Cache / Fallback
let MEMORY_SETTINGS = {
  academicYear: "2026 / 2027",
  academicYearStart: 2026,
  schoolName: "مدرسة الهُدى الرسمية المتميزة للغات",
  schoolPhotos: [
    {
      id: "photo-1",
      title: "المبنى المدرسي والفناء الرئيسي",
      category: "المباني والمرافق",
      imageUrl: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1200&q=80",
      createdAt: new Date().toISOString()
    },
    {
      id: "photo-2",
      title: "معامل الحاسب الآلي والوسائط المتعددة",
      category: "المعامل التكنولوجية",
      imageUrl: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=80",
      createdAt: new Date().toISOString()
    },
    {
      id: "photo-3",
      title: "الملاعب الرياضية ومساحات الأنشطة",
      category: "الأنشطة والملاعب",
      imageUrl: "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80",
      createdAt: new Date().toISOString()
    },
    {
      id: "photo-4",
      title: "المكتبة المركزية وقاعات القراءة والاطلاع",
      category: "المكتبة والأنشطة",
      imageUrl: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80",
      createdAt: new Date().toISOString()
    }
  ]
};

export class AdminController {
  static async login(req) {
    let body;
    try { body = await req.json(); } catch { return json({ success: false, message: "صيغة الطلب غير صالحة." }, 400); }

    const username = clean(body.username);
    const password = clean(body.password);

    if (!username || !password) {
      return json({ success: false, message: "يرجى إدخال اسم المستخدم وكلمة المرور." }, 400);
    }

    const result = await AdminSessionModel.authenticate(req, username, password);
    if (!result.success) {
      return json({ success: false, message: result.message }, result.status);
    }

    return json(
      { success: true, message: "تم تسجيل الدخول بنجاح.", user: result.user },
      200,
      { "set-cookie": result.cookie }
    );
  }

  static async logout(req) {
    const clearHeader = AdminSessionModel.logout();
    return json({ success: true, message: "تم تسجيل الخروج بنجاح." }, 200, { "set-cookie": clearHeader });
  }

  static async me(req) {
    const user = validateSessionCookie(req);
    if (!user) return json({ success: false, authenticated: false, message: "غير مصرح." }, 401);
    return json({ success: true, authenticated: true, user });
  }

  static async stats(req) {
    if (!validateSessionCookie(req)) return json({ success: false, message: "غير مصرح بالوصول." }, 401);
    const stats = await ApplicationModel.getStats();
    return json({ success: true, stats });
  }

  static async listApplications(req) {
    if (!validateSessionCookie(req)) return json({ success: false, message: "غير مصرح بالوصول." }, 401);

    const url = new URL(req.url);
    const search = clean(url.searchParams.get("q"));
    const status = clean(url.searchParams.get("status"));
    const stage = clean(url.searchParams.get("stage"));
    const grade = clean(url.searchParams.get("grade"));

    const items = await ApplicationModel.getAll({ search, status, stage, grade });
    return json({ success: true, count: items.length, items });
  }

  static async updateStatus(req) {
    if (!validateSessionCookie(req)) return json({ success: false, message: "غير مصرح بالوصول." }, 401);

    let body;
    try { body = await req.json(); } catch { return json({ success: false, message: "صيغة الطلب غير صالحة." }, 400); }

    const id = clean(body.id || body.applicationId);
    const status = clean(body.status);
    const adminNotes = clean(body.notes || body.adminNotes);

    if (!id || !status) {
      return json({ success: false, message: "رقم الطلب والحالة الجديدة مطلوبان." }, 400);
    }

    const updated = await ApplicationModel.updateStatus(id, status, adminNotes);
    if (!updated) return json({ success: false, message: "تعذر تحديث حالة الطلب." }, 400);

    return json({ success: true, message: "تم تحديث حالة الطلب بنجاح.", application: updated });
  }

  static async exportData(req) {
    if (!validateSessionCookie(req)) return json({ success: false, message: "غير مصرح بالوصول." }, 401);
    const csvContent = await ApplicationModel.exportCsv();
    return new Response(csvContent, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="applications_${Date.now()}.csv"`,
      },
    });
  }

  // ==========================================
  // SETTINGS & SCHOOL PHOTOS (Vercel)
  // ==========================================
  static async getSettings(req) {
    const supabase = getSupabase();
    if (supabase) {
      const { data } = await supabase.from("school_settings").select("*").eq("id", "current_settings").maybeSingle();
      if (data) {
        return json({
          success: true,
          settings: {
            academicYear: data.academic_year,
            academicYearStart: data.academic_year_start,
            schoolPhotos: data.school_photos || [],
          },
        });
      }
    }
    return json({ success: true, settings: MEMORY_SETTINGS });
  }

  static async updateAcademicYear(req) {
    const user = validateSessionCookie(req);
    if (!user || user.role !== "master_admin") {
      return json({ success: false, message: "صلاحية غير كافية. يتطلب حساب مدير رئيسي." }, 403);
    }

    let body;
    try { body = await req.json(); } catch { return json({ success: false, message: "صيغة غير صالحة." }, 400); }

    const year = clean(body.academicYear);
    if (!year) return json({ success: false, message: "يرجى تحديد العام الدراسي." }, 400);

    const startMatch = year.match(/\b(20\d\d)\b/);
    const yearStart = startMatch ? parseInt(startMatch[1], 10) : 2026;

    MEMORY_SETTINGS.academicYear = year;
    MEMORY_SETTINGS.academicYearStart = yearStart;

    const supabase = getSupabase();
    if (supabase) {
      await supabase.from("school_settings").upsert({
        id: "current_settings",
        academic_year: year,
        academic_year_start: yearStart,
        updated_at: new Date().toISOString(),
      });
    }

    return json({ success: true, message: `تم تحديث وتعميم العام الدراسي إلى (${year}) بنجاح.`, settings: MEMORY_SETTINGS });
  }

  static async addSchoolPhoto(req) {
    const user = validateSessionCookie(req);
    if (!user || user.role !== "master_admin") {
      return json({ success: false, message: "صلاحية غير كافية." }, 403);
    }

    let body;
    try { body = await req.json(); } catch { return json({ success: false, message: "صيغة غير صالحة." }, 400); }

    const title = clean(body.title);
    const category = clean(body.category || "المباني والمرافق");
    const imageUrl = clean(body.imageUrl);

    if (!title || !imageUrl) return json({ success: false, message: "العنوان والرابط مطلوبان." }, 400);

    const newPhoto = { id: `photo-${Date.now()}`, title, category, imageUrl, createdAt: new Date().toISOString() };
    MEMORY_SETTINGS.schoolPhotos.unshift(newPhoto);

    const supabase = getSupabase();
    if (supabase) {
      await supabase.from("school_settings").upsert({
        id: "current_settings",
        school_photos: MEMORY_SETTINGS.schoolPhotos,
        updated_at: new Date().toISOString(),
      });
    }

    return json({ success: true, message: "تمت إضافة الصورة بنجاح.", photo: newPhoto, photos: MEMORY_SETTINGS.schoolPhotos });
  }

  static async deleteSchoolPhoto(req) {
    const user = validateSessionCookie(req);
    if (!user || user.role !== "master_admin") {
      return json({ success: false, message: "صلاحية غير كافية." }, 403);
    }

    let body;
    try { body = await req.json(); } catch { return json({ success: false, message: "صيغة غير صالحة." }, 400); }

    const id = clean(body.id);
    MEMORY_SETTINGS.schoolPhotos = (MEMORY_SETTINGS.schoolPhotos || []).filter((p) => p.id !== id);

    const supabase = getSupabase();
    if (supabase) {
      await supabase.from("school_settings").upsert({
        id: "current_settings",
        school_photos: MEMORY_SETTINGS.schoolPhotos,
        updated_at: new Date().toISOString(),
      });
    }

    return json({ success: true, message: "تم حذف الصورة بنجاح.", photos: MEMORY_SETTINGS.schoolPhotos });
  }

  // ==========================================
  // USERS MANAGEMENT RBAC (Vercel)
  // ==========================================
  static async listUsers(req) {
    const user = validateSessionCookie(req);
    if (!user || user.role !== "master_admin") {
      return json({ success: false, message: "صلاحية غير كافية." }, 403);
    }

    const supabase = getSupabase();
    if (supabase) {
      const { data: users } = await supabase.from("admin_users").select("id, username, full_name, role, status, created_at");
      if (users) {
        return json({
          success: true,
          users: users.map((u) => ({
            id: u.id,
            username: u.username,
            fullName: u.full_name,
            role: u.role,
            status: u.status,
            createdAt: u.created_at,
          })),
        });
      }
    }

    return json({
      success: true,
      users: [
        { id: 1, username: "master", fullName: "المدير العام / Master Admin", role: "master_admin", status: "active", createdAt: new Date().toISOString() },
        { id: 2, username: "admin", fullName: "إدارة التنسيق والقبول", role: "master_admin", status: "active", createdAt: new Date().toISOString() },
        { id: 3, username: "staff1", fullName: "أ/ منى عبد العزيز - لجنة فحص الملفات", role: "staff_admin", status: "active", createdAt: new Date().toISOString() },
      ],
    });
  }

  static async createUser(req) {
    const user = validateSessionCookie(req);
    if (!user || user.role !== "master_admin") {
      return json({ success: false, message: "صلاحية غير كافية." }, 403);
    }

    let body;
    try { body = await req.json(); } catch { return json({ success: false, message: "صيغة غير صالحة." }, 400); }

    const u = clean(body.username).toLowerCase();
    const p = clean(body.password);
    const fullName = clean(body.fullName);
    const role = body.role === "master_admin" ? "master_admin" : "staff_admin";

    if (!u || !p || !fullName) return json({ success: false, message: "جميع الحقول مطلوبة." }, 400);

    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from("admin_users").insert({
        username: u,
        password_hash: bcrypt.hashSync(p, 10),
        full_name: fullName,
        role,
        status: "active",
      });

      if (error) return json({ success: false, message: error.message.includes("unique") ? "اسم المستخدم مسجل مسبقاً." : "فشل إنشاء المستخدم." }, 400);
    }

    return json({ success: true, message: `تم إنشاء المستخدم (${u}) بنجاح وتعيين الصلاحية.` }, 201);
  }

  static async deleteUser(req) {
    const user = validateSessionCookie(req);
    if (!user || user.role !== "master_admin") {
      return json({ success: false, message: "صلاحية غير كافية." }, 403);
    }

    let body;
    try { body = await req.json(); } catch { return json({ success: false, message: "صيغة غير صالحة." }, 400); }

    const target = clean(body.username).toLowerCase();
    if (target === user.username?.toLowerCase()) {
      return json({ success: false, message: "لا يمكنك حذف حسابك الحالي." }, 400);
    }

    const supabase = getSupabase();
    if (supabase) {
      await supabase.from("admin_users").delete().eq("username", target);
    }

    return json({ success: true, message: `تم حذف المستخدم (${target}) بنجاح.` });
  }
}
