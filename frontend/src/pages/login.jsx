import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import {
  UserRound,
  LockKeyhole,
  Eye,
  EyeOff,
  Store,
  ShieldCheck,
  Truck,
  Search,
  ShoppingBag,
  Bell,
  ArrowRight,
} from "lucide-react";

import logo from "../assets/medilink-logo.png";
import healthcareImage from "../assets/login-healthcare.png";

import "./login.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("user");

  const roles = [
    {
      id: "user",
      label: "User",
      icon: UserRound,
    },
    {
      id: "pharmacy",
      label: "Pharmacy",
      icon: Store,
    },
    {
      id: "admin",
      label: "Admin",
      icon: ShieldCheck,
    },
    {
      id: "delivery",
      label: "Delivery Partner",
      icon: Truck,
    },
  ];

  /* =====================================
     LOGIN
  ====================================== */

  const handleLogin = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const data = await login({ email, password });
      let defaultDashboard = "/user/dashboard";
      if (data.user?.role === "PHARMACY") {
        defaultDashboard = "/pharmacy/dashboard";
      } else if (data.user?.role === "DELIVERY_PARTNER") {
        defaultDashboard = "/delivery/dashboard";
      } else if (data.user?.role === "ADMIN") {
        defaultDashboard = "/admin/dashboard";
      }

      const from = location.state?.from?.pathname || defaultDashboard;
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(
        err.message || "Failed to log in. Please check your credentials."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">

      {/* =====================================
          LEFT SIDE
      ====================================== */}

      <section className="login-left">

        <div className="login-logo">
          <img
            src={logo}
            alt="MediLink"
          />
        </div>

        <div className="login-left-content">

          <h1>
            Smart Healthcare.
            <span>
              Connected Care.
            </span>
          </h1>

          <p className="login-description">
            Your trusted healthcare companion for
            medicines and pharmacies.
          </p>

          {/* FEATURES */}

          <div className="login-features">

            {/* SEARCH MEDICINES */}

            <div className="login-feature">

              <div className="login-feature-icon">
                <Search size={21} />
              </div>

              <div className="login-feature-text">

                <strong>
                  Search Medicines
                </strong>

                <span>
                  Find medicines nearby
                </span>

              </div>

            </div>

            {/* RESERVE & ORDER */}

            <div className="login-feature">

              <div className="login-feature-icon">
                <ShoppingBag size={21} />
              </div>

              <div className="login-feature-text">

                <strong>
                  Reserve &amp; Order
                </strong>

                <span>
                  Reserve medicines easily
                </span>

              </div>

            </div>

            {/* TRUSTED PHARMACIES */}

            <div className="login-feature">

              <div className="login-feature-icon">
                <ShieldCheck size={21} />
              </div>

              <div className="login-feature-text">

                <strong>
                  Trusted Pharmacies
                </strong>

                <span>
                  Connect with verified stores
                </span>

              </div>

            </div>

            {/* STAY NOTIFIED */}

            <div className="login-feature">

              <div className="login-feature-icon">
                <Bell size={21} />
              </div>

              <div className="login-feature-text">

                <strong>
                  Stay Notified
                </strong>

                <span>
                  Get important updates
                </span>

              </div>

            </div>

          </div>

          {/* HEALTHCARE IMAGE */}

          <div className="login-healthcare-image">

            <img
              src={healthcareImage}
              alt="Healthcare illustration"
            />

          </div>

        </div>

      </section>


      {/* =====================================
          RIGHT SIDE
      ====================================== */}

      <section className="login-right">

        <div className="login-card">

          {/* SECURE BADGE */}

          <div className="secure-badge">

            <ShieldCheck size={15} />

            <span>
              100% Secure
            </span>

          </div>


          {/* HEADER */}

          <div className="login-header">

            <h2>
              Welcome Back!
            </h2>

            <p>
              Login to continue to MediLink
            </p>

          </div>


          {/* LOGIN FORM */}

          {errorMessage && (
            <div
              style={{
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                padding: "10px 14px",
                borderRadius: "10px",
                fontSize: "13px",
                marginTop: "16px",
                lineHeight: "1.4",
              }}
              role="alert"
            >
              {errorMessage}
            </div>
          )}

          <form
            className="login-form"
            onSubmit={handleLogin}
          >

            {/* EMAIL / PHONE */}

            <div className="login-field">

              <label htmlFor="email">
                Email or Phone Number
              </label>

              <div className="login-input-wrapper">

                <UserRound
                  className="login-input-icon"
                  size={18}
                />

                <input
                  id="email"
                  type="text"
                  className="login-input"
                  placeholder="Enter your email or phone number"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

              </div>

            </div>


            {/* PASSWORD */}

            <div className="login-field">

              <label htmlFor="password">
                Password
              </label>

              <div className="login-input-wrapper">

                <LockKeyhole
                  className="login-input-icon"
                  size={18}
                />

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  className="login-input login-password-input"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (previous) => !previous
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >

                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}

                </button>

              </div>

            </div>


            {/* OPTIONS */}

            <div className="login-options">

              <label className="remember-option">

                <input
                  type="checkbox"
                  defaultChecked
                />

                <span>
                  Remember me
                </span>

              </label>

              <button
                type="button"
                className="forgot-password"
              >
                Forgot Password?
              </button>

            </div>


            {/* LOGIN BUTTON */}

            <button
              type="submit"
              className="login-button"
              disabled={isSubmitting}
            >

              <span>
                {isSubmitting ? "Logging in..." : "Login"}
              </span>

              <ArrowRight size={17} />

            </button>

          </form>


          {/* DIVIDER */}

          <div className="login-divider">

            <span>
              OR
            </span>

          </div>


          {/* ROLE */}

          <p className="role-title">
            Login as
          </p>

          <div className="role-grid">

            {roles.map((item) => {

              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  className={`role-card ${
                    role === item.id
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setRole(item.id)
                  }
                >

                  <div className="role-icon">

                    <Icon size={17} />

                  </div>

                  <span>
                    {item.label}
                  </span>

                </button>
              );

            })}

          </div>


          {/* REGISTER */}

          <p className="register-text">

            Don&apos;t have an account?{" "}

            <button
              type="button"
              className="register-link"
              onClick={() =>
                navigate("/register")
              }
            >
              Register Now
            </button>

          </p>

        </div>

      </section>

    </div>
  );
}

export default Login;