from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models import Employee, Payroll, UserAccount
from app.schemas import PayrollIn, PayrollOut

router = APIRouter(prefix="/api/payroll", tags=["payroll"])


@router.get("", response_model=list[PayrollOut])
def list_payroll(db: Session = Depends(get_db), user: UserAccount = Depends(get_current_user)):
    stmt = select(Payroll).order_by(Payroll.year.desc(), Payroll.month.desc(), Payroll.id.desc())
    if user.role == "EMPLOYEE":
        if not user.employee_id:
            return []
        stmt = stmt.where(Payroll.employee_id == user.employee_id)
    elif user.role not in {"ADMIN", "PAYROLL"}:
        raise HTTPException(403, "Bạn không có quyền xem dữ liệu tiền lương")
    return list(db.scalars(stmt).all())


@router.post("", response_model=PayrollOut)
def create_payroll(payload: PayrollIn, db: Session = Depends(get_db), _=Depends(require_roles("ADMIN", "PAYROLL"))):
    employee = db.get(Employee, payload.employee_id)
    if not employee:
        raise HTTPException(404, "Không tìm thấy nhân viên")
    if employee.status == "INACTIVE":
        raise HTTPException(400, "Không thể tạo bảng lương cho nhân viên đã nghỉ việc")
    if db.scalar(select(Payroll).where(Payroll.employee_id == payload.employee_id, Payroll.month == payload.month, Payroll.year == payload.year)):
        raise HTTPException(409, "Bảng lương tháng này đã tồn tại")
    data = payload.model_dump()
    data["net_salary"] = payload.base_salary + payload.allowance + payload.bonus - payload.deduction
    obj = Payroll(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{payroll_id}", response_model=PayrollOut)
def update_payroll(payroll_id: int, payload: PayrollIn, db: Session = Depends(get_db), _=Depends(require_roles("ADMIN", "PAYROLL"))):
    obj = db.get(Payroll, payroll_id)
    if not obj:
        raise HTTPException(404, "Không tìm thấy bảng lương")
    employee = db.get(Employee, payload.employee_id)
    if not employee:
        raise HTTPException(404, "Không tìm thấy nhân viên")
    if employee.status == "INACTIVE":
        raise HTTPException(400, "Không thể cập nhật bảng lương cho nhân viên đã nghỉ việc")
    duplicate = db.scalar(
        select(Payroll).where(
            Payroll.id != payroll_id,
            Payroll.employee_id == payload.employee_id,
            Payroll.month == payload.month,
            Payroll.year == payload.year,
        )
    )
    if duplicate:
        raise HTTPException(409, "Bảng lương tháng này đã tồn tại")
    for key, value in payload.model_dump().items():
        setattr(obj, key, value)
    obj.net_salary = payload.base_salary + payload.allowance + payload.bonus - payload.deduction
    db.commit()
    db.refresh(obj)
    return obj
