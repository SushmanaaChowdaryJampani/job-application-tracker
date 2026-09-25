from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, field_validator


JobStatus = Literal[
    "Applied",
    "Assessment",
    "Interview",
    "Offer",
    "Rejected"
]


class JobApplicationCreate(BaseModel):
    company: str
    job_title: str
    status: JobStatus = "Applied"
    application_date: date | None = None
    source: str | None = None
    job_url: str | None = None
    notes: str | None = None

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, value):
        if value is None:
            return value

        return value.strip().title()


class JobApplicationUpdate(BaseModel):
    company: str | None = None
    job_title: str | None = None
    status: JobStatus | None = None
    application_date: date | None = None
    source: str | None = None
    job_url: str | None = None
    notes: str | None = None

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, value):
        if value is None:
            return value

        return value.strip().title()


class JobApplicationResponse(BaseModel):
    id: int
    company: str
    job_title: str
    status: JobStatus
    application_date: date | None = None
    source: str | None = None
    job_url: str | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }