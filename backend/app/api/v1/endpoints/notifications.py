from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from app.db.session import get_db
from app.core.permissions import get_current_user
from app.models.account import Account
from app.models.analytics import Notification
from app.schemas.analytics import (
    NotificationResponse, NotificationUpdate, NotificationSummaryResponse
)
from app.core.events import format_notification_response

router = APIRouter()


@router.get("", response_model=NotificationSummaryResponse)
def get_user_notifications(
    unread_only: bool = Query(False, description="Filter only unread notifications"),
    limit: int = Query(50, ge=1, le=100, description="Max notifications to retrieve"),
    db: Session = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    Retrieve authenticated user's notifications.
    Strict recipient-level access control:
    Users can only access their own private notifications.
    """
    base_query = db.query(Notification).filter(
        Notification.recipient_account_id == current_user.account_id
    )

    unread_count = base_query.filter(Notification.is_read.is_(False)).count()
    total_count = base_query.count()

    list_query = base_query.options(joinedload(Notification.sender))
    if unread_only:
        list_query = list_query.filter(Notification.is_read.is_(False))

    notifications = list_query.order_by(
        Notification.created_at.desc(),
        Notification.notification_id.desc()
    ).limit(limit).all()

    return {
        "unread_count": unread_count,
        "total_count": total_count,
        "notifications": [format_notification_response(n) for n in notifications]
    }


@router.patch("/{notification_id}", response_model=NotificationResponse)
def update_notification(
    notification_id: int,
    payload: NotificationUpdate,
    db: Session = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    Mark a notification as read or unread.
    Enforces object-level authorization (recipient check).
    """
    notif = (
        db.query(Notification)
        .options(joinedload(Notification.sender))
        .filter(Notification.notification_id == notification_id)
        .first()
    )
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    # Strict recipient-level security
    if notif.recipient_account_id != current_user.account_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Cannot modify another user's notifications"
        )

    notif.is_read = payload.is_read
    if payload.is_read:
        notif.read_at = datetime.now()
    else:
        notif.read_at = None

    db.commit()
    db.refresh(notif)
    return format_notification_response(notif)


@router.post("/mark-all-read", status_code=status.HTTP_200_OK)
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    Mark all unread notifications for the current authenticated user as read.
    """
    now = datetime.now()
    updated_rows = (
        db.query(Notification)
        .filter(
            Notification.recipient_account_id == current_user.account_id,
            Notification.is_read.is_(False)
        )
        .update({"is_read": True, "read_at": now}, synchronize_session="fetch")
    )
    db.commit()

    return {
        "message": "All notifications marked as read",
        "marked_count": updated_rows
    }

