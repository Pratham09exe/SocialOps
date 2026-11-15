"""
SocialOps — Phase 7: End-to-End System Integration and Security Test Suite

Tests complete multi-role business journeys across:
1. Client Onboarding and Multi-Tenant Isolation
2. Employee Management, Task Assignment, and Workload Balancing
3. Content Staging with Google Drive URL, Review Cycles, and Feedback
4. Finance Lifecycle (Invoices, Partial Payments, Settlement, Expenses)
5. Notification Security, Read Receipts, and Cross-User Isolation
6. Monthly Analytics Reporting and Client Data Isolation
7. Security Verification (JWT validation, Role authorization, ID tampering)
"""

from datetime import date, timedelta
from decimal import Decimal
import time
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def get_auth_token(email: str, password: str) -> str:
    """Helper to authenticate and retrieve a bearer token."""
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, f"Login failed for {email}: {response.text}"
    return response.json()["access_token"]


# ============================================================================
# 1. CLIENT ONBOARDING AND MULTI-TENANT ISOLATION
# ============================================================================

def test_e2e_client_onboarding_and_isolation():
    admin_token = get_auth_token("prathameshnehere@gmail.com", "Admin@123")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    timestamp = int(time.time())
    new_client_email = f"onboard_{timestamp}@gmail.com"
    new_client_username = f"nebula_{timestamp}"
    new_client_password = "ClientPass2026!#"

    new_client_id = None
    try:
        # Step 1: Admin provisions client account
        create_payload = {
            "email": new_client_email,
            "username": new_client_username,
            "password": new_client_password,
            "business_name": f"Nebula AI Labs {timestamp}",
            "industry": "IT / Software / Technology",
            "contact_person": "Dr. Sarah Chen",
            "tier": "Growth",
            "agreed_monthly_price": 18500.00
        }
        create_res = client.post("/api/v1/clients", json=create_payload, headers=admin_headers)
        assert create_res.status_code == 201
        created_client_data = create_res.json()
        new_client_id = created_client_data["account_id"]
        assert created_client_data["business_name"] == f"Nebula AI Labs {timestamp}"

        # Step 2: New client authenticates
        client_token = get_auth_token(new_client_email, new_client_password)
        client_headers = {"Authorization": f"Bearer {client_token}"}

        # Step 3: Client retrieves client directory — MUST ONLY see their own profile
        get_res = client.get("/api/v1/clients", headers=client_headers)
        assert get_res.status_code == 200
        visible_clients = get_res.json()
        assert len(visible_clients) == 1
        assert visible_clients[0]["account_id"] == new_client_id
        assert visible_clients[0]["business_name"] == f"Nebula AI Labs {timestamp}"

        # Step 4: Client is strictly forbidden from accessing internal employee roster
        emp_res = client.get("/api/v1/employees", headers=client_headers)
        assert emp_res.status_code == 403

        # Step 5: Client is strictly forbidden from viewing agency internal expenses
        exp_res = client.get("/api/v1/expenses", headers=client_headers)
        assert exp_res.status_code == 403
    finally:
        if new_client_id:
            from app.db.session import SessionLocal
            from app.models.account import Account
            db = SessionLocal()
            try:
                acc = db.query(Account).filter(Account.account_id == new_client_id).first()
                if acc:
                    db.delete(acc)
                    db.commit()
            finally:
                db.close()


# ============================================================================
# 2. EMPLOYEE MANAGEMENT, TASK DELEGATION & WORKLOAD RECALCULATION
# ============================================================================

