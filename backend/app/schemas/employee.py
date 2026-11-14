from datetime import date
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

class EmployeeBase(BaseModel):
    full_name: str = Field(..., max_length=150)
    phone: Optional[str] = Field(None, max_length=30)
    joining_date: date
    department: str = Field(..., max_length=100)
    job_title: str = Field(..., max_length=100)
    access_level: str = Field("standard", max_length=50)
    billable_rate: float = Field(100.00, ge=0)
    max_weekly_hours: int = Field(40, ge=1)

class EmployeeCreate(EmployeeBase):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    password: Optional[str] = Field(None, min_length=6)

    @field_validator("email")
    @classmethod
    def validate_gmail(cls, v: str) -> str:
        if not v or not isinstance(v, str):
            raise ValueError("Email address is required.")
        cleaned = v.strip().lower()
        if not cleaned.endswith("@gmail.com"):
            raise ValueError("Only @gmail.com email addresses are permitted on SocialOps. Please enter a valid Gmail address.")
        return cleaned

class EmployeeUpdate(BaseModel):
    full_name: Optional[str] = Field(None, max_length=150)
    phone: Optional[str] = Field(None, max_length=30)
    department: Optional[str] = Field(None, max_length=100)
    job_title: Optional[str] = Field(None, max_length=100)
    access_level: Optional[str] = Field(None, max_length=50)
    billable_rate: Optional[float] = Field(None, ge=0)
    max_weekly_hours: Optional[int] = Field(None, ge=1)
    is_active: Optional[bool] = None

class EmployeeResponse(EmployeeBase):
    account_id: int
    email: str
    username: str
    is_active: bool

    # Frontend display helpers
    id: str
    name: str
    role: str
    avatar: Optional[str] = None
    workloadPercent: int = 50
    weeklyHours: int = 20
    maxHours: int = 40
    billableRate: float = 100.00
    status: str = "Active"
    assignedAccounts: List[str] = []

    model_config = ConfigDict(from_attributes=True)
