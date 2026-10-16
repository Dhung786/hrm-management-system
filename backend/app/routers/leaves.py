from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models import LeaveRequest, UserAccount
from app.schemas import LeaveDecision, LeaveIn, LeaveOut

router = APIRouter(prefix="/api/leaves", tags=["leaves"])


@router.get("", response_model=list[LeaveOut])
def list_leaves(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return list(db.scalars(select(LeaveRequest).order_by(LeaveRequest.id.desc())).all())


@router.post("", response_model=LeaveOut)
def create_leave(payload: LeaveIn, db: Session = Depends(get_db), user: UserAccount = Depends(get_current_user)):
    if user.role == "EMPLOYEE" and user.employee_id != payload.employee_id:
        raise HTTPException(403, "Chỉ được tạo đơn nghỉ cho chính mình")
    if payload.start_date > payload.end_date: raise HTTPException(400, "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc")
    obj = LeaveRequest(**payload.model_dump()); db.add(obj); db.commit(); db.refresh(obj); return obj


@router.patch("/{leave_id}/decision", response_model=LeaveOut)
def decide(leave_id: int, payload: LeaveDecision, db: Session = Depends(get_db), _=Depends(require_roles("ADMIN", "HR", "MANAGER"))):
    if payload.status not in {"APPROVED", "REJECTED"}: raise HTTPException(400, "Trạng thái không hợp lệ")
    obj = db.get(LeaveRequest, leave_id)
    if not obj: raise HTTPException(404, "Không tìm thấy đơn nghỉ")
    obj.status = payload.status; obj.approver_note = payload.approver_note
    db.commit(); db.refresh(obj); return obj
