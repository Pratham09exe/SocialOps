from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from app.db.session import get_db
from app.core.permissions import get_current_user, require_role
from app.core.security import get_password_hash
from app.core.validation import normalize_and_validate_gmail
from app.models.account import Account, AccountRole, Client
from app.models.social import Package, ClientPackageAssignment, AssignmentStatus
from app.schemas.client import ClientCreate, ClientUpdate, ClientResponse
from app.schemas.social import ClientSocialAccountResponse, ClientPackageAssignmentResponse
from app.core.events import log_activity

router = APIRouter()

def format_client_response(client: Client) -> dict:
    account = client.account
    active_assignment = None
    if client.package_assignments:
        active_assignment = next((a for a in client.package_assignments if a.status == AssignmentStatus.ACTIVE), client.package_assignments[0])

    tier_name = active_assignment.package.name if (active_assignment and active_assignment.package) else "Growth"
    account_lead_name = active_assignment.account_manager.full_name if (active_assignment and active_assignment.account_manager) else None
    monthly_price = float(active_assignment.agreed_monthly_price) if active_assignment else 15000.0

    social_list = [
        ClientSocialAccountResponse(
            social_account_id=s.social_account_id,
            client_account_id=s.client_account_id,
            platform=s.platform,
            handle=s.handle,
            page_url=s.page_url
        ) for s in (client.social_accounts or [])
    ]

    assignments_list = [
        ClientPackageAssignmentResponse(
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
            business_name=client.business_name
        ) for a in (client.package_assignments or [])
    ]

    # Calculate initials
    words = client.business_name.strip().split()
    if len(words) >= 2:
        initials = (words[0][0] + words[1][0]).upper()
    elif len(words) == 1 and len(words[0]) >= 2:
        initials = words[0][:2].upper()
    else:
        initials = "CL"

    return {
        "account_id": client.account_id,
        "email": account.email if account else "",
        "username": account.username if account else "",
        "is_active": account.is_active if account else True,
        "business_name": client.business_name,
        "industry": client.industry,
        "brand_description": client.brand_description,
        "contact_person": client.contact_person,
        "created_at": account.created_at if account else client.account.created_at,
        "social_accounts": social_list,
        "package_assignments": assignments_list,
        # Frontend UI helpers
        "id": str(client.account_id),
        "code": f"CLIENT-ID #{client.account_id:04d}",
        "name": client.business_name,
        "initials": initials,
        "tier": tier_name,
        "sector": client.industry,
        "contactPerson": client.contact_person,
        "brandDescription": client.brand_description,
        "accountLead": account_lead_name or "Sahil Mahale",
        "monthlyRetainer": monthly_price,
        "activeCampaignsCount": len(client.social_accounts or []) * 2 or 4,
        "activeAssetsCount": len(client.social_accounts or []) * 6 or 12,
        "renewalDate": (active_assignment.end_date.strftime("%b %d, %Y") if active_assignment and active_assignment.end_date else "Nov 30, 2025"),
        "healthScore": 95,
        "healthStatus": "Health"
    }


