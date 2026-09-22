import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authService } from "../services/auth";
import { api } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(api.getToken());
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authService.getMe();
      setUser(currentUser);
      return currentUser;
    } catch (err) {
      console.warn("Failed to refresh user session:", err.message);
      authService.logout();
      setUser(null);
      setToken(null);
      throw err;
    }
  }, []);

  // Initialize auth state from local storage token
  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      const storedToken = api.getToken();
      if (!storedToken) {
        if (isMounted) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const currentUser = await authService.getMe();
        if (isMounted) {
          setUser(currentUser);
          setToken(storedToken);
        }
      } catch (err) {
        console.warn("Failed to restore session:", err.message);
        authService.logout();
        if (isMounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await authService.login(credentials);
    setUser(data.user);
    setToken(data.token);
    return data;
  }, []);

  const register = useCallback(async (registrationData) => {
    const data = await authService.register(registrationData);
    setUser(data.user);
    setToken(data.token);
    return data;
  }, []);

  const registerPharmacy = useCallback(async (pharmacyData) => {
    const data = await authService.registerPharmacy(pharmacyData);
    setUser(data.user);
    setToken(data.token);
    return data;
  }, []);

  const registerDeliveryPartner = useCallback(async (deliveryData) => {
    const data = await authService.registerDeliveryPartner(deliveryData);
    setUser(data.user);
    setToken(data.token);
    return data;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setToken(null);
  }, []);

  const value = {
    user,
    token,
    role: user?.role || null,
    verificationStatus: user?.verificationStatus || null,
    rejectionReason: user?.rejectionReason || null,
    isAuthenticated: Boolean(user && token),
    isLoading,
    login,
    register,
    registerPharmacy,
    registerDeliveryPartner,
    refreshUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
