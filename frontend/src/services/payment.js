const API_BASE = "/api/v1";

function getAuthHeaders() {
  const token = localStorage.getItem("medilink_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse(res) {
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || json.error || "Request failed");
  }
  return json;
}

export const paymentService = {
  /**
   * Create or retrieve payment intent for an order.
   * @param {string} orderId
   * @param {"COD" | "UPI"} method
   */
  async createPaymentIntent(orderId, method) {
    const res = await fetch(`${API_BASE}/orders/${orderId}/payment`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ method }),
    });
    const json = await handleResponse(res);
    return json.data.payment;
  },

  /**
   * Get current payment status for an order.
   * @param {string} orderId
   */
  async getPaymentForOrder(orderId) {
    const res = await fetch(`${API_BASE}/orders/${orderId}/payment`, {
      headers: getAuthHeaders(),
    });
    const json = await handleResponse(res);
    return json.data.payment;
  },

  /**
   * Verify / confirm a payment (moves PENDING → PAID).
   * For COD: called after delivery confirmation.
   * For UPI: called with transactionReference from provider.
   * @param {string} paymentId
   * @param {{ transactionReference?: string, simulateStatus?: "PAID" | "FAILED", reason?: string }} payload
   */
  async verifyPayment(paymentId, payload = {}) {
    const res = await fetch(`${API_BASE}/payments/${paymentId}/verify`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await handleResponse(res);
    return json.data.payment;
  },

  /**
   * Mark a payment as failed.
   * @param {string} paymentId
   * @param {string} reason
   */
  async failPayment(paymentId, reason) {
    const res = await fetch(`${API_BASE}/payments/${paymentId}/fail`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    const json = await handleResponse(res);
    return json.data.payment;
  },

  // ─── Admin ───────────────────────────────────────────────────────────

  /**
   * Admin: List all payments with filtering.
   * @param {{ page?: number, limit?: number, status?: string, method?: string, search?: string }} params
   */
  async adminListPayments(params = {}) {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", params.page);
    if (params.limit) qs.set("limit", params.limit);
    if (params.status && params.status !== "all") qs.set("status", params.status);
    if (params.method && params.method !== "all") qs.set("method", params.method);
    if (params.search) qs.set("search", params.search);

    const res = await fetch(`${API_BASE}/admin/payments?${qs.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  /**
   * Admin: Get payment detail.
   * @param {string} paymentId
   */
  async adminGetPayment(paymentId) {
    const res = await fetch(`${API_BASE}/admin/payments/${paymentId}`, {
      headers: getAuthHeaders(),
    });
    const json = await handleResponse(res);
    return json.data.payment;
  },

  /**
   * Admin: Refund a payment.
   * @param {string} paymentId
   * @param {string} reason
   */
  async adminRefundPayment(paymentId, reason) {
    const res = await fetch(`${API_BASE}/admin/payments/${paymentId}/refund`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    const json = await handleResponse(res);
    return json.data.payment;
  },

  // ─── Settlements ─────────────────────────────────────────────────────

  /**
   * Pharmacy: Get my settlements.
   * @param {{ page?: number, status?: string }} params
   */
  async getMySettlements(params = {}) {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", params.page);
    if (params.status && params.status !== "all") qs.set("status", params.status);

    const res = await fetch(`${API_BASE}/pharmacy/settlements?${qs.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  /**
   * Admin: List all settlements.
   * @param {{ page?: number, status?: string, search?: string }} params
   */
  async adminListSettlements(params = {}) {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", params.page);
    if (params.limit) qs.set("limit", params.limit);
    if (params.status && params.status !== "all") qs.set("status", params.status);
    if (params.search) qs.set("search", params.search);

    const res = await fetch(`${API_BASE}/admin/settlements?${qs.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  /**
   * Admin: Mark settlement as SETTLED.
   * @param {string} settlementId
   * @param {string} [reference]
   */
  async adminSettleSettlement(settlementId, reference) {
    const res = await fetch(`${API_BASE}/admin/settlements/${settlementId}/settle`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ reference }),
    });
    const json = await handleResponse(res);
    return json.data.settlement;
  },

  /**
   * Admin: Mark settlement as FAILED.
   * @param {string} settlementId
   * @param {string} reason
   */
  async adminFailSettlement(settlementId, reason) {
    const res = await fetch(`${API_BASE}/admin/settlements/${settlementId}/fail`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    const json = await handleResponse(res);
    return json.data.settlement;
  },
};
