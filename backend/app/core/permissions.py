from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.account import Account, AccountRole
from app.core.security import decode_access_token
from app.schemas.auth import UserProfileResponse

security_bearer = HTTPBearer(auto_error=False)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_bearer),
    db: Session = Depends(get_db)
) -> Account:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    account_id = payload.get("sub")
    account = db.query(Account).filter(Account.account_id == account_id).first()
    if not account:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer exists",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not account.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )
    
    return account

def get_current_active_user(
    current_user: Account = Depends(get_current_user)
) -> Account:
    return current_user

def require_role(allowed_roles):
    if isinstance(allowed_roles, (str, AccountRole)):
        roles_list = [allowed_roles]
    else:
        roles_list = list(allowed_roles)

    def role_checker(current_user: Account = Depends(get_current_user)) -> Account:
        user_role_str = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
        normalized_allowed = [
            (r.value if hasattr(r, 'value') else str(r)).lower()
            for r in roles_list
        ]
        if user_role_str.lower() not in normalized_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of {roles_list} roles"
            )
        return current_user
    return role_checker

def serialize_user_profile(account: Account) -> UserProfileResponse:
    role_str = account.role.value if hasattr(account.role, 'value') else str(account.role)
    full_name = account.username
    phone = None
    client_id = None
    role_title = role_str

    if account.admin_profile:
        full_name = account.admin_profile.full_name
        phone = account.admin_profile.phone
        role_title = "Platform Administrator"
    elif account.employee_profile:
        full_name = account.employee_profile.full_name
        phone = account.employee_profile.phone
        role_title = account.employee_profile.job_title
    elif account.client_profile:
        full_name = account.client_profile.contact_person or account.client_profile.business_name
        client_id = account.client_profile.account_id
        role_title = "Client Representative"

    return UserProfileResponse(
        account_id=account.account_id,
        email=account.email,
        username=account.username,
        role=role_str.lower(),
        full_name=full_name,
        phone=phone,
        is_active=account.is_active,
        client_id=client_id,
        role_title=role_title,
        avatar=None
    )
