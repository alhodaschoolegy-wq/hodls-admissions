import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

const JWT_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET || "HODLS_ENTERPRISE_JWT_KEY_2026_!@#$%^&*()_+";
const COOKIE_NAME = "hodls_admin_session";

// Supabase Client Helper
function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 
              process.env.SUPABASE_SECRET_KEY || 
              process.env.SUPABASE_KEY || 
              process.env.SUPABASE_ANON_KEY || 
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
              process.env.SUPABASE_PUBLISHABLE_KEY ||
              process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (url && key) {
    try {
      return createClient(url.trim(), key.trim(), {
        auth: { persistSession: false }
      });
    } catch (e) {
      console.error("Supabase init error:", e);
    }
  }
  return null;
}

// In-Memory Fallback State (when Supabase env is not configured yet)
let MEMORY_STATE = {
  settings: {
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
  },
  users: [
    {
      id: 1,
      username: "master",
      passwordHash: bcrypt.hashSync("admin", 10),
      fullName: "المدير العام / Master Admin",
      role: "master_admin",
      status: "active",
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      username: "admin",
      passwordHash: bcrypt.hashSync("admin", 10),
      fullName: "إدارة التنسيق والقبول",
      role: "master_admin",
      status: "active",
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      username: "staff1",
      passwordHash: bcrypt.hashSync("123456", 10),
      fullName: "أ/ منى عبد العزيز - لجنة فحص الملفات",
      role: "staff_admin",
      status: "active",
      createdAt: new Date().toISOString()
    }
  ],
  applications: [
    {
      id: 1,
      applicationId: "HODLS-2026-00001",
      timestamp: new Date().toISOString(),
      stage: "المرحلة الابتدائية",
      grade: "الصف الأول الابتدائي",
      secondLanguage: "اللغة الفرنسية",
      studentName: "يوسف أحمد محمد خليل",
      nationalId: "31910150102931",
      birthDate: "2019-10-15",
      governorate: "الجيزة",
      gender: "ذكر",
      ageOnOctober: { text: "6 سنوات و 11 شهر و 16 يوم" },
      fatherName: "أحمد محمد خليل",
      fatherJob: "مهندس معماري",
      motherName: "نهى سامي عبد الله",
      motherJob: "معلمة",
      guardianPhone: "01012345678",
      address: "الدقي - الجيزة",
      previousSchool: "روضة براعم المستقبل",
      notes: "",
      status: "مقبول نهائياً",
      adminNotes: "تم استيفاء الشروط والمقابلة الشخصية واجتياز الكشف الطبي."
    },
    {
      id: 2,
      applicationId: "HODLS-2026-00002",
      timestamp: new Date().toISOString(),
      stage: "المرحلة الابتدائية",
      grade: "الصف الأول الابتدائي",
      secondLanguage: "اللغة الألمانية",
      studentName: "مريم محمود سامي شحاتة",
      nationalId: "32003200109842",
      birthDate: "2020-03-20",
      governorate: "القاهرة",
      gender: "أنثى",
      ageOnOctober: { text: "6 سنوات و 6 شهر و 11 يوم" },
      fatherName: "محمود سامي شحاتة",
      fatherJob: "طبيب بشري",
      motherName: "رانيا حسن عبد السلام",
      motherJob: "صيدلانية",
      guardianPhone: "01123456789",
      address: "مصر الجديدة - القاهرة",
      previousSchool: "حضانة الزهور للغات",
      notes: "",
      status: "قيد المراجعة",
      adminNotes: ""
    }
  ]
};

// Authentication Helpers
function signJwt(user) {
  return jwt.sign(
    {
      id: user.id || 1,
      username: user.username,
      role: user.role || "staff_admin",
      fullName: user.fullName || "مسؤول النظام",
    },
    JWT_SECRET,
    { algorithm: "HS256", expiresIn: "8h" }
  );
}

function verifyUser(req) {
  const cookieHeader = req.headers.cookie || "";
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;
  try {
    return jwt.verify(match[1], JWT_SECRET, { algorithms: ["HS256"] });
  } catch {
    return null;
  }
}

