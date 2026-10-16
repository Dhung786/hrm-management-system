from datetime import date, datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import ensure_manager_employee_scope, get_current_user, manager_department_id, require_roles
from app.models import Attendance, Employee, UserAccount
from app.schemas import AttendanceIn, AttendanceOut

router = APIRouter(prefix="/api/attendance", tags=["attendance"])
LOCAL_TZ = ZoneInfo("Asia/Ho_Chi_Minh")


def _today_local() -> date:
    return datetime.now(LOCAL_TZ).date()


@router.get("", response_model=list[AttendanceOut])
def list_attendance(db: Session = Depends(get_db), user: UserAccount = Depends(get_current_user)):
    stmt = select(Attendance).order_by(Attendance.work_date.desc(), Attendance.id.desc())
    if user.role == "EMPLOYEE":
        if not user.employee_id:
            return []
        stmt = stmt.where(Attendance.employee_id == user.employee_id)
    elif user.role == "MANAGER":
        department_id = manager_department_id(user, db)
        if not department_id:
            return []
        stmt = stmt.where(
            Attendance.employee_id.in_(select(Employee.id).where(Employee.department_id == department_id))
        )
    elif user.role not in {"ADMIN", "HR", "PAYROLL"}:
        raise HTTPException(403, "Bạn không có quyền xem dữ liệu chấm công")
    return list(db.scalars(stmt).all())


@router.post("", response_model=AttendanceOut)
def upsert_attendance(
    payload: AttendanceIn,
    db: Session = Depends(get_db),
    user: UserAccount = Depends(require_roles("ADMIN", "HR", "MANAGER")),
):
    employee = db.get(Employee, payload.employee_id)
    if not employee:
        raise HTTPException(404, "Không tìm thấy nhân viên")
    ensure_manager_employee_scope(user, employee, db)
    if employee.status == "INACTIVE":
        raise HTTPException(400, "Không thể chấm công cho nhân viên đã nghỉ việc")
    if payload.work_date > _today_local():
        raise HTTPException(400, "Không thể chấm công cho ngày trong tương lai")
    obj = db.scalar(select(Attendance).where(Attendance.employee_id == payload.employee_id, Attendance.work_date == payload.work_date))
    if obj:
        for key, value in payload.model_dump().items():
            setattr(obj, key, value)
    else:
        obj = Attendance(**payload.model_dump())
        db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.post("/check-in")
def check_in(user: UserAccount = Depends(get_current_user), db: Session = Depends(get_db)):
    if not user.employee_id:
        raise HTTPException(400, "Tài khoản chưa liên kết nhân viên")
    employee = db.get(Employee, user.employee_id)
    if not employee or employee.status == "INACTIVE":
        raise HTTPException(400, "Nhân viên không còn hoạt động")
    today = _today_local()
    obj = db.scalar(select(Attendance).where(Attendance.employee_id == user.employee_id, Attendance.work_date == today))
    if not obj:
        obj = Attendance(employee_id=user.employee_id, work_date=today, status="PRESENT")
        db.add(obj)
    if obj.check_in:
        raise HTTPException(409, "Đã check-in hôm nay")
    obj.check_in = datetime.now(LOCAL_TZ)
    db.commit()
    return {"message": "Check-in thành công", "check_in": obj.check_in.isoformat()}


@router.post("/check-out")
def check_out(user: UserAccount = Depends(get_current_user), db: Session = Depends(get_db)):
    if not user.employee_id:
        raise HTTPException(400, "Tài khoản chưa liên kết nhân viên")
    today = _today_local()
    obj = db.scalar(select(Attendance).where(Attendance.employee_id == user.employee_id, Attendance.work_date == today))
    if not obj or not obj.check_in:
        raise HTTPException(400, "Chưa check-in hôm nay")
    if obj.check_out:
        raise HTTPException(409, "Đã check-out hôm nay")
    now = datetime.now(LOCAL_TZ)
    if obj.check_in.tzinfo is None:
        check_in = obj.check_in.replace(tzinfo=LOCAL_TZ)
    else:
        check_in = obj.check_in.astimezone(LOCAL_TZ)
    if now <= check_in:
        raise HTTPException(400, "Giờ check-out phải sau giờ check-in")
    obj.check_out = now
    db.commit()
    return {"message": "Check-out thành công", "check_out": obj.check_out.isoformat()}
