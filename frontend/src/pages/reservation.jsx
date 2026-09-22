import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Store,
  Truck,
  CheckCircle2,
  ShieldCheck,
  Clock3,
  Package,
  ChevronRight,
} from "lucide-react";
import "./reservation.css";

const Reservation = () => {
  const navigate = useNavigate();

  const [deliveryType, setDeliveryType] = useState("pickup");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const medicine = {
    name: "Paracetamol 500mg",
    generic: "Paracetamol",
    pack: "10 Tablets",
    price: 28,
  };

  const pharmacy = {
    name: "Zeno Health Pharmacy",
    distance: "0.8 km",
    rating: "4.8",
    address: "Kalyan, Maharashtra",
    pickupTime: "20–30 min",
  };

  const deliveryCharge = deliveryType === "delivery" ? 30 : 0;
  const total = medicine.price + deliveryCharge;

  const handleConfirm = () => {
    if (deliveryType === "delivery" && (!address || !phone)) {
      alert("Please enter your delivery address and phone number.");
      return;
    }

    navigate("/order-confirmation");
  };

  return (
    <div className="reservation-page">

      {/* HEADER */}
      <header className="reservation-header">
        <div className="reservation-header-inner">
          <button
            className="reservation-back-btn"
            onClick={() => navigate("/pharmacy-selection")}
          >
            <ArrowLeft size={19} />
            Back
          </button>

          <div className="reservation-step">
            <span className="step-active">1</span>
            <span className="step-line"></span>
            <span className="step-active">2</span>
            <span className="step-line"></span>
            <span className="step-muted">3</span>
          </div>

          <div className="secure-check">
            <ShieldCheck size={17} />
            Secure
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="reservation-container">

        <div className="reservation-heading">
          <span className="reservation-eyebrow">
            <Package size={15} />
            RESERVE MEDICINE
          </span>

          <h1>Complete your reservation</h1>

          <p>
            Choose how you'd like to receive your medicine and confirm
            your reservation.
          </p>
        </div>

        <div className="reservation-layout">

          {/* LEFT */}
          <section className="reservation-main">

            {/* MEDICINE */}
            <div className="reservation-card medicine-summary-card">
              <div className="card-title">
                <div>
                  <span className="small-label">MEDICINE</span>
                  <h2>{medicine.name}</h2>
                </div>

                <div className="medicine-price">
                  ₹{medicine.price}
                </div>
              </div>

              <div className="medicine-summary-details">
                <span>{medicine.generic}</span>
                <span>•</span>
                <span>{medicine.pack}</span>
              </div>
            </div>

            {/* PHARMACY */}
            <div className="reservation-card">

              <div className="section-title">
                <div className="section-icon">
                  <Store size={19} />
                </div>

                <div>
                  <h2>Selected Pharmacy</h2>
                  <p>Your medicine will be reserved here</p>
                </div>
              </div>

              <div className="selected-pharmacy">
                <div className="pharmacy-icon">
                  <Store size={23} />
                </div>

                <div className="pharmacy-info">
                  <div className="pharmacy-name-row">
                    <h3>{pharmacy.name}</h3>

                    <span className="open-badge">
                      <CheckCircle2 size={13} />
                      Open
                    </span>
                  </div>

                  <div className="pharmacy-meta">
                    <span>
                      <MapPin size={14} />
                      {pharmacy.distance}
                    </span>

                    <span>★ {pharmacy.rating}</span>

                    <span>
                      <Clock3 size={14} />
                      {pharmacy.pickupTime}
                    </span>
                  </div>

                  <p className="pharmacy-address">
                    {pharmacy.address}
                  </p>
                </div>
              </div>

              <button
                className="change-pharmacy-btn"
                onClick={() => navigate("/pharmacy-selection")}
              >
                Change Pharmacy
              </button>
            </div>

            {/* RECEIVE METHOD */}
            <div className="reservation-card">

              <div className="section-title">
                <div className="section-icon">
                  <Truck size={19} />
                </div>

                <div>
                  <h2>How would you like to receive it?</h2>
                  <p>Select your preferred option</p>
                </div>
              </div>

              <div className="receive-methods">

                <button
                  className={`receive-method ${
                    deliveryType === "pickup" ? "selected" : ""
                  }`}
                  onClick={() => setDeliveryType("pickup")}
                >
                  <div className="method-icon">
                    <Store size={22} />
                  </div>

                  <div className="method-content">
                    <h3>Pickup from Pharmacy</h3>
                    <p>Ready in {pharmacy.pickupTime}</p>
                    <strong>FREE</strong>
                  </div>

                  {deliveryType === "pickup" && (
                    <CheckCircle2
                      className="method-check"
                      size={22}
                    />
                  )}
                </button>

                <button
                  className={`receive-method ${
                    deliveryType === "delivery" ? "selected" : ""
                  }`}
                  onClick={() => setDeliveryType("delivery")}
                >
                  <div className="method-icon">
                    <Truck size={22} />
                  </div>

                  <div className="method-content">
                    <h3>Home Delivery</h3>
                    <p>Delivered to your doorstep</p>
                    <strong>₹30 delivery</strong>
                  </div>

                  {deliveryType === "delivery" && (
                    <CheckCircle2
                      className="method-check"
                      size={22}
                    />
                  )}
                </button>

              </div>

              {/* DELIVERY DETAILS */}
              {deliveryType === "delivery" && (
                <div className="delivery-details">

                  <label>Delivery Address</label>

                  <textarea
                    placeholder="Enter your complete delivery address..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />

                  <label>Phone Number</label>

                  <input
                    type="tel"
                    placeholder="Enter your mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />

                </div>
              )}

            </div>

            {/* INFO */}
            <div className="reservation-info">
              <ShieldCheck size={19} />

              <div>
                <strong>Safe & Secure Reservation</strong>
                <p>
                  Your medicine will be reserved at the selected
                  pharmacy. You can collect it or receive it at home.
                </p>
              </div>
            </div>

          </section>

          {/* RIGHT SUMMARY */}
          <aside className="reservation-sidebar">

            <div className="order-summary">

              <div className="summary-header">
                <h2>Reservation Summary</h2>
                <span>1 item</span>
              </div>

              <div className="summary-medicine">
                <div className="summary-pill">
                  <Package size={20} />
                </div>

                <div>
                  <h3>{medicine.name}</h3>
                  <p>{medicine.pack}</p>
                </div>

                <strong>₹{medicine.price}</strong>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-row">
                <span>Medicine price</span>
                <strong>₹{medicine.price}</strong>
              </div>

              <div className="summary-row">
                <span>Delivery</span>
                <strong>
                  {deliveryCharge === 0
                    ? "FREE"
                    : `₹${deliveryCharge}`}
                </strong>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-total">
                <span>Total</span>
                <strong>₹{total}</strong>
              </div>

              <button
                className="confirm-reservation-btn"
                onClick={handleConfirm}
              >
                Confirm Reservation
                <ChevronRight size={19} />
              </button>

              <div className="summary-trust">
                <ShieldCheck size={16} />
                Secure & trusted by MediLink
              </div>

            </div>

          </aside>

        </div>

      </main>
    </div>
  );
};

export default Reservation;