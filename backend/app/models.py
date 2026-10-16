from datetime import date, datetime
from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Department(Base):
    __tablename__ = "departments"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    employees: Mapped[list["Employee"]] = relationship(back_populates="department")


class Position(Base):
    __tablename__ = "positions"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    level: Mapped[str | None] = mapped_column(String(50), nullable=True)
    employees: Mapped[list["Employee"]] = relationship(back_populates="position")


class Employee(Base):
    __tablename__ = "employees"
    id: Mapped[int] = mapped_column(primary_key=True)
    employee_code: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(160), index=True)
    email: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    hire_date: Mapped[date] = mapped_column(Date, default=date.today)
    status: Mapped[str] = mapped_column(String(30), default="ACTIVE")
    base_salary: Mapped[float] = mapped_column(Float, default=0)
    department_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id"), nullable=True)
    position_id: Mapped[int | None] = mapped_column(ForeignKey("positions.id"), nullable=True)
    department: Mapped[Department | None] = relationship(back_populates="employees")
    position: Mapped[Position | None] = relationship(back_populates="employees")
    account: Mapped["UserAccount | None"] = relationship(back_populates="employee", uselist=False)


class UserAccount(Base):
    __tablename__ = "user_accounts"
    id: Mapped[int] = mapped_column(primary_key=True)
    employee_id: Mapped[int | None] = mapped_column(ForeignKey("employees.id"), unique=True, nullable=True)
    email: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(30), default="EMPLOYEE")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    employee: Mapped[Employee | None] = relationship(back_populates="account")


class Attendance(Base):
    __tablename__ = "attendance"
    __table_args__ = (UniqueConstraint("employee_id", "work_date", name="uq_attendance_employee_date"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), index=True)
    work_date: Mapped[date] = mapped_column(Date, index=True)
    check_in: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    check_out: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="PRESENT")
    note: Mapped[str | None] = mapped_column(Text, nullable=True)


class LeaveRequest(Base):
    __tablename__ = "leave_requests"
    id: Mapped[int] = mapped_column(primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), index=True)
    leave_type: Mapped[str] = mapped_column(String(50), default="ANNUAL")
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="PENDING")
    approver_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.utcnow())


class Contract(Base):
    __tablename__ = "contracts"
    id: Mapped[int] = mapped_column(primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), index=True)
    contract_no: Mapped[str] = mapped_column(String(60), unique=True)
    contract_type: Mapped[str] = mapped_column(String(50), default="FIXED_TERM")
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    salary: Mapped[float] = mapped_column(Float, default=0)
    status: Mapped[str] = mapped_column(String(30), default="ACTIVE")


class Payroll(Base):
    __tablename__ = "payrolls"
    __table_args__ = (UniqueConstraint("employee_id", "month", "year", name="uq_payroll_employee_month"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), index=True)
    month: Mapped[int] = mapped_column(Integer)
    year: Mapped[int] = mapped_column(Integer)
    base_salary: Mapped[float] = mapped_column(Float, default=0)
    allowance: Mapped[float] = mapped_column(Float, default=0)
    bonus: Mapped[float] = mapped_column(Float, default=0)
    deduction: Mapped[float] = mapped_column(Float, default=0)
    net_salary: Mapped[float] = mapped_column(Float, default=0)
    status: Mapped[str] = mapped_column(String(30), default="DRAFT")


class PerformanceReview(Base):
    __tablename__ = "performance_reviews"
    id: Mapped[int] = mapped_column(primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), index=True)
    period: Mapped[str] = mapped_column(String(50))
    score: Mapped[float] = mapped_column(Float)
    strengths: Mapped[str | None] = mapped_column(Text, nullable=True)
    improvements: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewer: Mapped[str | None] = mapped_column(String(160), nullable=True)


class JobPosting(Base):
    __tablename__ = "job_postings"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(160))
    department: Mapped[str | None] = mapped_column(String(120), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    openings: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String(30), default="OPEN")


class Candidate(Base):
    __tablename__ = "candidates"
    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(String(160))
    email: Mapped[str] = mapped_column(String(160), index=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    job_posting_id: Mapped[int | None] = mapped_column(ForeignKey("job_postings.id"), nullable=True)
    stage: Mapped[str] = mapped_column(String(30), default="APPLIED")
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
