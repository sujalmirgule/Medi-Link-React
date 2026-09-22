# MediLink — Smart Healthcare Medicine Marketplace & Fulfillment Platform

MediLink is a production-grade healthcare marketplace and medicine fulfillment platform connecting **Customers**, **Licensed Pharmacies**, **Delivery Partners**, and **Platform Administrators**. It provides real-time medicine inventory discovery, atomic stock reservation, multi-party order lifecycle management, secure doorstep OTP verification, escrow/settlement handling, verified customer ratings & reviews, platform discounts, and an AI-powered medicine information assistant with clinical guardrails.

---

## 🌟 Key Platform Features

### 1. 🛒 Customer Experience & Marketplace
- **Real-Time Medicine Discovery**: Search and filter catalog by brand name, generic composition, dosage form, and therapeutic category.
- **Local Pharmacy Selection**: Compare live stock, prices, and pharmacy locations with transparent availability.
- **Flexible Order Fulfillment**: Choose between In-Store Pickup or Verified Home Delivery with saved delivery addresses.
- **Delivery OTP Security**: Cryptographically generated 6-digit delivery OTP shown exclusively to the ordering customer.
- **Interactive AI Assistant**: Ask questions regarding medicine composition, therapeutic uses, and general safety precautions.
- **Verified Reviews & Ratings**: Submit ratings (1–5 stars) and detailed reviews for purchased medicines, dispensing pharmacies, and delivery partners upon order completion.

### 2. 🏥 Pharmacy Portal & Inventory Management
- **Verification Workflow**: Partner onboarding with license validation and administrative approval gates.
- **Batch-Level Inventory Control**: Manage medicines with batch numbers, manufacturing dates, expiry dates, and real-time quantities.
- **Atomic Stock Reservation**: Instant reservation upon customer order placement prevents overselling and race conditions.
- **Order Processing Lifecycle**: Real-time state transitions: `PENDING` ➔ `ACCEPTED` ➔ `PREPARING` ➔ `READY_FOR_PICKUP`.
- **Order Rejection with Reason**: Automatically releases reserved stock back to the pharmacy inventory.
- **Financial Settlement Tracking**: Dedicated settlement portal tracking pharmacy disbursement totals, fees, and settlement status.

### 3. 🛵 Delivery Partner Dispatch & Fulfillment
- **Assignment Acceptance**: Verification-gated delivery partners accept assigned pickup orders.
- **Live Dispatch Progression**: `ASSIGNED` ➔ `PICKED_UP` ➔ `OUT_FOR_DELIVERY` ➔ `DELIVERED`.
- **Live GPS Tracking**: Coordinate telemetry updates with bounded latitude and longitude validation.
- **Doorstep OTP Handshake**: Secure delivery completion requires customer OTP verification with replay protection.
- **Delivery Performance History**: Track completed runs, active runs, and customer ratings.

### 4. 🛡️ Admin Dashboard & Governance
- **Metrics Overview**: Real-time platform aggregates (users, pharmacies, drivers, orders, revenue, verifications).
- **Partner Verification Queue**: Inspect pharmacy licenses and delivery credentials with approve/reject workflows and mandatory rejection audit logs.
- **User Management**: Search, filter, inspect profiles, and toggle account activation status (with administrative self-lockout guards).
- **Delivery Assignment Console**: Dispatch ready-for-pickup home delivery orders to active, verified drivers.
- **Discounts & Coupons Engine**: Create and manage percentage-based (with max discount caps) and fixed-amount coupons with minimum order validation.
- **Review Moderation**: Moderate, inspect, soft-hide, or delete inappropriate reviews with audit trail tracking.
- **Comprehensive Audit Logs**: Immutable platform logs recording administrative and business lifecycle events.

### 5. 🤖 AI Medicine Information Assistant
- **Safe Informational Grounding**: Answers questions strictly grounded in authoritative medicine catalog data.
- **Clinical Safety Guardrails**: Built-in regex and semantic guardrails immediately intercept emergency situations, diagnosis attempts, prescription requests, dosage calculations, and treatment adjustments with safe professional disclaimers.
- **Prompt Injection Defense**: Multi-layered sanitization preventing jailbreak attempts or system prompt extraction.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Lucide Icons, Vanilla CSS Design System |
| **Backend** | Node.js, Express, TypeScript, Zod, Helmet, CORS, Rate-Limiting |
| **Database & ORM** | PostgreSQL, Prisma ORM 6 |
| **Authentication & Security** | JWT (HS256 with explicit algorithm validation), Bcrypt password hashing, RBAC |
| **Testing & QA** | Custom Automated Test Frameworks, TS-Node, End-to-End & Security Suites |

---

## 📐 Architecture

