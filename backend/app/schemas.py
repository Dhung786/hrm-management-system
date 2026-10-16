from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str


class DepartmentIn(BaseModel):
    name: str
    description: str | None = None


class DepartmentOut(DepartmentIn, ORMModel):
    id: int


class PositionIn(BaseModel):
    name: str
    level: str | None = None


class PositionOut(PositionIn, ORMModel):
    id: int


class EmployeeIn(BaseModel):
    employee_code: str
    full_name: str
    email: EmailStr
    phone: str | None = None
    date_of_birth: date | None = None
    gender: str | None = None
    address: str | None = None
    hire_date: date = Field(default_factory=date.today)
    status: str = "ACTIVE"
    base_salary: float = 0
    department_id: int | None = None
    position_id: int | None = None


class EmployeeOut(EmployeeIn, ORMModel):
    id: int


class AttendanceIn(BaseModel):
    employee_id: int
    work_date: date
    check_in: datetime | None = None
    check_out: datetime | None = None
    status: str = "PRESENT"
    note: str | None = None


class AttendanceOut(AttendanceIn, ORMModel):
    id: int


class LeaveIn(BaseModel):
    employee_id: int
    leave_type: str = "ANNUAL"
    start_date: date
    end_date: date
    reason: str | None = None


class LeaveOut(LeaveIn, ORMModel):
    id: int
    status: str
    approver_note: str | None = None
    created_at: datetime


class LeaveDecision(BaseModel):
    status: str
    approver_note: str | None = None


class PayrollIn(BaseModel):
    employee_id: int
    month: int
    year: int
    base_salary: float
    allowance: float = 0
    bonus: float = 0
    deduction: float = 0
    status: str = "DRAFT"


class PayrollOut(PayrollIn, ORMModel):
    id: int
    net_salary: float


class ContractIn(BaseModel):
    employee_id: int
    contract_no: str
    contract_type: str = "FIXED_TERM"
    start_date: date
    end_date: date | None = None
    salary: float = 0
    status: str = "ACTIVE"


class ContractOut(ContractIn, ORMModel):
    id: int


class ReviewIn(BaseModel):
    employee_id: int
    period: str
    score: float
    strengths: str | None = None
    improvements: str | None = None
    reviewer: str | None = None


class ReviewOut(ReviewIn, ORMModel):
    id: int


class JobIn(BaseModel):
    title: str
    department: str | None = None
    description: str | None = None
    openings: int = 1
    status: str = "OPEN"


class JobOut(JobIn, ORMModel):
    id: int


class CandidateIn(BaseModel):
    full_name: str
    email: EmailStr
    phone: str | None = None
    job_posting_id: int | None = None
    stage: str = "APPLIED"
    note: str | None = None


class CandidateOut(CandidateIn, ORMModel):
    id: int
