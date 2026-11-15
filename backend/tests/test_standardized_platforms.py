import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.platforms import (
    SUPPORTED_PLATFORMS,
    normalize_platform
)

client = TestClient(app)

ADMIN_EMAIL = "prathameshnehere@gmail.com"
EMPLOYEE_EMAIL = "sahilmahale@gmail.com"
PASSWORD = "Admin@123"

def get_auth_token(email: str = ADMIN_EMAIL, password: str = PASSWORD) -> str:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    return response.json()["access_token"]


def test_core_platform_normalization_unit():
    """Unit tests for platform normalization and error handling."""
    assert normalize_platform("instagram") == "instagram"
    assert normalize_platform("Instagram") == "instagram"
    assert normalize_platform("facebook") == "facebook"
    assert normalize_platform("Facebook") == "facebook"
    assert normalize_platform("FB") == "facebook"
    assert normalize_platform("youtube") == "youtube"
    assert normalize_platform("YouTube") == "youtube"
    assert normalize_platform("linkedin") == "linkedin"
    assert normalize_platform("LinkedIn") == "linkedin"
    assert normalize_platform("whatsapp_business") == "whatsapp_business"
    assert normalize_platform("WhatsApp") == "whatsapp_business"
    assert normalize_platform("WhatsApp Business") == "whatsapp_business"
    assert normalize_platform("x") == "x"
    assert normalize_platform("X") == "x"
    assert normalize_platform("Twitter") == "x"
    assert normalize_platform("Twitter/X") == "x"
    assert normalize_platform("pinterest") == "pinterest"
    assert normalize_platform("Pinterest") == "pinterest"

    # Unsupported platforms must raise ValueError
    for bad in ["tiktok", "TikTok", "snapchat", "reddit", "threads", "telegram"]:
        with pytest.raises(ValueError) as excinfo:
            normalize_platform(bad)
        assert "Unsupported platform" in str(excinfo.value)


def test_all_seven_platforms_can_be_created_for_client():
    """Verify all exactly 7 platforms can be linked to a client account."""
    admin_token = get_auth_token(ADMIN_EMAIL, PASSWORD)
    headers = {"Authorization": f"Bearer {admin_token}"}

    clients_res = client.get("/api/v1/clients", headers=headers)
    assert clients_res.status_code == 200
    target_client_id = clients_res.json()[0]["account_id"]

    created_ids = []
    try:
        for platform_name in SUPPORTED_PLATFORMS:
            payload = {
                "client_account_id": target_client_id,
                "platform": platform_name,
                "handle": f"@brand_{platform_name}_official",
                "page_url": f"https://{platform_name}.com/brand_official"
            }
            res = client.post("/api/v1/social-accounts", json=payload, headers=headers)
            assert res.status_code == 201, f"Failed for platform {platform_name}: {res.text}"
            data = res.json()
            assert data["platform"] == platform_name
            assert data["is_active"] is True
            created_ids.append(data["social_account_id"])
    finally:
        # Clean up created test accounts
        for acc_id in created_ids:
            client.delete(f"/api/v1/social-accounts/{acc_id}", headers=headers)


def test_platform_alias_normalization_via_api():
    """Verify alias inputs like 'Twitter/X' or 'WhatsApp Business' are normalized via API."""
    admin_token = get_auth_token(ADMIN_EMAIL, PASSWORD)
    headers = {"Authorization": f"Bearer {admin_token}"}

    clients_res = client.get("/api/v1/clients", headers=headers)
    target_client_id = clients_res.json()[0]["account_id"]

    # 1. Test Twitter/X -> x
    res_x = client.post("/api/v1/social-accounts", json={
        "client_account_id": target_client_id,
        "platform": "Twitter/X",
        "handle": "@TwitterXNormTest",
        "page_url": "https://x.com/TwitterXNormTest"
    }, headers=headers)
    assert res_x.status_code == 201
    acc_id_x = res_x.json()["social_account_id"]
    assert res_x.json()["platform"] == "x"

    # 2. Test WhatsApp Business -> whatsapp_business
    res_wa = client.post("/api/v1/social-accounts", json={
        "client_account_id": target_client_id,
        "platform": "WhatsApp Business",
        "handle": "+1-800-555-0199",
        "page_url": "https://wa.me/18005550199"
    }, headers=headers)
    assert res_wa.status_code == 201
    acc_id_wa = res_wa.json()["social_account_id"]
    assert res_wa.json()["platform"] == "whatsapp_business"

    # Cleanup
    client.delete(f"/api/v1/social-accounts/{acc_id_x}", headers=headers)
    client.delete(f"/api/v1/social-accounts/{acc_id_wa}", headers=headers)


