# MediLink — Healthcare Medicine Marketplace

MediLink is a modern healthcare marketplace platform connecting customers, neighborhood pharmacies, and delivery partners for transparent medicine availability, reservation, and delivery.

---

## 1. Current Architecture

```text
┌──────────────────────────────────────┐
│       React / Vite Frontend          │
└──────────────────┬───────────────────┘
                   │ HTTP / JSON
                   ▼
┌──────────────────────────────────────┐
│       Node / Express API             │
└──────────────────┬───────────────────┘
                   │ Prisma ORM
                   ▼
┌──────────────────────────────────────┐
│       PostgreSQL Database            │
└──────────────────────────────────────┘
```

---

## 2. Platform Roles

* **`CUSTOMER`**: Discover medicines, compare local pharmacies, reserve prescriptions, and track deliveries.
* **`PHARMACY`**: Manage retail pharmacy inventory, real-time stock availability, and incoming orders.
* **`DELIVERY_PARTNER`**: Manage doorstep dispatch and delivery fulfillment.
* **`ADMIN`**: Platform administration, regulatory compliance, and pharmacy verification.

*(Note: Role-specific business features, portals, and RBAC will be implemented in upcoming phases).*

---

## 3. Project Structure

```text
MediLinkProject/
├── frontend/             # React 19 + Vite client application
│   ├── src/              # Pages, assets, styles, API client
│   └── package.json
│
├── backend/              # Node.js + Express + TypeScript server
│   ├── src/              # App, server, routes, middleware, config
│   ├── prisma/           # Prisma schema & migrations
│   └── package.json
│
├── docs/                 # Architectural specifications
│   └── architecture/
│
├── .env.example          # Environment variable template
├── .gitignore            # Git exclusion rules
└── package.json          # Root workspace orchestration scripts
```

---

## 4. Local Setup

### Prerequisites
* **Node.js**: v20 or newer
* **npm**: v10 or newer
* **PostgreSQL**: v16 or newer running on `localhost:5432`

### Step 1: Install Dependencies
```bash
# From workspace root:
npm run install:all    # Or install in frontend/ and backend/ separately
cd frontend && npm install
cd ../backend && npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` in the root and `backend/`:
```bash
cp .env.example backend/.env
cp frontend/.env.example frontend/.env
```

Ensure `DATABASE_URL` in `backend/.env` points to your PostgreSQL instance:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/medilink?schema=public"
```

### Step 3: Start PostgreSQL
Ensure your local PostgreSQL server service is running and create the `medilink` database if it does not already exist:
```sql
CREATE DATABASE medilink;
```

### Step 4: Run Prisma Commands
From the `backend` directory:
```bash
cd backend
npx prisma generate
```

### Step 5: Start the Backend API
```bash
npm run dev:backend
# Or: cd backend && npm run dev
```
The server will start on `http://localhost:5000`.

### Step 6: Start the Frontend Client
```bash
npm run dev:frontend
# Or: cd frontend && npm run dev
```
The frontend will start on `http://localhost:5173`.

---

## 5. API Health Check

Verify that the backend is running properly:

```http
GET http://localhost:5000/api/v1/health
```

Expected Response:
```json
{
  "success": true,
  "message": "MediLink API is running",
  "timestamp": "2026-09-22T08:45:00.000Z"
}
```
