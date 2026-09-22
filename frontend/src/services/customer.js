import { api } from "../lib/api";

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "" && value !== "all" && value !== "All") {
      query.append(key, String(value));
    }
  }
  const str = query.toString();
  return str ? `?${str}` : "";
}

export const customerService = {
  /**
   * Search master medicines catalog with pricing & availability aggregates
   */
  async searchMedicines(params = {}) {
    const qs = buildQuery(params);
    const res = await api.get(`/medicines${qs}`);
    return {
      items: res.data || [],
      pagination: res.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 },
    };
  },

  /**
   * Get single medicine details
   */
  async getMedicine(id) {
    const res = await api.get(`/medicines/${id}`);
    return res.data?.medicine;
  },

  /**
   * Get verified pharmacies offering a medicine with live stock and pricing
   */
  async getMedicinePharmacies(medicineId) {
    const res = await api.get(`/medicines/${medicineId}/pharmacies`);
    return res.data || [];
  },

  /**
   * Discover verified pharmacies
   */
  async searchPharmacies(params = {}) {
    const qs = buildQuery(params);
    const res = await api.get(`/pharmacies${qs}`);
    return {
      items: res.data || [],
      pagination: res.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 },
    };
  },

  /**
   * Get customer's saved delivery addresses
   */
  async getCustomerAddresses() {
    const res = await api.get("/customer/addresses");
    return res.data || [];
  },

  /**
   * Add new customer delivery address
   */
  async createCustomerAddress(addressData) {
    const res = await api.post("/customer/addresses", addressData);
    return res.data?.address;
  },
};

export default customerService;
