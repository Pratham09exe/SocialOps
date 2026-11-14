from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.permissions import get_current_user, require_role
from app.models.account import Account, AccountRole, Client
from app.models.analytics import ClientMonthlyMetric
from app.schemas.analytics import ClientMonthlyMetricCreate, ClientMonthlyMetricResponse

router = APIRouter()


@router.get("/metrics", response_model=List[ClientMonthlyMetricResponse])
def get_client_metrics(
    client_id: Optional[int] = Query(None, description="Filter by client account ID"),
    report_month: Optional[str] = Query(None, description="Filter by report month (e.g., '2025-10')"),
    db: Session = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    Retrieve monthly social media performance analytics metrics.
    Enforces object-level client data isolation.
    """
    query = db.query(ClientMonthlyMetric)

    if current_user.role == AccountRole.CLIENT:
        if client_id and client_id != current_user.account_id:
            raise HTTPException(status_code=403, detail="Cannot access performance metrics belonging to another client")
        query = query.filter(ClientMonthlyMetric.client_account_id == current_user.account_id)
    elif client_id:
        query = query.filter(ClientMonthlyMetric.client_account_id == client_id)

    if report_month:
        query = query.filter(ClientMonthlyMetric.report_month == report_month)

    return query.order_by(ClientMonthlyMetric.report_month.desc(), ClientMonthlyMetric.metric_id.desc()).all()


@router.post("/metrics", response_model=ClientMonthlyMetricResponse, status_code=status.HTTP_201_CREATED)
def record_client_metric(
    payload: ClientMonthlyMetricCreate,
    db: Session = Depends(get_db),
    current_user: Account = Depends(require_role([AccountRole.ADMIN, AccountRole.EMPLOYEE]))
):
    """
    Record or ingest monthly social media analytics metrics.
    Admin & Employee only.
    """
    client = db.query(Client).filter(Client.account_id == payload.client_account_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Referenced client does not exist")

    # Check for existing month record
    existing = db.query(ClientMonthlyMetric).filter(
        ClientMonthlyMetric.client_account_id == payload.client_account_id,
        ClientMonthlyMetric.social_account_id == payload.social_account_id,
        ClientMonthlyMetric.report_month == payload.report_month
    ).first()

    if existing:
        # Update existing
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(existing, field, value)
        db.commit()
        db.refresh(existing)
        return existing

    metric = ClientMonthlyMetric(**payload.model_dump())
    db.add(metric)
    db.commit()
    db.refresh(metric)
    return metric

