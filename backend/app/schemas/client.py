from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from app.schemas.social import ClientSocialAccountResponse, ClientPackageAssignmentResponse

class ClientBase(BaseModel):
    business_name: str = Field(..., max_length=200)
    industry: str = Field(..., max_length=100)
    brand_description: Optional[str] = None
    contact_person: Optional[str] = Field(None, max_length=150)

class ClientCreate(ClientBase):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    password: Optional[str] = Field(None, min_length=6)
    package_id: Optional[int] = None
    account_manager_employee_id: Optional[int] = None
    agreed_monthly_price: Optional[float] = None
    # UI convenience fields that can map automatically
    tier: Optional[str] = None
    monthly_retainer: Optional[float] = None

    @field_validator("email")
    @classmethod
    def validate_gmail(cls, v: str) -> str:
        if not v or not isinstance(v, str):
            raise ValueError("Email address is required.")
        cleaned = v.strip().lower()
        if not cleaned.endswith("@gmail.com"):
            raise ValueError("Only @gmail.com email addresses are permitted on SocialOps. Please enter a valid Gmail address.")
        return cleaned

class ClientUpdate(BaseModel):
    business_name: Optional[str] = Field(None, max_length=200)
    industry: Optional[str] = Field(None, max_length=100)
    brand_description: Optional[str] = None
    contact_person: Optional[str] = Field(None, max_length=150)
    is_active: Optional[bool] = None

class ClientResponse(ClientBase):
    account_id: int
    email: str
    username: str
    is_active: bool
    created_at: datetime
    social_accounts: List[ClientSocialAccountResponse] = []
    package_assignments: List[ClientPackageAssignmentResponse] = []

    # Frontend display helpers
    id: str
    code: str
    name: str
    initials: str
    tier: str
    sector: str
    accountLead: Optional[str] = None
    monthlyRetainer: float = 0.0
    activeCampaignsCount: int = 0
    activeAssetsCount: int = 0
    renewalDate: Optional[str] = None
    healthScore: int = 95
    healthStatus: str = "Health"

    model_config = ConfigDict(from_attributes=True)
