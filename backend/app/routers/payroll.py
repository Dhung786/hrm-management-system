from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models import Payroll
from app.schemas import PayrollIn, PayrollOut

router = APIRouter(prefix="/api/payroll", tags=["payroll"])


@router.get("", response_model=list[PayrollOut])
def list_payroll(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return list(db.scalars(select(Payroll).order_by(Payroll.year.desc(), Payroll.month.desc())).all())


@router.post("", response_model=PayrollOut)
def create_payroll(payload: PayrollIn, db: Session = Depends(get_db), _=Depends(require_roles("ADMIN", "HR"))):
    if db.scalar(select(Payroll).where(Payroll.employee_id == payload.employee_id, Payroll.month == payload.month, Payroll.year == payload.year)):
        raise HTTPException(409, "Bảng lương tháng này đã tồn tại")
    data = payload.model_dump(); data["net_salary"] = payload.base_salary + payload.allowance + payload.bonus - payload.deduction
    obj = Payroll(**data); db.add(obj); db.commit(); db.refresh(obj); return obj
