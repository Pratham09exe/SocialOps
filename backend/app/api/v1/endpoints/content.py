from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from app.db.session import get_db
from app.core.permissions import get_current_user, require_role
from app.models.account import Account, AccountRole, Client
from app.models.content import (
    ContentItem, ContentStatus, Approval, ApprovalStage, ApprovalDecision, ContentPlan
)
from app.schemas.content import (
    ContentItemCreate, ContentItemUpdate, ContentItemResponse
)
from app.core.events import log_activity, create_notification

router = APIRouter()

def format_content_response(item: ContentItem, is_client: bool = False) -> dict:
    client_name = item.client.business_name if item.client else "Client Account"
    
    return {
        "content_id": item.content_id,
        "client_account_id": item.client_account_id,
        "plan_id": item.plan_id,
        "assigned_employee_id": item.assigned_employee_id,
        "created_by_account_id": item.created_by_account_id,
        "title": item.title,
        "content_type": item.content_type,
        "platform": item.platform,
        "caption": item.caption,
        "hashtags": item.hashtags,
        "external_content_url": item.external_content_url,
        "brief_notes": None if is_client else item.brief_notes,  # Strict privacy: hide internal notes from clients
        "production_due_date": item.production_due_date,
        "scheduled_publish_at": item.scheduled_publish_at,
        "status": item.status.value if hasattr(item.status, "value") else str(item.status),
        "created_at": item.created_at,
        "updated_at": item.updated_at,
        # UI compatibility
        "id": f"SUB-{item.content_id:04d}",
        "client": client_name,
        "format": item.content_type,
        "driveUrl": item.external_content_url,
        "submittedAt": item.created_at.strftime("%b %d, %I:%M %p") if item.created_at else "Today"
    }


