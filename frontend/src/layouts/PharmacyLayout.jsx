import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Store,
  Package,
  Layers,
  ShoppingBag,
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
} from "lucide-react";
import logo from "../assets/medilink-logo.png";
import "./pharmacy-layout.css";

export function PharmacyLayout() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const verificationStatus = user?.verificationStatus || "PENDING";
  const isVerified = verificationStatus === "VERIFIED";

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshUser();
      window.dispatchEvent(new CustomEvent("pharmacy:refresh"));
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  const navItems = [
    {
      to: "/pharmacy/dashboard",
      label: "Dashboard",
      icon: Store,
      end: true,
      requiresVerified: false,
    },
    {
      to: "/pharmacy/orders",
      label: "Customer Orders",
      icon: ShoppingBag,
      requiresVerified: true,
    },
    {
      to: "/pharmacy/medicines",
      label: "Manage Medicines",
      icon: Package,
      requiresVerified: true,
    },
    {
      to: "/pharmacy/inventory",
      label: "Inventory Batches",
      icon: Layers,
      requiresVerified: true,
    },
    {
      to: "/pharmacy/profile",
      label: "Pharmacy Profile",
      icon: User,
      requiresVerified: false,
    },
  ];

  return (
    <div className="pharmacy-layout-container">
      {/* Mobile Backdrop Overlay */}
      <div
        className={`pharmacy-sidebar-overlay ${mobileMenuOpen ? "open" : ""}`}
        onClick={closeMobileMenu}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className={`pharmacy-sidebar ${mobileMenuOpen ? "open" : ""}`}>
        {/* Brand Header */}
        <div className="pharmacy-sidebar-brand">
          <img src={logo} alt="MediLink" />
          <span className="pharmacy-sidebar-brand-badge">Pharmacy</span>
        </div>

        {/* Navigation */}
        <nav className="pharmacy-sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isLocked = item.requiresVerified && !isVerified;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `pharmacy-nav-item ${isActive ? "active" : ""} ${isLocked ? "locked" : ""}`
                }
                onClick={(e) => {
                  if (isLocked) {
                    e.preventDefault();
                    alert(
                      "Business operations are locked until your pharmacy verification is approved by the MediLink administrator."
                    );
                    return;
                  }
                  closeMobileMenu();
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {isLocked && <Lock size={14} className="pharmacy-nav-item-lock" />}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="pharmacy-sidebar-footer">
          <div className="pharmacy-user-info-card">
            <div className="pharmacy-avatar">
              {(user?.pharmacy?.name?.[0] || user?.email?.[0] || "P").toUpperCase()}
            </div>
            <div className="pharmacy-user-details">
              <span className="pharmacy-user-email">
                {user?.pharmacy?.name || user?.email || "Pharmacy Store"}
              </span>
              <span className="pharmacy-user-role">
                {isVerified ? "Verified Partner" : "Pending Verification"}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="pharmacy-logout-btn"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Viewport */}
      <div className="pharmacy-main-viewport">
        {/* Top Header */}
        <header className="pharmacy-header">
          <div className="pharmacy-header-left">
            <button
              className="pharmacy-mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h2 className="pharmacy-header-title">
              {user?.pharmacy?.name || "Pharmacy Workspace"}
            </h2>
          </div>

          <div className="pharmacy-header-right">
            {/* Verification Status Chip */}
            {isVerified ? (
              <span className="pharmacy-badge pharmacy-badge-verified">
                <ShieldCheck size={13} />
                <span>Verified Partner</span>
              </span>
            ) : verificationStatus === "REJECTED" ? (
              <span className="pharmacy-badge pharmacy-badge-rejected">
                <XCircle size={13} />
                <span>Rejected</span>
              </span>
            ) : (
              <span className="pharmacy-badge pharmacy-badge-pending">
                <Clock size={13} />
                <span>Verification Pending</span>
              </span>
            )}

            <button
              onClick={handleRefresh}
              className="pharmacy-btn pharmacy-btn-secondary pharmacy-btn-sm"
              title="Refresh Account Status"
              disabled={isRefreshing}
            >
              <RefreshCw size={14} className={isRefreshing ? "spin" : ""} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => navigate("/")}
              className="pharmacy-btn pharmacy-btn-secondary pharmacy-btn-sm"
              title="View Public Marketplace"
            >
              <ExternalLink size={14} />
              <span>Public Store</span>
            </button>
          </div>
        </header>

        {/* Page Content Outlet */}
        <main className="pharmacy-page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default PharmacyLayout;
