import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { orderService } from "../services/order";
import { customerService } from "../services/customer";
import { discountService } from "../services/discount";
import { useAuth } from "../context/AuthContext";
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
  AlertTriangle,
  RefreshCw,
  Plus,
  Tag,
  Percent,
  X,
} from "lucide-react";
import "./reservation.css";

const Reservation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Selected parameters passed from pharmacy-selection or medicine-details
  const passedMedicine = location.state?.medicine;
  const passedPharmacy = location.state?.pharmacy;
  const initialDeliveryType = location.state?.deliveryType || "pickup";

  const [deliveryType, setDeliveryType] = useState(initialDeliveryType);
  const [quantity, setQuantity] = useState(1);

  // Address state
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newLabel, setNewLabel] = useState("Home");
  const [newLine1, setNewLine1] = useState("");
  const [newLine2, setNewLine2] = useState("");
  const [newCity, setNewCity] = useState("Kalyan");
  const [newState, setNewState] = useState("Maharashtra");
  const [newPincode, setNewPincode] = useState("421301");
  const [savingAddress, setSavingAddress] = useState(false);

  // Discount & Coupon State
  const [couponInput, setCouponInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState(null);
  const [discountSuccess, setDiscountSuccess] = useState(null);

  // Submission state
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState(null);

  // Fallback demo data if navigated to directly
  const medicine = passedMedicine || {
    id: "sample",
    name: "Paracetamol 500mg",
    generic: "Paracetamol",
    pack: "10 Tablets",
    price: 28,
  };

  const pharmacy = passedPharmacy || {
    id: "sample",
    name: "LifeCare Pharmacy",
    distance: "1.2 km",
    rating: "4.8",
    address: "Kalyan, Maharashtra",
    pickupTime: "20–30 min",
    price: 28,
  };

  const availableStock = pharmacy.availableStock || 50;

  // Load customer addresses if logged in
  useEffect(() => {
    if (user) {
      customerService
        .getCustomerAddresses()
        .then((data) => {
          setAddresses(data);
          const defaultAddr = data.find((a) => a.isDefault) || data[0];
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
          } else {
            setShowNewAddressForm(true);
          }
        })
        .catch(() => {
          // Addresses optional for pickup
        });
    }
  }, [user]);

  const unitPrice = Number(pharmacy.price || medicine.price || 28);
  const deliveryCharge = deliveryType === "delivery" ? 30 : 0;
  const subtotal = unitPrice * quantity;
  const discountAmount = appliedDiscount ? appliedDiscount.discountAmount : 0;
  const total = Math.max(0, subtotal - discountAmount) + deliveryCharge;

  const handleApplyCoupon = async (e) => {
    e?.preventDefault();
    if (!couponInput.trim()) {
      setDiscountError("Please enter a valid coupon code.");
      return;
    }

    setDiscountLoading(true);
    setDiscountError(null);
    setDiscountSuccess(null);

    try {
      const result = await discountService.previewDiscount({
        code: couponInput.trim(),
        subtotal,
      });

      setAppliedDiscount(result);
      setDiscountSuccess(`Coupon '${result.code}' applied! Saved ₹${result.discountAmount.toFixed(2)}.`);
    } catch (err) {
      setAppliedDiscount(null);
      setDiscountError(err.message || "Invalid coupon code.");
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedDiscount(null);
    setCouponInput("");
    setDiscountError(null);
    setDiscountSuccess(null);
  };

  const handleSaveNewAddress = async (e) => {
    e.preventDefault();
    if (!newLine1.trim() || !newCity.trim() || !newPincode.trim()) {
      setOrderError("Please complete all required address fields.");
      return;
    }

    setSavingAddress(true);
    setOrderError(null);
    try {
      const created = await customerService.createCustomerAddress({
        label: newLabel,
        addressLine1: newLine1.trim(),
        addressLine2: newLine2.trim() || null,
        city: newCity.trim(),
        state: newState.trim(),
        pincode: newPincode.trim(),
        isDefault: true,
      });

      setAddresses((prev) => [created, ...prev]);
      setSelectedAddressId(created.id);
      setShowNewAddressForm(false);
    } catch (err) {
      setOrderError(err.message || "Failed to save new delivery address.");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleConfirm = async () => {
    if (!user) {
      navigate("/login", { state: { returnTo: location.pathname } });
      return;
    }

    if (deliveryType === "delivery") {
      if (!selectedAddressId) {
        setOrderError("Please select or enter a delivery address for Home Delivery.");
        return;
      }
    }

    setIsPlacingOrder(true);
    setOrderError(null);

    try {
      // Create real order in backend with atomic stock reservation and discount integration
      const createdOrder = await orderService.createOrder({
        pharmacyId: pharmacy.pharmacyId || pharmacy.pharmacy?.id || pharmacy.id,
        fulfillmentType: deliveryType === "delivery" ? "HOME_DELIVERY" : "PICKUP",
        deliveryAddressId: deliveryType === "delivery" ? selectedAddressId : null,
        discountCode: appliedDiscount?.code || null,
        items: [
          {
            pharmacyMedicineId: pharmacy.pharmacyMedicineId || pharmacy.id,
            quantity,
          },
        ],
      });

      navigate("/order-confirmation", {
        state: { order: createdOrder },
      });
    } catch (err) {
      setOrderError(err.message || "Failed to place order. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="reservation-page">
      {/* HEADER */}
      <header className="reservation-header">
        <div className="reservation-header-inner">
          <button
            className="reservation-back-btn"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={19} />
            Back
          </button>

          <div className="reservation-step">
            <span className="step-active">1</span>
            <span className="step-line"></span>
            <span className="step-active">2</span>
            <span className="step-line"></span>
            <span className="step-active">3</span>
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
            ORDER &amp; RESERVATION
          </span>

          <h1>Complete your order</h1>

          <p>
            Review medicine reservation details, select fulfillment, and place your order.
          </p>
        </div>

        {orderError && (
          <div
            style={{
              background: "#fee2e2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              borderRadius: "10px",
              padding: "14px 18px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "14px",
            }}
          >
            <AlertTriangle size={20} />
            <span>{orderError}</span>
          </div>
        )}

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

                <div className="medicine-price">&#8377;{unitPrice.toFixed(2)}</div>
              </div>

              <div className="medicine-summary-details">
                <span>{medicine.generic || medicine.genericName}</span>
                <span>&bull;</span>
                <span>{medicine.pack || medicine.strength || "Standard Unit"}</span>
              </div>

              {/* Quantity Selector */}
              <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Order Quantity:</span>
                <select
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontWeight: "700",
                    fontSize: "14px",
                    color: "#0f172a",
                    background: "#f8fafc",
                  }}
                >
                  {[...Array(Math.min(10, availableStock || 10))].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} unit{i > 0 ? "s" : ""}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: "12px", color: "#10b981", fontWeight: "600" }}>
                  ({availableStock} available in stock)
                </span>
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
                  <p>Stock will be reserved at this verified store</p>
                </div>
              </div>

              <div className="selected-pharmacy">
                <div className="pharmacy-icon">
                  <Store size={23} />
                </div>

                <div className="pharmacy-info">
                  <div className="pharmacy-name-row">
                    <h3>{pharmacy.pharmacy?.name || pharmacy.name}</h3>

                    <span className="open-badge">
                      <CheckCircle2 size={13} />
                      Verified
                    </span>
                  </div>

                  <div className="pharmacy-meta">
                    <span>
                      <MapPin size={14} />
                      {pharmacy.pharmacy?.city || pharmacy.city || "Nearby"}
                    </span>
                    <span>
                      <Clock3 size={14} />
                      {pharmacy.pickupTime || "Fast Fulfillment"}
                    </span>
                  </div>

                  <p className="pharmacy-address">
                    {pharmacy.pharmacy?.address || pharmacy.address}
                  </p>
                </div>
              </div>

              <button
                className="change-pharmacy-btn"
                onClick={() => navigate("/pharmacy-selection", { state: { medicine } })}
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
                  <p>Select counter pickup or doorstep delivery</p>
                </div>
              </div>

              <div className="receive-methods">
                <button
                  type="button"
                  className={`receive-method ${deliveryType === "pickup" ? "selected" : ""}`}
                  onClick={() => setDeliveryType("pickup")}
                >
                  <div className="method-icon">
                    <Store size={22} />
                  </div>

                  <div className="method-content">
                    <h3>Pickup from Pharmacy</h3>
                    <p>Collect at pharmacy counter</p>
                    <strong>FREE</strong>
                  </div>

                  {deliveryType === "pickup" && <CheckCircle2 className="method-check" size={22} />}
                </button>

                <button
                  type="button"
                  className={`receive-method ${deliveryType === "delivery" ? "selected" : ""}`}
                  onClick={() => setDeliveryType("delivery")}
                >
                  <div className="method-icon">
                    <Truck size={22} />
                  </div>

                  <div className="method-content">
                    <h3>Home Delivery</h3>
                    <p>Delivered to your doorstep</p>
                    <strong>&#8377;30 delivery</strong>
                  </div>

                  {deliveryType === "delivery" && <CheckCircle2 className="method-check" size={22} />}
                </button>
              </div>

              {/* DELIVERY ADDRESS SELECTION */}
              {deliveryType === "delivery" && (
                <div style={{ marginTop: "20px", borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
                  <label style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", display: "block", marginBottom: "8px" }}>
                    Select Delivery Address
                  </label>

                  {addresses.length > 0 && !showNewAddressForm ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "12px" }}>
                      {addresses.map((addr) => (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          style={{
                            padding: "12px 16px",
                            borderRadius: "8px",
                            border: selectedAddressId === addr.id ? "2px solid #087ac7" : "1px solid #e2e8f0",
                            background: selectedAddressId === addr.id ? "#f0f9ff" : "#ffffff",
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: "700", fontSize: "13px", color: "#0f172a" }}>
                              {addr.label || "Home"}
                            </span>
                            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                              {addr.addressLine1}, {addr.city} - {addr.pincode}
                            </div>
                          </div>
                          {selectedAddressId === addr.id && <CheckCircle2 size={18} color="#087ac7" />}
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => setShowNewAddressForm(true)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "transparent",
                          border: "none",
                          color: "#087ac7",
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: "600",
                          padding: "6px 0",
                        }}
                      >
                        <Plus size={15} /> Add a different address
                      </button>
                    </div>
                  ) : (
                    <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                        <span style={{ fontWeight: "700", fontSize: "13px" }}>Add New Delivery Address</span>
                        {addresses.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setShowNewAddressForm(false)}
                            style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: "12px" }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div style={{ gridColumn: "span 2" }}>
                          <input
                            type="text"
                            placeholder="Flat, House no., Building, Apartment *"
                            value={newLine1}
                            onChange={(e) => setNewLine1(e.target.value)}
                            style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="City *"
                            value={newCity}
                            onChange={(e) => setNewCity(e.target.value)}
                            style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Pincode (6 digits) *"
                            value={newPincode}
                            onChange={(e) => setNewPincode(e.target.value)}
                            style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveNewAddress}
                        disabled={savingAddress}
                        style={{
                          marginTop: "12px",
                          padding: "8px 16px",
                          background: "#087ac7",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                        }}
                      >
                        {savingAddress ? "Saving Address..." : "Use This Address"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* INFO */}
            <div className="reservation-info">
              <ShieldCheck size={19} />
              <div>
                <strong>Atomic Inventory Guarantee</strong>
                <p>
                  Your medicine stock is atomically reserved at the selected pharmacy upon order placement.
                </p>
              </div>
            </div>
          </section>

          {/* RIGHT SUMMARY */}
          <aside className="reservation-sidebar">
            <div className="order-summary">
              <div className="summary-header">
                <h2>Reservation Summary</h2>
                <span>{quantity} item(s)</span>
              </div>

              <div className="summary-medicine">
                <div className="summary-pill">
                  <Package size={20} />
                </div>

                <div>
                  <h3>{medicine.name}</h3>
                  <p>
                    &#8377;{unitPrice.toFixed(2)} &times; {quantity}
                  </p>
                </div>

                <strong>&#8377;{subtotal.toFixed(2)}</strong>
              </div>

              <div className="summary-divider"></div>

              {/* Coupon / Promo Code Box */}
              <div style={{ margin: "14px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "8px" }}>
                  <Tag size={14} color="#087ac7" />
                  <span>MediLink Promo Code</span>
                </div>

                {appliedDiscount ? (
                  <div
                    style={{
                      background: "#d1fae5",
                      border: "1px solid #6ee7b7",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <CheckCircle2 size={15} color="#059669" />
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#065f46" }}>
                        {appliedDiscount.code} (-₹{appliedDiscount.discountAmount.toFixed(2)})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      style={{ background: "transparent", border: "none", color: "#047857", cursor: "pointer", display: "flex", alignItems: "center", padding: "2px" }}
                      title="Remove coupon"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <input
                        type="text"
                        placeholder="Enter coupon (e.g. PCT20)"
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase());
                          if (discountError) setDiscountError(null);
                        }}
                        style={{
                          flex: 1,
                          padding: "8px 10px",
                          borderRadius: "6px",
                          border: discountError ? "1px solid #ef4444" : "1px solid #cbd5e1",
                          fontSize: "12px",
                          textTransform: "uppercase",
                          fontWeight: "600",
                          outline: "none",
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={discountLoading || !couponInput.trim()}
                        style={{
                          padding: "8px 14px",
                          background: "#087ac7",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: discountLoading || !couponInput.trim() ? "not-allowed" : "pointer",
                          opacity: discountLoading || !couponInput.trim() ? 0.6 : 1,
                        }}
                      >
                        {discountLoading ? "..." : "Apply"}
                      </button>
                    </div>
                    {discountError && (
                      <div style={{ fontSize: "11px", color: "#dc2626", marginTop: "4px" }}>
                        {discountError}
                      </div>
                    )}
                    {discountSuccess && (
                      <div style={{ fontSize: "11px", color: "#059669", marginTop: "4px" }}>
                        {discountSuccess}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="summary-divider"></div>

              <div className="summary-row">
                <span>Medicine Subtotal</span>
                <strong>&#8377;{subtotal.toFixed(2)}</strong>
              </div>

              {discountAmount > 0 && (
                <div className="summary-row" style={{ color: "#059669" }}>
                  <span>Platform Discount</span>
                  <strong>-&#8377;{discountAmount.toFixed(2)}</strong>
                </div>
              )}

              <div className="summary-row">
                <span>Delivery Fee</span>
                <strong>{deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge.toFixed(2)}`}</strong>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-total">
                <span>Total Amount</span>
                <strong>&#8377;{total.toFixed(2)}</strong>
              </div>

              <button
                className="confirm-reservation-btn"
                onClick={handleConfirm}
                disabled={isPlacingOrder}
                style={{ opacity: isPlacingOrder ? 0.7 : 1 }}
              >
                {isPlacingOrder ? (
                  <>
                    <RefreshCw size={18} className="pharmacy-spinner" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    Place Order Now
                    <ChevronRight size={19} />
                  </>
                )}
              </button>

              <div className="summary-trust">
                <ShieldCheck size={16} />
                Atomic stock reservation guaranteed
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Reservation;