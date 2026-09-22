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

---

## 9. Phase 11: Reviews, Ratings & MediLink-Controlled Discounts

### 9.1 Review Architecture & Schema
The `Review` model serves as a unified entity for customer reviews and ratings across three distinct target types:
* **Medicine Reviews:** Requires a completed order where the customer purchased the specific medicine.
* **Pharmacy Ratings:** Requires a completed order fulfilled by that specific pharmacy.
* **Delivery Partner Ratings:** Requires a completed/delivered order fulfilled via `HOME_DELIVERY` by the specific delivery partner.

```prisma
model Review {
  id                String   @id @default(uuid())
  customerId        String
  orderId           String?  // Authoritative link to completed order
  pharmacyId        String?
  deliveryPartnerId String?
  medicineId        String?
  rating            Int      // 1 to 5 stars
  comment           String?  // Optional text (max 1000 characters)
  isHidden          Boolean  @default(false) // Admin soft-moderation
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  customer        User             @relation("CustomerReviews", fields: [customerId], references: [id])
  order           Order?           @relation(fields: [orderId], references: [id])
  pharmacy        Pharmacy?        @relation(fields: [pharmacyId], references: [id])
  deliveryPartner DeliveryPartner? @relation(fields: [deliveryPartnerId], references: [id])
  medicine        Medicine?        @relation(fields: [medicineId], references: [id])

  @@unique([customerId, orderId, medicineId], name: "unique_medicine_review_per_order")
  @@unique([customerId, orderId, pharmacyId], name: "unique_pharmacy_review_per_order")
  @@unique([customerId, orderId, deliveryPartnerId], name: "unique_delivery_review_per_order")
}
```

### 9.2 Review Eligibility & Protection Rules
* **Purchase Verification:** Reviews are strictly allowed only for customers who placed and completed the order.
* **State Machine Requirement:** Order status must be `COMPLETED` for medicine/pharmacy reviews, and `DELIVERED` or `COMPLETED` for delivery partner ratings.
* **Target Isolation:** Only 1 target entity (`medicineId`, `pharmacyId`, or `deliveryPartnerId`) can be specified per review.
* **Duplicate Protection:** Compound database unique constraints prevent duplicate submissions for the same order and target.
* **Customer Ownership:** Customers can edit only their own review rating and comments.

### 9.3 Aggregate Ratings
* Aggregates are computed via PostgreSQL aggregate queries (`_avg`, `_count`) excluding soft-hidden reviews (`isHidden: false`).
* Averages are rounded to 1 decimal place.

### 9.4 MediLink Discount Architecture & Calculation
* **Platform Control:** Discounts are exclusively managed by MediLink administrators. Pharmacies cannot create coupon codes.
* **Types Supported:**
  * `PERCENTAGE`: Calculated as `(subtotal * value) / 100`. Enforces `maxDiscount` cap if configured.
  * `FIXED`: Direct deduction `min(value, subtotal)`.
* **Validity Checks:**
  * `isActive == true`
  * `startsAt <= now <= endsAt` (if dates are specified)
  * `subtotal >= minimumOrderAmount` (if threshold is specified)
* **Authoritative Order Integration:**
  * Discount calculation occurs exclusively on the backend within the atomic order creation transaction.
  * Order total amount is calculated as `max(0, subtotal + deliveryFee - discountAmount)`.
  * Downstream payment operations strictly charge `Order.totalAmount`.

### 9.5 Phase 11 API Endpoints

