import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Numeric, Text, ForeignKey, Enum, func
from sqlalchemy.orm import relationship
from app.db.session import Base

class AccountRole(str, enum.Enum):
    ADMIN = "Admin"
    EMPLOYEE = "Employee"
    CLIENT = "Client"

class Account(Base):
    __tablename__ = "accounts"

    account_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(AccountRole, values_callable=lambda x: [e.value for e in x]), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    last_login_at = Column(DateTime, nullable=True)

    # ISA Specialization relationships (1-to-1)
    admin_profile = relationship("Admin", back_populates="account", uselist=False, cascade="all, delete-orphan")
    employee_profile = relationship("Employee", back_populates="account", uselist=False, cascade="all, delete-orphan")
    client_profile = relationship("Client", back_populates="account", uselist=False, cascade="all, delete-orphan")
    tasks_created = relationship("Task", foreign_keys="Task.created_by_account_id", back_populates="creator")
    content_created = relationship("ContentItem", foreign_keys="ContentItem.created_by_account_id", back_populates="creator")
    approvals_reviewed = relationship("Approval", foreign_keys="Approval.reviewer_account_id", back_populates="reviewer")
    feedback_submitted = relationship("ClientFeedback", foreign_keys="ClientFeedback.submitted_by_account_id", back_populates="submitted_by")
    attachments_uploaded = relationship("Attachment", foreign_keys="Attachment.uploaded_by_account_id", back_populates="uploader")
    payments_received = relationship("Payment", foreign_keys="Payment.received_by_account_id", back_populates="received_by")
    expenses_created = relationship("Expense", foreign_keys="Expense.created_by_account_id", back_populates="created_by")
    activity_logs = relationship("ActivityLog", foreign_keys="ActivityLog.actor_account_id", back_populates="actor")
    notifications = relationship("Notification", foreign_keys="Notification.recipient_account_id", back_populates="recipient", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Account id={self.account_id} email={self.email} role={self.role}>"


class Admin(Base):
    __tablename__ = "admins"

    account_id = Column(Integer, ForeignKey("accounts.account_id", ondelete="CASCADE"), primary_key=True)
    full_name = Column(String(150), nullable=False)
    phone = Column(String(30), nullable=True)

    account = relationship("Account", back_populates="admin_profile")

    def __repr__(self):
        return f"<Admin account_id={self.account_id} name={self.full_name}>"


class Employee(Base):
    __tablename__ = "employees"

    account_id = Column(Integer, ForeignKey("accounts.account_id", ondelete="CASCADE"), primary_key=True)
    full_name = Column(String(150), nullable=False)
    phone = Column(String(30), nullable=True)
    joining_date = Column(Date, nullable=False)
    department = Column(String(100), nullable=False)
    job_title = Column(String(100), nullable=False)
    access_level = Column(String(50), nullable=False, default="standard")
    billable_rate = Column(Numeric(10, 2), nullable=False, default=100.00)
    max_weekly_hours = Column(Integer, nullable=False, default=40)

    account = relationship("Account", back_populates="employee_profile")
    managed_assignments = relationship("ClientPackageAssignment", back_populates="account_manager")
    assigned_tasks = relationship("Task", foreign_keys="Task.assigned_employee_id", back_populates="assignee")
    assigned_content_items = relationship("ContentItem", foreign_keys="ContentItem.assigned_employee_id", back_populates="assigned_employee")

    def __repr__(self):
        return f"<Employee account_id={self.account_id} name={self.full_name} title={self.job_title}>"


class Client(Base):
    __tablename__ = "clients"

    account_id = Column(Integer, ForeignKey("accounts.account_id", ondelete="CASCADE"), primary_key=True)
    business_name = Column(String(200), nullable=False)
    industry = Column(String(100), nullable=False)
    brand_description = Column(Text, nullable=True)
    contact_person = Column(String(150), nullable=True)

    account = relationship("Account", back_populates="client_profile")
    social_accounts = relationship("ClientSocialAccount", back_populates="client", cascade="all, delete-orphan")
    package_assignments = relationship("ClientPackageAssignment", back_populates="client", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="client", cascade="all, delete-orphan")
    content_items = relationship("ContentItem", foreign_keys="ContentItem.client_account_id", back_populates="client", cascade="all, delete-orphan")
    content_plans = relationship("ContentPlan", foreign_keys="ContentPlan.client_account_id", back_populates="client", cascade="all, delete-orphan")
    feedbacks = relationship("ClientFeedback", foreign_keys="ClientFeedback.client_account_id", back_populates="client", cascade="all, delete-orphan")
    attachments = relationship("Attachment", foreign_keys="Attachment.client_account_id", back_populates="client", cascade="all, delete-orphan")
    invoices = relationship("Invoice", foreign_keys="Invoice.client_account_id", back_populates="client", cascade="all, delete-orphan")
    expenses = relationship("Expense", foreign_keys="Expense.client_account_id", back_populates="client")
    monthly_metrics = relationship("ClientMonthlyMetric", back_populates="client", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Client account_id={self.account_id} business={self.business_name}>"



