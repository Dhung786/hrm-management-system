from datetime import date, datetime
import re
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


PHONE_RE = re.compile(r"^\d{9,10}$")
EMPLOYEE_STATUSES = {"ACTIVE", "INACTIVE", "ON_LEAVE"}
ATTENDANCE_STATUSES = {"PRESENT", "LATE", "ABSENT", "REMOTE", "LEAVE"}
LEAVE_TYPES = {"ANNUAL", "SICK", "UNPAID", "MATERNITY", "OTHER"}
PAYROLL_STATUSES = {"DRAFT", "APPROVED", "PAID"}
CONTRACT_STATUSES = {"ACTIVE", "EXPIRED", "TERMINATED"}
JOB_STATUSES = {"OPEN", "PAUSED", "CLOSED"}
CANDIDATE_STAGES = {"APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED"}


def _clean_text(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.strip()
    return value or None


def _validate_phone(value: str | None) -> str | None:
    value = _clean_text(value)
    if value is None:
        return None
    if not PHONE_RE.fullmatch(value):
        raise ValueError("Số điện thoại chỉ được gồm 9-10 chữ số và không được quá 10 số")
    return value


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class LoginIn(BaseModel):
    # Dùng str để tài khoản nội bộ admin@hr.local vẫn đăng nhập được.
    email: str = Field(min_length=3, max_length=160)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        value = value.strip().lower()
        if "@" not in value or value.startswith("@") or value.endswith("@"):
            raise ValueError("Email không hợp lệ")
        return value


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str


class DepartmentIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=1000)

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        return value.strip()


class DepartmentOut(DepartmentIn, ORMModel):
    id: int


class PositionIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    level: str | None = Field(default=None, max_length=50)

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        return value.strip()


class PositionOut(PositionIn, ORMModel):
    id: int


