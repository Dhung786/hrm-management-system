from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models import Attendance, UserAccount
from app.schemas import AttendanceIn, AttendanceOut

router = APIRouter(prefix="/api/attendance", tags=["attendance"])


@router.get("", response_model=list[AttendanceOut])
def list_attendance(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return list(db.scalars(select(Attendance).order_by(Attendance.work_date.desc(), Attendance.id.desc())).all())


@router.post("", response_model=AttendanceOut)
def upsert_attendance(payload: AttendanceIn, db: Session = Depends(get_db), _=Depends(require_roles("ADMIN", "HR", "MANAGER"))):
    obj = db.scalar(select(Attendance).where(Attendance.employee_id == payload.employee_id, Attendance.work_date == payload.work_date))
    if obj:
        for k, v in payload.model_dump().items(): setattr(obj, k, v)
    else:
        obj = Attendance(**payload.model_dump()); db.add(obj)
    db.commit(); db.refresh(obj); return obj


@router.post("/check-in")
def check_in(user: UserAccount = Depends(get_current_user), db: Session = Depends(get_db)):
    if not user.employee_id: raise HTTPException(400, "Tài khoản chưa liên kết nhân viên")
    today = date.today()
    obj = db.scalar(select(Attendance).where(Attendance.employee_id == user.employee_id, Attendance.work_date == today))
    if not obj:
        obj = Attendance(employee_id=user.employee_id, work_date=today); db.add(obj)
    if obj.check_in: raise HTTPException(409, "Đã check-in hôm nay")
    obj.check_in = datetime.now(timezone.utc); db.commit(); return {"message": "Check-in thành công"}


@router.post("/check-out")
def check_out(user: UserAccount = Depends(get_current_user), db: Session = Depends(get_db)):
    if not user.employee_id: raise HTTPException(400, "Tài khoản chưa liên kết nhân viên")
    obj = db.scalar(select(Attendance).where(Attendance.employee_id == user.employee_id, Attendance.work_date == date.today()))
    if not obj or not obj.check_in: raise HTTPException(400, "Chưa check-in")
    if obj.check_out: raise HTTPException(409, "Đã check-out")
    obj.check_out = datetime.now(timezone.utc); db.commit(); return {"message": "Check-out thành công"}
