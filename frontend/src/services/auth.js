import { api } from "../lib/api";

/**
 * Frontend Authentication Service
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
   * Register a new user account
   */
  async register(registrationData) {
    const res = await api.post("/auth/register", registrationData);
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

export default authService;
