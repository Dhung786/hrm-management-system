from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.roles import ALL_ROLES


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class CurrentUserOut(BaseModel):
    id: int
    email: str
    role: str
    role_label: str
    is_active: bool
    employee_id: int | None = None
    employee_code: str | None = None
    full_name: str | None = None
    department_id: int | None = None
    department_name: str | None = None
    position_name: str | None = None


class ChangePasswordIn(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def password_rules(cls, value: str) -> str:
        if not any(c.isalpha() for c in value) or not any(c.isdigit() for c in value):
            raise ValueError("Mật khẩu mới phải có ít nhất 8 ký tự, gồm chữ và số")
        return value


class AccountCreate(BaseModel):
    employee_id: int | None = Field(default=None, gt=0)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: str = "EMPLOYEE"
    is_active: bool = True

    @field_validator("password")
    @classmethod
    def password_rules(cls, value: str) -> str:
        if not any(c.isalpha() for c in value) or not any(c.isdigit() for c in value):
            raise ValueError("Mật khẩu phải có ít nhất 8 ký tự, gồm chữ và số")
        return value

    @field_validator("role")
    @classmethod
    def role_rules(cls, value: str) -> str:
        value = value.strip().upper()
        if value not in ALL_ROLES:
            raise ValueError("Vai trò không hợp lệ")
        return value


class AccountUpdate(BaseModel):
    role: str
    is_active: bool = True
    password: str | None = Field(default=None, min_length=8, max_length=128)

    @field_validator("role")
    @classmethod
    def role_rules(cls, value: str) -> str:
        value = value.strip().upper()
        if value not in ALL_ROLES:
            raise ValueError("Vai trò không hợp lệ")
        return value

    @field_validator("password")
    @classmethod
    def password_rules(cls, value: str | None) -> str | None:
        if value is not None and (not any(c.isalpha() for c in value) or not any(c.isdigit() for c in value)):
            raise ValueError("Mật khẩu phải có ít nhất 8 ký tự, gồm chữ và số")
        return value


class AccountOut(ORMModel):
    id: int
    employee_id: int | None = None
    email: str
    role: str
    role_label: str
    is_active: bool
    employee_code: str | None = None
    employee_name: str | None = None
