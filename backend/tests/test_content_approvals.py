from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_auth_token(email: str, password: str) -> str:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    return response.json()["access_token"]


# -------------------------------------------------------------
# CONTENT SUBMISSION & DRIVE URL VALIDATION TESTS
# -------------------------------------------------------------

def test_employee_can_submit_content():
    emp_token = get_auth_token("sahilmahale@gmail.com", "Admin@123")
    headers = {"Authorization": f"Bearer {emp_token}"}

    payload = {
        "client": "Chakankar Digital Innovations",
        "title": "Carbon Horizon Teaser Reel",
        "content_type": "Reel 9:16",
        "platform": "Instagram",
        "caption": "Uncompromising acoustic fidelity. Introducing the Carbon Horizon Series.",
        "hashtags": "#NovaWave #StudioSound",
        "driveUrl": "https://drive.google.com/drive/folders/1NovaWave_Fall_Teaser_Final",
        "internalNotes": "Color graded in Rec.709."
    }
    response = client.post("/api/v1/content/submissions", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Carbon Horizon Teaser Reel"
    assert data["status"] == "Needs Internal Review"
    assert data["external_content_url"] == "https://drive.google.com/drive/folders/1NovaWave_Fall_Teaser_Final"


def test_invalid_or_unsafe_drive_url_rejected():
    emp_token = get_auth_token("sahilmahale@gmail.com", "Admin@123")
    headers = {"Authorization": f"Bearer {emp_token}"}

    # Scheme missing
    res_no_scheme = client.post("/api/v1/content/submissions", json={
        "client": "Chakankar Digital Innovations",
        "driveUrl": "drive.google.com/some/file"
    }, headers=headers)
    assert res_no_scheme.status_code == 422

    # Malicious scheme
    res_unsafe = client.post("/api/v1/content/submissions", json={
        "client": "Chakankar Digital Innovations",
        "driveUrl": "javascript:alert('xss')"
    }, headers=headers)
    assert res_unsafe.status_code == 422


def test_client_cannot_submit_content_deliverable():
    client_token = get_auth_token("saichakankar@gmail.com", "Admin@123")
    headers = {"Authorization": f"Bearer {client_token}"}

    payload = {
        "client": "Chakankar Digital Innovations",
        "driveUrl": "https://drive.google.com/file/d/test"
    }
    response = client.post("/api/v1/content/submissions", json=payload, headers=headers)
    assert response.status_code == 403


def test_client_content_isolation():
    # Marcus Vance is Kinetix Logistics
    client_token = get_auth_token("saichakankar@gmail.com", "Admin@123")
    headers = {"Authorization": f"Bearer {client_token}"}

    response = client.get("/api/v1/content", headers=headers)
    assert response.status_code == 200
    items = response.json()
    for item in items:
        assert item["client"] == "Chakankar Digital Innovations"
        # Ensure internal brief notes are stripped for Client role
        assert item["brief_notes"] is None


def test_client_cannot_access_other_client_content_by_id():
    client_token = get_auth_token("saichakankar@gmail.com", "Admin@123")
    client_headers = {"Authorization": f"Bearer {client_token}"}

    res = client.get("/api/v1/content/99999", headers=client_headers)
    assert res.status_code in [403, 404]


# -------------------------------------------------------------
# CONTENT PLANS & TARGETS TESTS
# -------------------------------------------------------------

def test_admin_can_create_plan_and_targets():
    admin_token = get_auth_token("prathameshnehere@gmail.com", "Admin@123")
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Create plan
    plan_payload = {
        "client": "Aura Pulse Drinks",
        "report_month": "December 2025",
        "campaign_notes": "Sparkling hydration holiday push.",
        "targets": [
            {"category": "Brand Awareness", "posts_target": 15, "stories_target": 30, "ads_target": 5}
        ]
    }
    res = client.post("/api/v1/content-plans", json=plan_payload, headers=headers)
    assert res.status_code == 201
    plan_data = res.json()
    assert plan_data["report_month"] == "December 2025"
    assert len(plan_data["targets"]) == 1
    plan_id = plan_data["content_plan_id"]

    # Add second target
    t_res = client.post(f"/api/v1/content-plans/{plan_id}/targets", json={
        "category": "D2C Conversions",
        "posts_target": 10,
        "stories_target": 15,
        "ads_target": 20
    }, headers=headers)
    assert t_res.status_code == 201

    # Adding duplicate category must be rejected by unique constraint
    t_dup = client.post(f"/api/v1/content-plans/{plan_id}/targets", json={
        "category": "D2C Conversions",
        "posts_target": 5
    }, headers=headers)
    assert t_dup.status_code == 400


def test_client_cannot_access_other_client_content_plan():
    client_token = get_auth_token("saichakankar@gmail.com", "Admin@123")
    headers = {"Authorization": f"Bearer {client_token}"}

    res = client.get("/api/v1/content-plans/99999", headers=headers)
    assert res.status_code in [403, 404]


# -------------------------------------------------------------
# APPROVALS WORKFLOW TESTS
# -------------------------------------------------------------

def test_approvals_client_isolation():
    client_token = get_auth_token("saichakankar@gmail.com", "Admin@123")
    headers = {"Authorization": f"Bearer {client_token}"}

    res = client.get("/api/v1/approvals", headers=headers)
    assert res.status_code == 200
    approvals = res.json()
    for a in approvals:
        assert "CHAKANKAR" in a["client"].upper()


def test_client_can_approve_deliverable():
    # Admin stages deliverable for Kinetix Logistics
    admin_token = get_auth_token("prathameshnehere@gmail.com", "Admin@123")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    sub_res = client.post("/api/v1/content/submissions", json={
        "client": "Chakankar Digital Innovations",
        "title": "Kinetix Q4 Infographic Slide",
        "driveUrl": "https://drive.google.com/file/d/test_kinetix"
    }, headers=admin_headers)
    assert sub_res.status_code == 201

    # Marcus Vance (Kinetix Logistics) reviews and approves
    client_token = get_auth_token("saichakankar@gmail.com", "Admin@123")
    client_headers = {"Authorization": f"Bearer {client_token}"}

    approvals = client.get("/api/v1/approvals", headers=client_headers).json()
    target_appr = next(a for a in approvals if a["title"] == "Kinetix Q4 Infographic Slide")

    review_res = client.post(f"/api/v1/approvals/{target_appr['approval_id']}/review", json={
        "decision": "Approved",
        "review_comments": "Verified and approved by client."
    }, headers=client_headers)
    assert review_res.status_code == 200
    data = review_res.json()
    assert data["decision"] == "Approved"
    assert data["status"] == "Approved"


def test_client_cannot_review_other_client_approval():
    client_token = get_auth_token("saichakankar@gmail.com", "Admin@123")
    client_headers = {"Authorization": f"Bearer {client_token}"}

    res = client.post("/api/v1/approvals/99999/review", json={
        "decision": "Approved"
    }, headers=client_headers)
    assert res.status_code in [403, 404]


# -------------------------------------------------------------
# CLIENT FEEDBACK TESTS
# -------------------------------------------------------------

def test_client_feedback_submission():
    client_token = get_auth_token("saichakankar@gmail.com", "Admin@123")
    headers = {"Authorization": f"Bearer {client_token}"}

    payload = {
        "description": "Please increase font size on slide 3.",
        "category": "Typography",
        "priority": "High",
        "rating": 4
    }
    res = client.post("/api/v1/feedback", json=payload, headers=headers)
    assert res.status_code == 201
    fb = res.json()
    assert fb["category"] == "Typography"
    assert fb["client_name"] == "Chakankar Digital Innovations"


# -------------------------------------------------------------
# ATTACHMENT METADATA TESTS
# -------------------------------------------------------------

def test_attachment_metadata_creation():
    admin_token = get_auth_token("prathameshnehere@gmail.com", "Admin@123")
    headers = {"Authorization": f"Bearer {admin_token}"}

    payload = {
        "file_name": "brand_guidelines_v2.pdf",
        "storage_url": "https://drive.google.com/file/d/brand_guidelines_proof",
        "mime_type": "application/pdf",
        "file_size_bytes": 1048576
    }
    res = client.post("/api/v1/attachments", json=payload, headers=headers)
    assert res.status_code == 201
    att = res.json()
    assert att["file_name"] == "brand_guidelines_v2.pdf"
    assert att["storage_url"] == "https://drive.google.com/file/d/brand_guidelines_proof"
