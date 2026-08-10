import {
  clean,
  makeSessionCookie,
  clearSessionCookie,
  validateSessionCookie,
  checkRateLimit,
  getClientIp,
} from "../utils/security.mjs";
import crypto from "node:crypto";

const COOKIE_NAME = "hodls_admin_session";

export class AdminSessionModel {
  static getAdminUsername() {
    return process.env.ADMIN_USERNAME ? process.env.ADMIN_USERNAME.trim() : "admin";
  }

  static getAdminPassword() {
    return process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.trim() : "";
  }

  static isConfigured() {
    const pwd = this.getAdminPassword();
    return pwd.length > 0;
  }

  static authenticate(req, username, password) {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(`login_${ip}`, 5, 15 * 60 * 1000); // 5 attempts per 15 mins

    if (!rateCheck.allowed) {
      return {
        success: false,
        status: 429,
        message: `تم تجاوز الحد الأقصى لمحاولات الدخول الخاطئة. يرجى الانتظار ${Math.ceil(rateCheck.resetIn / 60)} دقيقة ثم المحاولة مجدداً.`,
      };
    }

    if (!this.isConfigured()) {
      return {
        success: false,
        status: 500,
        message: "لم يتم ضبط متغير ADMIN_PASSWORD في إعدادات البيئة على Netlify.",
      };
    }

    const cleanUser = clean(username);
    const cleanPass = clean(password);

    const expectedUser = this.getAdminUsername();
    const expectedPass = this.getAdminPassword();

    // Timing-safe comparison to prevent timing attacks
    const userMatch = cleanUser.length === expectedUser.length &&
      crypto.timingSafeEqual(Buffer.from(cleanUser), Buffer.from(expectedUser));

    const passMatch = cleanPass.length === expectedPass.length &&
      crypto.timingSafeEqual(Buffer.from(cleanPass), Buffer.from(expectedPass));

    if (!userMatch || !passMatch) {
      return {
        success: false,
        status: 401,
        message: "اسم المستخدم أو كلمة المرور غير صحيحة.",
      };
    }

    // Success -> generate secure signed cookie (8 hours session)
    const cookieHeader = makeSessionCookie(COOKIE_NAME, 8);
    return {
      success: true,
      status: 200,
      cookie: cookieHeader,
      username: expectedUser,
    };
  }

  static isAuthenticated(req) {
    return validateSessionCookie(req, COOKIE_NAME);
  }

  static logout() {
    return clearSessionCookie(COOKIE_NAME);
  }
}
