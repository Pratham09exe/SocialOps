import enum
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, Numeric, ForeignKey, Enum, func
from sqlalchemy.orm import relationship
from app.db.session import Base

class TaskPriority(str, enum.Enum):
    LOW = "Low"
    NORMAL = "Normal"
    MEDIUM = "Medium"
    HIGH = "High"
    URGENT = "Urgent"

class TaskStatus(str, enum.Enum):
    TODO = "To Do"
    IN_PROGRESS = "In Progress"
    IN_REVIEW = "In Review"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"

class Task(Base):
    __tablename__ = "tasks"

    task_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    client_account_id = Column(Integer, ForeignKey("clients.account_id", ondelete="RESTRICT"), nullable=False, index=True)
    assigned_employee_id = Column(Integer, ForeignKey("employees.account_id", ondelete="SET NULL"), nullable=True, index=True)
    created_by_account_id = Column(Integer, ForeignKey("accounts.account_id", ondelete="RESTRICT"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(Enum(TaskPriority, values_callable=lambda x: [e.value for e in x]), nullable=False, default=TaskPriority.MEDIUM)
    status = Column(Enum(TaskStatus, values_callable=lambda x: [e.value for e in x]), nullable=False, default=TaskStatus.TODO, index=True)
    due_date = Column(Date, nullable=False, index=True)
    estimated_hours = Column(Numeric(5, 2), nullable=False, default=4.00)
    content_reference_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    client = relationship("Client", back_populates="tasks")
    assignee = relationship("Employee", foreign_keys=[assigned_employee_id], back_populates="assigned_tasks")
    creator = relationship("Account", foreign_keys=[created_by_account_id], back_populates="tasks_created")

    def __repr__(self):
        return f"<Task id={self.task_id} title={self.title} status={self.status} priority={self.priority}>"
