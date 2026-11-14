# SocialOps — QA & Automated Test Suite Architecture

Automated testing framework for the SocialOps application, powered by **Testim.io cloud automation** with bi-directional local tunneling.

---

## 📁 Directory Structure

```text
tests/
└── testim/                       # Testim.io Cloud Automation Suite
    ├── config/
    │   └── testim.config.js      # Project credentials & tunnel configuration
    ├── definitions/              # Modular JSON test case definitions (31 tests)
    │   ├── 01_auth_and_rbac.json # Multi-persona authentication & RBAC
    │   ├── 02_client_management.json # Client directory & Rupee retainer
    │   ├── 03_employee_workload.json # Staff capacity & ₹/hr rates
    │   ├── 04_task_kanban_management.json # 4-stage Kanban workflow
    │   ├── 05_content_management_uploads.json # Google Drive proofs & 7 canonical platforms
    │   ├── 06_content_approval_workflow.json # Review, sign-off & revisions
    │   ├── 07_payment_and_finance.json # Invoices & Expenses in Indian Rupees
    │   ├── 08_navigation_and_forms.json # Activity stream, alerts & forms
    │   ├── 09_api_functionality.json # Backend REST endpoints
    │   └── 10_negative_and_error_handling.json # Security, XSS & SQLi resilience
    ├── reports/                  # Execution outputs & JUnit XML
    │   ├── test-results.xml      # Standard JUnit XML report
    │   ├── results.json          # Execution metrics
    │   ├── TEST_SUMMARY.md       # Executive summary
    │   └── SOCIALOPS_TEST_REPAIR_REPORT.md # Root cause & repair audit
    └── runner/
        └── testim-runner.js      # Node.js CLI execution driver
```

---

## 🧪 Running the Tests

### Execute the Testim.io Automated Suite
```bash
npm run test:testim
```

Or execute directly via the Testim CLI with the active secure tunnel:
```bash
npx testim --token "<TESTIM_TOKEN>" --project "usw24R6pnE3OMtY5aq0fVuYs" --grid "Testim-HA-Grid" --tunnel --tunnel-port 5173 --report-file tests/testim/reports/test-results.xml
```

### Generated Reports
After execution, results are stored in [`tests/testim/reports/`](file:///d:/SocialOps/tests/testim/reports/):
- **JUnit XML**: [`test-results.xml`](file:///d:/SocialOps/tests/testim/reports/test-results.xml)
- **Execution Metrics**: [`results.json`](file:///d:/SocialOps/tests/testim/reports/results.json)
- **Detailed Audit**: [`SOCIALOPS_TEST_REPAIR_REPORT.md`](file:///d:/SocialOps/tests/testim/reports/SOCIALOPS_TEST_REPAIR_REPORT.md)
