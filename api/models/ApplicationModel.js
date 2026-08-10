import { createClient } from "@supabase/supabase-js";
import { clean } from "../utils/security.js";
import { parseEgyptianNationalId } from "../utils/nationalId.js";

const CURRENT_ACADEMIC_YEAR = "2026";
const MEMORY_STORE = new Map();

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

  if (url && key) {
    try {
      return createClient(url.trim(), key.trim());
    } catch (e) {
      console.warn("⚠️ Supabase client init error:", e.message);
    }
  }
  return null;
}

export const VALID_STAGES = {
  "المرحلة الابتدائية": [
    "الصف الأول الابتدائي", "الصف الثاني الابتدائي", "الصف الثالث الابتدائي",
    "الصف الرابع الابتدائي", "الصف الخامس الابتدائي", "الصف السادس الابتدائي",
  ],
  "المرحلة الإعدادية": [
    "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي",
  ],
  "المرحلة الثانوية": [
    "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي",
  ],
};

export const VALID_LANGUAGES = [
  "اللغة الفرنسية", "اللغة الألمانية", "اللغة الإسبانية", "اللغة الإيطالية",
];

export const VALID_STATUSES = [
  "قيد المراجعة", "مقبول مبدئياً", "مقبول نهائياً", "يحتاج استكمال أوراق", "مرفوض",
];

export class ApplicationModel {
  static async findById(applicationId) {
    const cleanId = clean(applicationId).toUpperCase();
    const supabase = getSupabaseClient();

    if (supabase) {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("application_id", cleanId)
        .maybeSingle();

      if (error) console.error("Supabase findById error:", error);
      return data ? this.mapRowToApp(data) : null;
    }

    return MEMORY_STORE.get(`app:${cleanId}`) || null;
  }

  static async findByNationalId(nationalId) {
    const cleanNid = clean(nationalId);
    const supabase = getSupabaseClient();

    if (supabase) {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("national_id", cleanNid)
        .maybeSingle();

      if (error) console.error("Supabase findByNationalId error:", error);
      return data ? this.mapRowToApp(data) : null;
    }

    for (const [key, app] of MEMORY_STORE.entries()) {
      if (key.startsWith("app:") && app.nationalId === cleanNid) {
        return app;
      }
    }
    return null;
  }

  static validate(data) {
    const errors = [];
    const sanitized = {};

    sanitized.stage = clean(data.stage);
    sanitized.grade = clean(data.grade);
    if (!VALID_STAGES[sanitized.stage]) {
      errors.push("يرجى اختيار مرحلة دراسية صحيحة.");
    } else if (!VALID_STAGES[sanitized.stage].includes(sanitized.grade)) {
      errors.push("الصف الدراسي المختار لا يتطابق مع المرحلة الدراسية.");
    }

    sanitized.studentName = clean(data.studentName);
    if (!sanitized.studentName || sanitized.studentName.length < 5) {
      errors.push("اسم الطالب يجب أن يكون رباعياً باللغة العربية على الأقل.");
    }

    const nidInfo = parseEgyptianNationalId(data.nationalId);
    if (!nidInfo.valid) {
      errors.push(nidInfo.error);
    } else {
      sanitized.nationalId = nidInfo.nationalId;
      sanitized.calculatedBirthDate = nidInfo.birthDate;
      sanitized.governorate = nidInfo.governorate;
      sanitized.gender = nidInfo.gender;
      sanitized.ageOnOctober = nidInfo.ageOnOctober;
    }

    sanitized.secondLanguage = clean(data.secondLanguage);
    if (!VALID_LANGUAGES.includes(sanitized.secondLanguage)) {
      errors.push("يرجى اختيار لغة ثانية صحيحة من القائمة.");
    }

    sanitized.fatherName = clean(data.fatherName);
    if (!sanitized.fatherName || sanitized.fatherName.length < 3) {
      errors.push("يرجى كتابة اسم الأب ثلاثياً على الأقل.");
    }

    sanitized.motherName = clean(data.motherName);
    if (!sanitized.motherName || sanitized.motherName.length < 3) {
      errors.push("يرجى كتابة اسم الأم ثلاثياً على الأقل.");
    }

    sanitized.fatherJob = clean(data.fatherJob);
    sanitized.motherJob = clean(data.motherJob);

    sanitized.guardianPhone = clean(data.guardianPhone);
    if (!/^01[0125][0-9]{8}$/.test(sanitized.guardianPhone)) {
      errors.push("رقم هاتف ولي الأمر يجب أن يكون رقم مصري صحيح مكون من 11 رقماً.");
    }

    sanitized.guardianPhoneAlt = clean(data.guardianPhoneAlt);
    sanitized.email = clean(data.email).toLowerCase();
    sanitized.address = clean(data.address);
    if (!sanitized.address || sanitized.address.length < 5) {
      errors.push("يرجى كتابة العنوان بالتفصيل.");
    }

    sanitized.previousSchool = clean(data.previousSchool);
    sanitized.notes = clean(data.notes);

    return {
      valid: errors.length === 0,
      errors,
      data: sanitized,
    };
  }

