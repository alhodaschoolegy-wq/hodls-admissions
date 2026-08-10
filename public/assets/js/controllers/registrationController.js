import { parseNationalId } from "../models/nationalIdParser.js";
import { ApiService } from "../services/apiService.js";
import { WizardView } from "../views/wizardView.js";
import { ReceiptView } from "../views/receiptView.js";

const GRADES_BY_STAGE = {
  "المرحلة الابتدائية": [
    "الصف الأول الابتدائي",
    "الصف الثاني الابتدائي",
    "الصف الثالث الابتدائي",
    "الصف الرابع الابتدائي",
    "الصف الخامس الابتدائي",
    "الصف السادس الابتدائي",
  ],
  "المرحلة الإعدادية": [
    "الصف الأول الإعدادي",
    "الصف الثاني الإعدادي",
    "الصف الثالث الإعدادي",
  ],
  "المرحلة الثانوية": [
    "الصف الأول الثانوي",
    "الصف الثاني الثانوي",
    "الصف الثالث الثانوي",
  ],
};

export class RegistrationController {
  constructor() {
    this.wizard = new WizardView({
      formId: "registrationForm",
      stepsContainerId: "wizardSteps",
      progressBarId: "wizardProgress",
      indicatorsContainerId: "stepIndicators",
    });

    this.form = document.getElementById("registrationForm");
    this.stageSelect = document.getElementById("stage");
    this.gradeSelect = document.getElementById("grade");
    this.nidInput = document.getElementById("nationalId");
    this.parsedNidData = null;

    this.initEvents();
  }

