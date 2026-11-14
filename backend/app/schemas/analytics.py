from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


# ============================================================================
# ACTIVITY LOG SCHEMAS
# ============================================================================

class ActivityLogBase(BaseModel):
    action: str = Field(..., max_length=100)
    action_type: str = Field("primary", max_length=50)  # primary, success, danger, warning, info
    entity_type: Optional[str] = Field(None, max_length=50)
    entity_id: Optional[int] = None
    target: str = Field(..., max_length=255)
    subtext: Optional[str] = None
    ip_address: Optional[str] = Field("127.0.0.1 (Local)", max_length=50)
    client_env: Optional[str] = Field("Active Web Client", max_length=100)


class ActivityLogCreate(ActivityLogBase):
    pass


class ActivityLogResponse(ActivityLogBase):
    model_config = ConfigDict(from_attributes=True)

    log_id: int
    actor_account_id: Optional[int] = None
    actor_name: str
    actor_role: str
    created_at: datetime

    # UI presentation compatibility attributes
    id: str
    time: str
    date: str
    actorName: str
    actorRole: str
    avatar: Optional[str] = None
    initials: Optional[str] = None


# ============================================================================
# NOTIFICATION SCHEMAS
# ============================================================================

class NotificationBase(BaseModel):
    event_type: str = Field(..., max_length=100)
    title: str = Field(..., max_length=200)
    message: str
    entity_type: Optional[str] = Field(None, max_length=50)
    entity_id: Optional[int] = None


class NotificationCreate(NotificationBase):
    recipient_account_id: int
    sender_account_id: Optional[int] = None
    dedup_key: Optional[str] = Field(None, max_length=255)


class NotificationUpdate(BaseModel):
    is_read: bool = True


class NotificationResponse(NotificationBase):
    model_config = ConfigDict(from_attributes=True)

    notification_id: int
    recipient_account_id: int
    sender_account_id: Optional[int] = None
    sender_name: Optional[str] = None
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime
    time_ago: Optional[str] = None


class NotificationSummaryResponse(BaseModel):
    unread_count: int
    total_count: int
    notifications: List[NotificationResponse]


# ============================================================================
# CLIENT MONTHLY METRICS SCHEMAS
# ============================================================================

class ClientMonthlyMetricBase(BaseModel):
    client_account_id: int
    social_account_id: Optional[int] = None
    report_month: str = Field(..., max_length=50)
    source_type: str = Field("Manual Entry", max_length=50)
    likes: int = Field(0, ge=0)
    comments: int = Field(0, ge=0)
    shares: int = Field(0, ge=0)
    profile_visits: int = Field(0, ge=0)
    total_reach: int = Field(0, ge=0)
    impressions: int = Field(0, ge=0)
    engagement_rate: Decimal = Field(Decimal("0.00"), ge=0, le=100)


class ClientMonthlyMetricCreate(ClientMonthlyMetricBase):
    pass


class ClientMonthlyMetricResponse(ClientMonthlyMetricBase):
    model_config = ConfigDict(from_attributes=True)

    metric_id: int
    created_at: datetime
    updated_at: datetime

