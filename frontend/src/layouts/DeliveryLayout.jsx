import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { deliveryService } from "../services/delivery";
import {
  Truck,
  PackageCheck,
  History,
  User,
  LogOut,
  Menu,
  X,
  Lock,
  ExternalLink,
  ShieldCheck,
  Clock,
  XCircle,
  RefreshCw,
  Power,
} from "lucide-react";
import logo from "../assets/medilink-logo.png";
import "./delivery-layout.css";

export function DeliveryLayout() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAvailable, setIsAvailable] = useState(user?.deliveryPartner?.isAvailable || false);
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);

  const verificationStatus = user?.verificationStatus || "PENDING";
  const isVerified = verificationStatus === "VERIFIED";

  useEffect(() => {
    if (user?.deliveryPartner?.isAvailable !== undefined) {
      setIsAvailable(user.deliveryPartner.isAvailable);
    }
  }, [user]);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshUser();
      window.dispatchEvent(new CustomEvent("delivery:refresh"));
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  const handleToggleAvailability = async (newVal) => {
    if (!isVerified) {
      alert("Only verified delivery partners can set themselves available for orders.");
      return;
    }
    setIsTogglingAvailability(true);
    try {
      await deliveryService.updateAvailability(newVal);
      setIsAvailable(newVal);
      await refreshUser();
      window.dispatchEvent(new CustomEvent("delivery:refresh"));
    } catch (err) {
      alert(err.message || "Failed to update availability");
    } finally {
      setIsTogglingAvailability(false);
    }
  };

  const navItems = [
    {
      to: "/delivery/dashboard",
      label: "Dashboard",
      icon: Truck,
      end: true,
      requiresVerified: false,
    },
    {
      to: "/delivery/assignments",
      label: "Assignments",
      icon: PackageCheck,
      requiresVerified: true,
    },
    {
      to: "/delivery/history",
      label: "Delivery History",
      icon: History,
      requiresVerified: true,
    },
    {
      to: "/delivery/profile",
      label: "Partner Profile",
      icon: User,
      requiresVerified: false,
    },
  ];

  return (
    <div className="delivery-layout-container">
      {/* Mobile Backdrop Overlay */}
      <div
        className={`delivery-sidebar-overlay ${mobileMenuOpen ? "open" : ""}`}
        onClick={closeMobileMenu}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className={`delivery-sidebar ${mobileMenuOpen ? "open" : ""}`}>
        {/* Brand Header */}
        <div className="delivery-sidebar-brand">
          <img src={logo} alt="MediLink" />
          <span className="delivery-sidebar-brand-badge">Delivery</span>
        </div>

        {/* Navigation */}
        <nav className="delivery-sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isLocked = item.requiresVerified && !isVerified;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `delivery-nav-item ${isActive ? "active" : ""} ${isLocked ? "locked" : ""}`
                }
                onClick={(e) => {
                  if (isLocked) {
                    e.preventDefault();
                    alert(
                      "Delivery operations are locked until your account is approved by the MediLink administrator."
                    );
                    return;
                  }
                  closeMobileMenu();
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {isLocked && <Lock size={14} className="delivery-nav-item-lock" />}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="delivery-sidebar-footer">
          <div className="delivery-user-info-card">
            <div className="delivery-avatar">
              {(user?.deliveryPartner?.fullName?.[0] || user?.email?.[0] || "D").toUpperCase()}
            </div>
            <div className="delivery-user-details">
              <span className="delivery-user-email">
                {user?.deliveryPartner?.fullName || user?.email || "Delivery Partner"}
              </span>
              <span className="delivery-user-role">
                {isVerified ? "Verified Partner" : "Pending Verification"}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="delivery-logout-btn"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Viewport */}
      <div className="delivery-main-viewport">
        {/* Top Header */}
        <header className="delivery-header">
          <div className="delivery-header-left">
            <button
              className="delivery-mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h2 className="delivery-header-title">
              {user?.deliveryPartner?.fullName || "Delivery Partner Workspace"}
            </h2>
          </div>

          <div className="delivery-header-right">
            {/* Availability Toggle */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                padding: "6px 12px",
                borderRadius: "10px",
                opacity: isVerified ? 1 : 0.5,
              }}
            >
              <Power size={14} color={isAvailable && isVerified ? "#16a34a" : "#94a3b8"} />
              <span style={{ fontSize: "12px", fontWeight: 600 }}>
                {isAvailable && isVerified ? "Available" : "Offline"}
              </span>
              <input
                type="checkbox"
                disabled={!isVerified || isTogglingAvailability}
                checked={isAvailable && isVerified}
                onChange={(e) => handleToggleAvailability(e.target.checked)}
                style={{ cursor: isVerified ? "pointer" : "not-allowed" }}
              />
            </div>

            {/* Verification Status Chip */}
            {isVerified ? (
              <span className="delivery-badge delivery-badge-verified">
                <ShieldCheck size={13} />
                <span>Verified</span>
              </span>
            ) : verificationStatus === "REJECTED" ? (
              <span className="delivery-badge delivery-badge-rejected">
                <XCircle size={13} />
                <span>Rejected</span>
              </span>
            ) : (
              <span className="delivery-badge delivery-badge-pending">
                <Clock size={13} />
                <span>Pending Review</span>
              </span>
            )}

            <button
              onClick={handleRefresh}
              className="delivery-btn delivery-btn-secondary delivery-btn-sm"
              title="Refresh Account Status"
              disabled={isRefreshing}
            >
              <RefreshCw size={14} className={isRefreshing ? "spin" : ""} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => navigate("/")}
              className="delivery-btn delivery-btn-secondary delivery-btn-sm"
              title="View Public Marketplace"
            >
              <ExternalLink size={14} />
              <span>Public Store</span>
            </button>
          </div>
        </header>

        {/* Page Content Outlet */}
        <main className="delivery-page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DeliveryLayout;
