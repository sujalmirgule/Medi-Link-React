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

export const deliveryService = {
  /**
   * Partner: Get dashboard statistics and active delivery
   */
  async getDashboard() {
    const res = await api.get("/delivery/dashboard");
    return res.data;
  },

  /**
   * Partner: Toggle availability status
   */
  async updateAvailability(isAvailable) {
    const res = await api.patch("/delivery/availability", { isAvailable });
    return res.data;
  },

  /**
   * Partner: Get list of assignments (with optional status filter and pagination)
   */
  async getAssignments(params = {}) {
    const qs = buildQuery(params);
    const res = await api.get(`/delivery/assignments${qs}`);
    return {
      items: res.data || [],
      pagination: res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 },
    };
  },

  /**
   * Partner: Get single delivery assignment details
   */
  async getAssignment(id) {
    const res = await api.get(`/delivery/assignments/${id}`);
    return res.data?.delivery;
  },

  /**
   * Partner: Accept assigned delivery
   */
  async acceptAssignment(id) {
    const res = await api.post(`/delivery/assignments/${id}/accept`);
    return res.data?.delivery;
  },

  /**
   * Partner: Mark delivery as picked up from pharmacy
   */
  async pickupAssignment(id) {
    const res = await api.post(`/delivery/assignments/${id}/pickup`);
    return res.data?.delivery;
  },

  /**
   * Partner: Mark delivery as out for delivery (triggers OTP generation)
   */
  async outForDelivery(id) {
    const res = await api.post(`/delivery/assignments/${id}/out-for-delivery`);
    return res.data?.delivery;
  },

  /**
   * Partner: Complete delivery with customer OTP
   */
  async completeDelivery(id, otp) {
    const res = await api.post(`/delivery/assignments/${id}/complete`, { otp });
    return res.data?.delivery;
  },

  /**
   * Partner: Mark delivery as failed with mandatory reason
   */
  async failDelivery(id, reason) {
    const res = await api.post(`/delivery/assignments/${id}/fail`, { reason });
    return res.data?.delivery;
  },

  /**
   * Partner: Update live GPS coordinates
   */
  async updateLocation(id, { latitude, longitude }) {
    const res = await api.patch(`/delivery/assignments/${id}/location`, { latitude, longitude });
    return res.data?.delivery;
  },

  /**
   * Partner: Get partner profile
   */
  async getProfile() {
    const res = await api.get("/delivery/profile");
    return res.data?.profile;
  },

  /**
   * Partner: Update partner profile
   */
  async updateProfile(data) {
    const res = await api.patch("/delivery/profile", data);
    return res.data?.profile;
  },

  // ================= ADMIN DELIVERY OPERATIONS =================

  /**
   * Admin: Assign delivery partner to order
   */
  async assignDeliveryAdmin(orderId, deliveryPartnerId) {
    const res = await api.post("/admin/deliveries/assign", { orderId, deliveryPartnerId });
    return res.data?.delivery;
  },

  /**
   * Admin: Get list of all deliveries
   */
  async getDeliveriesAdmin(params = {}) {
    const qs = buildQuery(params);
    const res = await api.get(`/admin/deliveries${qs}`);
    return {
      items: res.data || [],
      pagination: res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 },
    };
  },

  /**
   * Admin: Get single delivery details
   */
  async getDeliveryAdmin(id) {
    const res = await api.get(`/admin/deliveries/${id}`);
    return res.data?.delivery;
  },

  /**
   * Admin: Get orders eligible for delivery assignment
   */
  async getEligibleOrdersAdmin() {
    const res = await api.get("/admin/orders/eligible-for-delivery");
    return res.data || [];
  },

  /**
   * Admin: Get delivery partners eligible for assignment
   */
  async getEligiblePartnersAdmin() {
    const res = await api.get("/admin/delivery-partners/eligible");
    return res.data || [];
  },
};

export default deliveryService;