def test_e2e_employee_lifecycle_and_task_delegation():
    admin_token = get_auth_token("prathameshnehere@gmail.com", "Admin@123")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    timestamp = int(time.time())
    emp_email = f"staff_{timestamp}@gmail.com"
    emp_username = f"staff_{timestamp}"
    emp_password = "StaffSecure2026!#"

    new_emp_id = None
    task_id = None
    try:
        # Step 1: Admin provisions employee
        emp_payload = {
            "email": emp_email,
            "username": emp_username,
            "password": emp_password,
            "full_name": f"Kiran Patel {timestamp}",
            "phone": "+1-555-0199",
            "joining_date": date.today().isoformat(),
            "department": "Video Production",
            "job_title": "Motion Graphics Lead",
            "access_level": "standard",
            "billable_rate": 145.00,
            "max_weekly_hours": 40
        }
        create_res = client.post("/api/v1/employees", json=emp_payload, headers=admin_headers)
        assert create_res.status_code == 201
        emp_data = create_res.json()
        new_emp_id = emp_data["account_id"]

        # Step 2: Employee logs in
        emp_token = get_auth_token(emp_email, emp_password)
        emp_headers = {"Authorization": f"Bearer {emp_token}"}

        # Step 3: Admin delegates a task to this new employee
        task_payload = {
            "title": f"Q4 Showreel 3D VFX #{timestamp}",
            "description": "Render 4K typography and 3D product transitions",
            "client": "Monolith AI",
            "assigned_employee_id": new_emp_id,
            "priority": "High",
            "stage": "To Do",
            "estimated_hours": 12.50,
            "due_date": (date.today() + timedelta(days=4)).isoformat()
        }
        task_res = client.post("/api/v1/tasks", json=task_payload, headers=admin_headers)
        assert task_res.status_code == 201
        task_id = task_res.json()["task_id"]

        # Step 4: Employee inspects their notifications — verifies TASK_ASSIGNED was received
        notif_res = client.get("/api/v1/notifications", headers=emp_headers)
        assert notif_res.status_code == 200
        emp_notifications = notif_res.json()["notifications"]
        assert any(n["entity_id"] == task_id and n["event_type"] == "TASK_ASSIGNED" for n in emp_notifications)

        # Step 5: Employee updates task progress to "In Progress"
        update_res = client.patch(f"/api/v1/tasks/{task_id}", json={"stage": "In Progress"}, headers=emp_headers)
        assert update_res.status_code == 200
        assert update_res.json()["status"] == "In Progress"

        # Step 6: Verify agency workload metrics include the allocated hours
        workload_res = client.get("/api/v1/workload", headers=admin_headers)
        assert workload_res.status_code == 200
        workload_data = workload_res.json()
        target_emp_workload = next((e for e in workload_data["operatives"] if e["employee_id"] == new_emp_id), None)
        assert target_emp_workload is not None
        assert target_emp_workload["allocatedHours"] >= 12.50
    finally:
        from app.db.session import SessionLocal
        from app.models.account import Account
        from app.models.task import Task
        db = SessionLocal()
        try:
            if task_id:
                t_obj = db.query(Task).filter(Task.task_id == task_id).first()
                if t_obj:
                    db.delete(t_obj)
            if new_emp_id:
                acc_obj = db.query(Account).filter(Account.account_id == new_emp_id).first()
                if acc_obj:
                    db.delete(acc_obj)
            db.commit()
        finally:
            db.close()


# ============================================================================
# 3. CONTENT APPROVAL WORKFLOW WITH GOOGLE DRIVE PROOF
# ============================================================================

