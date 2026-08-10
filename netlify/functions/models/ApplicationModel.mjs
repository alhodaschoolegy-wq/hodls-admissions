import { getStore } from "@netlify/blobs";
import { clean, escapeHtml } from "../utils/security.mjs";
import { parseEgyptianNationalId } from "../utils/nationalId.mjs";

const CURRENT_ACADEMIC_YEAR = "2026";
const STORE_NAME = "hodls-applications";

function getAppStore() {
  try {
    return getStore({ name: STORE_NAME });
  } catch (err) {
    console.warn("⚠️ Netlify Blobs not available in current environment, using fallback:", err.message);
    return null;
  }
}

export const VALID_STAGES = {
  "المرحلة الابتدائية": [
    "الصف الأول الابتدائي",
    "الصف الثاني الابتدائي",
    "الصف الثالث الابتدائي",
    "الصف الرابع الابتدائي",
    "الصف الخامس الابتدائي",
    "الصف السادس الابتدائي",
  ],
  "المرحلة الإعدادية": [
    "الصف الأول الإعدادي",
    "الصف الثاني الإعدادي",
    "الصف الثالث الإعدادي",
  ],
  "المرحلة الثانوية": [
    "الصف الأول الثانوي",
    "الصف الثاني الثانوي",
    "الصف الثالث الثانوي",
  ],
};

export const VALID_LANGUAGES = [
  "اللغة الفرنسية",
  "اللغة الألمانية",
  "اللغة الإسبانية",
  "اللغة الإيطالية",
];

export const VALID_STATUSES = [
  "قيد المراجعة",
  "مقبول مبدئياً",
  "مقبول نهائياً",
  "يحتاج استكمال أوراق",
  "مرفوض",
];

export class ApplicationModel {
  static async listAllKeys() {
    const store = getAppStore();
    if (!store) return [];
    try {
      const result = await store.list({ prefix: "app:" });
      return result.blobs || result || [];
    } catch (err) {
      console.error("Error listing applications:", err);
      return [];
    }
  }

  static async findById(applicationId) {
    const store = getAppStore();
    if (!store) return null;
    const cleanId = clean(applicationId).toUpperCase();
    try {
      return await store.get(`app:${cleanId}`, { type: "json" });
    } catch (err) {
      console.error(`Error finding app ${cleanId}:`, err);
      return null;
    }
  }

  static async findByNationalId(nationalId) {
    const store = getAppStore();
    if (!store) return null;
    const cleanNid = clean(nationalId);
    try {
      const ref = await store.get(`nid:${cleanNid}`, { type: "json" });
      if (ref && ref.applicationId) {
        return await this.findById(ref.applicationId);
      }
      return null;
    } catch (err) {
      console.error(`Error finding nid ${cleanNid}:`, err);
      return null;
    }
  }

  static validate(data) {
    const errors = [];
    const sanitized = {};

    // 1. Stage & Grade
    sanitized.stage = clean(data.stage);
    sanitized.grade = clean(data.grade);
    if (!VALID_STAGES[sanitized.stage]) {
      errors.push("يرجى اختيار مرحلة دراسية صحيحة.");
    } else if (!VALID_STAGES[sanitized.stage].includes(sanitized.grade)) {
      errors.push("الصف الدراسي المختار لا يتطابق مع المرحلة الدراسية.");
    }

    // 2. Student Name
    sanitized.studentName = clean(data.studentName);
    if (!sanitized.studentName || sanitized.studentName.length < 5) {
      errors.push("اسم الطالب يجب أن يكون رباعياً باللغة العربية على الأقل.");
    }

    // 3. National ID
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

    // 4. Second Language
    sanitized.secondLanguage = clean(data.secondLanguage);
    if (!VALID_LANGUAGES.includes(sanitized.secondLanguage)) {
      errors.push("يرجى اختيار لغة ثانية صحيحة من القائمة.");
    }

    // 5. Parents info
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

    // 6. Guardian Phone & Email
    sanitized.guardianPhone = clean(data.guardianPhone);
    if (!/^01[0125][0-9]{8}$/.test(sanitized.guardianPhone)) {
      errors.push("رقم هاتف ولي الأمر يجب أن يكون رقم مصري صحيح مكون من 11 رقماً (يبدأ بـ 010 أو 011 أو 012 أو 015).");
    }

    sanitized.guardianPhoneAlt = clean(data.guardianPhoneAlt);
    if (sanitized.guardianPhoneAlt && !/^01[0125][0-9]{8}$/.test(sanitized.guardianPhoneAlt)) {
      errors.push("رقم الهاتف الإضافي غير صحيح.");
    }

    sanitized.email = clean(data.email).toLowerCase();
    if (sanitized.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized.email)) {
      errors.push("البريد الإلكتروني غير صالح.");
    }

