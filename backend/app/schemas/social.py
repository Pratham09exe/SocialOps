from datetime import date
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.core.platforms import normalize_platform

# --- Client Social Account Schemas ---
class ClientSocialAccountBase(BaseModel):
    platform: str = Field(..., max_length=50)
    handle: str = Field(..., max_length=100)
    page_url: Optional[str] = Field(None, max_length=255)
    is_active: bool = True

class ClientSocialAccountCreate(ClientSocialAccountBase):
    client_account_id: Optional[int] = None

    @field_validator("platform")
    @classmethod
    def validate_platform(cls, v: str) -> str:
        return normalize_platform(v)

class ClientSocialAccountUpdate(BaseModel):
    platform: Optional[str] = Field(None, max_length=50)
    handle: Optional[str] = Field(None, max_length=100)
    page_url: Optional[str] = Field(None, max_length=255)
    is_active: Optional[bool] = None

    @field_validator("platform")
    @classmethod
    def validate_platform(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return normalize_platform(v)
        return v

class ClientSocialAccountResponse(ClientSocialAccountBase):
    social_account_id: int
    client_account_id: int

    model_config = ConfigDict(from_attributes=True)


# --- Package Schemas ---
class PackageBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    monthly_price: Decimal = Field(..., ge=0)
    platforms_included: str = Field("3 platforms", max_length=100)
    account_manager_included: bool = True
    performance_report_included: bool = True
    paid_ads_included: bool = False
    influencer_coordination: bool = False
    reels_per_month: int = Field(8, ge=0)
    posts_per_month: int = Field(16, ge=0)
    stories_per_month: int = Field(30, ge=0)
    revision_rounds: int = Field(2, ge=0)
    is_active: bool = True

class PackageCreate(PackageBase):
    pass

class PackageUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    monthly_price: Optional[Decimal] = Field(None, ge=0)
    platforms_included: Optional[str] = None
    account_manager_included: Optional[bool] = None
    performance_report_included: Optional[bool] = None
    paid_ads_included: Optional[bool] = None
    influencer_coordination: Optional[bool] = None
    reels_per_month: Optional[int] = None
    posts_per_month: Optional[int] = None
    stories_per_month: Optional[int] = None
    revision_rounds: Optional[int] = None
    is_active: Optional[bool] = None

class PackageResponse(PackageBase):
    package_id: int

    model_config = ConfigDict(from_attributes=True)


# --- Client Package Assignment Schemas ---
class ClientPackageAssignmentBase(BaseModel):
    client_account_id: int
    package_id: int
    account_manager_employee_id: Optional[int] = None
    start_date: date
    end_date: Optional[date] = None
    billing_cycle: str = Field("Monthly", max_length=50)
    agreed_monthly_price: Decimal = Field(..., ge=0)
    status: str = Field("Active", max_length=50)

class ClientPackageAssignmentCreate(ClientPackageAssignmentBase):
    pass

class ClientPackageAssignmentUpdate(BaseModel):
    package_id: Optional[int] = None
    account_manager_employee_id: Optional[int] = None
    end_date: Optional[date] = None
    billing_cycle: Optional[str] = None
    agreed_monthly_price: Optional[Decimal] = None
    status: Optional[str] = None

class ClientPackageAssignmentResponse(ClientPackageAssignmentBase):
    assignment_id: int
    package_name: Optional[str] = None
    account_manager_name: Optional[str] = None
    business_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