def test_e2e_content_submission_and_client_approval_workflow():
    emp_token = get_auth_token("sahilmahale@gmail.com", "Admin@123")
    emp_headers = {"Authorization": f"Bearer {emp_token}"}
    client_token = get_auth_token("saichakankar@gmail.com", "Admin@123")
    client_headers = {"Authorization": f"Bearer {client_token}"}

    timestamp = int(time.time())
    drive_proof_url = f"https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74{timestamp}/view"

    # Step 1: Employee submits deliverable with Google Drive link
    sub_payload = {
        "title": f"Autumn Hero Spot Reel #{timestamp}",
        "client": "Monolith AI",
        "target_platform": "Instagram Reel 9:16",
        "platform": "Instagram",
        "caption": "Accelerate generative intelligence workflows. #AI #Innovation",
        "hashtags": "#Tech #Creative #Design",
        "external_content_url": drive_proof_url,
        "brief_notes": "Internal color grading completed with 709 LUT."
    }
    sub_res = client.post("/api/v1/content/submissions", json=sub_payload, headers=emp_headers)
    assert sub_res.status_code == 201
    content_data = sub_res.json()
    content_id = content_data["content_id"]
    assert content_data["external_content_url"] == drive_proof_url

    # Step 2: Retrieve approval record created for this deliverable
    approvals_res = client.get("/api/v1/approvals", headers=emp_headers)
    assert approvals_res.status_code == 200
    matching_approval = next((a for a in approvals_res.json() if a["content_id"] == content_id), None)
    assert matching_approval is not None
    approval_id = matching_approval["approval_id"]

    # Step 3: Client reviews deliverable — requests revisions with feedback note
    review_payload = {
        "decision": "Changes Requested",
        "feedbackNotes": "Please replace the opening title card with the updated brand mark."
    }
    review_res = client.post(f"/api/v1/approvals/{approval_id}/review", json=review_payload, headers=client_headers)
    assert review_res.status_code == 200
    assert review_res.json()["status"] == "Urgent Changes Requested"

    # Verify content item status reflects revision request
    content_check = client.get("/api/v1/content", headers=emp_headers)
    item_updated = next(c for c in content_check.json() if c["content_id"] == content_id)
    assert item_updated["status"] == "Urgent Changes Requested"

    # Step 4: Final signoff — Client approves updated deliverable
    final_review = client.post(
        f"/api/v1/approvals/{approval_id}/review",
        json={"decision": "Approved", "feedbackNotes": "Approved and cleared for scheduling!"},
        headers=client_headers
    )
    assert final_review.status_code == 200
    assert final_review.json()["status"] == "Approved"

    # Step 5: Verify cross-client security — another client cannot review this item
    # Onboard a rogue client to attempt unauthorized review
    admin_token = get_auth_token("prathameshnehere@gmail.com", "Admin@123")
    rogue_email = f"rogue_{timestamp}@gmail.com"
    rogue_res = client.post("/api/v1/clients", json={
        "email": rogue_email,
        "username": f"rogue_{timestamp}",
        "password": "RoguePassword123!",
        "business_name": f"Rogue Corp {timestamp}",
        "industry": "Retail / Local Business",
        "contact_person": "Rogue User"
    }, headers={"Authorization": f"Bearer {admin_token}"})
    rogue_client_id = rogue_res.json().get("account_id") if rogue_res.status_code == 201 else None
    rogue_token = get_auth_token(rogue_email, "RoguePassword123!")

    try:
        unauthorized_res = client.post(
            f"/api/v1/approvals/{approval_id}/review",
            json={"decision": "Approved", "feedbackNotes": "Attacker approving"},
            headers={"Authorization": f"Bearer {rogue_token}"}
        )
        assert unauthorized_res.status_code == 403
    finally:
        from app.db.session import SessionLocal, engine
        from sqlalchemy import text
        from app.models.account import Account
        try:
            with engine.connect() as conn:
                conn.execute(text(f"DELETE FROM client_feedbacks WHERE content_id = {content_id}"))
                conn.execute(text(f"DELETE FROM approvals WHERE content_id = {content_id}"))
                conn.execute(text(f"DELETE FROM content_items WHERE content_id = {content_id}"))
                conn.commit()
        except Exception:
            pass
        if rogue_client_id:
            db = SessionLocal()
            try:
                r_acc = db.query(Account).filter(Account.account_id == rogue_client_id).first()
                if r_acc:
                    db.delete(r_acc)
                    db.commit()
            finally:
                db.close()


# ============================================================================
# 4. FINANCE LIFECYCLE: INVOICES, PARTIAL PAYMENTS & EXPENSES
# ============================================================================

