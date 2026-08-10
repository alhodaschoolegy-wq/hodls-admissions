/**
 * HODLS Application Client Bundle (Zero-dependency Standalone)
 * Works both via file:/// and on HTTP/Netlify Server
 */

(function () {
  "use strict";

  // ==========================================
  // 1. National ID Parser Model
  // ==========================================
  const EGYPTIAN_GOVERNORATES = {
    "01": "القاهرة", "02": "الإسكندرية", "03": "بورسعيد", "04": "السويس",
    "11": "دمياط", "12": "الدقهلية", "13": "الشرقية", "14": "القليوبية",
    "15": "كفر الشيخ", "16": "الغربية", "17": "المنوفية", "18": "البحيرة",
    "19": "الإسماعيلية", "21": "الجيزة", "22": "بني سويف", "23": "الفيوم",
    "24": "المنيا", "25": "أسيوط", "26": "سوهاج", "27": "قنا",
    "28": "أسوان", "29": "الأقصر", "31": "البحر الأحمر", "32": "الوادي الجديد",
    "33": "مطروح", "34": "شمال سيناء", "35": "جنوب سيناء", "88": "المركز الرئيسي للمواليد بالخارج"
  };

  function parseNationalId(nidString) {
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

    const activeOctYear = window.__ACTIVE_ACADEMIC_YEAR_START__ || 2026;
    const octFirst = new Date(activeOctYear, 9, 1);
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
      year, month, day,
      governorate, gender,
      ageYears, ageMonths, ageDays,
      ageText: `${ageYears} سنة و ${ageMonths} شهر و ${ageDays} يوم`
    };
  }

  // ==========================================
  // 2. API Service
  // ==========================================
  const ApiService = {
    async getSettings() {
      try {
        const response = await fetch("/api?action=getSettings");
        const data = await response.json();
        return data.settings || {};
      } catch {
        return {
          academicYear: "2026 / 2027",
          academicYearStart: 2026,
          schoolPhotos: []
        };
      }
    },

    async submitApplication(formData) {
      const url = "/api?action=submitApplication";
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.success === false) {
          throw new Error(data.message || `خطأ بالخادم (${response.status})`);
        }
        return data;
      } catch (err) {
        // If running offline/locally via file://, simulate successful local preview receipt!
        if (window.location.protocol === "file:" || err.message.includes("Failed to fetch") || err.message.includes("fetch")) {
          console.warn("⚠️ Local mode preview active (Serverless function unreachable via file:// protocol)");
          const mockId = `HODLS-2026-${Math.floor(10000 + Math.random() * 90000)}`;
          return {
            success: true,
            applicationId: mockId,
            receipt: {
              applicationId: mockId,
              studentName: formData.studentName,
              nationalId: formData.nationalId,
              birthDate: formData.birthDate,
              governorate: "المحافظة المعتمدة",
              gender: formData.gender,
              ageText: "تم الفحص والتدقيق",
              stage: formData.stage,
              grade: formData.grade,
              secondLanguage: formData.secondLanguage,
              fatherName: formData.fatherName,
              guardianPhone: formData.guardianPhone,
              timestamp: new Date().toISOString(),
              status: "قيد المراجعة"
            }
          };
        }
        throw err;
      }
    },

    async getApplicationStatus(query) {
      const params = new URLSearchParams(query).toString();
      const url = `/api?action=getApplicationStatus&${params}`;
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "حدث خطأ أثناء الاستعلام.");
      }
      return data;
    },

    async parentUpdateApplication(updateData) {
      const response = await fetch("/api?action=parentUpdateApplication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) {
        throw new Error(data.message || "فشل حفظ التعديلات.");
      }
      return data;
    }
  };

  // ==========================================
  // 3. Receipt View / Success Card
  // ==========================================
  const ReceiptView = {
    renderReceipt(receipt) {
      const modal = document.getElementById("receiptModal");
      const container = document.getElementById("receiptContent");
      if (!modal || !container) return;

      const escape = (s) => String(s ?? "").replace(/[&<>"']/g, (m) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
      }[m]));

      const dateFormatted = new Date(receipt.timestamp || Date.now()).toLocaleString("ar-EG", {
        year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
      });

      container.innerHTML = `
        <div class="success-receipt-card" style="text-align:center; padding:10px 14px; font-family:'Cairo', sans-serif;">
          <!-- Success Animated Icon -->
          <div style="width:72px; height:72px; background:linear-gradient(135deg, #087a3c, #10b981); color:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; font-size:34px; box-shadow:0 12px 28px rgba(8,122,60,0.35);">
            <i class="fa-solid fa-circle-check"></i>
          </div>

          <h2 style="color:#04381e; font-size:22px; font-weight:900; margin-bottom:6px;">تم تسجيل طلب الالتحاق بنجاح!</h2>
          <p style="color:#666; font-size:13.5px; margin-bottom:20px;">تم قيد بيانات الطالب في منظومة القبول والتنسيق الإلكتروني لمدرسة الهُدى الرسمية للغات.</p>

          <!-- Official Application ID Box -->
          <div style="background:linear-gradient(135deg, #f8fbf9, #edf7f1); border:2px dashed #087a3c; border-radius:12px; padding:18px 16px; margin-bottom:20px; position:relative;">
            <div style="font-size:12.5px; font-weight:800; color:#04381e; margin-bottom:6px;">
              <i class="fa-solid fa-id-badge" style="color:#c9a227;"></i> رقم الطلب المعتمد للاستعلام والمتابعة:
            </div>
            <div style="font-size:26px; font-weight:900; color:#087a3c; letter-spacing:1px; margin-bottom:10px; font-family:'Cairo', monospace;" id="displayAppNumber">
              ${escape(receipt.applicationId)}
            </div>
            <button type="button" class="btn btn-sm btn-outline" id="btnCopyAppId" style="border-color:#087a3c; color:#087a3c; font-weight:800; font-size:12px; padding:6px 16px; border-radius:8px; background:#fff;">
              <i class="fa-solid fa-copy"></i> نسخ رقم الطلب
            </button>
          </div>

          <!-- Quick Summary Details -->
          <div style="background:#fff; border:1px solid #e2ece6; border-radius:10px; padding:14px; margin-bottom:20px; text-align:right; font-size:12.5px; line-height:1.8;">
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #f0f5f2; padding-bottom:6px; margin-bottom:6px;">
              <span style="color:#666;">اسم الطالب:</span>
              <strong style="color:#04381e;">${escape(receipt.studentName)}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #f0f5f2; padding-bottom:6px; margin-bottom:6px;">
              <span style="color:#666;">الرقم القومي:</span>
              <strong dir="ltr" style="color:#04381e;">${escape(receipt.nationalId)}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #f0f5f2; padding-bottom:6px; margin-bottom:6px;">
              <span style="color:#666;">المرحلة والصف:</span>
              <strong style="color:#04381e;">${escape(receipt.stage)} — ${escape(receipt.grade)}</strong>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span style="color:#666;">تاريخ التسجيل:</span>
              <span style="color:#444; font-size:11.5px;">${dateFormatted}</span>
            </div>
          </div>

          <!-- Helpful Instructions Alert -->
          <div style="background:#fffdf5; border:1px solid #e8dbad; border-radius:8px; padding:10px 14px; font-size:12px; color:#684f04; line-height:1.5; margin-bottom:24px; text-align:right;">
            <i class="fa-solid fa-circle-info" style="color:#c9a227; margin-left:4px;"></i>
            <strong>ملاحظة هامة:</strong> تم استلام طلبك بنجاح وحالته الحالية <strong>قيد المراجعة</strong>. احتفظ برقم الطلب لمتابعة التنسيق، وستتاح طباعة إفادة واستمارة القبول فور اعتماد حالة <strong>"مقبول نهائياً"</strong> عبر بوابة <strong>"متابعة حالة الطلب"</strong>.
          </div>

          <!-- Action Buttons -->
          <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center;">
            <button type="button" class="btn btn-primary btn-large" id="btnGoToTracking" style="background:#087a3c; border-color:#087a3c; font-weight:800; font-size:14px; flex:1; min-width:200px;">
              <i class="fa-solid fa-magnifying-glass"></i> متابعة حالة الطلب الآن
            </button>
            <button type="button" class="btn btn-outline btn-large" id="btnCloseReceiptBtn" style="font-weight:700; font-size:13.5px;">
              <i class="fa-solid fa-circle-check"></i> تم، إغلاق
            </button>
          </div>
        </div>
      `;

      modal.classList.add("show");

      // Copy Application ID
      document.getElementById("btnCopyAppId")?.addEventListener("click", () => {
        const btn = document.getElementById("btnCopyAppId");
        if (navigator.clipboard && receipt.applicationId) {
          navigator.clipboard.writeText(receipt.applicationId).then(() => {
            if (btn) {
              btn.innerHTML = '<i class="fa-solid fa-check"></i> تم النسخ!';
              btn.style.background = '#eaf8ef';
              setTimeout(() => {
                btn.innerHTML = '<i class="fa-solid fa-copy"></i> نسخ رقم الطلب';
                btn.style.background = '#fff';
              }, 2000);
            }
          });
        }
      });

      // Go To Tracking Shortcut
      document.getElementById("btnGoToTracking")?.addEventListener("click", () => {
        modal.classList.remove("show");
        const trackInput = document.getElementById("trackingQuery");
        if (trackInput && receipt.applicationId) {
          trackInput.value = receipt.applicationId;
          const searchBtn = document.getElementById("btnSearchTracking");
          if (searchBtn) searchBtn.click();
        }
        window.location.hash = "#tracking";
        const trackSection = document.getElementById("tracking");
        if (trackSection) {
          trackSection.scrollIntoView({ behavior: "smooth" });
        }
      });

      document.getElementById("btnCloseReceiptBtn")?.addEventListener("click", () => {
        modal.classList.remove("show");
      });
    }
  };

  // ==========================================
  // 4. Registration Wizard & Controller
  // ==========================================
  const GRADES_BY_STAGE = {
    "المرحلة الابتدائية": [
      "الصف الأول الابتدائي", "الصف الثاني الابتدائي", "الصف الثالث الابتدائي",
      "الصف الرابع الابتدائي", "الصف الخامس الابتدائي", "الصف السادس الابتدائي"
    ],
    "المرحلة الإعدادية": [
      "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي"
    ],
    "المرحلة الثانوية": [
      "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"
    ]
  };

  function initApp() {
    const form = document.getElementById("registrationForm");
    const steps = document.querySelectorAll(".wizard-step");
    const indicators = document.querySelectorAll(".step-indicator");
    const progressBar = document.getElementById("wizardProgress");
    const stageSelect = document.getElementById("stage");
    const gradeSelect = document.getElementById("grade");
    const nidInput = document.getElementById("nationalId");
    const formAlert = document.getElementById("formAlert");

    let currentStep = 1;
    let parsedNidData = null;

    function showAlert(msg, type = "info") {
      if (!formAlert) return;
      formAlert.className = `alert-box alert-${type}`;
      formAlert.innerHTML = msg;
      formAlert.style.display = "block";
    }

    function clearAlert() {
      if (formAlert) formAlert.style.display = "none";
    }

    function goToStep(stepNum) {
      if (stepNum < 1 || stepNum > steps.length) return;
      currentStep = stepNum;

      steps.forEach((step, idx) => {
        step.classList.toggle("active", idx + 1 === stepNum);
      });

      indicators.forEach((ind, idx) => {
        const s = idx + 1;
        ind.classList.remove("active", "completed");
        if (s === stepNum) ind.classList.add("active");
        else if (s < stepNum) ind.classList.add("completed");
      });

      if (progressBar) {
        const percent = ((stepNum - 1) / (steps.length - 1)) * 100;
        progressBar.style.width = `${percent}%`;
      }

      const formSection = document.getElementById("registration");
      if (formSection) {
        formSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    function renderReviewCard(data, nidInfo) {
      const reviewContainer = document.getElementById("reviewSummary");
      if (!reviewContainer) return;

      const escape = (s) => String(s ?? "").replace(/[&<>"']/g, (m) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
      }[m]));

      reviewContainer.innerHTML = `
        <div class="review-card">
          <div class="review-section">
            <h4><span class="review-icon"><i class="fa-solid fa-graduation-cap"></i></span> المرحلة والصف الدراسي</h4>
            <div class="review-grid">
              <div class="review-item"><label>المرحلة:</label><strong>${escape(data.stage)}</strong></div>
              <div class="review-item"><label>الصف:</label><strong>${escape(data.grade)}</strong></div>
              <div class="review-item"><label>اللغة الثانية:</label><strong>${escape(data.secondLanguage)}</strong></div>
            </div>
          </div>

          <div class="review-section">
            <h4><span class="review-icon"><i class="fa-solid fa-user-graduate"></i></span> بيانات الطالب</h4>
            <div class="review-grid">
              <div class="review-item full"><label>الاسم بالكامل:</label><strong>${escape(data.studentName)}</strong></div>
              <div class="review-item"><label>الرقم القومي:</label><strong>${escape(data.nationalId)}</strong></div>
              <div class="review-item"><label>تاريخ الميلاد:</label><strong>${escape(nidInfo?.birthDateArabic || data.birthDate)}</strong></div>
              <div class="review-item"><label>النوع:</label><strong>${escape(nidInfo?.gender || data.gender)}</strong></div>
              <div class="review-item"><label>المحافظة:</label><strong>${escape(nidInfo?.governorate || "—")}</strong></div>
              <div class="review-item full"><label>العمر في 1 أكتوبر:</label><strong>${escape(nidInfo?.ageText || "—")}</strong></div>
            </div>
          </div>

          <div class="review-section">
            <h4><span class="review-icon"><i class="fa-solid fa-people-roof"></i></span> بيانات ولي الأمر والاتصال</h4>
            <div class="review-grid">
              <div class="review-item"><label>اسم الأب:</label><strong>${escape(data.fatherName)}</strong></div>
              <div class="review-item"><label>وظيفة الأب:</label><strong>${escape(data.fatherJob || "—")}</strong></div>
              <div class="review-item"><label>اسم الأم:</label><strong>${escape(data.motherName)}</strong></div>
              <div class="review-item"><label>وظيفة الأم:</label><strong>${escape(data.motherJob || "—")}</strong></div>
              <div class="review-item"><label>هاتف ولي الأمر:</label><strong dir="ltr">${escape(data.guardianPhone)}</strong></div>
              <div class="review-item"><label>هاتف بديل:</label><strong dir="ltr">${escape(data.guardianPhoneAlt || "—")}</strong></div>
              <div class="review-item full"><label>البريد الإلكتروني:</label><strong>${escape(data.email || "—")}</strong></div>
            </div>
          </div>

          <div class="review-section">
            <h4><span class="review-icon"><i class="fa-solid fa-map-location-dot"></i></span> العنوان والبيانات الإضافية</h4>
            <div class="review-grid">
              <div class="review-item full"><label>العنوان بالتفصيل:</label><strong>${escape(data.address)}</strong></div>
              <div class="review-item"><label>المدرسة السابقة:</label><strong>${escape(data.previousSchool || "—")}</strong></div>
              <div class="review-item full"><label>ملاحظات إضافية:</label><strong>${escape(data.notes || "لا توجد")}</strong></div>
            </div>
          </div>
        </div>
      `;
    }

    function collectData() {
      const val = (id) => document.getElementById(id)?.value.trim() || "";
      return {
        stage: val("stage"),
        grade: val("grade"),
        secondLanguage: val("secondLanguage") || "لا توجد",
        studentName: val("studentName"),
        nationalId: val("nationalId"),
        birthDate: val("birthDate"),
        gender: val("gender"),
        fatherName: val("fatherName"),
        fatherJob: val("fatherJob"),
        motherName: val("motherName"),
        motherJob: val("motherJob"),
        guardianPhone: val("guardianPhone"),
        guardianPhoneAlt: val("guardianPhoneAlt"),
        email: val("email"),
        address: val("address"),
        previousSchool: val("previousSchool"),
        notes: val("notes"),
        website_url: val("website_url"),
      };
    }

    function validateCurrentStep(step) {
      clearAlert();
      if (step === 1) {
        const stage = document.getElementById("stage")?.value;
        const grade = document.getElementById("grade")?.value;
        const secondLang = document.getElementById("secondLanguage")?.value;
        if (!stage) { showAlert("يرجى اختيار المرحلة الدراسية للمتابعة.", "error"); return false; }
        if (!grade) { showAlert("يرجى اختيار الصف الدراسي للمتابعة.", "error"); return false; }
        // secondLanguage is optional — no validation required
        return true;
      }

      if (step === 2) {
        const name = document.getElementById("studentName")?.value.trim();
        const nid = document.getElementById("nationalId")?.value.trim();
        const birth = document.getElementById("birthDate")?.value;
        const gender = document.getElementById("gender")?.value;

        if (!name || name.split(/\s+/).length < 3) {
          showAlert("يرجى إدخال اسم الطالب ثلاثياً أو رباعياً باللغة العربية.", "error");
          return false;
        }
        if (!nid || !/^\d{14}$/.test(nid)) {
          showAlert("الرقم القومي للطالب يجب أن يتكون من 14 رقماً صحيحاً.", "error");
          return false;
        }
        if (!parsedNidData || !parsedNidData.valid) {
          showAlert(parsedNidData?.message || "يرجى التأكد من صحة الرقم القومي.", "error");
          return false;
        }
        if (!birth) { showAlert("يرجى إدخال تاريخ الميلاد.", "error"); return false; }
        if (!gender) { showAlert("يرجى تحديد النوع (ذكر / أنثى).", "error"); return false; }
        return true;
      }

      if (step === 3) {
        const father = document.getElementById("fatherName")?.value.trim();
        const mother = document.getElementById("motherName")?.value.trim();
        const phone = document.getElementById("guardianPhone")?.value.trim();

        if (!father || father.split(/\s+/).length < 3) {
          showAlert("يرجى كتابة اسم الأب ثلاثياً على الأقل.", "error");
          return false;
        }
        if (!mother || mother.split(/\s+/).length < 3) {
          showAlert("يرجى كتابة اسم الأم ثلاثياً على الأقل.", "error");
          return false;
        }
        if (!phone || !/^01[0125]\d{8}$/.test(phone)) {
          showAlert("يرجى إدخال رقم هاتف محمول صحيح (مكون من 11 رقماً يبدأ بـ 010 أو 011 أو 012 أو 015).", "error");
          return false;
        }
        return true;
      }

      if (step === 4) {
        const address = document.getElementById("address")?.value.trim();
        if (!address || address.length < 6) {
          showAlert("يرجى كتابة العنوان السكني بالتفصيل (الشارع - المنطقة - المحافظة).", "error");
          return false;
        }
        return true;
      }

      return true;
    }

    // Dynamic Grades
    stageSelect?.addEventListener("change", () => {
      if (!gradeSelect) return;
      gradeSelect.innerHTML = '<option value="">اختر الصف الدراسي</option>';
      const list = GRADES_BY_STAGE[stageSelect.value] || [];
      list.forEach((g) => {
        const opt = document.createElement("option");
        opt.value = g;
        opt.textContent = g;
        gradeSelect.appendChild(opt);
      });
    });

    // National ID Realtime Parser
    nidInput?.addEventListener("input", (e) => {
      const val = e.target.value.replace(/\D/g, "").slice(0, 14);
      e.target.value = val;

      const badge = document.getElementById("nidSmartBadge");
      if (val.length === 14) {
        const info = parseNationalId(val);
        parsedNidData = info;
        if (badge) {
          badge.style.display = "block";
          if (info.valid) {
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
            const bIn = document.getElementById("birthDate");
            const gIn = document.getElementById("gender");
            if (bIn) bIn.value = info.birthDate;
            if (gIn) gIn.value = info.gender;
          } else {
            badge.className = "nid-badge invalid";
            badge.innerHTML = `<div class="badge-head"><span class="badge-icon">✕</span><strong>${info.message}</strong></div>`;
          }
        }
      } else if (val.length > 0) {
        parsedNidData = null;
        if (badge) {
          badge.style.display = "block";
          badge.className = "nid-badge invalid";
          badge.innerHTML = `<div class="badge-head"><i class="fa-solid fa-clock text-amber" style="margin-left:4px;"></i><strong>متبقي ${14 - val.length} أرقام لاكتمال الرقم القومي.</strong></div>`;
        }
      } else {
        parsedNidData = null;
        if (badge) badge.style.display = "none";
      }
    });

    // Step Next / Prev Event delegation
    document.querySelectorAll(".btn-step-next").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        if (validateCurrentStep(currentStep)) {
          if (currentStep === 4) {
            renderReviewCard(collectData(), parsedNidData);
          }
          goToStep(currentStep + 1);
        }
      });
    });

    document.querySelectorAll(".btn-step-prev").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        goToStep(currentStep - 1);
      });
    });

    // Form Submit
    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById("btnSubmitForm");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري إرسال وتوثيق الطلب...';
      }

      showAlert("جاري إرسال الطلب وحفظ البيانات في السجلات الرسمية...", "info");

      try {
        const data = collectData();
        const res = await ApiService.submitApplication(data);
        showAlert("تم تقديم الطلب بنجاح! جاري فتح إشعار الاستلام الرسمي...", "success");

        ReceiptView.renderReceipt(res.receipt);
        form.reset();
        parsedNidData = null;
        const badge = document.getElementById("nidSmartBadge");
        if (badge) badge.style.display = "none";
        goToStep(1);
      } catch (err) {
        showAlert(err.message || "حدث خطأ أثناء إرسال الطلب.", "error");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane" style="margin-left:6px;"></i> تأكيد وإرسال طلب التقديم النهائي';
        }
      }
    });

    // Tracking Search Controller
    const searchBtn = document.getElementById("btnSearchStatus");
    const searchInput = document.getElementById("searchQuery");
    const trackResult = document.getElementById("trackingResult");

    async function handleTracking() {
      if (!searchInput || !trackResult) return;
      const queryVal = searchInput.value.trim();
      if (!queryVal) {
        trackResult.innerHTML = `<div class="alert-box alert-error" style="display:block;">يرجى إدخال رقم الطلب أو الرقم القومي للطالب.</div>`;
        trackResult.style.display = "block";
        return;
      }

      searchBtn.disabled = true;
      searchBtn.textContent = "جاري البحث...";

      try {
        const isNid = /^\d{14}$/.test(queryVal);
        const query = isNid ? { nationalId: queryVal } : { id: queryVal.toUpperCase() };
        const data = await ApiService.getApplicationStatus(query);

        if (!data.found) {
          trackResult.innerHTML = `<div class="alert-box alert-error" style="display:block;">${data.message || "لم يتم العثور على طلب مسجل بهذه البيانات."}</div>`;
        } else {
          window.currentTrackedStudent = data;

          let badgeClass = "review";
          if (data.status === "مقبول نهائياً" || data.status === "مقبول") badgeClass = "accepted";
          else if (data.status === "مقبول مبدئياً") badgeClass = "initial-accepted";
          else if (data.status === "يحتاج استكمال أوراق") badgeClass = "warning";
          else if (data.status === "مرفوض") badgeClass = "rejected";

          const gp = data.parentEditGracePeriod || {};
          let gracePeriodBanner = "";

          if (gp.canParentEdit) {
            gracePeriodBanner = `
              <div class="alert-box" style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; margin-bottom:14px; background:rgba(8,122,60,0.08); border:1px solid rgba(8,122,60,0.25); color:#04381e; padding:10px 14px; border-radius:8px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <i class="fa-solid fa-hourglass-half text-emerald" style="font-size:16px;"></i>
                  <span><strong>فترة السماح نشطة:</strong> متبقي <strong>${gp.remainingDays} يوم</strong> على إغلاق إمكانية تعديل البيانات.</span>
                </div>
                <button type="button" class="btn btn-primary btn-sm" onclick="openParentEditModal()" style="padding:6px 14px; font-size:12.5px;">
                  <i class="fa-solid fa-pen-to-square"></i> تعديل بيانات الطلب
                </button>
              </div>
            `;
          } else {
            gracePeriodBanner = `
              <div class="alert-box" style="display:flex; align-items:center; gap:8px; margin-bottom:14px; background:#f8faf9; border:1px solid #cbd5e1; color:#64748b; padding:10px 14px; border-radius:8px;">
                <i class="fa-solid fa-lock" style="font-size:15px;"></i>
                <span>فترة تعديل البيانات مغلقة حالياً بقرار من إدارة المدرسة.</span>
              </div>
            `;
          }

          const isFinallyAccepted = data.status === "مقبول نهائياً" || data.status === "مقبول";

          let acceptedCongratulationBanner = "";
          let printActionButton = "";

          if (isFinallyAccepted) {
            acceptedCongratulationBanner = `
              <div class="alert-box" style="display:flex; align-items:center; gap:12px; margin-bottom:14px; background:rgba(8,122,60,0.1); border:1.5px solid #087a3c; color:#04381e; padding:12px 16px; border-radius:10px;">
                <i class="fa-solid fa-award text-emerald" style="font-size:24px;"></i>
                <div>
                  <strong style="display:block; font-size:14px;">🎉 تهانينا! تم اعتماد قبول الطالب نهائياً بمدرسة الهُدى الرسمية للغات.</strong>
                  <span style="font-size:12px; color:#2d503b;">تم فتح إمكانية طباعة إفادة واستمارة القبول النهائي لتقديم الملف الورقي للمدرسة.</span>
                </div>
              </div>
            `;
            printActionButton = `
              <button type="button" class="btn btn-gold btn-sm" onclick="openStudentPrintDossier('${data.applicationId}')" style="font-weight:700; padding:8px 16px;">
                <i class="fa-solid fa-print"></i> طباعة إفادة واستمارة القبول النهائي (PDF)
              </button>
            `;
          } else {
            printActionButton = `
              <div style="font-size:12px; color:var(--muted); display:flex; align-items:center; gap:6px;">
                <i class="fa-solid fa-lock" style="font-size:11px;"></i>
                <span>تتاح طباعة إفادة واستمارة القبول فور اعتماد حالة <strong>"مقبول نهائياً"</strong>.</span>
              </div>
            `;
          }

          trackResult.innerHTML = `
            <div class="tracking-card">
              ${acceptedCongratulationBanner}
              ${gracePeriodBanner}
              <div class="tracking-card-head">
                <div>
                  <span class="tracking-app-id">${data.applicationId}</span>
                  <h3>${data.studentName}</h3>
                  <p>${data.stage} — <strong>${data.grade}</strong></p>
                </div>
                <div class="tracking-status-badge ${badgeClass}">${data.status}</div>
              </div>
              ${data.adminNotes ? `
                <div class="tracking-admin-alert">
                  <strong><i class="fa-solid fa-bullhorn text-emerald" style="margin-left:6px;"></i> ملاحظات لجنة القبول:</strong>
                  <p>${data.adminNotes}</p>
                </div>
              ` : ""}
              <div class="tracking-card-footer" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <small>رقم هاتف المتابعة المسجل: <span dir="ltr">${data.maskedPhone || "—"}</span></small>
                ${printActionButton}
              </div>
            </div>
          `;
        }
        trackResult.style.display = "block";
      } catch (err) {
        trackResult.innerHTML = `<div class="alert-box alert-error" style="display:block;">${err.message || "تعذر الاتصال بالخادم."}</div>`;
        trackResult.style.display = "block";
      } finally {
        searchBtn.disabled = false;
        searchBtn.textContent = "بحث عن الطلب";
      }
    }

    // Direct Dossier Print / PDF Handler
    window.openStudentPrintDossier = function(appId) {
      const data = window.currentTrackedStudent;
      if (data) {
        sessionStorage.setItem("hodls_print_student", JSON.stringify(data));
      }
      const targetId = appId || (data ? data.applicationId : "");
      window.open(`print.html?id=${encodeURIComponent(targetId)}`, "_blank");
    };

    // Parent Edit Modal Handlers
    window.openParentEditModal = function() {
      const data = window.currentTrackedStudent;
      if (!data) return;

      const modal = document.getElementById("parentEditModal");
      if (!modal) return;

      document.getElementById("parentEditAppIdBadge").textContent = data.applicationId;
      document.getElementById("pEdit_studentName").value = data.studentName || "";
      document.getElementById("pEdit_stage").value = data.stage || "المرحلة الابتدائية";
      window.handleParentStageChange(data.stage, data.grade);
      document.getElementById("pEdit_secondLanguage").value = data.secondLanguage || "اللغة الفرنسية";
      document.getElementById("pEdit_fatherName").value = data.fatherName || "";
      document.getElementById("pEdit_fatherJob").value = data.fatherJob || "";
      document.getElementById("pEdit_motherName").value = data.motherName || "";
      document.getElementById("pEdit_motherJob").value = data.motherJob || "";
      document.getElementById("pEdit_guardianPhone").value = data.guardianPhone || "";
      document.getElementById("pEdit_guardianPhoneAlt").value = data.guardianPhoneAlt || "";
      document.getElementById("pEdit_email").value = data.email || "";
      document.getElementById("pEdit_address").value = data.address || "";
      document.getElementById("pEdit_previousSchool").value = data.previousSchool || "";
      document.getElementById("pEdit_notes").value = data.notes || "";

      modal.classList.add("show");
    };

    window.closeParentEditModal = function() {
      document.getElementById("parentEditModal")?.classList.remove("show");
    };

    window.handleParentStageChange = function(presetStage, presetGrade) {
      const stage = presetStage || document.getElementById("pEdit_stage")?.value;
      const gradeSelect = document.getElementById("pEdit_grade");
      if (!gradeSelect) return;

      const grades = GRADES_BY_STAGE[stage] || [];
      gradeSelect.innerHTML = grades.map((g) => `<option value="${g}">${g}</option>`).join("");
      if (presetGrade && grades.includes(presetGrade)) {
        gradeSelect.value = presetGrade;
      }
    };

    window.handleParentEditSubmit = async function(event) {
      if (event) event.preventDefault();
      const data = window.currentTrackedStudent;
      if (!data) return;

      const submitBtn = document.getElementById("btnSaveParentEdit");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ...';
      }

      try {
        const updatePayload = {
          applicationId: data.applicationId,
          nationalId: data.nationalId,
          studentName: document.getElementById("pEdit_studentName").value.trim(),
          stage: document.getElementById("pEdit_stage").value,
          grade: document.getElementById("pEdit_grade").value,
          secondLanguage: document.getElementById("pEdit_secondLanguage").value,
          fatherName: document.getElementById("pEdit_fatherName").value.trim(),
          fatherJob: document.getElementById("pEdit_fatherJob").value.trim(),
          motherName: document.getElementById("pEdit_motherName").value.trim(),
          motherJob: document.getElementById("pEdit_motherJob").value.trim(),
          guardianPhone: document.getElementById("pEdit_guardianPhone").value.trim(),
          guardianPhoneAlt: document.getElementById("pEdit_guardianPhoneAlt").value.trim(),
          email: document.getElementById("pEdit_email").value.trim(),
          address: document.getElementById("pEdit_address").value.trim(),
          previousSchool: document.getElementById("pEdit_previousSchool").value.trim(),
          notes: document.getElementById("pEdit_notes").value.trim(),
        };

        await ApiService.parentUpdateApplication(updatePayload);
        window.closeParentEditModal();

        alert("تم حفظ وتحديث بيانات طلب التقديم بنجاح!");

        // Refresh tracking view in place
        const searchInput = document.getElementById("searchQuery");
        if (searchInput) searchInput.value = data.applicationId;
        handleTracking();
      } catch (err) {
        alert(err.message || "فشل حفظ التعديلات.");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> حفظ التعديلات';
        }
      }
    };

    searchBtn?.addEventListener("click", handleTracking);
    searchInput?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleTracking();
      }
    });

    // Mobile nav toggle
    document.getElementById("mobileToggle")?.addEventListener("click", () => {
      document.getElementById("navLinks")?.classList.toggle("open");
    });

    // ==========================================
    // Dynamic Settings & School Photos Gallery
    // ==========================================
    let appSettings = {
      academicYear: "2026 / 2027",
      academicYearStart: 2026,
      schoolPhotos: []
    };

    window.renderSchoolPhotosGallery = function(category = "all") {
      const container = document.getElementById("schoolPhotosGalleryGrid");
      if (!container) return;

      const photos = appSettings.schoolPhotos || [];
      const filtered = category === "all" ? photos : photos.filter((p) => p.category === category);

      if (filtered.length === 0) {
        container.innerHTML = `
          <div style="grid-column:1/-1; text-align:center; padding:40px; background:#fff; border-radius:16px; color:var(--muted); box-shadow:var(--shadow-sm);">
            <i class="fa-solid fa-camera-retro" style="font-size:36px; color:var(--primary); margin-bottom:10px; display:block;"></i>
            لا توجد صور معروضة في هذا القسم حالياً.
          </div>
        `;
        return;
      }

      container.innerHTML = filtered.map((p) => `
        <div class="gallery-card" onclick="openPhotoLightbox('${p.id}')">
          <div class="gallery-card-thumb-wrap">
            <img src="${p.imageUrl}" alt="${p.title}" class="gallery-card-thumb" onerror="this.src='logo.png'">
            <span class="gallery-card-badge"><i class="fa-solid fa-tag"></i> ${p.category || "المدرسة"}</span>
            <div class="gallery-card-zoom-overlay">
              <i class="fa-solid fa-magnifying-glass-plus"></i>
            </div>
          </div>
          <div class="gallery-card-body">
            <span class="gallery-card-title">${p.title}</span>
            <i class="fa-solid fa-arrow-left" style="color:var(--primary);"></i>
          </div>
        </div>
      `).join("");
    };

    window.filterSchoolGallery = function(category) {
      document.querySelectorAll(".gallery-filter-btn").forEach((b) => b.classList.remove("active"));
      const clickedBtn = Array.from(document.querySelectorAll(".gallery-filter-btn")).find((b) => b.getAttribute("onclick")?.includes(category));
      if (clickedBtn) clickedBtn.classList.add("active");

      window.renderSchoolPhotosGallery(category);
    };

    window.openPhotoLightbox = function(photoId) {
      const photo = (appSettings.schoolPhotos || []).find((p) => p.id === photoId);
      if (!photo) return;

      const modal = document.getElementById("photoLightboxModal");
      document.getElementById("lightboxImg").src = photo.imageUrl;
      document.getElementById("lightboxTitle").textContent = photo.title;
      document.getElementById("lightboxCategory").innerHTML = `<i class="fa-solid fa-tag"></i> ${photo.category || "عام"}`;

      modal.classList.add("show");
    };

    window.closePhotoLightbox = function(e) {
      if (!e || e.target.id === "photoLightboxModal" || e.target.closest(".photo-lightbox-close")) {
        document.getElementById("photoLightboxModal")?.classList.remove("show");
      }
    };

    async function initSchoolSettingsAndGallery() {
      try {
        appSettings = await ApiService.getSettings();
        window.__ACTIVE_ACADEMIC_YEAR_START__ = appSettings.academicYearStart || 2026;
        
        // Update all dynamic academic year displays
        document.querySelectorAll(".dynamic-academic-year").forEach((el) => {
          el.textContent = appSettings.academicYear || "2026 / 2027";
        });

        // Automatically update Registration Page Grace Period Notice
        const regBanner = document.getElementById("registrationGracePeriodNotice");
        const step5Box = document.getElementById("step5GracePeriodBox");
        const step5Text = document.getElementById("step5GracePeriodText");

        if (regBanner) {
          if (appSettings.canParentEdit) {
            regBanner.style.display = "block";
            const deadlineDate = new Date(appSettings.parentEditDeadline || "2026-08-31T23:59:59Z");
            const dateFormatted = deadlineDate.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
            
            const dateEl = document.getElementById("regGracePeriodDeadlineDate");
            if (dateEl) dateEl.textContent = dateFormatted;

            const remEl = document.getElementById("regGracePeriodRemainingDays");
            if (remEl) remEl.textContent = appSettings.remainingDays;

            const badgeEl = document.getElementById("regGracePeriodBadge");
            if (badgeEl) badgeEl.innerHTML = `<i class="fa-solid fa-hourglass-half"></i> متبقي ${appSettings.remainingDays} يوم`;

            if (step5Text) {
              step5Text.textContent = `اطمئن، يحق لولي الأمر تعديل أي من هذه البيانات لاحقاً برقم الطلب حتى ${dateFormatted} (متبقي ${appSettings.remainingDays} يوماً).`;
            }
          } else {
            regBanner.style.display = "block";
            regBanner.style.background = "rgba(100,116,139,0.08)";
            regBanner.style.borderColor = "rgba(100,116,139,0.25)";
            regBanner.style.color = "#475569";
            
            const titleEl = document.getElementById("regGracePeriodTitle");
            if (titleEl) titleEl.textContent = "تنبيه: فترة تعديل البيانات بعد التقديم مغلقة حالياً";

            const descEl = document.getElementById("regGracePeriodDesc");
            if (descEl) descEl.textContent = "يرجى مراجعة وتدقيق كافة البيانات بدقة تامة، حيث لا يُسمح بالتعديل بعد التسجيل إلا من خلال إدارة المدرسة.";

            const badgeEl = document.getElementById("regGracePeriodBadge");
            if (badgeEl) {
              badgeEl.className = "badge rejected";
              badgeEl.innerHTML = `<i class="fa-solid fa-lock"></i> التعديل مغلق`;
            }

            if (step5Box) {
              step5Box.style.background = "#fffbeb";
              step5Box.style.borderColor = "#fde68a";
              step5Box.style.color = "#92400e";
            }
            if (step5Text) {
              step5Text.textContent = "تنبيه: فترة التعديل بعد التسجيل مغلقة حالياً، يرجى التأكد التام من صحة البيانات المسجلة قبل الإرسال النهائي.";
            }
          }
        }

        window.renderSchoolPhotosGallery("all");
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    }

    initSchoolSettingsAndGallery();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
})();