class EmployeeIn(BaseModel):
    employee_code: str = Field(min_length=2, max_length=30)
    full_name: str = Field(min_length=2, max_length=160)
    email: EmailStr
    phone: str | None = None
    date_of_birth: date | None = None
    gender: Literal["MALE", "FEMALE", "OTHER"] | None = None
    address: str | None = Field(default=None, max_length=1000)
    hire_date: date = Field(default_factory=date.today)
    status: str = "ACTIVE"
    base_salary: float = Field(default=0, ge=0, le=1_000_000_000_000)
    department_id: int | None = Field(default=None, gt=0)
    position_id: int | None = Field(default=None, gt=0)

    @field_validator("employee_code")
    @classmethod
    def normalize_code(cls, value: str) -> str:
        value = value.strip().upper()
        if not re.fullmatch(r"[A-Z0-9_-]+", value):
            raise ValueError("Mã nhân viên chỉ được chứa chữ, số, dấu _ hoặc -")
        return value

    @field_validator("full_name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        value = " ".join(value.split())
        if any(char.isdigit() for char in value):
            raise ValueError("Họ tên không được chứa chữ số")
        return value

    @field_validator("phone")
    @classmethod
    def phone_rules(cls, value: str | None) -> str | None:
        return _validate_phone(value)

    @field_validator("date_of_birth")
    @classmethod
    def birth_date_rules(cls, value: date | None) -> date | None:
        if value is None:
            return None
        if value > date.today():
            raise ValueError("Ngày sinh không được ở tương lai")
        if value.year < 1900:
            raise ValueError("Ngày sinh không hợp lệ")
        return value

    @field_validator("status")
    @classmethod
    def employee_status_rules(cls, value: str) -> str:
        value = value.strip().upper()
        if value not in EMPLOYEE_STATUSES:
            raise ValueError("Trạng thái nhân viên không hợp lệ")
        return value

    @model_validator(mode="after")
    def employee_dates(self):
        if self.date_of_birth and self.hire_date <= self.date_of_birth:
            raise ValueError("Ngày vào làm phải sau ngày sinh")
        return self


class EmployeeOut(EmployeeIn, ORMModel):
    id: int


class AttendanceIn(BaseModel):
    employee_id: int = Field(gt=0)
    work_date: date
    check_in: datetime | None = None
    check_out: datetime | None = None
    status: str = "PRESENT"
    note: str | None = Field(default=None, max_length=500)

    @field_validator("work_date")
    @classmethod
    def attendance_date_rules(cls, value: date) -> date:
        if value > date.today():
            raise ValueError("Không thể chấm công cho ngày trong tương lai")
        return value

    @field_validator("status")
    @classmethod
    def attendance_status_rules(cls, value: str) -> str:
        value = value.strip().upper()
        if value not in ATTENDANCE_STATUSES:
            raise ValueError("Trạng thái chấm công không hợp lệ")
        return value

    @model_validator(mode="after")
    def check_time_order(self):
        if self.check_in and self.check_out and self.check_out < self.check_in:
            raise ValueError("Giờ check-out phải sau giờ check-in")
        return self


class AttendanceOut(AttendanceIn, ORMModel):
    id: int


class LeaveIn(BaseModel):
    employee_id: int = Field(gt=0)
    leave_type: str = "ANNUAL"
    start_date: date
    end_date: date
    reason: str | None = Field(default=None, max_length=1000)

    @field_validator("leave_type")
    @classmethod
    def leave_type_rules(cls, value: str) -> str:
        value = value.strip().upper()
        if value not in LEAVE_TYPES:
            raise ValueError("Loại nghỉ phép không hợp lệ")
        return value

    @model_validator(mode="after")
    def leave_date_rules(self):
        if self.start_date > self.end_date:
            raise ValueError("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc")
        if (self.end_date - self.start_date).days > 365:
            raise ValueError("Một đơn nghỉ không được dài quá 365 ngày")
        return self


class LeaveOut(LeaveIn, ORMModel):
    id: int
    status: str
    approver_note: str | None = None
    created_at: datetime


class LeaveDecision(BaseModel):
    status: Literal["APPROVED", "REJECTED"]
    approver_note: str | None = Field(default=None, max_length=1000)


class PayrollIn(BaseModel):
    employee_id: int = Field(gt=0)
    month: int = Field(ge=1, le=12)
    year: int = Field(ge=2000, le=2100)
    base_salary: float = Field(ge=0, le=1_000_000_000_000)
    allowance: float = Field(default=0, ge=0, le=1_000_000_000_000)
    bonus: float = Field(default=0, ge=0, le=1_000_000_000_000)
    deduction: float = Field(default=0, ge=0, le=1_000_000_000_000)
    status: str = "DRAFT"

    @field_validator("status")
    @classmethod
    def payroll_status_rules(cls, value: str) -> str:
        value = value.strip().upper()
        if value not in PAYROLL_STATUSES:
            raise ValueError("Trạng thái bảng lương không hợp lệ")
        return value

    @model_validator(mode="after")
    def payroll_amount_rules(self):
        if self.deduction > self.base_salary + self.allowance + self.bonus:
            raise ValueError("Khấu trừ không được lớn hơn tổng thu nhập")
        return self


class PayrollOut(PayrollIn, ORMModel):
    id: int
    net_salary: float


class ContractIn(BaseModel):
    employee_id: int = Field(gt=0)
    contract_no: str = Field(min_length=2, max_length=60)
    contract_type: str = Field(default="FIXED_TERM", max_length=50)
    start_date: date
    end_date: date | None = None
    salary: float = Field(default=0, ge=0, le=1_000_000_000_000)
    status: str = "ACTIVE"

    @field_validator("contract_no")
    @classmethod
    def contract_no_rules(cls, value: str) -> str:
        return value.strip().upper()

    @field_validator("status")
    @classmethod
    def contract_status_rules(cls, value: str) -> str:
        value = value.strip().upper()
        if value not in CONTRACT_STATUSES:
            raise ValueError("Trạng thái hợp đồng không hợp lệ")
        return value

    @model_validator(mode="after")
    def contract_date_rules(self):
        if self.end_date and self.end_date < self.start_date:
            raise ValueError("Ngày kết thúc hợp đồng phải sau hoặc bằng ngày bắt đầu")
        return self


class ContractOut(ContractIn, ORMModel):
    id: int


class ReviewIn(BaseModel):
    employee_id: int = Field(gt=0)
    period: str = Field(min_length=2, max_length=50)
    score: float = Field(ge=0, le=10)
    strengths: str | None = Field(default=None, max_length=2000)
    improvements: str | None = Field(default=None, max_length=2000)
    reviewer: str | None = Field(default=None, max_length=160)


class ReviewOut(ReviewIn, ORMModel):
    id: int


class JobIn(BaseModel):
    title: str = Field(min_length=2, max_length=160)
    department: str | None = Field(default=None, max_length=120)
    description: str | None = Field(default=None, max_length=3000)
    openings: int = Field(default=1, ge=1, le=100)
    status: str = "OPEN"

    @field_validator("title")
    @classmethod
    def title_rules(cls, value: str) -> str:
        return value.strip()

    @field_validator("status")
    @classmethod
    def job_status_rules(cls, value: str) -> str:
        value = value.strip().upper()
        if value not in JOB_STATUSES:
            raise ValueError("Trạng thái tin tuyển dụng không hợp lệ")
        return value


class JobOut(JobIn, ORMModel):
    id: int


class CandidateIn(BaseModel):
    full_name: str = Field(min_length=2, max_length=160)
    email: EmailStr
    phone: str | None = None
    job_posting_id: int | None = Field(default=None, gt=0)
    stage: str = "APPLIED"
    note: str | None = Field(default=None, max_length=2000)

    @field_validator("full_name")
    @classmethod
    def candidate_name_rules(cls, value: str) -> str:
        value = " ".join(value.split())
        if any(char.isdigit() for char in value):
            raise ValueError("Họ tên ứng viên không được chứa chữ số")
        return value

    @field_validator("phone")
    @classmethod
    def candidate_phone_rules(cls, value: str | None) -> str | None:
        return _validate_phone(value)

    @field_validator("stage")
    @classmethod
    def candidate_stage_rules(cls, value: str) -> str:
        value = value.strip().upper()
        if value not in CANDIDATE_STAGES:
            raise ValueError("Giai đoạn ứng viên không hợp lệ")
        return value


class CandidateOut(CandidateIn, ORMModel):
    id: int
