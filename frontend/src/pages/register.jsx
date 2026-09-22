import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  UserRound,
  Mail,
  Phone,
  LockKeyhole,
  Eye,
  EyeOff,
  Search,
  ShieldCheck,
  Truck,
  ArrowRight,
  Store,
  UsersRound,
} from "lucide-react";

import logo from "../assets/medilink-logo.png";

import "./register.css";

function Register() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState("user");

  const roles = [
    {
      id: "user",
      label: "User",
      description: "Find & order medicines",
      icon: UsersRound,
    },
    {
      id: "pharmacy",
      label: "Pharmacy",
      description: "Manage your pharmacy",
      icon: Store,
    },
    {
      id: "delivery",
      label: "Delivery Partner",
      description: "Deliver orders",
      icon: Truck,
    },
  ];

  const handleRegister = (event) => {
    event.preventDefault();

    console.log("Registration attempted");
    console.log("Selected role:", role);
  };

  return (
    <div className="register-page">

      {/* =====================================
          LEFT SIDE
      ====================================== */}

      <section className="register-left">

        <div className="register-logo">
          <img src={logo} alt="MediLink" />
        </div>

        <div className="register-left-content">

          <div className="register-eyebrow">
            <span></span>
            JOIN MEDILINK
          </div>

          <h1>
            Care
            <span>Connects</span>
            Us All
          </h1>

          <p className="register-description">
            Create your MediLink account and get access to trusted
            pharmacies, medicine availability and easy healthcare services.
          </p>


          <div className="register-benefits">

            <div className="register-benefit">
              <div className="register-benefit-icon">
                <Search size={20} />
              </div>

              <div>
                <strong>Search Easily</strong>
                <span>Find medicines near you</span>
              </div>
            </div>


            <div className="register-benefit">
              <div className="register-benefit-icon">
                <ShieldCheck size={20} />
              </div>

              <div>
                <strong>Trusted Pharmacies</strong>
                <span>Connect with verified pharmacies</span>
              </div>
            </div>


            <div className="register-benefit">
              <div className="register-benefit-icon">
                <Truck size={20} />
              </div>

              <div>
                <strong>Get It Your Way</strong>
                <span>Pickup or home delivery</span>
              </div>
            </div>

          </div>


          <div className="register-quote">
            <span></span>

            <p>
              Better Care
              <br />
              Brighter Lives
            </p>
          </div>

        </div>

      </section>


      {/* =====================================
          RIGHT SIDE
      ====================================== */}

      <section className="register-right">

        <div className="register-login-top">
          <span>Already have an account?</span>

          <button
            type="button"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        </div>


        <div className="register-card">

          {/* Header */}
          <div className="register-header">

            <h2>Create Your Account</h2>

            <p>
              Join MediLink and take control of your healthcare journey.
            </p>

          </div>


          {/* Form */}
          <form
            className="register-form"
            onSubmit={handleRegister}
          >

            {/* Full Name */}
            <div className="register-field">

              <label htmlFor="fullName">
                Full Name
              </label>

              <div className="register-input-wrapper">

                <UserRound
                  className="register-input-icon"
                  size={17}
                />

                <input
                  id="fullName"
                  type="text"
                  className="register-input"
                  placeholder="Enter your full name"
                  required
                />

              </div>

            </div>


            {/* Email + Phone */}
            <div className="register-two-columns">

              <div className="register-field">

                <label htmlFor="email">
                  Email Address
                </label>

                <div className="register-input-wrapper">

                  <Mail
                    className="register-input-icon"
                    size={17}
                  />

                  <input
                    id="email"
                    type="email"
                    className="register-input"
                    placeholder="Enter email"
                    required
                  />

                </div>

              </div>


              <div className="register-field">

                <label htmlFor="phone">
                  Phone Number
                </label>

                <div className="register-input-wrapper">

                  <Phone
                    className="register-input-icon"
                    size={17}
                  />

                  <input
                    id="phone"
                    type="tel"
                    className="register-input"
                    placeholder="Enter phone number"
                    required
                  />

                </div>

              </div>

            </div>


            {/* Password + Confirm Password */}
            <div className="register-two-columns">

              <div className="register-field">

                <label htmlFor="password">
                  Password
                </label>

                <div className="register-input-wrapper">

                  <LockKeyhole
                    className="register-input-icon"
                    size={17}
                  />

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    className="register-input register-password-input"
                    placeholder="Create password"
                    required
                  />

                  <button
                    type="button"
                    className="register-password-toggle"
                    onClick={() =>
                      setShowPassword(
                        (previous) => !previous
                      )
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>

                </div>

              </div>


              <div className="register-field">

                <label htmlFor="confirmPassword">
                  Confirm Password
                </label>

                <div className="register-input-wrapper">

                  <LockKeyhole
                    className="register-input-icon"
                    size={17}
                  />

                  <input
                    id="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    className="register-input register-password-input"
                    placeholder="Confirm password"
                    required
                  />

                  <button
                    type="button"
                    className="register-password-toggle"
                    onClick={() =>
                      setShowConfirmPassword(
                        (previous) => !previous
                      )
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>

                </div>

              </div>

            </div>


            {/* Register As */}
            <div className="register-role-section">

              <p className="register-role-title">
                Register as
              </p>

              <div className="register-role-grid">

                {roles.map((item) => {

                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`register-role-card ${
                        role === item.id
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        setRole(item.id)
                      }
                    >

                      <div className="register-role-icon">
                        <Icon size={18} />
                      </div>

                      <div className="register-role-content">

                        <strong>
                          {item.label}
                        </strong>

                        <span>
                          {item.description}
                        </span>

                      </div>

                    </button>
                  );
                })}

              </div>

            </div>


            {/* Terms */}
            <label className="register-terms">

              <input
                type="checkbox"
                required
              />

              <span>
                I agree to the{" "}
                <button
                  type="button"
                  onClick={(event) =>
                    event.preventDefault()
                  }
                >
                  Terms &amp; Conditions
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  onClick={(event) =>
                    event.preventDefault()
                  }
                >
                  Privacy Policy
                </button>
              </span>

            </label>


            {/* Create Account */}
            <button
              type="submit"
              className="register-button"
            >
              <span>Create Account</span>
              <ArrowRight size={17} />
            </button>

          </form>


          {/* Bottom Login */}
          <p className="register-bottom-login">

            Already have an account?

            <button
              type="button"
              onClick={() => navigate("/login")}
            >
              Login
            </button>

          </p>

        </div>

      </section>

    </div>
  );
}

export default Register;