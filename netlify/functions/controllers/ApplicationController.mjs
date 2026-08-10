import { ApplicationModel } from "../models/ApplicationModel.mjs";
import { json, checkRateLimit, getClientIp, clean } from "../utils/security.mjs";

export class ApplicationController {
  static async submit(req) {
    const ip = getClientIp(req);

    // Rate limiting: max 8 submissions per 10 minutes per IP
    const rate = checkRateLimit(`submit_${ip}`, 8, 10 * 60 * 1000);
    if (!rate.allowed) {
      return json({
        success: false,
        message: "تم إرسال عدد كبير من الطلبات من هذا الجهاز مؤخراً. يرجى الانتظار بضع دقائق والمحاولة مرة أخرى.",
      }, 429);
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return json({ success: false, message: "صيغة البيانات غير صحيحة." }, 400);
    }

    // Anti-bot honeypot check (hidden field in frontend)
    if (body.website_url || body._gotcha) {
      // Quietly reject or simulate success to trap bot
      return json({ success: false, message: "تم اكتشاف نشاط غير مصرح به." }, 400);
    }

    const result = await ApplicationModel.create(body);

    if (!result.success) {
      if (result.duplicate) {
        return json({
          success: false,
          duplicate: true,
          applicationId: result.applicationId,
          message: result.message,
        }, 409);
      }
      return json({
        success: false,
        message: result.errors?.[0] || "يرجى مراجعة البيانات المدخلة والتأكد من صحتها.",
        errors: result.errors,
      }, 400);
    }

    const app = result.application;
    return json({
      success: true,
      message: "تم تسجيل طلب التقديم بنجاح.",
      applicationId: app.applicationId,
      studentName: app.studentName,
      nationalId: app.nationalId,
      stage: app.stage,
      grade: app.grade,
      timestamp: app.timestamp,
      receipt: {
        applicationId: app.applicationId,
        studentName: app.studentName,
        nationalId: app.nationalId,
        birthDate: app.birthDate,
        governorate: app.governorate,
        gender: app.gender,
        ageText: app.ageOnOctober?.text,
        stage: app.stage,
        grade: app.grade,
        secondLanguage: app.secondLanguage,
        fatherName: app.fatherName,
        guardianPhone: app.guardianPhone,
        timestamp: app.timestamp,
        status: app.status,
      },
    }, 201);
  }

  static async getStatus(req) {
    const url = new URL(req.url);
    const id = clean(url.searchParams.get("id") || url.searchParams.get("applicationId"));
    const nid = clean(url.searchParams.get("nationalId") || url.searchParams.get("nid"));

    if (!id && !nid) {
      return json({
        found: false,
        message: "يرجى إدخال رقم الطلب أو الرقم القومي للبحث.",
      }, 400);
    }

    const ip = getClientIp(req);
    const rate = checkRateLimit(`status_${ip}`, 30, 60 * 1000);
    if (!rate.allowed) {
      return json({
        found: false,
        message: "يرجى التمهل في إجراء عمليات البحث.",
      }, 429);
    }

    let app = null;
    if (id) {
      app = await ApplicationModel.findById(id);
    } else if (nid) {
      app = await ApplicationModel.findByNationalId(nid);
    }

    if (!app) {
      return json({
        found: false,
        message: "لم يتم العثور على طلب مسجل بهذه البيانات. تأكد من صحة رقم الطلب أو الرقم القومي.",
      });
    }

    // Mask phone number for public privacy
    const rawPhone = app.guardianPhone || "";
    const maskedPhone = rawPhone.length === 11
      ? `${rawPhone.substring(0, 3)}****${rawPhone.substring(7)}`
      : rawPhone;

    return json({
      found: true,
      applicationId: app.applicationId,
      studentName: app.studentName,
      stage: app.stage,
      grade: app.grade,
      status: app.status,
      maskedPhone,
      timestamp: app.timestamp,
      adminNotes: app.status === "يحتاج استكمال أوراق" || app.status === "مقبول مبدئياً" ? app.adminNotes : "",
      history: (app.history || []).map((h) => ({
        status: h.status,
        timestamp: h.timestamp,
        note: h.note,
      })),
    });
  }
}
