import re
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from app.models.account import Account
from app.models.analytics import ActivityLog, Notification


SENSITIVE_PATTERNS = [
    (re.compile(r'(?i)(password\s*[:=]\s*)[^\s,;&]+'), r'\1[REDACTED]'),
    (re.compile(r'(?i)(bearer\s+)[a-zA-Z0-9_\-\.]+'), r'\1[REDACTED]'),
    (re.compile(r'eyJ[a-zA-Z0-9_\-]+\.eyJ[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+'), r'[JWT_REDACTED]'),
    (re.compile(r'(?i)(api[_-]?key\s*[:=]\s*)[^\s,;&]+'), r'\1[REDACTED]'),
    (re.compile(r'(?i)(secret\s*[:=]\s*)[^\s,;&]+'), r'\1[REDACTED]'),
]


def sanitize_text(text: Optional[str]) -> Optional[str]:
    """Sanitize secrets, JWTs, and passwords from log strings."""
    if not text:
        return text
    sanitized = text
    for pattern, repl in SENSITIVE_PATTERNS:
        sanitized = pattern.sub(repl, sanitized)
    return sanitized


def get_actor_display_info(account: Optional[Account]) -> tuple[str, str]:
    """Resolve display name and role title from an Account model."""
    if not account:
        return "System Daemon", "Resource Engine"

    name = account.username
    role = "Platform User"

    if account.admin_profile:
        name = account.admin_profile.full_name
        role = "Platform Admin"
    elif account.employee_profile:
        name = account.employee_profile.full_name
        role = account.employee_profile.job_title or "Creative Staff"
    elif account.client_profile:
        name = account.client_profile.contact_person or account.client_profile.business_name
        role = "Brand Representative"

    return name, role


def log_activity(
    db: Session,
    actor: Optional[Account],
    action: str,
    target: str,
    subtext: Optional[str] = None,
    action_type: str = "primary",
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    ip_address: str = "127.0.0.1 (Local)",
    client_env: str = "Active Web Client"
) -> ActivityLog:
    """
    Record an immutable activity log entry.
    Enforces secret scrubbing and automatic provenance attribution.
    """
    actor_name, actor_role = get_actor_display_info(actor)
    actor_id = actor.account_id if actor else None

    clean_target = sanitize_text(target) or ""
    clean_subtext = sanitize_text(subtext)

    log_entry = ActivityLog(
        actor_account_id=actor_id,
        actor_name=actor_name,
        actor_role=actor_role,
        action=action,
        action_type=action_type,
        entity_type=entity_type,
        entity_id=entity_id,
        target=clean_target,
        subtext=clean_subtext,
        ip_address=ip_address,
        client_env=client_env
    )
    db.add(log_entry)
    db.flush()
    return log_entry


def create_notification(
    db: Session,
    recipient_account_id: int,
    event_type: str,
    title: str,
    message: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    sender_account_id: Optional[int] = None,
    dedup_key: Optional[str] = None
) -> Optional[Notification]:
    """
    Create an in-app notification with deduplication support.
    If an identical notification with the same dedup_key already exists,
    returns the existing record to guarantee idempotent operations.
    """
    resolved_key = dedup_key
    if not resolved_key and entity_id is not None:
        resolved_key = f"{recipient_account_id}:{event_type}:{entity_type or 'Item'}:{entity_id}"

    if resolved_key:
        existing = db.query(Notification).filter(Notification.dedup_key == resolved_key).first()
        if existing:
            return existing

    notif = Notification(
        recipient_account_id=recipient_account_id,
        sender_account_id=sender_account_id,
        event_type=event_type,
        title=title,
        message=message,
        entity_type=entity_type,
        entity_id=entity_id,
        dedup_key=resolved_key,
        is_read=False
    )
    db.add(notif)
    db.flush()
    return notif


def format_activity_log_response(log: ActivityLog) -> dict:
    created = log.created_at or datetime.now()
    time_str = created.strftime("%H:%M:%S.%f")[:-3]
    date_str = "Today, " + created.strftime("%b %d")

    words = log.actor_name.split()
    initials = "".join(w[0] for w in words)[:2].upper() if words else "SO"

    return {
        "log_id": log.log_id,
        "actor_account_id": log.actor_account_id,
        "actor_name": log.actor_name,
        "actor_role": log.actor_role,
        "action": log.action,
        "action_type": log.action_type,
        "entity_type": log.entity_type,
        "entity_id": log.entity_id,
        "target": log.target,
        "subtext": log.subtext,
        "ip_address": log.ip_address,
        "client_env": log.client_env,
        "created_at": log.created_at,
        # Frontend presentation attributes
        "id": f"LOG-{log.log_id:04d}",
        "time": time_str,
        "date": date_str,
        "actorName": log.actor_name,
        "actorRole": log.actor_role,
        "avatar": None,
        "initials": initials
    }


def format_notification_response(notif: Notification) -> dict:
    sender_name = "Agency System"
    if notif.sender:
        sender_name, _ = get_actor_display_info(notif.sender)

    # Relative time string calculation
    now = datetime.now()
    created = notif.created_at or now
    delta = now - created
    seconds = int(delta.total_seconds())

    if seconds < 60:
        time_ago = "Just now"
    elif seconds < 3600:
        time_ago = f"{seconds // 60}m ago"
    elif seconds < 86400:
        time_ago = f"{seconds // 3600}h ago"
    else:
        time_ago = created.strftime("%b %d")

    return {
        "notification_id": notif.notification_id,
        "recipient_account_id": notif.recipient_account_id,
        "sender_account_id": notif.sender_account_id,
        "sender_name": sender_name,
        "event_type": notif.event_type,
        "title": notif.title,
        "message": notif.message,
        "entity_type": notif.entity_type,
        "entity_id": notif.entity_id,
        "is_read": notif.is_read,
        "read_at": notif.read_at,
        "created_at": notif.created_at,
        "time_ago": time_ago
    }

