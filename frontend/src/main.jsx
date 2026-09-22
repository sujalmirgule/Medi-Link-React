import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import "./index.css";

import App from "./App.jsx";
import Login from "./pages/login.jsx";
import Register from "./pages/register.jsx";
import UserDashboard from "./pages/user-dashboard.jsx";
import DeliveryDashboard from "./pages/delivery-dashboard.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminVerifications from "./pages/admin/AdminVerifications.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminPharmacies from "./pages/admin/AdminPharmacies.jsx";
import AdminDeliveryPartners from "./pages/admin/AdminDeliveryPartners.jsx";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs.jsx";
import AdminProfile from "./pages/admin/AdminProfile.jsx";

// Phase 5 & 7: Pharmacy Portal & Orders
import PharmacyLayout from "./layouts/PharmacyLayout.jsx";
import PharmacyDashboard from "./pages/pharmacy/PharmacyDashboard.jsx";
import PharmacyMedicines from "./pages/pharmacy/PharmacyMedicines.jsx";
import PharmacyMedicineDetail from "./pages/pharmacy/PharmacyMedicineDetail.jsx";
import PharmacyInventory from "./pages/pharmacy/PharmacyInventory.jsx";
import PharmacyInventoryDetail from "./pages/pharmacy/PharmacyInventoryDetail.jsx";
import PharmacyProfile from "./pages/pharmacy/PharmacyProfile.jsx";
import PharmacyOrders from "./pages/pharmacy/PharmacyOrders.jsx";
import PharmacyOrderDetail from "./pages/pharmacy/PharmacyOrderDetail.jsx";

// Phase 6 & 7: Customer Marketplace & Order Lifecycle
import MedicineSearch from "./pages/medicine-search.jsx";
import MedicineDetails from "./pages/medicine-details.jsx";
import PharmacySelection from "./pages/pharmacy-selection.jsx";
import Reservation from "./pages/reservation.jsx";
import OrderConfirmation from "./pages/order-confirmation.jsx";
import UserOrders from "./pages/user-orders.jsx";
import UserOrderDetail from "./pages/user-order-detail.jsx";

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

          {/* Role-Protected Customer & Delivery Dashboards */}
          <Route
            path="/user/dashboard"
            element={
              <ProtectedRoute allowedRoles={["CUSTOMER", "ADMIN"]}>
                <UserDashboard />
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

          {/* Customer Order Management */}
          <Route
            path="/order-confirmation"
            element={
              <ProtectedRoute allowedRoles={["CUSTOMER", "ADMIN"]}>
                <OrderConfirmation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/orders"
            element={
              <ProtectedRoute allowedRoles={["CUSTOMER", "ADMIN"]}>
                <UserOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/orders/:id"
            element={
              <ProtectedRoute allowedRoles={["CUSTOMER", "ADMIN"]}>
                <UserOrderDetail />
              </ProtectedRoute>
            }
          />

          {/* Phase 5 & 7: Production Pharmacy Portal */}
          <Route
            path="/pharmacy"
            element={
              <ProtectedRoute allowedRoles={["PHARMACY", "ADMIN"]}>
                <PharmacyLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<PharmacyDashboard />} />
            <Route path="dashboard" element={<PharmacyDashboard />} />
            <Route path="orders" element={<PharmacyOrders />} />
            <Route path="orders/:id" element={<PharmacyOrderDetail />} />
            <Route path="medicines" element={<PharmacyMedicines />} />
            <Route path="medicines/:id" element={<PharmacyMedicineDetail />} />
            <Route path="inventory" element={<PharmacyInventory />} />
            <Route path="inventory/:id" element={<PharmacyInventoryDetail />} />
            <Route path="profile" element={<PharmacyProfile />} />
          </Route>

          {/* Legacy Pharmacy Dashboard Redirect */}
          <Route path="/pharmacy-dashboard" element={<Navigate to="/pharmacy/dashboard" replace />} />

          {/* Phase 4: Production Admin Portal */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="verifications" element={<AdminVerifications />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="pharmacies" element={<AdminPharmacies />} />
            <Route path="delivery-partners" element={<AdminDeliveryPartners />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
            <Route path="profile" element={<AdminProfile />} />
          </Route>

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