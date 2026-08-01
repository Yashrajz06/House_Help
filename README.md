# House Help Management System

A web-based platform for managing house help services — connecting customers with verified service providers such as maids, plumbers, electricians, and other household professionals.

---

## Project Structure

```
house-help/
├── main.py              # Python/FastAPI backend (port 8000) — Notifications, Audit Log, Payments
├── server.js            # Node.js backend (port 3000) — Users, LOV Master
├── package.json         # Root package with scripts to run all servers
├── .env                 # DB credentials (NOT committed — see .env.example)
├── .env.example         # Template for .env
│
├── public/              # Frontend HTML forms
│   ├── css/
│   │   └── common.css
│   ├── js/
│   │   ├── common.js
│   │   ├── users_form.js
│   │   ├── lov_form.js
│   │   ├── notifications_form.js
│   │   ├── audit_log_form.js
│   │   └── payments_form.js
│   ├── users_form.html
│   ├── lov_form.html
│   ├── notifications_form.html
│   ├── audit_log_form.html
│   └── payments_form.html
│
├── react-dashboard/     # React frontend dashboard (port 5173)
│   └── src/
│       ├── App.jsx
│       └── App.css
│
├── docs/                # Project documentation
│   ├── House Help System BRD.docx
│   ├── House Help System DB.xlsx
│   └── House Help System Design.png
│
└── tests/
    └── test_db.js
```

---

## Prerequisites

Make sure the following are installed on your machine:

| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.10+ | FastAPI backend |
| Node.js | 18+ | Node backend + React |
| npm | 9+ | Package manager |
| Oracle Instant Client | Latest | Oracle DB driver for Python (`oracledb`) |

---

## First-Time Setup

### 1. Clone the repository

```bash
git clone <your-github-repo-url>
cd house-help
```

### 2. Configure Environment Variables

Copy the example file and fill in your Oracle DB credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DB_USER=your_oracle_username
DB_PASSWORD=your_oracle_password
DB_DSN=tcps://your_host:port/your_service_name
```

### 3. Set up Python environment

```bash
python3 -m venv venv
source venv/bin/activate        # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

> **Note:** If `requirements.txt` doesn't exist yet, install manually:
> ```bash
> pip install fastapi uvicorn oracledb python-dotenv
> ```

### 4. Install Node.js dependencies

```bash
# Root dependencies (Node server + concurrently)
npm install

# React dashboard dependencies
cd react-dashboard && npm install && cd ..
```

---

## Running the Project

Everything can be started with a **single command** from the project root:

```bash
npm run dev
```

This uses `concurrently` to start all three servers at once:

| Server | URL | Technology |
|--------|-----|------------|
| React Dashboard | http://localhost:5173 | Vite + React |
| Node.js Backend | http://localhost:3000 | Node.js (Users, LOV) |
| Python Backend | http://localhost:8000 | FastAPI (Notifications, Payments, Audit Log) |

Open **http://localhost:5173** in your browser to access the dashboard.

---

## Running Servers Individually

If you need to run them separately, open three terminals:

**Terminal 1 — Node server:**
```bash
node server.js
```

**Terminal 2 — Python server:**
```bash
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Terminal 3 — React dashboard:**
```bash
cd react-dashboard
npm run dev
```

---

## Available Forms

| Form | URL | Backend |
|------|-----|---------|
| **Dashboard** | http://localhost:5173 | React |
| **Users** | http://localhost:3000/users_form.html | Node.js |
| **LOV Master** | http://localhost:3000/lov_form.html | Node.js |
| **Notifications** | http://localhost:8000/notifications_form.html | Python |
| **Audit Log** | http://localhost:8000/audit_log_form.html | Python |
| **Payments** | http://localhost:8000/payments_form.html | Python |

---

## API Endpoints

### Node.js (port 3000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/getUsers` | List all users |
| GET | `/getLOV` | List active LOV values |
| GET | `/getAllLOVs` | List all LOV records |
| POST | `/saveUser` | Create or update a user |
| POST | `/saveAuditLog` | Create or update an audit log |
| POST | `/saveNotification` | Create or update a notification |
| POST | `/saveLOVMaster` | Create or update an LOV entry |

### Python/FastAPI (port 8000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/getNotifications` | List all notifications |
| GET | `/getAuditLogs` | List all audit logs |
| GET | `/getPayments` | List all payments |
| GET | `/getBookings` | List all bookings |
| GET | `/getUsers` | List all users |
| GET | `/getLOV` | List active LOV values |
| POST | `/saveNotification` | Create or update a notification |
| POST | `/saveAuditLog` | Create or update an audit log |
| POST | `/savePayment` | Create or update a payment |

---

## Database

- **Database:** Oracle (Cloud free tier via `db.freesql.com`)
- **Driver:** `oracledb` (Python), `oracledb` (Node.js)
- **Connection:** TLS (`tcps://`) — credentials stored in `.env`

### Key Tables

| Table | Description |
|-------|-------------|
| `USERS` | System users (Customers, Providers, Admins) |
| `LOV` | List of Values — dropdown configuration |
| `NOTIFICATIONS` | System notifications per user |
| `AUDIT_LOG` | Action history logs |
| `PAYMENTS` | Payment records linked to bookings |
| `BOOKINGS` | Service booking records |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend Dashboard | React 18 + Vite |
| Transaction Forms | Vanilla HTML / CSS / JavaScript |
| Node.js Backend | Node.js HTTP server + `oracledb` |
| Python Backend | FastAPI + `oracledb` + `uvicorn` |
| Database | Oracle Database (Cloud) |
| Process Manager | `concurrently` (npm) |
