from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.account_schemas import AccountCreate, AccountOut, AccountUpdate
from app.database import get_db
from app.dependencies import require_roles
from app.models import Employee, UserAccount
from app.roles import role_label
from app.security import hash_password

router = APIRouter(prefix="/api/accounts", tags=["accounts"])


def _to_out(user: UserAccount) -> AccountOut:
    employee = user.employee
    return AccountOut(
        id=user.id,
        employee_id=user.employee_id,
        email=user.email,
        role=user.role,
        role_label=role_label(user.role),
        is_active=user.is_active,
        employee_code=employee.employee_code if employee else None,
        employee_name=employee.full_name if employee else None,
    )


@router.get("", response_model=list[AccountOut])
def list_accounts(
    db: Session = Depends(get_db),
    _=Depends(require_roles("ADMIN")),
):
    users = db.scalars(select(UserAccount).order_by(UserAccount.id)).all()
    return [_to_out(user) for user in users]


@router.post("", response_model=AccountOut, status_code=status.HTTP_201_CREATED)
def create_account(
    payload: AccountCreate,
    db: Session = Depends(get_db),
    _=Depends(require_roles("ADMIN")),
):
    email = str(payload.email).strip().lower()
    if db.scalar(select(UserAccount).where(UserAccount.email == email)):
        raise HTTPException(409, "Tên đăng nhập đã tồn tại")

    employee = None
    if payload.employee_id:
        employee = db.get(Employee, payload.employee_id)
        if not employee:
            raise HTTPException(404, "Không tìm thấy nhân viên")
        if db.scalar(select(UserAccount).where(UserAccount.employee_id == payload.employee_id)):
            raise HTTPException(409, "Nhân viên này đã có tài khoản")

    user = UserAccount(
        employee_id=payload.employee_id,
        email=email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        is_active=payload.is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _to_out(user)


@router.put("/{account_id}", response_model=AccountOut)
def update_account(
    account_id: int,
    payload: AccountUpdate,
    db: Session = Depends(get_db),
    current: UserAccount = Depends(require_roles("ADMIN")),
):
    user = db.get(UserAccount, account_id)
    if not user:
        raise HTTPException(404, "Không tìm thấy tài khoản")

    if user.id == current.id and (payload.role != "ADMIN" or not payload.is_active):
        raise HTTPException(400, "Không thể tự bỏ quyền quản trị hoặc tự khóa tài khoản đang đăng nhập")

    if user.role == "ADMIN" and (payload.role != "ADMIN" or not payload.is_active):
        active_admins = db.scalar(
            select(func.count(UserAccount.id)).where(
                UserAccount.role == "ADMIN",
                UserAccount.is_active.is_(True),
            )
        ) or 0
        if active_admins <= 1:
            raise HTTPException(400, "Hệ thống phải còn ít nhất một tài khoản Quản trị hệ thống hoạt động")

    user.role = payload.role
    user.is_active = payload.is_active
    if payload.password:
        user.password_hash = hash_password(payload.password)
    db.commit()
    db.refresh(user)
    return _to_out(user)
