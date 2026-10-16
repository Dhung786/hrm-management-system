from sqlalchemy import select
from app.database import Base, SessionLocal, engine
from app.models import Department, Employee, Position, UserAccount
from app.security import hash_password


DEMO_LOGIN_EMAIL = "admin@hr.local"
DEMO_EMPLOYEE_EMAIL = "hr.admin@example.com"
DEMO_PASSWORD = "Admin@123"


def seed():
    """Create demo data and repair the legacy demo employee if necessary.

    The login account intentionally keeps ``admin@hr.local`` for the classroom
    demo. Employee email data, however, is validated as a real email address by
    the HR API, so the employee record must use a syntactically valid domain.
    """
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        it = db.scalar(select(Department).where(Department.name == "Công nghệ thông tin"))
        if not it:
            it = Department(name="Công nghệ thông tin", description="Khối kỹ thuật")
            db.add(it)

        hr = db.scalar(select(Department).where(Department.name == "Nhân sự"))
        if not hr:
            hr = Department(name="Nhân sự", description="Tuyển dụng và vận hành nhân sự")
            db.add(hr)

        pos = db.scalar(select(Position).where(Position.name == "HR Manager"))
        if not pos:
            pos = Position(name="HR Manager", level="Manager")
            db.add(pos)

        db.flush()

        emp = db.scalar(select(Employee).where(Employee.employee_code == "NV0001"))
        if not emp:
            emp = Employee(
                employee_code="NV0001",
                full_name="Quản trị HR",
                email=DEMO_EMPLOYEE_EMAIL,
                phone="0900000000",
                department_id=hr.id,
                position_id=pos.id,
                base_salary=20000000,
            )
            db.add(emp)
            db.flush()
        else:
            # Repair data created by earlier versions. ``admin@hr.local`` is a
            # valid internal login identifier but not a valid Employee email.
            if emp.email == DEMO_LOGIN_EMAIL or not emp.email:
                emp.email = DEMO_EMPLOYEE_EMAIL
            if not emp.phone:
                emp.phone = "0900000000"
            emp.department_id = emp.department_id or hr.id
            emp.position_id = emp.position_id or pos.id

        account = db.scalar(select(UserAccount).where(UserAccount.email == DEMO_LOGIN_EMAIL))
        if not account:
            account = UserAccount(
                employee_id=emp.id,
                email=DEMO_LOGIN_EMAIL,
                password_hash=hash_password(DEMO_PASSWORD),
                role="ADMIN",
            )
            db.add(account)
        elif account.employee_id is None:
            account.employee_id = emp.id

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
