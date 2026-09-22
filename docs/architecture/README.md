# MediLink System Architecture Documentation

## 1. Overview

**MediLink** is a healthcare medicine marketplace platform connecting customers, local pharmacies, and delivery partners with an administrator governance layer.

---

## 2. Architecture Pattern: Modular Monolith

MediLink employs a **Modular Monolith** architecture for the backend instead of distributed microservices.

### Key Rationale:
* **Single Deployment Unit:** Simplified local development, deployment, and configuration.
* **Low Latency & Transactional Integrity:** Direct in-process communication between domain services and ACID database transactions across orders, pharmacies, and inventory.
* **Bounded Contexts:** Code is organized by domain modules (Auth, Pharmacy, Medicine, Order, Delivery, Admin), maintaining clear separation of concerns while allowing future service extraction if necessary.

---

## 3. High-Level Architecture Diagram

```text
┌────────────────────────────────────────────────────────┐
│               Frontend (React 19 + Vite)               │
│                                                        │
│  - Customer Portal (Landing, Search, Details, Reserve) │
│  - Pharmacy Portal [Planned]                           │
│  - Delivery Partner Portal [Planned]                   │
│  - Admin Portal [Planned]                              │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP / JSON
                            ▼
┌────────────────────────────────────────────────────────┐
│             Backend (Node.js + Express + TS)           │
│                                                        │
│  - Security: Helmet, CORS                              │
│  - Routing: /api/v1/*                                  │
│  - Middleware: Centralized Error Handler, JSON Parser  │
│  - Modules:                                            │
│    ├── Health (GET /api/v1/health) [Active]            │
│    ├── Auth & RBAC [Planned - Phase 3]                 │
│    ├── Medicines & Search [Planned - Phase 4]          │
│    ├── Pharmacies & Inventory [Planned - Phase 5]      │
│    ├── Reservations & Orders [Planned - Phase 6]       │
│    └── Delivery & Dispatch [Planned - Phase 7]         │
└───────────────────────────┬────────────────────────────┘
                            │ Prisma ORM
                            ▼
┌────────────────────────────────────────────────────────┐
│               PostgreSQL Database                      │
│                                                        │
│  - Database Name: medilink                             │
│  - Connection pooling & typed queries via Prisma       │
└────────────────────────────────────────────────────────┘
```

---

## 4. Frontend Architecture

* **Framework:** React 19 with Vite.
* **Language:** JavaScript (ES Modules, JSX).
* **Styling:** Custom Vanilla CSS with responsive media queries and Lucide icons.
* **Routing:** React Router v7 (`react-router-dom`).
* **API Client:** Reusable `fetch`-based HTTP client in `src/lib/api.js` utilizing `VITE_API_BASE_URL`.
* **Current Screens:**
  * `/`: Home / Landing Page
  * `/login`: Login screen (static mock)
  * `/register`: Registration screen (static mock)
  * `/user/dashboard`: Customer Dashboard (mock data)
  * `/medicines`: Medicine search & discovery (mock data)
  * `/medicine-details`: Medicine detail & pharmacy comparison (mock data)
  * `/pharmacy-selection`: Pharmacy selection & pickup/delivery selection (mock data)
  * `/reservation`: Reservation checkout (mock data)

---

## 5. Backend Architecture

* **Runtime:** Node.js (v20+).
* **Framework:** Express 4 / TypeScript.
* **Entry Points:**
  * `src/app.ts`: Express application setup, security headers (Helmet), CORS configuration, and centralized error handler.
  * `src/server.ts`: HTTP server lifecycle and graceful shutdown handling.
* **Directory Structure:**
  * `src/config/`: Environment configuration and validation.
  * `src/middleware/`: Security, validation, logging, and error handling.
  * `src/routes/`: Versioned API routing (`/api/v1`).
  * `src/controllers/`: Request orchestration [Planned for business modules].
  * `src/services/`: Core business logic [Planned for business modules].
  * `src/lib/`: Reusable singletons (Prisma client).
  * `src/utils/`: Common helper functions.

---

## 6. Database & ORM

* **Database:** PostgreSQL (v17/18).
* **ORM:** Prisma ORM.
* **Configuration:** `backend/prisma/schema.prisma` configured with PostgreSQL datasource and `@prisma/client` generator.
* **Data Models:** [Planned for Phase 2].

---

## 7. API Structure

All API routes follow standard RESTful conventions prefixed with `/api/v1`:

| Endpoint | Method | Status | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/health` | `GET` | **Active** | Service liveness health check |
| `/api/v1/auth/*` | `POST` | *Planned* | Registration, login, logout, refresh tokens |
| `/api/v1/medicines/*` | `GET`, `POST` | *Planned* | Search, catalog query, medicine details |
| `/api/v1/pharmacies/*` | `GET`, `POST` | *Planned* | Pharmacy lookup, inventory, operating hours |
| `/api/v1/orders/*` | `GET`, `POST` | *Planned* | Order creation, tracking, status updates |
| `/api/v1/delivery/*` | `GET`, `PATCH`| *Planned* | Delivery assignment, dispatch, driver updates |
| `/api/v1/admin/*` | `GET`, `PATCH`| *Planned* | System analytics, pharmacy verification |

---

## 8. Role & Permission Model (Future Specification)

Four distinct roles will be governed by Role-Based Access Control (RBAC):

1. **CUSTOMER:** Search medicines, check pharmacy availability, reserve medicines, place pickup/delivery orders, view history.
2. **PHARMACY:** Manage pharmacy profile, update stock/inventory, receive and fulfill reservations, confirm pickups.
3. **DELIVERY_PARTNER:** View assigned deliveries, accept delivery orders, update delivery status.
4. **ADMIN:** Platform governance, verify and approve new pharmacies, manage platform users, monitor analytics.

*(Full RBAC implementation is planned for Phase 3).*
