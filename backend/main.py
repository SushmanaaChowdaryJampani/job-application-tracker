from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import SessionLocal
from models import JobApplication
from schemas import (
    JobApplicationCreate,
    JobApplicationUpdate,
    JobApplicationResponse
)

app = FastAPI()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()

# Root endpoint
@app.get("/")
def root():
    return {"message": "Job Application Tracker API is running"}

# Create a new job application
@app.post("/applications", response_model=JobApplicationResponse)
def create_application(
    application: JobApplicationCreate,
    db: Session = Depends(get_db)
):
    new_application = JobApplication(
        company=application.company,
        job_title=application.job_title,
        status=application.status,
        application_date=application.application_date,
        source=application.source
        job_url=application.job_url,
        notes=application.notes
    )

    db.add(new_application)
    db.commit()
    db.refresh(new_application)

    return new_application

# Get all job applications
@app.get("/applications", response_model=list[JobApplicationResponse])
def get_applications(
    status: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(JobApplication)

    if status:
        query = query.filter(
            func.lower(JobApplication.status) == status.lower()
        )

    if search:
        query = query.filter(
            (JobApplication.company.ilike(f"%{search}%")) |
            (JobApplication.job_title.ilike(f"%{search}%"))
        )

    return query.all()

# Get a specific job application
@app.get(
    "/applications/{application_id}",
    response_model=JobApplicationResponse
)
def get_application(
    application_id: int,
    db: Session = Depends(get_db)
):
    application = (
        db.query(JobApplication)
        .filter(JobApplication.id == application_id)
        .first()
    )

    if application is None:
            raise HTTPException(status_code=404, detail="Job Application not found")

    return application

# Update a specific job application
@app.put(
    "/applications/{application_id}",
    response_model=JobApplicationResponse
)
def update_application(
    application_id: int,
    application_data: JobApplicationUpdate,
    db: Session = Depends(get_db)
):
    application = (
        db.query(JobApplication)
        .filter(JobApplication.id == application_id)
        .first()
    )

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Job application not found"
        )

    update_data = application_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(application, field, value)

    db.commit()
    db.refresh(application)

    return application

# Delete a specific job application
@app.delete("/applications/{application_id}")
def delete_application(
    application_id: int,
    db: Session = Depends(get_db)
):
    application = (
        db.query(JobApplication)
        .filter(JobApplication.id == application_id)
        .first()
    )

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Job application not found"
        )

    db.delete(application)
    db.commit()

    return {"message": "Job application deleted successfully"}

@app.get("/dashboard/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    total = db.query(JobApplication).count()

    applied = (
        db.query(JobApplication)
        .filter(JobApplication.status == "Applied")
        .count()
    )

    assessment = (
        db.query(JobApplication)
        .filter(JobApplication.status == "Assessment")
        .count()
    )

    interview = (
        db.query(JobApplication)
        .filter(JobApplication.status == "Interview")
        .count()
    )

    offer = (
        db.query(JobApplication)
        .filter(JobApplication.status == "Offer")
        .count()
    )

    rejected = (
        db.query(JobApplication)
        .filter(JobApplication.status == "Rejected")
        .count()
    )

    return {
        "total": total,
        "applied": applied,
        "assessment": assessment,
        "interview": interview,
        "offer": offer,
        "rejected": rejected
    }