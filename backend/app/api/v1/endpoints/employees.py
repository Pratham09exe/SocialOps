from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from app.db.session import get_db
from app.core.permissions import require_role
from app.core.security import get_password_hash
from app.core.validation import normalize_and_validate_gmail
from app.models.account import Account, AccountRole, Employee
from app.models.social import ClientPackageAssignment
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeResponse
from app.core.events import log_activity

router = APIRouter()

# Unsplash avatars for clean UI visuals
SAMPLE_AVATARS = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
]

def format_employee_response(emp: Employee) -> dict:
    account = emp.account
    avatar = SAMPLE_AVATARS[(emp.account_id - 1) % len(SAMPLE_AVATARS)]
    
    # Calculate assigned client accounts from managed assignments
    assigned_brands = []
    if emp.managed_assignments:
        for a in emp.managed_assignments:
            if a.client and a.client.business_name:
                assigned_brands.append(f"@{a.client.business_name.replace(' ', '')}")

    # Estimate workload from hours
    weekly_hrs = min(emp.max_weekly_hours, int(emp.max_weekly_hours * 0.65))
    workload_pct = int((weekly_hrs / max(1, emp.max_weekly_hours)) * 100)

    return {
        "account_id": emp.account_id,
        "email": account.email if account else "",
        "username": account.username if account else "",
        "full_name": emp.full_name,
        "phone": emp.phone,
        "joining_date": emp.joining_date,
        "department": emp.department,
        "job_title": emp.job_title,
        "access_level": emp.access_level,
        "billable_rate": float(emp.billable_rate),
        "max_weekly_hours": emp.max_weekly_hours,
        "is_active": account.is_active if account else True,
        # Frontend UI helpers
        "id": f"EMP-{emp.account_id:04d}",
        "name": emp.full_name,
        "role": emp.job_title,
        "avatar": avatar,
        "workloadPercent": workload_pct,
        "weeklyHours": weekly_hrs,
        "maxHours": emp.max_weekly_hours,
        "billableRate": float(emp.billable_rate),
        "status": "Active" if (account and account.is_active) else "Inactive",
        "assignedAccounts": assigned_brands or ["@MonolithAI", "@ApexPay"]
    }


@router.get("", response_model=List[EmployeeResponse])
def get_employees(
    department: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Account = Depends(require_role([AccountRole.ADMIN, AccountRole.EMPLOYEE]))
):
    """
    List agency employees.
    Admin & Employee roles only. Clients are forbidden (403).
    """
    query = (
        db.query(Employee)
        .join(Account, Employee.account_id == Account.account_id)
        .options(
            joinedload(Employee.account),
            joinedload(Employee.managed_assignments).joinedload(ClientPackageAssignment.client)
        )
    )

    if department and department != "All":
        query = query.filter(Employee.department == department)

    employees = query.all()
    results = []
    for emp in employees:
        formatted = format_employee_response(emp)
        if search:
            s = search.lower()
            if s not in formatted["name"].lower() and s not in formatted["email"].lower() and s not in formatted["role"].lower():
                continue
        results.append(formatted)

    return results


@router.post("", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    payload: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: Account = Depends(require_role([AccountRole.ADMIN]))
):
    """
    Admin only: Create a new employee account and employee profile.
    """
    # Check uniqueness & Gmail domain
    clean_email = normalize_and_validate_gmail(payload.email)
    existing_email = db.query(Account).filter(Account.email == clean_email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Account with this email already exists")

    existing_username = db.query(Account).filter(Account.username == payload.username.strip().lower()).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Account with this username already exists")

    password = payload.password or "SocialOpsStaff2025!"
    hashed_password = get_password_hash(password)

    account = Account(
        email=clean_email,
        username=payload.username.strip().lower(),
        password_hash=hashed_password,
        role=AccountRole.EMPLOYEE,
        is_active=True
    )
    db.add(account)
    db.flush()

    emp = Employee(
        account_id=account.account_id,
        full_name=payload.full_name,
        phone=payload.phone,
        joining_date=payload.joining_date,
        department=payload.department,
        job_title=payload.job_title,
        access_level=payload.access_level,
        billable_rate=payload.billable_rate,
        max_weekly_hours=payload.max_weekly_hours
    )
    db.add(emp)
    db.flush()

    # Phase 6: Activity log
    log_activity(
        db=db,
        actor=current_user,
        action="Staff Roster Updated",
        target=f"Added {emp.full_name}",
        subtext=f"{emp.job_title} • {emp.department}",
        action_type="primary",
        entity_type="Employee",
        entity_id=emp.account_id
    )

    db.commit()
    db.refresh(emp)

    return format_employee_response(emp)


@router.get("/me/workspace")
def get_employee_workspace(
    db: Session = Depends(get_db),
    current_user: Account = Depends(require_role([AccountRole.EMPLOYEE]))
):
    """
    Employee-only workspace API:
    Admin and Client roles are strictly forbidden (403).
    """
    emp = db.query(Employee).filter(Employee.account_id == current_user.account_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    return {
        "employee_id": emp.account_id,
        "name": emp.full_name,
        "department": emp.department,
        "job_title": emp.job_title,
        "access_level": emp.access_level,
        "max_weekly_hours": emp.max_weekly_hours
    }


@router.get("/{account_id}", response_model=EmployeeResponse)
def get_employee_by_id(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: Account = Depends(require_role([AccountRole.ADMIN, AccountRole.EMPLOYEE]))
):
    """
    Retrieve single employee details. Admin and Employee only.
    """
    emp = (
        db.query(Employee)
        .options(
            joinedload(Employee.account),
            joinedload(Employee.managed_assignments).joinedload(ClientPackageAssignment.client)
        )
        .filter(Employee.account_id == account_id)
        .first()
    )

    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    return format_employee_response(emp)


@router.patch("/{account_id}", response_model=EmployeeResponse)
def update_employee(
    account_id: int,
    payload: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: Account = Depends(require_role([AccountRole.ADMIN]))
):
    """
    Admin only: Update employee details or status.
    """
    emp = (
        db.query(Employee)
        .options(
            joinedload(Employee.account),
            joinedload(Employee.managed_assignments).joinedload(ClientPackageAssignment.client)
        )
        .filter(Employee.account_id == account_id)
        .first()
    )

    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    if payload.full_name is not None:
        emp.full_name = payload.full_name
    if payload.phone is not None:
        emp.phone = payload.phone
    if payload.department is not None:
        emp.department = payload.department
    if payload.job_title is not None:
        emp.job_title = payload.job_title
    if payload.access_level is not None:
        emp.access_level = payload.access_level
    if payload.billable_rate is not None:
        emp.billable_rate = payload.billable_rate
    if payload.max_weekly_hours is not None:
        emp.max_weekly_hours = payload.max_weekly_hours

    if payload.is_active is not None:
        emp.account.is_active = payload.is_active

    db.commit()
    db.refresh(emp)

    return format_employee_response(emp)
