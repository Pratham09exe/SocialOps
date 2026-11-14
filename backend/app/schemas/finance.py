from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from app.models.finance import InvoiceStatus, PaymentStatus


# ==========================================
# INVOICE SCHEMAS
# ==========================================

class InvoiceCreate(BaseModel):
    client_account_id: int
    assignment_id: Optional[int] = None
    invoice_number: Optional[str] = None
    subtotal: Decimal = Field(..., gt=0, description="Pre-tax subtotal amount")
    tax_percent: Decimal = Field(default=Decimal("0.00"), ge=0, le=100, description="Tax percentage 0-100")
    issue_date: Optional[date] = None
    due_date: date
    payment_method: Optional[str] = "Stripe ACH"
    notes: Optional[str] = None
    status: Optional[InvoiceStatus] = InvoiceStatus.PENDING


class InvoiceUpdate(BaseModel):
    subtotal: Optional[Decimal] = Field(default=None, gt=0)
    tax_percent: Optional[Decimal] = Field(default=None, ge=0, le=100)
    due_date: Optional[date] = None
    payment_method: Optional[str] = None
    status: Optional[InvoiceStatus] = None
    notes: Optional[str] = None


class InvoiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    invoice_id: int
    client_account_id: int
    client_name: Optional[str] = None
    client_initials: Optional[str] = None
    assignment_id: Optional[int] = None
    invoice_number: str
    subtotal: Decimal
    tax_percent: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    paid_amount: Decimal
    balance_due: Decimal
    issue_date: date
    due_date: date
    status: InvoiceStatus
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    payments_count: int = 0


# ==========================================
# PAYMENT SCHEMAS
# ==========================================

class PaymentCreate(BaseModel):
    amount: Decimal = Field(..., gt=0, description="Payment amount must be greater than zero")
    payment_date: Optional[date] = None
    payment_method: str = Field(default="Stripe ACH", description="e.g. Stripe ACH, Wire Transfer, ACH Direct, Stripe CC")
    transaction_reference: Optional[str] = None
    status: Optional[PaymentStatus] = PaymentStatus.CONFIRMED
    notes: Optional[str] = None


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    payment_id: int
    invoice_id: int
    invoice_number: Optional[str] = None
    client_account_id: Optional[int] = None
    client_name: Optional[str] = None
    received_by_account_id: int
    received_by_name: Optional[str] = None
    amount: Decimal
    payment_date: date
    payment_method: str
    transaction_reference: Optional[str] = None
    status: PaymentStatus
    notes: Optional[str] = None
    created_at: datetime


# ==========================================
# EXPENSE SCHEMAS
# ==========================================

class ExpenseCreate(BaseModel):
    client_account_id: Optional[int] = None
    category: str = Field(default="Software", description="e.g. Software, Ad Spend, Contractor, Travel, Office")
    description: str = Field(..., min_length=2)
    details: Optional[str] = None
    amount: Decimal = Field(..., gt=0)
    expense_date: Optional[date] = None
    payment_method: Optional[str] = "Amex Corp •• 4910"
    receipt_url: Optional[str] = None
    status: Optional[str] = "Approved"


class ExpenseUpdate(BaseModel):
    client_account_id: Optional[int] = None
    category: Optional[str] = None
    description: Optional[str] = None
    details: Optional[str] = None
    amount: Optional[Decimal] = Field(default=None, gt=0)
    expense_date: Optional[date] = None
    payment_method: Optional[str] = None
    receipt_url: Optional[str] = None
    status: Optional[str] = None


class ExpenseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    expense_id: int
    client_account_id: Optional[int] = None
    client_name: Optional[str] = None
    client_handle: Optional[str] = None
    created_by_account_id: int
    created_by_name: Optional[str] = None
    category: str
    description: str
    details: Optional[str] = None
    amount: Decimal
    expense_date: date
    payment_method: Optional[str] = None
    receipt_url: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime


# ==========================================
# FINANCE SUMMARY / KPI SCHEMAS
# ==========================================

class FinanceSummaryResponse(BaseModel):
    total_billed: Decimal
    total_collected: Decimal
    outstanding_receivables: Decimal
    overdue_amount: Decimal
    overdue_invoices_count: int
    total_expenses: Decimal
    monthly_expenses: Decimal
    ad_spend_expenses: Decimal
    software_expenses: Decimal
    contractor_expenses: Decimal
