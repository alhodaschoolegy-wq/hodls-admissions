let currentUser = null;
let currentSettings = null;

const escapeHtml = (s) => String(s ?? "").replace(/[&<>"']/g, (m) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
}[m]));

async function apiRequest(action, options = {}, queryParams = null) {
  // --- Local Dev Mock ---
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    console.warn("⚠️ Local Mode Active: Mocking", action);
    await new Promise(r => setTimeout(r, 600));
    if (action === "login" || action === "me") return { success: true, user: { username: "admin_local", role: "master_admin", fullName: "مدير النظام (محلي)" } };
    if (action === "stats") return { success: true, stats: { total: 150, byStatus: { review: 50, acceptedInitial: 40, acceptedFinal: 30, needsDocs: 20, rejected: 10 }, byStage: { primary: 70, prep: 50, sec: 30 } } };
    if (action === "getSettings") return { success: true, settings: { academicYear: "2026 / 2027", canParentEdit: true, remainingDays: 14 } };
    if (action === "getStudents") return { success: true, data: [] };
    return { success: true, message: "Local mock success" };
  }
  // ------------------------

  const urlObj = new URL("/api", window.location.origin);
  urlObj.searchParams.set("action", action);
  if (queryParams) {
    for (const [k, v] of Object.entries(queryParams)) {
      if (v !== undefined && v !== null && v !== "") {
        urlObj.searchParams.set(k, v);
      }
    }
  }
  const res = await fetch(urlObj.toString(), {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (res.status === 401) {
    // If not authenticated and not on login page, redirect to /admin login
    if (!window.location.pathname.endsWith("admin") && !window.location.pathname.endsWith("admin.html")) {
      let target = `/admin?redirect=${encodeURIComponent(window.location.pathname)}`;
      if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        target = `/admin.html?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
      window.location.href = target;
    }
    throw new Error("انتهت جلسة العمل، يرجى إعادة تسجيل الدخول.");
  }

  const text = await res.text();
  let data = {};
  try { data = JSON.parse(text); } catch { throw new Error("استجابة غير صالحة من السيرفر."); }

  if (!res.ok || data.success === false) {
    throw new Error(data.message || "حدث خطأ");
  }
  return data;
}

async function initAdminAuth(activePage, onReady) {
  try {
    const res = await apiRequest("me");
    currentUser = res.user;

    // Check Role Restrictions for Master Admin pages
    const isMaster = currentUser?.role === "master_admin";
    if ((activePage === "users" || activePage === "settings") && !isMaster) {
      Swal.fire({
        icon: "warning",
        title: "غير مصرح",
        text: "هذه الصفحة مخصصة للمدير العام (Master Admin) فقط.",
        confirmButtonColor: "#087a3c"
      }).then(() => {
        window.location.href = "/dashboard";
      });
      return;
    }

    applyUserToUI(currentUser, activePage);
    
    // Load Global Settings for Academic Year
    try {
      const setRes = await apiRequest("getSettings");
      currentSettings = setRes.settings || {};
      const activeYear = currentSettings.academicYear || "2026 / 2027";
      document.querySelectorAll(".active-year-display").forEach((el) => {
        el.textContent = activeYear;
      });
    } catch (e) {
      console.warn("Could not fetch global settings:", e);
    }

    if (typeof onReady === "function") {
      await onReady(currentUser, currentSettings);
    }
  } catch (err) {
    // Redirect to clean admin login portal
    let target = `/admin?redirect=${encodeURIComponent(window.location.pathname)}`;
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      target = `/admin.html?redirect=${encodeURIComponent(window.location.pathname)}`;
    }
    window.location.href = target;
  }
}

function applyUserToUI(user, activePage) {
  const loggedUserEl = document.getElementById("adminLoggedUser");
  if (loggedUserEl) loggedUserEl.textContent = user.fullName || user.username;

  const badge = document.getElementById("userRoleBadge");
  const navUsers = document.getElementById("navUsersBtn");
  const navSettings = document.getElementById("navSettingsBtn");

  if (user.role === "master_admin") {
    if (badge) {
      badge.className = "role-tag-master";
      badge.innerHTML = '<i class="fa-solid fa-crown"></i> مدير عام (Master Admin)';
    }
    if (navUsers) navUsers.style.display = "flex";
    if (navSettings) navSettings.style.display = "flex";
  } else {
    if (badge) {
      badge.className = "role-tag-staff";
      badge.innerHTML = '<i class="fa-solid fa-user-check"></i> مسؤول شؤون طلاب';
    }
    if (navUsers) navUsers.style.display = "none";
    if (navSettings) navSettings.style.display = "none";
  }
}

// Password Visibility Toggle
function setupPasswordToggle() {
  const btnToggle = document.getElementById("btnTogglePassword");
  const passInp = document.getElementById("adminPassword");
  const toggleIcon = document.getElementById("togglePasswordIcon");

  btnToggle?.addEventListener("click", () => {
    if (passInp.type === "password") {
      passInp.type = "text";
      if (toggleIcon) toggleIcon.className = "fa-solid fa-eye-slash";
    } else {
      passInp.type = "password";
      if (toggleIcon) toggleIcon.className = "fa-solid fa-eye";
    }
    passInp.focus();
  });
}

// Login Handler (Used on /admin)
function setupLoginForm(onSuccessCallback) {
  const form = document.getElementById("loginForm");
  if (!form) return;

  setupPasswordToggle();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("btnLogin");
    const errBox = document.getElementById("loginError");
    const username = document.getElementById("adminUsername").value.trim();
    const password = document.getElementById("adminPassword").value;

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التحقق...';
    if (errBox) errBox.style.display = "none";

    try {
      const res = await apiRequest("login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      currentUser = res.user;

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: `مرحباً بك: ${res.user.fullName || res.user.username}`,
        showConfirmButton: false,
        timer: 1500,
        background: "#04381e",
        color: "#fff",
      });

      if (typeof onSuccessCallback === "function") {
        await onSuccessCallback(currentUser);
      } else {
        const params = new URLSearchParams(window.location.search);
        let target = params.get("redirect") || "/dashboard";
        if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
           if (!target.endsWith(".html")) target += ".html";
        }
        window.location.href = target;
      }
    } catch (err) {
      if (errBox) {
        errBox.textContent = err.message;
        errBox.style.display = "block";
      }
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-shield-halved"></i> دخول آمن للمنظومة (JWT Auth)';
    }
  });
}

// Global actions
function exportCsv() {
  window.location.href = "/api?action=export";
}

async function logout() {
  try {
    await fetch("/api?action=logout", { method: "POST" });
  } finally {
    let target = "/admin";
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") target += ".html";
    window.location.href = target;
  }
}

async function changeMyPassword() {
  const { value: formValues } = await Swal.fire({
    title: 'تغيير كلمة المرور',
    html: `
      <div style="text-align:right; font-family:'IBM Plex Sans Arabic', sans-serif;">
        <div style="margin-bottom:12px;">
          <label style="display:block; font-size:13px; font-weight:600; margin-bottom:5px;">كلمة المرور الحالية</label>
          <input id="swal-curr-pass" type="password" class="swal2-input" placeholder="أدخل كلمة المرور الحالية" style="text-align:right; direction:rtl;">
        </div>
        <div style="margin-bottom:12px;">
          <label style="display:block; font-size:13px; font-weight:600; margin-bottom:5px;">كلمة المرور الجديدة</label>
          <input id="swal-new-pass" type="password" class="swal2-input" placeholder="6 أحرف على الأقل" style="text-align:right; direction:rtl;">
        </div>
        <div style="margin-bottom:4px;">
          <label style="display:block; font-size:13px; font-weight:600; margin-bottom:5px;">تأكيد كلمة المرور الجديدة</label>
          <input id="swal-confirm-pass" type="password" class="swal2-input" placeholder="أعد إدخال كلمة المرور" style="text-align:right; direction:rtl;">
        </div>
      </div>`,
    focusConfirm: false,
    confirmButtonText: 'تغيير كلمة المرور',
    cancelButtonText: 'إلغاء',
    showCancelButton: true,
    confirmButtonColor: '#087a3c',
    cancelButtonColor: '#6b7280',
    preConfirm: () => {
      const curr = document.getElementById('swal-curr-pass').value.trim();
      const newP = document.getElementById('swal-new-pass').value.trim();
      const conf = document.getElementById('swal-confirm-pass').value.trim();
      if (!curr || !newP || !conf) {
        Swal.showValidationMessage('يرجى تعبئة جميع الحقول.');
        return false;
      }
      if (newP.length < 6) {
        Swal.showValidationMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
        return false;
      }
      if (newP !== conf) {
        Swal.showValidationMessage('كلمتا المرور غير متطابقتين.');
        return false;
      }
      return { currentPassword: curr, newPassword: newP };
    }
  });

  if (!formValues) return;
  try {
    const res = await apiRequest('changePassword', {
      method: 'POST',
      body: JSON.stringify(formValues)
    });
    await Swal.fire({ icon: 'success', title: 'تم بنجاح', text: res.message, timer: 2000, showConfirmButton: false });
    logout();
  } catch (err) {
    Swal.fire({ icon: 'error', title: 'خطأ', text: err.message });
  }
}


// Local dev navigation fixer
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href');
    if (href && href.startsWith('/') && !href.includes('.html') && href !== '/') {
      e.preventDefault();
      window.location.href = href + '.html';
    }
  });
}
