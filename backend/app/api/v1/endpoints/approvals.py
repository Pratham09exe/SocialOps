from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app.db.session import get_db
from app.core.permissions import get_current_user
from app.models.account import Account, AccountRole
from app.models.content import (
    Approval, ContentItem, ContentStatus, ApprovalStage, ApprovalDecision,
    ClientFeedback, FeedbackType, FeedbackStatus
)
from app.schemas.approval import ApprovalReviewRequest, ApprovalResponse
from app.core.events import log_activity, create_notification

router = APIRouter()

# Unsplash visual asset thumbnails matching Figma aesthetics
SAMPLE_THUMBNAILS = [
    "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=300&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=300&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80"
]

def format_approval_response(appr: Approval) -> dict:
    item = appr.content_item
    client_name = item.client.business_name if item and item.client else "Brand Account"
    
    # Review cycle counter based on approvals count
    cycle_num = len(item.approvals or []) if item and item.approvals else 1
    revision_cycle = f"v{max(1, cycle_num)}"

    # Creator display name
    lead_creator = "Elena Rostova"
    if item and item.assigned_employee:
        lead_creator = item.assigned_employee.full_name
    elif item and item.creator:
        lead_creator = item.creator.admin_profile.full_name if item.creator.admin_profile else item.creator.username

    # Map status
    if appr.decision == ApprovalDecision.APPROVED:
        ui_status = "Approved"
        category = "Approved"
        qa_status = "100% Passed"
        qa_type = "success"
    elif appr.decision in [ApprovalDecision.CHANGES_REQUESTED, ApprovalDecision.URGENT_CHANGES_REQUESTED]:
        ui_status = "Urgent Changes Requested"
        category = "Urgent Changes Requested"
        qa_status = "Revision Enforced"
        qa_type = "warning"
    elif appr.stage == ApprovalStage.CLIENT_REVIEW:
        ui_status = "Client Review Required"
        category = "Client Review Required"
        qa_status = "QA Certified"
        qa_type = "info"
    else:
        ui_status = "Needs Internal Review"
        category = "Needs Internal Review"
        qa_status = "Internal QA"
        qa_type = "primary"

    thumbnail = SAMPLE_THUMBNAILS[(appr.approval_id - 1) % len(SAMPLE_THUMBNAILS)]

    return {
        "approval_id": appr.approval_id,
        "content_id": appr.content_id,
        "reviewer_account_id": appr.reviewer_account_id,
        "stage": appr.stage.value if hasattr(appr.stage, "value") else str(appr.stage),
        "decision": appr.decision.value if hasattr(appr.decision, "value") else str(appr.decision),
        "review_comments": appr.review_comments,
        "submitted_at": appr.submitted_at,
        "reviewed_at": appr.reviewed_at,
        # UI compatibility
        "id": f"APP-{appr.approval_id}",
        "client": client_name.upper(),
        "format": item.content_type if item else "Reel 9:16",
        "slaRemaining": "18h 40m left",
        "slaUrgent": (appr.decision == ApprovalDecision.URGENT_CHANGES_REQUESTED),
        "status": ui_status,
        "category": category,
        "title": item.title if item else "Content Deliverable",
        "description": item.caption or (item.title if item else ""),
        "submittedDate": appr.submitted_at.strftime("%b %d, %I:%M %p") if appr.submitted_at else "Today",
        "leadCreator": lead_creator,
        "qaStatus": qa_status,
        "qaType": qa_type,
        "revisionCycle": revision_cycle,
        "thumbnail": thumbnail,
        "mediaDuration": "Asset Proof",
        "driveUrl": item.external_content_url if item else "https://drive.google.com",
        "feedback": appr.review_comments
    }


