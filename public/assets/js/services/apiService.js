/**
 * Service: API Client
 */
export class ApiService {
  static get BASE_URL() {
    return "/api";
  }

  static async request(action, options = {}) {
    const url = `${this.BASE_URL}?action=${encodeURIComponent(action)}`;
    const defaultHeaders = {
      "Accept": "application/json",
      "Content-Type": "application/json",
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
    };

    try {
      const response = await fetch(url, config);
      const text = await response.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("تعذر قراءة استجابة الخادم. يرجى التأكد من اتصال الإنترنت.");
      }

      if (!response.ok) {
        const errorMsg = data.message || `خطأ بالخادم (${response.status})`;
        const error = new Error(errorMsg);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        throw new Error("تعذر الاتصال بالنظام. تحقق من اتصالك بالإنترنت.");
      }
      throw err;
    }
  }

  static async submitApplication(formData) {
    return await this.request("submitApplication", {
      method: "POST",
      body: JSON.stringify(formData),
    });
  }

  static async getApplicationStatus(query) {
    const params = new URLSearchParams(query).toString();
    const url = `${this.BASE_URL}?action=getApplicationStatus&${params}`;
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "حدث خطأ أثناء الاستعلام.");
    }
    return data;
  }
}