```text
┌─────────────────────────────────────────────────────────┐
│              React 19 + Vite Frontend SPA               │
│  (Customer, Pharmacy, Delivery Partner & Admin Portals) │
└────────────────────────────┬────────────────────────────┘
                             │ HTTPS / JSON (JWT Bearer)
                             ▼
┌─────────────────────────────────────────────────────────┐
│               Node.js + Express Backend API             │
│  ├── Helmet Security & CORS Policy                      │
│  ├── Express Rate Limiters (1000 req/15 min)            │
│  ├── RBAC & Verification Middleware                     │
│  ├── Zod Schema Validation                              │
│  ├── Modular Controllers & Domain Services              │
│  └── AI Medicine Assistant & Guardrail Pipeline         │
└────────────────────────────┬────────────────────────────┘
                             │ Prisma Client (Transactions)
                             ▼
┌─────────────────────────────────────────────────────────┐
│                   PostgreSQL Database                   │
│  ├── Users, Profiles, Verification Requests             │
│  ├── Medicines, Pharmacy Inventory Batches              │
│  ├── Orders, Order Items, Stock Reservations            │
│  ├── Deliveries, Live Locations, OTP Hashes             │
│  ├── Payments, Pharmacy Settlements                     │
│  ├── Notifications, Reviews, Ratings, Discounts         │
│  └── Immutable Audit Logs                               │
└─────────────────────────────────────────────────────────┘
```

---

## 💻 Local Development Setup

### Prerequisites
- **Node.js**: v20 or newer
- **npm**: v10 or newer
- **PostgreSQL**: v14 or newer running locally or via Docker

### 1. Clone Repository
```bash
git clone https://github.com/sujalmirgule/Medi-Link-React.git
cd Medi-Link-React
```

### 2. Install Dependencies
```bash
# Install root workspace dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
cd ..
```

### 3. Configure Environment Variables
Copy the `.env.example` templates:
```bash
# Backend Environment
cp backend/.env.example backend/.env

# Frontend Environment
cp frontend/.env.example frontend/.env
```

Ensure `backend/.env` contains your local PostgreSQL credentials:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/medilink?schema=public"
JWT_SECRET="development-secret-key-replace-in-production"
PORT=5000
FRONTEND_URL="http://localhost:5173"
NODE_ENV="development"
```

### 4. Database Setup & Migrations
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

### 5. Seed Initial Admin Account
```bash
# Provision initial administrator (admin@medilink.com / Admin@MediLink2026)
npx tsx src/scripts/seed-admin.ts
cd ..
```

### 6. Run the Application
Run both backend and frontend concurrently:
```bash
# From workspace root:
npm run dev:backend    # Starts API on http://localhost:5000
npm run dev:frontend   # Starts Vite on http://localhost:5173
```

---

## 🧪 Automated Testing

MediLink includes comprehensive end-to-end integration and security test suites covering all modules:

```bash
# Run all test suites from root
npm test

# Run individual test suites
npm run test:auth      # Phase 3: Registration, Login, RBAC, Claims
npm run test:admin     # Phase 4: Admin Metrics, Verifications, User Ops
npm run test:pharmacy  # Phase 5: Inventory, Batches, Stock Isolation
npm run test:orders    # Phase 7: Atomic Reservations, Concurrency, States
npm run test:delivery  # Phase 8: Dispatch, GPS, Doorstep OTP Verification
npm run test:phase11   # Phase 11: Reviews, Aggregate Ratings, Discounts
npm run test:phase12   # Phase 12: AI Assistant & Clinical Safety Guardrails
npm run test:phase13   # Phase 13: Full QA End-to-End System Validation
npm run test:phase14   # Phase 14: Security Hardening & Vulnerability Audit
```

---

## 🏗️ Production Build

To compile backend TypeScript and bundle the frontend React application for production:

```bash
# Build backend (compiles TypeScript to dist/server.js)
npm run build:backend
# Or: cd backend && npm run build

# Build frontend (bundles Vite React SPA to dist/)
npm run build:frontend
# Or: cd frontend && npm run build
```

---

## 🔒 Security Architecture

- **Token Security**: Explicit `HS256` signature verification; prevention of `none` algorithm exploits; short-lived access tokens with strict issuer checks.
- **Production Secret Guard**: Startup validation throws fatal exceptions if default or weak `JWT_SECRET` keys are used in `production` mode.
- **Data Protection**: Zero leakage of `passwordHash`, `deliveryOtpHash`, private tokens, or payment secrets in API responses.
- **IDOR Protection**: Multi-tenant resource ownership checks across orders, payments, notifications, inventory batches, and delivery assignments.
- **Rate Limiting & DoS Shield**: `express-rate-limit` active on all `/api/*` endpoints; payload size capped at 1MB.
- **Clinical AI Safety**: Regex and heuristic safety filters intercept emergency, diagnosis, dosage, and interaction questions with clinical disclaimers.

---

## 🚀 Production Deployment

### Database Deployment
Production database migrations must execute without data destruction:
```bash
cd backend
npx prisma migrate deploy
```

### Backend Deployment (Node.js / Container)
```bash
cd backend
npm install --omit=dev
npm run build
npm start
```
*The server will start using `node dist/server.js` listening on the configured `PORT`.*

### Frontend Deployment (Static Hosting / CDN / SPA)
Serve the compiled `frontend/dist` directory via Nginx, Vercel, Netlify, or AWS CloudFront/S3 with SPA rewrite rules:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

---

## 📄 License
This project is licensed under the ISC License.
