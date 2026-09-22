import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { customerService } from "../services/customer";

import {
  Search,
  MapPin,
  SlidersHorizontal,
  ChevronDown,
  Star,
  Clock3,
  ShoppingBag,
  Heart,
  Pill,
  Store,
  Truck,
  ShieldCheck,
  X,
} from "lucide-react";

import logo from "../assets/medilink-logo.png";

import "./medicine-search.css";

function MedicineSearch() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] =
    useState("Kalyan, Maharashtra");

  const [locationOpen, setLocationOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [availability, setAvailability] = useState("All");
  const [sortBy, setSortBy] = useState("Relevance");
  const [backendMedicines, setBackendMedicines] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const locations = [
    "Kalyan, Maharashtra",
    "Mumbai, Maharashtra",
    "Thane, Maharashtra",
    "Navi Mumbai, Maharashtra",
    "Pune, Maharashtra",
  ];

  const staticMedicines = [
    {
      id: 1,
      name: "Paracetamol 500mg",
      generic: "Paracetamol",
      type: "Tablet",
      price: "₹28",
      oldPrice: "₹32",
      pharmacies: 8,
      availability: "Available",
      category: "Pain Relief",
    },
    {
      id: 2,
      name: "Cetirizine 10mg",
      generic: "Cetirizine",
      type: "Tablet",
      price: "₹35",
      oldPrice: "₹40",
      pharmacies: 6,
      availability: "Available",
      category: "Allergy",
    },
    {
      id: 3,
      name: "Pantoprazole 40mg",
      generic: "Pantoprazole",
      type: "Tablet",
      price: "₹68",
      oldPrice: "₹75",
      pharmacies: 5,
      availability: "Available",
      category: "Gastric Care",
    },
    {
      id: 4,
      name: "Amoxicillin 500mg",
      generic: "Amoxicillin",
      type: "Capsule",
      price: "₹52",
      oldPrice: "₹60",
      pharmacies: 3,
      availability: "Limited",
      category: "Antibiotic",
    },
    {
      id: 5,
      name: "Azithromycin 500mg",
      generic: "Azithromycin",
      type: "Tablet",
      price: "₹92",
      oldPrice: "₹105",
      pharmacies: 4,
      availability: "Available",
      category: "Antibiotic",
    },
    {
      id: 6,
      name: "Vitamin D3",
      generic: "Cholecalciferol",
      type: "Tablet",
      price: "₹120",
      oldPrice: "₹140",
      pharmacies: 7,
      availability: "Available",
      category: "Vitamins",
    },
  ];

  const pharmacies = [
    {
      name: "Zeno Health Pharmacy",
      location: "Khadakpada, Kalyan West",
      distance: "1.2 km",
      rating: "4.9",
      reviews: "201",
      status: "Open",
      time: "09:00 AM – 11:00 PM",
      medicines: 42,
    },
    {
      name: "Shree Ram Medical & General Stores",
      location: "Chakki Naka, Kalyan East",
      distance: "2.1 km",
      rating: "4.9",
      reviews: "359",
      status: "Open",
      time: "09:00 AM – 12:00 AM",
      medicines: 38,
    },
    {
      name: "Apollo Pharmacy",
      location: "Karnik Road, Kalyan West",
      distance: "2.8 km",
      rating: "4.3",
      reviews: "55",
      status: "Open",
      time: "07:00 AM – 11:00 PM",
      medicines: 35,
    },
    {
      name: "Geetanjali Medical & General Stores",
      location: "Lokdhara, Kalyan East",
      distance: "3.4 km",
      rating: "4.8",
      reviews: "150",
      status: "Open",
      time: "09:00 AM – 11:30 PM",
      medicines: 31,
    },
  ];

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        const res = await customerService.searchMedicines({
          search: searchTerm.trim() || undefined,
        });
        if (active && res.items && res.items.length > 0) {
          const mapped = res.items.map((item) => ({
            id: item.id,
            name: item.name,
            generic: item.genericName,
            type: item.dosageForm || "Tablet",
            price: item.minPrice ? `₹${item.minPrice}` : "₹28",
            oldPrice:
              item.maxPrice && item.maxPrice > item.minPrice
                ? `₹${item.maxPrice}`
                : `₹${Math.round((item.minPrice || 30) * 1.15)}`,
            pharmacies: item.pharmacyCount || 1,
            availability: item.isAvailable
              ? item.availableStock < 10
                ? "Limited"
                : "Available"
              : "Out of Stock",
            category: item.category || "General",
            raw: item,
          }));
          setBackendMedicines(mapped);
        } else if (active && searchTerm.trim() !== "") {
          setBackendMedicines([]);
        }
      } catch (err) {
        // Keep existing/static fallback on API error
      } finally {
        if (active) setIsLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchTerm]);

  const activeMedicines = useMemo(() => {
    if (backendMedicines.length > 0) {
      return backendMedicines;
    }
    if (searchTerm.trim() !== "" && !isLoading) {
      return [];
    }
    return staticMedicines;
  }, [backendMedicines, searchTerm, isLoading]);

  const filteredMedicines = useMemo(() => {
    let result = activeMedicines.filter((medicine) => {
      const search = searchTerm.toLowerCase().trim();
      if (!search) return true;

      return (
        medicine.name.toLowerCase().includes(search) ||
        medicine.generic.toLowerCase().includes(search) ||
        medicine.category.toLowerCase().includes(search)
      );
    });

    if (availability !== "All") {
      result = result.filter(
        (medicine) => medicine.availability === availability
      );
    }

    if (sortBy === "Price Low to High") {
      result.sort(
        (a, b) =>
          Number(String(a.price).replace("₹", "")) -
          Number(String(b.price).replace("₹", ""))
      );
    }

    if (sortBy === "Price High to Low") {
      result.sort(
        (a, b) =>
          Number(String(b.price).replace("₹", "")) -
          Number(String(a.price).replace("₹", ""))
      );
    }

    return result;
  }, [activeMedicines, searchTerm, availability, sortBy]);

  const handleSearch = () => {
    setSearchTerm(searchTerm.trim());
  };

  // View Details → Medicine Details Page
  const handleViewDetails = (medicine) => {
    navigate(`/medicine-details?id=${medicine.id}`, {
      state: { medicine: medicine.raw || medicine, medicineId: medicine.id },
    });
  };

  const handleBack = () => {
    navigate("/user/dashboard");
  };

  return (
    <div className="medicine-page">

      {/* ================= HEADER ================= */}

      <header className="medicine-header">
        <div className="medicine-header-left">

          <button
            className="medicine-back-button"
            onClick={handleBack}
            aria-label="Back to dashboard"
          >
            ←
          </button>

          <div className="medicine-logo">
            <img src={logo} alt="MediLink" />
          </div>

        </div>

        <div className="medicine-location-wrapper">

          <button
            className="medicine-location-button"
            onClick={() =>
              setLocationOpen((previous) => !previous)
            }
          >
            <MapPin size={17} />

            <span>{selectedLocation}</span>

            <ChevronDown size={15} />
          </button>

          {locationOpen && (
            <div className="medicine-location-dropdown">

              <strong>Select Location</strong>

              {locations.map((location) => (
                <button
                  key={location}
                  onClick={() => {
                    setSelectedLocation(location);
                    setLocationOpen(false);
                  }}
                >
                  <MapPin size={14} />

                  {location}
                </button>
              ))}

            </div>
          )}

        </div>
      </header>

      {/* ================= MAIN ================= */}

      <main className="medicine-content">

        {/* HEADING */}

        <section className="medicine-heading">

          <div>

            <span className="medicine-eyebrow">
              <Pill size={15} />
              MEDICINE FINDER
            </span>

            <h1>Find medicines near you</h1>

            <p>
              Search medicines, compare nearby pharmacies and
              reserve what you need.
            </p>

          </div>

          <div className="medicine-trust">
            <ShieldCheck size={18} />
            Verified pharmacies
          </div>

        </section>

        {/* SEARCH */}

        <section className="medicine-search-box">

          <div className="medicine-search-input">

            <Search size={21} />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder="Search medicine name, brand or composition..."
            />

            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                <X size={17} />
              </button>
            )}

          </div>

          <button
            className="medicine-search-button"
            onClick={handleSearch}
          >
            Search Medicine
          </button>

        </section>

        {/* BENEFITS */}

        <section className="medicine-benefits">

          <div>

            <div className="benefit-icon">
              <Store size={19} />
            </div>

            <div>
              <strong>Nearby Pharmacies</strong>
              <span>Compare stores around you</span>
            </div>

          </div>

          <div>

            <div className="benefit-icon">
              <ShoppingBag size={19} />
            </div>

            <div>
              <strong>Easy Reservation</strong>
              <span>Reserve before visiting</span>
            </div>

          </div>

          <div>

            <div className="benefit-icon">
              <Truck size={19} />
            </div>

            <div>
              <strong>Home Delivery</strong>
              <span>Get medicines delivered</span>
            </div>

          </div>

        </section>

        {/* MAIN GRID */}

        <div className="medicine-main-grid">

          {/* ================= MEDICINES ================= */}

          <section className="medicine-results">

            <div className="results-top">

              <div>

                <h2>Medicines</h2>

                <span>
                  {filteredMedicines.length} medicines found
                  near {selectedLocation.split(",")[0]}
                </span>

              </div>

              <div className="results-actions">

                <button
                  className="filter-button"
                  onClick={() =>
                    setShowFilters((previous) => !previous)
                  }
                >
                  <SlidersHorizontal size={16} />
                  Filters
                </button>

                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(event.target.value)
                  }
                >
                  <option>Relevance</option>
                  <option>Price Low to High</option>
                  <option>Price High to Low</option>
                </select>

              </div>

            </div>

            {/* FILTER PANEL */}

            {showFilters && (
              <div className="filter-panel">

                <div>

                  <span>Availability</span>

                  <div className="filter-options">

                    {["All", "Available", "Limited"].map(
                      (item) => (
                        <button
                          key={item}
                          className={
                            availability === item
                              ? "active"
                              : ""
                          }
                          onClick={() =>
                            setAvailability(item)
                          }
                        >
                          {item}
                        </button>
                      )
                    )}

                  </div>

                </div>

              </div>
            )}

            {/* MEDICINE CARDS */}

            <div className="medicine-card-list">

              {filteredMedicines.map((medicine) => (

                <article
                  className="medicine-card"
                  key={medicine.id}
                >

                  <div className="medicine-product-image">

                    <div>
                      <Pill size={34} />
                    </div>

                  </div>

                  <div className="medicine-card-content">

                    <div className="medicine-card-top">

                      <div>

                        <span className="medicine-category">
                          {medicine.category}
                        </span>

                        <h3>{medicine.name}</h3>

                        <p>
                          {medicine.generic} · {medicine.type}
                        </p>

                      </div>

                      <button
                        className="medicine-save"
                        aria-label="Save medicine"
                      >
                        <Heart size={17} />
                      </button>

                    </div>

                    <div className="medicine-price-row">

                      <strong>{medicine.price}</strong>

                      <del>{medicine.oldPrice}</del>

                      <span
                        className={`availability-badge ${
                          medicine.availability === "Limited"
                            ? "limited"
                            : ""
                        }`}
                      >
                        {medicine.availability}
                      </span>

                    </div>

                    <div className="medicine-card-bottom">

                      <span>
                        <Store size={14} />

                        Available at{" "}
                        {medicine.pharmacies} pharmacies
                      </span>

                      {/* CONNECTED TO DETAILS PAGE */}

                      <button
                        onClick={() =>
                          handleViewDetails(medicine)
                        }
                      >
                        View Details →
                      </button>

                    </div>

                  </div>

                </article>

              ))}

              {/* EMPTY STATE */}

              {filteredMedicines.length === 0 && (

                <div className="medicine-empty">

                  <div>
                    <Search size={30} />
                  </div>

                  <h3>No medicines found</h3>

                  <p>
                    Try another medicine name, brand or
                    composition.
                  </p>

                </div>

              )}

            </div>

          </section>

          {/* ================= PHARMACY SIDEBAR ================= */}

          <aside className="pharmacy-sidebar">

            <div className="pharmacy-sidebar-heading">

              <div>

                <span>NEARBY</span>

                <h2>Pharmacies</h2>

              </div>

              <MapPin size={20} />

            </div>

            <p className="pharmacy-location-text">
              Showing pharmacies around{" "}
              {selectedLocation.split(",")[0]}
            </p>

            <div className="pharmacy-list">

              {pharmacies.map((pharmacy) => (

                <div
                  className="search-pharmacy-card"
                  key={pharmacy.name}
                >

                  <div className="search-pharmacy-image">
                    <Store size={31} />
                  </div>

                  <div className="search-pharmacy-info">

                    <div className="search-pharmacy-name-row">

                      <h3>{pharmacy.name}</h3>

                      <button aria-label="Save pharmacy">
                        <Heart size={15} />
                      </button>

                    </div>

                    <p>{pharmacy.location}</p>

                    <div className="pharmacy-rating-row">

                      <span>
                        <Star
                          size={13}
                          fill="currentColor"
                        />

                        {pharmacy.rating}
                      </span>

                      <small>
                        ({pharmacy.reviews})
                      </small>

                      <span className="pharmacy-distance">

                        <MapPin size={12} />

                        {pharmacy.distance}

                      </span>

                    </div>

                    <div className="pharmacy-status-row">

                      <span className="pharmacy-open">
                        ● {pharmacy.status}
                      </span>

                      <span>
                        <Clock3 size={12} />
                        {pharmacy.time}
                      </span>

                    </div>

                    <div className="pharmacy-stock">

                      <Pill size={13} />

                      {pharmacy.medicines}+
                      medicines listed

                    </div>

                    <button className="view-pharmacy-button">
                      View Pharmacy
                    </button>

                  </div>

                </div>

              ))}

            </div>

          </aside>

        </div>

      </main>

    </div>
  );
}

export default MedicineSearch;