from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models import UserAccount
from app.security import ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> UserAccount:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise ValueError
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Token không hợp lệ")
    user = db.scalar(select(UserAccount).where(UserAccount.email == email, UserAccount.is_active.is_(True)))
    if not user:
        raise HTTPException(status_code=401, detail="Tài khoản không tồn tại hoặc đã bị khóa")
    return user


def require_roles(*roles: str):
    def dependency(user: UserAccount = Depends(get_current_user)) -> UserAccount:
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="Bạn không có quyền thực hiện chức năng này")
        return user
    return dependency
