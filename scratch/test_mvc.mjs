import { parseEgyptianNationalId } from "../api/utils/nationalId.js";
import { ApplicationModel } from "../api/models/ApplicationModel.js";
import { AdminSessionModel } from "../api/models/AdminSessionModel.js";
import { sign, verifySignature } from "../api/utils/security.js";

console.log("=== Testing Egyptian National ID Parser ===");
const testNid = "31805152101234";
const parsed = parseEgyptianNationalId(testNid);
console.log("Parsed result:", parsed);

if (parsed.valid && parsed.governorate === "الجيزة" && parsed.gender === "ذكر" && parsed.birthDate === "2018-05-15") {
  console.log("✅ National ID parser passed!");
} else {
  console.error("❌ National ID parser failed!");
}

console.log("\n=== Testing Security & Cookie Signature ===");
const payload = "admin.123456789";
const signature = sign(payload);
const verified = verifySignature(payload, signature);
console.log("Signature valid:", verified);

console.log("\n=== Testing Vercel Admin Authentication ===");
process.env.ADMIN_USERNAME = "hodls_director";
process.env.ADMIN_PASSWORD = "SchoolMasterPassword2026!";

const mockReq = { headers: new Headers({ "x-forwarded-for": "127.0.0.1" }) };
const authSuccess = AdminSessionModel.authenticate(mockReq, "hodls_director", "SchoolMasterPassword2026!");
console.log("Auth success:", authSuccess.success, "user:", authSuccess.username);

console.log("\n=== Testing Application Creation (Memory Fallback) ===");
const testAppInput = {
  stage: "المرحلة الابتدائية",
  grade: "الصف الأول الابتدائي",
  studentName: "كريم أحمد مصطفى سالم",
  nationalId: testNid,
  secondLanguage: "اللغة الفرنسية",
  fatherName: "أحمد مصطفى سالم",
  motherName: "منى سمير عبد الرحمن",
  guardianPhone: "01099887766",
  address: "مدينة نصر - القاهرة",
};

const createRes = await ApplicationModel.create(testAppInput);
console.log("Created Application ID:", createRes.application?.applicationId);

const fetched = await ApplicationModel.findById(createRes.application?.applicationId);
console.log("Fetched Application:", fetched?.studentName, "Status:", fetched?.status);

if (createRes.success && fetched && fetched.studentName === testAppInput.studentName) {
  console.log("✅ Vercel MVC Stack tested and verified successfully!");
} else {
  console.error("❌ Test failed!");
}
