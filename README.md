<div align="center">

<img src="./public/logo.png" alt="SocialOps Logo" width="100" height="100" style="border-radius: 20px; box-shadow: 0 8px 24px rgba(99, 102, 241, 0.35);" />

# SocialOps
### Centralized Social Media Agency Management Platform (ERP)

[![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Build-Vite%206-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![MySQL](https://img.shields.io/badge/Database-MySQL%208.0-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![SQLAlchemy](https://img.shields.io/badge/ORM-SQLAlchemy%202.0-D71F00?logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org/)
[![Alembic](https://img.shields.io/badge/Migrations-Alembic-E34F26?logoColor=white)](https://alembic.sqlalchemy.org/)
[![Tests](https://img.shields.io/badge/Tests-83%20Passed%20(100%25)-brightgreen?logo=pytest&logoColor=white)](https://docs.pytest.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

*An enterprise-grade, multi-tenant agency management system streamlining creative production, client approvals, team workloads, and financial reconciliation.*

</div>

---

## 📌 Executive Summary & Problem Statement

Modern social media marketing agencies face severe operational friction when managing high-volume creative assets, distributed client revisions, and billing across fragmented third-party tools (Slack, Trello, Google Drive, Excel, and WhatsApp). 

### Key Agency Bottlenecks:
- **Approval Deadlocks**: Creative deliverables get lost in long email chains and messaging apps without audit trails.
- **Scope Creep & SLA Violations**: Deliverables fall behind schedule without centralized SLA tracking.
- **Payment & Invoicing Fragmentation**: Invoices and monthly retainers are disconnected from production deliverables.
- **Client Confusion**: Brands lack a single dedicated portal to track deliverables, brand guidelines, and schedule calendars.

**SocialOps** solves this by unifying client onboarding, content production pipelines, real-time approval queues, team capacity forecasting, and automated invoicing into a single, cohesive, role-governed ERP workspace.

---

## 🚀 Key Features

- **Multi-Tenant Architecture**: Complete logical data isolation across agency clients, preventing unauthorized cross-brand access.
- **Standardized Multi-Platform Management**: Native support for exactly seven agency platforms:
  - Instagram, Facebook, YouTube, LinkedIn, WhatsApp Business, X (Twitter), and Pinterest.
- **Client Brand Profile & Guidelines**: Brand identity management covering colors (hex palettes), typography, audience persona, and industry classifications.
- **Production Content Pipeline**: Deliverables organized by Content Category (Promotional, Educational, Thought Leadership, etc.) with secure Google Drive cloud asset verification.
- **Client Approval & Revision Flow**: Single-click client sign-off with audit-logging compliance hashes, revision requests, and timestamped feedback threads.
- **Kanban Task Board & SLA Tracking**: Drag-and-drop status stages (`Backlog`, `In Progress`, `Review`, `Completed`) with urgent SLA countdown indicators.
- **Cross-Platform Content Calendar**: Dynamic interactive calendar with scheduling, reschedule modal capabilities, and month/week filters.
- **Financial Accounting Engine**: Retainer invoice generation with automated tax calculations, partial/full payment reconciliation, and agency expense tracking.
- **Capacity & Workload Analytics**: Operative utilization forecasting, preventing employee burnout through active task allocation metrics.
- **Bento Grid UX with Dark Theme**: Production SaaS visual hierarchy featuring glassmorphism, responsive Bento cards, sticky navigation, and high-contrast Dark Mode.

---

## 👥 Role-Based Access Control (RBAC) Matrix

SocialOps enforces strict three-tier authorization. Login requires an authentic `@gmail.com` address.

| Feature / Domain | Platform Admin | Agency Employee | Client Representative |
| :--- | :---: | :---: | :---: |
| **System Dashboard & KPIs** | Full Agency Scope | Assigned Tasks Scope | Client Scope Only |
| **Client Directory & Onboarding** | Read / Write / Create | Read Only | Own Profile Only |
| **Brand Profile Editor** | Read / Write | Read Only | Read / Write (Own Brand) |
| **Content Requests & Submissions** | Full Access | Submit & Edit Assets | View & Request Changes |
| **Client Approval Queue** | View All | View Deliverable | Review (Approve / Reject) |
| **Kanban Task Board** | Full Management | Drag / Update Tasks | Restricted (Deliverables Only) |
| **Content Publishing Calendar** | Full Agency Calendar | Workload Schedule | Brand Campaign Calendar |
| **Invoice Dispatch & Payment Log** | Full Accounting | Restricted | View & Download Invoices |
| **Agency Expense Tracking** | Read / Write | Submit Internal SaaS | Strictly Forbidden (403) |
| **Audit Logs & Security Stream** | View All System Logs | View Activity Stream | Strictly Forbidden (403) |

---

## 🛠️ Technology Stack

### Frontend Architecture
- **Framework**: [React.js](https://react.dev/) (v18.3)
- **Bundler & Tooling**: [Vite](https://vitejs.dev/) with Rolldown compiler
- **Routing**: [React Router](https://reactrouter.com/) (v6.28)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Styling**: Modern CSS3 Custom Tokens, Bento Grid System, Responsive Media Breakpoints, KaTeX typography support
- **State Architecture**: Reactive Context API (`AuthContext`, `AppDataContext`, `ThemeContext`)

### Backend Architecture
- **API Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Async ASGI)
- **Language**: Python 3.12
- **ORM & Data Modeling**: [SQLAlchemy](https://www.sqlalchemy.org/) 2.0 (Scoped sessions, declarative base)
- **Database Migrations**: [Alembic](https://alembic.sqlalchemy.org/)
- **Security & Cryptography**: Passlib (Bcrypt hashing), Python-Jose (JWT HS256 signatures)
- **Data Validation**: [Pydantic](https://docs.pydantic.dev/) v2 (Domain-specific schemas & sanitizers)

### Database Engine
- **RDBMS**: [MySQL](https://www.mysql.com/) 8.0+
- **Driver**: PyMySQL / Cryptography

---

## 📂 Project Directory Structure

```text
SocialOps/
├── backend/
│   ├── alembic/                 # Alembic migration environment and versions
│   │   └── versions/            # 7 versioned schema migration scripts
│   ├── app/
│   │   ├── api/v1/              # Versioned API REST routes
│   │   │   ├── endpoints/       # auth, clients, tasks, content, approvals, finance, etc.
│   │   │   └── router.py        # Centralized v1 routing manifest
│   │   ├── core/                # JWT security, config, validation, platform normalization
│   │   ├── db/                  # SessionLocal, Engine, and Base declarations
│   │   ├── models/              # SQLAlchemy relational models (ISA inheritance)
│   │   ├── schemas/             # Pydantic validation request/response schemas
│   │   └── main.py              # FastAPI application bootstrap & CORS
│   ├── scripts/                 # Database initialization and seed scripts
│   ├── tests/                   # 8 Pytest suites covering unit, integration, and E2E
│   └── requirements.txt         # Pinned Python package dependencies
├── public/                      # Static assets, branding logo, and favicon
├── src/
│   ├── api/                     # Axios API service integrations
│   ├── assets/                  # High-resolution vector and raster assets
│   ├── components/
│   │   ├── common/              # Modal, PageHeader, EmptyState, GoogleDriveLink
│   │   └── layout/              # AppLayout, Sticky Sidebar, Header, Notification Drawer
│   ├── constants/               # Standardized platform definitions (Instagram, Facebook...)
│   ├── context/                 # AuthContext, AppDataContext, ThemeContext
│   ├── pages/                   # Dashboard, Kanban, Calendar, Clients, Invoices, etc.
│   ├── App.jsx                  # Main application routing and route guards
│   ├── index.css                # Global design system tokens and Bento styles
│   └── main.jsx                 # React root injection point
├── docs/
│   └── architecture.md          # Architectural blueprints and Mermaid sequence diagrams
├── CONTRIBUTING.md              # Open-source contribution and pull-request guide
├── LICENSE                      # MIT Open Source License
├── package.json                 # Node dependencies and build scripts
└── vite.config.js               # Vite frontend configuration
```

---

## ⚡ Getting Started & Installation

### Prerequisites
1. **Node.js**: v18.0 or higher
2. **Python**: v3.11 or v3.12
3. **MySQL Server**: Running on `localhost:3306`

---

### Step 1: Clone Repository
```bash
git clone https://github.com/Pratham09exe/SocialOps.git
cd SocialOps
```

---

### Step 2: Database Setup
Log into your local MySQL CLI and create the database:
```sql
CREATE DATABASE socialops CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

### Step 3: Backend Setup (FastAPI)
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell)
   python -m venv .venv
   .venv\Scripts\Activate.ps1

   # macOS / Linux
   python3 -m venv .venv
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables:
   ```bash
   copy .env.example .env
   ```
   *Edit `.env` to match your MySQL database username and password.*
5. Run database migrations:
   ```bash
   alembic upgrade head
   ```
6. Start the FastAPI development server:
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   *Backend will run at: `http://localhost:8000` (API Docs at `http://localhost:8000/docs`)*

---

### Step 4: Frontend Setup (React + Vite)
1. Open a new terminal and navigate to the project root:
   ```bash
   cd SocialOps
   ```
2. Configure frontend environment variables:
   ```bash
   copy .env.example .env
   ```
3. Install packages:
   ```bash
   npm install
   ```
4. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   *Frontend will launch at: `http://localhost:5173`*

---

## 🧪 Testing & Verification

SocialOps includes a comprehensive test suite covering authentication, RBAC boundaries, object-level tenant isolation, platform validation, and financial calculations:

```bash
# Run backend test suite
cd backend
python -m pytest tests -v
```

### Test Suite Results:
```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-8.3.4
rootdir: D:\SocialOps\backend
collected 83 items

backend\tests\test_auth.py (12 tests) ............................ PASSED [14%]
backend\tests\test_clients_employees.py (9 tests) ................ PASSED [25%]
backend\tests\test_content_approvals.py (12 tests) ............... PASSED [39%]
backend\tests\test_e2e_integration.py (7 tests) .................. PASSED [48%]
backend\tests\test_finance.py (13 tests) ......................... PASSED [63%]
backend\tests\test_notifications_activity.py (12 tests) .......... PASSED [78%]
backend\tests\test_standardized_platforms.py (6 tests) ........... PASSED [85%]
backend\tests\test_tasks.py (12 tests) ........................... PASSED [100%]

====================== 83 passed in 22.35s (100% Pass Rate) ===================
```

---

## 🔐 Default Demo Accounts

| Role | Email Address | Password |
| :--- | :--- | :--- |
| **Admin** | `prathameshnehere@gmail.com` | `Admin@123` |
| **Employee** | `sahilmahale@gmail.com` | `Admin@123` |
| **Client** | `saichakankar@gmail.com` | `Admin@123` |

---

## 🔮 Future Enhancements
- [ ] Direct Social Media OAuth 2.0 auto-publishing (Instagram Graph API, LinkedIn Community API).
- [ ] AI-assisted automated caption and hashtag generation via Gemini 2.0 Flash SDK.
- [ ] Automated PDF invoice generation and Stripe Checkout webhooks.
- [ ] Multi-language content localization support.

---

## 👨‍💻 Author & Maintainer

**Prathamesh Nehere**
- GitHub: [@Pratham09exe](https://github.com/Pratham09exe)
- Email: `prathamesh.nehere9716@gmail.com`

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for complete details.
