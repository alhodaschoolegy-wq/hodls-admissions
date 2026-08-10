import { ApiService } from "../services/apiService.js";
import { TrackingView } from "../views/trackingView.js";

export class TrackingController {
  constructor() {
    this.searchBtn = document.getElementById("btnSearchStatus");
    this.searchInput = document.getElementById("searchQuery");
    this.initEvents();
  }

  initEvents() {
    if (!this.searchBtn || !this.searchInput) return;

    this.searchBtn.addEventListener("click", () => this.handleSearch());
    this.searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.handleSearch();
      }
    });
  }

  async handleSearch() {
    const rawVal = this.searchInput.value.trim();
    if (!rawVal) {
      TrackingView.showError("يرجى إدخال رقم الطلب (مثال: HODLS-2026-00001) أو الرقم القومي للطالب.");
      return;
    }

    const isNid = /^\d{14}$/.test(rawVal);
    const query = isNid ? { nationalId: rawVal } : { id: rawVal.toUpperCase() };

    this.searchBtn.disabled = true;
    this.searchBtn.innerHTML = '<span class="spinner"></span> جاري البحث...';

    try {
      const data = await ApiService.getApplicationStatus(query);
      if (!data.found) {
        TrackingView.showError(data.message || "لم يتم العثور على أي طلب مسجل بهذه البيانات. يرجى التأكد من الرقم والمحاولة مجدداً.");
      } else {
        TrackingView.renderStatus(data);
      }
    } catch (err) {
      TrackingView.showError(err.message || "حدث خطأ أثناء الاتصال بقاعدة البيانات.");
    } finally {
      this.searchBtn.disabled = false;
      this.searchBtn.innerHTML = 'بحث عن الطلب';
    }
  }
}
