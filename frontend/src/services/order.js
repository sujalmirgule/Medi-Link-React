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

export const orderService = {
  /**
   * Customer: Place new order
   */
  async createOrder(orderData) {
    const res = await api.post("/orders", orderData);
    return res.data?.order;
  },

  /**
   * Customer: Get order history
   */
  async getCustomerOrders(params = {}) {
    const qs = buildQuery(params);
    const res = await api.get(`/orders${qs}`);
    return {
      items: res.data || [],
      pagination: res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 },
    };
  },

  /**
   * Customer: Get order details by ID
   */
  async getCustomerOrder(id) {
    const res = await api.get(`/orders/${id}`);
    return res.data?.order;
  },

  /**
   * Pharmacy: Get received orders
   */
  async getPharmacyOrders(params = {}) {
    const qs = buildQuery(params);
    const res = await api.get(`/pharmacy/orders${qs}`);
    return {
      items: res.data || [],
      pagination: res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 },
    };
  },

  /**
   * Pharmacy: Get single order details
   */
  async getPharmacyOrder(id) {
    const res = await api.get(`/pharmacy/orders/${id}`);
    return res.data?.order;
  },

  /**
   * Pharmacy: Accept pending order
   */
  async acceptOrder(id) {
    const res = await api.post(`/pharmacy/orders/${id}/accept`);
    return res.data?.order;
  },

  /**
   * Pharmacy: Reject pending order with reason
   */
  async rejectOrder(id, reason) {
    const res = await api.post(`/pharmacy/orders/${id}/reject`, { reason });
    return res.data?.order;
  },

  /**
   * Pharmacy: Mark order as preparing
   */
  async markPreparing(id) {
    const res = await api.post(`/pharmacy/orders/${id}/preparing`);
    return res.data?.order;
  },

  /**
   * Pharmacy: Mark order as ready for pickup
   */
  async markReady(id) {
    const res = await api.post(`/pharmacy/orders/${id}/ready`);
    return res.data?.order;
  },
};

export default orderService;
