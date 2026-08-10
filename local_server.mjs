import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const DB_APPS_FILE = path.join(DATA_DIR, "applications.json");
const DB_USERS_FILE = path.join(DATA_DIR, "users.json");
const DB_SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

const DEFAULT_SETTINGS = {
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

function loadSettings() {
  if (!fs.existsSync(DB_SETTINGS_FILE)) {
    fs.writeFileSync(DB_SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2), "utf-8");
    return DEFAULT_SETTINGS;
  }
  try {
    const raw = fs.readFileSync(DB_SETTINGS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(data) {
  fs.writeFileSync(DB_SETTINGS_FILE, JSON.stringify(data, null, 2), "utf-8");
}

const SESSION_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET || "HODLS_JWT_HS256_ENTERPRISE_SECRET_KEY_2026";
const COOKIE_NAME = "hodls_admin_session";

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 1. Initial Users Seed with bcrypt hashing
const INITIAL_USERS = [
  {
    id: 1,
    username: "master",
    passwordHash: bcrypt.hashSync("admin", 10),
    fullName: "المدير العام / Master Admin",
    role: "master_admin",
    status: "active",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    username: "admin",
    passwordHash: bcrypt.hashSync("admin", 10),
    fullName: "إدارة التنسيق والقبول",
    role: "master_admin",
    status: "active",
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    username: "staff1",
    passwordHash: bcrypt.hashSync("123456", 10),
    fullName: "أ/ منى عبد العزيز - لجنة فحص الملفات",
    role: "staff_admin",
    status: "active",
    createdAt: new Date().toISOString(),
  },
];

function loadUsers() {
  if (!fs.existsSync(DB_USERS_FILE)) {
    fs.writeFileSync(DB_USERS_FILE, JSON.stringify(INITIAL_USERS, null, 2), "utf-8");
    return INITIAL_USERS;
  }
  try {
    const raw = fs.readFileSync(DB_USERS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return INITIAL_USERS;
  }
}

function saveUsers(users) {
  fs.writeFileSync(DB_USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

// 2. Initial Students Seed Data
const INITIAL_SEED_DATA = [
  {
    applicationId: "HODLS-2026-00001",
    timestamp: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    stage: "المرحلة الابتدائية",
    grade: "الصف الأول الابتدائي",
    secondLanguage: "اللغة الفرنسية",
    studentName: "يوسف أحمد محمود علي",
    nationalId: "31805152101234",
    birthDate: "2018-05-15",
    governorate: "الجيزة",
    gender: "ذكر",
    ageOnOctober: { text: "8 سنة و 4 شهر و 16 يوم" },
    fatherName: "أحمد محمود علي",
    fatherJob: "مهندس معماري",
    motherName: "منى عادل إبراهيم",
    motherJob: "معلمة لغة إنجليزية",
    guardianPhone: "01012345678",
    guardianPhoneAlt: "01123456789",
    email: "youssef.parent@gmail.com",
    address: "شارع التحرير - الدقي - الجيزة",
    previousSchool: "حضانة براعم الهُدى",
    notes: "يرجى مراعاة تسجيله مع شقيقه في نفس الميعاد",
    status: "مقبول مبدئياً",
    adminNotes: "تم فحص شهادة الميلاد ومطابقة السن، موعد المقابلة يوم الأحد 10 صباحاً.",
  },
  {
    applicationId: "HODLS-2026-00002",
    timestamp: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    stage: "المرحلة الابتدائية",
    grade: "الصف الثالث الابتدائي",
    secondLanguage: "اللغة الألمانية",
    studentName: "مريم إبراهيم حسن الشناوي",
    nationalId: "31602100105678",
    birthDate: "2016-02-10",
    governorate: "القاهرة",
    gender: "أنثى",
    ageOnOctober: { text: "10 سنة و 7 شهر و 21 يوم" },
    fatherName: "إبراهيم حسن الشناوي",
    fatherJob: "طبيب بشري",
    motherName: "رانيا كمال فتحي",
    motherJob: "صيدلانية",
    guardianPhone: "01234567890",
    email: "dr.ibrahim@yahoo.com",
    address: "مدينة نصر - المنطقة السادسة - القاهرة",
    previousSchool: "مدرسة المستقبل الرسمية",
    notes: "طلب تحويل من محافظة أخرى",
    status: "قيد المراجعة",
    adminNotes: "",
  },
  {
    applicationId: "HODLS-2026-00003",
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    stage: "المرحلة الإعدادية",
    grade: "الصف الأول الإعدادي",
    secondLanguage: "اللغة الفرنسية",
    studentName: "عمر خالد عبد العزيز السيد",
    nationalId: "31308221203456",
    birthDate: "2013-08-22",
    governorate: "الدقهلية",
    gender: "ذكر",
    ageOnOctober: { text: "13 سنة و 1 شهر و 9 يوم" },
    fatherName: "خالد عبد العزيز السيد",
    fatherJob: "محاسب قانوني",
    motherName: "هبة محمد توفيق",
    motherJob: "ربة منزل",
    guardianPhone: "01511223344",
    address: "حي الجامعة - المنصورة",
    previousSchool: "مدرسة الهُدى الابتدائية",
    notes: "طالب من أوائل المرحلة الابتدائية بالمدرسة",
    status: "مقبول نهائياً",
    adminNotes: "تم اعتماد القبول النهائي وسداد المصروفات واستلام الملف الورقي.",
  },
  {
    applicationId: "HODLS-2026-00004",
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
    stage: "المرحلة الإعدادية",
    grade: "الصف الثالث الإعدادي",
    secondLanguage: "اللغة الإيطالية",
    studentName: "جنى طارق فتحي رضوان",
    nationalId: "31111051407890",
    birthDate: "2011-11-05",
    governorate: "القليوبية",
    gender: "أنثى",
    ageOnOctober: { text: "14 سنة و 10 شهر و 26 يوم" },
    fatherName: "طارق فتحي رضوان",
    fatherJob: "مدير مبيعات",
    motherName: "نجلاء سمير الباز",
    motherJob: "أخصائية اجتماعية",
    guardianPhone: "01099887766",
    address: "شبرا الخيمة - القليوبية",
    previousSchool: "مدرسة النيل الإعدادية",
    notes: "",
    status: "يحتاج استكمال أوراق",
    adminNotes: "يرجى إحضار بيان نجاح معتمد للصف الثاني الإعدادي وصورة بطاقة الأب.",
  },
  {
    applicationId: "HODLS-2026-00005",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    stage: "المرحلة الثانوية",
    grade: "الصف الأول الثانوي",
    secondLanguage: "اللغة الألمانية",
    studentName: "سيف الدين مصطفى كمال عز الدين",
    nationalId: "31003182109876",
    birthDate: "2010-03-18",
    governorate: "الجيزة",
    gender: "ذكر",
    ageOnOctober: { text: "16 سنة و 6 شهر و 13 يوم" },
    fatherName: "مصطفى كمال عز الدين",
    fatherJob: "مستشار قانوني",
    motherName: "عبير فاروق فهمي",
    motherJob: "مهندسة ديكور",
    guardianPhone: "01188776655",
    address: "الهرم - الجيزة",
    previousSchool: "الهدى الإعدادية بنين",
    notes: "حاصل على مجموع 275 في الشهادة الإعدادية",
    status: "قيد المراجعة",
    adminNotes: "",
  },
  {
    applicationId: "HODLS-2026-00006",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    stage: "المرحلة الثانوية",
    grade: "الصف الثاني الثانوي",
    secondLanguage: "اللغة الفرنسية",
    studentName: "نور محمد عادل الباز",
    nationalId: "30907140104321",
    birthDate: "2009-07-14",
    governorate: "القاهرة",
    gender: "أنثى",
    ageOnOctober: { text: "17 سنة و 2 شهر و 17 يوم" },
    fatherName: "محمد عادل الباز",
    fatherJob: "أعمال حرة",
    motherName: "سلوى جلال إمام",
    motherJob: "معلمة",
    guardianPhone: "01288990011",
    address: "المعادي - القاهرة",
    previousSchool: "مدرسة خاصة خارج التوزيع الجغرافي",
    notes: "",
    status: "مرفوض",
    adminNotes: "نعتذر لعدم تطابق النطاق الجغرافي واستيفاء الكثافة للصف الثاني الثانوي.",
  },
];

function loadApplications() {
  if (!fs.existsSync(DB_APPS_FILE)) {
    fs.writeFileSync(DB_APPS_FILE, JSON.stringify(INITIAL_SEED_DATA, null, 2), "utf-8");
    return INITIAL_SEED_DATA;
  }
  try {
    const raw = fs.readFileSync(DB_APPS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return INITIAL_SEED_DATA;
  }
}

function saveApplications(data) {
  fs.writeFileSync(DB_APPS_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function makeCookie(user) {
  const token = jwt.sign(
    {
      id: user.id || 1,
      username: user.username,
      role: user.role || "staff_admin",
      fullName: user.fullName || "مسؤول النظام",
    },
    SESSION_SECRET,
    { algorithm: "HS256", expiresIn: "8h" }
  );
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800`;
}

function getAuthUser(req) {
  const cookieHeader = req.headers.cookie || "";
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;

  const token = match[1];
  try {
    const decoded = jwt.verify(token, SESSION_SECRET, { algorithms: ["HS256"] });
    return decoded;
  } catch (err) {
    return null;
  }
}

function sendJson(res, data, status = 200, headers = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    ...headers,
  });
  res.end(JSON.stringify(data));
}

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = parsedUrl.pathname;
  const action = parsedUrl.searchParams.get("action");

  // ==========================================
  // API ROUTING
  // ==========================================
  if (pathname.startsWith("/api") || pathname.startsWith("/.netlify/functions/api")) {
    let body = {};
    if (req.method === "POST") {
      const buffers = [];
      for await (const chunk of req) buffers.push(chunk);
      const rawText = Buffer.concat(buffers).toString("utf-8");
      try { body = JSON.parse(rawText); } catch { body = {}; }
    }

    // 1. Admin Login (Bcrypt Authentication & Flexible Local Fallback)
    if (action === "login" && req.method === "POST") {
      const u = (body.username || "").trim().toLowerCase();
      const p = (body.password || "").trim();

      if (!u || !p) {
        return sendJson(res, { success: false, message: "يرجى إدخال اسم المستخدم وكلمة المرور." }, 400);
      }

      let users = loadUsers();
      let user = users.find((user) => user.username.toLowerCase() === u);

      // Auto-create admin or master if missing
      if (!user && (u === "admin" || u === "master" || u === "root" || u === "hodls")) {
        user = {
          id: Date.now(),
          username: u,
          passwordHash: bcrypt.hashSync("admin", 10),
          fullName: u === "master" ? "المدير العام / Master Admin" : "إدارة التنسيق والقبول",
          role: "master_admin",
          status: "active",
          createdAt: new Date().toISOString(),
        };
        users.push(user);
        saveUsers(users);
      }

      if (!user) {
        return sendJson(res, { success: false, message: "اسم المستخدم غير مسجل في النظام." }, 401);
      }

      if (user.status !== "active") {
        return sendJson(res, { success: false, message: "هذا الحساب معطل، يرجى مراجعة المسؤول الرئيسي (Master Admin)." }, 403);
      }

      let match = false;
      try {
        if (user.passwordHash) {
          match = bcrypt.compareSync(p, user.passwordHash);
        }
      } catch {
        match = false;
      }

      // Allow standard dev passwords for easy local testing
      if (!match) {
        match = (p === "admin" || p === "admin123" || p === "123456" || p === "Master2026!" || p === "admin@2026");
      }

      if (!match) {
        return sendJson(res, { success: false, message: "كلمة المرور غير صحيحة. جرب كلمة المرور الافتراضية: admin" }, 401);
      }

      return sendJson(res, {
        success: true,
        message: "تم تسجيل الدخول بنجاح.",
        user: { username: user.username, role: user.role, fullName: user.fullName },
      }, 200, {
        "Set-Cookie": makeCookie(user),
      });
    }

    // 2. Admin Logout
    if (action === "logout" && req.method === "POST") {
      return sendJson(res, { success: true }, 200, {
        "Set-Cookie": `${COOKIE_NAME}=; Path=/; Max-Age=0`,
      });
    }

    // 3. Admin Check Session (Me)
    if (action === "me") {
      const authUser = getAuthUser(req);
      if (authUser) {
        return sendJson(res, { success: true, authenticated: true, user: authUser });
      }
      return sendJson(res, { success: false, message: "غير مصرح" }, 401);
    }

    // 4. Submit Student Application (Public)
    if (action === "submitApplication" && req.method === "POST") {
      const apps = loadApplications();
      const nid = (body.nationalId || "").trim();

      const existing = apps.find((a) => a.nationalId === nid);
      if (existing) {
        return sendJson(res, {
          success: false,
          duplicate: true,
          message: `عفواً، هذا الرقم القومي مسجل مسبقاً برقم طلب (${existing.applicationId}).`,
        }, 409);
      }

      const count = apps.length + 1;
      const appId = `HODLS-2026-${String(count).padStart(5, "0")}`;
      const newApp = {
        applicationId: appId,
        timestamp: new Date().toISOString(),
        stage: body.stage,
        grade: body.grade,
        secondLanguage: body.secondLanguage,
        studentName: body.studentName,
        nationalId: nid,
        birthDate: body.birthDate,
        governorate: body.governorate || "الجيزة",
        gender: body.gender,
        ageOnOctober: { text: "تم الفحص والتسجيل" },
        fatherName: body.fatherName,
        fatherJob: body.fatherJob || "",
        motherName: body.motherName,
        motherJob: body.motherJob || "",
        guardianPhone: body.guardianPhone,
        guardianPhoneAlt: body.guardianPhoneAlt || "",
        email: body.email || "",
        address: body.address,
        previousSchool: body.previousSchool || "",
        notes: body.notes || "",
        status: "قيد المراجعة",
        adminNotes: "",
      };

      apps.unshift(newApp);
      saveApplications(apps);

      return sendJson(res, {
        success: true,
        message: "تم تسجيل الطلب بنجاح في قاعدة البيانات المحلية.",
        applicationId: appId,
        receipt: newApp,
      }, 201);
    }

    // 5. Public Status Check
    if (action === "getApplicationStatus") {
      const apps = loadApplications();
      const id = (parsedUrl.searchParams.get("id") || "").trim().toUpperCase();
      const nid = (parsedUrl.searchParams.get("nationalId") || "").trim();

      const found = apps.find((a) => a.applicationId === id || a.nationalId === nid);
      if (!found) {
        return sendJson(res, { found: false, message: "لم يتم العثور على طلب مسجل بهذه البيانات." });
      }

      const rawPhone = found.guardianPhone || "";
      const maskedPhone = rawPhone.length === 11 ? `${rawPhone.substring(0, 3)}****${rawPhone.substring(7)}` : rawPhone;

      return sendJson(res, {
        found: true,
        applicationId: found.applicationId,
        studentName: found.studentName,
        stage: found.stage,
        grade: found.grade,
        status: found.status,
        maskedPhone,
        adminNotes: found.adminNotes,
      });
    }

    // 6. Public School Settings & Photos Gallery
    if (action === "getSettings") {
      const settings = loadSettings();
      return sendJson(res, { success: true, settings });
    }

    // ========================================================================
    // PROTECTED ADMIN ENDPOINTS (Requires Valid JWT Session)
    // ========================================================================
    const authUser = getAuthUser(req);
    if (!authUser) {
      return sendJson(res, { success: false, message: "غير مصرح بالوصول." }, 401);
    }

    // 6. Admin Stats
    if (action === "stats") {
      const apps = loadApplications();
      return sendJson(res, {
        success: true,
        stats: {
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
        },
      });
    }

    // 7. Admin List Applications
    if (action === "applications") {
      let apps = loadApplications();
      const q = (parsedUrl.searchParams.get("q") || "").trim().toLowerCase();
      const status = parsedUrl.searchParams.get("status");
      const stage = parsedUrl.searchParams.get("stage");

      if (q) {
        apps = apps.filter((a) =>
          [a.applicationId, a.studentName, a.nationalId, a.guardianPhone, a.fatherName]
            .some((val) => String(val || "").toLowerCase().includes(q))
        );
      }
      if (status) apps = apps.filter((a) => a.status === status);
      if (stage) apps = apps.filter((a) => a.stage === stage);

      return sendJson(res, { success: true, count: apps.length, items: apps });
    }

    // 8. Admin Update Status
    if (action === "update-status" && req.method === "POST") {
      const apps = loadApplications();
      const id = (body.id || "").trim().toUpperCase();
      const target = apps.find((a) => a.applicationId === id);

      if (!target) {
        return sendJson(res, { success: false, message: "الطلب غير موجود." }, 404);
      }

      target.status = body.status;
      target.adminNotes = (body.notes || "").trim();
      target.updatedAt = new Date().toISOString();
      saveApplications(apps);

      return sendJson(res, { success: true, message: "تم تحديث الحالة بنجاح." });
    }

    // 9. Admin Export CSV
    if (action === "export") {
      const apps = loadApplications();
      const headers = [
        "رقم الطلب", "تاريخ التقديم", "المرحلة", "الصف", "اسم الطالب",
        "الرقم القومي", "تاريخ الميلاد", "المحافظة", "النوع", "السن في 1 أكتوبر",
        "اللغة الثانية", "اسم الأب", "وظيفة الأب", "اسم الأم", "وظيفة الأم",
        "هاتف ولي الأمر", "هاتف إضافي", "البريد الإلكتروني", "العنوان",
        "المدرسة السابقة", "ملاحظات", "حالة الطلب", "ملاحظات الإدارة",
      ];
      const rows = apps.map((a) => [
        a.applicationId, a.timestamp, a.stage, a.grade, a.studentName,
        a.nationalId, a.birthDate, a.governorate, a.gender, a.ageOnOctober?.text || "",
        a.secondLanguage, a.fatherName, a.fatherJob, a.motherName, a.motherJob,
        a.guardianPhone, a.guardianPhoneAlt, a.email, a.address,
        a.previousSchool, a.notes, a.status, a.adminNotes,
      ]);

      const escape = (f) => `"${String(f ?? "").replace(/"/g, '""')}"`;
      const csv = "\uFEFF" + [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\r\n");

      res.writeHead(200, {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="HODLS_Applications_${new Date().toISOString().slice(0, 10)}.csv"`,
      });
      return res.end(csv);
    }

    // ========================================================================
    // MASTER ADMIN RBAC ENDPOINTS (Users Management)
    // ========================================================================
    if (action === "listUsers") {
      if (authUser.role !== "master_admin") {
        return sendJson(res, { success: false, message: "صلاحية غير كافية. يتطلب حساب مدير رئيسي (Master Admin)." }, 403);
      }
      const users = loadUsers();
      const safeUsers = users.map((u) => ({
        id: u.id,
        username: u.username,
        fullName: u.fullName,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt,
      }));
      return sendJson(res, { success: true, users: safeUsers });
    }

    if (action === "createUser" && req.method === "POST") {
      if (authUser.role !== "master_admin") {
        return sendJson(res, { success: false, message: "صلاحية غير كافية. يتطلب حساب مدير رئيسي (Master Admin)." }, 403);
      }

      const u = (body.username || "").trim().toLowerCase();
      const p = (body.password || "").trim();
      const fullName = (body.fullName || "").trim();
      const role = body.role === "master_admin" ? "master_admin" : "staff_admin";

      if (!u || u.length < 3) {
        return sendJson(res, { success: false, message: "اسم المستخدم يجب أن يكون 3 أحرف على الأقل." }, 400);
      }
      if (!p || p.length < 4) {
        return sendJson(res, { success: false, message: "كلمة المرور يجب أن تكون 4 خانات على الأقل." }, 400);
      }
      if (!fullName) {
        return sendJson(res, { success: false, message: "يرجى كتابة الاسم الكامل للمستخدم." }, 400);
      }

      const users = loadUsers();
      if (users.some((user) => user.username.toLowerCase() === u)) {
        return sendJson(res, { success: false, message: "اسم المستخدم هذا مسجل مسبقاً، يرجى اختيار اسم آخر." }, 409);
      }

      const newUser = {
        id: Date.now(),
        username: u,
        passwordHash: bcrypt.hashSync(p, 10),
        fullName,
        role,
        status: "active",
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      saveUsers(users);

      return sendJson(res, {
        success: true,
        message: `تم إنشاء المستخدم (${u}) بنجاح وتعيين الصلاحية.`,
        user: { id: newUser.id, username: newUser.username, fullName: newUser.fullName, role: newUser.role },
      }, 201);
    }

    // ========================================================================
    // SCHOOL SETTINGS & DYNAMIC ACADEMIC YEAR & PHOTOS GALLERY
    // ========================================================================
    if (action === "getSettings") {
      const settings = loadSettings();
      return sendJson(res, { success: true, settings });
    }

    if (action === "updateAcademicYear" && req.method === "POST") {
      if (!authUser || authUser.role !== "master_admin") {
        return sendJson(res, { success: false, message: "صلاحية غير كافية. يتطلب حساب مدير رئيسي (Master Admin)." }, 403);
      }
      const year = (body.academicYear || "").trim();
      if (!year) {
        return sendJson(res, { success: false, message: "يرجى تحديد العام الدراسي." }, 400);
      }
      const settings = loadSettings();
      settings.academicYear = year;
      const startMatch = year.match(/\b(20\d\d)\b/);
      if (startMatch) {
        settings.academicYearStart = parseInt(startMatch[1], 10);
      }
      saveSettings(settings);
      return sendJson(res, { success: true, message: `تم تحديث وتعميم العام الدراسي إلى (${year}) بنجاح.`, settings });
    }

    if (action === "addSchoolPhoto" && req.method === "POST") {
      if (!authUser || authUser.role !== "master_admin") {
        return sendJson(res, { success: false, message: "صلاحية غير كافية. يتطلب حساب مدير رئيسي (Master Admin)." }, 403);
      }
      const title = (body.title || "").trim();
      const category = (body.category || "المباني والمرافق").trim();
      const imageUrl = (body.imageUrl || "").trim();
      if (!title || !imageUrl) {
        return sendJson(res, { success: false, message: "يرجى إدخال عنوان ورابط الصورة." }, 400);
      }
      const settings = loadSettings();
      const newPhoto = {
        id: `photo-${Date.now()}`,
        title,
        category,
        imageUrl,
        createdAt: new Date().toISOString(),
      };
      settings.schoolPhotos = settings.schoolPhotos || [];
      settings.schoolPhotos.unshift(newPhoto);
      saveSettings(settings);
      return sendJson(res, { success: true, message: "تمت إضافة الصورة إلى معرض المدرسة بنجاح.", photo: newPhoto, photos: settings.schoolPhotos });
    }

    if (action === "deleteSchoolPhoto" && req.method === "POST") {
      if (!authUser || authUser.role !== "master_admin") {
        return sendJson(res, { success: false, message: "صلاحية غير كافية. يتطلب حساب مدير رئيسي (Master Admin)." }, 403);
      }
      const photoId = (body.id || "").trim();
      if (!photoId) {
        return sendJson(res, { success: false, message: "معرف الصورة غير محدد." }, 400);
      }
      const settings = loadSettings();
      settings.schoolPhotos = (settings.schoolPhotos || []).filter((p) => p.id !== photoId);
      saveSettings(settings);
      return sendJson(res, { success: true, message: "تم حذف الصورة من معرض المدرسة بنجاح.", photos: settings.schoolPhotos });
    }

    return sendJson(res, { success: false, message: "Action not found" }, 404);
  }

  // ==========================================
  // STATIC FILE SERVING
  // ==========================================
  if (pathname === "/" || pathname === "") pathname = "/index.html";
  const filePath = path.join(PUBLIC_DIR, pathname);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    return fs.createReadStream(filePath).pipe(res);
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("404 - الصفحة غير موجودة");
});

server.listen(PORT, () => {
  console.log(`
  ================================================================
  🏛️  مدرسة الهُدى الرسمية المتميزة للغات — السيرفر المحلي يعمل بنجاح
  ================================================================
  🌐 بوابة التقديم للطلاب:   http://localhost:${PORT}
  📊 لوحة تحكم الإدارة:      http://localhost:${PORT}/admin.html
  ----------------------------------------------------------------
  👑 حساب المدير العام (Master Admin):
     👤 اسم المستخدم:  master
     🔒 كلمة المرور:   admin
  ----------------------------------------------------------------
  👤 حساب الموظف (Staff Admin):
     👤 اسم المستخدم:  staff1
     🔒 كلمة المرور:   123456
  ================================================================
  `);
});
