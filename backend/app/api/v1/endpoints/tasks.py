from datetime import date, timedelta
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app.db.session import get_db
from app.core.permissions import get_current_user, require_role
from app.models.account import Account, AccountRole, Client, Employee
from app.models.task import Task, TaskPriority, TaskStatus
from app.schemas.task import (
    TaskCreate, TaskUpdate, TaskResponse,
    WorkloadSummaryResponse, WorkloadEmployeeMetrics
)
from app.core.events import log_activity, create_notification

router = APIRouter()

# Unsplash avatars for clean UI consistency
SAMPLE_AVATARS = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
]

def format_task_response(task: Task) -> dict:
    today = date.today()
    days_left = (task.due_date - today).days

    if task.status == TaskStatus.COMPLETED:
        sla = "Done"
    elif days_left < 0:
        sla = f"{abs(days_left)}d overdue"
    elif days_left == 0:
        sla = "Due today"
    elif days_left == 1:
        sla = "24h left"
    else:
        sla = f"{days_left * 24}h left"

    client_name = task.client.business_name if task.client else "Client Account"
    assignee_name = task.assignee.full_name if task.assignee else "Unassigned"
    
    # Creator name
    creator_name = "Agency Admin"
    if task.creator:
        if task.creator.admin_profile:
            creator_name = task.creator.admin_profile.full_name
        elif task.creator.employee_profile:
            creator_name = task.creator.employee_profile.full_name
        elif task.creator.client_profile:
            creator_name = task.creator.client_profile.business_name
        else:
            creator_name = task.creator.username

    channel = "Instagram"
    if task.client and task.client.social_accounts:
        channel = task.client.social_accounts[0].platform

    return {
        "task_id": task.task_id,
        "client_account_id": task.client_account_id,
        "assigned_employee_id": task.assigned_employee_id,
        "created_by_account_id": task.created_by_account_id,
        "title": task.title,
        "description": task.description,
        "priority": task.priority.value if hasattr(task.priority, "value") else str(task.priority),
        "status": task.status.value if hasattr(task.status, "value") else str(task.status),
        "due_date": task.due_date,
        "estimated_hours": task.estimated_hours,
        "content_reference_url": task.content_reference_url,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
        "client_name": client_name,
        "assignee_name": assignee_name,
        "creator_name": creator_name,
        # UI compatibility
        "id": f"TSK-{task.task_id}",
        "client": client_name,
        "channel": channel,
        "stage": task.status.value if hasattr(task.status, "value") else str(task.status),
        "assignee": assignee_name,
        "dueDate": task.due_date.strftime("%b %d"),
        "sla": sla
    }


# --------------------------------------------------------------------------
# TASK ENDPOINTS
# --------------------------------------------------------------------------

