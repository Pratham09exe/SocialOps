import enum
from sqlalchemy import (
    Column, Integer, String, Text, Date, DateTime,
    ForeignKey, Enum, func, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.db.session import Base

# --- Enums ---
class ContentStatus(str, enum.Enum):
    NEEDS_INTERNAL_REVIEW = "Needs Internal Review"
    CLIENT_REVIEW_REQUIRED = "Client Review Required"
    APPROVED = "Approved"
    URGENT_CHANGES_REQUESTED = "Urgent Changes Requested"
    PUBLISHED = "Published"
    CANCELLED = "Cancelled"

class PlanStatus(str, enum.Enum):
    DRAFT = "Draft"
    ACTIVE = "Active"
    COMPLETED = "Completed"
    ARCHIVED = "Archived"

class ApprovalStage(str, enum.Enum):
    INTERNAL_REVIEW = "Internal Review"
    CLIENT_REVIEW = "Client Review"
    FINAL_SIGNOFF = "Final Signoff"

class ApprovalDecision(str, enum.Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    CHANGES_REQUESTED = "Changes Requested"
    URGENT_CHANGES_REQUESTED = "Urgent Changes Requested"

class FeedbackType(str, enum.Enum):
    REVISION_REQUEST = "Revision Request"
    GENERAL = "General"
    CAMPAIGN = "Campaign"
    PRAISE = "Praise"

class FeedbackStatus(str, enum.Enum):
    OPEN = "Open"
    IN_REVIEW = "In Review"
    RESOLVED = "Resolved"


# --- Models ---

class ContentPlan(Base):
    __tablename__ = "content_plans"

    content_plan_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    client_account_id = Column(Integer, ForeignKey("clients.account_id", ondelete="CASCADE"), nullable=False, index=True)
    report_month = Column(String(20), nullable=False, index=True)  # e.g. "2025-11" or "November 2025"
    campaign_notes = Column(Text, nullable=True)
    status = Column(Enum(PlanStatus, values_callable=lambda x: [e.value for e in x]), nullable=False, default=PlanStatus.ACTIVE)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    client = relationship("Client", back_populates="content_plans")
    targets = relationship("ContentPlanTarget", back_populates="content_plan", cascade="all, delete-orphan")
    content_items = relationship("ContentItem", back_populates="plan")

    def __repr__(self):
        return f"<ContentPlan id={self.content_plan_id} client={self.client_account_id} month={self.report_month}>"


class ContentPlanTarget(Base):
    __tablename__ = "content_plan_targets"

    target_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    content_plan_id = Column(Integer, ForeignKey("content_plans.content_plan_id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(100), nullable=False)  # Brand Awareness, Conversions, Engagement, Product Launch
    posts_target = Column(Integer, nullable=False, default=0)
    stories_target = Column(Integer, nullable=False, default=0)
    ads_target = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationship
    content_plan = relationship("ContentPlan", back_populates="targets")

    __table_args__ = (
        UniqueConstraint("content_plan_id", "category", name="uq_plan_target_category"),
    )

    def __repr__(self):
        return f"<ContentPlanTarget id={self.target_id} plan={self.content_plan_id} category={self.category}>"


class ContentItem(Base):
    __tablename__ = "content_items"

    content_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    client_account_id = Column(Integer, ForeignKey("clients.account_id", ondelete="RESTRICT"), nullable=False, index=True)
    plan_id = Column(Integer, ForeignKey("content_plans.content_plan_id", ondelete="SET NULL"), nullable=True, index=True)
    assigned_employee_id = Column(Integer, ForeignKey("employees.account_id", ondelete="SET NULL"), nullable=True, index=True)
    created_by_account_id = Column(Integer, ForeignKey("accounts.account_id", ondelete="RESTRICT"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    content_type = Column(String(100), nullable=False, default="Reel 9:16")  # Reel 9:16, Carousel 1:1, Story 9:16, Post 4:5
    platform = Column(String(50), nullable=False, default="instagram")  # instagram, facebook, youtube, linkedin, whatsapp_business, x, pinterest
    caption = Column(Text, nullable=True)
    hashtags = Column(Text, nullable=True)
    external_content_url = Column(String(500), nullable=False)  # Manually entered Google Drive link
    brief_notes = Column(Text, nullable=True)  # Internal notes (hidden from clients)
    production_due_date = Column(Date, nullable=True, index=True)
    scheduled_publish_at = Column(DateTime, nullable=True, index=True)
    status = Column(Enum(ContentStatus, values_callable=lambda x: [e.value for e in x]), nullable=False, default=ContentStatus.NEEDS_INTERNAL_REVIEW, index=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    client = relationship("Client", back_populates="content_items")
    plan = relationship("ContentPlan", back_populates="content_items")
    assigned_employee = relationship("Employee", back_populates="assigned_content_items")
    creator = relationship("Account", foreign_keys=[created_by_account_id], back_populates="content_created")
    approvals = relationship("Approval", back_populates="content_item", cascade="all, delete-orphan", order_by="Approval.approval_id.desc()")
    feedbacks = relationship("ClientFeedback", back_populates="content_item")

    def __repr__(self):
        return f"<ContentItem id={self.content_id} title={self.title} status={self.status}>"


class Approval(Base):
    __tablename__ = "approvals"

    approval_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    content_id = Column(Integer, ForeignKey("content_items.content_id", ondelete="CASCADE"), nullable=False, index=True)
    reviewer_account_id = Column(Integer, ForeignKey("accounts.account_id", ondelete="SET NULL"), nullable=True, index=True)
    stage = Column(Enum(ApprovalStage, values_callable=lambda x: [e.value for e in x]), nullable=False, default=ApprovalStage.INTERNAL_REVIEW)
    decision = Column(Enum(ApprovalDecision, values_callable=lambda x: [e.value for e in x]), nullable=False, default=ApprovalDecision.PENDING)
    review_comments = Column(Text, nullable=True)
    submitted_at = Column(DateTime, server_default=func.now(), nullable=False)
    reviewed_at = Column(DateTime, nullable=True)

    # Relationships
    content_item = relationship("ContentItem", back_populates="approvals")
    reviewer = relationship("Account", foreign_keys=[reviewer_account_id], back_populates="approvals_reviewed")

    def __repr__(self):
        return f"<Approval id={self.approval_id} content={self.content_id} stage={self.stage} decision={self.decision}>"


class ClientFeedback(Base):
    __tablename__ = "client_feedbacks"

    feedback_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    client_account_id = Column(Integer, ForeignKey("clients.account_id", ondelete="CASCADE"), nullable=False, index=True)
    content_id = Column(Integer, ForeignKey("content_items.content_id", ondelete="SET NULL"), nullable=True, index=True)
    submitted_by_account_id = Column(Integer, ForeignKey("accounts.account_id", ondelete="RESTRICT"), nullable=False, index=True)
    feedback_type = Column(Enum(FeedbackType, values_callable=lambda x: [e.value for e in x]), nullable=False, default=FeedbackType.REVISION_REQUEST)
    category = Column(String(100), nullable=False, default="Creative Direction")
    description = Column(Text, nullable=False)
    reference_url = Column(String(500), nullable=True)
    rating = Column(Integer, nullable=True)  # 1-5 rating scale
    comments = Column(Text, nullable=True)
    priority = Column(String(50), nullable=False, default="Medium")
    status = Column(Enum(FeedbackStatus, values_callable=lambda x: [e.value for e in x]), nullable=False, default=FeedbackStatus.OPEN)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    client = relationship("Client", back_populates="feedbacks")
    content_item = relationship("ContentItem", back_populates="feedbacks")
    submitted_by = relationship("Account", foreign_keys=[submitted_by_account_id], back_populates="feedback_submitted")
    attachments = relationship("Attachment", foreign_keys="[Attachment.feedback_id]", back_populates="feedback", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ClientFeedback id={self.feedback_id} client={self.client_account_id} type={self.feedback_type}>"


class Attachment(Base):
    __tablename__ = "attachments"

    attachment_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    client_account_id = Column(Integer, ForeignKey("clients.account_id", ondelete="CASCADE"), nullable=True, index=True)
    feedback_id = Column(Integer, ForeignKey("client_feedbacks.feedback_id", ondelete="CASCADE"), nullable=True, index=True)
    expense_id = Column(Integer, ForeignKey("expenses.expense_id", ondelete="SET NULL"), nullable=True, index=True)
    uploaded_by_account_id = Column(Integer, ForeignKey("accounts.account_id", ondelete="RESTRICT"), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    storage_url = Column(String(500), nullable=False)
    mime_type = Column(String(100), nullable=False, default="application/octet-stream")
    file_size_bytes = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    client = relationship("Client", foreign_keys=[client_account_id], back_populates="attachments")
    feedback = relationship("ClientFeedback", foreign_keys=[feedback_id], back_populates="attachments")
    uploader = relationship("Account", foreign_keys=[uploaded_by_account_id], back_populates="attachments_uploaded")
    expense = relationship("Expense", foreign_keys=[expense_id], back_populates="attachments")

    def __repr__(self):
        return f"<Attachment id={self.attachment_id} file={self.file_name}>"