def test_e2e_finance_lifecycle_invoices_payments_and_expenses():
    admin_token = get_auth_token("prathameshnehere@gmail.com", "Admin@123")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    client_token = get_auth_token("saichakankar@gmail.com", "Admin@123")
    client_headers = {"Authorization": f"Bearer {client_token}"}

    timestamp = int(time.time())

    # Get client account id
    client_res = client.get("/api/v1/clients", headers=client_headers)
    target_client_id = client_res.json()[0]["account_id"]

    # Step 1: Admin generates invoice
    inv_payload = {
        "client_account_id": target_client_id,
        "subtotal": 10000.00,
        "tax_percent": 10.00,
        "due_date": (date.today() + timedelta(days=14)).isoformat(),
        "payment_method": "Stripe ACH",
        "notes": f"November retainer and deliverables #{timestamp}"
    }
    create_res = client.post("/api/v1/invoices", json=inv_payload, headers=admin_headers)
    assert create_res.status_code == 201
    inv_data = create_res.json()
    invoice_id = inv_data["invoice_id"]
    assert Decimal(str(inv_data["total_amount"])) == Decimal("11000.00")
    assert Decimal(str(inv_data["balance_due"])) == Decimal("11000.00")
    assert inv_data["status"] == "Pending"

    # Step 2: Client inspects the invoice
    client_inv_res = client.get(f"/api/v1/invoices/{invoice_id}", headers=client_headers)
    assert client_inv_res.status_code == 200
    assert client_inv_res.json()["invoice_id"] == invoice_id

    # Step 3: Admin records partial payment of $5,000.00
    tx_ref_1 = f"TX-PARTIAL-{timestamp}"
    part_payment = client.post(f"/api/v1/invoices/{invoice_id}/payments", json={
        "amount": 5000.00,
        "payment_method": "Stripe ACH",
        "transaction_reference": tx_ref_1,
        "notes": "First installment wire received"
    }, headers=admin_headers)
    assert part_payment.status_code == 201

    # Verify invoice updated to PARTIALLY_PAID with remaining balance $6,000.00
    inv_after_partial = client.get(f"/api/v1/invoices/{invoice_id}", headers=admin_headers).json()
    assert inv_after_partial["status"] == "Partially Paid"
    assert Decimal(str(inv_after_partial["paid_amount"])) == Decimal("5000.00")
    assert Decimal(str(inv_after_partial["balance_due"])) == Decimal("6000.00")

    # Step 4: Admin records final payment of $6,000.00 to achieve full settlement
    tx_ref_2 = f"TX-FINAL-{timestamp}"
    final_payment = client.post(f"/api/v1/invoices/{invoice_id}/payments", json={
        "amount": 6000.00,
        "payment_method": "Wire Transfer",
        "transaction_reference": tx_ref_2,
        "notes": "Final settlement received"
    }, headers=admin_headers)
    assert final_payment.status_code == 201

    # Verify invoice status transitions to PAID and balance due is 0.00
    inv_settled = client.get(f"/api/v1/invoices/{invoice_id}", headers=admin_headers).json()
    assert inv_settled["status"] == "Paid"
    assert Decimal(str(inv_settled["paid_amount"])) == Decimal("11000.00")
    assert Decimal(str(inv_settled["balance_due"])) == Decimal("0.00")

    # Step 5: Log an agency operational expense and verify metadata
    exp_payload = {
        "category": "Software",
        "description": f"Adobe Creative Cloud Team License #{timestamp}",
        "details": "Annual subscription seat",
        "amount": 899.00,
        "expense_date": date.today().isoformat(),
        "payment_method": "Amex Corp",
        "receipt_url": "https://storage.googleapis.com/receipts/adobe_cc_invoice.pdf"
    }
    exp_res = client.post("/api/v1/expenses", json=exp_payload, headers=admin_headers)
    assert exp_res.status_code == 201
    created_expense = exp_res.json()
    assert created_expense["category"] == "Software"
    assert created_expense["receipt_url"] == "https://storage.googleapis.com/receipts/adobe_cc_invoice.pdf"


# ============================================================================
# 5. NOTIFICATION ISOLATION AND READ RECEIPT LIFECYCLE
# ============================================================================

