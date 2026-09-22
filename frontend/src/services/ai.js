import api from "./auth";

export const aiService = {
  /**
   * Send a chat inquiry to MediLink Medicine Information AI Assistant
   * @param {Object} payload - { message: string, medicineId?: string }
   */
  async chat(payload) {
    const response = await api.post("/ai/chat", payload);
    return response.data?.data || response.data;
  },
};
