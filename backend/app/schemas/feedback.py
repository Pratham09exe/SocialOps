from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.content import FeedbackType, FeedbackStatus

class ClientFeedbackCreate(BaseModel):
    client_account_id: Optional[int] = None
    content_id: Optional[int] = None
    feedback_type: Optional[FeedbackType] = FeedbackType.REVISION_REQUEST
    category: Optional[str] = Field("Creative Direction", max_length=100)
    description: str = Field(..., min_length=1)
    reference_url: Optional[str] = Field(None, max_length=500)
    rating: Optional[int] = Field(None, ge=1, le=5)
    comments: Optional[str] = None
    priority: Optional[str] = Field("Medium", max_length=50)

class ClientFeedbackUpdate(BaseModel):
    status: Optional[FeedbackStatus] = None
    comments: Optional[str] = None
    priority: Optional[str] = None

class ClientFeedbackResponse(BaseModel):
    feedback_id: int
    client_account_id: int
    content_id: Optional[int]
    submitted_by_account_id: int
    feedback_type: str
    category: str
    description: str
    reference_url: Optional[str]
    rating: Optional[int]
    comments: Optional[str]
    priority: str
    status: str
    created_at: datetime
    client_name: str
    submitted_by_name: str

    model_config = ConfigDict(from_attributes=True)
