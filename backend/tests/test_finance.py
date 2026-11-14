from datetime import date, timedelta
from decimal import Decimal
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_auth_token(email: str, password: str) -> str:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    return response.json()["access_token"]


# =============================================================
# INVOICE CREATION & DECIMAL CALCULATION TESTS
# =============================================================

def test_admin_can_create_invoice():
    admin_token = get_auth_token("prathameshnehere@gmail.com", "Admin@123")
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Fetch a client ID (Kinetix Logistics)
    clients_res = client.get("/api/v1/clients", headers=headers)
    assert clients_res.status_code == 200
    kinetix = next((c for c in clients_res.json() if "Kinetix" in c["business_name"]), clients_res.json()[0])

    payload = {
        "client_account_id": kinetix["account_id"],
        "subtotal": "10000.00",
        "tax_percent": "10.00",
        "due_date": (date.today() + timedelta(days=14)).isoformat(),
        "payment_method": "Stripe ACH",
        "notes": "Q4 Performance Marketing Retainer"
    }

    res = client.post("/api/v1/invoices", json=payload, headers=headers)
    assert res.status_code == 201
    data = res.json()

    assert data["client_account_id"] == kinetix["account_id"]
    assert Decimal(str(data["subtotal"])) == Decimal("10000.00")
    assert Decimal(str(data["tax_percent"])) == Decimal("10.00")
    assert Decimal(str(data["tax_amount"])) == Decimal("1000.00")
    assert Decimal(str(data["total_amount"])) == Decimal("11000.00")
    assert Decimal(str(data["paid_amount"])) == Decimal("0.00")
    assert Decimal(str(data["balance_due"])) == Decimal("11000.00")
    assert data["status"] == "Pending"
    assert "INV-" in data["invoice_number"]


def test_employee_and_client_cannot_create_invoice():
    emp_token = get_auth_token("sahilmahale@gmail.com", "Admin@123")
    client_token = get_auth_token("saichakankar@gmail.com", "Admin@123")

    payload = {
        "client_account_id": 1,
        "subtotal": "5000.00",
        "tax_percent": "0.00",
        "due_date": (date.today() + timedelta(days=14)).isoformat()
    }

    # Employee rejected
    res_emp = client.post("/api/v1/invoices", json=payload, headers={"Authorization": f"Bearer {emp_token}"})
    assert res_emp.status_code == 403

    # Client rejected
    res_cli = client.post("/api/v1/invoices", json=payload, headers={"Authorization": f"Bearer {client_token}"})
    assert res_cli.status_code == 403


def test_invalid_invoice_rejected():
    admin_token = get_auth_token("prathameshnehere@gmail.com", "Admin@123")
    headers = {"Authorization": f"Bearer {admin_token}"}

    clients_res = client.get("/api/v1/clients", headers=headers)
    assert clients_res.status_code == 200
    valid_client_id = clients_res.json()[0]["account_id"]

    # Negative subtotal
    res_neg = client.post("/api/v1/invoices", json={
        "client_account_id": valid_client_id,
        "subtotal": "-500.00",
        "due_date": (date.today() + timedelta(days=14)).isoformat()
    }, headers=headers)
    assert res_neg.status_code == 422

    # Negative tax
    res_tax = client.post("/api/v1/invoices", json={
        "client_account_id": valid_client_id,
        "subtotal": "500.00",
        "tax_percent": "-5.00",
        "due_date": (date.today() + timedelta(days=14)).isoformat()
    }, headers=headers)
    assert res_tax.status_code == 422

    # Due date before issue date
    res_date = client.post("/api/v1/invoices", json={
        "client_account_id": valid_client_id,
        "subtotal": "500.00",
        "issue_date": date.today().isoformat(),
        "due_date": (date.today() - timedelta(days=5)).isoformat()
    }, headers=headers)
    assert res_date.status_code == 400


# =============================================================
# OBJECT-LEVEL AUTHORIZATION & CLIENT ISOLATION
# =============================================================

