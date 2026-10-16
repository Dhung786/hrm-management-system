from sqlalchemy import select
from app.database import Base, SessionLocal, engine
from app.models import Department, Employee, Position, UserAccount
from app.security import hash_password


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if not db.scalar(select(UserAccount).where(UserAccount.email == "admin@hr.local")):
            it = Department(name="Công nghệ thông tin", description="Khối kỹ thuật")
            hr = Department(name="Nhân sự", description="Tuyển dụng và vận hành nhân sự")
            pos = Position(name="HR Manager", level="Manager")
            db.add_all([it, hr, pos]); db.flush()
            emp = Employee(employee_code="NV0001", full_name="Quản trị HR", email="admin@hr.local", phone="0900000000", department_id=hr.id, position_id=pos.id, base_salary=20000000)
            db.add(emp); db.flush()
            db.add(UserAccount(employee_id=emp.id, email="admin@hr.local", password_hash=hash_password("Admin@123"), role="ADMIN"))
            db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