#### Reviews API:
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/reviews` | Customer | Submit verified review for medicine, pharmacy, or delivery partner |
| `GET` | `/api/v1/reviews/me` | Customer | List own submitted reviews |
| `GET` | `/api/v1/reviews/order-status/:orderId` | Customer | Get review eligibility and submitted status for an order |
| `PATCH` | `/api/v1/reviews/:id` | Customer | Update own review rating/comment |
| `GET` | `/api/v1/medicines/:id/reviews` | Public | List verified public reviews & aggregate rating for a medicine |
| `GET` | `/api/v1/pharmacies/:id/rating` | Public | Get aggregate rating for a pharmacy |
| `GET` | `/api/v1/reviews/delivery-partners/:id/rating` | Public / Auth | Get aggregate rating for a delivery partner |
| `GET` | `/api/v1/admin/reviews` | Admin | List and search all reviews with status/rating/target filters |
| `PATCH` | `/api/v1/admin/reviews/:id/hide` | Admin | Soft-hide / Unhide review with audit log |
| `DELETE` | `/api/v1/admin/reviews/:id` | Admin | Permanently delete review with audit log |

#### Discounts API:
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/orders/preview-discount` | Customer / Public | Preview coupon code discount calculation before checkout |
| `POST` | `/api/v1/admin/discounts` | Admin | Create a new platform coupon code with audit log |
| `GET` | `/api/v1/admin/discounts` | Admin | List all discount coupons with filters and pagination |
| `GET` | `/api/v1/admin/discounts/:id` | Admin | Get single discount coupon details |
| `PATCH` | `/api/v1/admin/discounts/:id` | Admin | Update discount coupon parameters with audit log |
| `PATCH` | `/api/v1/admin/discounts/:id/status` | Admin | Toggle discount active/inactive status with audit log |
| `DELETE` | `/api/v1/admin/discounts/:id` | Admin | Delete discount coupon permanently with audit log |

---

## 10. Phase 12: Basic Medicine Information AI Assistant

### 10.1 Overview & Scope Boundaries
The MediLink AI Assistant is a **basic educational medicine information assistant**. It is grounded strictly in verified MediLink catalog data (`Medicine`, `MedicineCategory`).

> **CRITICAL MEDICAL SAFETY RESTRICTIONS**:
> The MediLink AI Assistant is NOT a diagnostic or prescribing system.
> * ZERO disease diagnoses or symptom analyses.
> * ZERO drug prescriptions or medication recommendations.
> * ZERO dosage calculations or dosage change recommendations (regardless of age/weight).
> * ZERO treatment alteration or discontinuation recommendations.
> * ZERO emergency medical advice (immediate escalation to emergency helplines 112/108).
> * ZERO hallucination of unverified medical claims, compositions, or side effects.

### 10.2 AI Architecture & Provider Abstraction
```text
┌───────────────────────────────────────────────┐
│               POST /api/v1/ai/chat            │
└──────────────────────┬────────────────────────┘
                       │ authenticate + aiRateLimiter
                       ▼
┌───────────────────────────────────────────────┐
│                 AIController                  │
└──────────────────────┬────────────────────────┘
                       │ Zod Validation (chatRequestSchema)
                       ▼
┌───────────────────────────────────────────────┐
│                  AIService                    │
│                                               │
│  1. Medicine Context Retrieval (Prisma)       │
│  2. Pre-Inference Guardrails (AIGuardrails)   │
│  3. Provider Execution (IAIProvider)          │
│  4. Post-Inference Safety Verification        │
│  5. Response Formatting & Source Attribution   │
└──────────────────────┬────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
┌───────────────────────────┐ ┌───────────────────────────┐
│      InternalProvider     │ │  Future External Provider │
│ (Deterministic, Grounded) │ │   (OpenAI / Gemini / etc) │
└───────────────────────────┘ └───────────────────────────┘
```

### 10.3 Medical Safety Guardrails
1. **Emergency Escalation:** Detects life-threatening symptoms, overdose, poisoning, or acute chest pain and provides immediate emergency hotline contact details.
2. **Clinical Safety Policy:** Intercepts diagnosis inquiries, prescription requests, dosage calculations, and treatment changes, redirecting users to licensed medical practitioners.
3. **Special Populations Advisory:** Provides cautious educational guidance for pregnancy, lactation, and pediatrics, requiring specialist consultation.
4. **Prompt Injection Defense:** Defends against jailbreak attempts and system prompt overrides, strictly upholding medical guardrails.

### 10.4 API Specification

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/ai/chat` | Authenticated (Rate-limited: 60 req/15 min) | Submit medicine inquiries and receive safe, grounded educational responses |

### 10.5 Known Limitations
* The assistant is strictly limited to verified catalog information present in the database.
* Comprehensive drug-drug interaction databases and real-time medical imaging are outside Phase 12 scope.

