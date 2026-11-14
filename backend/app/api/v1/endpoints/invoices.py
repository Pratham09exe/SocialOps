from datetime import date
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app.db.session import get_db
from app.core.permissions import get_current_user, require_role
from app.models.account import Account, AccountRole, Client
from app.models.social import ClientPackageAssignment
from app.models.finance import Invoice, Payment, InvoiceStatus, PaymentStatus
from app.schemas.finance import (
    InvoiceCreate, InvoiceUpdate, InvoiceResponse,
    PaymentCreate, PaymentResponse
)
from app.core.events import log_activity, create_notification

router = APIRouter()


def calculate_invoice_amounts(inv: Invoice) -> tuple[Decimal, Decimal]:
    """Calculate total confirmed payments and remaining balance due."""
    paid = Decimal("0.00")
    for p in inv.payments:
        if p.status == PaymentStatus.CONFIRMED:
            paid += Decimal(str(p.amount))
    paid = paid.quantize(Decimal("0.01"))
    balance = max(Decimal("0.00"), Decimal(str(inv.total_amount)) - paid).quantize(Decimal("0.01"))
    return paid, balance


def format_invoice_response(inv: Invoice) -> dict:
    paid, balance = calculate_invoice_amounts(inv)
    client_name = inv.client.business_name if inv.client else "Client"
    words = client_name.split()
    initials = "".join(w[0] for w in words)[:2].upper() if words else "CL"

    # Dynamic status update if overdue and not paid
    status_val = inv.status
    if status_val in (InvoiceStatus.PENDING, InvoiceStatus.PARTIALLY_PAID) and inv.due_date < date.today():
        status_val = InvoiceStatus.OVERDUE

    return {
        "invoice_id": inv.invoice_id,
        "client_account_id": inv.client_account_id,
        "client_name": client_name,
        "client_initials": initials,
        "assignment_id": inv.assignment_id,
        "invoice_number": inv.invoice_number,
        "subtotal": inv.subtotal,
        "tax_percent": inv.tax_percent,
        "tax_amount": inv.tax_amount,
        "total_amount": inv.total_amount,
        "paid_amount": paid,
        "balance_due": balance,
        "issue_date": inv.issue_date,
        "due_date": inv.due_date,
        "status": status_val,
        "payment_method": inv.payment_method,
        "notes": inv.notes,
        "created_at": inv.created_at,
        "updated_at": inv.updated_at,
        "payments_count": len(inv.payments)
    }


def format_payment_response(p: Payment) -> dict:
    received_by_name = "Agency Admin"
    if p.received_by:
        if p.received_by.admin_profile:
            received_by_name = p.received_by.admin_profile.full_name
        elif p.received_by.employee_profile:
            received_by_name = p.received_by.employee_profile.full_name
        else:
            received_by_name = p.received_by.username

    client_id = p.invoice.client_account_id if p.invoice else None
    client_name = p.invoice.client.business_name if p.invoice and p.invoice.client else None

    return {
        "payment_id": p.payment_id,
        "invoice_id": p.invoice_id,
        "invoice_number": p.invoice.invoice_number if p.invoice else None,
        "client_account_id": client_id,
        "client_name": client_name,
        "received_by_account_id": p.received_by_account_id,
        "received_by_name": received_by_name,
        "amount": p.amount,
        "payment_date": p.payment_date,
        "payment_method": p.payment_method,
        "transaction_reference": p.transaction_reference,
        "status": p.status,
        "notes": p.notes,
        "created_at": p.created_at
    }


# ==========================================
# SUMMARY / METRICS (Must be before /{invoice_id})
# ==========================================

