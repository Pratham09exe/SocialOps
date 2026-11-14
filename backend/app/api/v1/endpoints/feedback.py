from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from app.db.session import get_db
from app.core.permissions import get_current_user
from app.models.account import Account, AccountRole, Client
from app.models.content import ClientFeedback, FeedbackType, FeedbackStatus, ContentItem
from app.schemas.feedback import (
    ClientFeedbackCreate, ClientFeedbackResponse
)

router = APIRouter()

def format_feedback_response(fb: ClientFeedback) -> dict:
    client_name = fb.client.business_name if fb.client else "Client Account"
    
    submitted_name = "Client User"
    if fb.submitted_by:
        if fb.submitted_by.admin_profile:
            submitted_name = fb.submitted_by.admin_profile.full_name
        elif fb.submitted_by.employee_profile:
            submitted_name = fb.submitted_by.employee_profile.full_name
        elif fb.submitted_by.client_profile:
            submitted_name = fb.submitted_by.client_profile.contact_person or fb.submitted_by.client_profile.business_name
        else:
            submitted_name = fb.submitted_by.username

    return {
        "feedback_id": fb.feedback_id,
        "client_account_id": fb.client_account_id,
        "content_id": fb.content_id,
        "submitted_by_account_id": fb.submitted_by_account_id,
        "feedback_type": fb.feedback_type.value if hasattr(fb.feedback_type, "value") else str(fb.feedback_type),
        "category": fb.category,
        "description": fb.description,
        "reference_url": fb.reference_url,
        "rating": fb.rating,
        "comments": fb.comments,
        "priority": fb.priority,
        "status": fb.status.value if hasattr(fb.status, "value") else str(fb.status),
        "created_at": fb.created_at,
        "client_name": client_name,
        "submitted_by_name": submitted_name
    }


@router.get("", response_model=List[ClientFeedbackResponse])
def get_client_feedbacks(
    client_id: Optional[int] = Query(None),
    content_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    List feedback with object-level authorization:
    - Client sees only their own feedback.
    - Admin/Employee see all or filtered by client.
    """
    query = (
        db.query(ClientFeedback)
        .options(
            joinedload(ClientFeedback.client),
            joinedload(ClientFeedback.submitted_by).joinedload(Account.client_profile),
            joinedload(ClientFeedback.submitted_by).joinedload(Account.admin_profile),
            joinedload(ClientFeedback.submitted_by).joinedload(Account.employee_profile)
        )
    )

    if current_user.role == AccountRole.CLIENT:
        query = query.filter(ClientFeedback.client_account_id == current_user.account_id)
    elif client_id:
        query = query.filter(ClientFeedback.client_account_id == client_id)

    if content_id:
        query = query.filter(ClientFeedback.content_id == content_id)

    feedbacks = query.order_by(ClientFeedback.created_at.desc()).all()
    return [format_feedback_response(fb) for fb in feedbacks]


@router.post("", response_model=ClientFeedbackResponse, status_code=status.HTTP_201_CREATED)
def create_feedback(
    payload: ClientFeedbackCreate,
    db: Session = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    Submit client feedback:
    - If user is Client, automatically forces client_account_id = current_user.account_id.
    - If content_id provided, validates content item belongs to the same client.
    """
    target_client_id = payload.client_account_id
    if current_user.role == AccountRole.CLIENT:
        target_client_id = current_user.account_id
    elif not target_client_id:
        raise HTTPException(status_code=400, detail="client_account_id is required")

    client = db.query(Client).filter(Client.account_id == target_client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Referenced client does not exist")

    if payload.content_id:
        item = db.query(ContentItem).filter(ContentItem.content_id == payload.content_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Referenced content item does not exist")
        if item.client_account_id != target_client_id:
            raise HTTPException(status_code=400, detail="Content item belongs to a different client")

    fb = ClientFeedback(
        client_account_id=target_client_id,
        content_id=payload.content_id,
        submitted_by_account_id=current_user.account_id,
        feedback_type=payload.feedback_type or FeedbackType.REVISION_REQUEST,
        category=payload.category or "Creative Direction",
        description=payload.description,
        reference_url=payload.reference_url,
        rating=payload.rating,
        comments=payload.comments,
        priority=payload.priority or "Medium",
        status=FeedbackStatus.OPEN
    )
    db.add(fb)
    db.commit()
    db.refresh(fb)

    # Re-fetch with associations
    fb_reloaded = (
        db.query(ClientFeedback)
        .options(
            joinedload(ClientFeedback.client),
            joinedload(ClientFeedback.submitted_by).joinedload(Account.client_profile),
            joinedload(ClientFeedback.submitted_by).joinedload(Account.admin_profile),
            joinedload(ClientFeedback.submitted_by).joinedload(Account.employee_profile)
        )
        .filter(ClientFeedback.feedback_id == fb.feedback_id)
        .first()
    )

    return format_feedback_response(fb_reloaded)


@router.get("/{feedback_id}", response_model=ClientFeedbackResponse)
def get_feedback_by_id(
    feedback_id: int,
    db: Session = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    Get a single feedback item by ID with object-level authorization.
    """
    fb = (
        db.query(ClientFeedback)
        .options(
            joinedload(ClientFeedback.client),
            joinedload(ClientFeedback.submitted_by).joinedload(Account.client_profile),
            joinedload(ClientFeedback.submitted_by).joinedload(Account.admin_profile),
            joinedload(ClientFeedback.submitted_by).joinedload(Account.employee_profile)
        )
        .filter(ClientFeedback.feedback_id == feedback_id)
        .first()
    )
    if not fb:
        raise HTTPException(status_code=404, detail="Feedback not found")

    if current_user.role == AccountRole.CLIENT and fb.client_account_id != current_user.account_id:
        raise HTTPException(status_code=403, detail="Access denied: Cannot view another client's feedback")

    return format_feedback_response(fb)
