# Import all models here so that Alembic and SQLAlchemy have a single source of metadata
from app.db.session import Base  # noqa
from app.models.account import Account, Admin, Employee, Client, AccountRole  # noqa
from app.models.social import ClientSocialAccount, Package, ClientPackageAssignment, AssignmentStatus  # noqa
from app.models.task import Task, TaskPriority, TaskStatus  # noqa
from app.models.content import (  # noqa
    ContentPlan, ContentPlanTarget, ContentItem, Approval, ClientFeedback, Attachment,
    ContentStatus, PlanStatus, ApprovalStage, ApprovalDecision, FeedbackType, FeedbackStatus
)
from app.models.finance import (  # noqa
    Invoice, Payment, Expense, InvoiceStatus, PaymentStatus
)
from app.models.analytics import (  # noqa
    ActivityLog, Notification, ClientMonthlyMetric
)