@router.get("", response_model=List[ClientResponse])
def get_clients(
    tier: Optional[str] = Query(None),
    sector: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    List clients with object-level authorization:
    - Admin & Employee: Can view all clients.
    - Client: Can ONLY view their own client profile.
    """
    query = (
        db.query(Client)
        .join(Account, Client.account_id == Account.account_id)
        .options(
            joinedload(Client.account),
            joinedload(Client.social_accounts),
            joinedload(Client.package_assignments).joinedload(ClientPackageAssignment.package),
            joinedload(Client.package_assignments).joinedload(ClientPackageAssignment.account_manager)
        )
    )

    # Object-level authorization for Client role
    if current_user.role == AccountRole.CLIENT:
        query = query.filter(Client.account_id == current_user.account_id)
    
    clients = query.all()

    # In-memory filtering if requested
    results = []
    for c in clients:
        formatted = format_client_response(c)
        if tier and tier != "All" and formatted["tier"].lower() != tier.lower():
            continue
        if sector and sector != "All" and formatted["sector"].lower() != sector.lower():
            continue
        if search:
            s = search.lower()
            if s not in formatted["name"].lower() and s not in formatted["code"].lower():
                continue
        results.append(formatted)

    return results


@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
def create_client(
    payload: ClientCreate,
    db: Session = Depends(get_db),
    current_user: Account = Depends(require_role([AccountRole.ADMIN]))
):
    """
    Admin only: Create a new client account and client profile.
    Automatically assigns initial package if requested.
    """
    # Check email / username uniqueness & Gmail validation
    clean_email = normalize_and_validate_gmail(payload.email)
    existing_email = db.query(Account).filter(Account.email == clean_email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Account with this email already exists")

    clean_username = payload.username.strip().lower()
    existing_username = db.query(Account).filter(Account.username == clean_username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Account with this username already exists")

    password = payload.password or "SocialOps2025!"
    hashed_password = get_password_hash(password)

    # Create account
    account = Account(
        email=clean_email,
        username=clean_username,
        password_hash=hashed_password,
        role=AccountRole.CLIENT,
        is_active=True
    )
    db.add(account)
    db.flush()

    # Create client profile
    client = Client(
        account_id=account.account_id,
        business_name=payload.business_name,
        industry=payload.industry,
        brand_description=payload.brand_description,
        contact_person=payload.contact_person
    )
    db.add(client)
    db.flush()

    # Handle package assignment if package_id or tier provided
    package = None
    if payload.package_id:
        package = db.query(Package).filter(Package.package_id == payload.package_id).first()
    elif payload.tier:
        package = db.query(Package).filter(Package.name.ilike(f"%{payload.tier}%")).first()

    if not package:
        # Fallback to first available package or create Starter
        package = db.query(Package).first()

    if package:
        monthly_price = payload.agreed_monthly_price or payload.monthly_retainer or float(package.monthly_price)
        assignment = ClientPackageAssignment(
            client_account_id=client.account_id,
            package_id=package.package_id,
            account_manager_employee_id=payload.account_manager_employee_id,
            start_date=date.today(),
            billing_cycle="Monthly",
            agreed_monthly_price=monthly_price,
            status=AssignmentStatus.ACTIVE
        )
        db.add(assignment)

    # Phase 6: Activity log
    log_activity(
        db=db,
        actor=current_user,
        action="Client Onboarded",
        target=client.business_name,
        subtext=f"Industry: {client.industry} • Contact: {client.contact_person or client.business_name}",
        action_type="success",
        entity_type="Client",
        entity_id=client.account_id
    )

    db.commit()
    db.refresh(client)

    return format_client_response(client)


@router.get("/{account_id}", response_model=ClientResponse)
def get_client_by_id(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    Retrieve single client details.
    Object-level authorization: Clients can only access their own profile.
    """
    if current_user.role == AccountRole.CLIENT and current_user.account_id != account_id:
        raise HTTPException(status_code=403, detail="Access denied: You can only view your own client profile")

    client = (
        db.query(Client)
        .options(
            joinedload(Client.account),
            joinedload(Client.social_accounts),
            joinedload(Client.package_assignments).joinedload(ClientPackageAssignment.package),
            joinedload(Client.package_assignments).joinedload(ClientPackageAssignment.account_manager)
        )
        .filter(Client.account_id == account_id)
        .first()
    )

    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    return format_client_response(client)


@router.patch("/{account_id}", response_model=ClientResponse)
def update_client(
    account_id: int,
    payload: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    Update client details.
    - Admin: Can update any field, including is_active.
    - Client: Can update their own profile fields only.
    - Employee: Read-only access to client settings.
    """
    if current_user.role == AccountRole.EMPLOYEE:
        raise HTTPException(status_code=403, detail="Employees cannot modify client records")

    if current_user.role == AccountRole.CLIENT and current_user.account_id != account_id:
        raise HTTPException(status_code=403, detail="Access denied: You can only modify your own profile")

    client = (
        db.query(Client)
        .options(
            joinedload(Client.account),
            joinedload(Client.social_accounts),
            joinedload(Client.package_assignments).joinedload(ClientPackageAssignment.package),
            joinedload(Client.package_assignments).joinedload(ClientPackageAssignment.account_manager)
        )
        .filter(Client.account_id == account_id)
        .first()
    )

    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    if payload.business_name is not None:
        client.business_name = payload.business_name
    if payload.industry is not None:
        client.industry = payload.industry
    if payload.brand_description is not None:
        client.brand_description = payload.brand_description
    if payload.contact_person is not None:
        client.contact_person = payload.contact_person

    # Admin only field
    if payload.is_active is not None and current_user.role == AccountRole.ADMIN:
        client.account.is_active = payload.is_active

    db.commit()
    db.refresh(client)

    return format_client_response(client)
