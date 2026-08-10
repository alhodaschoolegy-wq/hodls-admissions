import { AdminSessionModel } from "../models/AdminSessionModel.mjs";
import { ApplicationModel } from "../models/ApplicationModel.mjs";
import { json, clean } from "../utils/security.mjs";

export class AdminController {
  static async login(req) {
    let body;
    try {
      body = await req.json();
    } catch {
      return json({ success: false, message: "صيغة الطلب غير صالحة." }, 400);
    }

    const username = clean(body.username);
    const password = clean(body.password);

    if (!username || !password) {
      return json({ success: false, message: "يرجى إدخال اسم المستخدم وكلمة المرور." }, 400);
    }

    const result = AdminSessionModel.authenticate(req, username, password);
    if (!result.success) {
      return json({ success: false, message: result.message }, result.status);
    }

    return json(
      {
        success: true,
        message: "تم تسجيل الدخول بنجاح.",
        user: { username: result.username },
      },
      200,
      { "set-cookie": result.cookie }
    );
  }

  static async logout(req) {
    const clearHeader = AdminSessionModel.logout();
    return json(
      { success: true, message: "تم تسجيل الخروج بنجاح." },
      200,
      { "set-cookie": clearHeader }
    );
  }

  static async me(req) {
    const isAuth = AdminSessionModel.isAuthenticated(req);
    if (!isAuth) {
      return json({ success: false, authenticated: false, message: "غير مصرح." }, 401);
    }
    return json({
      success: true,
      authenticated: true,
      username: AdminSessionModel.getAdminUsername(),
    });
  }

  static async stats(req) {
    if (!AdminSessionModel.isAuthenticated(req)) {
      return json({ success: false, message: "غير مصرح بالوصول." }, 401);
    }

    const stats = await ApplicationModel.getStats();
    return json({ success: true, stats });
  }

  static async listApplications(req) {
    if (!AdminSessionModel.isAuthenticated(req)) {
      return json({ success: false, message: "غير مصرح بالوصول." }, 401);
    }

    const url = new URL(req.url);
    const search = clean(url.searchParams.get("q"));
    const status = clean(url.searchParams.get("status"));
    const stage = clean(url.searchParams.get("stage"));
    const grade = clean(url.searchParams.get("grade"));

    const items = await ApplicationModel.getAll({ search, status, stage, grade });
    return json({ success: true, count: items.length, items });
  }

  static async updateStatus(req) {
    if (!AdminSessionModel.isAuthenticated(req)) {
      return json({ success: false, message: "غير مصرح بالوصول." }, 401);
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return json({ success: false, message: "صيغة الطلب غير صالحة." }, 400);
    }

    const id = clean(body.id || body.applicationId);
    const status = clean(body.status);
    const adminNotes = clean(body.notes || body.adminNotes);

    if (!id || !status) {
      return json({ success: false, message: "رقم الطلب والحالة الجديدة مطلوبان." }, 400);
    }

    const result = await ApplicationModel.updateStatus(id, status, adminNotes);
    if (!result.success) {
      return json({ success: false, message: result.message }, 400);
    }

    return json({
      success: true,
      message: "تم تحديث حالة الطلب بنجاح.",
      application: result.application,
    });
  }

  static async exportData(req) {
    if (!AdminSessionModel.isAuthenticated(req)) {
      return json({ success: false, message: "غير مصرح بالوصول." }, 401);
    }

    const items = await ApplicationModel.getAll();
    const headers = [
      "رقم الطلب",
      "تاريخ التقديم",
      "المرحلة الدراسية",
      "الصف الدراسي",
      "اسم الطالب",
      "الرقم القومي",
      "تاريخ الميلاد",
      "المحافظة",
      "النوع",
      "العمر في 1 أكتوبر",
      "اللغة الثانية",
      "اسم الأب",
      "وظيفة الأب",
      "اسم الأم",
      "وظيفة الأم",
      "هاتف ولي الأمر",
      "هاتف إضافي",
      "البريد الإلكتروني",
      "العنوان",
      "المدرسة السابقة",
      "ملاحظات ولي الأمر",
      "حالة الطلب",
      "ملاحظات الإدارة",
    ];

    const escapeCsv = (field) => {
      const s = String(field ?? "").replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = items.map((a) => [
      a.applicationId,
      a.timestamp ? new Date(a.timestamp).toLocaleString("ar-EG") : "",
      a.stage,
      a.grade,
      a.studentName,
      a.nationalId,
      a.birthDate,
      a.governorate,
      a.gender,
      a.ageOnOctober?.text || "",
      a.secondLanguage,
      a.fatherName,
      a.fatherJob || "",
      a.motherName,
      a.motherJob || "",
      a.guardianPhone,
      a.guardianPhoneAlt || "",
      a.email || "",
      a.address,
      a.previousSchool || "",
      a.notes || "",
      a.status,
      a.adminNotes || "",
    ]);

    // UTF-8 BOM for Arabic Excel support
    const bom = "\uFEFF";
    const csvContent = bom + [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\r\n");

    return new Response(csvContent, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="HODLS_Applications_${new Date().toISOString().slice(0, 10)}.csv"`,
        "cache-control": "no-store",
      },
    });
  }
}