def test_client_can_view_own_invoices_only():
    # Marcus Vance is client for Kinetix Logistics
    client_token = get_auth_token("saichakankar@gmail.com", "Admin@123")
    headers = {"Authorization": f"Bearer {client_token}"}

    res = client.get("/api/v1/invoices", headers=headers)
    assert res.status_code == 200
    invoices = res.json()
    assert len(invoices) >= 1
    # Every returned invoice must belong to Kinetix Logistics
    for inv in invoices:
        assert inv["client_name"] == "Chakankar Digital Innovations"


def test_client_cannot_access_other_client_invoice():
    client_token = get_auth_token("saichakankar@gmail.com", "Admin@123")
    
    # Client attempts to read non-existent or other client invoice
    res = client.get("/api/v1/invoices/99999", headers={"Authorization": f"Bearer {client_token}"})
    assert res.status_code in [403, 404]


def test_client_cannot_spoof_client_filter():
    client_token = get_auth_token("saichakankar@gmail.com", "Admin@123")
    headers = {"Authorization": f"Bearer {client_token}"}

    # Requesting another client_id in query param
    res = client.get("/api/v1/invoices?client_id=9999", headers=headers)
    assert res.status_code == 403


# =============================================================
# PAYMENT PROCESSING & BALANCE RECONCILIATION
# =============================================================

def test_partial_and_full_payment_reconciliation():
    admin_token = get_auth_token("prathameshnehere@gmail.com", "Admin@123")
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Create a fresh invoice of $5,000.00
    clients_res = client.get("/api/v1/clients", headers=headers)
    kinetix = next((c for c in clients_res.json() if "Kinetix" in c["business_name"]), clients_res.json()[0])

    inv_res = client.post("/api/v1/invoices", json={
        "client_account_id": kinetix["account_id"],
        "subtotal": "5000.00",
        "tax_percent": "0.00",
        "due_date": (date.today() + timedelta(days=30)).isoformat(),
        "payment_method": "Wire Transfer"
    }, headers=headers)
    assert inv_res.status_code == 201
    inv = inv_res.json()
    inv_id = inv["invoice_id"]
    assert Decimal(str(inv["balance_due"])) == Decimal("5000.00")
    assert inv["status"] == "Pending"

    # 2. Record partial payment of $2,000.00
    pay1_res = client.post(f"/api/v1/invoices/{inv_id}/payments", json={
        "amount": "2000.00",
        "payment_method": "Wire Transfer",
        "transaction_reference": f"WIRE-PARTIAL-{inv_id}",
        "notes": "First milestone deposit 40%"
    }, headers=headers)
    assert pay1_res.status_code == 201
    pay1 = pay1_res.json()
    assert Decimal(str(pay1["amount"])) == Decimal("2000.00")

    # Verify invoice status is now Partially Paid with remaining $3,000.00 balance
    inv_after_p1 = client.get(f"/api/v1/invoices/{inv_id}", headers=headers).json()
    assert Decimal(str(inv_after_p1["paid_amount"])) == Decimal("2000.00")
    assert Decimal(str(inv_after_p1["balance_due"])) == Decimal("3000.00")
    assert inv_after_p1["status"] == "Partially Paid"

    # 3. Attempt overpayment of $3,500.00 (exceeds $3,000 balance) -> must be rejected
    overpay_res = client.post(f"/api/v1/invoices/{inv_id}/payments", json={
        "amount": "3500.00",
        "payment_method": "Wire Transfer"
    }, headers=headers)
    assert overpay_res.status_code == 400
    assert "exceeds remaining balance" in overpay_res.json()["detail"].lower()

    # 4. Record remaining $3,000.00 payment -> full settlement
    pay2_res = client.post(f"/api/v1/invoices/{inv_id}/payments", json={
        "amount": "3000.00",
        "payment_method": "Wire Transfer",
        "transaction_reference": f"WIRE-FINAL-{inv_id}",
        "notes": "Final settlement disbursement"
    }, headers=headers)
    assert pay2_res.status_code == 201

    # Verify invoice is now Paid with $0.00 balance
    inv_final = client.get(f"/api/v1/invoices/{inv_id}", headers=headers).json()
    assert Decimal(str(inv_final["paid_amount"])) == Decimal("5000.00")
    assert Decimal(str(inv_final["balance_due"])) == Decimal("0.00")
    assert inv_final["status"] == "Paid"


