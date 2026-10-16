from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, manager_department_id
from app.models import Attendance, Department, Employee, LeaveRequest, UserAccount
from app.roles import role_label

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("")
def dashboard(db: Session = Depends(get_db), user: UserAccount = Depends(get_current_user)):
    employee_filter = None
    if user.role == "EMPLOYEE":
        employee_filter = [user.employee_id] if user.employee_id else []
    elif user.role == "MANAGER":
        department_id = manager_department_id(user, db)
        employee_filter = list(db.scalars(select(Employee.id).where(Employee.department_id == department_id)).all()) if department_id else []

    if employee_filter is None:
        total = db.scalar(select(func.count(Employee.id)).where(Employee.status == "ACTIVE")) or 0
        departments = db.scalar(select(func.count(Department.id))) or 0
        present_stmt = select(func.count(Attendance.id)).where(Attendance.work_date == date.today(), Attendance.check_in.is_not(None))
        leave_stmt = select(func.count(LeaveRequest.id)).where(LeaveRequest.status == "PENDING")
    else:
        total = db.scalar(select(func.count(Employee.id)).where(Employee.status == "ACTIVE", Employee.id.in_(employee_filter))) or 0
        departments = 1 if employee_filter else 0
        present_stmt = select(func.count(Attendance.id)).where(
            Attendance.work_date == date.today(),
            Attendance.check_in.is_not(None),
            Attendance.employee_id.in_(employee_filter),
        )
        leave_stmt = select(func.count(LeaveRequest.id)).where(
            LeaveRequest.status == "PENDING",
            LeaveRequest.employee_id.in_(employee_filter),
        )

    present = db.scalar(present_stmt) or 0
    pending_leave = db.scalar(leave_stmt) or 0
    return {
        "active_employees": total,
        "departments": departments,
        "present_today": present,
        "pending_leave": pending_leave,
        "role": user.role,
        "role_label": role_label(user.role),
    }
