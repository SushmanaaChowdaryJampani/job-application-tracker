from database import engine, Base
import models

Base.metadata.create_all(bind=engine)

print("Database connection successful.")
print("Database tables created successfully.")