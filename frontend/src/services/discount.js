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

export const discountService = {
  /**
   * Preview discount calculation on checkout/reservation.
   * @param {{ code: string, subtotal: number }} payload
   */
  async previewDiscount({ code, subtotal }) {
    const res = await api.post("/orders/preview-discount", { code, subtotal });
    return res.data;
  },

  /**
   * Admin: List all discounts with pagination & filters
   */
  async adminListDiscounts(params = {}) {
    const qs = buildQuery(params);
    const res = await api.get(`/admin/discounts${qs}`);
    return {
      items: res.data?.items || res.data || [],
      pagination: res.data?.pagination || res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 },
    };
  },

  /**
   * Admin: Get single discount by ID
   */
  async adminGetDiscount(id) {
    const res = await api.get(`/admin/discounts/${id}`);
    return res.data;
  },

  /**
   * Admin: Create a new platform discount coupon
   */
  async adminCreateDiscount(payload) {
    const res = await api.post("/admin/discounts", payload);
    return res.data;
  },

  /**
   * Admin: Update an existing discount coupon
   */
  async adminUpdateDiscount(id, payload) {
    const res = await api.patch(`/admin/discounts/${id}`, payload);
    return res.data;
  },

  /**
   * Admin: Toggle discount active status
   */
  async adminToggleStatus(id, isActive) {
    const res = await api.patch(`/admin/discounts/${id}/status`, { isActive });
    return res.data;
  },

  /**
   * Admin: Delete discount coupon permanently
   */
  async adminDeleteDiscount(id) {
    const res = await api.delete(`/admin/discounts/${id}`);
    return res.data;
  },
};

export default discountService;