  static async generateApplicationId() {
    const supabase = getSupabaseClient();
    const prefix = `HODLS-${CURRENT_ACADEMIC_YEAR}-`;

    if (supabase) {
      const { count, error } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true });

      const seq = (count || 0) + 1;
      return `${prefix}${String(seq).padStart(5, "0")}`;
    }

    const seq = MEMORY_STORE.size + 1;
    return `${prefix}${String(seq).padStart(5, "0")}`;
  }

  static async create(rawInput) {
    const validation = this.validate(rawInput);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    const { data } = validation;
    const existing = await this.findByNationalId(data.nationalId);
    if (existing) {
      return {
        success: false,
        duplicate: true,
        applicationId: existing.applicationId,
        message: `عفواً، هذا الرقم القومي مسجل مسبقاً برقم طلب (${existing.applicationId}). لا يمكن تقديم أكثر من طلب لنفس الطالب.`,
      };
    }

    const applicationId = await this.generateApplicationId();
    const timestamp = new Date().toISOString();

    const appRecord = {
      applicationId,
      timestamp,
      stage: data.stage,
      grade: data.grade,
      studentName: data.studentName,
      nationalId: data.nationalId,
      birthDate: data.calculatedBirthDate,
      governorate: data.governorate,
      gender: data.gender,
      ageOnOctober: data.ageOnOctober,
      secondLanguage: data.secondLanguage,
      fatherName: data.fatherName,
      fatherJob: data.fatherJob,
      motherName: data.motherName,
      motherJob: data.motherJob,
      guardianPhone: data.guardianPhone,
      guardianPhoneAlt: data.guardianPhoneAlt,
      email: data.email,
      address: data.address,
      previousSchool: data.previousSchool,
      notes: data.notes,
      status: "قيد المراجعة",
      adminNotes: "",
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      const { error } = await supabase.from("applications").insert({
        application_id: applicationId,
        stage: data.stage,
        grade: data.grade,
        second_language: data.secondLanguage,
        student_name: data.studentName,
        national_id: data.nationalId,
        birth_date: data.calculatedBirthDate,
        governorate: data.governorate,
        gender: data.gender,
        age_text: data.ageOnOctober?.text,
        father_name: data.fatherName,
        father_job: data.fatherJob,
        mother_name: data.motherName,
        mother_job: data.motherJob,
        guardian_phone: data.guardianPhone,
        guardian_phone_alt: data.guardianPhoneAlt,
        email: data.email,
        address: data.address,
        previous_school: data.previousSchool,
        notes: data.notes,
        status: "قيد المراجعة",
        admin_notes: "",
        created_at: timestamp,
      });

      if (error) {
        console.error("Supabase insert error:", error);
        return { success: false, errors: [error.message] };
      }
    } else {
      MEMORY_STORE.set(`app:${applicationId}`, appRecord);
    }

    return {
      success: true,
      application: appRecord,
    };
  }

  static async getAll(filters = {}) {
    const supabase = getSupabaseClient();
    if (supabase) {
      let query = supabase.from("applications").select("*").order("created_at", { ascending: false });

      if (filters.status) query = query.eq("status", filters.status);
      if (filters.stage) query = query.eq("stage", filters.stage);
      if (filters.grade) query = query.eq("grade", filters.grade);

      const { data, error } = await query;
      if (error) {
        console.error("Supabase getAll error:", error);
        return [];
      }

      let items = (data || []).map(this.mapRowToApp);
      if (filters.search) {
        const q = clean(filters.search).toLowerCase();
        items = items.filter((a) =>
          [a.applicationId, a.studentName, a.nationalId, a.guardianPhone, a.fatherName]
            .some((f) => clean(f).toLowerCase().includes(q))
        );
      }
      return items;
    }

    let items = Array.from(MEMORY_STORE.values());
    if (filters.search) {
      const q = clean(filters.search).toLowerCase();
      items = items.filter((a) =>
        [a.applicationId, a.studentName, a.nationalId, a.guardianPhone, a.fatherName]
          .some((f) => clean(f).toLowerCase().includes(q))
      );
    }
    if (filters.status) items = items.filter((a) => a.status === filters.status);
    if (filters.stage) items = items.filter((a) => a.stage === filters.stage);
    return items;
  }

  static async updateStatus(applicationId, newStatus, adminNote = "") {
    const cleanId = clean(applicationId).toUpperCase();
    if (!VALID_STATUSES.includes(newStatus)) {
      return { success: false, message: "حالة الطلب غير صالحة." };
    }

    const timestamp = new Date().toISOString();
    const supabase = getSupabaseClient();

    if (supabase) {
      const { data, error } = await supabase
        .from("applications")
        .update({
          status: newStatus,
          admin_notes: clean(adminNote),
          updated_at: timestamp,
        })
        .eq("application_id", cleanId)
        .select()
        .maybeSingle();

      if (error) return { success: false, message: error.message };
      return { success: true, application: this.mapRowToApp(data) };
    }

    const app = MEMORY_STORE.get(`app:${cleanId}`);
    if (!app) return { success: false, message: "الطلب غير موجود." };

    app.status = newStatus;
    app.adminNotes = clean(adminNote);
    app.updatedAt = timestamp;
    MEMORY_STORE.set(`app:${cleanId}`, app);
    return { success: true, application: app };
  }

  static async getStats() {
    const apps = await this.getAll();
    return {
      total: apps.length,
      byStatus: {
        review: apps.filter((a) => a.status === "قيد المراجعة").length,
        acceptedInitial: apps.filter((a) => a.status === "مقبول مبدئياً").length,
        acceptedFinal: apps.filter((a) => a.status === "مقبول نهائياً").length,
        needsDocs: apps.filter((a) => a.status === "يحتاج استكمال أوراق").length,
        rejected: apps.filter((a) => a.status === "مرفوض").length,
      },
      byStage: {
        primary: apps.filter((a) => a.stage === "المرحلة الابتدائية").length,
        prep: apps.filter((a) => a.stage === "المرحلة الإعدادية").length,
        sec: apps.filter((a) => a.stage === "المرحلة الثانوية").length,
      },
    };
  }

  static mapRowToApp(row) {
    if (!row) return null;
    return {
      applicationId: row.application_id,
      timestamp: row.created_at,
      stage: row.stage,
      grade: row.grade,
      secondLanguage: row.second_language,
      studentName: row.student_name,
      nationalId: row.national_id,
      birthDate: row.birth_date,
      governorate: row.governorate,
      gender: row.gender,
      ageOnOctober: { text: row.age_text },
      fatherName: row.father_name,
      fatherJob: row.father_job,
      motherName: row.mother_name,
      motherJob: row.mother_job,
      guardianPhone: row.guardian_phone,
      guardianPhoneAlt: row.guardian_phone_alt,
      email: row.email,
      address: row.address,
      previousSchool: row.previous_school,
      notes: row.notes,
      status: row.status,
      adminNotes: row.admin_notes,
      updatedAt: row.updated_at,
    };
  }
}
