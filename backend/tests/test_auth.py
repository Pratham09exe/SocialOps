from fastapi import status

def test_health_check(client):
    response = client.get("/api/v1/health")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"

# ---------------------------------------------------------------------------
# Gmail Validation Tests
# ---------------------------------------------------------------------------

def test_login_with_yahoo_rejected(client):
    response = client.post("/api/v1/auth/login", json={
        "email": "user@yahoo.com",
        "password": "Password123!"
    })
    assert response.status_code == status.HTTP_400_BAD_REQUEST or response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    detail_str = str(response.json()).lower()
    assert "gmail.com" in detail_str

def test_login_with_outlook_rejected(client):
    response = client.post("/api/v1/auth/login", json={
        "email": "user@outlook.com",
        "password": "Password123!"
    })
    assert response.status_code == status.HTTP_400_BAD_REQUEST or response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    detail_str = str(response.json()).lower()
    assert "gmail.com" in detail_str

def test_login_with_custom_domain_rejected(client):
    response = client.post("/api/v1/auth/login", json={
        "email": "user@company.com",
        "password": "Password123!"
    })
    assert response.status_code == status.HTTP_400_BAD_REQUEST or response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    detail_str = str(response.json()).lower()
    assert "gmail.com" in detail_str

def test_login_invalid_password(client):
    response = client.post("/api/v1/auth/login", json={
        "email": "prathameshnehere@gmail.com",
        "password": "WrongPassword123!"
    })
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "invalid email or password" in response.json()["detail"].lower()

# ---------------------------------------------------------------------------
# Role-Based Login & Dashboard Identity Tests
# ---------------------------------------------------------------------------

def test_admin_login(client):
    response = client.post("/api/v1/auth/login", json={
        "email": "prathameshnehere@gmail.com",
        "password": "Admin@123"
    })
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["role"] == "admin"
    assert data["user"]["email"] == "prathameshnehere@gmail.com"
    assert data["user"]["full_name"] == "Prathamesh Nehere"

def test_employee_login(client):
    response = client.post("/api/v1/auth/login", json={
        "email": "sahilmahale@gmail.com",
        "password": "Admin@123"
    })
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "employee"
    assert data["user"]["email"] == "sahilmahale@gmail.com"
    assert data["user"]["full_name"] == "Sahil Mahale"

def test_client_login(client):
    response = client.post("/api/v1/auth/login", json={
        "email": "saichakankar@gmail.com",
        "password": "Admin@123"
    })
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "client"
    assert data["user"]["email"] == "saichakankar@gmail.com"

# ---------------------------------------------------------------------------
# Strict RBAC Endpoint Access Tests
# ---------------------------------------------------------------------------

def test_admin_accessing_employee_api_forbidden(client):
    """
    Requirement 6: Admin accessing Employee API -> Forbidden (403)
    """
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "prathameshnehere@gmail.com",
        "password": "Admin@123"
    })
    admin_token = admin_login.json()["access_token"]
    res = client.get("/api/v1/employees/me/workspace", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == status.HTTP_403_FORBIDDEN

def test_employee_accessing_admin_api_forbidden(client):
    """
    Requirement 6: Employee accessing Admin API -> Forbidden (403)
    """
    emp_login = client.post("/api/v1/auth/login", json={
        "email": "sahilmahale@gmail.com",
        "password": "Admin@123"
    })
    emp_token = emp_login.json()["access_token"]
    # Attempt to create an employee (Admin-only action)
    res = client.post("/api/v1/employees", json={
        "full_name": "Rogue Staff",
        "email": "rogue.staff@gmail.com",
        "username": "rogue_staff",
        "joining_date": "2026-01-01",
        "department": "Creative",
        "job_title": "Motion Designer"
    }, headers={"Authorization": f"Bearer {emp_token}"})
    assert res.status_code == status.HTTP_403_FORBIDDEN

def test_client_accessing_admin_api_forbidden(client):
    """
    Requirement 6: Client accessing Admin API -> Forbidden (403)
    """
    cli_login = client.post("/api/v1/auth/login", json={
        "email": "saichakankar@gmail.com",
        "password": "Admin@123"
    })
    cli_token = cli_login.json()["access_token"]
    # Attempt to view internal agency staff roster (Admin/Employee only)
    res = client.get("/api/v1/employees", headers={"Authorization": f"Bearer {cli_token}"})
    assert res.status_code == status.HTTP_403_FORBIDDEN

    # Attempt to view internal expenses (Admin only)
    res_exp = client.get("/api/v1/expenses", headers={"Authorization": f"Bearer {cli_token}"})
    assert res_exp.status_code == status.HTTP_403_FORBIDDEN

def test_logout(client):
    login_res = client.post("/api/v1/auth/login", json={
        "email": "prathameshnehere@gmail.com",
        "password": "Admin@123"
    })
    token = login_res.json()["access_token"]
    logout_res = client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout_res.status_code == status.HTTP_200_OK
