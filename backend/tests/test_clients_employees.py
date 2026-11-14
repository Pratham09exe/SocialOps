from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

ADMIN_EMAIL = "prathameshnehere@gmail.com"
EMPLOYEE_EMAIL = "sahilmahale@gmail.com"
CLIENT_EMAIL = "saichakankar@gmail.com"
PASSWORD = "Admin@123"

def get_auth_token(email: str = ADMIN_EMAIL, password: str = PASSWORD) -> str:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    return response.json()["access_token"]


def test_admin_can_list_all_clients():
    admin_token = get_auth_token(ADMIN_EMAIL, PASSWORD)
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    response = client.get("/api/v1/clients", headers=headers)
    assert response.status_code == 200
    clients_data = response.json()
    assert len(clients_data) >= 1


def test_employee_can_list_clients():
    emp_token = get_auth_token(EMPLOYEE_EMAIL, PASSWORD)
    headers = {"Authorization": f"Bearer {emp_token}"}
    
    response = client.get("/api/v1/clients", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) >= 1


def test_client_only_sees_own_profile():
    client_token = get_auth_token(CLIENT_EMAIL, PASSWORD)
    headers = {"Authorization": f"Bearer {client_token}"}
    
    response = client.get("/api/v1/clients", headers=headers)
    assert response.status_code == 200
    clients_data = response.json()
    # Object-level authorization must return ONLY this client's profile
    assert len(clients_data) == 1
    assert clients_data[0]["email"] == CLIENT_EMAIL


def test_client_cannot_access_other_client_by_id():
    client_token = get_auth_token(CLIENT_EMAIL, PASSWORD)
    headers = {"Authorization": f"Bearer {client_token}"}
    
    # Try accessing non-existent or other client id (e.g. account_id 9999)
    response = client.get("/api/v1/clients/9999", headers=headers)
    assert response.status_code in [403, 404]


def test_client_cannot_access_employees():
    client_token = get_auth_token(CLIENT_EMAIL, PASSWORD)
    headers = {"Authorization": f"Bearer {client_token}"}
    
    response = client.get("/api/v1/employees", headers=headers)
    assert response.status_code == 403


def test_employee_cannot_create_client():
    emp_token = get_auth_token(EMPLOYEE_EMAIL, PASSWORD)
    headers = {"Authorization": f"Bearer {emp_token}"}
    
    payload = {
        "business_name": "Unauthorized Client",
        "industry": "IT / Software / Technology",
        "email": "unauth_employee_attempt@gmail.com",
        "username": "unauth_client"
    }
    response = client.post("/api/v1/clients", json=payload, headers=headers)
    assert response.status_code == 403


def test_admin_can_create_client():
    admin_token = get_auth_token(ADMIN_EMAIL, PASSWORD)
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    import uuid
    uid = uuid.uuid4().hex[:6]
    payload = {
        "business_name": f"Test Brand {uid}",
        "industry": "IT / Software / Technology",
        "email": f"test_{uid}@gmail.com",
        "username": f"test_brand_{uid}",
        "tier": "Starter Presence"
    }
    response = client.post("/api/v1/clients", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["business_name"] == f"Test Brand {uid}"
    assert data["tier"] == "Starter Presence"


def test_social_accounts_isolation():
    client_token = get_auth_token(CLIENT_EMAIL, PASSWORD)
    headers = {"Authorization": f"Bearer {client_token}"}
    
    # Client creates a social account for itself
    response = client.post("/api/v1/social-accounts", json={
        "platform": "Instagram",
        "handle": "@ChakankarOfficial",
        "page_url": "https://instagram.com/ChakankarOfficial"
    }, headers=headers)
    assert response.status_code == 201
    social_id = response.json()["social_account_id"]

    # Client can list its own social accounts
    list_res = client.get("/api/v1/social-accounts", headers=headers)
    assert list_res.status_code == 200
    assert any(s["social_account_id"] == social_id for s in list_res.json())

    # Client can delete its own social account
    del_res = client.delete(f"/api/v1/social-accounts/{social_id}", headers=headers)
    assert del_res.status_code == 204


def test_packages_available_to_all_authenticated():
    client_token = get_auth_token(CLIENT_EMAIL, PASSWORD)
    headers = {"Authorization": f"Bearer {client_token}"}
    
    response = client.get("/api/v1/packages", headers=headers)
    assert response.status_code == 200
    packages = response.json()
    assert len(packages) >= 3
    package_names = [p["name"] for p in packages]
    assert "Enterprise Retainer" in package_names
