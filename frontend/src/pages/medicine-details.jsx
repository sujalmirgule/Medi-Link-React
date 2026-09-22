import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { customerService } from "../services/customer";
import {
  ArrowLeft,
  MapPin,
  Star,
  ShieldCheck,
  Clock3,
  Truck,
  Store,
  CheckCircle2,
  Package,
  ChevronRight,
  Heart,
  Share2,
  Info,
} from "lucide-react";

import logo from "../assets/medilink-logo.png";
import "./medicine-details.css";

function MedicineDetails() {
  const navigate = useNavigate();
  const location = useLocation();

  const [deliveryType, setDeliveryType] = useState(
    location.state?.deliveryType || "pickup"
  );

  const initialMedicine = location.state?.medicine || {
    name: "Paracetamol 500mg",
    genericName: "Paracetamol",
    manufacturer: "Cipla Ltd.",
    composition: "Paracetamol 500mg",
    packSize: "10 Tablets",
    price: 28,
    mrp: 32,
    rating: 4.7,
    reviews: 128,
    category: "Pain Relief & Fever",
  };

  const initialPharmacies = [
    {
      id: 1,
      name: "Zeno Health Pharmacy",
      distance: "0.8 km",
      rating: 4.8,
      status: "Open",
      time: "Open until 10:30 PM",
      price: 28,
      stock: "In Stock",
      stockCount: "15+ available",
      delivery: "20–30 min",
    },
    {
      id: 2,
      name: "Shree Ram Medical & General Stores",
      distance: "1.2 km",
      rating: 4.6,
      status: "Open",
      time: "Open until 11:00 PM",
      price: 27,
      stock: "In Stock",
      stockCount: "10+ available",
      delivery: "25–35 min",
    },
    {
      id: 3,
      name: "Apollo Pharmacy",
      distance: "1.8 km",
      rating: 4.7,
      status: "Open",
      time: "Open until 10:00 PM",
      price: 29,
      stock: "In Stock",
      stockCount: "20+ available",
      delivery: "30–40 min",
    },
    {
      id: 4,
      name: "Geetanjali Medical & General Stores",
      distance: "2.4 km",
      rating: 4.5,
      status: "Closed",
      time: "Opens at 8:00 AM",
      price: 26,
      stock: "Available",
      stockCount: "8 available",
      delivery: "40–50 min",
    },
  ];

  const [medicine, setMedicine] = useState(initialMedicine);
  const [pharmacies, setPharmacies] = useState(initialPharmacies);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const medId = searchParams.get("id") || location.state?.medicineId || location.state?.medicine?.id;
    if (!medId) return;

    let active = true;
    Promise.allSettled([
      customerService.getMedicine(medId),
      customerService.getMedicinePharmacies(medId),
    ]).then(([medResult, pharmResult]) => {
      if (!active) return;
      if (medResult.status === "fulfilled" && medResult.value) {
        const d = medResult.value;
        setMedicine((prev) => ({
          ...prev,
          id: d.id,
          name: d.name,
          genericName: d.genericName,
          manufacturer: d.manufacturer || prev.manufacturer,
          composition: `${d.genericName} ${d.strength || ""}`.trim(),
          packSize: d.dosageForm ? `10 ${d.dosageForm}s` : prev.packSize,
          category: d.category?.name || prev.category,
        }));
      }
      if (pharmResult.status === "fulfilled" && Array.isArray(pharmResult.value) && pharmResult.value.length > 0) {
        const mapped = pharmResult.value.map((p, idx) => ({
          id: p.pharmacyId,
          pharmacyId: p.pharmacyId,
          pharmacyMedicineId: p.pharmacyMedicineId,
          name: p.pharmacyName,
          distance: `${(0.8 + idx * 0.4).toFixed(1)} km`,
          rating: p.rating || 4.7,
          status: "Open",
          time: "Open until 10:30 PM",
          price: p.price,
          stock: p.isAvailable ? "In Stock" : "Out of Stock",
          stockCount: `${p.availableStock} available`,
          delivery: p.estimatedDeliveryTime || "20–30 min",
          address: p.address,
          phone: p.phone,
        }));
        setPharmacies(mapped);
        if (mapped[0]?.price) {
          setMedicine((prev) => ({ ...prev, price: mapped[0].price }));
        }
      }
    });

    return () => {
      active = false;
    };
  }, [location.search, location.state]);

  const handleBack = () => {
    navigate("/medicines");
  };

  const handleSelectPharmacy = (chosenPharmacy = null) => {
    navigate("/pharmacy-selection", {
      state: {
        medicine,
        selectedPharmacy: chosenPharmacy || pharmacies[0] || null,
        deliveryType,
      },
    });
  };

  return (
    <div className="medicine-details-page">

      {/* ================= HEADER ================= */}
      <header className="medicine-details-header">
        <div className="medicine-details-header-inner">

          <button className="details-back-btn" onClick={handleBack}>
            <ArrowLeft size={19} />
            <span>Back to Medicines</span>
          </button>

          <div className="details-header-right">

            <div className="details-location">
              <MapPin size={17} />
              <div>
                <span>Deliver to</span>
                <strong>Kalyan, Maharashtra</strong>
              </div>
            </div>

            <button className="details-icon-btn">
              <Heart size={19} />
            </button>

            <button className="details-icon-btn">
              <Share2 size={18} />
            </button>

          </div>
        </div>
      </header>


      {/* ================= MAIN ================= */}
      <main className="medicine-details-container">

        {/* Breadcrumb */}
        <div className="details-breadcrumb">
          <button onClick={() => navigate("/user/dashboard")}>
            Home
          </button>

          <ChevronRight size={15} />

          <button onClick={() => navigate("/medicines")}>
            Medicines
          </button>

          <ChevronRight size={15} />

          <span>{medicine.name}</span>
        </div>


        {/* ================= MEDICINE HERO ================= */}
        <section className="medicine-details-hero">

          {/* Left visual */}
          <div className="medicine-visual-card">

            <div className="medicine-verified-badge">
              <ShieldCheck size={15} />
              Verified Medicine
            </div>

            <div className="medicine-pill-visual">
              <div className="pill-box">

                <div className="pill-box-top">
                  <span>MEDILINK</span>
                  <ShieldCheck size={18} />
                </div>

                <div className="pill-box-middle">
                  <Package size={44} />
                  <strong>PARACETAMOL</strong>
                  <span>500 mg</span>
                </div>

                <div className="pill-box-bottom">
                  10 TABLETS
                </div>

              </div>
            </div>

            <div className="medicine-visual-note">
              <ShieldCheck size={16} />
              Genuine & verified medicine
            </div>

          </div>


          {/* Right information */}
          <div className="medicine-main-info">

            <div className="medicine-category">
              {medicine.category}
            </div>

            <h1>{medicine.name}</h1>

            <p className="medicine-generic">
              Generic name: <strong>{medicine.genericName}</strong>
            </p>


            {/* Rating */}
            <div className="medicine-rating-row">

              <div className="medicine-rating">
                <Star size={17} fill="currentColor" />
                <strong>{medicine.rating}</strong>
              </div>

              <span>
                {medicine.reviews} verified reviews
              </span>

              <span className="rating-separator">•</span>

              <span>Recommended</span>

            </div>


            {/* Price */}
            <div className="medicine-price-section">

              <div className="medicine-price">
                ₹{medicine.price}
              </div>

              <div className="medicine-mrp">
                MRP <del>₹{medicine.mrp}</del>
              </div>

              <span className="medicine-discount">
                {Math.round(
                  ((medicine.mrp - medicine.price) / medicine.mrp) * 100
                )}
                % OFF
              </span>

            </div>


            {/* Info grid */}
            <div className="medicine-info-grid">

              <div className="medicine-info-item">
                <span>Composition</span>
                <strong>{medicine.composition}</strong>
              </div>

              <div className="medicine-info-item">
                <span>Pack Size</span>
                <strong>{medicine.packSize}</strong>
              </div>

              <div className="medicine-info-item">
                <span>Manufacturer</span>
                <strong>{medicine.manufacturer}</strong>
              </div>

              <div className="medicine-info-item">
                <span>Availability</span>
                <strong className="available-text">
                  <CheckCircle2 size={16} />
                  Available nearby
                </strong>
              </div>

            </div>


            {/* Delivery / Pickup */}
            <div className="medicine-delivery-options">

              <h3>How would you like to receive it?</h3>

              <div className="receive-options">

                <button
                  className={`receive-option ${
                    deliveryType === "pickup" ? "active" : ""
                  }`}
                  onClick={() => setDeliveryType("pickup")}
                >
                  <div className="receive-icon">
                    <Store size={21} />
                  </div>

                  <div className="receive-content">
                    <strong>Pickup from Pharmacy</strong>
                    <span>Ready in 15–20 minutes</span>
                  </div>

                  {deliveryType === "pickup" && (
                    <CheckCircle2 className="receive-check" size={20} />
                  )}
                </button>


                <button
                  className={`receive-option ${
                    deliveryType === "delivery" ? "active" : ""
                  }`}
                  onClick={() => setDeliveryType("delivery")}
                >
                  <div className="receive-icon">
                    <Truck size={21} />
                  </div>

                  <div className="receive-content">
                    <strong>Home Delivery</strong>
                    <span>Delivered in 30–60 minutes</span>
                  </div>

                  {deliveryType === "delivery" && (
                    <CheckCircle2 className="receive-check" size={20} />
                  )}
                </button>

              </div>

            </div>


            {/* Select Pharmacy */}
            <button
              className="select-pharmacy-main-btn"
              onClick={handleSelectPharmacy}
            >
              <Store size={19} />
              Select Pharmacy
              <ChevronRight size={19} />
            </button>

            <p className="medicine-action-note">
              Choose a nearby pharmacy to check stock and reserve your medicine.
            </p>

          </div>

        </section>


        {/* ================= BENEFITS ================= */}
        <section className="medicine-benefits">

          <div className="benefit-card">
            <div className="benefit-icon">
              <ShieldCheck size={21} />
            </div>

            <div>
              <strong>Verified Medicines</strong>
              <span>Genuine medicines from trusted pharmacies</span>
            </div>
          </div>


          <div className="benefit-card">
            <div className="benefit-icon">
              <Store size={21} />
            </div>

            <div>
              <strong>Nearby Pharmacies</strong>
              <span>Compare availability near your location</span>
            </div>
          </div>


          <div className="benefit-card">
            <div className="benefit-icon">
              <Truck size={21} />
            </div>

            <div>
              <strong>Fast Delivery</strong>
              <span>Get your medicine delivered quickly</span>
            </div>
          </div>


          <div className="benefit-card">
            <div className="benefit-icon">
              <CheckCircle2 size={21} />
            </div>

            <div>
              <strong>Easy Reservation</strong>
              <span>Reserve before visiting the pharmacy</span>
            </div>
          </div>

        </section>


        {/* ================= PHARMACIES ================= */}
        <section className="nearby-pharmacies-section">

          <div className="section-heading-row">

            <div>
              <span className="section-eyebrow">
                AVAILABLE NEAR YOU
              </span>

              <h2>Pharmacies with this medicine</h2>

              <p>
                Compare prices, availability and distance before selecting a pharmacy.
              </p>
            </div>

            <button
              className="view-all-pharmacies"
              onClick={handleSelectPharmacy}
            >
              View all
              <ChevronRight size={17} />
            </button>

          </div>


          <div className="pharmacy-details-list">

            {pharmacies.map((pharmacy) => (

              <div className="pharmacy-details-card" key={pharmacy.id}>

                <div className="pharmacy-details-left">

                  <div className="pharmacy-store-icon">
                    <Store size={22} />
                  </div>

                  <div className="pharmacy-details-info">

                    <div className="pharmacy-name-row">
                      <h3>{pharmacy.name}</h3>

                      {pharmacy.status === "Open" && (
                        <span className="pharmacy-open-badge">
                          <span></span>
                          Open
                        </span>
                      )}
                    </div>


                    <div className="pharmacy-meta">

                      <span>
                        <MapPin size={14} />
                        {pharmacy.distance}
                      </span>

                      <span>
                        <Star size={14} fill="currentColor" />
                        {pharmacy.rating}
                      </span>

                      <span>
                        <Clock3 size={14} />
                        {pharmacy.time}
                      </span>

                    </div>


                    <div className="pharmacy-stock">

                      <CheckCircle2 size={15} />

                      <strong>{pharmacy.stock}</strong>

                      <span>
                        • {pharmacy.stockCount}
                      </span>

                    </div>

                  </div>

                </div>


                <div className="pharmacy-details-right">

                  <div className="pharmacy-price">
                    ₹{pharmacy.price}
                  </div>

                  <span className="pharmacy-delivery-time">
                    {pharmacy.delivery}
                  </span>

                  <button
                    className="pharmacy-select-btn"
                    onClick={() => handleSelectPharmacy(pharmacy)}
                  >
                    Select
                    <ChevronRight size={16} />
                  </button>

                </div>

              </div>

            ))}

          </div>

        </section>


        {/* ================= MEDICINE INFORMATION ================= */}
        <section className="medicine-information-section">

          <div className="medicine-information-header">
            <div className="information-icon">
              <Info size={21} />
            </div>

            <div>
              <span className="section-eyebrow">
                MEDICINE INFORMATION
              </span>

              <h2>About {medicine.name}</h2>
            </div>
          </div>


          <div className="medicine-information-grid">

            <div className="medicine-info-description">

              <h3>What is Paracetamol 500mg?</h3>

              <p>
                Paracetamol is commonly used for temporary relief from
                mild to moderate pain and fever. It works by helping reduce
                the production of substances in the body that cause pain
                and elevated temperature.
              </p>

              <p>
                Always use medicines according to the instructions provided
                by your healthcare professional or on the medicine packaging.
              </p>

            </div>


            <div className="medicine-use-card">

              <h3>Common uses</h3>

              <div className="medicine-use-list">

                <div>
                  <CheckCircle2 size={16} />
                  Fever
                </div>

                <div>
                  <CheckCircle2 size={16} />
                  Headache
                </div>

                <div>
                  <CheckCircle2 size={16} />
                  Mild body pain
                </div>

                <div>
                  <CheckCircle2 size={16} />
                  Toothache
                </div>

              </div>

            </div>

          </div>


          <div className="medicine-disclaimer">

            <ShieldCheck size={18} />

            <p>
              <strong>Important:</strong> This information is for general
              awareness only and does not replace professional medical advice.
              Consult a qualified healthcare professional if you have questions
              about using this medicine.
            </p>

          </div>

        </section>


        {/* ================= FOOTER TRUST ================= */}
        <section className="details-trust-footer">

          <div className="details-trust-item">
            <ShieldCheck size={20} />
            <div>
              <strong>Secure & Trusted</strong>
              <span>Your information stays protected</span>
            </div>
          </div>

          <div className="details-trust-item">
            <Store size={20} />
            <div>
              <strong>Verified Pharmacies</strong>
              <span>Choose from trusted pharmacy partners</span>
            </div>
          </div>

          <div className="details-trust-item">
            <Truck size={20} />
            <div>
              <strong>Flexible Delivery</strong>
              <span>Pickup or doorstep delivery</span>
            </div>
          </div>

        </section>

      </main>

    </div>
  );
}

export default MedicineDetails;