def test_client_cannot_record_payment():
    client_token = get_auth_token("saichakankar@gmail.com", "Admin@123")
    res = client.post("/api/v1/invoices/1/payments", json={
        "amount": "100.00",
        "payment_method": "Stripe ACH"
    }, headers={"Authorization": f"Bearer {client_token}"})
    assert res.status_code == 403


def test_client_cannot_access_other_client_payments():
    client_token = get_auth_token("saichakankar@gmail.com", "Admin@123")
    res = client.get("/api/v1/invoices/99999/payments", headers={"Authorization": f"Bearer {client_token}"})
    assert res.status_code in [403, 404]


# =============================================================
# EXPENSE SECURITY & CLIENT STRICT PROHIBITION
# =============================================================

def test_client_is_forbidden_from_all_expense_endpoints():
    client_token = get_auth_token("saichakankar@gmail.com", "Admin@123")
    headers = {"Authorization": f"Bearer {client_token}"}

    # GET /expenses
    assert client.get("/api/v1/expenses", headers=headers).status_code == 403

    # POST /expenses
    assert client.post("/api/v1/expenses", json={
        "description": "Attempted Client Expense",
        "amount": "100.00",
        "category": "Software"
    }, headers=headers).status_code == 403

    # GET /expenses/{id}
    assert client.get("/api/v1/expenses/1", headers=headers).status_code == 403

    # GET /expenses/summary/metrics
    assert client.get("/api/v1/expenses/summary/metrics", headers=headers).status_code == 403


def test_admin_and_employee_can_manage_expenses():
    emp_token = get_auth_token("sahilmahale@gmail.com", "Admin@123")
    emp_headers = {"Authorization": f"Bearer {emp_token}"}

    # Employee logs an operational SaaS expense
    res = client.post("/api/v1/expenses", json={
        "category": "Software",
        "description": "Cinema 4D Studio Team License",
        "details": "Sub-acct #7719 • Motion graphics render farm",
        "amount": "890.00",
        "payment_method": "Amex Corp •• 4910",
        "receipt_url": "c4d_license_q4.pdf"
    }, headers=emp_headers)
    assert res.status_code == 201
    exp = res.json()
    assert exp["category"] == "Software"
    assert Decimal(str(exp["amount"])) == Decimal("890.00")
    assert exp["created_by_name"] == "Sahil Mahale"
    assert exp["client_name"] == "Agency Internal"

    # Employee updates details
    exp_id = exp["expense_id"]
    patch_res = client.patch(f"/api/v1/expenses/{exp_id}", json={
        "details": "Sub-acct #7719 • 3 Active GPU Nodes"
    }, headers=emp_headers)
    assert patch_res.status_code == 200
    assert "GPU Nodes" in patch_res.json()["details"]


def test_invalid_expense_amount_rejected():
    emp_token = get_auth_token("sahilmahale@gmail.com", "Admin@123")
    headers = {"Authorization": f"Bearer {emp_token}"}

    res_zero = client.post("/api/v1/expenses", json={
        "category": "Software",
        "description": "Zero cost item",
        "amount": "0.00"
    }, headers=headers)
    assert res_zero.status_code == 422

    res_neg = client.post("/api/v1/expenses", json={
        "category": "Software",
        "description": "Negative cost item",
        "amount": "-50.00"
    }, headers=headers)
    assert res_neg.status_code == 422


# =============================================================
# FINANCE SUMMARY & KPI METRICS
# =============================================================

def test_finance_summary_metrics_authorized():
    admin_token = get_auth_token("prathameshnehere@gmail.com", "Admin@123")
    res = client.get("/api/v1/invoices/summary/metrics", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    metrics = res.json()

    assert "total_billed" in metrics
    assert "total_collected" in metrics
    assert "outstanding_receivables" in metrics
    assert "overdue_amount" in metrics
    assert "overdue_invoices_count" in metrics

    assert Decimal(str(metrics["total_billed"])) > 0
    assert Decimal(str(metrics["total_collected"])) > 0
    assert Decimal(str(metrics["outstanding_receivables"])) >= 0
    assert metrics["overdue_invoices_count"] >= 0
