import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  MapPin,
  Star,
  Clock3,
  Store,
  CheckCircle2,
  Truck,
  ShoppingBag,
  ChevronRight,
  ShieldCheck,
  Navigation,
  Phone,
  SlidersHorizontal,
} from "lucide-react";
import logo from "../assets/medilink-logo.png";
import "./pharmacy-selection.css";

const PharmacySelection = () => {
  const navigate = useNavigate();

  const medicine = {
    name: "Paracetamol 500mg",
    generic: "Paracetamol",
    pack: "10 Tablets",
    price: 28,
  };

  const pharmacies = [
    {
      id: 1,
      name: "Zeno Health Pharmacy",
      distance: "0.8 km",
      rating: "4.8",
      reviews: "124",
      status: "Open",
      timing: "Open until 10:30 PM",
      price: 28,
      stock: "In Stock",
      stockCount: "15+ available",
      delivery: "20–30 min",
      address: "Kalyan West, Maharashtra",
      phone: "+91 98765 43210",
    },
    {
      id: 2,
      name: "Shree Ram Medical & General Stores",
      distance: "1.2 km",
      rating: "4.6",
      reviews: "89",
      status: "Open",
      timing: "Open until 11:00 PM",
      price: 27,
      stock: "In Stock",
      stockCount: "10+ available",
      delivery: "25–35 min",
      address: "Kalyan East, Maharashtra",
      phone: "+91 98765 12345",
    },
    {
      id: 3,
      name: "Apollo Pharmacy",
      distance: "1.8 km",
      rating: "4.7",
      reviews: "216",
      status: "Open",
      timing: "Open until 10:00 PM",
      price: 29,
      stock: "In Stock",
      stockCount: "20+ available",
      delivery: "30–40 min",
      address: "Kalyan West, Maharashtra",
      phone: "+91 91234 56789",
    },
    {
      id: 4,
      name: "Geetanjali Medical & General Stores",
      distance: "2.4 km",
      rating: "4.5",
      reviews: "67",
      status: "Closed",
      timing: "Opens at 8:00 AM",
      price: 26,
      stock: "Available",
      stockCount: "8 available",
      delivery: "40–50 min",
      address: "Kalyan East, Maharashtra",
      phone: "+91 99887 66554",
    },
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [deliveryType, setDeliveryType] = useState("pickup");

  const filteredPharmacies = useMemo(() => {
    return pharmacies.filter((pharmacy) =>
      pharmacy.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const selected =
    pharmacies.find((pharmacy) => pharmacy.id === selectedPharmacy) || null;

  const deliveryCharge = deliveryType === "delivery" ? 30 : 0;
  const total = (selected?.price || medicine.price) + deliveryCharge;

  const handleContinue = () => {
    if (!selected) {
      alert("Please select a pharmacy first.");
      return;
    }

    navigate("/reservation", {
      state: {
        medicine,
        pharmacy: selected,
        deliveryType,
      },
    });
  };

  return (
    <div className="pharmacy-page">

      {/* HEADER */}
      <header className="pharmacy-header">
        <div className="pharmacy-header-inner">

          <button
            className="pharmacy-back-btn"
            onClick={() => navigate("/medicine-details")}
          >
            <ArrowLeft size={19} />
            Back
          </button>

          <img
            src={logo}
            alt="MediLink"
            className="pharmacy-logo"
          />

          <div className="pharmacy-secure">
            <ShieldCheck size={17} />
            Secure
          </div>

        </div>
      </header>

      {/* MAIN */}
      <main className="pharmacy-container">

        {/* BREADCRUMB */}
        <div className="pharmacy-breadcrumb">
          <span onClick={() => navigate("/medicines")}>
            Medicines
          </span>

          <ChevronRight size={14} />

          <span onClick={() => navigate("/medicine-details")}>
            Medicine Details
          </span>

          <ChevronRight size={14} />

          <strong>Select Pharmacy</strong>
        </div>

        {/* TITLE */}
        <section className="pharmacy-heading">

          <div>
            <span className="pharmacy-eyebrow">
              <Store size={15} />
              NEARBY PHARMACIES
            </span>

            <h1>Choose a pharmacy</h1>

            <p>
              Select a trusted pharmacy near you to reserve your medicine.
            </p>
          </div>

          <div className="location-pill">
            <MapPin size={16} />
            Kalyan, Maharashtra
          </div>

        </section>

        {/* MEDICINE SUMMARY */}
        <section className="selected-medicine-bar">

          <div className="medicine-mini-icon">
            <ShoppingBag size={21} />
          </div>

          <div className="medicine-mini-info">
            <span>YOU ARE RESERVING</span>
            <h3>{medicine.name}</h3>
            <p>
              {medicine.generic} · {medicine.pack}
            </p>
          </div>

          <div className="medicine-mini-price">
            <span>From</span>
            <strong>₹{medicine.price}</strong>
          </div>

        </section>

        {/* TOOLBAR */}
        <div className="pharmacy-toolbar">

          <div className="pharmacy-search">
            <Search size={19} />

            <input
              type="text"
              placeholder="Search pharmacy..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {searchTerm && (
              <button onClick={() => setSearchTerm("")}>
                ×
              </button>
            )}
          </div>

          <button className="filter-btn">
            <SlidersHorizontal size={17} />
            Filters
          </button>

          <div className="nearby-label">
            <Navigation size={15} />
            Showing pharmacies near you
          </div>

        </div>

        <div className="pharmacy-content">

          {/* LEFT */}
          <section className="pharmacy-list-section">

            <div className="list-header">
              <div>
                <h2>{filteredPharmacies.length} pharmacies found</h2>
                <p>Sorted by distance</p>
              </div>

              <span className="verified-label">
                <CheckCircle2 size={15} />
                Verified pharmacies
              </span>
            </div>

            <div className="pharmacy-list">

              {filteredPharmacies.map((pharmacy) => {

                const isSelected =
                  selectedPharmacy === pharmacy.id;

                const isClosed =
                  pharmacy.status === "Closed";

                return (
                  <article
                    key={pharmacy.id}
                    className={`pharmacy-card ${
                      isSelected ? "selected" : ""
                    }`}
                  >

                    {/* TOP */}
                    <div className="pharmacy-card-top">

                      <div className="pharmacy-brand-icon">
                        <Store size={24} />
                      </div>

                      <div className="pharmacy-card-info">

                        <div className="pharmacy-title-row">

                          <h3>{pharmacy.name}</h3>

                          {isSelected && (
                            <span className="selected-label">
                              <CheckCircle2 size={13} />
                              Selected
                            </span>
                          )}

                        </div>

                        <div className="pharmacy-rating-distance">

                          <span className="rating">
                            <Star size={14} fill="currentColor" />
                            {pharmacy.rating}
                          </span>

                          <span>
                            {pharmacy.reviews} reviews
                          </span>

                          <span className="dot">•</span>

                          <span>
                            <MapPin size={13} />
                            {pharmacy.distance}
                          </span>

                        </div>

                        <p className="pharmacy-address">
                          {pharmacy.address}
                        </p>

                      </div>

                      <div
                        className={`pharmacy-status ${
                          isClosed ? "closed" : ""
                        }`}
                      >
                        <span></span>
                        {pharmacy.status}
                      </div>

                    </div>

                    {/* DETAILS */}
                    <div className="pharmacy-card-details">

                      <div className="detail-box">

                        <div className="detail-icon stock">
                          <CheckCircle2 size={17} />
                        </div>

                        <div>
                          <span>Availability</span>
                          <strong>{pharmacy.stock}</strong>
                          <small>{pharmacy.stockCount}</small>
                        </div>

                      </div>

                      <div className="detail-box">

                        <div className="detail-icon time">
                          <Clock3 size={17} />
                        </div>

                        <div>
                          <span>Pickup</span>
                          <strong>{pharmacy.delivery}</strong>
                          <small>{pharmacy.timing}</small>
                        </div>

                      </div>

                      <div className="detail-box">

                        <div className="detail-icon price">
                          ₹
                        </div>

                        <div>
                          <span>Medicine price</span>
                          <strong>₹{pharmacy.price}</strong>
                          <small>
                            {pharmacy.price < medicine.price
                              ? "Best price"
                              : "Regular price"}
                          </small>
                        </div>

                      </div>

                    </div>

                    {/* FOOTER */}
                    <div className="pharmacy-card-footer">

                      <button className="contact-btn">
                        <Phone size={15} />
                        Contact
                      </button>

                      <button
                        className="select-pharmacy-btn"
                        disabled={isClosed}
                        onClick={() =>
                          setSelectedPharmacy(pharmacy.id)
                        }
                      >
                        {isClosed
                          ? "Currently Closed"
                          : isSelected
                          ? "Selected Pharmacy"
                          : "Select Pharmacy"}

                        {!isClosed && (
                          <ChevronRight size={17} />
                        )}
                      </button>

                    </div>

                  </article>
                );
              })}

              {filteredPharmacies.length === 0 && (
                <div className="pharmacy-empty">
                  <Store size={40} />
                  <h3>No pharmacies found</h3>
                  <p>
                    Try searching with a different pharmacy name.
                  </p>
                </div>
              )}

            </div>
          </section>

          {/* RIGHT SIDEBAR */}
          <aside className="selection-sidebar">

            <div className="selection-summary">

              <div className="summary-heading">
                <div>
                  <span>YOUR SELECTION</span>
                  <h2>Reservation Summary</h2>
                </div>

                <div className="summary-count">
                  1
                </div>
              </div>

              {!selected ? (
                <div className="no-selection">

                  <div className="no-selection-icon">
                    <Store size={24} />
                  </div>

                  <h3>Select a pharmacy</h3>

                  <p>
                    Choose a pharmacy from the list to continue
                    with your reservation.
                  </p>

                </div>
              ) : (
                <>
                  <div className="summary-selected-pharmacy">

                    <div className="summary-store-icon">
                      <Store size={21} />
                    </div>

                    <div>
                      <h3>{selected.name}</h3>

                      <p>
                        <MapPin size={13} />
                        {selected.distance} away
                      </p>

                      <span>
                        <CheckCircle2 size={13} />
                        {selected.stock}
                      </span>
                    </div>

                  </div>

                  {/* DELIVERY OPTIONS */}
                  <div className="receive-heading">
                    Receive your medicine
                  </div>

                  <button
                    className={`receive-option ${
                      deliveryType === "pickup"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setDeliveryType("pickup")
                    }
                  >

                    <div className="receive-option-icon">
                      <Store size={18} />
                    </div>

                    <div>
                      <strong>Pharmacy Pickup</strong>
                      <span>Ready in {selected.delivery}</span>
                    </div>

                    <div className="option-price">
                      FREE
                    </div>

                    {deliveryType === "pickup" && (
                      <CheckCircle2 size={18} />
                    )}

                  </button>

                  <button
                    className={`receive-option ${
                      deliveryType === "delivery"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setDeliveryType("delivery")
                    }
                  >

                    <div className="receive-option-icon">
                      <Truck size={18} />
                    </div>

                    <div>
                      <strong>Home Delivery</strong>
                      <span>Delivered to your doorstep</span>
                    </div>

                    <div className="option-price">
                      ₹30
                    </div>

                    {deliveryType === "delivery" && (
                      <CheckCircle2 size={18} />
                    )}

                  </button>

                  <div className="summary-divider"></div>

                  <div className="summary-row">
                    <span>Medicine</span>
                    <strong>₹{selected.price}</strong>
                  </div>

                  <div className="summary-row">
                    <span>Delivery</span>
                    <strong>
                      {deliveryCharge === 0
                        ? "FREE"
                        : `₹${deliveryCharge}`}
                    </strong>
                  </div>

                  <div className="summary-total">
                    <span>Total</span>
                    <strong>₹{total}</strong>
                  </div>

                  <button
                    className="continue-reservation-btn"
                    onClick={handleContinue}
                  >
                    Continue to Reservation
                    <ChevronRight size={18} />
                  </button>

                  <div className="summary-security">
                    <ShieldCheck size={15} />
                    Secure reservation · No payment required now
                  </div>
                </>
              )}

            </div>

            {/* TRUST CARD */}
            <div className="trust-card">

              <div className="trust-icon">
                <ShieldCheck size={21} />
              </div>

              <div>
                <h3>Why choose MediLink?</h3>

                <p>
                  Verified pharmacies, transparent pricing
                  and secure medicine reservations.
                </p>
              </div>

            </div>

          </aside>

        </div>

      </main>
    </div>
  );
};

export default PharmacySelection;