import { api } from "../lib/api";

export const reviewService = {
  /**
   * Submit a new review for a medicine, pharmacy, or delivery partner.
   */
  async createReview(payload) {
    const res = await api.post("/reviews", payload);
    return res.data;
  },

  /**
   * Update an existing review owned by the current customer.
   */
  async updateReview(id, payload) {
    const res = await api.patch(`/reviews/${id}`, payload);
    return res.data;
  },

  /**
   * Get the current customer's submitted reviews.
   */
  async getMyReviews({ page = 1, limit = 10 } = {}) {
    const res = await api.get(`/reviews/me?page=${page}&limit=${limit}`);
    return {
      items: res.data?.items || res.data || [],
      pagination: res.data?.pagination || res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 },
    };
  },

  /**
   * Check review status for a specific order.
   */
  async getOrderReviewStatus(orderId) {
    const res = await api.get(`/reviews/order-status/${orderId}`);
    return res.data;
  },

  /**
   * Public: Get reviews & aggregate rating for a medicine.
   */
  async getMedicineReviews(medicineId, { page = 1, limit = 10 } = {}) {
    const res = await api.get(`/medicines/${medicineId}/reviews?page=${page}&limit=${limit}`);
    return {
      items: res.data?.items || [],
      pagination: res.data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 },
      aggregate: res.data?.aggregate || { averageRating: 0, totalReviews: 0 },
    };
  },

  /**
   * Public: Get aggregate rating for a pharmacy.
   */
  async getPharmacyRating(pharmacyId) {
    const res = await api.get(`/pharmacies/${pharmacyId}/rating`);
    return res.data;
  },

  /**
   * Get aggregate rating for a delivery partner.
   */
  async getDeliveryPartnerRating(deliveryPartnerId) {
    const res = await api.get(`/reviews/delivery-partners/${deliveryPartnerId}/rating`);
    return res.data;
  },

  /**
   * Admin: List all reviews with filters & pagination.
   */
  async adminListReviews(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    if (params.search) query.set("search", params.search);
    if (params.isHidden !== undefined && params.isHidden !== "all" && params.isHidden !== "") {
      query.set("isHidden", String(params.isHidden));
    }
    if (params.minRating) query.set("minRating", String(params.minRating));
    if (params.maxRating) query.set("maxRating", String(params.maxRating));
    if (params.medicineId) query.set("medicineId", params.medicineId);
    if (params.pharmacyId) query.set("pharmacyId", params.pharmacyId);
    if (params.deliveryPartnerId) query.set("deliveryPartnerId", params.deliveryPartnerId);

    const res = await api.get(`/admin/reviews?${query.toString()}`);
    return {
      items: res.data?.items || [],
      pagination: res.data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 },
    };
  },

  /**
   * Admin: Toggle soft-hide status of a review.
   */
  async adminHideReview(id, isHidden = true) {
    const res = await api.patch(`/admin/reviews/${id}/hide`, { isHidden });
    return res.data;
  },

  /**
   * Admin: Permanently delete a review.
   */
  async adminDeleteReview(id) {
    const res = await api.delete(`/admin/reviews/${id}`);
    return res.data;
  },
};

export default reviewService;
