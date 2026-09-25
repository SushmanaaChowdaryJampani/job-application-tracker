from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

from database import SessionLocal
from models import JobApplication
from schemas import JobApplicationCreate

app = FastAPI()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "Job Application Tracker API is running"}


@app.post("/applications")
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
    )

    db.add(new_application)
    db.commit()
    db.refresh(new_application)

    return new_application

@app.get("/applications")
def get_applications(db: Session = Depends(get_db)):
    applications = db.query(JobApplication).all()

    return applications

@app.get("/applications/{application_id}")
def get_application(
    application_id: int,
    db: Session = Depends(get_db)
):
    application = (
        db.query(JobApplication)
        .filter(JobApplication.id == application_id)
        .first()
    )

    return application