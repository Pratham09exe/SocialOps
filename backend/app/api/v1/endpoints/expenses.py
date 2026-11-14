from datetime import date
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from app.db.session import get_db
from app.core.permissions import get_current_user, require_role
from app.models.account import Account, AccountRole, Client
from app.models.finance import Expense
from app.schemas.finance import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from app.core.events import log_activity

router = APIRouter()


def check_not_client(current_user: Account):
    """Enforce that client accounts are strictly forbidden from all expense endpoints."""
    if current_user.role == AccountRole.CLIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Client accounts are strictly prohibited from accessing internal agency expenses"
        )


def format_expense_response(exp: Expense) -> dict:
    created_by_name = "Staff Member"
    if exp.created_by:
        if exp.created_by.admin_profile:
            created_by_name = exp.created_by.admin_profile.full_name
        elif exp.created_by.employee_profile:
            created_by_name = exp.created_by.employee_profile.full_name
        else:
            created_by_name = exp.created_by.username

    client_name = "Agency Internal"
    client_handle = "Agency Internal"
    if exp.client:
        client_name = exp.client.business_name
        clean_handle = "".join(ch for ch in client_name if ch.isalnum())
        client_handle = f"@{clean_handle}"

    return {
        "expense_id": exp.expense_id,
        "client_account_id": exp.client_account_id,
        "client_name": client_name,
        "client_handle": client_handle,
        "created_by_account_id": exp.created_by_account_id,
        "created_by_name": created_by_name,
        "category": exp.category,
        "description": exp.description,
        "details": exp.details,
        "amount": exp.amount,
        "expense_date": exp.expense_date,
        "payment_method": exp.payment_method,
        "receipt_url": exp.receipt_url,
        "status": exp.status,
        "created_at": exp.created_at,
        "updated_at": exp.updated_at
    }


# ==========================================
# EXPENSE SUMMARY (Must be before /{expense_id})
# ==========================================