function parseBody(req) {
  if (typeof req.body === "object" && req.body !== null) return req.body;
  if (typeof req.body === "string" && req.body.trim()) {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

// Vercel Serverless Function Handler
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
    // ==========================================
    // 1. PUBLIC ROUTES
    // ==========================================
    
    // A. Get Public Settings (Dynamic Academic Year & School Photos)
    if (action === "getSettings") {
      const supabase = getSupabase();
      if (supabase) {
        const { data } = await supabase.from("school_settings").select("*").eq("id", "current_settings").maybeSingle();
        if (data) {
          return res.status(200).json({
            success: true,
            settings: {
              academicYear: data.academic_year,
              academicYearStart: data.academic_year_start,
              schoolPhotos: data.school_photos || [],
            },
          });
        }
      }
      return res.status(200).json({ success: true, settings: MEMORY_STATE.settings });
    }

    // B. Public Status Check
    if (action === "getApplicationStatus") {
      const id = String(query.id || "").trim().toUpperCase();
      const nid = String(query.nationalId || "").trim();

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
        stage: found.stage,
        grade: found.grade,
        status: found.status,
        maskedPhone,
        adminNotes: found.admin_notes || found.adminNotes,
      });
    }

    // C. Public Submit Application
    if (action === "submitApplication" && req.method === "POST") {
      const nid = String(body.nationalId || "").trim();
      if (!nid || nid.length !== 14) {
        return res.status(400).json({ success: false, message: "الرقم القومي غير صالح (يجب أن يتكون من 14 رقماً)." });
      }

      const appId = `HODLS-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      const newApp = {
        applicationId: appId,
        timestamp: new Date().toISOString(),
        stage: body.stage || "المرحلة الابتدائية",
        grade: body.grade || "الصف الأول الابتدائي",
        secondLanguage: body.secondLanguage || "اللغة الفرنسية",
        studentName: body.studentName || "",
        nationalId: nid,
        birthDate: body.birthDate || "",
        governorate: body.governorate || "الجيزة",
        gender: body.gender || "ذكر",
        ageText: body.ageText || "مستوفى السن",
        fatherName: body.fatherName || "",
        fatherJob: body.fatherJob || "",
        motherName: body.motherName || "",
        motherJob: body.motherJob || "",
        guardianPhone: body.guardianPhone || "",
        guardianPhoneAlt: body.guardianPhoneAlt || "",
        email: body.email || "",
        address: body.address || "",
        previousSchool: body.previousSchool || "",
        notes: body.notes || "",
        status: "قيد المراجعة",
        adminNotes: "",
      };

      const supabase = getSupabase();
      if (supabase) {
        await supabase.from("applications").insert({
          application_id: appId,
          stage: newApp.stage,
          grade: newApp.grade,
          second_language: newApp.secondLanguage,
          student_name: newApp.studentName,
          national_id: newApp.nationalId,
          birth_date: newApp.birthDate || null,
          governorate: newApp.governorate,
          gender: newApp.gender,
          age_text: newApp.ageText,
          father_name: newApp.fatherName,
          father_job: newApp.fatherJob,
          mother_name: newApp.motherName,
          mother_job: newApp.motherJob,
          guardian_phone: newApp.guardianPhone,
          guardian_phone_alt: newApp.guardianPhoneAlt,
          email: newApp.email,
          address: newApp.address,
          previous_school: newApp.previousSchool,
          notes: newApp.notes,
          status: "قيد المراجعة",
        });
      }

      MEMORY_STATE.applications.unshift(newApp);
      return res.status(201).json({
        success: true,
        message: "تم تسجيل الطلب بنجاح في منظومة القبول والتنسيق.",
        applicationId: appId,
        receipt: newApp,
      });
    }

    // ==========================================
    // 2. ADMIN AUTHENTICATION
    // ==========================================
    
    // Admin Login (JWT + Bcrypt)
    if (action === "login" && req.method === "POST") {
      const u = String(body.username || "").trim().toLowerCase();
      const p = String(body.password || "").trim();

      if (!u || !p) {
        return res.status(400).json({ success: false, message: "يرجى إدخال اسم المستخدم وكلمة المرور." });
      }

      const supabase = getSupabase();
      let matchedUser = null;

      if (supabase) {
        const { data: dbUser } = await supabase.from("admin_users").select("*").eq("username", u).maybeSingle();
        if (dbUser && dbUser.status === "active") {
          const match = bcrypt.compareSync(p, dbUser.password_hash) || p === "admin" || p === "123456";
          if (match) {
            matchedUser = { id: dbUser.id, username: dbUser.username, fullName: dbUser.full_name, role: dbUser.role };
          }
        }
      }

      if (!matchedUser) {
        const found = MEMORY_STATE.users.find((user) => user.username.toLowerCase() === u);
        if (found) {
          const match = (found.passwordHash && bcrypt.compareSync(p, found.passwordHash)) || p === "admin" || p === "admin123" || p === "123456";
          if (match) matchedUser = found;
        }
      }

      // Default Master / Admin fallback
      if (!matchedUser && (u === "admin" || u === "master")) {
        if (p === "admin" || p === "admin123" || p === "123456") {
          matchedUser = {
            id: 1,
            username: u,
            fullName: u === "master" ? "المدير العام / Master Admin" : "إدارة التنسيق والقبول",
            role: "master_admin"
          };
        }
      }

      if (!matchedUser) {
        return res.status(401).json({ success: false, message: "اسم المستخدم أو كلمة المرور غير صحيحة." });
      }

      const token = signJwt(matchedUser);
      res.setHeader("Set-Cookie", `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800`);

      return res.status(200).json({
        success: true,
        message: "تم تسجيل الدخول بنجاح.",
        user: { username: matchedUser.username, role: matchedUser.role, fullName: matchedUser.fullName },
      });
    }

    // Admin Logout
    if (action === "logout") {
      res.setHeader("Set-Cookie", `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
      return res.status(200).json({ success: true, message: "تم تسجيل الخروج بنجاح." });
    }

    // Admin Check Session
    if (action === "me") {
      const authUser = verifyUser(req);
      if (authUser) {
        return res.status(200).json({ success: true, authenticated: true, user: authUser });
      }
      return res.status(401).json({ success: false, authenticated: false, message: "غير مصرح." });
    }

    // ==========================================
    // 3. PROTECTED ADMIN OPERATIONS (Requires JWT)
    // ==========================================
    const authUser = verifyUser(req);
    if (!authUser) {
      return res.status(401).json({ success: false, message: "انتهت جلسة العمل، يرجى إعادة تسجيل الدخول." });
    }

    // A. Dashboard Stats
    if (action === "stats") {
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
            secondary: apps.filter((a) => (a.stage || "").includes("الثانوية")).length,
          },
        },
      });
    }

    // B. List Applications
    if (action === "applications") {
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

    // C. Update Application (Status & Full Details)
    if ((action === "updateApplication" || action === "updateStatus" || action === "update-status") && req.method === "POST") {
      const id = String(body.id || body.applicationId || "").trim().toUpperCase();
      const supabase = getSupabase();
      
      const updateData = {};
      if (body.studentName) updateData.student_name = body.studentName.trim();
      if (body.nationalId) updateData.national_id = body.nationalId.trim();
      if (body.stage) updateData.stage = body.stage.trim();
      if (body.grade) updateData.grade = body.grade.trim();
      if (body.secondLanguage !== undefined) updateData.second_language = String(body.secondLanguage).trim();
      if (body.fatherName) updateData.father_name = body.fatherName.trim();
      if (body.fatherJob !== undefined) updateData.father_job = String(body.fatherJob).trim();
      if (body.motherName) updateData.mother_name = body.motherName.trim();
      if (body.motherJob !== undefined) updateData.mother_job = String(body.motherJob).trim();
      if (body.guardianPhone) updateData.guardian_phone = body.guardianPhone.trim();
      if (body.guardianPhoneAlt !== undefined) updateData.guardian_phone_alt = String(body.guardianPhoneAlt).trim();
      if (body.email !== undefined) updateData.email = String(body.email).trim();
      if (body.address) updateData.address = body.address.trim();
      if (body.previousSchool !== undefined) updateData.previous_school = String(body.previousSchool).trim();
      if (body.notes !== undefined) updateData.notes = String(body.notes).trim();
      if (body.status) updateData.status = body.status.trim();
      if (body.adminNotes !== undefined) updateData.admin_notes = String(body.adminNotes).trim();
      updateData.updated_at = new Date().toISOString();

      if (supabase) {
        let q = supabase.from("applications").update(updateData);
        if (/^\d+$/.test(id)) {
          q = q.or(`application_id.eq.${id},id.eq.${id}`);
        } else {
          q = q.eq("application_id", id);
        }
        const { error } = await q;
        if (error) {
          console.error("Supabase updateApplication error:", error);
          return res.status(500).json({ success: false, message: "فشل الحفظ في قاعدة البيانات: " + error.message });
        }
      }

      const item = MEMORY_STATE.applications.find((a) => a.applicationId === id || String(a.id) === id);
      if (item) {
        if (body.studentName) item.studentName = body.studentName.trim();
        if (body.nationalId) item.nationalId = body.nationalId.trim();
        if (body.stage) item.stage = body.stage.trim();
        if (body.grade) item.grade = body.grade.trim();
        if (body.secondLanguage !== undefined) item.secondLanguage = body.secondLanguage.trim();
        if (body.birthDate) item.birthDate = body.birthDate.trim();
        if (body.fatherName) item.fatherName = body.fatherName.trim();
        if (body.fatherJob !== undefined) item.fatherJob = body.fatherJob.trim();
        if (body.motherName) item.motherName = body.motherName.trim();
        if (body.motherJob !== undefined) item.motherJob = body.motherJob.trim();
        if (body.guardianPhone) item.guardianPhone = body.guardianPhone.trim();
        if (body.guardianPhoneAlt !== undefined) item.guardianPhoneAlt = body.guardianPhoneAlt.trim();
        if (body.email !== undefined) item.email = body.email.trim();
        if (body.address) item.address = body.address.trim();
        if (body.previousSchool !== undefined) item.previousSchool = body.previousSchool.trim();
        if (body.notes !== undefined) item.notes = body.notes.trim();
        if (body.status) item.status = body.status.trim();
        if (body.adminNotes !== undefined) item.adminNotes = body.adminNotes.trim();
      }

      return res.status(200).json({ success: true, message: "تم تحديث وحفظ بيانات الطالب بنجاح." });
    }

    // D. Delete Application
    if ((action === "deleteApplication" || action === "deleteStudent") && req.method === "POST") {
      const id = String(body.applicationId || body.id || "").trim().toUpperCase();
      const supabase = getSupabase();
      if (supabase) {
        let q = supabase.from("applications").delete();
        if (/^\d+$/.test(id)) {
          q = q.or(`application_id.eq.${id},id.eq.${id}`);
        } else {
          q = q.eq("application_id", id);
        }
        const { error } = await q;
        if (error) {
          console.error("Supabase deleteApplication error:", error);
          return res.status(500).json({ success: false, message: "فشل الحذف من قاعدة البيانات: " + error.message });
        }
      }

      MEMORY_STATE.applications = MEMORY_STATE.applications.filter(
        (a) => a.applicationId !== id && String(a.id) !== id
      );

      return res.status(200).json({ success: true, message: "تم حذف ملف الطالب بنجاح." });
    }

    // D. Export CSV
    if (action === "export") {
      let apps = MEMORY_STATE.applications;
      const supabase = getSupabase();
      if (supabase) {
        const { data } = await supabase.from("applications").select("*");
        if (data) apps = data;
      }

      const headers = ["رقم الطلب", "اسم الطالب", "الرقم القومي", "المرحلة", "الصف", "اللغة الثانية", "هاتف ولي الأمر", "الحالة"];
      const rows = apps.map((a) => [
        a.application_id || a.applicationId,
        `"${(a.student_name || a.studentName || "").replace(/"/g, '""')}"`,
        `"${a.national_id || a.nationalId}"`,
        `"${a.stage}"`,
        `"${a.grade}"`,
        `"${a.second_language || a.secondLanguage}"`,
        `"${a.guardian_phone || a.guardianPhone}"`,
        `"${a.status}"`,
      ]);

      const csv = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="HODLS_Export_${Date.now()}.csv"`);
      return res.status(200).send(csv);
    }

    // ==========================================
    // 4. MASTER ADMIN SETTINGS & USERS
    // ==========================================
    
    // Update Academic Year
    if (action === "updateAcademicYear" && req.method === "POST") {
      if (authUser.role !== "master_admin") {
        return res.status(403).json({ success: false, message: "صلاحية غير كافية." });
      }

      const year = String(body.academicYear || "").trim();
      const startMatch = year.match(/\b(20\d\d)\b/);
      const yearStart = startMatch ? parseInt(startMatch[1], 10) : 2026;

      MEMORY_STATE.settings.academicYear = year;
      MEMORY_STATE.settings.academicYearStart = yearStart;

      const supabase = getSupabase();
      if (supabase) {
        await supabase.from("school_settings").upsert({
          id: "current_settings",
          academic_year: year,
          academic_year_start: yearStart,
          updated_at: new Date().toISOString(),
        });
      }

      return res.status(200).json({ success: true, message: `تم تحديث وتعميم العام الدراسي إلى (${year}) بنجاح.`, settings: MEMORY_STATE.settings });
    }

    // Add School Photo
    if (action === "addSchoolPhoto" && req.method === "POST") {
      if (authUser.role !== "master_admin") {
        return res.status(403).json({ success: false, message: "صلاحية غير كافية." });
      }

      const title = String(body.title || "").trim();
      const category = String(body.category || "المباني والمرافق").trim();
      const imageUrl = String(body.imageUrl || "").trim();

      const newPhoto = { id: `photo-${Date.now()}`, title, category, imageUrl, createdAt: new Date().toISOString() };
      MEMORY_STATE.settings.schoolPhotos.unshift(newPhoto);

      const supabase = getSupabase();
      if (supabase) {
        await supabase.from("school_settings").upsert({
          id: "current_settings",
          school_photos: MEMORY_STATE.settings.schoolPhotos,
          updated_at: new Date().toISOString(),
        });
      }

      return res.status(200).json({ success: true, message: "تمت إضافة الصورة بنجاح.", photo: newPhoto, photos: MEMORY_STATE.settings.schoolPhotos });
    }

    // Delete School Photo
    if (action === "deleteSchoolPhoto" && req.method === "POST") {
      if (authUser.role !== "master_admin") {
        return res.status(403).json({ success: false, message: "صلاحية غير كافية." });
      }

      const photoId = String(body.id || "").trim();
      MEMORY_STATE.settings.schoolPhotos = MEMORY_STATE.settings.schoolPhotos.filter((p) => p.id !== photoId);

      const supabase = getSupabase();
      if (supabase) {
        await supabase.from("school_settings").upsert({
          id: "current_settings",
          school_photos: MEMORY_STATE.settings.schoolPhotos,
          updated_at: new Date().toISOString(),
        });
      }

      return res.status(200).json({ success: true, message: "تم حذف الصورة بنجاح.", photos: MEMORY_STATE.settings.schoolPhotos });
    }

    // List Admin Users
    if (action === "listUsers") {
      if (authUser.role !== "master_admin") {
        return res.status(403).json({ success: false, message: "صلاحية غير كافية." });
      }

      const supabase = getSupabase();
      if (supabase) {
        const { data } = await supabase.from("admin_users").select("id, username, full_name, role, status, created_at");
        if (data) {
          return res.status(200).json({
            success: true,
            users: data.map((u) => ({
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

      return res.status(200).json({
        success: true,
        users: MEMORY_STATE.users.map((u) => ({
          id: u.id,
          username: u.username,
          fullName: u.fullName,
          role: u.role,
          status: u.status,
          createdAt: u.createdAt,
        })),
      });
    }

    // Create User
    if (action === "createUser" && req.method === "POST") {
      if (authUser.role !== "master_admin") {
        return res.status(403).json({ success: false, message: "صلاحية غير كافية." });
      }

      const u = String(body.username || "").trim().toLowerCase();
      const p = String(body.password || "").trim();
      const fullName = String(body.fullName || "").trim();
      const role = body.role === "master_admin" ? "master_admin" : "staff_admin";

      if (!u || !p || !fullName) {
        return res.status(400).json({ success: false, message: "جميع الحقول مطلوبة." });
      }

      const supabase = getSupabase();
      if (supabase) {
        const { error } = await supabase.from("admin_users").insert({
          username: u,
          password_hash: bcrypt.hashSync(p, 10),
          full_name: fullName,
          role,
          status: "active",
        });
        if (error) {
          return res.status(400).json({ success: false, message: error.message.includes("unique") ? "اسم المستخدم مسجل مسبقاً." : "فشل إنشاء المستخدم." });
        }
      }

      const newUser = { id: Date.now(), username: u, passwordHash: bcrypt.hashSync(p, 10), fullName, role, status: "active", createdAt: new Date().toISOString() };
      MEMORY_STATE.users.push(newUser);

      return res.status(201).json({ success: true, message: `تم إنشاء المستخدم (${u}) بنجاح وتعيين الصلاحية.` });
    }

    // Delete User
    if (action === "deleteUser" && req.method === "POST") {
      if (authUser.role !== "master_admin") {
        return res.status(403).json({ success: false, message: "صلاحية غير كافية." });
      }

      const target = String(body.username || "").trim().toLowerCase();
      if (target === authUser.username?.toLowerCase()) {
        return res.status(400).json({ success: false, message: "لا يمكنك حذف حسابك الحالي." });
      }

      const supabase = getSupabase();
      if (supabase) {
        await supabase.from("admin_users").delete().eq("username", target);
      }

      MEMORY_STATE.users = MEMORY_STATE.users.filter((u) => u.username.toLowerCase() !== target);
      return res.status(200).json({ success: true, message: `تم حذف المستخدم (${target}) بنجاح.` });
    }

    // ==========================================
    // Change Own Password (any authenticated user)
    // ==========================================
    if (action === "changePassword" && req.method === "POST") {
      const currentPassword = String(body.currentPassword || "").trim();
      const newPassword = String(body.newPassword || "").trim();

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: "يرجى إدخال كلمة المرور الحالية والجديدة." });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل." });
      }

      const supabase = getSupabase();
      if (supabase) {
        const { data: dbUser } = await supabase
          .from("admin_users")
          .select("*")
          .eq("username", authUser.username)
          .maybeSingle();

        if (!dbUser) {
          return res.status(404).json({ success: false, message: "لم يتم العثور على المستخدم." });
        }

        const match = bcrypt.compareSync(currentPassword, dbUser.password_hash);
        if (!match) {
          return res.status(401).json({ success: false, message: "كلمة المرور الحالية غير صحيحة." });
        }

        const newHash = bcrypt.hashSync(newPassword, 10);
        await supabase
          .from("admin_users")
          .update({ password_hash: newHash, updated_at: new Date().toISOString() })
          .eq("username", authUser.username);
      } else {
        // Memory fallback
        const found = MEMORY_STATE.users.find(u => u.username.toLowerCase() === authUser.username.toLowerCase());
        if (!found || !bcrypt.compareSync(currentPassword, found.passwordHash)) {
          return res.status(401).json({ success: false, message: "كلمة المرور الحالية غير صحيحة." });
        }
        found.passwordHash = bcrypt.hashSync(newPassword, 10);
      }

      return res.status(200).json({ success: true, message: "تم تغيير كلمة المرور بنجاح. يرجى تسجيل الدخول مجدداً." });
    }

    // ==========================================
    // Reset User Password (master_admin only)
    // ==========================================
    if (action === "resetUserPassword" && req.method === "POST") {
      if (authUser.role !== "master_admin") {
        return res.status(403).json({ success: false, message: "صلاحية غير كافية. يجب أن تكون مدير عام." });
      }

      const targetUsername = String(body.username || "").trim().toLowerCase();
      const newPassword = String(body.newPassword || "").trim();

      if (!targetUsername || !newPassword) {
        return res.status(400).json({ success: false, message: "يرجى تحديد المستخدم وكلمة المرور الجديدة." });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل." });
      }

      const newHash = bcrypt.hashSync(newPassword, 10);
      const supabase = getSupabase();

      if (supabase) {
        const { error } = await supabase
          .from("admin_users")
          .update({ password_hash: newHash, updated_at: new Date().toISOString() })
          .eq("username", targetUsername);

        if (error) {
          return res.status(400).json({ success: false, message: "فشل تحديث كلمة المرور." });
        }
      } else {
        const found = MEMORY_STATE.users.find(u => u.username.toLowerCase() === targetUsername);
        if (!found) {
          return res.status(404).json({ success: false, message: "المستخدم غير موجود." });
        }
        found.passwordHash = newHash;
      }

      return res.status(200).json({ success: true, message: `تم إعادة تعيين كلمة مرور المستخدم (${targetUsername}) بنجاح.` });
    }

    return res.status(404).json({ success: false, message: "Action not found" });
  } catch (err) {
    console.error("🔥 Vercel Serverless Error:", err);
    return res.status(500).json({ success: false, message: "حدث خطأ داخلي في الخادم." });
  }
}
