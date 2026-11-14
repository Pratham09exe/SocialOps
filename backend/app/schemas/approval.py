from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.content import ApprovalDecision

class ApprovalReviewRequest(BaseModel):
    decision: ApprovalDecision
    review_comments: Optional[str] = None
    feedbackNotes: Optional[str] = None  # UI alias

class ApprovalResponse(BaseModel):
    approval_id: int
    content_id: int
    reviewer_account_id: Optional[int]
    stage: str
    decision: str
    review_comments: Optional[str]
    submitted_at: datetime
    reviewed_at: Optional[datetime]

    # Enriched content metadata & UI compatibility fields
    id: str
    client: str
    format: str
    slaRemaining: str
    slaUrgent: bool
    status: str
    category: str
    title: str
    description: str
    submittedDate: str
    leadCreator: str
    qaStatus: str
    qaType: str
    revisionCycle: str
    thumbnail: str
    mediaDuration: str
    driveUrl: str
    feedback: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
