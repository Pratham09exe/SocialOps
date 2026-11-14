# Contributing to SocialOps

Thank you for your interest in contributing to **SocialOps – Social Media Agency Management System**! This document outlines our workflow, code guidelines, and development process.

---

## Code of Conduct

Please help us maintain a collaborative, respectful, and inclusive environment. All contributors are expected to uphold respectful communication and professional conduct.

---

## Getting Started

### 1. Prerequisites
- **Node.js**: v18.x or later (v20+ recommended)
- **Python**: v3.11 or later (v3.12 verified)
- **MySQL Server**: v8.0+
- **Git**

### 2. Fork and Clone
```bash
# Clone the repository
git clone https://github.com/Pratham09exe/SocialOps.git
cd SocialOps
```

### 3. Environment Setup
Create environment files from templates:
```bash
# Frontend environment
copy .env.example .env

# Backend environment
copy backend\.env.example backend\.env
```

Install dependencies:
```bash
# Install frontend packages
npm install

# Install backend dependencies
cd backend
pip install -r requirements.txt
cd ..
```

---

## Development Workflow

### Branch Naming Conventions
Follow standard conventional branch names:
- `feat/feature-name` – Net new capabilities or user-facing changes
- `fix/bug-fix` – Bug fixes or patching unintended behavior
- `refactor/code-cleanup` – Architectural or refactoring changes
- `docs/doc-updates` – Updates to README or documentation
- `test/test-suite` – Adding or improving automated tests

### Conventional Commit Guidelines
We enforce structured, human-readable commit messages:
```text
<type>(<scope>): <short imperative summary>

[optional body]
```

**Allowed types:**
- `feat`: Net new feature
- `fix`: Bug fix
- `docs`: Documentation updates
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code refactoring without behavior change
- `perf`: Performance improvements
- `test`: Adding or refactoring test cases
- `chore`: Build scripts, dependencies, tooling

---

## Testing & Quality Standards

Before submitting any Pull Request, ensure that:

1. **Frontend Builds Without Errors:**
   ```bash
   npm run build
   ```

2. **Backend Automated Tests Pass:**
   ```bash
   python -m pytest backend/tests -v
   ```

3. **No Secrets Are Committed:**
   - Never commit real `.env` files, production credentials, or personal API keys.
   - Use `.env.example` placeholders for any newly introduced environment variables.

---

## Submitting Pull Requests

1. Push your branch to your fork:
   ```bash
   git push origin feat/your-feature-name
   ```
2. Open a Pull Request against the `main` branch.
3. Provide a clear PR description detailing:
   - What changes were made
   - Why the change was needed
   - How the changes were tested (including screenshots for UI updates)

Thank you for contributing to SocialOps!
