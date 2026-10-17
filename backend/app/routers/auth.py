from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.account_schemas import ChangePasswordIn, CurrentUserOut
from app.database import get_db
from app.dependencies import get_current_user
from app.models import UserAccount
from app.roles import role_label
from app.schemas import TokenOut
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginPayload(BaseModel):
    email: str = Field(min_length=3, max_length=160)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        username = value.strip().lower()
        if not username:
            raise ValueError("Tên đăng nhập là bắt buộc")
        if " " in username:
            raise ValueError("Tên đăng nhập không được chứa khoảng trắng")
        if "@" not in username:
            username = f"{username}@hr.local"
        return username


@router.post("/login", response_model=TokenOut)
def login(payload: LoginPayload, db: Session = Depends(get_db)):
    user = db.scalar(select(UserAccount).where(UserAccount.email == payload.email))
    if not user or not user.is_active or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Tên đăng nhập hoặc mật khẩu không đúng")
    return TokenOut(access_token=create_access_token(user.email, user.role), role=user.role)


@router.get("/me", response_model=CurrentUserOut)
def me(user: UserAccount = Depends(get_current_user)):
    employee = user.employee
    department = employee.department if employee else None
    position = employee.position if employee else None
    return CurrentUserOut(
        id=user.id,
        email=user.email,
        role=user.role,
        role_label=role_label(user.role),
        is_active=user.is_active,
        employee_id=user.employee_id,
        employee_code=employee.employee_code if employee else None,
        full_name=employee.full_name if employee else None,
        gender=employee.gender if employee else None,
        department_id=employee.department_id if employee else None,
        department_name=department.name if department else None,
        position_name=position.name if position else None,
    )


@router.post("/change-password")
def change_password(
    payload: ChangePasswordIn,
    user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(400, "Mật khẩu hiện tại không đúng")
    if verify_password(payload.new_password, user.password_hash):
        raise HTTPException(400, "Mật khẩu mới phải khác mật khẩu hiện tại")
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"message": "Đổi mật khẩu thành công"}