    // 7. Address & school
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
    const store = getAppStore();
    const prefix = `HODLS-${CURRENT_ACADEMIC_YEAR}-`;
    let seq = 1;

    if (store) {
      try {
        const counterBlob = await store.get("meta:counter", { type: "json" });
        if (counterBlob && typeof counterBlob.count === "number") {
          seq = counterBlob.count + 1;
        } else {
          const keys = await this.listAllKeys();
          seq = keys.length + 1;
        }
        await store.setJSON("meta:counter", { count: seq, updatedAt: new Date().toISOString() });
      } catch (e) {
        console.warn("Counter error, using random salt:", e.message);
        seq = Math.floor(10000 + Math.random() * 90000);
      }
    } else {
      seq = Math.floor(10000 + Math.random() * 90000);
    }

    return `${prefix}${String(seq).padStart(5, "0")}`;
  }

  static async create(rawInput) {
    const validation = this.validate(rawInput);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    const { data } = validation;
    const store = getAppStore();

    // Check duplicate
    if (store) {
      const existing = await this.findByNationalId(data.nationalId);
      if (existing) {
        return {
          success: false,
          duplicate: true,
          applicationId: existing.applicationId,
          message: `عفواً، هذا الرقم القومي مسجل مسبقاً برقم طلب (${existing.applicationId}). لا يمكن تقديم أكثر من طلب لنفس الطالب.`,
        };
      }
    }

    const applicationId = await this.generateApplicationId();
    const timestamp = new Date().toISOString();

    const applicationRecord = {
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
      history: [
        {
          status: "قيد المراجعة",
          timestamp,
          note: "تم استلام طلب التسجيل الإلكتروني بنجاح من ولي الأمر.",
        },
      ],
    };

    if (store) {
      await store.setJSON(`app:${applicationId}`, applicationRecord);
      await store.setJSON(`nid:${data.nationalId}`, { applicationId, timestamp });
    }

    return {
      success: true,
      application: applicationRecord,
    };
  }

  static async getAll(filters = {}) {
    const store = getAppStore();
    if (!store) return [];

    const keys = await this.listAllKeys();
    const items = [];

    for (const item of keys) {
      const key = item.key || item;
      if (typeof key === "string" && key.startsWith("app:")) {
        const app = await store.get(key, { type: "json" });
        if (app) items.push(app);
      }
    }

    let filtered = items;

    if (filters.search) {
      const q = clean(filters.search).toLowerCase();
      filtered = filtered.filter((a) =>
        [a.applicationId, a.studentName, a.nationalId, a.guardianPhone, a.fatherName]
          .some((f) => clean(f).toLowerCase().includes(q))
      );
    }

    if (filters.status) {
      filtered = filtered.filter((a) => a.status === filters.status);
    }

    if (filters.stage) {
      filtered = filtered.filter((a) => a.stage === filters.stage);
    }

    if (filters.grade) {
      filtered = filtered.filter((a) => a.grade === filters.grade);
    }

    // Sort newest first
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return filtered;
  }

  static async updateStatus(applicationId, newStatus, adminNote = "") {
    const app = await this.findById(applicationId);
    if (!app) return { success: false, message: "الطلب غير موجود." };

    if (!VALID_STATUSES.includes(newStatus)) {
      return { success: false, message: "حالة الطلب المحددة غير صالحة." };
    }

    const timestamp = new Date().toISOString();
    app.status = newStatus;
    app.adminNotes = clean(adminNote);
    app.updatedAt = timestamp;
    app.history = app.history || [];
    app.history.push({
      status: newStatus,
      timestamp,
      note: adminNote || `تم تغيير الحالة إلى ${newStatus}`,
    });

    const store = getAppStore();
    if (store) {
      await store.setJSON(`app:${app.applicationId}`, app);
    }

    return { success: true, application: app };
  }

  static async getStats() {
    const apps = await this.getAll();
    const total = apps.length;

    const byStatus = {
      review: apps.filter((a) => a.status === "قيد المراجعة").length,
      acceptedInitial: apps.filter((a) => a.status === "مقبول مبدئياً").length,
      acceptedFinal: apps.filter((a) => a.status === "مقبول نهائياً").length,
      needsDocs: apps.filter((a) => a.status === "يحتاج استكمال أوراق").length,
      rejected: apps.filter((a) => a.status === "مرفوض").length,
    };

    const byStage = {
      primary: apps.filter((a) => a.stage === "المرحلة الابتدائية").length,
      prep: apps.filter((a) => a.stage === "المرحلة الإعدادية").length,
      sec: apps.filter((a) => a.stage === "المرحلة الثانوية").length,
    };

    return {
      total,
      byStatus,
      byStage,
    };
  }
}
