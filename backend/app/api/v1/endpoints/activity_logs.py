from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db.session import get_db
from app.core.permissions import require_role
from app.models.account import Account, AccountRole
from app.models.analytics import ActivityLog
from app.schemas.analytics import ActivityLogCreate, ActivityLogResponse
from app.core.events import log_activity, format_activity_log_response

router = APIRouter()


@router.get("", response_model=List[ActivityLogResponse])
def get_activity_logs(
    action: Optional[str] = Query(None, description="Filter by action name or type"),
    search: Optional[str] = Query(None, description="Search actor, client, or target"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type (Task, ContentItem, etc.)"),
    limit: int = Query(100, ge=1, le=500, description="Max logs to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db),
    current_user: Account = Depends(require_role([AccountRole.ADMIN, AccountRole.EMPLOYEE]))
):
    """
    Retrieve audit trail and activity log records.
    - Admin & Employee only.
    - Client accounts are strictly forbidden (403).
    - Immutable audit log: records cannot be deleted or modified.
    """
    query = db.query(ActivityLog)

    if action and action != "All":
        query = query.filter(ActivityLog.action.ilike(f"%{action}%"))

    if entity_type:
        query = query.filter(ActivityLog.entity_type == entity_type)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                ActivityLog.actor_name.ilike(search_pattern),
                ActivityLog.target.ilike(search_pattern),
                ActivityLog.subtext.ilike(search_pattern),
                ActivityLog.action.ilike(search_pattern)
            )
        )

    logs = query.order_by(ActivityLog.created_at.desc(), ActivityLog.log_id.desc()).offset(offset).limit(limit).all()
    return [format_activity_log_response(log) for log in logs]


@router.post("", response_model=ActivityLogResponse, status_code=status.HTTP_201_CREATED)
def record_activity_log(
    payload: ActivityLogCreate,
    db: Session = Depends(get_db),
    current_user: Account = Depends(require_role([AccountRole.ADMIN, AccountRole.EMPLOYEE]))
):
    """
    Record an activity log entry from the frontend application.
    Extracts actor info securely from the authenticated session.
    """
    log_entry = log_activity(
        db=db,
        actor=current_user,
        action=payload.action,
        target=payload.target,
        subtext=payload.subtext,
        action_type=payload.action_type,
        entity_type=payload.entity_type,
        entity_id=payload.entity_id,
        ip_address=payload.ip_address or "127.0.0.1 (Local)",
        client_env=payload.client_env or "Active Web Client"
    )
    db.commit()
    db.refresh(log_entry)
    return format_activity_log_response(log_entry)

