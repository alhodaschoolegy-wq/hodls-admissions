import { createClient } from "@supabase/supabase-js";

let supabaseClient = null;

/**
 * Get or initialize Supabase PostgreSQL Singleton Client
 */
export function getSupabase() {
  if (supabaseClient) return supabaseClient;

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
      supabaseClient = createClient(url.trim(), key.trim(), {
        auth: { persistSession: false },
        db: { schema: "public" },
        global: {
          headers: { "x-application-name": "hodls-admissions-engine" },
        },
      });
      return supabaseClient;
    } catch (e) {
      console.error("Database connection initialization error:", e);
    }
  }
  return null;
}

/**
 * In-Memory Resilient State (Fallback & Cache)
 */
export const MEMORY_STATE = {
  settings: {
    academicYear: "2026 / 2027",
    academicYearStart: 2026,
    parentEditsEnabled: true,
    parentEditDeadline: "2026-08-31T23:59:59.000Z",
    schoolName: "مدرسة الهُدى الرسمية المتميزة للغات",
    categoryVisibility: {
      "المباني والمرافق": true,
      "المعامل التكنولوجية": true,
      "الفصول الدراسية": true,
      "رياض الأطفال": true,
      "الأنشطة والملاعب": true,
      "المسرح والفعاليات": true,
      "المكتبة والثقافة": true,
    },
    sectionVisibility: {
      gallery: true,
      rules: true,
      registration: true,
      tracking: true,
      contact: true,
    },
    schoolPhotos: [
      {
        id: "photo-1",
        title: "المبنى المدرسي والواجهة الرئيسية لمدرسة الهُدى",
        category: "المباني والمرافق",
        imageUrl: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1200&q=80",
        createdAt: new Date().toISOString()
      },
      {
        id: "photo-2",
        title: "فناء الطابور الصباحي والمساحات الخضراء والأنشطة",
        category: "المباني والمرافق",
        imageUrl: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=80",
        createdAt: new Date().toISOString()
      },
      {
        id: "photo-3",
        title: "معامل الحاسب الآلي والبرمجة والروبوتيكس المتطورة",
        category: "المعامل التكنولوجية",
        imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
        createdAt: new Date().toISOString()
      },
      {
        id: "photo-4",
        title: "معامل العلوم والاستكشاف وتجارب الكيمياء والأحياء",
        category: "المعامل التكنولوجية",
        imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80",
        createdAt: new Date().toISOString()
      },
      {
        id: "photo-5",
        title: "الفصول الدراسية الذكية والشاشات التفاعلية الحديثة",
        category: "الفصول الدراسية",
        imageUrl: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80",
        createdAt: new Date().toISOString()
      },
      {
        id: "photo-6",
        title: "فصول رياض الأطفال والأنشطة الإبداعية والتعليم المبكر",
        category: "رياض الأطفال",
        imageUrl: "https://images.unsplash.com/photo-1587691592099-24045742c181?auto=format&fit=crop&w=1200&q=80",
        createdAt: new Date().toISOString()
      },
      {
        id: "photo-7",
        title: "الملاعب الرياضية المتعددة وملاعب كرة القدم والسلة",
        category: "الأنشطة والملاعب",
        imageUrl: "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80",
        createdAt: new Date().toISOString()
      },
      {
        id: "photo-8",
        title: "المسرح المدرسي وقاعة الاحتفالات وتكريم الطلاب المتفوقين",
        category: "المسرح والفعاليات",
        imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
        createdAt: new Date().toISOString()
      },
      {
        id: "photo-9",
        title: "المكتبة المدرسية الشاملة ومركز مصادر التعلم والبحث",
        category: "المكتبة والثقافة",
        imageUrl: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80",
        createdAt: new Date().toISOString()
      }
    ]
  },
  applications: [
    {
      id: 1,
      applicationId: "HODLS-2026-00001",
      studentName: "يوسف أحمد محمود عبد الله",
      nationalId: "31805150102456",
      birthDate: "2018-05-15",
      governorate: "القاهرة",
      gender: "ذكر",
      ageOnOctober: { years: 8, months: 4, days: 16, text: "8 سنوات و 4 أشهر و 16 يوماً" },
      stage: "المرحلة الابتدائية",
      grade: "الصف الأول الابتدائي",
      secondLanguage: "اللغة الفرنسية",
      fatherName: "أحمد محمود عبد الله",
      fatherJob: "مهندس اتصالات",
      motherName: "منى سمير عبد الرحمن",
      motherJob: "معلمة لغة إنجليزية",
      guardianPhone: "01012345678",
      guardianPhoneAlt: "01123456789",
      email: "ahmed.abdallah@example.com",
      address: "شارع الطيران، مدينة نصر، القاهرة",
      previousSchool: "روضة براعم المستقبل",
      notes: "تم سداد رسوم التقديم وحجز موعد المقابلة",
      status: "مقبول مبدئياً",
      adminNotes: "تم اجتياز المقابلة المبدئية بنجاح، يرجى التوجه لتسليم الأوراق",
      timestamp: new Date().toISOString()
    },
    {
      id: 2,
      applicationId: "HODLS-2026-00002",
      studentName: "مريم حسام الدين مصطفى",
      nationalId: "31908200109874",
      birthDate: "2019-08-20",
      governorate: "الجيزة",
      gender: "أنثى",
      ageOnOctober: { years: 7, months: 1, days: 11, text: "7 سنوات وشهر و 11 يوماً" },
      stage: "المرحلة الابتدائية",
      grade: "الصف الأول الابتدائي",
      secondLanguage: "اللغة الألمانية",
      fatherName: "حسام الدين مصطفى كمال",
      fatherJob: "محاسب قانوني",
      motherName: "هبة الله سعيد إبراهيم",
      motherJob: "طبيبة صيدلانية",
      guardianPhone: "01234567890",
      guardianPhoneAlt: "01098765432",
      email: "hossam.mostafa@example.com",
      address: "الدقي، محافظة الجيزة",
      previousSchool: "حضانة الزهور الدولية",
      notes: "يرجى التنسيق للفترة الصباحية",
      status: "قيد المراجعة",
      adminNotes: "الملف قيد الفحص بواسطة لجنة شؤون الطلاب",
      timestamp: new Date(Date.now() - 3600000).toISOString()
    }
  ],
  users: [
    {
      id: 1,
      username: "master",
      passwordHash: "$2a$10$w8T0M4j6lH5rL2Hj1a2.3e5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0",
      fullName: "المدير العام / Master Admin",
      role: "master_admin",
      status: "active",
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      username: "admin",
      passwordHash: "$2a$10$w8T0M4j6lH5rL2Hj1a2.3e5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0",
      fullName: "إدارة التنسيق والقبول",
      role: "staff_admin",
      status: "active",
      createdAt: new Date().toISOString()
    }
  ]
};
