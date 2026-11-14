import enum
from decimal import Decimal
from sqlalchemy import (
    Column, Integer, String, Text, Date, DateTime, Numeric, ForeignKey, Enum, func
)
from sqlalchemy.orm import relationship
from app.db.session import Base


class InvoiceStatus(str, enum.Enum):
    DRAFT = "Draft"
    PENDING = "Pending"
    PAID = "Paid"
    PARTIALLY_PAID = "Partially Paid"
    OVERDUE = "Overdue"
    CANCELLED = "Cancelled"


class PaymentStatus(str, enum.Enum):
    CONFIRMED = "Confirmed"
    PENDING = "Pending"
    FAILED = "Failed"
    CANCELLED = "Cancelled"


class Invoice(Base):
    __tablename__ = "invoices"

    invoice_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    client_account_id = Column(Integer, ForeignKey("clients.account_id", ondelete="RESTRICT"), nullable=False, index=True)
    assignment_id = Column(Integer, ForeignKey("client_package_assignments.assignment_id", ondelete="SET NULL"), nullable=True, index=True)
    invoice_number = Column(String(100), unique=True, nullable=False, index=True)
    subtotal = Column(Numeric(10, 2), nullable=False)
    tax_percent = Column(Numeric(5, 2), nullable=False, default=Decimal("0.00"))
    tax_amount = Column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    total_amount = Column(Numeric(10, 2), nullable=False)
    issue_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False)
    status = Column(Enum(InvoiceStatus, values_callable=lambda x: [e.value for e in x]), nullable=False, default=InvoiceStatus.PENDING)
    payment_method = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    client = relationship("Client", back_populates="invoices")
    assignment = relationship("ClientPackageAssignment", back_populates="invoices")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan", order_by="Payment.payment_date.desc()")

    def __repr__(self):
        return f"<Invoice id={self.invoice_id} num={self.invoice_number} total={self.total_amount} status={self.status}>"


class Payment(Base):
    __tablename__ = "payments"

    payment_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.invoice_id", ondelete="CASCADE"), nullable=False, index=True)
    received_by_account_id = Column(Integer, ForeignKey("accounts.account_id", ondelete="RESTRICT"), nullable=False, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    payment_date = Column(Date, nullable=False)
    payment_method = Column(String(50), nullable=False)
    transaction_reference = Column(String(100), nullable=True, index=True)
    status = Column(Enum(PaymentStatus, values_callable=lambda x: [e.value for e in x]), nullable=False, default=PaymentStatus.CONFIRMED)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    invoice = relationship("Invoice", back_populates="payments")
    received_by = relationship("Account", foreign_keys=[received_by_account_id], back_populates="payments_received")

    def __repr__(self):
        return f"<Payment id={self.payment_id} invoice={self.invoice_id} amount={self.amount} status={self.status}>"


class Expense(Base):
    __tablename__ = "expenses"

    expense_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    client_account_id = Column(Integer, ForeignKey("clients.account_id", ondelete="SET NULL"), nullable=True, index=True)
    created_by_account_id = Column(Integer, ForeignKey("accounts.account_id", ondelete="RESTRICT"), nullable=False, index=True)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    details = Column(Text, nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    expense_date = Column(Date, nullable=False)
    payment_method = Column(String(100), nullable=True)
    receipt_url = Column(String(500), nullable=True)
    status = Column(String(50), nullable=False, default="Approved")
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    client = relationship("Client", back_populates="expenses")
    created_by = relationship("Account", foreign_keys=[created_by_account_id], back_populates="expenses_created")
    attachments = relationship("Attachment", back_populates="expense")

    def __repr__(self):
        return f"<Expense id={self.expense_id} category={self.category} amount={self.amount}>"
