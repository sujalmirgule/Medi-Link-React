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

export const adminService = {
  /**
   * 1. Get real-time dashboard statistics & recent activity
   */
  async getDashboard() {
    const res = await api.get("/admin/dashboard");
    return res.data;
  },

  /**
   * 2. Verification Applications
   */
  async getVerifications(params = {}) {
    const qs = buildQuery(params);
    const res = await api.get(`/admin/verifications${qs}`);
    return {
      items: res.data?.applications || res.data?.items || [],
      pagination: res.pagination || res.data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 },
    };
  },

  async getVerification(id) {
    const res = await api.get(`/admin/verifications/${id}`);
    return res.data?.application;
  },

  async approveVerification(id) {
    const res = await api.post(`/admin/verifications/${id}/approve`);
    return res.data?.application;
  },

  async rejectVerification(id, reason) {
    const res = await api.post(`/admin/verifications/${id}/reject`, { reason });
    return res.data?.application;
  },

  /**
   * 3. User Management
   */
  async getUsers(params = {}) {
    const qs = buildQuery(params);
    const res = await api.get(`/admin/users${qs}`);
    return {
      items: res.data || [],
      pagination: res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 },
    };
  },

  async getUser(id) {
    const res = await api.get(`/admin/users/${id}`);
    return res.data?.user;
  },

  async updateUserStatus(id, isActive) {
    const res = await api.patch(`/admin/users/${id}/status`, { isActive });
    return res.data?.user;
  },

  /**
   * 4. Pharmacy Directory
   */
  async getPharmacies(params = {}) {
    const qs = buildQuery(params);
    const res = await api.get(`/admin/pharmacies${qs}`);
    return {
      items: res.data || [],
      pagination: res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 },
    };
  },

  async getPharmacy(id) {
    const res = await api.get(`/admin/pharmacies/${id}`);
    return res.data?.pharmacy;
  },

  /**
   * 5. Delivery Partner Directory
   */
  async getDeliveryPartners(params = {}) {
    const qs = buildQuery(params);
    const res = await api.get(`/admin/delivery-partners${qs}`);
    return {
      items: res.data || [],
      pagination: res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 },
    };
  },

  async getDeliveryPartner(id) {
    const res = await api.get(`/admin/delivery-partners/${id}`);
    return res.data?.partner;
  },

  /**
   * 6. Audit Logs
   */
  async getAuditLogs(params = {}) {
    const qs = buildQuery(params);
    const res = await api.get(`/admin/audit-logs${qs}`);
    return {
      items: res.data || [],
      pagination: res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 },
    };
  },

  /**
   * 7. Admin Profile
   */
  async getProfile() {
    const res = await api.get("/admin/profile");
    return res.data?.profile;
  },
};

export default adminService;
