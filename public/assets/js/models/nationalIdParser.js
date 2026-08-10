/**
 * Model: Smart Egyptian National ID Parser
 */
export const EGYPTIAN_GOVERNORATES = {
  "01": "القاهرة",
  "02": "الإسكندرية",
  "03": "بورسعيد",
  "04": "السويس",
  "11": "دمياط",
  "12": "الدقهلية",
  "13": "الشرقية",
  "14": "القليوبية",
  "15": "كفر الشيخ",
  "16": "الغربية",
  "17": "المنوفية",
  "18": "البحيرة",
  "19": "الإسماعيلية",
  "21": "الجيزة",
  "22": "بني سويف",
  "23": "الفيوم",
  "24": "المنيا",
  "25": "أسيوط",
  "26": "سوهاج",
  "27": "قنا",
  "28": "أسوان",
  "29": "الأقصر",
  "31": "البحر الأحمر",
  "32": "الوادي الجديد",
  "33": "مطروح",
  "34": "شمال سيناء",
  "35": "جنوب سيناء",
  "88": "المركز الرئيسي للمواليد بالخارج",
};

export function parseNationalId(nidString) {
  const nid = String(nidString || "").trim();
  if (!/^[0-9]{14}$/.test(nid)) {
    return { valid: false, message: "الرقم القومي يجب أن يتكون من 14 رقمًا صحيحًا." };
  }

  const centuryCode = nid[0];
  if (centuryCode !== "2" && centuryCode !== "3") {
    return { valid: false, message: "رمز القرن في الرقم القومي غير صحيح." };
  }

  const century = centuryCode === "2" ? 1900 : 2000;
  const year = century + parseInt(nid.substring(1, 3), 10);
  const month = parseInt(nid.substring(3, 5), 10);
  const day = parseInt(nid.substring(5, 7), 10);

  if (month < 1 || month > 12) {
    return { valid: false, message: "الشهر في الرقم القومي غير صحيح." };
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) {
    return { valid: false, message: "اليوم في الرقم القومي غير صحيح." };
  }

  const birthDateObj = new Date(year, month - 1, day);
  const now = new Date();
  if (birthDateObj > now) {
    return { valid: false, message: "تاريخ الميلاد لا يمكن أن يكون في المستقبل." };
  }

  const govCode = nid.substring(7, 9);
  const governorate = EGYPTIAN_GOVERNORATES[govCode] || "غير محدد";

  const genderDigit = parseInt(nid[12], 10);
  const gender = genderDigit % 2 !== 0 ? "ذكر" : "أنثى";

  const monthFormatted = String(month).padStart(2, "0");
  const dayFormatted = String(day).padStart(2, "0");
  const birthDateIso = `${year}-${monthFormatted}-${dayFormatted}`;

  // Age on October 1st
  const currentYear = now.getFullYear();
  const octFirst = new Date(currentYear, 9, 1);
  let ageYears = octFirst.getFullYear() - birthDateObj.getFullYear();
  let ageMonths = octFirst.getMonth() - birthDateObj.getMonth();
  let ageDays = octFirst.getDate() - birthDateObj.getDate();

  if (ageDays < 0) {
    ageMonths -= 1;
    const prevMonthDays = new Date(octFirst.getFullYear(), octFirst.getMonth(), 0).getDate();
    ageDays += prevMonthDays;
  }
  if (ageMonths < 0) {
    ageYears -= 1;
    ageMonths += 12;
  }

  return {
    valid: true,
    nationalId: nid,
    birthDate: birthDateIso,
    birthDateArabic: `${day} / ${month} / ${year}`,
    year,
    month,
    day,
    governorate,
    gender,
    ageYears,
    ageMonths,
    ageDays,
    ageText: `${ageYears} سنة و ${ageMonths} شهر و ${ageDays} يوم`,
  };
}
