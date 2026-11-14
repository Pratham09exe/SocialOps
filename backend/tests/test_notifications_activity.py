from datetime import date, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models.account import Account
from app.models.analytics import Notification
from app.core.events import create_notification, sanitize_text

client = TestClient(app)

def get_auth_token(email: str, password: str) -> str:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    return response.json()["access_token"]


# ============================================================================
# ACTIVITY LOG AUDIT TRAIL TESTS
# ============================================================================

def test_admin_and_employee_can_view_activity_logs():
    admin_token = get_auth_token("prathameshnehere@gmail.com", "Admin@123")
    emp_token = get_auth_token("sahilmahale@gmail.com", "Admin@123")

    # Admin access
    res_admin = client.get("/api/v1/activity-logs", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin.status_code == 200
    admin_logs = res_admin.json()
    assert isinstance(admin_logs, list)
    assert len(admin_logs) >= 1

    # Employee access
    res_emp = client.get("/api/v1/activity-logs", headers={"Authorization": f"Bearer {emp_token}"})
    assert res_emp.status_code == 200
    emp_logs = res_emp.json()
    assert isinstance(emp_logs, list)
    assert len(emp_logs) >= 1


def test_client_is_strictly_forbidden_from_activity_logs():
    client_token = get_auth_token("saichakankar@gmail.com", "Admin@123")

    res = client.get("/api/v1/activity-logs", headers={"Authorization": f"Bearer {client_token}"})
    assert res.status_code == 403
    assert "forbidden" in res.json()["detail"].lower()


def test_activity_logs_filtering_and_search():
    admin_token = get_auth_token("prathameshnehere@gmail.com", "Admin@123")
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Record a test log
    create_res = client.post("/api/v1/activity-logs", json={
        "action": "Audit Probe Verified",
        "action_type": "info",
        "target": "Security Pipeline Alpha-77",
        "subtext": "Automated perimeter scan",
        "entity_type": "SecurityAudit"
    }, headers=headers)
    assert create_res.status_code == 201

    # Filter by action
    res_filter = client.get("/api/v1/activity-logs?action=Audit Probe Verified", headers=headers)
    assert res_filter.status_code == 200
    logs = res_filter.json()
    assert any("Audit Probe Verified" in l["action"] for l in logs)

    # Search by keyword
    res_search = client.get("/api/v1/activity-logs?search=Alpha-77", headers=headers)
    assert res_search.status_code == 200
    assert any("Alpha-77" in l["target"] for l in res_search.json())


def test_activity_logs_secret_scrubbing():
    # Verify sanitizer directly and via endpoint
    dirty_text = "User reset password: MySuperSecretPassword123 with api_key=ak_live_998811 and token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjF9.xxx"
    clean = sanitize_text(dirty_text)

    assert "MySuperSecretPassword123" not in clean
    assert "ak_live_998811" not in clean
    assert "[REDACTED]" in clean
    assert "[JWT_REDACTED]" in clean


# ============================================================================
# NOTIFICATION TESTS & RECIPIENT ACCESS CONTROL
# ============================================================================

def test_user_can_view_own_notifications_only():
    emp_token = get_auth_token("sahilmahale@gmail.com", "Admin@123")
    client_token = get_auth_token("saichakankar@gmail.com", "Admin@123")

    # 1. Elena (Employee) retrieves notifications
    res_elena = client.get("/api/v1/notifications", headers={"Authorization": f"Bearer {emp_token}"})
    assert res_elena.status_code == 200
    elena_data = res_elena.json()
    assert "unread_count" in elena_data
    assert "notifications" in elena_data

    # Resolve Elena's account id
    me_elena = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {emp_token}"}).json()
    elena_acc_id = me_elena["account_id"]
    for notif in elena_data["notifications"]:
        assert notif["recipient_account_id"] == elena_acc_id

    # 2. Marcus (Client) retrieves notifications
    res_marcus = client.get("/api/v1/notifications", headers={"Authorization": f"Bearer {client_token}"})
    assert res_marcus.status_code == 200
    marcus_data = res_marcus.json()

    me_marcus = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {client_token}"}).json()
    marcus_acc_id = me_marcus["account_id"]
    for notif in marcus_data["notifications"]:
        assert notif["recipient_account_id"] == marcus_acc_id


def test_cross_user_notification_modification_forbidden():
    emp_token = get_auth_token("sahilmahale@gmail.com", "Admin@123")
    client_token = get_auth_token("saichakankar@gmail.com", "Admin@123")

    # Marcus gets his notifications
    marcus_notifs = client.get("/api/v1/notifications", headers={"Authorization": f"Bearer {client_token}"}).json()["notifications"]
    if not marcus_notifs:
        # Create a notification for Marcus directly
        db = SessionLocal()
        marcus_acc = db.query(Account).filter(Account.email == "saichakankar@gmail.com").first()
        n = create_notification(db, marcus_acc.account_id, "TEST_EVENT", "Title", "Message")
        db.commit()
        marcus_notif_id = n.notification_id
        db.close()
    else:
        marcus_notif_id = marcus_notifs[0]["notification_id"]

    # Elena attempts to update Marcus's notification
    hack_res = client.patch(
        f"/api/v1/notifications/{marcus_notif_id}",
        json={"is_read": True},
        headers={"Authorization": f"Bearer {emp_token}"}
    )
    assert hack_res.status_code == 403
    assert "cannot modify another user" in hack_res.json()["detail"].lower()


def test_user_can_mark_notification_read_and_mark_all():
    client_token = get_auth_token("saichakankar@gmail.com", "Admin@123")
    headers = {"Authorization": f"Bearer {client_token}"}

    # Ensure Marcus has an unread notification
    db = SessionLocal()
    marcus_acc = db.query(Account).filter(Account.email == "saichakankar@gmail.com").first()
    test_notif = create_notification(
        db,
        marcus_acc.account_id,
        "STATUS_PING",
        "System Ping",
        "Your report is ready",
        dedup_key=f"ping:{marcus_acc.account_id}:{date.today().isoformat()}"
    )
    db.commit()
    notif_id = test_notif.notification_id
    db.close()

    # Mark single notification as read
    patch_res = client.patch(f"/api/v1/notifications/{notif_id}", json={"is_read": True}, headers=headers)
    assert patch_res.status_code == 200
    assert patch_res.json()["is_read"] is True

    # Mark all as read
    all_res = client.post("/api/v1/notifications/mark-all-read", headers=headers)
    assert all_res.status_code == 200
    assert "marked_count" in all_res.json()

    # Verify unread count is 0
    after_res = client.get("/api/v1/notifications", headers=headers)
    assert after_res.json()["unread_count"] == 0


def test_unauthenticated_activity_and_notifications_rejected():
    # Activity logs without auth
    res1 = client.get("/api/v1/activity-logs")
    assert res1.status_code == 401

    # Notifications without auth
    res2 = client.get("/api/v1/notifications")
    assert res2.status_code == 401


# ============================================================================
# AUTOMATED WORKFLOW EVENT DISPATCH TESTS
# ============================================================================

def test_task_assignment_triggers_notification_and_activity_log():
    admin_token = get_auth_token("prathameshnehere@gmail.com", "Admin@123")
    emp_token = get_auth_token("sahilmahale@gmail.com", "Admin@123")

    # Find Elena's employee account
    me_elena = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {emp_token}"}).json()
    elena_id = me_elena["account_id"]

    # Admin creates a task assigned to Elena
    clients_res = client.get("/api/v1/clients", headers={"Authorization": f"Bearer {admin_token}"}).json()
    test_client = clients_res[0]

    task_payload = {
        "client_account_id": test_client["account_id"],
        "assigned_employee_id": elena_id,
        "title": "Automated Event Verification Task",
        "description": "Testing notification dispatch",
        "priority": "High",
        "status": "To Do",
        "due_date": (date.today() + timedelta(days=3)).isoformat()
    }

    create_task_res = client.post("/api/v1/tasks", json=task_payload, headers={"Authorization": f"Bearer {admin_token}"})
    assert create_task_res.status_code == 201
    task_data = create_task_res.json()

    # 1. Verify Elena has received a TASK_ASSIGNED notification
    notifs_res = client.get("/api/v1/notifications", headers={"Authorization": f"Bearer {emp_token}"})
    assert notifs_res.status_code == 200
    notifs = notifs_res.json()["notifications"]
    assigned_notif = next((n for n in notifs if n["entity_type"] == "Task" and n["entity_id"] == task_data["task_id"]), None)
    assert assigned_notif is not None
    assert assigned_notif["event_type"] == "TASK_ASSIGNED"
    assert "Automated Event Verification Task" in assigned_notif["message"]

    # 2. Verify Activity Log was recorded
    act_res = client.get("/api/v1/activity-logs?action=Task Created", headers={"Authorization": f"Bearer {admin_token}"})
    assert act_res.status_code == 200
    act_logs = act_res.json()
    assert any(l["target"] == "Automated Event Verification Task" for l in act_logs)


def test_approval_decision_triggers_notification_and_activity_log():
    admin_token = get_auth_token("prathameshnehere@gmail.com", "Admin@123")
    emp_token = get_auth_token("sahilmahale@gmail.com", "Admin@123")

    # 1. Employee submits deliverable
    clients_res = client.get("/api/v1/clients", headers={"Authorization": f"Bearer {admin_token}"}).json()
    test_client = clients_res[0]

    submit_payload = {
        "client_account_id": test_client["account_id"],
        "title": "Sprint Promo Video",
        "content_type": "Reel 9:16",
        "platform": "Instagram",
        "caption": "Accelerate your pipeline #sprint",
        "external_content_url": "https://drive.google.com/drive/folders/test_event_proof"
    }

    sub_res = client.post("/api/v1/content/submissions", json=submit_payload, headers={"Authorization": f"Bearer {emp_token}"})
    assert sub_res.status_code == 201
    content_id = sub_res.json()["content_id"]

    # Find the corresponding approval record
    approvals_res = client.get("/api/v1/approvals", headers={"Authorization": f"Bearer {admin_token}"}).json()
    approval = next((a for a in approvals_res if a["content_id"] == content_id), approvals_res[0])

    # 2. Admin reviews and approves the deliverable
    review_res = client.post(
        f"/api/v1/approvals/{approval['approval_id']}/review",
        json={"decision": "Approved", "review_comments": "Looks pristine!"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert review_res.status_code == 200

    # 3. Verify Elena received CONTENT_APPROVED notification
    notifs_res = client.get("/api/v1/notifications", headers={"Authorization": f"Bearer {emp_token}"})
    notifs = notifs_res.json()["notifications"]
    approved_notif = next((n for n in notifs if n["event_type"] == "CONTENT_APPROVED" and n["entity_id"] == content_id), None)
    assert approved_notif is not None

    # 4. Verify Activity Log recorded "Content Approved"
    logs_res = client.get("/api/v1/activity-logs?action=Content Approved", headers={"Authorization": f"Bearer {admin_token}"})
    assert any("Sprint Promo Video" in l["target"] for l in logs_res.json())


def test_notification_deduplication_prevents_duplicate_entries():
    db = SessionLocal()
    marcus_acc = db.query(Account).filter(Account.email == "saichakankar@gmail.com").first()

    dedup = f"dedup_test_{date.today().isoformat()}"

    # First call -> creates notification
    n1 = create_notification(
        db=db,
        recipient_account_id=marcus_acc.account_id,
        event_type="TEST_DEDUP",
        title="Dedup Title",
        message="Dedup Message",
        entity_type="TestItem",
        entity_id=9999,
        dedup_key=dedup
    )
    db.commit()

    # Second call with identical dedup key -> returns existing notification without creating duplicate
    n2 = create_notification(
        db=db,
        recipient_account_id=marcus_acc.account_id,
        event_type="TEST_DEDUP",
        title="Dedup Title",
        message="Dedup Message",
        entity_type="TestItem",
        entity_id=9999,
        dedup_key=dedup
    )
    db.commit()

    assert n1.notification_id == n2.notification_id

    # Check database count with this dedup key
    count = db.query(Notification).filter(Notification.dedup_key == dedup).count()
    assert count == 1
    db.close()


def test_client_monthly_metrics_isolation():
    client_token = get_auth_token("saichakankar@gmail.com", "Admin@123")
    admin_token = get_auth_token("prathameshnehere@gmail.com", "Admin@123")

    # Admin creates/records a metric for Aura Pulse
    aura_client = next((c for c in client.get("/api/v1/clients", headers={"Authorization": f"Bearer {admin_token}"}).json() if "Aura" in c["business_name"]), None)
    if aura_client:
        metric_res = client.post("/api/v1/analytics/metrics", json={
            "client_account_id": aura_client["account_id"],
            "report_month": "2025-11",
            "source_type": "Agency Audit",
            "likes": 5000,
            "comments": 400,
            "shares": 250,
            "profile_visits": 8000,
            "total_reach": 45000,
            "impressions": 85000,
            "engagement_rate": "5.50"
        }, headers={"Authorization": f"Bearer {admin_token}"})
        assert metric_res.status_code == 201

        # Marcus Vance (Kinetix client) attempts to access Aura Pulse metrics -> 403 Forbidden
        hack_res = client.get(f"/api/v1/analytics/metrics?client_id={aura_client['account_id']}", headers={"Authorization": f"Bearer {client_token}"})
        assert hack_res.status_code == 403
