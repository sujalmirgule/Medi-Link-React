import { api } from "../lib/api";

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "" && value !== "all") {
      query.append(key, String(value));
    }
  }
  const str = query.toString();
  return str ? `?${str}` : "";
}

export const pharmacyService = {
  /**
   * 1. Dashboard
   */
  async getDashboard() {
    const res = await api.get("/pharmacy/dashboard");
    return res.data;
  },

  /**
   * 2. Profile
   */
  async getProfile() {
    const res = await api.get("/pharmacy/profile");
    return res.data?.pharmacy;
  },

  async updateProfile(profileData) {
    const res = await api.patch("/pharmacy/profile", profileData);
    return res.data?.pharmacy;
  },

  /**
   * 3. Catalog & Categories
   */
  async getCatalog(params = {}) {
    const qs = buildQuery(params);
    const res = await api.get(`/pharmacy/medicines/catalog${qs}`);
    return {
      items: res.data || [],
      pagination: res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 },
    };
  },

  async getCategories() {
    const res = await api.get("/pharmacy/categories");
    return res.data || [];
  },

  /**
   * 4. Pharmacy Medicine Listings
   */
  async getMedicines(params = {}) {
    const qs = buildQuery(params);
    const res = await api.get(`/pharmacy/medicines${qs}`);
    return {
      items: res.data || [],
      pagination: res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 },
    };
  },

  async getMedicine(id) {
    const res = await api.get(`/pharmacy/medicines/${id}`);
    return res.data?.medicine;
  },

  async createMedicine(medicineData) {
    const res = await api.post("/pharmacy/medicines", medicineData);
    return res.data?.medicine;
  },

  async updateMedicine(id, medicineData) {
    const res = await api.patch(`/pharmacy/medicines/${id}`, medicineData);
    return res.data?.medicine;
  },

  async deleteMedicine(id) {
    const res = await api.delete(`/pharmacy/medicines/${id}`);
    return res;
  },

  /**
   * 5. Inventory & Batches
   */
  async getInventory(params = {}) {
    const qs = buildQuery(params);
    const res = await api.get(`/pharmacy/inventory${qs}`);
    return {
      items: res.data || [],
      pagination: res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 },
    };
  },

  async getInventoryBatch(id) {
    const res = await api.get(`/pharmacy/inventory/${id}`);
    return res.data?.batch;
  },

  async createInventoryBatch(batchData) {
    const res = await api.post("/pharmacy/inventory", batchData);
    return res.data?.batch;
  },

  async updateInventoryBatch(id, batchData) {
    const res = await api.patch(`/pharmacy/inventory/${id}`, batchData);
    return res.data?.batch;
  },
};

export default pharmacyService;