def test_unsupported_platform_rejected_with_422():
    """Verify unsupported platforms return 422 Unprocessable Entity."""
    admin_token = get_auth_token(ADMIN_EMAIL, PASSWORD)
    headers = {"Authorization": f"Bearer {admin_token}"}

    clients_res = client.get("/api/v1/clients", headers=headers)
    target_client_id = clients_res.json()[0]["account_id"]

    for bad_platform in ["TikTok", "tiktok", "snapchat", "reddit", "wechat"]:
        res = client.post("/api/v1/social-accounts", json={
            "client_account_id": target_client_id,
            "platform": bad_platform,
            "handle": "@unsupported_test",
            "page_url": "https://example.com"
        }, headers=headers)
        assert res.status_code == 422, f"Expected 422 for '{bad_platform}', got {res.status_code}"


def test_unsupported_platform_rejected_on_patch():
    """Verify patching an account with an unsupported platform returns 422."""
    admin_token = get_auth_token(ADMIN_EMAIL, PASSWORD)
    headers = {"Authorization": f"Bearer {admin_token}"}

    clients_res = client.get("/api/v1/clients", headers=headers)
    target_client_id = clients_res.json()[0]["account_id"]

    # Create valid account
    res = client.post("/api/v1/social-accounts", json={
        "client_account_id": target_client_id,
        "platform": "instagram",
        "handle": "@patch_test_acc",
    }, headers=headers)
    assert res.status_code == 201
    acc_id = res.json()["social_account_id"]

    try:
        # Patch with unsupported platform
        patch_res = client.patch(f"/api/v1/social-accounts/{acc_id}", json={
            "platform": "tiktok"
        }, headers=headers)
        assert patch_res.status_code == 422
    finally:
        client.delete(f"/api/v1/social-accounts/{acc_id}", headers=headers)


def test_content_item_platform_validation():
    """Verify content items enforce the 7 standardized platforms."""
    emp_token = get_auth_token(EMPLOYEE_EMAIL, PASSWORD)
    headers = {"Authorization": f"Bearer {emp_token}"}

    clients_res = client.get("/api/v1/clients", headers=headers)
    client_name = clients_res.json()[0]["name"]

    # 1. Valid platform content submission
    valid_payload = {
        "client": client_name,
        "content_type": "YouTube Short 9:16",
        "platform": "youtube",
        "driveUrl": "https://drive.google.com/file/d/test12345/view",
        "caption": "Standardized platform content validation test",
    }
    create_res = client.post("/api/v1/content/submissions", json=valid_payload, headers=headers)
    assert create_res.status_code == 201
    content_data = create_res.json()
    assert content_data["platform"] == "youtube"
    content_id = content_data["content_id"]

    try:
        # 2. Unsupported platform in content submission returns 422
        invalid_payload = {
            "client": client_name,
            "content_type": "Video 9:16",
            "platform": "tiktok",
            "driveUrl": "https://drive.google.com/file/d/test99999/view",
            "caption": "Invalid platform test",
        }
        invalid_res = client.post("/api/v1/content/submissions", json=invalid_payload, headers=headers)
        assert invalid_res.status_code == 422

        # 3. Unsupported platform in patch returns 422
        patch_res = client.patch(f"/api/v1/content/{content_id}", json={
            "platform": "snapchat"
        }, headers=headers)
        assert patch_res.status_code == 422
    finally:
        from app.db.session import engine
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text(f"DELETE FROM approvals WHERE content_id = {content_id}"))
            conn.execute(text(f"DELETE FROM content_items WHERE content_id = {content_id}"))
            conn.commit()