@router.get("/tasks", response_model=List[TaskResponse])
def get_tasks(
    client_id: Optional[int] = Query(None),
    assigned_employee_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    priority_filter: Optional[str] = Query(None, alias="priority"),
    overdue: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    List tasks with object-level authorization:
    - Admin: Agency-wide tasks.
    - Employee: Authorized agency tasks.
    - Client: Only their own client tasks.
    """
    query = (
        db.query(Task)
        .options(
            joinedload(Task.client).joinedload(Client.social_accounts),
            joinedload(Task.assignee),
            joinedload(Task.creator).joinedload(Account.admin_profile),
            joinedload(Task.creator).joinedload(Account.employee_profile)
        )
    )

    # Object-level authorization for Client
    if current_user.role == AccountRole.CLIENT:
        query = query.filter(Task.client_account_id == current_user.account_id)
    elif client_id:
        query = query.filter(Task.client_account_id == client_id)

    if assigned_employee_id:
        query = query.filter(Task.assigned_employee_id == assigned_employee_id)

    if status_filter and status_filter != "All":
        query = query.filter(Task.status == status_filter)

    if priority_filter and priority_filter != "All":
        query = query.filter(Task.priority == priority_filter)

    if overdue:
        query = query.filter(Task.due_date < date.today(), Task.status.notin_([TaskStatus.COMPLETED, TaskStatus.CANCELLED]))

    if search:
        s = f"%{search.lower()}%"
        query = query.filter(func.lower(Task.title).like(s))

    query = query.order_by(Task.due_date.asc())
    tasks = query.all()

    return [format_task_response(t) for t in tasks]


@router.post("/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    current_user: Account = Depends(require_role([AccountRole.ADMIN, AccountRole.EMPLOYEE]))
):
    """
    Create a new task.
    Admin and Employee only. Clients are forbidden from creating internal tasks.
    """
    # 1. Resolve Client
    client_id = payload.client_account_id
    if not client_id and payload.client:
        client_obj = db.query(Client).filter(Client.business_name.ilike(f"%{payload.client}%")).first()
        if client_obj:
            client_id = client_obj.account_id

    if not client_id:
        # Default to first client if neither id nor matching name
        first_client = db.query(Client).first()
        if first_client:
            client_id = first_client.account_id
        else:
            raise HTTPException(status_code=400, detail="Valid client_account_id is required")

    client_record = db.query(Client).filter(Client.account_id == client_id).first()
    if not client_record:
        raise HTTPException(status_code=404, detail="Referenced client does not exist")

    # 2. Resolve Assignee
    emp_id = payload.assigned_employee_id
    if not emp_id and payload.assignee and payload.assignee != "Unassigned":
        emp_obj = db.query(Employee).filter(Employee.full_name.ilike(f"%{payload.assignee}%")).first()
        if emp_obj:
            emp_id = emp_obj.account_id

    if emp_id:
        emp_record = db.query(Employee).filter(Employee.account_id == emp_id).first()
        if not emp_record:
            raise HTTPException(status_code=404, detail="Referenced assigned employee does not exist")
        if emp_record.account and not emp_record.account.is_active:
            raise HTTPException(status_code=400, detail="Cannot assign task to an inactive employee")

    # 3. Resolve status / stage
    task_status = TaskStatus.TODO
    if payload.stage:
        try:
            task_status = TaskStatus(payload.stage)
        except ValueError:
            task_status = TaskStatus.TODO
    elif payload.status:
        task_status = payload.status

    # 4. Resolve priority
    task_priority = payload.priority or TaskPriority.MEDIUM

    # 5. Resolve due date
    due = payload.due_date
    if not due:
        due = date.today() + timedelta(days=5)

    # 6. Validate estimated hours
    est_hours = payload.estimated_hours if payload.estimated_hours is not None else Decimal("4.00")
    if est_hours < 0:
        raise HTTPException(status_code=400, detail="Estimated hours cannot be negative")

    task = Task(
        client_account_id=client_id,
        assigned_employee_id=emp_id,
        created_by_account_id=current_user.account_id,
        title=payload.title,
        description=payload.description,
        priority=task_priority,
        status=task_status,
        due_date=due,
        estimated_hours=est_hours,
        content_reference_url=payload.content_reference_url
    )
    db.add(task)
    db.flush()

    # Phase 6: Automated activity log and notification dispatch
    log_activity(
        db=db,
        actor=current_user,
        action="Task Created",
        target=task.title,
        subtext=f"Client: {client_record.business_name} • Priority: {task_priority.value}",
        action_type="primary",
        entity_type="Task",
        entity_id=task.task_id
    )

    if task.assigned_employee_id:
        create_notification(
            db=db,
            recipient_account_id=task.assigned_employee_id,
            event_type="TASK_ASSIGNED",
            title="Task Assigned",
            message=f"You have been assigned to task '{task.title}' for client {client_record.business_name}.",
            entity_type="Task",
            entity_id=task.task_id,
            sender_account_id=current_user.account_id
        )

    db.commit()
    db.refresh(task)

    # Re-query with eager loads for formatting
    task_reloaded = (
        db.query(Task)
        .options(
            joinedload(Task.client).joinedload(Client.social_accounts),
            joinedload(Task.assignee),
            joinedload(Task.creator).joinedload(Account.admin_profile),
            joinedload(Task.creator).joinedload(Account.employee_profile)
        )
        .filter(Task.task_id == task.task_id)
        .first()
    )

    return format_task_response(task_reloaded)


@router.get("/tasks/{task_id}", response_model=TaskResponse)
def get_task_by_id(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    Get a single task by ID with object-level authorization.
    """
    task = (
        db.query(Task)
        .options(
            joinedload(Task.client).joinedload(Client.social_accounts),
            joinedload(Task.assignee),
            joinedload(Task.creator).joinedload(Account.admin_profile),
            joinedload(Task.creator).joinedload(Account.employee_profile)
        )
        .filter(Task.task_id == task_id)
        .first()
    )

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if current_user.role == AccountRole.CLIENT and task.client_account_id != current_user.account_id:
        raise HTTPException(status_code=403, detail="Access denied: Cannot view another client's task")

    return format_task_response(task)


@router.patch("/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: Account = Depends(require_role([AccountRole.ADMIN, AccountRole.EMPLOYEE]))
):
    """
    Update permitted task fields.
    Clients have read-only access (403 Forbidden).
    """
    task = (
        db.query(Task)
        .options(
            joinedload(Task.client).joinedload(Client.social_accounts),
            joinedload(Task.assignee),
            joinedload(Task.creator).joinedload(Account.admin_profile),
            joinedload(Task.creator).joinedload(Account.employee_profile)
        )
        .filter(Task.task_id == task_id)
        .first()
    )

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if payload.title is not None:
        task.title = payload.title
    if payload.description is not None:
        task.description = payload.description
    if payload.priority is not None:
        task.priority = payload.priority

    # Support status or stage
    if payload.status is not None:
        task.status = payload.status
    elif payload.stage is not None:
        try:
            task.status = TaskStatus(payload.stage)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid task status stage: {payload.stage}")

    if payload.due_date is not None:
        task.due_date = payload.due_date
    if payload.estimated_hours is not None:
        if payload.estimated_hours < 0:
            raise HTTPException(status_code=400, detail="Estimated hours cannot be negative")
        task.estimated_hours = payload.estimated_hours

    previous_assignee = task.assigned_employee_id

    if payload.assigned_employee_id is not None:
        if payload.assigned_employee_id == 0:
            task.assigned_employee_id = None
        else:
            emp = db.query(Employee).filter(Employee.account_id == payload.assigned_employee_id).first()
            if not emp:
                raise HTTPException(status_code=404, detail="Assigned employee does not exist")
            task.assigned_employee_id = payload.assigned_employee_id

    if payload.content_reference_url is not None:
        task.content_reference_url = payload.content_reference_url

    # Phase 6: Automated activity log and notification dispatch
    log_activity(
        db=db,
        actor=current_user,
        action="Task Updated",
        target=task.title,
        subtext=f"Status: {task.status.value if hasattr(task.status, 'value') else task.status} • Due: {task.due_date}",
        action_type="primary",
        entity_type="Task",
        entity_id=task.task_id
    )

    if task.assigned_employee_id and task.assigned_employee_id != previous_assignee:
        create_notification(
            db=db,
            recipient_account_id=task.assigned_employee_id,
            event_type="TASK_ASSIGNED",
            title="Task Reassigned",
            message=f"Task '{task.title}' has been assigned to you.",
            entity_type="Task",
            entity_id=task.task_id,
            sender_account_id=current_user.account_id
        )

    db.commit()
    db.refresh(task)

    return format_task_response(task)


# --------------------------------------------------------------------------
# WORKLOAD AGGREGATION ENDPOINT
# --------------------------------------------------------------------------

@router.get("/workload", response_model=WorkloadSummaryResponse)
def get_workload_report(
    db: Session = Depends(get_db),
    current_user: Account = Depends(require_role([AccountRole.ADMIN, AccountRole.EMPLOYEE]))
):
    """
    Workload aggregation endpoint:
    - Calculates active task count, overdue tasks, due soon tasks, and total estimated hours.
    - Role restrictions: Admin & Employee only. Clients are forbidden (403).
    """
    today = date.today()
    due_soon_threshold = today + timedelta(days=3)

    # 1. Fetch all active employees
    employees = (
        db.query(Employee)
        .join(Account, Employee.account_id == Account.account_id)
        .options(joinedload(Employee.account))
        .filter(Account.is_active == True)
        .all()
    )

    # 2. Fetch all active tasks with assignments
    active_statuses = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW]
    active_tasks = (
        db.query(Task)
        .filter(Task.status.in_(active_statuses))
        .all()
    )

    # Group tasks by assigned employee
    tasks_by_emp = {}
    for t in active_tasks:
        if t.assigned_employee_id:
            tasks_by_emp.setdefault(t.assigned_employee_id, []).append(t)

    operatives = []
    total_active_hours = 0.0
    overallocated_operatives = 0

    for idx, emp in enumerate(employees):
        emp_tasks = tasks_by_emp.get(emp.account_id, [])
        allocated_hours = float(sum(t.estimated_hours for t in emp_tasks))
        total_active_hours += allocated_hours
        max_hrs = emp.max_weekly_hours or 40

        utilization = int(round((allocated_hours / max_hrs) * 100)) if max_hrs > 0 else 0
        if utilization > 100:
            status_tag = "Over"
            overallocated_operatives += 1
        elif utilization < 65:
            status_tag = "Avail"
        else:
            status_tag = "Opt"

        overdue_count = sum(1 for t in emp_tasks if t.due_date < today)
        due_soon_count = sum(1 for t in emp_tasks if today <= t.due_date <= due_soon_threshold)

        avatar = SAMPLE_AVATARS[idx % len(SAMPLE_AVATARS)]

        # Daily distribution simulation based on actual tasks
        daily_hours = round(allocated_hours / 5, 1)
        first_tag = emp_tasks[0].title if emp_tasks else "Internal Capacity Sprint"
        days_breakdown = {
            "mon": {"hours": daily_hours, "tag": first_tag[:28], "status": status_tag},
            "tue": {"hours": daily_hours, "tag": first_tag[:28], "status": status_tag},
            "wed": {"hours": daily_hours, "tag": first_tag[:28], "status": status_tag},
            "thu": {"hours": daily_hours, "tag": first_tag[:28], "status": status_tag},
            "fri": {"hours": round(allocated_hours - (daily_hours * 4), 1), "tag": first_tag[:28], "status": status_tag}
        }

        operatives.append(WorkloadEmployeeMetrics(
            id=f"W{emp.account_id}",
            employee_id=emp.account_id,
            name=emp.full_name,
            role=emp.job_title,
            avatar=avatar,
            allocatedHours=round(allocated_hours, 1),
            maxHours=max_hrs,
            utilization=utilization,
            status=status_tag,
            activeTasksCount=len(emp_tasks),
            overdueTasksCount=overdue_count,
            dueSoonTasksCount=due_soon_count,
            days=days_breakdown
        ))

    overall_util = int(round(sum(o.utilization for o in operatives) / len(operatives))) if operatives else 75

    return WorkloadSummaryResponse(
        overallUtilization=overall_util,
        overallocatedCount=overallocated_operatives,
        totalActiveTasks=len(active_tasks),
        totalAllocatedHours=round(total_active_hours, 1),
        operatives=operatives
    )