@router.get("", response_model=List[ApprovalResponse])
def get_approvals(
    status_filter: Optional[str] = Query(None, alias="status"),
    stage_filter: Optional[str] = Query(None, alias="stage"),
    db: Session = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    List approvals with object-level authorization:
    - Client sees only approval records for deliverables belonging to their account.
    - Admin & Employee can view all approval queue items.
    """
    query = (
        db.query(Approval)
        .join(ContentItem, Approval.content_id == ContentItem.content_id)
        .options(
            joinedload(Approval.content_item).joinedload(ContentItem.client),
            joinedload(Approval.content_item).joinedload(ContentItem.assigned_employee),
            joinedload(Approval.content_item).joinedload(ContentItem.creator),
            joinedload(Approval.reviewer)
        )
    )

    if current_user.role == AccountRole.CLIENT:
        query = query.filter(ContentItem.client_account_id == current_user.account_id)

    if stage_filter and stage_filter != "All":
        query = query.filter(Approval.stage == stage_filter)

    approvals = query.order_by(Approval.approval_id.desc()).all()
    results = []
    for a in approvals:
        formatted = format_approval_response(a)
        if status_filter and status_filter != "All Pending":
            if formatted["status"] != status_filter:
                continue
        elif status_filter == "All Pending":
            if formatted["status"] == "Approved":
                continue
        results.append(formatted)

    return results


@router.post("/{approval_id}/review", response_model=ApprovalResponse)
def review_approval(
    approval_id: int,
    payload: ApprovalReviewRequest,
    db: Session = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    Review deliverable decision (Approve or Request Changes).
    - Client can only review deliverables belonging to their client account.
    - Transactional consistency: updates approval decision, content item status, and logs feedback atomically.
    """
    approval = (
        db.query(Approval)
        .options(
            joinedload(Approval.content_item).joinedload(ContentItem.client),
            joinedload(Approval.content_item).joinedload(ContentItem.assigned_employee),
            joinedload(Approval.content_item).joinedload(ContentItem.creator)
        )
        .filter(Approval.approval_id == approval_id)
        .first()
    )

    if not approval:
        raise HTTPException(status_code=404, detail="Approval record not found")

    content_item = approval.content_item
    if not content_item:
        raise HTTPException(status_code=404, detail="Associated content item not found")

    # Object-level authorization for client
    if current_user.role == AccountRole.CLIENT and content_item.client_account_id != current_user.account_id:
        raise HTTPException(status_code=403, detail="Access denied: Cannot review another client's deliverable")

    # Resolve decision comments
    comments = payload.review_comments or payload.feedbackNotes or (
        "Approved and verified for publication." if payload.decision == ApprovalDecision.APPROVED else "Changes requested on deliverable."
    )

    # 1. Update Approval Record
    approval.decision = payload.decision
    approval.review_comments = comments
    approval.reviewed_at = datetime.now(timezone.utc).replace(tzinfo=None)
    approval.reviewer_account_id = current_user.account_id

    # 2. Synchronize Content Item Status
    if payload.decision == ApprovalDecision.APPROVED:
        content_item.status = ContentStatus.APPROVED
    else:
        content_item.status = ContentStatus.URGENT_CHANGES_REQUESTED
        # 3. Automatically record Client Feedback for revision traceability
        feedback = ClientFeedback(
            client_account_id=content_item.client_account_id,
            content_id=content_item.content_id,
            submitted_by_account_id=current_user.account_id,
            feedback_type=FeedbackType.REVISION_REQUEST,
            category="Creative Direction",
            description=comments,
            priority="Urgent" if payload.decision == ApprovalDecision.URGENT_CHANGES_REQUESTED else "Medium",
            status=FeedbackStatus.OPEN
        )
        db.add(feedback)

    # Phase 6: Automated activity log and notification dispatch
    recipient_id = content_item.assigned_employee_id or content_item.created_by_account_id
    if payload.decision == ApprovalDecision.APPROVED:
        log_activity(
            db=db,
            actor=current_user,
            action="Content Approved",
            target=content_item.title,
            subtext=f"Client: {content_item.client.business_name if content_item.client else 'Brand'} • Verified for publication",
            action_type="success",
            entity_type="ContentItem",
            entity_id=content_item.content_id
        )
        if recipient_id:
            create_notification(
                db=db,
                recipient_account_id=recipient_id,
                event_type="CONTENT_APPROVED",
                title="Deliverable Approved",
                message=f"Deliverable '{content_item.title}' has been approved.",
                entity_type="ContentItem",
                entity_id=content_item.content_id,
                sender_account_id=current_user.account_id
            )
    else:
        log_activity(
            db=db,
            actor=current_user,
            action="Revision Requested",
            target=content_item.title,
            subtext=f"Feedback: {comments[:80]}",
            action_type="warning",
            entity_type="ContentItem",
            entity_id=content_item.content_id
        )
        if recipient_id:
            create_notification(
                db=db,
                recipient_account_id=recipient_id,
                event_type="REVISION_REQUESTED",
                title="Revision Requested",
                message=f"Changes requested on '{content_item.title}': {comments}",
                entity_type="ContentItem",
                entity_id=content_item.content_id,
                sender_account_id=current_user.account_id
            )

    # Commit atomic transaction
    db.commit()
    db.refresh(approval)

    return format_approval_response(approval)
