from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import ensure_manager_employee_scope, get_current_user, manager_department_id, require_roles
from app.models import Employee, LeaveRequest, UserAccount
from app.schemas import LeaveDecision, LeaveIn, LeaveOut

router = APIRouter(prefix="/api/leaves", tags=["leaves"])


@router.get("", response_model=list[LeaveOut])
def list_leaves(db: Session = Depends(get_db), user: UserAccount = Depends(get_current_user)):
    stmt = select(LeaveRequest).order_by(LeaveRequest.id.desc())
    if user.role == "EMPLOYEE":
        if not user.employee_id:
            return []
        stmt = stmt.where(LeaveRequest.employee_id == user.employee_id)
    elif user.role == "MANAGER":
        department_id = manager_department_id(user, db)
        if not department_id:
            return []
        stmt = stmt.where(
            LeaveRequest.employee_id.in_(select(Employee.id).where(Employee.department_id == department_id))
        )
    elif user.role not in {"ADMIN", "HR"}:
        raise HTTPException(403, "Bạn không có quyền xem đơn nghỉ phép")
    return list(db.scalars(stmt).all())


@router.post("", response_model=LeaveOut)
def create_leave(payload: LeaveIn, db: Session = Depends(get_db), user: UserAccount = Depends(get_current_user)):
    employee = db.get(Employee, payload.employee_id)
    if not employee:
        raise HTTPException(404, "Không tìm thấy nhân viên")
    if employee.status == "INACTIVE":
        raise HTTPException(400, "Không thể tạo đơn nghỉ cho nhân viên đã nghỉ việc")
    if user.role not in {"ADMIN", "HR"} and user.employee_id != payload.employee_id:
        raise HTTPException(403, "Bạn chỉ được tạo đơn nghỉ cho chính mình")

    overlap = db.scalar(
        select(LeaveRequest).where(
            LeaveRequest.employee_id == payload.employee_id,
            LeaveRequest.status.in_(["PENDING", "APPROVED"]),
            and_(LeaveRequest.start_date <= payload.end_date, LeaveRequest.end_date >= payload.start_date),
        )
    )
    if overlap:
        raise HTTPException(409, "Khoảng nghỉ bị trùng với một đơn đang chờ hoặc đã được duyệt")

    obj = LeaveRequest(**payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.patch("/{leave_id}/decision", response_model=LeaveOut)
def decide(
    leave_id: int,
    payload: LeaveDecision,
    db: Session = Depends(get_db),
    user: UserAccount = Depends(require_roles("ADMIN", "HR", "MANAGER")),
):
    obj = db.get(LeaveRequest, leave_id)
    if not obj:
        raise HTTPException(404, "Không tìm thấy đơn nghỉ")
    employee = db.get(Employee, obj.employee_id)
    if not employee:
        raise HTTPException(404, "Không tìm thấy nhân viên của đơn nghỉ")
    ensure_manager_employee_scope(user, employee, db)
    if obj.status != "PENDING":
        raise HTTPException(409, "Đơn nghỉ này đã được xử lý")
    obj.status = payload.status
    obj.approver_note = payload.approver_note
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{leave_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_leave(
    leave_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_roles("ADMIN")),
):
    obj = db.get(LeaveRequest, leave_id)
    if not obj:
        raise HTTPException(404, "Không tìm thấy đơn nghỉ")
    db.delete(obj)
    db.commit()
    return None
