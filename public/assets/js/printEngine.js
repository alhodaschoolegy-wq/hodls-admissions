/**
 * ============================================================================
 * HODLS School Official A4 Admission Dossier Print Engine
 * Guaranteed 100% Single-Page A4 Precision Layout for All Browsers
 * ============================================================================
 */

export function generateDossierHtml(receipt) {
  const escape = (s) => String(s ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  }[m]));

  const dateStr = receipt.timestamp ? new Date(receipt.timestamp).toLocaleDateString("ar-EG", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
  }) : new Date().toLocaleDateString("ar-EG");

  return `
<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <title>استمارة تقديم - ${escape(receipt.applicationId)} - ${escape(receipt.studentName)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=IBM+Plex+Sans+Arabic:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 6mm 8mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      background: #fff;
      color: #000;
      font-family: "IBM Plex Sans Arabic", "Cairo", sans-serif;
      font-size: 11px;
      line-height: 1.35;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .a4-page {
      width: 100%;
      max-width: 194mm;
      min-height: 275mm;
      max-height: 282mm;
      margin: 0 auto;
      border: 2px solid #04381e;
      border-radius: 6px;
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .header-grid {
      display: grid;
      grid-template-columns: 1.2fr auto 1.1fr;
      align-items: center;
      border-bottom: 2px solid #04381e;
      padding-bottom: 8px;
      margin-bottom: 8px;
      text-align: center;
      gap: 10px;
    }
    .ministry-info {
      text-align: right;
      font-size: 10px;
      line-height: 1.4;
    }
    .ministry-info strong {
      display: block;
      font-size: 12px;
      color: #04381e;
    }
    .center-brand img {
      width: 58px;
      height: 58px;
      object-fit: contain;
    }
    .center-brand h2 {
      font-size: 13.5px;
      color: #04381e;
      margin-top: 2px;
      font-family: "Cairo", sans-serif;
      font-weight: 800;
      white-space: nowrap;
    }
    .center-brand small {
      color: #9e7b14;
      font-weight: 800;
      font-size: 10px;
    }
    .meta-info {
      text-align: left;
      font-size: 10px;
      line-height: 1.4;
    }
    .app-badge {
      display: inline-block;
      background: #edf5f0;
      border: 1px solid #087a3c;
      color: #04381e;
      font-weight: 900;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
    }
    .banner-bar {
      background: #f8faf9;
      border: 1px solid #c9dcd1;
      border-radius: 4px;
      padding: 4px 10px;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
    }
    .banner-bar strong {
      color: #04381e;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
      font-size: 10.5px;
    }
    table.data-table th, table.data-table td {
      border: 1px solid #7c9887;
      padding: 3.5px 7px;
      text-align: right;
      line-height: 1.35;
    }
    table.data-table th {
      background: #edf5f0;
      color: #04381e;
      font-weight: 800;
      width: 18%;
      white-space: nowrap;
    }
    table.data-table td strong {
      color: #000;
    }
    .table-section-title {
      background: #04381e !important;
      color: #fff !important;
      font-weight: 800;
      font-size: 11px;
      text-align: center !important;
      padding: 3px !important;
    }
    .checklist-box {
      border: 1px dashed #7c9887;
      background: #fafcfb;
      border-radius: 4px;
      padding: 5px 8px;
      margin-bottom: 7px;
      font-size: 9.5px;
      line-height: 1.35;
    }
    .checklist-box h4 {
      font-size: 10.5px;
      color: #04381e;
      margin-bottom: 2px;
    }
    .checklist-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 2px 8px;
    }
    .check-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .checkbox-sq {
      display: inline-block;
      width: 9px;
      height: 9px;
      border: 1.5px solid #333;
      border-radius: 2px;
    }
    .pledge-box {
      font-size: 9.5px;
      color: #222;
      background: #fffdf5;
      border: 1px solid #e8dbad;
      border-radius: 4px;
      padding: 4px 8px;
      margin-bottom: 8px;
      line-height: 1.35;
    }
    .signatures-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      text-align: center;
      font-size: 10px;
      padding-top: 2px;
    }
    .sig-col span {
      font-weight: 800;
      color: #04381e;
    }
    .sig-space {
      height: 22px;
      margin-top: 2px;
      border-bottom: 1px dotted #888;
    }
    .stamp-circle {
      border: 1.5px dashed #9e7b14;
      border-radius: 50%;
      width: 54px;
      height: 54px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #9e7b14;
      font-size: 8px;
      font-weight: 900;
      transform: rotate(-6deg);
    }
    .no-print-toolbar {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #04381e;
      padding: 10px 20px;
      border-radius: 999px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      display: flex;
      gap: 12px;
      z-index: 10000;
    }
    .btn-print {
      background: #c9a227;
      color: #fff;
      border: 0;
      padding: 8px 20px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 13px;
      cursor: pointer;
    }
    .btn-close {
      background: rgba(255,255,255,0.2);
      color: #fff;
      border: 0;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
    }
    @media print {
      .no-print-toolbar { display: none !important; }
      body { margin: 0; padding: 0; }
      .a4-page {
        border: 2px solid #000;
        min-height: auto;
        height: 275mm;
        margin: 0 auto;
      }
    }
  </style>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
</head>
<body>

  <div class="no-print-toolbar">
    <button class="btn-print" onclick="window.print()"><i class="fa-solid fa-print"></i> طباعة الآن (Print / PDF)</button>
    <button class="btn-close" onclick="window.close()"><i class="fa-solid fa-xmark"></i> إغلاق النافذة</button>
  </div>

  <div class="a4-page">
    <!-- Header -->
    <div class="header-grid">
      <div class="ministry-info">
        <strong>جمهورية مصر العربية</strong>
        <div>وزارة التربية والتعليم والتعليم الفني</div>
        <div>مديرية التربية والتعليم</div>
        <div>إدارة التعليم المتميز واللغات</div>
        <strong>مدرسة الهُدى الرسمية المتميزة للغات</strong>
      </div>

      <div class="center-brand">
        <img src="logo.png" onerror="this.onerror=null; this.src='school-logo.svg';" alt="شعار المدرسة">
        <h2>استمارة تقديم إلكتروني رسمية</h2>
        <small>العام الدراسي 2026 / 2027</small>
      </div>

      <div class="meta-info">
        <div>رقم الطلب المعتمد:</div>
        <div class="app-badge">${escape(receipt.applicationId)}</div>
        <div style="margin-top:3px; font-size:9.5px; color:#444;">تاريخ التسجيل: ${escape(dateStr)}</div>
        <div style="margin-top:1px; font-size:9.5px; color:#444;">حالة الطلب: <strong>${escape(receipt.status || "قيد المراجعة")}</strong></div>
      </div>
    </div>

    <!-- Banner -->
    <div class="banner-bar">
      <span><strong>ملف الالتحاق والتنسيق الإلكتروني المعتمد</strong></span>
      <span>الرقم القومي للطالب: <strong dir="ltr">${escape(receipt.nationalId)}</strong></span>
    </div>

    <!-- Table 1: Student & Preferences -->
    <table class="data-table">
      <tr>
        <th colspan="4" class="table-section-title">أولاً: بيانات الطالب والرغبة الدراسية</th>
      </tr>
      <tr>
        <th>اسم الطالب رباعياً:</th>
        <td colspan="3"><strong>${escape(receipt.studentName)}</strong></td>
      </tr>
      <tr>
        <th>الرقم القومي:</th>
        <td><strong dir="ltr">${escape(receipt.nationalId)}</strong></td>
        <th>تاريخ الميلاد:</th>
        <td><strong>${escape(receipt.birthDate)}</strong></td>
      </tr>
      <tr>
        <th>النوع:</th>
        <td><strong>${escape(receipt.gender)}</strong></td>
        <th>المحافظة:</th>
        <td><strong>${escape(receipt.governorate || "الجيزة")}</strong></td>
      </tr>
      <tr>
        <th>السن في 1 أكتوبر 2026:</th>
        <td><strong>${escape(receipt.ageText || receipt.ageOnOctober?.text || "مستوفى")}</strong></td>
        <th>المرحلة والصف:</th>
        <td><strong>${escape(receipt.stage)} — ${escape(receipt.grade)}</strong></td>
      </tr>
      <tr>
        <th>اللغة الأجنبية الثانية:</th>
        <td colspan="3"><strong>${escape(receipt.secondLanguage)}</strong></td>
      </tr>
    </table>

    <!-- Table 2: Parents & Address -->
    <table class="data-table">
      <tr>
        <th colspan="4" class="table-section-title">ثانياً: بيانات ولي الأمر والسكن</th>
      </tr>
      <tr>
        <th>اسم الأب:</th>
        <td><strong>${escape(receipt.fatherName)}</strong></td>
        <th>وظيفة الأب:</th>
        <td><strong>${escape(receipt.fatherJob || "—")}</strong></td>
      </tr>
      <tr>
        <th>اسم الأم:</th>
        <td><strong>${escape(receipt.motherName || "—")}</strong></td>
        <th>وظيفة الأم:</th>
        <td><strong>${escape(receipt.motherJob || "—")}</strong></td>
      </tr>
      <tr>
        <th>هاتف ولي الأمر:</th>
        <td><strong dir="ltr">${escape(receipt.guardianPhone)}</strong></td>
        <th>هاتف بديل:</th>
        <td><strong dir="ltr">${escape(receipt.guardianPhoneAlt || "—")}</strong></td>
      </tr>
      <tr>
        <th>العنوان بالتفصيل:</th>
        <td colspan="3"><strong>${escape(receipt.address)}</strong></td>
      </tr>
      <tr>
        <th>المدرسة السابقة:</th>
        <td>${escape(receipt.previousSchool || "—")}</td>
        <th>البريد الإلكتروني:</th>
        <td>${escape(receipt.email || "—")}</td>
      </tr>
      ${receipt.adminNotes ? `
      <tr>
        <th>ملاحظات الإدارة:</th>
        <td colspan="3" style="color:#04381e; font-weight:700;">${escape(receipt.adminNotes)}</td>
      </tr>` : ""}
    </table>

    <!-- Checklist -->
    <div class="checklist-box">
      <h4><i class="fa-solid fa-clipboard-list" style="color:#087a3c;"></i> الأوراق والمستندات المطلوبة للتقديم الورقي بالمدرسة:</h4>
      <div class="checklist-grid">
        <div class="check-item"><span class="checkbox-sq"></span> أصل شهادة الميلاد الكمبيوتر الحديثة + 3 صور.</div>
        <div class="check-item"><span class="checkbox-sq"></span> عدد 6 صور شخصية حديثة للطفل بخلفية بيضاء (4x6).</div>
        <div class="check-item"><span class="check-box-square"></span> صورة بطاقة الرقم القومي لولي الأمر سارية + إيصال مرافق.</div>
        <div class="check-item"><span class="checkbox-sq"></span> البطاقة الصحية للطفل معتمدة من التأمين الصحي.</div>
        <div class="check-item"><span class="checkbox-sq"></span> طباعة هذا الإشعار الإلكتروني وإرفاقه في حافظة بلاستيك.</div>
        <div class="check-item"><span class="checkbox-sq"></span> إقرار التعهد والتوقيعات أدناه مستوفاة.</div>
      </div>
    </div>

    <!-- Guardian Pledge -->
    <div class="pledge-box">
      <strong>إقرار ولي الأمر:</strong> أقر أنا ولي أمر الطالب المذكور بعاليه بأن كافة البيانات المدونة بهذه الاستمارة صحيحة ومطابقة للمستندات الرسمية، وأتعهد بالحضور إلى المدرسة لتقديم الملف الورقي وإجراء المقابلة في الموعد المحدد عند إعلان نتيجة التنسيق، وفي حالة عدم الحضور أو عدم صحة البيانات يعتبر الطلب لاغياً.
    </div>

    <!-- Signatures & Stamp -->
    <div class="signatures-grid">
      <div class="sig-col">
        <span>توقيع ولي الأمر</span>
        <div class="sig-space"></div>
      </div>
      <div class="sig-col">
        <span>مسؤول شؤون الطلاب</span>
        <div class="sig-space"></div>
      </div>
      <div class="sig-col">
        <div class="stamp-circle">
          <span>خاتم المدرسة</span>
          <span>شؤون الطلبة</span>
        </div>
      </div>
      <div class="sig-col">
        <span>يعتمد، مدير المدرسة</span>
        <div class="sig-space"></div>
      </div>
    </div>
  </div>

  <script>
    window.addEventListener("load", () => {
      setTimeout(() => {
        window.print();
      }, 400);
    });
  </script>
</body>
</html>
  `;
}

export function printDossierInWindow(receipt) {
  const html = generateDossierHtml(receipt);
  const printWindow = window.open("", "_blank", "width=850,height=1050");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    // Fallback if popup blocker is active: print in current window
    window.print();
  }
}