@router.get("/summary/metrics", response_model=dict)
def get_finance_metrics(
    db: Session = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    Get database-backed financial metrics and KPIs.
    Strictly forbidden for Client accounts.
    """
    if current_user.role == AccountRole.CLIENT:
        raise HTTPException(status_code=403, detail="Clients cannot access agency-wide financial metrics")

    invoices = db.query(Invoice).options(joinedload(Invoice.payments)).filter(Invoice.status != InvoiceStatus.CANCELLED).all()

    total_billed = Decimal("0.00")
    total_collected = Decimal("0.00")
    outstanding = Decimal("0.00")
    overdue_amount = Decimal("0.00")
    overdue_count = 0
    today = date.today()

    for inv in invoices:
        total_billed += Decimal(str(inv.total_amount))
        paid, balance = calculate_invoice_amounts(inv)
        total_collected += paid
        outstanding += balance

        if balance > 0 and (inv.due_date < today or inv.status == InvoiceStatus.OVERDUE):
            overdue_amount += balance
            overdue_count += 1

    return {
        "total_billed": total_billed.quantize(Decimal("0.01")),
        "total_collected": total_collected.quantize(Decimal("0.01")),
        "outstanding_receivables": outstanding.quantize(Decimal("0.01")),
        "overdue_amount": overdue_amount.quantize(Decimal("0.01")),
        "overdue_invoices_count": overdue_count
    }


# ==========================================
# INVOICE CRUD
# ==========================================

@router.get("", response_model=List[InvoiceResponse])
def list_invoices(
    client_id: Optional[int] = Query(None, description="Filter by client account ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    from_date: Optional[date] = Query(None, description="Filter by issue date from"),
    to_date: Optional[date] = Query(None, description="Filter by issue date to"),
    db: Session = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    List invoices with object-level authorization:
    - Client sees ONLY their own invoices.
    - Admin & Employee can see all or filter.
    """
    query = db.query(Invoice).options(
        joinedload(Invoice.client),
        joinedload(Invoice.payments)
    )

    if current_user.role == AccountRole.CLIENT:
        if client_id and client_id != current_user.account_id:
            raise HTTPException(status_code=403, detail="Cannot access invoices belonging to another client")
        query = query.filter(Invoice.client_account_id == current_user.account_id)
    elif client_id:
        query = query.filter(Invoice.client_account_id == client_id)

    if status:
        query = query.filter(Invoice.status == status)

    if from_date:
        query = query.filter(Invoice.issue_date >= from_date)

    if to_date:
        query = query.filter(Invoice.issue_date <= to_date)

    invoices = query.order_by(Invoice.issue_date.desc(), Invoice.invoice_id.desc()).all()
    return [format_invoice_response(inv) for inv in invoices]


@router.post("", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
def create_invoice(
    payload: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: Account = Depends(require_role(AccountRole.ADMIN))
):
    """
    Generate client invoice with precise Decimal calculations.
    Admin only!
    """
    client = db.query(Client).filter(Client.account_id == payload.client_account_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Referenced client does not exist")

    if payload.assignment_id:
        assignment = db.query(ClientPackageAssignment).filter(
            ClientPackageAssignment.assignment_id == payload.assignment_id,
            ClientPackageAssignment.client_account_id == payload.client_account_id
        ).first()
        if not assignment:
            raise HTTPException(status_code=400, detail="Assignment does not belong to the specified client")

    # Generate or validate invoice number
    if payload.invoice_number:
        existing = db.query(Invoice).filter(Invoice.invoice_number == payload.invoice_number).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Invoice number '{payload.invoice_number}' already exists")
        inv_number = payload.invoice_number
    else:
        # Generate sequential invoice number
        count = db.query(func.count(Invoice.invoice_id)).scalar() or 0
        inv_number = f"INV-{date.today().year}-{(count + 1):03d}"

    # Precise Decimal calculations
    subtotal = payload.subtotal.quantize(Decimal("0.01"))
    tax_percent = payload.tax_percent.quantize(Decimal("0.01"))
    tax_amount = (subtotal * tax_percent / Decimal("100.00")).quantize(Decimal("0.01"))
    total_amount = (subtotal + tax_amount).quantize(Decimal("0.01"))

    issue_date = payload.issue_date or date.today()
    if payload.due_date < issue_date:
        raise HTTPException(status_code=400, detail="Due date cannot precede issue date")

    invoice = Invoice(
        client_account_id=payload.client_account_id,
        assignment_id=payload.assignment_id,
        invoice_number=inv_number,
        subtotal=subtotal,
        tax_percent=tax_percent,
        tax_amount=tax_amount,
        total_amount=total_amount,
        issue_date=issue_date,
        due_date=payload.due_date,
        status=payload.status or InvoiceStatus.PENDING,
        payment_method=payload.payment_method,
        notes=payload.notes
    )
    db.add(invoice)
    db.flush()

    # Phase 6: Automated activity log and notification dispatch
    log_activity(
        db=db,
        actor=current_user,
        action="Invoice Issued",
        target=f"{invoice.invoice_number} to {client.business_name}",
        subtext=f"₹{invoice.total_amount} • Due {invoice.due_date}",
        action_type="primary",
        entity_type="Invoice",
        entity_id=invoice.invoice_id
    )

    create_notification(
        db=db,
        recipient_account_id=invoice.client_account_id,
        event_type="INVOICE_CREATED",
        title="New Invoice Issued",
        message=f"Invoice #{invoice.invoice_number} for ₹{invoice.total_amount} has been issued with due date {invoice.due_date}.",
        entity_type="Invoice",
        entity_id=invoice.invoice_id,
        sender_account_id=current_user.account_id
    )

    db.commit()
    db.refresh(invoice)

    # Reload with relationships
    inv_reloaded = db.query(Invoice).options(
        joinedload(Invoice.client),
        joinedload(Invoice.payments)
    ).filter(Invoice.invoice_id == invoice.invoice_id).first()

    return format_invoice_response(inv_reloaded)


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    Get invoice details with object-level authorization.
    """
    invoice = db.query(Invoice).options(
        joinedload(Invoice.client),
        joinedload(Invoice.payments)
    ).filter(Invoice.invoice_id == invoice_id).first()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if current_user.role == AccountRole.CLIENT and invoice.client_account_id != current_user.account_id:
        raise HTTPException(status_code=403, detail="Cannot access an invoice belonging to another client")

    return format_invoice_response(invoice)


@router.patch("/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(
    invoice_id: int,
    payload: InvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: Account = Depends(require_role(AccountRole.ADMIN))
):
    """
    Update invoice attributes with recalculation. Admin only.
    """
    invoice = db.query(Invoice).options(
        joinedload(Invoice.client),
        joinedload(Invoice.payments)
    ).filter(Invoice.invoice_id == invoice_id).first()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    subtotal_changed = payload.subtotal is not None
    tax_changed = payload.tax_percent is not None

    if subtotal_changed:
        invoice.subtotal = payload.subtotal.quantize(Decimal("0.01"))
    if tax_changed:
        invoice.tax_percent = payload.tax_percent.quantize(Decimal("0.01"))

    if subtotal_changed or tax_changed:
        invoice.tax_amount = (invoice.subtotal * invoice.tax_percent / Decimal("100.00")).quantize(Decimal("0.01"))
        invoice.total_amount = (invoice.subtotal + invoice.tax_amount).quantize(Decimal("0.01"))

    if payload.due_date is not None:
        if payload.due_date < invoice.issue_date:
            raise HTTPException(status_code=400, detail="Due date cannot precede issue date")
        invoice.due_date = payload.due_date

    if payload.payment_method is not None:
        invoice.payment_method = payload.payment_method

    if payload.status is not None:
        invoice.status = payload.status

    if payload.notes is not None:
        invoice.notes = payload.notes

    # Reconcile status based on confirmed payments
    paid, balance = calculate_invoice_amounts(invoice)
    if paid >= invoice.total_amount:
        invoice.status = InvoiceStatus.PAID
    elif paid > 0 and invoice.status == InvoiceStatus.PAID:
        invoice.status = InvoiceStatus.PARTIALLY_PAID

    # Phase 6: Activity log
    log_activity(
        db=db,
        actor=current_user,
        action="Invoice Updated",
        target=f"Invoice #{invoice.invoice_number}",
        subtext=f"Status: {invoice.status.value if hasattr(invoice.status, 'value') else invoice.status}",
        action_type="primary",
        entity_type="Invoice",
        entity_id=invoice.invoice_id
    )

    db.commit()
    db.refresh(invoice)

    return format_invoice_response(invoice)


# ==========================================
# PAYMENTS FOR INVOICE
# ==========================================

@router.get("/{invoice_id}/payments", response_model=List[PaymentResponse])
def list_invoice_payments(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    List payments recorded against an invoice.
    Enforces object-level authorization for client accounts.
    """
    invoice = db.query(Invoice).filter(Invoice.invoice_id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if current_user.role == AccountRole.CLIENT and invoice.client_account_id != current_user.account_id:
        raise HTTPException(status_code=403, detail="Cannot access payments for another client's invoice")

    payments = (
        db.query(Payment)
        .options(
            joinedload(Payment.invoice).joinedload(Invoice.client),
            joinedload(Payment.received_by).joinedload(Account.admin_profile),
            joinedload(Payment.received_by).joinedload(Account.employee_profile)
        )
        .filter(Payment.invoice_id == invoice_id)
        .order_by(Payment.payment_date.desc(), Payment.payment_id.desc())
        .all()
    )

    return [format_payment_response(p) for p in payments]


@router.post("/{invoice_id}/payments", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def record_invoice_payment(
    invoice_id: int,
    payload: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: Account = Depends(require_role(AccountRole.ADMIN))
):
    """
    Record payment against an invoice with transactional row locking and balance verification.
    Admin only!
    """
    if payload.amount <= Decimal("0.00"):
        raise HTTPException(status_code=400, detail="Payment amount must be greater than zero")

    # Use row-level lock (with_for_update) to prevent race conditions during concurrent payments
    invoice = (
        db.query(Invoice)
        .filter(Invoice.invoice_id == invoice_id)
        .with_for_update()
        .first()
    )

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if invoice.status == InvoiceStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Cannot record payments on a cancelled invoice")

    if invoice.status == InvoiceStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Cannot record payments on a draft invoice")

    # Calculate remaining balance
    paid, balance = calculate_invoice_amounts(invoice)

    payment_amt = payload.amount.quantize(Decimal("0.01"))
    if payment_amt > balance:
        raise HTTPException(
            status_code=400,
            detail=f"Payment amount (${payment_amt}) exceeds remaining balance due (${balance})"
        )

    # Check duplicate transaction reference if supplied
    if payload.transaction_reference:
        existing_tx = db.query(Payment).filter(
            Payment.transaction_reference == payload.transaction_reference
        ).first()
        if existing_tx:
            raise HTTPException(
                status_code=400,
                detail=f"Transaction reference '{payload.transaction_reference}' already recorded"
            )

    payment = Payment(
        invoice_id=invoice_id,
        received_by_account_id=current_user.account_id,
        amount=payment_amt,
        payment_date=payload.payment_date or date.today(),
        payment_method=payload.payment_method,
        transaction_reference=payload.transaction_reference,
        status=payload.status or PaymentStatus.CONFIRMED,
        notes=payload.notes
    )
    db.add(payment)

    # Update invoice status atomically
    if payment.status == PaymentStatus.CONFIRMED:
        new_paid = paid + payment_amt
        if new_paid >= invoice.total_amount:
            invoice.status = InvoiceStatus.PAID
        else:
            invoice.status = InvoiceStatus.PARTIALLY_PAID

    # Phase 6: Automated activity log and notification dispatch
    log_activity(
        db=db,
        actor=current_user,
        action="Payment Recorded",
        target=f"Invoice #{invoice.invoice_number}",
        subtext=f"${payment.amount} via {payment.payment_method}",
        action_type="success",
        entity_type="Payment",
        entity_id=payment.payment_id
    )

    create_notification(
        db=db,
        recipient_account_id=invoice.client_account_id,
        event_type="PAYMENT_RECORDED",
        title="Payment Confirmed",
        message=f"Payment of ${payment.amount} confirmed for invoice #{invoice.invoice_number}.",
        entity_type="Payment",
        entity_id=payment.payment_id,
        sender_account_id=current_user.account_id
    )

    db.commit()
    db.refresh(payment)

    p_reloaded = (
        db.query(Payment)
        .options(
            joinedload(Payment.invoice).joinedload(Invoice.client),
            joinedload(Payment.received_by).joinedload(Account.admin_profile),
            joinedload(Payment.received_by).joinedload(Account.employee_profile)
        )
        .filter(Payment.payment_id == payment.payment_id)
        .first()
    )

    return format_payment_response(p_reloaded)
