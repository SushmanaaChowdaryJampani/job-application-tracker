from datetime import date
from pydantic import BaseModel


class JobApplicationCreate(BaseModel):
    company: str
    job_title: str
    status: str = "Applied"
    application_date: date | None = None
    source: str | None = None