from pydantic import BaseModel, field_validator
from typing import Optional

class LoginRequest(BaseModel):
    email: str
    password: str
    remember_device: Optional[bool] = True

    @field_validator("email")
    @classmethod
    def validate_gmail(cls, v: str) -> str:
        if not v or not isinstance(v, str):
            raise ValueError("Email address is required.")
        cleaned = v.strip().lower()
        if not cleaned.endswith("@gmail.com"):
            raise ValueError("Only @gmail.com email addresses are permitted on SocialOps. Please enter a valid Gmail address.")
        return cleaned

class RegisterRequest(BaseModel):
    email: str
    username: str
    password: str
    full_name: str
    business_name: Optional[str] = None
    industry: Optional[str] = "IT / Software / Technology"

    @field_validator("email")
    @classmethod
    def validate_gmail(cls, v: str) -> str:
        if not v or not isinstance(v, str):
            raise ValueError("Email address is required.")
        cleaned = v.strip().lower()
        if not cleaned.endswith("@gmail.com"):
            raise ValueError("Only @gmail.com email addresses are permitted on SocialOps. Please enter a valid Gmail address.")
        return cleaned

class UserProfileResponse(BaseModel):
    account_id: int
    email: str
    username: str
    role: str
    full_name: str
    phone: Optional[str] = None
    is_active: bool
    client_id: Optional[int] = None
    avatar: Optional[str] = None
    role_title: Optional[str] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserProfileResponse
