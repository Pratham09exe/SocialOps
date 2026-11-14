from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from app.db.session import get_db
from app.core.permissions import get_current_user, require_role
from app.models.account import Account, AccountRole, Client, Employee
from app.models.social import ClientSocialAccount, Package, ClientPackageAssignment
from app.schemas.social import (
    ClientSocialAccountCreate, ClientSocialAccountUpdate, ClientSocialAccountResponse,
    PackageCreate, PackageUpdate, PackageResponse,
    ClientPackageAssignmentCreate, ClientPackageAssignmentResponse
)

router = APIRouter()

# -------------------------------------------------------------
# CLIENT SOCIAL ACCOUNTS
# -------------------------------------------------------------

@router.get("/social-accounts", response_model=List[ClientSocialAccountResponse])
def get_social_accounts(
    client_id: Optional[int] = Query(None),
    active_only: bool = Query(True, description="Filter only active social platform accounts"),
    db: Session = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    List social accounts with object-level authorization:
    - Client role can only see their own social accounts.
    - Admin/Employee can filter by client_id or see all.
    - Filters active_only by default to exclude deprecated platforms.
    """
    query = db.query(ClientSocialAccount)

    if active_only:
        query = query.filter(ClientSocialAccount.is_active.is_(True))

    if current_user.role == AccountRole.CLIENT:
        query = query.filter(ClientSocialAccount.client_account_id == current_user.account_id)
    elif client_id:
        query = query.filter(ClientSocialAccount.client_account_id == client_id)

    return query.all()


@router.post("/social-accounts", response_model=ClientSocialAccountResponse, status_code=status.HTTP_201_CREATED)
def create_social_account(
    payload: ClientSocialAccountCreate,
    db: Session = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    Link a social account to a client:
    - Client can only link to their own account.
    - Admin/Employee can link to any valid client.
    """
    target_client_id = payload.client_account_id
    if current_user.role == AccountRole.CLIENT:
        target_client_id = current_user.account_id
    elif not target_client_id:
        raise HTTPException(status_code=400, detail="client_account_id is required")

    # Validate target client exists
    client = db.query(Client).filter(Client.account_id == target_client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Target client account not found")

    social_acc = ClientSocialAccount(
        client_account_id=target_client_id,
        platform=payload.platform,
        handle=payload.handle,
        page_url=payload.page_url
    )
    db.add(social_acc)
    db.commit()
    db.refresh(social_acc)
    return social_acc


@router.patch("/social-accounts/{social_account_id}", response_model=ClientSocialAccountResponse)
def update_social_account(
    social_account_id: int,
    payload: ClientSocialAccountUpdate,
    db: Session = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    Update a social account. Object-level authorization enforced.
    """
    social_acc = db.query(ClientSocialAccount).filter(ClientSocialAccount.social_account_id == social_account_id).first()
    if not social_acc:
        raise HTTPException(status_code=404, detail="Social account not found")

    if current_user.role == AccountRole.CLIENT and social_acc.client_account_id != current_user.account_id:
        raise HTTPException(status_code=403, detail="Access denied: Cannot modify another client's social account")

    if payload.platform is not None:
        social_acc.platform = payload.platform
    if payload.handle is not None:
        social_acc.handle = payload.handle
    if payload.page_url is not None:
        social_acc.page_url = payload.page_url
    if payload.is_active is not None:
        social_acc.is_active = payload.is_active

    db.commit()
    db.refresh(social_acc)
    return social_acc


@router.delete("/social-accounts/{social_account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_social_account(
    social_account_id: int,
    db: Session = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    Delete a social account. Object-level authorization enforced.
    """
    social_acc = db.query(ClientSocialAccount).filter(ClientSocialAccount.social_account_id == social_account_id).first()
    if not social_acc:
        raise HTTPException(status_code=404, detail="Social account not found")

    if current_user.role == AccountRole.CLIENT and social_acc.client_account_id != current_user.account_id:
        raise HTTPException(status_code=403, detail="Access denied: Cannot delete another client's social account")

    db.delete(social_acc)
    db.commit()
    return None


# -------------------------------------------------------------
# PACKAGES
# -------------------------------------------------------------

@router.get("/packages", response_model=List[PackageResponse])
def get_packages(
    active_only: bool = Query(True),
    db: Session = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    List available agency packages. Accessible by all authenticated roles.
    """
    query = db.query(Package)
    if active_only:
        query = query.filter(Package.is_active == True)
    return query.all()


@router.post("/packages", response_model=PackageResponse, status_code=status.HTTP_201_CREATED)
def create_package(
    payload: PackageCreate,
    db: Session = Depends(get_db),
    current_user: Account = Depends(require_role([AccountRole.ADMIN]))
):
    """
    Admin only: Create a new agency service package.
    """
    existing = db.query(Package).filter(Package.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Package with this name already exists")

    package = Package(**payload.model_dump())
    db.add(package)
    db.commit()
    db.refresh(package)
    return package


@router.patch("/packages/{package_id}", response_model=PackageResponse)
def update_package(
    package_id: int,
    payload: PackageUpdate,
    db: Session = Depends(get_db),
    current_user: Account = Depends(require_role([AccountRole.ADMIN]))
):
    """
    Admin only: Update package details.
    """
    package = db.query(Package).filter(Package.package_id == package_id).first()
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(package, field, val)

    db.commit()
    db.refresh(package)
    return package


# -------------------------------------------------------------
# CLIENT PACKAGE ASSIGNMENTS
# -------------------------------------------------------------

@router.get("/package-assignments", response_model=List[ClientPackageAssignmentResponse])
def get_package_assignments(
    client_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    List package assignments:
    - Client sees only their assignments.
    - Admin and Employee can view all or filter by client.
    """
    query = (
        db.query(ClientPackageAssignment)
        .options(
            joinedload(ClientPackageAssignment.package),
            joinedload(ClientPackageAssignment.account_manager),
            joinedload(ClientPackageAssignment.client)
        )
    )

    if current_user.role == AccountRole.CLIENT:
        query = query.filter(ClientPackageAssignment.client_account_id == current_user.account_id)
    elif client_id:
        query = query.filter(ClientPackageAssignment.client_account_id == client_id)

    if status_filter:
        query = query.filter(ClientPackageAssignment.status == status_filter)

    assignments = query.all()
    results = []
    for a in assignments:
        results.append(ClientPackageAssignmentResponse(
            assignment_id=a.assignment_id,
            client_account_id=a.client_account_id,
            package_id=a.package_id,
            account_manager_employee_id=a.account_manager_employee_id,
            start_date=a.start_date,
            end_date=a.end_date,
            billing_cycle=a.billing_cycle,
            agreed_monthly_price=a.agreed_monthly_price,
            status=a.status.value if hasattr(a.status, 'value') else str(a.status),
            package_name=a.package.name if a.package else None,
            account_manager_name=a.account_manager.full_name if a.account_manager else None,
            business_name=a.client.business_name if a.client else None
        ))
    return results


@router.post("/package-assignments", response_model=ClientPackageAssignmentResponse, status_code=status.HTTP_201_CREATED)
def create_package_assignment(
    payload: ClientPackageAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: Account = Depends(require_role([AccountRole.ADMIN]))
):
    """
    Admin only: Assign a package to a client.
    """
    client = db.query(Client).filter(Client.account_id == payload.client_account_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    package = db.query(Package).filter(Package.package_id == payload.package_id).first()
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")

    if payload.account_manager_employee_id:
        emp = db.query(Employee).filter(Employee.account_id == payload.account_manager_employee_id).first()
        if not emp:
            raise HTTPException(status_code=404, detail="Assigned account manager employee not found")

    assignment = ClientPackageAssignment(
        client_account_id=payload.client_account_id,
        package_id=payload.package_id,
        account_manager_employee_id=payload.account_manager_employee_id,
        start_date=payload.start_date,
        end_date=payload.end_date,
        billing_cycle=payload.billing_cycle,
        agreed_monthly_price=payload.agreed_monthly_price,
        status=payload.status
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return ClientPackageAssignmentResponse(
        assignment_id=assignment.assignment_id,
        client_account_id=assignment.client_account_id,
        package_id=assignment.package_id,
        account_manager_employee_id=assignment.account_manager_employee_id,
        start_date=assignment.start_date,
        end_date=assignment.end_date,
        billing_cycle=assignment.billing_cycle,
        agreed_monthly_price=assignment.agreed_monthly_price,
        status=assignment.status.value if hasattr(assignment.status, 'value') else str(assignment.status),
        package_name=package.name,
        account_manager_name=assignment.account_manager.full_name if assignment.account_manager else None,
        business_name=client.business_name
    )
