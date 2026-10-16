from sqlalchemy import select

from app.database import Base, SessionLocal, engine
from app.models import Department, Employee, Position, UserAccount
from app.security import hash_password


DEMO_USERS = [
    {
        "login": "admin@hr.local", "password": "Admin@123", "role": "ADMIN",
        "code": "NV0001", "name": "Quản trị HR", "email": "hr.admin@example.com", "phone": "0900000000",
        "department": "Nhân sự", "position": "Quản trị hệ thống", "salary": 20000000,
    },
    {
        "login": "hr@hr.local", "password": "Hr123456", "role": "HR",
        "code": "DEMOHR", "name": "Chuyên viên Nhân sự", "email": "hr.demo@example.com", "phone": "0900000001",
        "department": "Nhân sự", "position": "Chuyên viên Nhân sự", "salary": 15000000,
    },
    {
        "login": "manager@hr.local", "password": "Manager123", "role": "MANAGER",
        "code": "DEMOMGR", "name": "Trưởng phòng Công nghệ", "email": "manager.demo@example.com", "phone": "0900000002",
        "department": "Công nghệ thông tin", "position": "Trưởng phòng", "salary": 25000000,
    },
    {
        "login": "payroll@hr.local", "password": "Payroll123", "role": "PAYROLL",
        "code": "DEMOPAY", "name": "Kế toán Tiền lương", "email": "payroll.demo@example.com", "phone": "0900000003",
        "department": "Tài chính - Kế toán", "position": "Kế toán tiền lương", "salary": 16000000,
    },
    {
        "login": "employee@hr.local", "password": "Employee123", "role": "EMPLOYEE",
        "code": "DEMOEMP", "name": "Nhân viên Demo", "email": "employee.demo@example.com", "phone": "0900000004",
        "department": "Công nghệ thông tin", "position": "Nhân viên", "salary": 12000000,
    },
]


def _department(db, name: str) -> Department:
    obj = db.scalar(select(Department).where(Department.name == name))
    if not obj:
        obj = Department(name=name, description=f"Phòng ban {name}")
        db.add(obj)
        db.flush()
    return obj


def _position(db, name: str) -> Position:
    obj = db.scalar(select(Position).where(Position.name == name))
    if not obj:
        obj = Position(name=name, level="Demo")
        db.add(obj)
        db.flush()
    return obj


def seed():
    """Create idempotent demo data for all five HRM roles."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        for data in DEMO_USERS:
            department = _department(db, data["department"])
            position = _position(db, data["position"])

            employee = db.scalar(select(Employee).where(Employee.employee_code == data["code"]))
            if not employee:
                employee = Employee(
                    employee_code=data["code"],
                    full_name=data["name"],
                    email=data["email"],
                    phone=data["phone"],
                    department_id=department.id,
                    position_id=position.id,
                    base_salary=data["salary"],
                )
                db.add(employee)
                db.flush()
            else:
                # Repair legacy demo data without overwriting user-managed values unnecessarily.
                if employee.email.endswith("@hr.local") or not employee.email:
                    employee.email = data["email"]
                employee.department_id = employee.department_id or department.id
                employee.position_id = employee.position_id or position.id
                employee.phone = employee.phone or data["phone"]

            account = db.scalar(select(UserAccount).where(UserAccount.email == data["login"]))
            if not account:
                account = UserAccount(
                    employee_id=employee.id,
                    email=data["login"],
                    password_hash=hash_password(data["password"]),
                    role=data["role"],
                    is_active=True,
                )
                db.add(account)
            else:
                account.employee_id = account.employee_id or employee.id
                account.role = data["role"]
                account.is_active = True

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