def test_e2e_notification_security_and_read_lifecycle():
    client_token = get_auth_token("saichakankar@gmail.com", "Admin@123")
    client_headers = {"Authorization": f"Bearer {client_token}"}
    emp_token = get_auth_token("sahilmahale@gmail.com", "Admin@123")
    emp_headers = {"Authorization": f"Bearer {emp_token}"}

    # Step 1: Client retrieves notifications
    res = client.get("/api/v1/notifications", headers=client_headers)
    assert res.status_code == 200
    payload = res.json()
    assert "notifications" in payload
    notifs = payload["notifications"]
    assert isinstance(notifs, list)

    if notifs:
        target_notif = notifs[0]
        notif_id = target_notif["notification_id"]

        # Step 2: Employee attempts to mark client's private notification as read -> 403 Forbidden
        unauthorized_mark = client.patch(
            f"/api/v1/notifications/{notif_id}",
            json={"is_read": True},
            headers=emp_headers
        )
        assert unauthorized_mark.status_code == 403

        # Step 3: Owner marks their notification as read
        mark_res = client.patch(
            f"/api/v1/notifications/{notif_id}",
            json={"is_read": True},
            headers=client_headers
        )
        assert mark_res.status_code == 200
        assert mark_res.json()["is_read"] is True

    # Step 4: Mark all read endpoint operates cleanly
    mark_all = client.post("/api/v1/notifications/mark-all-read", headers=client_headers)
    assert mark_all.status_code == 200


# ============================================================================
# 6. MONTHLY ANALYTICS CLIENT DATA ISOLATION
# ============================================================================

def test_e2e_monthly_analytics_and_client_isolation():
    admin_token = get_auth_token("prathameshnehere@gmail.com", "Admin@123")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    client_token = get_auth_token("saichakankar@gmail.com", "Admin@123")
    client_headers = {"Authorization": f"Bearer {client_token}"}

    client_res = client.get("/api/v1/clients", headers=client_headers)
    target_client_id = client_res.json()[0]["account_id"]

    # Ensure client has at least one social account
    soc_res = client.get("/api/v1/social-accounts", headers=client_headers)
    if soc_res.json():
        soc_id = soc_res.json()[0]["social_account_id"]
    else:
        new_soc = client.post("/api/v1/social-accounts", json={
            "platform": "Instagram",
            "handle": "@AnalyticsTestInsta",
            "page_url": "https://instagram.com/AnalyticsTestInsta"
        }, headers=client_headers)
        soc_id = new_soc.json()["social_account_id"]

    # Step 1: Admin records monthly metric for client account
    metric_payload = {
        "client_account_id": target_client_id,
        "social_account_id": soc_id,
        "report_month": "2026-09",
        "followers_count": 89450,
        "followers_growth": 4120,
        "engagement_rate": 4.85,
        "impressions": 1280000,
        "posts_published": 24,
        "ad_spend": 3200.00
    }
    metric_res = client.post("/api/v1/analytics/metrics", json=metric_payload, headers=admin_headers)
    assert metric_res.status_code == 201
    assert metric_res.json()["report_month"] == "2026-09"

    # Step 2: Client queries their analytics metrics
    c_metrics = client.get("/api/v1/analytics/metrics", headers=client_headers)
    assert c_metrics.status_code == 200
    metrics_list = c_metrics.json()
    assert any(m["report_month"] == "2026-09" for m in metrics_list)

    # Step 3: Client attempts to query metrics for another client account -> 403 Forbidden
    forbidden_query = client.get("/api/v1/analytics/metrics?client_id=9999", headers=client_headers)
    assert forbidden_query.status_code == 403


# ============================================================================
# 7. SECURITY: TOKEN TAMPERING, EXPIRATION & INVALID CREDENTIALS
# ============================================================================

def test_e2e_security_token_tampering_and_unauthorized_access():
    # 1. Unauthenticated request to protected endpoint
    unauth = client.get("/api/v1/tasks")
    assert unauth.status_code == 401

    # 2. Forged / invalid bearer token
    invalid_token = client.get("/api/v1/tasks", headers={"Authorization": "Bearer forged.invalid.token"})
    assert invalid_token.status_code == 401

    # 3. Bad password authentication attempt
    bad_login = client.post("/api/v1/auth/login", json={"email": "prathameshnehere@gmail.com", "password": "WrongPassword!"})
    assert bad_login.status_code == 401
