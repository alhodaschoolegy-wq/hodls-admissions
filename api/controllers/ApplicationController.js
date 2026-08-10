import { getSupabase, MEMORY_STATE } from "../utils/db.js";
import { parseEgyptianNationalId } from "../utils/nationalId.js";
import { clean, checkRateLimit, getClientIp } from "../utils/security.js";

const VALID_STAGES = ["المرحلة الابتدائية", "المرحلة الإعدادية", "المرحلة الثانوية"];
const VALID_LANGUAGES = ["اللغة الفرنسية", "اللغة الألمانية"];

export class ApplicationController {
  /**
   * Submit new admission application
   */
  static async submit(req, res, body) {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`submit_${ip}`, 10, 10 * 60 * 1000);
    if (!rate.allowed) {
      return res.status(429).json({
        success: false,
        message: "تم إرسال عدد كبير من الطلبات من هذا الجهاز. يرجى الانتظار بضع دقائق.",
      });
    }

    // Honeypot bot protection
    if (body.website_url || body._gotcha) {
      return res.status(400).json({ success: false, message: "تم رفض الطلب المشبوه." });
    }

    // Validation
    const errors = [];
    const studentName = clean(body.studentName);
    if (!studentName || studentName.length < 3) errors.push("يرجى كتابة اسم الطالب ثلاثياً على الأقل.");

    const stage = clean(body.stage);
    if (!VALID_STAGES.includes(stage)) errors.push("يرجى اختيار المرحلة الدراسية بشكل صحيح.");

    const grade = clean(body.grade);
    if (!grade) errors.push("يرجى تحديد الصف الدراسي.");

    const nidInfo = parseEgyptianNationalId(body.nationalId);
    if (!nidInfo.valid) errors.push(nidInfo.error);

    const secondLanguage = clean(body.secondLanguage);
    if (!VALID_LANGUAGES.includes(secondLanguage)) errors.push("يرجى اختيار لغة أجنبية ثانية صحيحة.");

    const fatherName = clean(body.fatherName);
    if (!fatherName || fatherName.length < 3) errors.push("يرجى كتابة اسم الأب ثلاثياً على الأقل.");

    const motherName = clean(body.motherName);
    if (!motherName || motherName.length < 3) errors.push("يرجى كتابة اسم الأم ثلاثياً على الأقل.");

    const guardianPhone = clean(body.guardianPhone);
    if (!/^01[0125][0-9]{8}$/.test(guardianPhone)) errors.push("رقم هاتف ولي الأمر يجب أن يكون رقم مصري صحيح مكون من 11 رقماً.");

