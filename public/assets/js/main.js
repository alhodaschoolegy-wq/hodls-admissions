import { RegistrationController } from "./controllers/registrationController.js";
import { TrackingController } from "./controllers/trackingController.js";

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Controllers
  const registrationCtrl = new RegistrationController();
  const trackingCtrl = new TrackingController();

  // Mobile menu toggle
  const mobileToggle = document.getElementById("mobileToggle");
  const navLinks = document.getElementById("navLinks");
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener("click", () => {
      navLinks.classList.toggle("open");
    });
  }

  // Welcome modal close
  const welcomeModal = document.getElementById("welcomeModal");
  const closeWelcomeBtn = document.getElementById("closeWelcomeBtn");
  if (welcomeModal && closeWelcomeBtn) {
    closeWelcomeBtn.addEventListener("click", () => {
      welcomeModal.style.display = "none";
    });
  }
});
