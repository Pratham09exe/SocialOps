from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field, field_validator
import re
from app.models.content import ContentStatus, PlanStatus
from app.core.platforms import normalize_platform

def validate_safe_url(url: str) -> str:
    url_clean = url.strip()
    if not (url_clean.startswith("https://") or url_clean.startswith("http://")):
        raise ValueError("URL must start with https:// or http://")
    if re.search(r"^(javascript|data|vbscript):", url_clean, re.IGNORECASE):
        raise ValueError("Unsafe URL scheme detected")
    return url_clean


# --- Content Plan Schemas ---

class ContentPlanTargetBase(BaseModel):
    category: str = Field(..., max_length=100)
    posts_target: int = Field(0, ge=0)
    stories_target: int = Field(0, ge=0)
    ads_target: int = Field(0, ge=0)

class ContentPlanTargetCreate(ContentPlanTargetBase):
    pass

class ContentPlanTargetResponse(ContentPlanTargetBase):
    target_id: int
    content_plan_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ContentPlanBase(BaseModel):
    client_account_id: int
    report_month: str = Field(..., max_length=20)
    campaign_notes: Optional[str] = None
    status: PlanStatus = PlanStatus.ACTIVE

class ContentPlanCreate(BaseModel):
    client_account_id: Optional[int] = None
    client: Optional[str] = None
    report_month: str = Field(..., max_length=20)
    campaign_notes: Optional[str] = None
    status: Optional[PlanStatus] = PlanStatus.ACTIVE
    targets: Optional[List[ContentPlanTargetCreate]] = None

class ContentPlanUpdate(BaseModel):
    campaign_notes: Optional[str] = None
    status: Optional[PlanStatus] = None

class ContentPlanResponse(ContentPlanBase):
    content_plan_id: int
    client_name: str
    targets: List[ContentPlanTargetResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Content Item Schemas ---

class ContentItemCreate(BaseModel):
    client_account_id: Optional[int] = None
    client: Optional[str] = None  # UI mapping
    plan_id: Optional[int] = None
    assigned_employee_id: Optional[int] = None
    leadCreator: Optional[str] = None  # UI mapping
    title: Optional[str] = None
    content_type: Optional[str] = Field("Reel 9:16", max_length=100)
    targetPlatform: Optional[str] = None  # UI mapping
    platform: Optional[str] = Field("instagram", max_length=50)
    caption: Optional[str] = None
    hashtags: Optional[str] = None
    external_content_url: Optional[str] = None
    driveUrl: Optional[str] = None  # UI mapping
    brief_notes: Optional[str] = None
    internalNotes: Optional[str] = None  # UI mapping
    production_due_date: Optional[date] = None
    scheduled_publish_at: Optional[datetime] = None

    @field_validator("platform")
    @classmethod
    def check_platform(cls, v: Optional[str]) -> Optional[str]:
        if v:
            return normalize_platform(v)
        return "instagram"

    @field_validator("external_content_url", "driveUrl")
    @classmethod
    def check_url(cls, v: Optional[str]) -> Optional[str]:
        if v:
            return validate_safe_url(v)
        return v

class ContentItemUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    platform: Optional[str] = Field(None, max_length=50)
    caption: Optional[str] = None
    hashtags: Optional[str] = None
    external_content_url: Optional[str] = None
    brief_notes: Optional[str] = None
    status: Optional[ContentStatus] = None
    production_due_date: Optional[date] = None
    scheduled_publish_at: Optional[datetime] = None

    @field_validator("platform")
    @classmethod
    def check_platform(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return normalize_platform(v)
        return v

    @field_validator("external_content_url")
    @classmethod
    def check_url(cls, v: Optional[str]) -> Optional[str]:
        if v:
            return validate_safe_url(v)
        return v

class ContentItemResponse(BaseModel):
    content_id: int
    client_account_id: int
    plan_id: Optional[int]
    assigned_employee_id: Optional[int]
    created_by_account_id: int
    title: str
    content_type: str
    platform: str
    caption: Optional[str]
    hashtags: Optional[str]
    external_content_url: str
    brief_notes: Optional[str]  # Stripped for client role in endpoint
    production_due_date: Optional[date]
    scheduled_publish_at: Optional[datetime]
    status: str
    created_at: datetime
    updated_at: datetime

    # UI helpers
    id: str
    client: str
    format: str
    driveUrl: str
    submittedAt: str

    model_config = ConfigDict(from_attributes=True)