@router.get("/summary/metrics", response_model=dict)
def get_expense_metrics(
    db: Session = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    Get aggregated operational expense metrics.
    Admin & Employee only. Client is 403 Forbidden.
    """
    check_not_client(current_user)

    expenses = db.query(Expense).all()

    total_amount = Decimal("0.00")
    category_totals = {}
    today = date.today()
    current_month_total = Decimal("0.00")

    for exp in expenses:
        amt = Decimal(str(exp.amount))
        total_amount += amt
        category_totals[exp.category] = category_totals.get(exp.category, Decimal("0.00")) + amt

        if exp.expense_date.year == today.year and exp.expense_date.month == today.month:
            current_month_total += amt

    return {
        "total_expenses": total_amount.quantize(Decimal("0.01")),
        "monthly_expenses": current_month_total.quantize(Decimal("0.01")),
        "category_totals": {k: v.quantize(Decimal("0.01")) for k, v in category_totals.items()}
    }


# ==========================================
# EXPENSE CRUD
# ==========================================

@router.get("", response_model=List[ExpenseResponse])
def list_expenses(
    category: Optional[str] = Query(None, description="Filter by category"),
    client_id: Optional[int] = Query(None, description="Filter by client ID"),
    from_date: Optional[date] = Query(None, description="Filter by date from"),
    to_date: Optional[date] = Query(None, description="Filter by date to"),
    db: Session = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    List operational expenses.
    Admin and Employee only. Client returns 403 Forbidden!
    """
    check_not_client(current_user)

    query = (
        db.query(Expense)
        .options(
            joinedload(Expense.client),
            joinedload(Expense.created_by).joinedload(Account.admin_profile),
            joinedload(Expense.created_by).joinedload(Account.employee_profile)
        )
    )

    if category and category != "All Categories":
        query = query.filter(Expense.category == category)

    if client_id is not None:
        query = query.filter(Expense.client_account_id == client_id)

    if from_date:
        query = query.filter(Expense.expense_date >= from_date)

    if to_date:
        query = query.filter(Expense.expense_date <= to_date)

    expenses = query.order_by(Expense.expense_date.desc(), Expense.expense_id.desc()).all()
    return [format_expense_response(exp) for exp in expenses]


@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    payload: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    Log an internal agency expense.
    Admin & authorized employees only. Client is 403 Forbidden.
    """
    check_not_client(current_user)

    if payload.amount <= Decimal("0.00"):
        raise HTTPException(status_code=400, detail="Expense amount must be greater than zero")

    if payload.client_account_id:
        client = db.query(Client).filter(Client.account_id == payload.client_account_id).first()
        if not client:
            raise HTTPException(status_code=404, detail="Referenced client does not exist")

    expense = Expense(
        client_account_id=payload.client_account_id,
        created_by_account_id=current_user.account_id,
        category=payload.category,
        description=payload.description,
        details=payload.details,
        amount=payload.amount.quantize(Decimal("0.01")),
        expense_date=payload.expense_date or date.today(),
        payment_method=payload.payment_method,
        receipt_url=payload.receipt_url,
        status=payload.status or "Approved"
    )
    db.add(expense)
    db.flush()

    # Phase 6: Activity log
    log_activity(
        db=db,
        actor=current_user,
        action="Expense Logged",
        target=expense.description,
        subtext=f"Category: {expense.category} • ${expense.amount}",
        action_type="primary",
        entity_type="Expense",
        entity_id=expense.expense_id
    )

    db.commit()
    db.refresh(expense)

    reloaded = (
        db.query(Expense)
        .options(
            joinedload(Expense.client),
            joinedload(Expense.created_by).joinedload(Account.admin_profile),
            joinedload(Expense.created_by).joinedload(Account.employee_profile)
        )
        .filter(Expense.expense_id == expense.expense_id)
        .first()
    )

    return format_expense_response(reloaded)


@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    Get expense by ID. Client is 403 Forbidden.
    """
    check_not_client(current_user)

    expense = (
        db.query(Expense)
        .options(
            joinedload(Expense.client),
            joinedload(Expense.created_by).joinedload(Account.admin_profile),
            joinedload(Expense.created_by).joinedload(Account.employee_profile)
        )
        .filter(Expense.expense_id == expense_id)
        .first()
    )
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    return format_expense_response(expense)


@router.patch("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: int,
    payload: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    Update expense details. Admin or Creator Employee only.
    """
    check_not_client(current_user)

    expense = (
        db.query(Expense)
        .options(
            joinedload(Expense.client),
            joinedload(Expense.created_by).joinedload(Account.admin_profile),
            joinedload(Expense.created_by).joinedload(Account.employee_profile)
        )
        .filter(Expense.expense_id == expense_id)
        .first()
    )
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    if current_user.role == AccountRole.EMPLOYEE and expense.created_by_account_id != current_user.account_id:
        raise HTTPException(status_code=403, detail="Employees can only modify expenses they created")

    if payload.client_account_id is not None:
        if payload.client_account_id != 0:
            client = db.query(Client).filter(Client.account_id == payload.client_account_id).first()
            if not client:
                raise HTTPException(status_code=404, detail="Referenced client does not exist")
            expense.client_account_id = payload.client_account_id
        else:
            expense.client_account_id = None

    if payload.category is not None:
        expense.category = payload.category

    if payload.description is not None:
        expense.description = payload.description

    if payload.details is not None:
        expense.details = payload.details

    if payload.amount is not None:
        if payload.amount <= Decimal("0.00"):
            raise HTTPException(status_code=400, detail="Expense amount must be greater than zero")
        expense.amount = payload.amount.quantize(Decimal("0.01"))

    if payload.expense_date is not None:
        expense.expense_date = payload.expense_date

    if payload.payment_method is not None:
        expense.payment_method = payload.payment_method

    if payload.receipt_url is not None:
        expense.receipt_url = payload.receipt_url

    if payload.status is not None:
        expense.status = payload.status

    db.commit()
    db.refresh(expense)

    return format_expense_response(expense)


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: Account = Depends(require_role(AccountRole.ADMIN))
):
    """
    Delete an expense. Admin only.
    """
    expense = db.query(Expense).filter(Expense.expense_id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    db.delete(expense)
    db.commit()
    return None