    const address = clean(body.address);
    if (!address || address.length < 5) errors.push("يرجى كتابة العنوان بالتفصيل.");

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors[0], errors });
    }

    const nationalId = nidInfo.nationalId;
    const supabase = getSupabase();

    // Check duplicate National ID
    if (supabase) {
      const { data: existing } = await supabase.from("applications").select("application_id").eq("national_id", nationalId).maybeSingle();
      if (existing) {
        return res.status(409).json({
          success: false,
          duplicate: true,
          applicationId: existing.application_id,
          message: `هذا الرقم القومي مسجل بالفعل بالطلب رقم (${existing.application_id}).`,
        });
      }
    } else {
      const existing = MEMORY_STATE.applications.find((a) => a.nationalId === nationalId);
      if (existing) {
        return res.status(409).json({
          success: false,
          duplicate: true,
          applicationId: existing.applicationId,
          message: `هذا الرقم القومي مسجل بالفعل بالطلب رقم (${existing.applicationId}).`,
        });
      }
    }

    // Generate Application ID
    const count = supabase ? (await supabase.from("applications").select("id", { count: "exact", head: true })).count || 0 : MEMORY_STATE.applications.length;
    const nextNum = (count + 1).toString().padStart(5, "0");
    const applicationId = `HODLS-2026-${nextNum}`;

    const newApp = {
      application_id: applicationId,
      student_name: studentName,
      national_id: nationalId,
      birth_date: nidInfo.birthDate,
      governorate: nidInfo.governorate,
      gender: nidInfo.gender,
      age_text: nidInfo.ageOnOctober.text,
      stage,
      grade,
      second_language: secondLanguage,
      father_name: fatherName,
      father_job: clean(body.fatherJob),
      mother_name: motherName,
      mother_job: clean(body.motherJob),
      guardian_phone: guardianPhone,
      guardian_phone_alt: clean(body.guardianPhoneAlt),
      email: clean(body.email).toLowerCase(),
      address,
      previous_school: clean(body.previousSchool),
      notes: clean(body.notes),
      status: "قيد المراجعة",
      admin_notes: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (supabase) {
      const { error } = await supabase.from("applications").insert([newApp]);
      if (error) {
        console.error("Supabase insert error:", error);
        return res.status(500).json({ success: false, message: "فشل حفظ الطلب في قاعدة البيانات." });
      }
    }

    // Update memory fallback
    MEMORY_STATE.applications.unshift({
      id: count + 1,
      applicationId,
      studentName,
      nationalId,
      birthDate: nidInfo.birthDate,
      governorate: nidInfo.governorate,
      gender: nidInfo.gender,
      ageOnOctober: nidInfo.ageOnOctober,
      stage,
      grade,
      secondLanguage,
      fatherName,
      fatherJob: clean(body.fatherJob),
      motherName,
      motherJob: clean(body.motherJob),
      guardianPhone,
      guardianPhoneAlt: clean(body.guardianPhoneAlt),
      email: clean(body.email).toLowerCase(),
      address,
      previousSchool: clean(body.previousSchool),
      notes: clean(body.notes),
      status: "قيد المراجعة",
      adminNotes: "",
      timestamp: newApp.created_at,
    });

    return res.status(201).json({
      success: true,
      message: "تم تسجيل طلب التقديم بنجاح.",
      applicationId,
      receipt: {
        applicationId,
        studentName,
        nationalId,
        birthDate: nidInfo.birthDate,
        governorate: nidInfo.governorate,
        gender: nidInfo.gender,
        ageText: nidInfo.ageOnOctober.text,
        stage,
        grade,
        secondLanguage,
        fatherName,
        guardianPhone,
        timestamp: newApp.created_at,
        status: "قيد المراجعة",
      },
    });
  }

  /**
   * Public check application status
   */
  static async getStatus(req, res, query) {
    const id = clean(query.id || query.applicationId).toUpperCase();
    const nid = clean(query.nationalId || query.nid);

    if (!id && !nid) {
      return res.status(400).json({ found: false, message: "يرجى إدخال رقم الطلب أو الرقم القومي للبحث." });
    }

    const ip = getClientIp(req);
    const rate = checkRateLimit(`status_${ip}`, 40, 60 * 1000);
    if (!rate.allowed) {
      return res.status(429).json({ found: false, message: "يرجى التمهل في إجراء عمليات البحث." });
    }

    const supabase = getSupabase();
    let found = null;

    if (supabase) {
      let q = supabase.from("applications").select("*");
      if (id) q = q.eq("application_id", id);
      else if (nid) q = q.eq("national_id", nid);
      const { data } = await q.maybeSingle();
      found = data;
    }

    if (!found) {
      found = MEMORY_STATE.applications.find((a) => a.applicationId === id || a.nationalId === nid);
    }

    if (!found) {
      return res.status(200).json({ found: false, message: "لم يتم العثور على طلب مسجل بهذه البيانات." });
    }

    const rawPhone = found.guardian_phone || found.guardianPhone || "";
    const maskedPhone = rawPhone.length === 11 ? `${rawPhone.substring(0, 3)}****${rawPhone.substring(7)}` : rawPhone;

    return res.status(200).json({
      found: true,
      applicationId: found.application_id || found.applicationId,
      studentName: found.student_name || found.studentName,
      nationalId: found.national_id || found.nationalId,
      birthDate: found.birth_date || found.birthDate,
      governorate: found.governorate,
      gender: found.gender,
      ageText: found.age_text || (found.ageOnOctober && found.ageOnOctober.text) || "مستوفى السن",
      stage: found.stage,
      grade: found.grade,
      secondLanguage: found.second_language || found.secondLanguage || "—",
      fatherName: found.father_name || found.fatherName || "—",
      fatherJob: found.father_job || found.fatherJob || "—",
      motherName: found.mother_name || found.motherName || "—",
      motherJob: found.mother_job || found.motherJob || "—",
      guardianPhone: found.guardian_phone || found.guardianPhone || "—",
      guardianPhoneAlt: found.guardian_phone_alt || found.guardianPhoneAlt || "—",
      email: found.email || "—",
      address: found.address || "—",
      previousSchool: found.previous_school || found.previousSchool || "—",
      notes: found.notes || "—",
      status: found.status,
      maskedPhone,
      adminNotes: found.admin_notes || found.adminNotes,
      timestamp: found.created_at || found.timestamp || new Date().toISOString(),
    });
  }

  /**
   * Dashboard KPI statistics
   */
  static async stats(req, res) {
    const supabase = getSupabase();
    let apps = MEMORY_STATE.applications;

    if (supabase) {
      const { data } = await supabase.from("applications").select("*");
      if (data) apps = data;
    }

    return res.status(200).json({
      success: true,
      stats: {
        total: apps.length,
        byStatus: {
          review: apps.filter((a) => (a.status || "").includes("مراجعة")).length,
          acceptedInitial: apps.filter((a) => (a.status || "").includes("مبدئياً")).length,
          acceptedFinal: apps.filter((a) => a.status === "مقبول نهائياً" || a.status === "مقبول").length,
          needsDocs: apps.filter((a) => (a.status || "").includes("أوراق")).length,
          rejected: apps.filter((a) => (a.status || "").includes("مرفوض")).length,
        },
        byStage: {
          primary: apps.filter((a) => (a.stage || "").includes("الابتدائية")).length,
          prep: apps.filter((a) => (a.stage || "").includes("الإعدادية")).length,
          sec: apps.filter((a) => (a.stage || "").includes("الثانوية")).length,
        },
      },
    });
  }

  /**
   * List applications for admin table
   */
  static async list(req, res) {
    const supabase = getSupabase();
    let apps = MEMORY_STATE.applications;

    if (supabase) {
      const { data } = await supabase.from("applications").select("*").order("created_at", { ascending: false });
      if (data) {
        apps = data.map((d) => ({
          id: d.id,
          applicationId: d.application_id,
          studentName: d.student_name,
          nationalId: d.national_id,
          birthDate: d.birth_date,
          governorate: d.governorate,
          gender: d.gender,
          ageOnOctober: { text: d.age_text },
          stage: d.stage,
          grade: d.grade,
          secondLanguage: d.second_language,
          fatherName: d.father_name,
          fatherJob: d.father_job,
          motherName: d.mother_name,
          motherJob: d.mother_job,
          guardianPhone: d.guardian_phone,
          guardianPhoneAlt: d.guardian_phone_alt,
          email: d.email,
          address: d.address,
          previousSchool: d.previous_school,
          notes: d.notes,
          status: d.status,
          adminNotes: d.admin_notes,
          timestamp: d.created_at,
        }));
      }
    }

    return res.status(200).json({ success: true, count: apps.length, items: apps });
  }

  /**
   * Update full student record & status
   */
  static async update(req, res, body) {
    const id = clean(body.applicationId || body.id).toUpperCase();
    if (!id) return res.status(400).json({ success: false, message: "رقم الطلب مطلوب." });

    const updateData = {};
    if (body.studentName) updateData.student_name = clean(body.studentName);
    if (body.nationalId) updateData.national_id = clean(body.nationalId);
    if (body.stage) updateData.stage = clean(body.stage);
    if (body.grade) updateData.grade = clean(body.grade);
    if (body.secondLanguage !== undefined) updateData.second_language = clean(body.secondLanguage);
    if (body.birthDate) updateData.birth_date = clean(body.birthDate);
    if (body.fatherName) updateData.father_name = clean(body.fatherName);
    if (body.fatherJob !== undefined) updateData.father_job = clean(body.fatherJob);
    if (body.motherName) updateData.mother_name = clean(body.motherName);
    if (body.motherJob !== undefined) updateData.mother_job = clean(body.motherJob);
    if (body.guardianPhone) updateData.guardian_phone = clean(body.guardianPhone);
    if (body.guardianPhoneAlt !== undefined) updateData.guardian_phone_alt = clean(body.guardianPhoneAlt);
    if (body.email !== undefined) updateData.email = clean(body.email);
    if (body.address) updateData.address = clean(body.address);
    if (body.previousSchool !== undefined) updateData.previous_school = clean(body.previousSchool);
    if (body.notes !== undefined) updateData.notes = clean(body.notes);
    if (body.status) updateData.status = clean(body.status);
    if (body.adminNotes !== undefined) updateData.admin_notes = clean(body.adminNotes);
    updateData.updated_at = new Date().toISOString();

    const supabase = getSupabase();
    if (supabase) {
      let q = supabase.from("applications").update(updateData);
      if (/^\d+$/.test(id)) q = q.or(`application_id.eq.${id},id.eq.${id}`);
      else q = q.eq("application_id", id);
      const { error } = await q;
      if (error) {
        console.error("Supabase update error:", error);
        return res.status(500).json({ success: false, message: "فشل الحفظ في قاعدة البيانات: " + error.message });
      }
    }

    const item = MEMORY_STATE.applications.find((a) => a.applicationId === id || String(a.id) === id);
    if (item) {
      if (body.studentName) item.studentName = clean(body.studentName);
      if (body.nationalId) item.nationalId = clean(body.nationalId);
      if (body.stage) item.stage = clean(body.stage);
      if (body.grade) item.grade = clean(body.grade);
      if (body.secondLanguage !== undefined) item.secondLanguage = clean(body.secondLanguage);
      if (body.birthDate) item.birthDate = clean(body.birthDate);
      if (body.fatherName) item.fatherName = clean(body.fatherName);
      if (body.fatherJob !== undefined) item.fatherJob = clean(body.fatherJob);
      if (body.motherName) item.motherName = clean(body.motherName);
      if (body.motherJob !== undefined) item.motherJob = clean(body.motherJob);
      if (body.guardianPhone) item.guardianPhone = clean(body.guardianPhone);
      if (body.guardianPhoneAlt !== undefined) item.guardianPhoneAlt = clean(body.guardianPhoneAlt);
      if (body.email !== undefined) item.email = clean(body.email);
      if (body.address) item.address = clean(body.address);
      if (body.previousSchool !== undefined) item.previousSchool = clean(body.previousSchool);
      if (body.notes !== undefined) item.notes = clean(body.notes);
      if (body.status) item.status = clean(body.status);
      if (body.adminNotes !== undefined) item.adminNotes = clean(body.adminNotes);
    }

    return res.status(200).json({ success: true, message: "تم تحديث وحفظ بيانات الطالب بنجاح." });
  }

  /**
   * Delete student application
   */
  static async delete(req, res, body) {
    const id = clean(body.applicationId || body.id).toUpperCase();
    if (!id) return res.status(400).json({ success: false, message: "رقم الطلب مطلوب للحذف." });

    const supabase = getSupabase();
    if (supabase) {
      let q = supabase.from("applications").delete();
      if (/^\d+$/.test(id)) q = q.or(`application_id.eq.${id},id.eq.${id}`);
      else q = q.eq("application_id", id);
      const { error } = await q;
      if (error) {
        console.error("Supabase delete error:", error);
        return res.status(500).json({ success: false, message: "فشل الحذف من قاعدة البيانات: " + error.message });
      }
    }

    MEMORY_STATE.applications = MEMORY_STATE.applications.filter((a) => a.applicationId !== id && String(a.id) !== id);
    return res.status(200).json({ success: true, message: "تم حذف ملف الطالب بنجاح." });
  }

  /**
   * Export applications to Arabic UTF-8 CSV
   */
  static async exportCsv(req, res) {
    let apps = MEMORY_STATE.applications;
    const supabase = getSupabase();
    if (supabase) {
      const { data } = await supabase.from("applications").select("*").order("created_at", { ascending: false });
      if (data) apps = data;
    }

    const headers = ["رقم الطلب", "اسم الطالب", "الرقم القومي", "المرحلة", "الصف", "اللغة الثانية", "هاتف ولي الأمر", "الحالة"];
    const rows = apps.map((a) => [
      a.application_id || a.applicationId,
      `"${(a.student_name || a.studentName || "").replace(/"/g, '""')}"`,
      `"${a.national_id || a.nationalId}"`,
      `"${a.stage}"`,
      `"${a.grade}"`,
      `"${a.second_language || a.secondLanguage || ""}"`,
      `"${a.guardian_phone || a.guardianPhone || ""}"`,
      `"${a.status}"`,
    ]);

    const csv = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="hodls_students_export.csv"');
    return res.status(200).send(csv);
  }
}
