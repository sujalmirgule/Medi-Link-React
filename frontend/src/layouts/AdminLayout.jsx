import { useState, useEffect, useCallback } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { adminService } from "../services/admin";
import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  Store,
  Truck,
  PackageCheck,
  FileText,
  UserCheck,
  LogOut,
  Menu,
  X,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import logo from "../assets/medilink-logo.png";
import "./admin-layout.css";

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchBadgeCounts = useCallback(async () => {
    try {
      const stats = await adminService.getDashboard();
      if (stats?.metrics) {
        setPendingCount(stats.metrics.pendingVerificationsTotal || 0);
      }
    } catch {
      // Non-blocking for layout rendering
    }
  }, []);

  useEffect(() => {
    fetchBadgeCounts();
  }, [fetchBadgeCounts, location.pathname]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchBadgeCounts();
    // Dispatch custom event if child pages want to refresh
    window.dispatchEvent(new CustomEvent("admin:refresh"));
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const navItems = [
    {
      to: "/admin/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      to: "/admin/verifications",
      label: "Verifications",
      icon: ShieldCheck,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      to: "/admin/users",
      label: "User Management",
      icon: Users,
    },
    {
      to: "/admin/pharmacies",
      label: "Pharmacies",
      icon: Store,
    },
    {
      to: "/admin/delivery-partners",
      label: "Delivery Partners",
      icon: Truck,
    },
    {
      to: "/admin/deliveries",
      label: "Deliveries",
      icon: PackageCheck,
    },
    {
      to: "/admin/audit-logs",
      label: "Audit Logs",
      icon: FileText,
    },
    {
      to: "/admin/profile",
      label: "Admin Profile",
      icon: UserCheck,
    },
  ];

  return (
    <div className="admin-layout-container">
      {/* Mobile Backdrop Overlay */}
      <div
        className={`admin-sidebar-overlay ${mobileMenuOpen ? "open" : ""}`}
        onClick={closeMobileMenu}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? "open" : ""}`}>
        {/* Brand Header */}
        <div className="admin-sidebar-brand">
          <img src={logo} alt="MediLink" />
          <span className="admin-sidebar-brand-badge">Admin</span>
        </div>

        {/* Navigation */}
        <nav className="admin-sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/admin/dashboard"}
                className={({ isActive }) =>
                  `admin-nav-item ${isActive ? "active" : ""}`
                }
                onClick={closeMobileMenu}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.badge !== null && (
                  <span className="admin-nav-item-badge">{item.badge}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="admin-sidebar-footer">
          <div className="admin-user-info-card">
            <div className="admin-avatar">
              {(user?.email?.[0] || "A").toUpperCase()}
            </div>
            <div className="admin-user-details">
              <span className="admin-user-email">{user?.email || "Admin"}</span>
              <span className="admin-user-role">Administrator</span>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="admin-logout-btn"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Viewport */}
      <div className="admin-main-viewport">
        {/* Top Header */}
        <header className="admin-header">
          <div className="admin-header-left">
            <button
              className="admin-mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h2 className="admin-header-title">MediLink Operations Portal</h2>
          </div>

          <div className="admin-header-right">
            <div className="admin-status-chip">
              <span className="admin-status-dot" />
              <span>System Live</span>
            </div>

            <button
              onClick={handleManualRefresh}
              className="admin-btn admin-btn-secondary admin-btn-sm"
              title="Refresh Portal Data"
              disabled={isRefreshing}
            >
              <RefreshCw size={14} className={isRefreshing ? "spin" : ""} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => navigate("/")}
              className="admin-btn admin-btn-secondary admin-btn-sm"
              title="View Public Marketplace"
            >
              <ExternalLink size={14} />
              <span>Public Store</span>
            </button>
          </div>
        </header>

        {/* Nested Content Route */}
        <main className="admin-page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
