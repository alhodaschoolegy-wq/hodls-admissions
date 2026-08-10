/**
 * View: Multi-Step Registration Wizard View
 */
export class WizardView {
  constructor({ formId, stepsContainerId, progressBarId, indicatorsContainerId }) {
    this.form = document.getElementById(formId);
    this.steps = document.querySelectorAll(".wizard-step");
    this.progressBar = document.getElementById(progressBarId);
    this.indicators = document.querySelectorAll(".step-indicator");
    this.totalSteps = this.steps.length;
    this.currentStep = 1;
  }

  goToStep(stepNumber) {
    if (stepNumber < 1 || stepNumber > this.totalSteps) return;

    this.steps.forEach((step, idx) => {
      const isCurrent = idx + 1 === stepNumber;
      step.classList.toggle("active", isCurrent);
    });

    this.indicators.forEach((indicator, idx) => {
      const stepIdx = idx + 1;
      indicator.classList.remove("active", "completed");
      if (stepIdx === stepNumber) {
        indicator.classList.add("active");
      } else if (stepIdx < stepNumber) {
        indicator.classList.add("completed");
      }
    });

    if (this.progressBar) {
      const progressPercent = ((stepNumber - 1) / (this.totalSteps - 1)) * 100;
      this.progressBar.style.width = `${progressPercent}%`;
    }

    this.currentStep = stepNumber;

    // Smooth scroll to form top
    const formTop = document.getElementById("registration");
    if (formTop) {
      const yOffset = -90;
      const y = formTop.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }

  next() {
    this.goToStep(this.currentStep + 1);
  }

  prev() {
    this.goToStep(this.currentStep - 1);
  }

  renderReview(data, nidData) {
    const reviewContainer = document.getElementById("reviewSummary");
    if (!reviewContainer) return;

    const escape = (s) => String(s ?? "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
    }[m]));

    reviewContainer.innerHTML = `
      <div class="review-card">
        <div class="review-section">
          <h4><i class="fa-solid fa-graduation-cap text-gold" style="margin-left:6px;"></i> المرحلة والصف الدراسي</h4>
          <div class="review-grid">
            <div class="review-item"><label>المرحلة:</label><strong>${escape(data.stage)}</strong></div>
            <div class="review-item"><label>الصف:</label><strong>${escape(data.grade)}</strong></div>
            <div class="review-item"><label>اللغة الثانية:</label><strong>${escape(data.secondLanguage)}</strong></div>
          </div>
        </div>

        <div class="review-section">
          <h4><i class="fa-solid fa-user text-emerald" style="margin-left:6px;"></i> بيانات الطالب</h4>
          <div class="review-grid">
            <div class="review-item full"><label>الاسم بالكامل:</label><strong>${escape(data.studentName)}</strong></div>
            <div class="review-item"><label>الرقم القومي:</label><strong>${escape(data.nationalId)}</strong></div>
            <div class="review-item"><label>تاريخ الميلاد:</label><strong>${escape(nidData?.birthDateArabic || data.birthDate)}</strong></div>
            <div class="review-item"><label>النوع:</label><strong>${escape(nidData?.gender || data.gender)}</strong></div>
            <div class="review-item"><label>المحافظة:</label><strong>${escape(nidData?.governorate || "—")}</strong></div>
            <div class="review-item full"><label>العمر في 1 أكتوبر:</label><strong>${escape(nidData?.ageText || "—")}</strong></div>
          </div>
        </div>

        <div class="review-section">
          <h4><i class="fa-solid fa-users text-gold" style="margin-left:6px;"></i> بيانات ولي الأمر والاتصال</h4>
          <div class="review-grid">
            <div class="review-item"><label>اسم الأب:</label><strong>${escape(data.fatherName)}</strong></div>
            <div class="review-item"><label>وظيفة الأب:</label><strong>${escape(data.fatherJob || "—")}</strong></div>
            <div class="review-item"><label>اسم الأم:</label><strong>${escape(data.motherName)}</strong></div>
            <div class="review-item"><label>وظيفة الأم:</label><strong>${escape(data.motherJob || "—")}</strong></div>
            <div class="review-item"><label>رقم هاتف ولي الأمر:</label><strong dir="ltr">${escape(data.guardianPhone)}</strong></div>
            <div class="review-item"><label>رقم هاتف بديل:</label><strong dir="ltr">${escape(data.guardianPhoneAlt || "—")}</strong></div>
            <div class="review-item full"><label>البريد الإلكتروني:</label><strong>${escape(data.email || "—")}</strong></div>
          </div>
        </div>

        <div class="review-section">
          <h4><i class="fa-solid fa-location-dot text-emerald" style="margin-left:6px;"></i> العنوان والبيانات الإضافية</h4>
          <div class="review-grid">
            <div class="review-item full"><label>العنوان بالتفصيل:</label><strong>${escape(data.address)}</strong></div>
            <div class="review-item"><label>المدرسة السابقة:</label><strong>${escape(data.previousSchool || "—")}</strong></div>
            <div class="review-item full"><label>ملاحظات إضافية:</label><strong>${escape(data.notes || "لا توجد")}</strong></div>
          </div>
        </div>
      </div>
    `;
  }

  showNationalIdBadge(info) {
    const badge = document.getElementById("nidSmartBadge");
    if (!badge) return;

    if (info && info.valid) {
      badge.style.display = "block";
      badge.className = "nid-badge valid";
      badge.innerHTML = `
        <div class="badge-head">
          <span class="badge-icon">✓</span>
          <strong>تم التحقق التلقائي من الرقم القومي</strong>
        </div>
        <div class="badge-body">
          <div><span>تاريخ الميلاد:</span> <b>${info.birthDateArabic}</b></div>
          <div><span>النوع:</span> <b>${info.gender}</b></div>
          <div><span>المحافظة:</span> <b>${info.governorate}</b></div>
          <div><span>العمر في 1 أكتوبر 2026:</span> <b class="highlight">${info.ageText}</b></div>
        </div>
      `;
    } else if (info && !info.valid) {
      badge.style.display = "block";
      badge.className = "nid-badge invalid";
      badge.innerHTML = `
        <div class="badge-head">
          <span class="badge-icon">✕</span>
          <strong>${info.message || "الرقم القومي غير صالح"}</strong>
        </div>
      `;
    } else {
      badge.style.display = "none";
    }
  }

  showGlobalAlert(msg, type = "info") {
    const alertBox = document.getElementById("formAlert");
    if (!alertBox) return;
    alertBox.className = `alert-box alert-${type}`;
    alertBox.innerHTML = msg;
    alertBox.style.display = "block";
  }

  clearGlobalAlert() {
    const alertBox = document.getElementById("formAlert");
    if (alertBox) alertBox.style.display = "none";
  }
}
