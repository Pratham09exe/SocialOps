import enum
from sqlalchemy import Column, Integer, String, Boolean, Date, Numeric, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.db.session import Base

class AssignmentStatus(str, enum.Enum):
    ACTIVE = "Active"
    PAUSED = "Paused"
    COMPLETED = "Completed"
    TERMINATED = "Terminated"

class ClientSocialAccount(Base):
    __tablename__ = "client_social_accounts"

    social_account_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    client_account_id = Column(Integer, ForeignKey("clients.account_id", ondelete="CASCADE"), nullable=False, index=True)
    platform = Column(String(50), nullable=False)  # instagram, facebook, youtube, linkedin, whatsapp_business, x, pinterest
    handle = Column(String(100), nullable=False)
    page_url = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)

    client = relationship("Client", back_populates="social_accounts")
    monthly_metrics = relationship("ClientMonthlyMetric", back_populates="social_account")

    def __repr__(self):
        return f"<ClientSocialAccount id={self.social_account_id} client={self.client_account_id} platform={self.platform} handle={self.handle}>"


class Package(Base):
    __tablename__ = "packages"

    package_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    monthly_price = Column(Numeric(10, 2), nullable=False)
    platforms_included = Column(String(100), nullable=False, default="3 platforms")
    account_manager_included = Column(Boolean, default=True, nullable=False)
    performance_report_included = Column(Boolean, default=True, nullable=False)
    paid_ads_included = Column(Boolean, default=False, nullable=False)
    influencer_coordination = Column(Boolean, default=False, nullable=False)
    reels_per_month = Column(Integer, default=8, nullable=False)
    posts_per_month = Column(Integer, default=16, nullable=False)
    stories_per_month = Column(Integer, default=30, nullable=False)
    revision_rounds = Column(Integer, default=2, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    assignments = relationship("ClientPackageAssignment", back_populates="package")

    def __repr__(self):
        return f"<Package id={self.package_id} name={self.name} price={self.monthly_price}>"


class ClientPackageAssignment(Base):
    __tablename__ = "client_package_assignments"

    assignment_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    client_account_id = Column(Integer, ForeignKey("clients.account_id", ondelete="CASCADE"), nullable=False, index=True)
    package_id = Column(Integer, ForeignKey("packages.package_id", ondelete="RESTRICT"), nullable=False, index=True)
    account_manager_employee_id = Column(Integer, ForeignKey("employees.account_id", ondelete="SET NULL"), nullable=True, index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    billing_cycle = Column(String(50), nullable=False, default="Monthly")  # Monthly, Quarterly, Annual
    agreed_monthly_price = Column(Numeric(10, 2), nullable=False)
    status = Column(Enum(AssignmentStatus, values_callable=lambda x: [e.value for e in x]), nullable=False, default=AssignmentStatus.ACTIVE)

    client = relationship("Client", back_populates="package_assignments")
    package = relationship("Package", back_populates="assignments")
    account_manager = relationship("Employee", back_populates="managed_assignments")
    invoices = relationship("Invoice", back_populates="assignment")

    def __repr__(self):
        return f"<ClientPackageAssignment id={self.assignment_id} client={self.client_account_id} package={self.package_id} status={self.status}>"
