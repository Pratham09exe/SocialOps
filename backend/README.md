# SocialOps — Backend Architecture & Service Guide

FastAPI-powered REST API backend for the **SocialOps Social Media Agency Operations** platform.

---

## 🏗️ Directory Structure

```text
backend/
├── alembic/              # Database migration scripts & environment
│   └── versions/         # Versioned schema migrations
├── app/                  # Main application package
│   ├── api/              # API route definitions
│   │   └── v1/           # Version 1 endpoints (auth, clients, tasks, etc.)
│   ├── core/             # Core configurations, security, events & JWT
│   ├── db/               # SQLAlchemy engine, session management & base
│   ├── models/           # SQLAlchemy ORM entity models
│   ├── schemas/          # Pydantic v2 validation & response schemas
│   └── main.py           # FastAPI entrypoint application instance
├── scripts/              # Database seeding & utility scripts
│   └── seed_initial_data.py # Seeds demo agency clients, staff, and tasks
├── tests/                # Automated backend test suite
│   ├── conftest.py       # Pytest test fixtures
│   └── test_*.py         # Unit & integration test modules
├── .env.example          # Environment variable template
├── alembic.ini           # Alembic migration configuration
├── pytest.ini            # Pytest test runner configuration
└── requirements.txt      # Python dependencies
```

---

## 🚀 Setup & Execution

### 1. Prerequisites

- Python 3.12+
- MySQL 8.0 running locally on port 3306

### 2. Virtual Environment & Dependencies

```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# Install dependencies:
pip install -r requirements.txt
```

### 3. Environment Configuration

Copy `.env.example` to `.env` and verify database credentials:

```bash
cp .env.example .env
```

Default connection string:

```env
DATABASE_URL=mysql+pymysql://root:password@127.0.0.1:3306/socialops
SECRET_KEY=your-super-secret-key-32-chars-minimum
ACCESS_TOKEN_EXPIRE_MINUTES=480
```

### 4. Database Migrations & Seeding

```bash
# Run migrations:
alembic upgrade head

# Seed demo agency data:
python scripts/seed_initial_data.py
```

### 5. Start the Server

```bash
uvicorn app.main:app --reload --port 8000
```

- API Base URL: `http://127.0.0.1:8000/api/v1`
- Interactive Swagger Docs: `http://127.0.0.1:8000/docs`
- Redoc Documentation: `http://127.0.0.1:8000/redoc`

### 6. Run Automated Tests

```bash
pytest
```
