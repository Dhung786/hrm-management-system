from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

from app.config import settings
from app.database import Base, engine
from app.logging_config import configure_logging, request_logging_middleware
from app.routers import accounts, attendance, auth, dashboard, employees, leaves, payroll, talent

configure_logging()

app = FastAPI(title="HR Management API", version="1.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.middleware("http")(request_logging_middleware)

Base.metadata.create_all(bind=engine)

for router in [
    auth.router,
    accounts.router,
    dashboard.router,
    employees.router,
    attendance.router,
    leaves.router,
    payroll.router,
    talent.router,
]:
    app.include_router(router)

Instrumentator().instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)


@app.get("/api/health")
def health():
    return {"success": True, "message": "HR Management API is running"}
