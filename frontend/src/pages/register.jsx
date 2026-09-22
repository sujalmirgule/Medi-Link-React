import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
  Building,
  FileText,
  MapPin,
} from "lucide-react";

import logo from "../assets/medilink-logo.png";
import "./register.css";

function Register() {
  const navigate = useNavigate();
  const { register, registerPharmacy, registerDeliveryPartner } = useAuth();

  // Role Selection
  const [role, setRole] = useState("user");

  // Common Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Pharmacy-specific Fields
  const [pharmacyName, setPharmacyName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");

  // Address Fields (Pharmacy & Delivery)
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  // UI State
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const handleRegister = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (role === "pharmacy") {
        await registerPharmacy({
          pharmacyName: pharmacyName.trim(),
          ownerName: ownerName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
          licenseNumber: licenseNumber.trim(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
        });
        navigate("/pharmacy/dashboard", { replace: true });
      } else if (role === "delivery") {
        await registerDeliveryPartner({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
        });
        navigate("/delivery/dashboard", { replace: true });
      } else {
        await register({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
        });
        navigate("/user/dashboard", { replace: true });
      }
    } catch (err) {
      setErrorMessage(
        err.message || "Registration failed. Please check your information."
      );
    } finally {
      setIsSubmitting(false);
    }
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
          <button type="button" onClick={() => navigate("/login")}>
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

          {/* Role Selection at Top */}
          <div className="register-role-section">
            <p className="register-role-title">Account Type</p>
            <div className="register-role-grid">
              {roles.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`register-role-card ${
                      role === item.id ? "active" : ""
                    }`}
                    onClick={() => {
                      setRole(item.id);
                      setErrorMessage("");
                    }}
                  >
                    <div className="register-role-icon">
                      <Icon size={18} />
                    </div>
                    <div className="register-role-content">
                      <strong>{item.label}</strong>
                      <span>{item.description}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

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

          {/* Form */}
          <form className="register-form" onSubmit={handleRegister}>
            {/* Customer & Delivery: Full Name */}
            {role !== "pharmacy" && (
              <div className="register-field">
                <label htmlFor="fullName">Full Name</label>
                <div className="register-input-wrapper">
                  <UserRound className="register-input-icon" size={17} />
                  <input
                    id="fullName"
                    type="text"
                    className="register-input"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* Pharmacy: Pharmacy Name & Owner Name */}
            {role === "pharmacy" && (
              <>
                <div className="register-field">
                  <label htmlFor="pharmacyName">Pharmacy Name</label>
                  <div className="register-input-wrapper">
                    <Building className="register-input-icon" size={17} />
                    <input
                      id="pharmacyName"
                      type="text"
                      className="register-input"
                      placeholder="e.g. Apollo Care Pharmacy"
                      value={pharmacyName}
                      onChange={(e) => setPharmacyName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="register-field">
                  <label htmlFor="ownerName">Owner / Contact Person</label>
                  <div className="register-input-wrapper">
                    <UserRound className="register-input-icon" size={17} />
                    <input
                      id="ownerName"
                      type="text"
                      className="register-input"
                      placeholder="Enter owner / pharmacist name"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email + Phone */}
            <div className="register-two-columns">
              <div className="register-field">
                <label htmlFor="email">Email Address</label>
                <div className="register-input-wrapper">
                  <Mail className="register-input-icon" size={17} />
                  <input
                    id="email"
                    type="email"
                    className="register-input"
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="register-field">
                <label htmlFor="phone">Phone Number</label>
                <div className="register-input-wrapper">
                  <Phone className="register-input-icon" size={17} />
                  <input
                    id="phone"
                    type="tel"
                    className="register-input"
                    placeholder="Enter phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Pharmacy License Number */}
            {role === "pharmacy" && (
              <div className="register-field" style={{ marginTop: "14px" }}>
                <label htmlFor="licenseNumber">Drug License Number</label>
                <div className="register-input-wrapper">
                  <FileText className="register-input-icon" size={17} />
                  <input
                    id="licenseNumber"
                    type="text"
                    className="register-input"
                    placeholder="e.g. DL-MH-2026-98765"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* Address (Pharmacy & Delivery) */}
            {role !== "user" && (
              <>
                <div className="register-field" style={{ marginTop: "14px" }}>
                  <label htmlFor="address">Operating Address / Street</label>
                  <div className="register-input-wrapper">
                    <MapPin className="register-input-icon" size={17} />
                    <input
                      id="address"
                      type="text"
                      className="register-input"
                      placeholder="Shop/Apartment, Street address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.2fr 1.2fr 1fr",
                    gap: "10px",
                    marginTop: "14px",
                  }}
                >
                  <div className="register-field">
                    <label htmlFor="city">City</label>
                    <input
                      id="city"
                      type="text"
                      className="register-input"
                      style={{ paddingLeft: "13px" }}
                      placeholder="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                    />
                  </div>

                  <div className="register-field">
                    <label htmlFor="state">State</label>
                    <input
                      id="state"
                      type="text"
                      className="register-input"
                      style={{ paddingLeft: "13px" }}
                      placeholder="State"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      required
                    />
                  </div>

                  <div className="register-field">
                    <label htmlFor="pincode">Pincode</label>
                    <input
                      id="pincode"
                      type="text"
                      className="register-input"
                      style={{ paddingLeft: "13px" }}
                      placeholder="Pincode"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* Password + Confirm Password */}
            <div className="register-two-columns">
              <div className="register-field">
                <label htmlFor="password">Password</label>
                <div className="register-input-wrapper">
                  <LockKeyhole className="register-input-icon" size={17} />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="register-input register-password-input"
                    placeholder="Create password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="register-password-toggle"
                    onClick={() => setShowPassword((p) => !p)}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="register-field">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="register-input-wrapper">
                  <LockKeyhole className="register-input-icon" size={17} />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    className="register-input register-password-input"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="register-password-toggle"
                    onClick={() => setShowConfirmPassword((p) => !p)}
                  >
                    {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Terms */}
            <label className="register-terms">
              <input type="checkbox" required />
              <span>
                I agree to the{" "}
                <button
                  type="button"
                  onClick={(event) => event.preventDefault()}
                >
                  Terms &amp; Conditions
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  onClick={(event) => event.preventDefault()}
                >
                  Privacy Policy
                </button>
              </span>
            </label>

            {/* Create Account Button */}
            <button
              type="submit"
              className="register-button"
              disabled={isSubmitting}
            >
              <span>
                {isSubmitting
                  ? "Creating Account..."
                  : role === "pharmacy"
                  ? "Register Pharmacy"
                  : role === "delivery"
                  ? "Register Delivery Partner"
                  : "Create Account"}
              </span>
              <ArrowRight size={17} />
            </button>
          </form>

          {/* Bottom Login */}
          <p className="register-bottom-login">
            Already have an account?{" "}
            <button type="button" onClick={() => navigate("/login")}>
              Login
            </button>
          </p>
        </div>
      </section>
    </div>
  );
}

export default Register;