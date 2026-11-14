from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Numeric, Boolean, ForeignKey, func, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.db.session import Base


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    log_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    actor_account_id = Column(Integer, ForeignKey("accounts.account_id", ondelete="SET NULL"), nullable=True, index=True)
    actor_name = Column(String(150), nullable=False)
    actor_role = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False, index=True)
    action_type = Column(String(50), nullable=False, default="primary")  # primary, success, danger, warning, info
    entity_type = Column(String(50), nullable=True, index=True)          # Task, ContentItem, Approval, Invoice, etc.
    entity_id = Column(Integer, nullable=True, index=True)
    target = Column(String(255), nullable=False)
    subtext = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True, default="127.0.0.1 (Local)")
    client_env = Column(String(100), nullable=True, default="Active Web Client")
    created_at = Column(DateTime, server_default=func.now(), nullable=False, index=True)

    # Relationship
    actor = relationship("Account", foreign_keys=[actor_account_id], back_populates="activity_logs")

    def __repr__(self):
        return f"<ActivityLog id={self.log_id} actor={self.actor_name} action={self.action} target={self.target}>"


class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    recipient_account_id = Column(Integer, ForeignKey("accounts.account_id", ondelete="CASCADE"), nullable=False, index=True)
    sender_account_id = Column(Integer, ForeignKey("accounts.account_id", ondelete="SET NULL"), nullable=True, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    entity_type = Column(String(50), nullable=True, index=True)
    entity_id = Column(Integer, nullable=True, index=True)
    is_read = Column(Boolean, nullable=False, default=False, index=True)
    read_at = Column(DateTime, nullable=True)
    dedup_key = Column(String(255), nullable=True, index=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False, index=True)

    # Relationships
    recipient = relationship("Account", foreign_keys=[recipient_account_id], back_populates="notifications")
    sender = relationship("Account", foreign_keys=[sender_account_id])

    def __repr__(self):
        return f"<Notification id={self.notification_id} recipient={self.recipient_account_id} title={self.title}>"


class ClientMonthlyMetric(Base):
    __tablename__ = "client_monthly_metrics"

    metric_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    client_account_id = Column(Integer, ForeignKey("clients.account_id", ondelete="CASCADE"), nullable=False, index=True)
    social_account_id = Column(Integer, ForeignKey("client_social_accounts.social_account_id", ondelete="SET NULL"), nullable=True, index=True)
    report_month = Column(String(50), nullable=False, index=True)  # e.g., "October 2025" or "2025-10"
    source_type = Column(String(50), nullable=False, default="Manual Entry")  # Manual Entry, Platform Export, Agency Audit
    likes = Column(Integer, nullable=False, default=0)
    comments = Column(Integer, nullable=False, default=0)
    shares = Column(Integer, nullable=False, default=0)
    profile_visits = Column(Integer, nullable=False, default=0)
    total_reach = Column(Integer, nullable=False, default=0)
    impressions = Column(Integer, nullable=False, default=0)
    engagement_rate = Column(Numeric(5, 2), nullable=False, default=0.00)  # Percentage, e.g. 4.85%
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    client = relationship("Client", foreign_keys=[client_account_id], back_populates="monthly_metrics")
    social_account = relationship("ClientSocialAccount", foreign_keys=[social_account_id], back_populates="monthly_metrics")

    __table_args__ = (
        UniqueConstraint('client_account_id', 'social_account_id', 'report_month', name='uq_client_social_month_metric'),
    )

    def __repr__(self):
        return f"<ClientMonthlyMetric id={self.metric_id} client={self.client_account_id} month={self.report_month} reach={self.total_reach}>"
