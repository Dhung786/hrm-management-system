from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import UserAccount
from app.schemas import LoginIn, TokenOut
from app.security import create_access_token, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(UserAccount).where(UserAccount.email == payload.email))
    if not user or not user.is_active or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không đúng")
    return TokenOut(access_token=create_access_token(user.email, user.role), role=user.role)
