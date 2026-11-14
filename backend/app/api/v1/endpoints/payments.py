from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app.db.session import get_db
from app.core.permissions import get_current_user
from app.models.account import Account, AccountRole
from app.models.finance import Payment, Invoice
from app.schemas.finance import PaymentResponse
from app.api.v1.endpoints.invoices import format_payment_response

router = APIRouter()


@router.get("", response_model=List[PaymentResponse])
def list_payments(
    invoice_id: Optional[int] = Query(None, description="Filter by invoice ID"),
    client_id: Optional[int] = Query(None, description="Filter by client account ID"),
    from_date: Optional[date] = Query(None, description="Filter by payment date from"),
    to_date: Optional[date] = Query(None, description="Filter by payment date to"),
    payment_method: Optional[str] = Query(None, description="Filter by payment method"),
    db: Session = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    List payments with object-level authorization:
    - Client sees only payments related to their own invoices.
    - Admin/Employee can view all or filter.
    """
    query = (
        db.query(Payment)
        .join(Invoice, Payment.invoice_id == Invoice.invoice_id)
        .options(
            joinedload(Payment.invoice).joinedload(Invoice.client),
            joinedload(Payment.received_by).joinedload(Account.admin_profile),
            joinedload(Payment.received_by).joinedload(Account.employee_profile)
        )
    )

    if current_user.role == AccountRole.CLIENT:
        if client_id and client_id != current_user.account_id:
            raise HTTPException(status_code=403, detail="Cannot access payments belonging to another client")
        query = query.filter(Invoice.client_account_id == current_user.account_id)
    elif client_id:
        query = query.filter(Invoice.client_account_id == client_id)

    if invoice_id:
        query = query.filter(Payment.invoice_id == invoice_id)

    if from_date:
        query = query.filter(Payment.payment_date >= from_date)

    if to_date:
        query = query.filter(Payment.payment_date <= to_date)

    if payment_method:
        query = query.filter(Payment.payment_method == payment_method)

    payments = query.order_by(Payment.payment_date.desc(), Payment.payment_id.desc()).all()
    return [format_payment_response(p) for p in payments]
