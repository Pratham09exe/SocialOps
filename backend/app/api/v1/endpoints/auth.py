from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.db.session import get_db
from app.models.account import Account, AccountRole, Client
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings
from app.core.permissions import get_current_user, serialize_user_profile
from app.core.validation import normalize_and_validate_gmail
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserProfileResponse

router = APIRouter()

@router.post("/login", response_model=TokenResponse)
def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    # 1. Strict Gmail normalization & domain validation
    normalized_email = normalize_and_validate_gmail(login_data.email)

    # 2. Lookup account by normalized email
    account = db.query(Account).filter(Account.email == normalized_email).first()
    if not account or not verify_password(login_data.password, account.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not account.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is currently inactive. Contact system administrator.",
        )

    # 3. Update last login timestamp
    account.last_login_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(account)

    role_str = account.role.value if hasattr(account.role, 'value') else str(account.role)
    token = create_access_token(
        subject=account.account_id,
        extra_claims={
            "role": role_str.lower(),
            "email": account.email,
            "username": account.username
        }
    )

    user_profile = serialize_user_profile(account)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_profile
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(
    reg_data: RegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Public client onboarding:
    - Strictly accepts @gmail.com addresses only.
    - Prevents self-elevation: strictly assigns CLIENT role (never ADMIN or EMPLOYEE).
    - Enforces uniqueness of email and username.
    """
    normalized_email = normalize_and_validate_gmail(reg_data.email)

    # Check email uniqueness
    existing_email = db.query(Account).filter(Account.email == normalized_email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this Gmail address already exists."
        )

    # Check username uniqueness
    clean_username = reg_data.username.strip().lower()
    existing_user = db.query(Account).filter(Account.username == clean_username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This username is already taken. Please choose another username."
        )

    # Create account strictly with CLIENT role
    new_account = Account(
        email=normalized_email,
        username=clean_username,
        password_hash=get_password_hash(reg_data.password),
        role=AccountRole.CLIENT,
        is_active=True
    )
    db.add(new_account)
    db.flush()

    # Create associated client business profile
    client_profile = Client(
        account_id=new_account.account_id,
        business_name=reg_data.business_name or reg_data.full_name,
        industry=reg_data.industry or "IT / Software / Technology",
        contact_person=reg_data.full_name
    )
    db.add(client_profile)
    db.commit()
    db.refresh(new_account)

    role_str = new_account.role.value if hasattr(new_account.role, 'value') else str(new_account.role)
    token = create_access_token(
        subject=new_account.account_id,
        extra_claims={
            "role": role_str.lower(),
            "email": new_account.email,
            "username": new_account.username
        }
    )

    user_profile = serialize_user_profile(new_account)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_profile
    )


@router.get("/me", response_model=UserProfileResponse)
def get_me(
    current_user: Account = Depends(get_current_user)
):
    return serialize_user_profile(current_user)


@router.post("/logout")
def logout(
    current_user: Account = Depends(get_current_user)
):
    return {"message": "Successfully logged out of SocialOps session"}