@router.get("", response_model=List[ContentItemResponse])
def get_content_items(
    client_id: Optional[int] = Query(None),
    platform: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    assigned_employee_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    List content items with object-level authorization:
    - Client accounts see only their own deliverables.
    - Admin & Employee can view agency-wide content or filter by client.
    """
    query = (
        db.query(ContentItem)
        .options(
            joinedload(ContentItem.client),
            joinedload(ContentItem.assigned_employee),
            joinedload(ContentItem.creator)
        )
    )

    is_client = current_user.role == AccountRole.CLIENT
    if is_client:
        query = query.filter(ContentItem.client_account_id == current_user.account_id)
    elif client_id:
        query = query.filter(ContentItem.client_account_id == client_id)

    if platform and platform != "All":
        query = query.filter(ContentItem.platform == platform)

    if status_filter and status_filter != "All":
        query = query.filter(ContentItem.status == status_filter)

    if assigned_employee_id:
        query = query.filter(ContentItem.assigned_employee_id == assigned_employee_id)

    items = query.order_by(ContentItem.created_at.desc()).all()
    return [format_content_response(item, is_client=is_client) for item in items]


@router.post("/submissions", response_model=ContentItemResponse, status_code=status.HTTP_201_CREATED)
def submit_content_deliverable(
    payload: ContentItemCreate,
    db: Session = Depends(get_db),
    current_user: Account = Depends(require_role([AccountRole.ADMIN, AccountRole.EMPLOYEE]))
):
    """
    Agency Employee or Admin: Submit a content deliverable with a manual Google Drive link.
    Clients are forbidden from submitting internal agency content.
    Automatically initializes an Approval record in stage 'Internal Review'.
    """
    # 1. Resolve client
    target_client_id = payload.client_account_id
    if not target_client_id and payload.client:
        c = db.query(Client).filter(Client.business_name.ilike(f"%{payload.client}%")).first()
        if c:
            target_client_id = c.account_id

    if not target_client_id:
        # Fallback to first available client
        first_c = db.query(Client).first()
        if first_c:
            target_client_id = first_c.account_id
        else:
            raise HTTPException(status_code=400, detail="A valid client is required for content submission")

    client_record = db.query(Client).filter(Client.account_id == target_client_id).first()
    if not client_record:
        raise HTTPException(status_code=404, detail="Referenced client does not exist")

    # 2. Resolve content plan if provided
    plan_id = payload.plan_id
    if plan_id:
        plan = db.query(ContentPlan).filter(ContentPlan.content_plan_id == plan_id).first()
        if not plan:
            raise HTTPException(status_code=404, detail="Referenced content plan does not exist")
        if plan.client_account_id != target_client_id:
            raise HTTPException(status_code=400, detail="Content plan must belong to the same client")

    # 3. Resolve Drive URL
    drive_url = payload.external_content_url or payload.driveUrl
    if not drive_url:
        raise HTTPException(status_code=422, detail="A valid Google Drive or cloud asset URL is required")

    # 4. Resolve format & platform
    content_format = payload.content_type or payload.targetPlatform or "Reel 9:16"
    target_platform = payload.platform or "instagram"

    # 5. Title & Notes
    title = payload.title or (payload.caption[:50] if payload.caption else "New Content Deliverable")
    brief_notes = payload.brief_notes or payload.internalNotes

    # 6. Assignee
    assignee_id = payload.assigned_employee_id
    if not assignee_id and current_user.role == AccountRole.EMPLOYEE:
        assignee_id = current_user.account_id

    # Create Content Item
    content_item = ContentItem(
        client_account_id=target_client_id,
        plan_id=plan_id,
        assigned_employee_id=assignee_id,
        created_by_account_id=current_user.account_id,
        title=title,
        content_type=content_format,
        platform=target_platform,
        caption=payload.caption,
        hashtags=payload.hashtags,
        external_content_url=drive_url,
        brief_notes=brief_notes,
        production_due_date=payload.production_due_date,
        scheduled_publish_at=payload.scheduled_publish_at,
        status=ContentStatus.NEEDS_INTERNAL_REVIEW
    )
    db.add(content_item)
    db.flush()

    # Automatically initialize Approval entry in queue
    approval = Approval(
        content_id=content_item.content_id,
        reviewer_account_id=None,
        stage=ApprovalStage.INTERNAL_REVIEW,
        decision=ApprovalDecision.PENDING,
        review_comments="Initial deliverable staging awaiting QA review."
    )
    db.add(approval)
    db.flush()

    # Phase 6: Automated activity log and notification dispatch
    log_activity(
        db=db,
        actor=current_user,
        action="Deliverable Submitted",
        target=f"{content_item.content_type} - {client_record.business_name}",
        subtext=f"Linked Cloud URL: {content_item.external_content_url}",
        action_type="primary",
        entity_type="ContentItem",
        entity_id=content_item.content_id
    )

    admin_account = db.query(Account).filter(Account.role == AccountRole.ADMIN).first()
    if admin_account:
        create_notification(
            db=db,
            recipient_account_id=admin_account.account_id,
            event_type="CONTENT_SUBMITTED",
            title="Content Submitted for Review",
            message=f"New deliverable '{content_item.title}' submitted for {client_record.business_name}.",
            entity_type="ContentItem",
            entity_id=content_item.content_id,
            sender_account_id=current_user.account_id
        )

    db.commit()
    db.refresh(content_item)

    return format_content_response(content_item, is_client=False)


@router.get("/{content_id}", response_model=ContentItemResponse)
def get_content_item_by_id(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    Retrieve single content item with object-level authorization.
    """
    item = (
        db.query(ContentItem)
        .options(
            joinedload(ContentItem.client),
            joinedload(ContentItem.assigned_employee),
            joinedload(ContentItem.creator)
        )
        .filter(ContentItem.content_id == content_id)
        .first()
    )

    if not item:
        raise HTTPException(status_code=404, detail="Content item not found")

    is_client = current_user.role == AccountRole.CLIENT
    if is_client and item.client_account_id != current_user.account_id:
        raise HTTPException(status_code=403, detail="Access denied: Cannot access another client's deliverable")

    return format_content_response(item, is_client=is_client)


@router.patch("/{content_id}", response_model=ContentItemResponse)
def update_content_item(
    content_id: int,
    payload: ContentItemUpdate,
    db: Session = Depends(get_db),
    current_user: Account = Depends(require_role([AccountRole.ADMIN, AccountRole.EMPLOYEE]))
):
    """
    Update content item details. Admin & Employee only.
    """
    item = db.query(ContentItem).filter(ContentItem.content_id == content_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Content item not found")

    if payload.title is not None:
        item.title = payload.title
    if payload.platform is not None:
        item.platform = payload.platform
    if payload.caption is not None:
        item.caption = payload.caption
    if payload.hashtags is not None:
        item.hashtags = payload.hashtags
    if payload.external_content_url is not None:
        item.external_content_url = payload.external_content_url
    if payload.brief_notes is not None:
        item.brief_notes = payload.brief_notes
    if payload.status is not None:
        item.status = payload.status
    if payload.production_due_date is not None:
        item.production_due_date = payload.production_due_date
    if payload.scheduled_publish_at is not None:
        item.scheduled_publish_at = payload.scheduled_publish_at

    db.commit()
    db.refresh(item)
    return format_content_response(item, is_client=False)
