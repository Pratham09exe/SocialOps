from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from app.db.session import get_db
from app.core.permissions import get_current_user
from app.models.account import Account, AccountRole, Client
from app.models.content import Attachment, ClientFeedback
from app.models.finance import Expense
from app.schemas.attachment import AttachmentCreate, AttachmentResponse

router = APIRouter()

def format_attachment_response(att: Attachment) -> dict:
    uploader_name = "System User"
    if att.uploader:
        if att.uploader.admin_profile:
            uploader_name = att.uploader.admin_profile.full_name
        elif att.uploader.employee_profile:
            uploader_name = att.uploader.employee_profile.full_name
        elif att.uploader.client_profile:
            uploader_name = att.uploader.client_profile.business_name
        else:
            uploader_name = att.uploader.username

    return {
        "attachment_id": att.attachment_id,
        "client_account_id": att.client_account_id,
        "feedback_id": att.feedback_id,
        "expense_id": att.expense_id,
        "uploaded_by_account_id": att.uploaded_by_account_id,
        "file_name": att.file_name,
        "storage_url": att.storage_url,
        "mime_type": att.mime_type,
        "file_size_bytes": att.file_size_bytes,
        "created_at": att.created_at,
        "uploader_name": uploader_name
    }


@router.get("", response_model=List[AttachmentResponse])
def get_attachments(
    client_id: Optional[int] = Query(None),
    feedback_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    List attachment metadata with object-level authorization:
    - Client sees only attachments linked to their client account or their feedback.
    - Admin/Employee can view all or filter by client.
    """
    query = (
        db.query(Attachment)
        .options(
            joinedload(Attachment.uploader).joinedload(Account.admin_profile),
            joinedload(Attachment.uploader).joinedload(Account.employee_profile),
            joinedload(Attachment.uploader).joinedload(Account.client_profile)
        )
    )

    if current_user.role == AccountRole.CLIENT:
        query = query.filter(
            Attachment.client_account_id == current_user.account_id,
            Attachment.expense_id.is_(None)
        )
    elif client_id:
        query = query.filter(Attachment.client_account_id == client_id)

    if feedback_id:
        query = query.filter(Attachment.feedback_id == feedback_id)

    attachments = query.order_by(Attachment.created_at.desc()).all()
    return [format_attachment_response(att) for att in attachments]


@router.post("", response_model=AttachmentResponse, status_code=status.HTTP_201_CREATED)
def create_attachment_metadata(
    payload: AttachmentCreate,
    db: Session = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    Record attachment metadata for an existing external or client asset reference.
    Validates ownership of referenced client, feedback, or expense.
    """
    target_client_id = payload.client_account_id
    if current_user.role == AccountRole.CLIENT:
        target_client_id = current_user.account_id

    if payload.expense_id:
        if current_user.role == AccountRole.CLIENT:
            raise HTTPException(status_code=403, detail="Clients cannot link attachments to internal expenses")
        exp = db.query(Expense).filter(Expense.expense_id == payload.expense_id).first()
        if not exp:
            raise HTTPException(status_code=404, detail="Referenced expense does not exist")

    if payload.feedback_id:
        fb = db.query(ClientFeedback).filter(ClientFeedback.feedback_id == payload.feedback_id).first()
        if not fb:
            raise HTTPException(status_code=404, detail="Referenced feedback does not exist")
        if current_user.role == AccountRole.CLIENT and fb.client_account_id != current_user.account_id:
            raise HTTPException(status_code=403, detail="Cannot link attachment to another client's feedback")
        if not target_client_id:
            target_client_id = fb.client_account_id

    if target_client_id:
        c = db.query(Client).filter(Client.account_id == target_client_id).first()
        if not c:
            raise HTTPException(status_code=404, detail="Referenced client does not exist")

    att = Attachment(
        client_account_id=target_client_id,
        feedback_id=payload.feedback_id,
        expense_id=payload.expense_id,
        uploaded_by_account_id=current_user.account_id,
        file_name=payload.file_name,
        storage_url=payload.storage_url,
        mime_type=payload.mime_type or "application/octet-stream",
        file_size_bytes=payload.file_size_bytes or 0
    )
    db.add(att)
    db.commit()
    db.refresh(att)

    att_reloaded = (
        db.query(Attachment)
        .options(
            joinedload(Attachment.uploader).joinedload(Account.admin_profile),
            joinedload(Attachment.uploader).joinedload(Account.employee_profile),
            joinedload(Attachment.uploader).joinedload(Account.client_profile)
        )
        .filter(Attachment.attachment_id == att.attachment_id)
        .first()
    )

    return format_attachment_response(att_reloaded)
