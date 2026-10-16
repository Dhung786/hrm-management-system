from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models import Attendance, Department, Employee, LeaveRequest

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("")
def dashboard(db: Session = Depends(get_db), _=Depends(get_current_user)):
    total = db.scalar(select(func.count(Employee.id)).where(Employee.status == "ACTIVE")) or 0
    departments = db.scalar(select(func.count(Department.id))) or 0
    present = db.scalar(select(func.count(Attendance.id)).where(Attendance.work_date == date.today(), Attendance.check_in.is_not(None))) or 0
    pending_leave = db.scalar(select(func.count(LeaveRequest.id)).where(LeaveRequest.status == "PENDING")) or 0
    return {"active_employees": total, "departments": departments, "present_today": present, "pending_leave": pending_leave}
