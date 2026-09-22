import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./index.css";

import App from "./App.jsx";
import Login from "./pages/login.jsx";
import Register from "./pages/register.jsx";
import UserDashboard from "./pages/user-dashboard.jsx";
import PharmacyDashboard from "./pages/pharmacy-dashboard.jsx";
import DeliveryDashboard from "./pages/delivery-dashboard.jsx";
import AdminDashboard from "./pages/admin-dashboard.jsx";
import MedicineSearch from "./pages/medicine-search.jsx";
import MedicineDetails from "./pages/medicine-details.jsx";
import PharmacySelection from "./pages/pharmacy-selection.jsx";
import Reservation from "./pages/reservation.jsx";

import { AuthProvider } from "./context/AuthContext.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Role-Protected Dashboards */}
          <Route
            path="/user/dashboard"
            element={
              <ProtectedRoute allowedRoles={["CUSTOMER", "ADMIN"]}>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pharmacy/dashboard"
            element={
              <ProtectedRoute allowedRoles={["PHARMACY", "ADMIN"]}>
                <PharmacyDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/delivery/dashboard"
            element={
              <ProtectedRoute allowedRoles={["DELIVERY_PARTNER", "ADMIN"]}>
                <DeliveryDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Customer Medicine Browsing Pages */}
          <Route path="/medicines" element={<MedicineSearch />} />
          <Route path="/medicine-details" element={<MedicineDetails />} />
          <Route path="/pharmacy-selection" element={<PharmacySelection />} />
          <Route path="/reservation" element={<Reservation />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);