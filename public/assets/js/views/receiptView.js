/**
 * View: Official Printable Admission Receipt
 */
export class ReceiptView {
  static renderReceipt(receipt) {
    const modal = document.getElementById("receiptModal");
    const container = document.getElementById("receiptContent");
    if (!modal || !container) return;

    const escape = (s) => String(s ?? "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
    }[m]));

    const dateFormatted = new Date(receipt.timestamp).toLocaleString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    container.innerHTML = `
      <div class="official-receipt" id="printableReceipt">
        <!-- Receipt Header -->
        <div class="receipt-header">
            <div class="receipt-logo-wrap">
              <img src="logo.png" onerror="this.onerror=null; this.src='school-logo.svg';" alt="شعار المدرسة" class="receipt-logo">
            </div>
          <div class="receipt-school-title">
            <h3>جمهورية مصر العربية — وزارة التربية والتعليم</h3>
            <h2>مدرسة الهُدى الرسمية المتميزة للغات</h2>
            <p>Al-Hoda Official Distinguished Language School (H-O-D-L-S)</p>
            <div class="receipt-badge">إشعار استلام طلب تقديم إلكتروني — العام الدراسي 2026 / 2027</div>
          </div>
        </div>

        <!-- Application Barcode & ID Banner -->
        <div class="receipt-id-banner">
          <div class="app-number-block">
            <small>رقم الطلب الرسمي</small>
            <div class="app-number">${escape(receipt.applicationId)}</div>
          </div>
          <div class="barcode-wrap">
            <div class="barcode-visual">
              <span class="bar b1"></span><span class="bar b2"></span><span class="bar b3"></span>
              <span class="bar b1"></span><span class="bar b4"></span><span class="bar b2"></span>
              <span class="bar b3"></span><span class="bar b1"></span><span class="bar b4"></span>
              <span class="bar b2"></span><span class="bar b1"></span><span class="bar b3"></span>
            </div>
            <small class="barcode-text">${escape(receipt.applicationId)}</small>
          </div>
        </div>

        <!-- Details Grid -->
        <div class="receipt-table-wrap">
          <table class="receipt-table">
            <tbody>
              <tr>
                <th>اسم الطالب الرباعي:</th>
                <td colspan="3"><strong>${escape(receipt.studentName)}</strong></td>
              </tr>
              <tr>
                <th>الرقم القومي:</th>
                <td><strong dir="ltr">${escape(receipt.nationalId)}</strong></td>
                <th>تاريخ الميلاد:</th>
                <td>${escape(receipt.birthDate)}</td>
              </tr>
              <tr>
                <th>المرحلة الدراسية:</th>
                <td><strong>${escape(receipt.stage)}</strong></td>
                <th>الصف الدراسي:</th>
                <td><strong>${escape(receipt.grade)}</strong></td>
              </tr>
              <tr>
                <th>النوع:</th>
                <td>${escape(receipt.gender)}</td>
                <th>اللغة الثانية:</th>
                <td>${escape(receipt.secondLanguage)}</td>
              </tr>
              <tr>
                <th>المحافظة:</th>
                <td>${escape(receipt.governorate || "—")}</td>
                <th>السن في 1 أكتوبر:</th>
                <td>${escape(receipt.ageText || "—")}</td>
              </tr>
              <tr>
                <th>اسم ولي الأمر:</th>
                <td>${escape(receipt.fatherName)}</td>
                <th>هاتف التواصل:</th>
                <td><strong dir="ltr">${escape(receipt.guardianPhone)}</strong></td>
              </tr>
              <tr>
                <th>تاريخ وساعة التقديم:</th>
                <td>${dateFormatted}</td>
                <th>حالة الطلب الحالية:</th>
                <td><span class="receipt-status-tag">${escape(receipt.status || "قيد المراجعة")}</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Official Instructions -->
        <div class="receipt-instructions">
          <h4>تعليمات هامة لولي الأمر:</h4>
          <ol>
            <li>يُرجى طباعة هذا الإشعار والاحتفاظ برقم الطلب (<strong>${escape(receipt.applicationId)}</strong>) لمتابعة التنسيق وإعلان النتائج.</li>
            <li>تقديم هذا الطلب إلكترونياً يُعد تسجيلاً مبدئياً ولا يُعتبر قبولاً نهائياً إلا بعد استيفاء الشروط والمقابلة وفحص الملف الورقي.</li>
            <li>سيتم إعلان مواعيد تقديم الملفات الورقية والمقابلات عبر البوابة الإلكترونية وصفحة المدرسة الرسمية.</li>
          </ol>
        </div>

        <!-- Signatures & Stamp -->
        <div class="receipt-footer-signatures">
          <div class="sig-box">
            <span>توقيع ولي الأمر</span>
            <div class="sig-line">........................................</div>
          </div>
          <div class="sig-box stamp-box">
            <div class="official-stamp">
              <span>خاتم لجنة التنسيق</span>
              <small>HODLS 2026/2027</small>
            </div>
          </div>
          <div class="sig-box">
            <span>مسؤول شؤون الطلاب</span>
            <div class="sig-line">........................................</div>
          </div>
        </div>
      </div>

      <!-- Action Buttons (Hidden on Print) -->
      <div class="receipt-actions-bar no-print">
        <button class="btn btn-gold btn-large" onclick="window.print()">
          <i class="fa-solid fa-print" style="margin-left:6px;"></i> طباعة الاستمارة الرسمية (PDF)
        </button>
        <button class="btn btn-outline btn-large" onclick="ReceiptView.closeReceipt()">
          إغلاق ومتابعة
        </button>
      </div>
    `;

    modal.classList.add("show");
  }

  static closeReceipt() {
    const modal = document.getElementById("receiptModal");
    if (modal) modal.classList.remove("show");
  }
}

window.ReceiptView = ReceiptView;
