import { UI } from "./ui.js";

export function initGlobalEvents() {
  document.addEventListener("click", (e) => {
    // Find closest element with data-action attribute
    const target = e.target.closest("[data-action]");
    if (!target) return;

    const action = target.getAttribute("data-action");
    const payload = target.getAttribute("data-payload");

    switch (action) {
      case "filter-gallery":
        if (payload) {
          UI.filterSchoolGallery(payload);
        }
        break;
      
      case "open-lightbox":
        if (payload) {
          UI.openPhotoLightbox(payload);
        }
        break;

      case "close-lightbox":
        // Make sure it doesn't close if clicking inside content unless it's the close button
        if (e.target.closest(".photo-lightbox-content") && !e.target.closest(".photo-lightbox-close")) {
          return;
        }
        UI.closePhotoLightbox();
        break;

      case "close-parent-edit":
        UI.closeParentEditModal();
        break;
      
      case "open-parent-edit":
        if (window.currentTrackedStudent) {
          UI.openParentEditModal(window.currentTrackedStudent);
        }
        break;
      
      case "print-student-dossier":
        if (window.currentTrackedStudent) {
          sessionStorage.setItem("hodls_print_student", JSON.stringify(window.currentTrackedStudent));
          const targetId = window.currentTrackedStudent.applicationId;
          window.open(`print.html?id=${encodeURIComponent(targetId)}`, "_blank");
        }
        break;
    }
  });

  // Handle Parent Stage Change for cascading select
  const pEditStage = document.getElementById("pEdit_stage");
  if (pEditStage) {
    pEditStage.addEventListener("change", (e) => {
      UI.handleParentStageChange(e.target.value);
    });
  }

  // Handle Parent Edit Form submission
  const pEditForm = document.getElementById("parentEditForm");
  if (pEditForm) {
    pEditForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (window.currentTrackedStudent) {
        UI.handleParentEditSubmit(window.currentTrackedStudent);
      }
    });
  }
}
