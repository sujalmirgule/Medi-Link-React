import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Home,
  Search,
  MapPin,
  Package,
  Heart,
  Lightbulb,
  MessageCircle,
  Bell,
  ChevronDown,
  ArrowRight,
  Pill,
  ShieldCheck,
  Users,
  Store,
  Truck,
  Star,
  ShoppingBag,
  Bot,
  Droplets,
  Menu,
  X,
  LogOut,
} from "lucide-react";

import logo from "../assets/medilink-logo.png";

import "./user-dashboard.css";

function UserDashboard() {
  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState("Home");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [selectedLocation, setSelectedLocation] = useState(
    "Mumbai, Maharashtra"
  );

  const [locationOpen, setLocationOpen] = useState(false);

  const locations = [
    "Mumbai, Maharashtra",
    "Thane, Maharashtra",
    "Kalyan, Maharashtra",
    "Navi Mumbai, Maharashtra",
    "Pune, Maharashtra",
  ];

  const menuItems = [
    { label: "Home", icon: Home },
    { label: "Search Medicines", icon: Search },
    { label: "Nearby Pharmacies", icon: MapPin },
    { label: "My Orders", icon: Package },
    { label: "Saved Medicines", icon: Heart },
    { label: "Health Tips", icon: Lightbulb },
    { label: "Chat Support", icon: MessageCircle },
  ];

  const quickActions = [
    {
      title: "Search Medicine",
      subtitle: "Find medicines nearby",
      icon: Search,
      className: "blue",
    },
    {
      title: "Nearby Pharmacies",
      subtitle: "Locate trusted stores",
      icon: MapPin,
      className: "green",
    },
    {
      title: "My Orders",
      subtitle: "Track your orders",
      icon: Package,
      className: "orange",
    },
    {
      title: "Saved Medicines",
      subtitle: "View your wishlist",
      icon: Heart,
      className: "pink",
    },
  ];

  const pharmacies = [
    {
      name: "Kothrud Medical Store",
      rating: "4.8",
      reviews: "120",
      distance: "1.2 km",
      status: "Open",
    },
    {
      name: "CarePlus Pharmacy",
      rating: "4.6",
      reviews: "98",
      distance: "2.4 km",
      status: "Open",
    },
    {
      name: "LifeCare Pharmacy",
      rating: "4.4",
      reviews: "76",
      distance: "3.1 km",
      status: "Closed",
    },
    {
      name: "MedZone Pharmacy",
      rating: "4.7",
      reviews: "112",
      distance: "4.3 km",
      status: "Open",
    },
  ];

  const orders = [
    {
      medicine: "Crocin 500mg",
      quantity: "10 tablets",
      status: "Delivered",
      date: "12 Mar 2025",
    },
    {
      medicine: "Azithromycin 500mg",
      quantity: "6 tablets",
      status: "In Transit",
      date: "09 Mar 2025",
    },
  ];

  const popularMedicines = [
    {
      name: "Paracetamol 500mg",
      price: "₹28",
    },
    {
      name: "Amoxicillin 500mg",
      price: "₹52",
    },
    {
      name: "Cetirizine 10mg",
      price: "₹35",
    },
    {
      name: "Pantoprazole 40mg",
      price: "₹68",
    },
  ];

  const reminders = [
    {
      name: "Paracetamol 500mg",
      time: "Today, 10:00 AM",
    },
    {
      name: "Vitamin D3",
      time: "Tomorrow, 09:00 AM",
    },
  ];

  // ==========================================
  // SIDEBAR NAVIGATION
  // ==========================================

  const handleMenuClick = (label) => {
    setActiveMenu(label);
    setSidebarOpen(false);

    if (label === "Home") {
      navigate("/user/dashboard");
      return;
    }

    if (label === "Search Medicines") {
      navigate("/medicines");
      return;
    }
  };

  // ==========================================
  // QUICK ACTION NAVIGATION
  // ==========================================

  const handleQuickAction = (title) => {
    if (title === "Search Medicine") {
      navigate("/medicines");
      return;
    }

    if (title === "Nearby Pharmacies") {
      setActiveMenu("Nearby Pharmacies");
      return;
    }

    if (title === "My Orders") {
      setActiveMenu("My Orders");
      return;
    }

    if (title === "Saved Medicines") {
      setActiveMenu("Saved Medicines");
      return;
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    navigate("/login");
  };

  return (
    <div className="dashboard-page">

      {/* =====================================
          MOBILE OVERLAY
      ====================================== */}

      {sidebarOpen && (
        <div
          className="dashboard-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}


      {/* =====================================
          SIDEBAR
      ====================================== */}

      <aside
        className={`dashboard-sidebar ${
          sidebarOpen ? "sidebar-open" : ""
        }`}
      >

        <div className="dashboard-logo">

          <img
            src={logo}
            alt="MediLink"
          />

          <button
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>

        </div>


        <nav className="dashboard-nav">

          {menuItems.map((item) => {

            const Icon = item.icon;

            return (
              <button
                key={item.label}
                className={`dashboard-nav-item ${
                  activeMenu === item.label ? "active" : ""
                }`}
                onClick={() => handleMenuClick(item.label)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );

          })}

        </nav>


        <div className="sidebar-bottom">

          <div className="sidebar-care-card">

            <div className="sidebar-care-icon">
              <Heart size={19} />
            </div>

            <strong>
              Better Care
              <br />
              Brighter Lives
            </strong>

            <span>
              Your health is our priority.
            </span>

          </div>


          <button
            className="sidebar-logout"
            onClick={handleLogout}
          >
            <LogOut size={17} />
            <span>Logout</span>
          </button>

        </div>

      </aside>


      {/* =====================================
          MAIN AREA
      ====================================== */}

      <main className="dashboard-main">

        {/* TOP BAR */}

        <header className="dashboard-topbar">

          <button
            className="mobile-menu-button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={21} />
          </button>


          {/* SEARCH */}

          <div className="dashboard-search">

            <Search size={19} />

            <input
              type="text"
              placeholder="Search for medicines, brands or pharmacies..."
              onFocus={() => navigate("/medicines")}
            />

            <button
              onClick={() => navigate("/medicines")}
            >
              Search
            </button>

          </div>


          {/* TOP ACTIONS */}

          <div className="dashboard-top-actions">

            {/* LOCATION SELECTOR */}

            <div className="location-selector">

              <button
                className="location-button"
                onClick={() =>
                  setLocationOpen((previous) => !previous)
                }
              >

                <MapPin size={17} />

                <span>
                  {selectedLocation}
                </span>

                <ChevronDown
                  size={15}
                  className={
                    locationOpen
                      ? "location-arrow-open"
                      : ""
                  }
                />

              </button>


              {locationOpen && (

                <div className="location-dropdown">

                  <div className="location-dropdown-title">
                    Select Location
                  </div>


                  {locations.map((location) => (

                    <button
                      key={location}
                      className={`location-option ${
                        selectedLocation === location
                          ? "selected"
                          : ""
                      }`}
                      onClick={() => {
                        setSelectedLocation(location);
                        setLocationOpen(false);
                      }}
                    >

                      <MapPin size={14} />

                      <span>
                        {location}
                      </span>

                      {selectedLocation === location && (
                        <span className="location-check">
                          ✓
                        </span>
                      )}

                    </button>

                  ))}

                </div>

              )}

            </div>


            {/* NOTIFICATION */}

            <button
              className="notification-button"
              aria-label="Notifications"
            >

              <Bell size={20} />

              <span className="notification-count">
                3
              </span>

            </button>


            {/* PROFILE */}

            <button className="profile-button">

              <div className="profile-avatar">
                U
              </div>

              <span>User</span>

              <ChevronDown size={15} />

            </button>

          </div>

        </header>


        {/* =====================================
            DASHBOARD CONTENT
        ====================================== */}

        <div className="dashboard-content">


          {/* =====================================
              HERO
          ====================================== */}

          <section className="dashboard-hero">

            <div className="hero-welcome">

              <p>
                Good Morning,
              </p>

              <h1>
                User! <span>👋</span>
              </h1>

              <span>
                Stay healthy, stay happy!
              </span>

            </div>


            <div className="hero-message">

              <span>
                Your Health
              </span>

              <strong>
                Our Priority
              </strong>

              <p>
                Small steps today,
                <br />
                healthier tomorrow.
              </p>

            </div>


            <div className="hero-health-icon">

              <div className="hero-pill">
                <Pill size={39} />
              </div>

              <div className="hero-heart">
                <Heart
                  size={19}
                  fill="currentColor"
                />
              </div>

            </div>


            <div className="hero-stats">

              <div className="hero-stat">

                <Pill size={18} />

                <div>
                  <strong>120+</strong>
                  <span>Medicines</span>
                </div>

              </div>


              <div className="hero-stat">

                <Store size={18} />

                <div>
                  <strong>50+</strong>
                  <span>Pharmacies</span>
                </div>

              </div>


              <div className="hero-stat">

                <Users size={18} />

                <div>
                  <strong>10K+</strong>
                  <span>Happy Users</span>
                </div>

              </div>


              <div className="hero-stat">

                <ShieldCheck size={18} />

                <div>
                  <strong>100%</strong>
                  <span>Trusted &amp; Secure</span>
                </div>

              </div>

            </div>

          </section>


          {/* =====================================
              QUICK ACTIONS
          ====================================== */}

          <section className="dashboard-section">

            <div className="section-heading">

              <h2>
                Quick Actions
              </h2>

              <button
                onClick={() => navigate("/medicines")}
              >
                See All
                <ArrowRight size={14} />
              </button>

            </div>


            <div className="quick-actions-grid">

              {quickActions.map((item) => {

                const Icon = item.icon;

                return (
                  <button
                    key={item.title}
                    className={`quick-action-card ${item.className}`}
                    onClick={() => handleQuickAction(item.title)}
                  >

                    <div className="quick-action-icon">
                      <Icon size={22} />
                    </div>

                    <div className="quick-action-text">

                      <strong>
                        {item.title}
                      </strong>

                      <span>
                        {item.subtitle}
                      </span>

                    </div>

                    <div className="quick-action-arrow">
                      <ArrowRight size={15} />
                    </div>

                  </button>
                );

              })}

            </div>

          </section>


          {/* =====================================
              NEARBY PHARMACIES
          ====================================== */}

          <section className="dashboard-section">

            <div className="section-heading">

              <h2>
                Nearby Pharmacies
              </h2>

              <button>
                See All
                <ArrowRight size={14} />
              </button>

            </div>


            <div className="pharmacy-grid">

              {pharmacies.map((pharmacy) => (

                <div
                  className="pharmacy-card"
                  key={pharmacy.name}
                >

                  <div className="pharmacy-image">

                    <div className="pharmacy-placeholder">
                      <Store size={32} />
                    </div>

                    <button
                      className="save-pharmacy"
                      aria-label="Save pharmacy"
                    >
                      <Heart size={15} />
                    </button>

                  </div>


                  <div className="pharmacy-info">

                    <h3>
                      {pharmacy.name}
                    </h3>


                    <div className="pharmacy-meta">

                      <span className="rating">

                        <Star
                          size={12}
                          fill="currentColor"
                        />

                        {pharmacy.rating}

                        <small>
                          ({pharmacy.reviews})
                        </small>

                      </span>


                      <span className="distance">

                        <MapPin size={12} />

                        {pharmacy.distance}

                      </span>

                    </div>


                    <div className="pharmacy-bottom">

                      <span
                        className={`pharmacy-status ${
                          pharmacy.status === "Open"
                            ? "open"
                            : "closed"
                        }`}
                      >
                        {pharmacy.status}
                      </span>


                      <span className="free-delivery">

                        <Truck size={12} />

                        Free delivery above ₹500

                      </span>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          </section>


          {/* =====================================
              LOWER GRID
          ====================================== */}

          <div className="dashboard-lower-grid">


            {/* RECENT ORDERS */}

            <section className="dashboard-section">

              <div className="section-heading">

                <h2>
                  Recent Orders
                </h2>

                <button>
                  See All
                  <ArrowRight size={14} />
                </button>

              </div>


              <div className="orders-card">

                {orders.map((order) => (

                  <div
                    className="order-item"
                    key={order.medicine}
                  >

                    <div className="order-medicine-icon">
                      <Pill size={20} />
                    </div>


                    <div className="order-details">

                      <strong>
                        {order.medicine}
                      </strong>

                      <span>
                        {order.quantity}
                      </span>

                    </div>


                    <div className="order-status-area">

                      <span
                        className={`order-status ${
                          order.status === "Delivered"
                            ? "delivered"
                            : "transit"
                        }`}
                      >
                        {order.status}
                      </span>

                      <small>
                        {order.date}
                      </small>

                    </div>


                    <button className="view-order">
                      View Details
                    </button>

                  </div>

                ))}

              </div>

            </section>


            {/* POPULAR MEDICINES */}

            <section className="dashboard-section">

              <div className="section-heading">

                <h2>
                  Popular Medicines
                </h2>

                <button
                  onClick={() => navigate("/medicines")}
                >
                  See All
                  <ArrowRight size={14} />
                </button>

              </div>


              <div className="popular-grid">

                {popularMedicines.map((medicine) => (

                  <div
                    className="popular-medicine"
                    key={medicine.name}
                  >

                    <div className="medicine-image">
                      <Pill size={25} />
                    </div>

                    <strong>
                      {medicine.name}
                    </strong>

                    <span>
                      {medicine.price}
                    </span>

                  </div>

                ))}

              </div>

            </section>

          </div>

        </div>

      </main>


      {/* =====================================
          RIGHT PANEL
      ====================================== */}

      <aside className="dashboard-right-panel">


        {/* HEALTH TIP */}

        <div className="health-tip-card">

          <div className="right-card-title">

            <div className="tip-icon">
              <Lightbulb size={18} />
            </div>

            <h3>
              Today's Health Tip
            </h3>

          </div>


          <strong>
            Stay hydrated! 💧
          </strong>


          <p>
            Drinking enough water helps your body
            stay healthy and supports better
            medicine absorption.
          </p>


          <div className="tip-water">
            <Droplets size={42} />
          </div>


          <div className="tip-dots">

            <span className="active"></span>
            <span></span>
            <span></span>

          </div>

        </div>


        {/* REMINDERS */}

        <div className="reminders-card">

          <div className="right-card-heading">

            <h3>
              Upcoming Reminders
            </h3>

            <button>
              View All
            </button>

          </div>


          {reminders.map((reminder) => (

            <div
              className="reminder-item"
              key={reminder.name}
            >

              <div className="reminder-icon">
                <Pill size={17} />
              </div>

              <div>

                <strong>
                  {reminder.name}
                </strong>

                <span>
                  {reminder.time}
                </span>

              </div>

              <Bell size={14} />

            </div>

          ))}

        </div>


        {/* MEDIBOT */}

        <div className="medibot-card">

          <div className="medibot-icon">
            <Bot size={34} />
          </div>


          <div>

            <h3>
              Need Help?
            </h3>

            <strong>
              Chat with MediBot
            </strong>

            <p>
              Get instant answers about medicines,
              side effects and more.
            </p>

            <button>
              Chat Now
              <ArrowRight size={14} />
            </button>

          </div>

        </div>

      </aside>


    </div>
  );
}

export default UserDashboard;