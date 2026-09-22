import { api } from "../lib/api";

/**
 * Frontend Authentication & Verification Service
 */
export const authService = {
  /**
   * Log in user with email/phone and password
   */
  async login(credentials) {
    const res = await api.post("/auth/login", credentials);
    if (res.data?.token) {
      api.setToken(res.data.token);
    }
    return res.data;
  },

  /**
   * Register a Customer account
   */
  async register(registrationData) {
    const res = await api.post("/auth/register", registrationData);
    if (res.data?.token) {
      api.setToken(res.data.token);
    }
    return res.data;
  },

  /**
   * Register a Pharmacy account
   */
  async registerPharmacy(pharmacyData) {
    const res = await api.post("/auth/register/pharmacy", pharmacyData);
    if (res.data?.token) {
      api.setToken(res.data.token);
    }
    return res.data;
  },

  /**
   * Register a Delivery Partner account
   */
  async registerDeliveryPartner(deliveryData) {
    const res = await api.post("/auth/register/delivery-partner", deliveryData);
    if (res.data?.token) {
      api.setToken(res.data.token);
    }
    return res.data;
  },

  /**
   * Fetch current authenticated user profile
   */
  async getMe() {
    const res = await api.get("/auth/me");
    return res.data?.user;
  },

  /**
   * Log out user and clear stored token
   */
  logout() {
    api.clearToken();
  },

  /**
   * Check if user has an active token stored
   */
  isAuthenticated() {
    return Boolean(api.getToken());
  },
};

/**
 * Admin Verification Service
 */
export const adminService = {
  /**
   * Get list of verification requests with optional status and role filters
   */
  async getVerifications(filters = {}) {
    const query = new URLSearchParams();
    if (filters.status && filters.status !== "all") query.append("status", filters.status);
    if (filters.role && filters.role !== "all") query.append("role", filters.role);
    const queryString = query.toString();
    const endpoint = `/admin/verifications${queryString ? `?${queryString}` : ""}`;
    const res = await api.get(endpoint);
    return res.data?.applications || [];
  },

  /**
   * Get single verification application detail
   */
  async getVerification(id) {
    const res = await api.get(`/admin/verifications/${id}`);
    return res.data?.application;
  },

  /**
   * Approve application
   */
  async approveVerification(id) {
    const res = await api.post(`/admin/verifications/${id}/approve`);
    return res.data?.application;
  },

  /**
   * Reject application with reason
   */
  async rejectVerification(id, reason) {
    const res = await api.post(`/admin/verifications/${id}/reject`, { reason });
    return res.data?.application;
  },
};

/**
 * Verification Test API Helpers
 */
export const verificationTestService = {
  async testPharmacyAccess() {
    return api.get("/pharmacy/verification-access-test");
  },
  async testDeliveryAccess() {
    return api.get("/delivery/verification-access-test");
  },
};

export default authService;
