/**
 * View: Status Tracking View
 */
export class TrackingView {
  static renderStatus(data, containerId = "trackingResult") {
    const container = document.getElementById(containerId);
    if (!container) return;

    const escape = (s) => String(s ?? "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
    }[m]));

    let statusClass = "review";
    let statusText = data.status || "قيد المراجعة";
    let activeStepIndex = 1;

    if (data.status === "مقبول نهائياً" || data.status === "مقبول") {
      statusClass = "accepted";
      activeStepIndex = 4;
    } else if (data.status === "مقبول مبدئياً") {
      statusClass = "initial-accepted";
      activeStepIndex = 3;
    } else if (data.status === "يحتاج استكمال أوراق") {
      statusClass = "warning";
      activeStepIndex = 2;
    } else if (data.status === "مرفوض") {
      statusClass = "rejected";
      activeStepIndex = 2;
    }

    const steps = [
      { num: 1, title: "تم التقديم إلكترونياً", desc: "تم استلام الطلب بنجاح" },
      { num: 2, title: "فحص وتدقيق البيانات", desc: "مراجعة الشروط والسن" },
      { num: 3, title: "استيفاء الأوراق والمقابلة", desc: "فحص الملف والتنسيق" },
      { num: 4, title: "القرار والقبول النهائي", desc: "اعتماد كشوف المقبولين" },
    ];

    container.innerHTML = `
      <div class="tracking-card ${statusClass}">
        <div class="tracking-card-head">
          <div class="tracking-title-info">
            <span class="tracking-app-id">${escape(data.applicationId)}</span>
            <h3>${escape(data.studentName)}</h3>
            <p>${escape(data.stage)} — <strong>${escape(data.grade)}</strong></p>
          </div>
          <div class="tracking-status-badge ${statusClass}">
            ${escape(statusText)}
          </div>
        </div>

        <!-- Tracking Visual Timeline -->
        <div class="tracking-timeline">
          ${steps.map((step) => {
            let stepState = "upcoming";
            if (step.num < activeStepIndex) stepState = "completed";
            else if (step.num === activeStepIndex) stepState = "current";
            if (data.status === "مرفوض" && step.num === activeStepIndex) stepState = "rejected";

            return `
              <div class="timeline-step ${stepState}">
                <div class="timeline-dot">
                  ${stepState === "completed" ? "✓" : step.num}
                </div>
                <div class="timeline-content">
                  <strong>${escape(step.title)}</strong>
                  <small>${escape(step.desc)}</small>
                </div>
              </div>
            `;
          }).join("")}
        </div>

        ${data.adminNotes ? `
          <div class="tracking-admin-alert">
            <div class="admin-alert-head">
              <i class="fa-solid fa-bullhorn text-emerald" style="margin-left:6px;"></i>
              <strong>ملاحظات لجنة القبول والتنسيق:</strong>
            </div>
            <p>${escape(data.adminNotes)}</p>
          </div>
        ` : ""}

        <div class="tracking-card-footer">
          <small>رقم هاتف المتابعة المسجل: <span dir="ltr">${escape(data.maskedPhone || "—")}</span></small>
          <button class="btn btn-outline btn-sm" onclick="window.print()">
            <i class="fa-solid fa-print"></i> طباعة إفادة الحالة
          </button>
        </div>
      </div>
    `;
    container.style.display = "block";
  }

  static showError(message, containerId = "trackingResult") {
    const container = document.getElementById(containerId);
    if (!container) return;

    const escape = (s) => String(s ?? "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
    }[m]));

    container.innerHTML = `
      <div class="alert-box alert-error">
        <i class="fa-solid fa-triangle-exclamation text-red" style="font-size:18px; margin-left:8px;"></i>
        <div>${escape(message)}</div>
      </div>
    `;
    container.style.display = "block";
  }
}
