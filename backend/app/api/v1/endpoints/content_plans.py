from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from app.db.session import get_db
from app.core.permissions import get_current_user, require_role
from app.models.account import Account, AccountRole, Client
from app.models.content import ContentPlan, ContentPlanTarget, PlanStatus
from app.schemas.content import (
    ContentPlanCreate, ContentPlanUpdate, ContentPlanResponse,
    ContentPlanTargetCreate, ContentPlanTargetResponse
)

router = APIRouter()

def format_plan_response(plan: ContentPlan) -> dict:
    client_name = plan.client.business_name if plan.client else "Client Account"
    targets = [
        ContentPlanTargetResponse(
            target_id=t.target_id,
            content_plan_id=t.content_plan_id,
            category=t.category,
            posts_target=t.posts_target,
            stories_target=t.stories_target,
            ads_target=t.ads_target,
            created_at=t.created_at
        ) for t in (plan.targets or [])
    ]
    return {
        "content_plan_id": plan.content_plan_id,
        "client_account_id": plan.client_account_id,
        "report_month": plan.report_month,
        "campaign_notes": plan.campaign_notes,
        "status": plan.status.value if hasattr(plan.status, "value") else str(plan.status),
        "client_name": client_name,
        "targets": targets,
        "created_at": plan.created_at,
        "updated_at": plan.updated_at
    }


@router.get("", response_model=List[ContentPlanResponse])
def get_content_plans(
    client_id: Optional[int] = Query(None),
    report_month: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    List content plans with object-level authorization:
    - Client sees only their own plans.
    - Admin/Employee can filter by client or view all.
    """
    query = (
        db.query(ContentPlan)
        .options(joinedload(ContentPlan.client), joinedload(ContentPlan.targets))
    )

    if current_user.role == AccountRole.CLIENT:
        query = query.filter(ContentPlan.client_account_id == current_user.account_id)
    elif client_id:
        query = query.filter(ContentPlan.client_account_id == client_id)

    if report_month:
        query = query.filter(ContentPlan.report_month == report_month)

    plans = query.order_by(ContentPlan.report_month.desc()).all()
    return [format_plan_response(p) for p in plans]


@router.post("", response_model=ContentPlanResponse, status_code=status.HTTP_201_CREATED)
def create_content_plan(
    payload: ContentPlanCreate,
    db: Session = Depends(get_db),
    current_user: Account = Depends(require_role([AccountRole.ADMIN, AccountRole.EMPLOYEE]))
):
    """
    Create a new content plan with optional initial targets. Admin & Employee only.
    """
    target_client_id = payload.client_account_id
    if not target_client_id and payload.client:
        c = db.query(Client).filter(Client.business_name.ilike(f"%{payload.client}%")).first()
        if c:
            target_client_id = c.account_id

    if not target_client_id:
        first_c = db.query(Client).first()
        if first_c:
            target_client_id = first_c.account_id
        else:
            raise HTTPException(status_code=400, detail="client_account_id is required")

    client = db.query(Client).filter(Client.account_id == target_client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Referenced client does not exist")

    plan = ContentPlan(
        client_account_id=target_client_id,
        report_month=payload.report_month,
        campaign_notes=payload.campaign_notes,
        status=payload.status or PlanStatus.ACTIVE
    )
    db.add(plan)
    db.flush()

    if payload.targets:
        for t in payload.targets:
            db.add(ContentPlanTarget(
                content_plan_id=plan.content_plan_id,
                category=t.category,
                posts_target=t.posts_target,
                stories_target=t.stories_target,
                ads_target=t.ads_target
            ))

    db.commit()
    db.refresh(plan)

    return format_plan_response(plan)


@router.get("/{plan_id}", response_model=ContentPlanResponse)
def get_content_plan_by_id(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    Get a single content plan by ID with object-level authorization.
    """
    plan = (
        db.query(ContentPlan)
        .options(joinedload(ContentPlan.client), joinedload(ContentPlan.targets))
        .filter(ContentPlan.content_plan_id == plan_id)
        .first()
    )
    if not plan:
        raise HTTPException(status_code=404, detail="Content plan not found")

    if current_user.role == AccountRole.CLIENT and plan.client_account_id != current_user.account_id:
        raise HTTPException(status_code=403, detail="Access denied: Cannot access another client's plan")

    return format_plan_response(plan)


@router.patch("/{plan_id}", response_model=ContentPlanResponse)
def update_content_plan(
    plan_id: int,
    payload: ContentPlanUpdate,
    db: Session = Depends(get_db),
    current_user: Account = Depends(require_role([AccountRole.ADMIN, AccountRole.EMPLOYEE]))
):
    """
    Update content plan notes or status. Admin and Employee only.
    """
    plan = (
        db.query(ContentPlan)
        .options(joinedload(ContentPlan.client), joinedload(ContentPlan.targets))
        .filter(ContentPlan.content_plan_id == plan_id)
        .first()
    )
    if not plan:
        raise HTTPException(status_code=404, detail="Content plan not found")

    if payload.campaign_notes is not None:
        plan.campaign_notes = payload.campaign_notes
    if payload.status is not None:
        plan.status = payload.status

    db.commit()
    db.refresh(plan)
    return format_plan_response(plan)


@router.get("/{plan_id}/targets", response_model=List[ContentPlanTargetResponse])
def get_plan_targets(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    List targets for a specific content plan with object-level authorization.
    """
    plan = db.query(ContentPlan).filter(ContentPlan.content_plan_id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Content plan not found")

    if current_user.role == AccountRole.CLIENT and plan.client_account_id != current_user.account_id:
        raise HTTPException(status_code=403, detail="Access denied: Cannot access another client's plan targets")

    targets = db.query(ContentPlanTarget).filter(ContentPlanTarget.content_plan_id == plan_id).all()
    return targets


@router.post("/{plan_id}/targets", response_model=ContentPlanTargetResponse, status_code=status.HTTP_201_CREATED)
def create_plan_target(
    plan_id: int,
    payload: ContentPlanTargetCreate,
    db: Session = Depends(get_db),
    current_user: Account = Depends(require_role([AccountRole.ADMIN, AccountRole.EMPLOYEE]))
):
    """
    Add a category target to a content plan. Enforces uniqueness constraint.
    """
    plan = db.query(ContentPlan).filter(ContentPlan.content_plan_id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Content plan not found")

    existing = db.query(ContentPlanTarget).filter(
        ContentPlanTarget.content_plan_id == plan_id,
        ContentPlanTarget.category == payload.category
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Target for category '{payload.category}' already exists in this plan")

    target = ContentPlanTarget(
        content_plan_id=plan_id,
        category=payload.category,
        posts_target=payload.posts_target,
        stories_target=payload.stories_target,
        ads_target=payload.ads_target
    )
    db.add(target)
    db.commit()
    db.refresh(target)
    return target
