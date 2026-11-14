from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, health, clients, employees, social, tasks,
    content, content_plans, approvals, feedback, attachments,
    invoices, payments, expenses, activity_logs, notifications, analytics
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(clients.router, prefix="/clients", tags=["Clients"])
api_router.include_router(employees.router, prefix="/employees", tags=["Employees"])
api_router.include_router(social.router, tags=["Social Accounts & Packages"])
api_router.include_router(tasks.router, tags=["Tasks & Workload"])
api_router.include_router(content.router, prefix="/content", tags=["Content Management"])
api_router.include_router(content_plans.router, prefix="/content-plans", tags=["Content Plans"])
api_router.include_router(approvals.router, prefix="/approvals", tags=["Approvals"])
api_router.include_router(feedback.router, prefix="/feedback", tags=["Client Feedback"])
api_router.include_router(attachments.router, prefix="/attachments", tags=["Attachments"])
api_router.include_router(invoices.router, prefix="/invoices", tags=["Invoices"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])
api_router.include_router(expenses.router, prefix="/expenses", tags=["Expenses"])
api_router.include_router(activity_logs.router, prefix="/activity-logs", tags=["Audit & Activity Logs"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics & Metrics"])