  initEvents() {
    if (!this.form) return;

    // Dynamic Stage -> Grade cascading
    this.stageSelect?.addEventListener("change", () => {
      this.populateGrades(this.stageSelect.value);
    });

    // Real-time National ID Parser
    this.nidInput?.addEventListener("input", (e) => {
      const val = e.target.value.replace(/\D/g, "").slice(0, 14);
      e.target.value = val;

      if (val.length === 14) {
        const info = parseNationalId(val);
        this.parsedNidData = info;
        this.wizard.showNationalIdBadge(info);

        if (info.valid) {
          const birthInput = document.getElementById("birthDate");
          const genderSelect = document.getElementById("gender");
          if (birthInput) birthInput.value = info.birthDate;
          if (genderSelect) genderSelect.value = info.gender;
        }
      } else if (val.length > 0) {
        this.parsedNidData = null;
        this.wizard.showNationalIdBadge({ valid: false, message: `متبقي ${14 - val.length} أرقام لاكتمال الرقم القومي.` });
      } else {
        this.parsedNidData = null;
        this.wizard.showNationalIdBadge(null);
      }
    });

    // Step Next Buttons
    document.querySelectorAll(".btn-step-next").forEach((btn) => {
      btn.addEventListener("click", () => {
        const currentStep = this.wizard.currentStep;
        if (this.validateStep(currentStep)) {
          if (currentStep === 4) {
            // Prepare Review
            this.wizard.renderReview(this.collectFormData(), this.parsedNidData);
          }
          this.wizard.next();
        }
      });
    });

    // Step Prev Buttons
    document.querySelectorAll(".btn-step-prev").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.wizard.prev();
      });
    });

    // Form Submission
    this.form.addEventListener("submit", (e) => this.handleSubmit(e));
  }

  populateGrades(selectedStage) {
    if (!this.gradeSelect) return;
    this.gradeSelect.innerHTML = '<option value="">اختر الصف الدراسي</option>';
    const grades = GRADES_BY_STAGE[selectedStage] || [];
    grades.forEach((g) => {
      const opt = document.createElement("option");
      opt.value = g;
      opt.textContent = g;
      this.gradeSelect.appendChild(opt);
    });
  }

  validateStep(stepNumber) {
    this.wizard.clearGlobalAlert();

    if (stepNumber === 1) {
      const stage = document.getElementById("stage")?.value;
      const grade = document.getElementById("grade")?.value;
      const secondLang = document.getElementById("secondLanguage")?.value;

      if (!stage) {
        this.wizard.showGlobalAlert("يرجى اختيار المرحلة الدراسية للمتابعة.", "error");
        return false;
      }
      if (!grade) {
        this.wizard.showGlobalAlert("يرجى اختيار الصف الدراسي للمتابعة.", "error");
        return false;
      }
      // secondLanguage is optional — no validation required
      return true;
    }

    if (stepNumber === 2) {
      const name = document.getElementById("studentName")?.value.trim();
      const nid = document.getElementById("nationalId")?.value.trim();
      const birth = document.getElementById("birthDate")?.value;
      const gender = document.getElementById("gender")?.value;

      if (!name || name.split(/\s+/).length < 3) {
        this.wizard.showGlobalAlert("يرجى إدخال اسم الطالب ثلاثياً أو رباعياً باللغة العربية.", "error");
        return false;
      }
      if (!nid || !/^\d{14}$/.test(nid)) {
        this.wizard.showGlobalAlert("الرقم القومي للطالب يجب أن يتكون من 14 رقماً صحيحاً.", "error");
        return false;
      }
      if (!this.parsedNidData || !this.parsedNidData.valid) {
        this.wizard.showGlobalAlert(this.parsedNidData?.message || "يرجى التأكد من صحة الرقم القومي.", "error");
        return false;
      }
      if (!birth) {
        this.wizard.showGlobalAlert("يرجى إدخال تاريخ الميلاد.", "error");
        return false;
      }
      if (!gender) {
        this.wizard.showGlobalAlert("يرجى تحديد النوع (ذكر / أنثى).", "error");
        return false;
      }
      return true;
    }

    if (stepNumber === 3) {
      const father = document.getElementById("fatherName")?.value.trim();
      const mother = document.getElementById("motherName")?.value.trim();
      const phone = document.getElementById("guardianPhone")?.value.trim();

      if (!father || father.split(/\s+/).length < 3) {
        this.wizard.showGlobalAlert("يرجى كتابة اسم الأب ثلاثياً على الأقل.", "error");
        return false;
      }
      if (!mother || mother.split(/\s+/).length < 3) {
        this.wizard.showGlobalAlert("يرجى كتابة اسم الأم ثلاثياً على الأقل.", "error");
        return false;
      }
      if (!phone || !/^01[0125]\d{8}$/.test(phone)) {
        this.wizard.showGlobalAlert("يرجى إدخال رقم هاتف محمول صحيح (مكون من 11 رقماً يبدأ بـ 010 أو 011 أو 012 أو 015).", "error");
        return false;
      }
      return true;
    }

    if (stepNumber === 4) {
      const address = document.getElementById("address")?.value.trim();
      if (!address || address.length < 6) {
        this.wizard.showGlobalAlert("يرجى كتابة العنوان السكني بالتفصيل (الشارع - المنطقة - المحافظة).", "error");
        return false;
      }
      return true;
    }

    return true;
  }

  collectFormData() {
    const val = (id) => document.getElementById(id)?.value.trim() || "";
    return {
      stage: val("stage"),
      grade: val("grade"),
      secondLanguage: val("secondLanguage"),
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
      website_url: val("website_url"), // honeypot
    };
  }

  async handleSubmit(e) {
    e.preventDefault();
    const submitBtn = document.getElementById("btnSubmitForm");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> جاري إرسال وتوثيق الطلب...';
    }

    this.wizard.showGlobalAlert("جاري إرسال الطلب وحفظ البيانات في السجلات الرسمية...", "info");

    try {
      const formData = this.collectFormData();
      const response = await ApiService.submitApplication(formData);

      this.wizard.showGlobalAlert("تم تقديم الطلب بنجاح! جاري فتح إشعار الاستلام الرسمي...", "success");

      // Render Printable Receipt
      ReceiptView.renderReceipt(response.receipt);

      // Reset form
      this.form.reset();
      this.wizard.showNationalIdBadge(null);
      this.wizard.goToStep(1);
    } catch (err) {
      console.error(err);
      this.wizard.showGlobalAlert(err.message || "حدث خطأ أثناء إرسال الطلب. يرجى المحاولة لاحقاً.", "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane" style="margin-left:6px;"></i> تأكيد وإرسال طلب التقديم النهائي';
      }
    }
  }
}
