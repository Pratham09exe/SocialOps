from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator
import re

def validate_safe_url(url: str) -> str:
    url_clean = url.strip()
    if not (url_clean.startswith("https://") or url_clean.startswith("http://")):
        raise ValueError("Storage URL must start with https:// or http://")
    if re.search(r"^(javascript|data|vbscript):", url_clean, re.IGNORECASE):
        raise ValueError("Unsafe URL scheme detected")
    return url_clean

class AttachmentCreate(BaseModel):
    client_account_id: Optional[int] = None
    feedback_id: Optional[int] = None
    expense_id: Optional[int] = None
    file_name: str = Field(..., min_length=1, max_length=255)
    storage_url: str = Field(..., max_length=500)
    mime_type: Optional[str] = Field("application/octet-stream", max_length=100)
    file_size_bytes: Optional[int] = Field(0, ge=0)

    @field_validator("storage_url")
    @classmethod
    def check_url(cls, v: str) -> str:
        return validate_safe_url(v)

class AttachmentResponse(BaseModel):
    attachment_id: int
    client_account_id: Optional[int]
    feedback_id: Optional[int]
    expense_id: Optional[int]
    uploaded_by_account_id: int
    file_name: str
    storage_url: str
    mime_type: str
    file_size_bytes: int
    created_at: datetime
    uploader_name: str

    model_config = ConfigDict(from_attributes=True)
