import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import UserDashboard from "./pages/user-dashboard.jsx";
import MedicineSearch from "./pages/medicine-search.jsx";
import MedicineDetails from "./pages/medicine-details.jsx";
import PharmacySelection from "./pages/pharmacy-selection.jsx";
import Reservation from "./pages/reservation.jsx";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import "./index.css";

import App from "./App.jsx";
import Login from "./pages/login.jsx";
import Register from "./pages/register.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={<App />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route path="/user/dashboard" element={<UserDashboard />} />
         <Route path="/medicines" element={<MedicineSearch />} />
         <Route path="/medicine-details" element={<MedicineDetails />} />
<Route
  path="/pharmacy-selection"
  element={<PharmacySelection />}

/>
<Route path="/reservation" element={<Reservation />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);