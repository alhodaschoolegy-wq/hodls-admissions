import { ApiService } from "./services/apiService.js";

const DEFAULT_SCHOOL_PHOTOS = [
  { id: "photo-1", title: "المبنى المدرسي والواجهة الرئيسية لمدرسة الهُدى", category: "المباني والمرافق", imageUrl: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1200&q=80" },
  { id: "photo-2", title: "فناء الطابور الصباحي والمساحات الخضراء والأنشطة", category: "المباني والمرافق", imageUrl: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=80" },
  { id: "photo-3", title: "معامل الحاسب الآلي والبرمجة والروبوتيكس المتطورة", category: "المعامل التكنولوجية", imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80" },
  { id: "photo-4", title: "معامل العلوم والاستكشاف وتجارب الكيمياء والأحياء", category: "المعامل التكنولوجية", imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80" },
  { id: "photo-5", title: "الفصول الدراسية الذكية والشاشات التفاعلية الحديثة", category: "الفصول الدراسية", imageUrl: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80" },
  { id: "photo-6", title: "فصول رياض الأطفال والأنشطة الإبداعية والتعليم المبكر", category: "رياض الأطفال", imageUrl: "https://images.unsplash.com/photo-1587691592099-24045742c181?auto=format&fit=crop&w=1200&q=80" },
  { id: "photo-7", title: "الملاعب الرياضية المتعددة وملاعب كرة القدم والسلة", category: "الأنشطة والملاعب", imageUrl: "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80" },
  { id: "photo-8", title: "المسرح المدرسي وقاعة الاحتفالات وتكريم الطلاب المتفوقين", category: "المسرح والفعاليات", imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80" },
  { id: "photo-9", title: "المكتبة المدرسية الشاملة ومركز مصادر التعلم والبحث", category: "المكتبة والثقافة", imageUrl: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80" }
];

export const UI = {
  appSettings: {
    academicYear: "2026 / 2027",
    academicYearStart: 2026,
    schoolPhotos: DEFAULT_SCHOOL_PHOTOS
  },

  async initSchoolSettingsAndGallery() {
    this.renderSchoolPhotosGallery("all");

    try {
      // Use ApiService to get settings. Wait, ApiService only has submitApplication and getApplicationStatus.
      // We will need to update ApiService to include getSettings. Let's do a direct fetch for now.
      const response = await fetch("/api?action=getSettings");
      const data = await response.json().catch(() => ({}));
      const serverSettings = data.settings || {};

      if (serverSettings.academicYear) this.appSettings.academicYear = serverSettings.academicYear;
      if (serverSettings.academicYearStart) this.appSettings.academicYearStart = serverSettings.academicYearStart;
      this.appSettings.parentEditsEnabled = serverSettings.parentEditsEnabled;
      this.appSettings.parentEditDeadline = serverSettings.parentEditDeadline;
      this.appSettings.remainingDays = serverSettings.remainingDays;
      this.appSettings.canParentEdit = serverSettings.canParentEdit;
      if (serverSettings.categoryVisibility) this.appSettings.categoryVisibility = serverSettings.categoryVisibility;
      if (serverSettings.sectionVisibility) this.appSettings.sectionVisibility = serverSettings.sectionVisibility;

      if (Array.isArray(serverSettings.schoolPhotos)) {
        this.appSettings.schoolPhotos = serverSettings.schoolPhotos;
      } else {
        this.appSettings.schoolPhotos = [];
      }

      window.__ACTIVE_ACADEMIC_YEAR_START__ = this.appSettings.academicYearStart || 2026;
      
      document.querySelectorAll(".dynamic-academic-year").forEach((el) => {
        el.textContent = this.appSettings.academicYear || "2026 / 2027";
      });

      if (this.appSettings.categoryVisibility) {
        document.querySelectorAll(".gallery-filter-btn[data-category]").forEach((btn) => {
          const cat = btn.getAttribute("data-category");
          if (cat && cat !== "all") {
            const isVisible = this.appSettings.categoryVisibility[cat] !== false;
            btn.style.display = isVisible ? "" : "none";
          }
        });
        this.renderSchoolPhotosGallery("all");
      }

      if (this.appSettings.sectionVisibility) {
        const secVis = this.appSettings.sectionVisibility;
        const sectionMap = {
          gallery: document.getElementById("gallery"),
          rules: document.getElementById("rules"),
          registration: document.getElementById("registration"),
          tracking: document.getElementById("tracking"),
          contact: document.getElementById("contact")
        };

        for (const [key, el] of Object.entries(sectionMap)) {
          if (el && secVis[key] !== undefined) {
            el.style.display = secVis[key] ? "" : "none";
          }
          const navLink = document.querySelector(`.nav-links a[href="#${key}"]`);
          if (navLink && secVis[key] !== undefined) {
            navLink.style.display = secVis[key] ? "" : "none";
          }
        }
      }

      this.updateRegistrationGracePeriod();
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  },

  updateRegistrationGracePeriod() {
    const regBanner = document.getElementById("registrationGracePeriodNotice");
    const step5Box = document.getElementById("step5GracePeriodBox");
    const step5Text = document.getElementById("step5GracePeriodText");

    if (regBanner) {
      if (this.appSettings.canParentEdit) {
        regBanner.style.display = "block";
        const deadlineDate = new Date(this.appSettings.parentEditDeadline || "2026-08-31T23:59:59Z");
        const dateFormatted = deadlineDate.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
        
        const dateEl = document.getElementById("regGracePeriodDeadlineDate");
        if (dateEl) dateEl.textContent = dateFormatted;

        const remEl = document.getElementById("regGracePeriodRemainingDays");
        if (remEl) remEl.textContent = this.appSettings.remainingDays;

        const badgeEl = document.getElementById("regGracePeriodBadge");
        if (badgeEl) badgeEl.innerHTML = `<i class="fa-solid fa-hourglass-half"></i> متبقي ${this.appSettings.remainingDays} يوم`;

        if (step5Text) {
          step5Text.textContent = `اطمئن، يحق لولي الأمر تعديل أي من هذه البيانات لاحقاً برقم الطلب حتى ${dateFormatted} (متبقي ${this.appSettings.remainingDays} يوماً).`;
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
  },

  renderSchoolPhotosGallery(category = "all") {
    const container = document.getElementById("schoolPhotosGalleryGrid");
    if (!container) return;

    const categoryVisibility = this.appSettings.categoryVisibility || {};
    const allPhotos = Array.isArray(this.appSettings.schoolPhotos) ? this.appSettings.schoolPhotos : [];
    
    const visiblePhotos = allPhotos.filter((p) => categoryVisibility[p.category] !== false);
    const filtered = category === "all" ? visiblePhotos : visiblePhotos.filter((p) => p.category === category);

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
      <div class="gallery-card" data-action="open-lightbox" data-payload="${p.id}">
        <div class="gallery-card-thumb-wrap">
          <img src="${p.imageUrl}" alt="${p.title}" class="gallery-card-thumb" onerror="this.src='school-logo.png'">
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
  },

  filterSchoolGallery(category) {
    document.querySelectorAll(".gallery-filter-btn").forEach((b) => b.classList.remove("active"));
    const clickedBtn = Array.from(document.querySelectorAll(".gallery-filter-btn")).find((b) => b.getAttribute("data-category") === category);
    if (clickedBtn) clickedBtn.classList.add("active");

    this.renderSchoolPhotosGallery(category);
  },

  openPhotoLightbox(photoId) {
    const photo = (this.appSettings.schoolPhotos || []).find((p) => p.id === photoId);
    if (!photo) return;

    const modal = document.getElementById("photoLightboxModal");
    document.getElementById("lightboxImg").src = photo.imageUrl;
    document.getElementById("lightboxTitle").textContent = photo.title;
    document.getElementById("lightboxCategory").innerHTML = `<i class="fa-solid fa-tag"></i> ${photo.category || "عام"}`;

    modal.classList.add("show");
  },

  closePhotoLightbox() {
    document.getElementById("photoLightboxModal")?.classList.remove("show");
  },

  openParentEditModal(data) {
    if (!data) return;
    const modal = document.getElementById("parentEditModal");
    if (!modal) return;

    document.getElementById("parentEditAppIdBadge").textContent = data.applicationId;
    document.getElementById("pEdit_studentName").value = data.studentName || "";
    document.getElementById("pEdit_stage").value = data.stage || "المرحلة الابتدائية";
    
    // Trigger grade update based on stage
    this.handleParentStageChange(data.stage, data.grade);
    
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
  },

  closeParentEditModal() {
    document.getElementById("parentEditModal")?.classList.remove("show");
  },

  handleParentStageChange(presetStage, presetGrade) {
    const GRADES_BY_STAGE = {
      "المرحلة الابتدائية": ["الصف الأول الابتدائي", "الصف الثاني الابتدائي", "الصف الثالث الابتدائي", "الصف الرابع الابتدائي", "الصف الخامس الابتدائي", "الصف السادس الابتدائي"],
      "المرحلة الإعدادية": ["الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي"],
      "المرحلة الثانوية": ["الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"]
    };

    const stage = presetStage || document.getElementById("pEdit_stage")?.value;
    const gradeSelect = document.getElementById("pEdit_grade");
    if (!gradeSelect) return;

    const grades = GRADES_BY_STAGE[stage] || [];
    gradeSelect.innerHTML = grades.map((g) => `<option value="${g}">${g}</option>`).join("");
    if (presetGrade && grades.includes(presetGrade)) {
      gradeSelect.value = presetGrade;
    }
  },

  async handleParentEditSubmit(data) {
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

      const response = await fetch("/api?action=parentUpdateApplication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload)
      });
      const resData = await response.json().catch(() => ({}));
      if (!response.ok || resData.success === false) {
        throw new Error(resData.message || "فشل حفظ التعديلات.");
      }

      this.closeParentEditModal();
      alert("تم حفظ وتحديث بيانات طلب التقديم بنجاح!");
      
      // We can trigger search again by clicking the search button if we can't easily reference the controller
      const btnSearchStatus = document.getElementById("btnSearchStatus");
      if (btnSearchStatus) btnSearchStatus.click();

    } catch (err) {
      alert(err.message || "فشل حفظ التعديلات.");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> حفظ التعديلات';
      }
    }
  }
};
