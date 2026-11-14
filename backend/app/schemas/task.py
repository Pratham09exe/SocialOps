from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field
from app.models.task import TaskPriority, TaskStatus

class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    status: TaskStatus = TaskStatus.TODO
    due_date: date
    estimated_hours: Decimal = Field(Decimal("4.00"), ge=0)
    content_reference_url: Optional[str] = Field(None, max_length=255)

class TaskCreate(BaseModel):
    client_account_id: Optional[int] = None
    client: Optional[str] = None  # UI convenience
    assigned_employee_id: Optional[int] = None
    assignee: Optional[str] = None  # UI convenience
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    priority: Optional[TaskPriority] = TaskPriority.MEDIUM
    status: Optional[TaskStatus] = TaskStatus.TODO
    stage: Optional[str] = None  # UI convenience mapping to status
    due_date: Optional[date] = None
    dueDate: Optional[str] = None  # UI convenience
    estimated_hours: Optional[Decimal] = Field(Decimal("4.00"), ge=0)
    content_reference_url: Optional[str] = None
    channel: Optional[str] = "Instagram"  # UI convenience

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    stage: Optional[str] = None
    due_date: Optional[date] = None
    estimated_hours: Optional[Decimal] = Field(None, ge=0)
    assigned_employee_id: Optional[int] = None
    content_reference_url: Optional[str] = None

class TaskResponse(BaseModel):
    task_id: int
    client_account_id: int
    assigned_employee_id: Optional[int]
    created_by_account_id: int
    title: str
    description: Optional[str]
    priority: str
    status: str
    due_date: date
    estimated_hours: Decimal
    content_reference_url: Optional[str]
    created_at: datetime
    updated_at: datetime

    # Enriched associations
    client_name: str
    assignee_name: Optional[str]
    creator_name: str

    # UI compatibility attributes
    id: str
    client: str
    channel: str
    stage: str
    assignee: str
    dueDate: str
    sla: str

    model_config = ConfigDict(from_attributes=True)


class WorkloadEmployeeMetrics(BaseModel):
    id: str
    employee_id: int
    name: str
    role: str
    avatar: str
    allocatedHours: float
    maxHours: int
    utilization: int
    status: str  # "Opt", "Over", "Avail"
    activeTasksCount: int
    overdueTasksCount: int
    dueSoonTasksCount: int
    days: Dict[str, Any]

class WorkloadSummaryResponse(BaseModel):
    overallUtilization: int
    overallocatedCount: int
    totalActiveTasks: int
    totalAllocatedHours: float
    operatives: List[WorkloadEmployeeMetrics]
