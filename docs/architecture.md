# SocialOps Architecture & System Design

This document details the architectural layout, entity models, security model, and primary business workflows of **SocialOps – Social Media Agency Management System**.

---

## 1. High-Level System Architecture

SocialOps is designed with a decoupled client-server architecture:

```mermaid
graph TD
    subgraph Client["Frontend Client (React.js + Vite)"]
        UI[Bento Grid & Responsive Dashboard]
        AuthCtx[Auth Context & JWT Storage]
        AppCtx[AppData Context & State Cache]
        APIClient[Axios HTTP Client / Interceptors]
    end

    subgraph Server["FastAPI Application Server"]
        Router["API Gateway / v1 Routers"]
        AuthMiddleware["JWT Authentication & RBAC Gatekeeper"]
        DomainEndpoints["Endpoints: Auth, Clients, Tasks, Content, Approvals, Finance"]
        Services["Business Logic & Validation Layer"]
        ORM["SQLAlchemy ORM (Scoped Sessions)"]
    end

    subgraph Data["Persistence & Storage"]
        MySQL[(MySQL 8.0 Relational Database)]
        Alembic["Alembic Migration Engine"]
        CloudStorage["External Assets (Google Drive / CDN)"]
    end

    UI --> AuthCtx
    UI --> AppCtx
    AppCtx --> APIClient
    APIClient -->|HTTPS / Bearer JWT| Router
    Router --> AuthMiddleware
    AuthMiddleware --> DomainEndpoints
    DomainEndpoints --> Services
    Services --> ORM
    ORM --> MySQL
    Services -.-> CloudStorage
    Alembic -.->|Schema Versioning| MySQL
```

---

## 2. Authentication & Role-Based Access Control (RBAC)

### Multi-Tenancy & User Roles
SocialOps enforces strict three-tier role-based access control with Gmail domain verification:

| Role | Permissions & Boundaries |
| :--- | :--- |
| **Admin** | Full system visibility; manages agency employees, onboarded clients, service packages, deliverable templates, invoice dispatch, and financial metrics. |
| **Employee** | Creative production visibility; assigned deliverables, cross-client task boards, Google Drive asset submission, and internal operational expense logging. |
| **Client** | Strictly isolated tenant boundary; views assigned deliverables, brand profile guidelines, calendar schedules, reviews/approves content, and pays invoices. |

### Authentication Lifecycle
```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser
    participant FE as React Frontend
    participant API as FastAPI /api/v1/auth
    participant DB as MySQL Database

    User->>FE: Enter Gmail Address & Password
    FE->>API: POST /login {email, password}
    API->>API: Validate email ends with @gmail.com
    API->>DB: Query account by email
    DB-->>API: Return account + password_hash + role
    API->>API: Verify Bcrypt password hash
    API->>API: Mint HS256 JWT (Claims: sub, role, account_id)
    API-->>FE: Return access_token + user metadata
    FE->>FE: Persist token in secure session state
    FE->>User: Route to role-specific dashboard
```

---

## 3. Database Entity Relationship Diagram (ERD)

The database schema models an agency ecosystem with table inheritance (ISA specialization for Account roles) and multi-tenant scoping:

```mermaid
erDiagram
    ACCOUNTS ||--o| ADMINS : specializes
    ACCOUNTS ||--o| EMPLOYEES : specializes
    ACCOUNTS ||--o| CLIENTS : specializes
    
    CLIENTS ||--o{ CLIENT_SOCIAL_ACCOUNTS : owns
    CLIENTS ||--o{ CLIENT_PACKAGE_ASSIGNMENTS : assigned
    CLIENTS ||--o{ CONTENT_PLANS : holds
    CLIENTS ||--o{ CONTENT_ITEMS : provisions
    CLIENTS ||--o{ INVOICES : billed_to
    CLIENTS ||--o{ TASKS : targets
    
    CONTENT_PLANS ||--o{ CONTENT_TARGETS : defines
    CONTENT_ITEMS ||--o{ APPROVALS : requires
    CONTENT_ITEMS ||--o{ CLIENT_FEEDBACK : receives
    CONTENT_ITEMS ||--o{ ATTACHMENTS : includes
    
    INVOICES ||--o{ PAYMENTS : reconciled_by
    ACCOUNTS ||--o{ EXPENSES : logs
    ACCOUNTS ||--o{ ACTIVITY_LOGS : records
    ACCOUNTS ||--o{ NOTIFICATIONS : receives
```

---

## 4. Core Business Workflows

### A. Content Production & Client Approval Pipeline
1. **Creation**: Content item is scheduled in a Campaign Deliverable by Admin or Employee.
2. **Production**: Assigned employee creates visual or copy assets and attaches a validated Google Drive URL.
3. **Queue Ingestion**: The system automatically moves the item to the client's `Approval Queue` with a verification compliance hash.
4. **Client Review**: Client reviews the deliverable:
   - **Approve**: Deliverable is marked `Approved`, scheduled for publishing on the calendar, and an activity log is written.
   - **Request Revision**: Client inputs feedback comments; item moves back to `Needs Changes` state, alerting the assigned employee.

### B. Financial Operations & Payment Reconciliation
1. **Invoice Generation**: Admin dispatches an itemized invoice for monthly retainer deliverables with automatic subtotal, tax, and total computation.
2. **Client Notification**: Client receives real-time notification with balance due and payment due date.
3. **Reconciliation**: When payments (credit card, wire, or bank ACH) are recorded, the invoice's `paid_amount` and `balance_due` are recalculated in real time. Upon zero balance, invoice status transitions to `Paid`.

---

## 5. Security & Isolation Architecture

- **Domain Whitelist**: Only `@gmail.com` addresses are permitted across registration and authentication.
- **Tenant Isolation**: Every client-scoped query strictly filters by `client_account_id == current_user.account_id`, preventing cross-client data leaks.
- **Audit Logging**: Sensitive mutations (role alterations, payment recordings, approvals) automatically write tamper-evident records to `activity_logs`.
- **Sensitive Data Scrubbing**: Database passwords and JWT signing keys are managed exclusively via environment variables and excluded from version control.
