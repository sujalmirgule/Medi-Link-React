import {
  Search,
  MapPin,
  ShieldCheck,
  Clock3,
  Truck,
  ArrowRight,
  ChevronDown,
  Menu,
  X,
  HeartPulse,
  Pill,
  LocateFixed,
  CheckCircle2,
  Sparkles,
  Bell,
  LockKeyhole,
  Headphones,
  RotateCcw,
} from "lucide-react";

import { useState } from "react";
import "./App.css";

import heroImage from "./assets/image.jpeg";
import logo from "./assets/medilink-logo.png";

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [medicine, setMedicine] = useState("");

  const popularMedicines = [
    "Paracetamol",
    "Crocin",
    "Amoxicillin",
    "Vitamin D3",
    "Cetirizine",
  ];

  const handlePopularSearch = (medicineName) => {
    setMedicine(medicineName);
  };

  const handleSearch = () => {
    if (!medicine.trim()) {
      return;
    }

    console.log("Searching medicine:", medicine);
  };

  return (
    <div className="medilink">

      {/* =====================================================
          NAVIGATION
      ===================================================== */}

      <header className="navbar">
        <div className="nav-inner">

          <a
            href="#home"
            className="brand"
            onClick={() => setMenuOpen(false)}
          >
            <img
              src={logo}
              alt="MediLink"
              className="brand-logo"
            />
          </a>


          <nav
            className={
              menuOpen
                ? "nav-links open"
                : "nav-links"
            }
          >
            <a
              href="#home"
              onClick={() => setMenuOpen(false)}
            >
              Home
            </a>

            <a
              href="#medicines"
              onClick={() => setMenuOpen(false)}
            >
              Medicines
            </a>

            <a
              href="#pharmacies"
              onClick={() => setMenuOpen(false)}
            >
              Pharmacies
            </a>

            <a
              href="#how-it-works"
              onClick={() => setMenuOpen(false)}
            >
              How It Works
            </a>

            <a
              href="#about"
              onClick={() => setMenuOpen(false)}
            >
              About
            </a>
          </nav>


          <div className="nav-actions">

            <button
              type="button"
              className="theme-button"
              aria-label="Theme"
            >
              ☼
            </button>

            <a
              href="/login"
              className="login-link"
            >
              Login
            </a>

            <a
              href="/login"
              className="nav-cta"
            >
              Get Started
              <ArrowRight size={17} />
            </a>

          </div>


          <button
            type="button"
            className="mobile-menu"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? (
              <X size={22} />
            ) : (
              <Menu size={22} />
            )}
          </button>

        </div>
      </header>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main>

        {/* ===================================================
            HERO SECTION
        =================================================== */}

        <section
          className="hero"
          id="home"
        >

          {/* -------------------------------
              HERO LEFT
          -------------------------------- */}

          <div className="hero-left">

            <div className="eyebrow">
              <span className="eyebrow-dot"></span>
              SMART HEALTHCARE PLATFORM
            </div>


            <h1>
              Your health,
              <br />
              <span>our priority.</span>
            </h1>


            <p className="hero-text">
              Find medicines, discover nearby pharmacies
              and reserve what you need — all from one
              simple healthcare platform.
            </p>


            {/* ==========================================
                SEARCH AREA
            ========================================== */}

            <div className="search-panel-wrapper">

              <div className="search-panel">

                {/* MEDICINE */}

                <div className="search-field">

                  <Search size={21} />

                  <div>

                    <span>
                      Search medicine
                    </span>

                    <input
                      type="text"
                      value={medicine}
                      placeholder="What medicine are you looking for?"
                      onChange={(event) =>
                        setMedicine(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          handleSearch();
                        }
                      }}
                    />

                  </div>

                </div>


                {/* LOCATION */}

                <div
                  className="location-field"
                  id="pharmacies"
                >

                  <MapPin size={21} />

                  <div>

                    <span>
                      Location
                    </span>

                    <button
                      type="button"
                    >
                      <span className="location-value">
                        Nearby pharmacies
                      </span>

                      <ChevronDown size={15} />
                    </button>

                  </div>

                </div>


                {/* SEARCH BUTTON */}

                <button
                  type="button"
                  className="search-button"
                  onClick={handleSearch}
                >
                  Search
                  <ArrowRight size={19} />
                </button>

              </div>


              {/* POPULAR MEDICINES */}

              <div className="popular-searches">

                <span className="popular-searches-label">
                  Popular:
                </span>

                {popularMedicines.map(
                  (medicineName) => (
                    <button
                      key={medicineName}
                      type="button"
                      className="popular-search"
                      onClick={() =>
                        handlePopularSearch(
                          medicineName
                        )
                      }
                    >
                      {medicineName}
                    </button>
                  )
                )}

              </div>

            </div>


            {/* ==========================================
                TRUST INDICATORS
            ========================================== */}

            <div className="trust-row">

              <div className="trust-item">

                <div className="trust-icon">
                  <ShieldCheck size={20} />
                </div>

                <div>
                  <strong>
                    Verified
                  </strong>

                  <span>
                    Pharmacies
                  </span>
                </div>

              </div>


              <div className="trust-item">

                <div className="trust-icon">
                  <Clock3 size={20} />
                </div>

                <div>
                  <strong>
                    Real-time
                  </strong>

                  <span>
                    Availability
                  </span>
                </div>

              </div>


              <div className="trust-item">

                <div className="trust-icon">
                  <Truck size={20} />
                </div>

                <div>
                  <strong>
                    Fast
                  </strong>

                  <span>
                    Delivery
                  </span>
                </div>

              </div>

            </div>

          </div>


          {/* -------------------------------
              HERO RIGHT
          -------------------------------- */}

          <div className="hero-right">

            <div className="hero-glow"></div>


            <div className="hero-image-wrapper">

              <img
                src={heroImage}
                alt="Healthcare and medicine"
              />

              <div className="image-overlay"></div>

            </div>


            {/* MEDICINE AVAILABLE CARD */}

            <div className="floating-card availability-card">

              <div className="floating-icon">
                <CheckCircle2 size={20} />
              </div>

              <div>
                <strong>
                  Medicine Available
                </strong>

                <span>
                  Nearby pharmacy
                </span>
              </div>

              <div className="online-dot"></div>

            </div>


            {/* DELIVERY CARD */}

            <div className="floating-card delivery-card">

              <div className="floating-icon">
                <Truck size={20} />
              </div>

              <div>
                <strong>
                  Quick Delivery
                </strong>

                <span>
                  Track your order
                </span>
              </div>

            </div>


            {/* SMALL INFORMATION PILL */}

            <div className="floating-pill">

              <HeartPulse size={15} />

              <span>
                Healthcare made simple
              </span>

            </div>

          </div>

        </section>


        {/* ===================================================
            STATS
        =================================================== */}

        <section className="stats">

          {/* STAT 1 */}

          <div className="stat">

            <div className="stat-icon">
              <HeartPulse size={19} />
            </div>

            <div>

              <strong>
                10K+
              </strong>

              <span>
                Happy Users
              </span>

            </div>

          </div>


          {/* STAT 2 */}

          <div className="stat">

            <div className="stat-icon">
              <Pill size={19} />
            </div>

            <div>

              <strong>
                500+
              </strong>

              <span>
                Medicines Listed
              </span>

            </div>

          </div>


          {/* STAT 3 */}

          <div className="stat">

            <div className="stat-icon">
              <MapPin size={19} />
            </div>

            <div>

              <strong>
                100+
              </strong>

              <span>
                Partner Pharmacies
              </span>

            </div>

          </div>


          {/* STAT 4 */}

          <div className="stat">

            <div className="stat-icon">
              <Clock3 size={19} />
            </div>

            <div>

              <strong>
                24/7
              </strong>

              <span>
                Availability
              </span>

            </div>

          </div>

        </section>


        {/* ===================================================
            WHY MEDILINK
        =================================================== */}

        <section
          className="features"
          id="medicines"
        >

          <div className="section-heading">

            <div className="section-label">
              <Sparkles size={14} />
              WHY MEDILINK
            </div>


            <h2>
              Healthcare made
              <br />
              <em>simpler.</em>
            </h2>


            <p>
              Everything you need to find, reserve
              and receive your medicines in one place.
            </p>

          </div>


          <div className="feature-grid">

            {/* FEATURE 01 */}

            <article className="feature-card">

              <div className="feature-top">

                <span className="feature-number">
                  01
                </span>

                <div className="feature-icon">
                  <Search size={22} />
                </div>

              </div>


              <h3>
                Search Medicines
              </h3>


              <p>
                Quickly find the medicine you need
                and check its availability before
                visiting a pharmacy.
              </p>


              <a href="#medicines">
                Explore medicines
                <ArrowRight size={16} />
              </a>

            </article>


            {/* FEATURE 02 */}

            <article className="feature-card featured">

              <div className="feature-top">

                <span className="feature-number">
                  02
                </span>

                <div className="feature-icon">
                  <MapPin size={22} />
                </div>

              </div>


              <h3>
                Find Nearby Pharmacies
              </h3>


              <p>
                Discover pharmacies around you
                and compare medicine availability
                in real time.
              </p>


              <a href="#pharmacies">
                Find pharmacies
                <ArrowRight size={16} />
              </a>

            </article>


            {/* FEATURE 03 */}

            <article className="feature-card">

              <div className="feature-top">

                <span className="feature-number">
                  03
                </span>

                <div className="feature-icon">
                  <ShieldCheck size={22} />
                </div>

              </div>


              <h3>
                Reserve with Confidence
              </h3>


              <p>
                Reserve your medicine in advance
                so it is ready when you reach
                the pharmacy.
              </p>


              <a href="#medicines">
                Reserve medicine
                <ArrowRight size={16} />
              </a>

            </article>


            {/* FEATURE 04 */}

            <article className="feature-card">

              <div className="feature-top">

                <span className="feature-number">
                  04
                </span>

                <div className="feature-icon">
                  <Truck size={22} />
                </div>

              </div>


              <h3>
                Get It Delivered
              </h3>


              <p>
                Choose convenient home delivery
                and keep track of your medicine
                order from anywhere.
              </p>


              <a href="#how-it-works">
                Learn more
                <ArrowRight size={16} />
              </a>

            </article>

          </div>

        </section>


        {/* ===================================================
            HOW IT WORKS
        =================================================== */}

        <section
          className="how-it-works"
          id="how-it-works"
        >

          <div className="how-left">

            <div className="section-label">
              <Sparkles size={14} />
              HOW IT WORKS
            </div>


            <h2>
              From search
              <br />
              <span>to doorstep.</span>
            </h2>


            <p>
              MediLink makes finding and getting
              your medicines simple, convenient
              and stress-free.
            </p>

          </div>


          <div className="steps">

            {/* STEP 01 */}

            <div className="step">

              <div className="step-number">
                01
              </div>

              <div>

                <h3>
                  Search
                </h3>

                <p>
                  Find the medicine you need.
                </p>

              </div>

            </div>


            {/* STEP 02 */}

            <div className="step">

              <div className="step-number">
                02
              </div>

              <div>

                <h3>
                  Choose
                </h3>

                <p>
                  Select a nearby pharmacy.
                </p>

              </div>

            </div>


            {/* STEP 03 */}

            <div className="step">

              <div className="step-number">
                03
              </div>

              <div>

                <h3>
                  Reserve
                </h3>

                <p>
                  Reserve or order your medicine.
                </p>

              </div>

            </div>


            {/* STEP 04 */}

            <div className="step">

              <div className="step-number">
                04
              </div>

              <div>

                <h3>
                  Receive
                </h3>

                <p>
                  Pick it up or get it delivered.
                </p>

              </div>

            </div>

          </div>

        </section>


        {/* ===================================================
            TRUST / BENEFITS STRIP
        =================================================== */}

        <section className="benefits-strip">

          <div className="benefit-item">

            <div className="benefit-icon">
              <LockKeyhole size={20} />
            </div>

            <div>
              <strong>
                Secure & Private
              </strong>

              <span>
                Your information stays protected
              </span>
            </div>

          </div>


          <div className="benefit-item">

            <div className="benefit-icon">
              <Headphones size={20} />
            </div>

            <div>
              <strong>
                24/7 Support
              </strong>

              <span>
                We're here whenever you need us
              </span>
            </div>

          </div>


          <div className="benefit-item">

            <div className="benefit-icon">
              <RotateCcw size={20} />
            </div>

            <div>
              <strong>
                Easy Returns
              </strong>

              <span>
                Simple and transparent process
              </span>
            </div>

          </div>


          <div className="benefit-item">

            <div className="benefit-icon">
              <Bell size={20} />
            </div>

            <div>
              <strong>
                Smart Notifications
              </strong>

              <span>
                Stay updated on your orders
              </span>
            </div>

          </div>

        </section>


        {/* ===================================================
            BOTTOM CTA
        =================================================== */}

        <section
          className="bottom-cta"
          id="about"
        >

          <div>

            <div className="cta-label">
              <LocateFixed size={15} />
              START WITH MEDILINK
            </div>


            <h2>
              Your medicines,
              <br />
              <span>just a search away.</span>
            </h2>

          </div>


          <a href="/login">

            Get Started

            <ArrowRight size={18} />

          </a>

        </section>

      </main>

    </div>
  );
}

export default App;