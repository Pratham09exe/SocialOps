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


# -------------------------------------------------------------
# TASK CREATION TESTS
# -------------------------------------------------------------

def test_admin_can_create_task():
    admin_token = get_auth_token(ADMIN_EMAIL, PASSWORD)
    headers = {"Authorization": f"Bearer {admin_token}"}

    clients_res = client.get("/api/v1/clients", headers=headers)
    client_name = clients_res.json()[0]["name"]

    payload = {
        "title": "Campaign Mastercut Deliverable",
        "client": client_name,
        "assignee": "Sahil Mahale",
        "priority": "Urgent",
        "stage": "To Do",
        "estimated_hours": 10.0,
        "description": "Mastercut delivery for festive campaign."
    }
    response = client.post("/api/v1/tasks", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Campaign Mastercut Deliverable"
    assert data["priority"] == "Urgent"
    assert data["stage"] == "To Do"


def test_employee_can_create_task():
    emp_token = get_auth_token(EMPLOYEE_EMAIL, PASSWORD)
    headers = {"Authorization": f"Bearer {emp_token}"}

    clients_res = client.get("/api/v1/clients", headers=headers)
    client_name = clients_res.json()[0]["name"]

    payload = {
        "title": "Motion Graphics Polish Sprint",
        "client": client_name,
        "priority": "Medium",
        "stage": "In Progress",
        "estimated_hours": 6.0
    }
    response = client.post("/api/v1/tasks", json=payload, headers=headers)
    assert response.status_code == 201
    assert response.json()["title"] == "Motion Graphics Polish Sprint"


def test_client_cannot_create_internal_task():
    client_token = get_auth_token(CLIENT_EMAIL, PASSWORD)
    headers = {"Authorization": f"Bearer {client_token}"}

    payload = {
        "title": "Unauthorized Client Task",
        "priority": "Low",
        "stage": "To Do"
    }
    response = client.post("/api/v1/tasks", json=payload, headers=headers)
    assert response.status_code == 403


def test_task_creation_validation():
    admin_token = get_auth_token(ADMIN_EMAIL, PASSWORD)
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Missing title
    res_no_title = client.post("/api/v1/tasks", json={"priority": "Low"}, headers=headers)
    assert res_no_title.status_code == 422

    # Negative hours
    res_neg_hours = client.post("/api/v1/tasks", json={"title": "Test", "estimated_hours": -5.0}, headers=headers)
    assert res_neg_hours.status_code == 422

    # Unknown client ID
    res_unknown_client = client.post("/api/v1/tasks", json={"title": "Test", "client_account_id": 99999}, headers=headers)
    assert res_unknown_client.status_code == 404

    # Unknown employee ID
    res_unknown_emp = client.post("/api/v1/tasks", json={"title": "Test", "assigned_employee_id": 99999}, headers=headers)
    assert res_unknown_emp.status_code == 404


def test_unassigned_task_creation():
    admin_token = get_auth_token(ADMIN_EMAIL, PASSWORD)
    headers = {"Authorization": f"Bearer {admin_token}"}

    clients_res = client.get("/api/v1/clients", headers=headers)
    client_name = clients_res.json()[0]["name"]

    payload = {
        "title": "Unassigned Brand Discovery Research",
        "client": client_name,
        "assignee": "Unassigned",
        "priority": "Normal",
        "stage": "To Do"
    }
    response = client.post("/api/v1/tasks", json=payload, headers=headers)
    assert response.status_code == 201
    assert response.json()["assignee"] == "Unassigned"


# -------------------------------------------------------------
# TASK RETRIEVAL & OBJECT-LEVEL AUTHORIZATION
# -------------------------------------------------------------

def test_admin_can_list_all_tasks():
    admin_token = get_auth_token(ADMIN_EMAIL, PASSWORD)
    headers = {"Authorization": f"Bearer {admin_token}"}

    response = client.get("/api/v1/tasks", headers=headers)
    assert response.status_code == 200
    tasks = response.json()
    assert isinstance(tasks, list)


def test_client_only_sees_own_tasks():
    client_token = get_auth_token(CLIENT_EMAIL, PASSWORD)
    headers = {"Authorization": f"Bearer {client_token}"}

    response = client.get("/api/v1/tasks", headers=headers)
    assert response.status_code == 200
    tasks = response.json()
    for t in tasks:
        assert t["client"] == "Chakankar Digital Innovations"


def test_unknown_task_id_returns_404():
    admin_token = get_auth_token(ADMIN_EMAIL, PASSWORD)
    headers = {"Authorization": f"Bearer {admin_token}"}

    response = client.get("/api/v1/tasks/99999", headers=headers)
    assert response.status_code == 404


# -------------------------------------------------------------
# TASK UPDATE TESTS
# -------------------------------------------------------------

def test_admin_and_employee_can_update_task():
    emp_token = get_auth_token(EMPLOYEE_EMAIL, PASSWORD)
    headers = {"Authorization": f"Bearer {emp_token}"}

    # Create task
    created = client.post("/api/v1/tasks", json={
        "title": "Updatable Motion Clip",
        "priority": "Normal",
        "stage": "To Do"
    }, headers=headers).json()
    task_id = created["task_id"]

    # Update stage from To Do to In Progress
    patch_res = client.patch(f"/api/v1/tasks/{task_id}", json={
        "stage": "In Progress",
        "priority": "High"
    }, headers=headers)
    assert patch_res.status_code == 200
    updated = patch_res.json()
    assert updated["stage"] == "In Progress"
    assert updated["priority"] == "High"


def test_client_cannot_update_task():
    client_token = get_auth_token(CLIENT_EMAIL, PASSWORD)
    headers = {"Authorization": f"Bearer {client_token}"}

    response = client.patch("/api/v1/tasks/1", json={"stage": "Completed"}, headers=headers)
    assert response.status_code in [403, 404]


# -------------------------------------------------------------
# WORKLOAD AGGREGATION TESTS
# -------------------------------------------------------------

def test_admin_can_retrieve_workload_metrics():
    admin_token = get_auth_token(ADMIN_EMAIL, PASSWORD)
    headers = {"Authorization": f"Bearer {admin_token}"}

    response = client.get("/api/v1/workload", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "overallUtilization" in data
    assert "operatives" in data
    assert isinstance(data["operatives"], list)


def test_client_cannot_access_workload_report():
    client_token = get_auth_token(CLIENT_EMAIL, PASSWORD)
    headers = {"Authorization": f"Bearer {client_token}"}

    response = client.get("/api/v1/workload", headers=headers)
    assert response.status_code == 403
