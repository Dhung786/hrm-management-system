from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models import Department, Employee, Position
from app.schemas import DepartmentIn, DepartmentOut, EmployeeIn, EmployeeOut, PositionIn, PositionOut

router = APIRouter(prefix="/api/hr", tags=["human-resources"])


@router.get("/employees", response_model=list[EmployeeOut])
def list_employees(q: str | None = Query(default=None), db: Session = Depends(get_db), _=Depends(get_current_user)):
    stmt = select(Employee).order_by(Employee.id.desc())
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(Employee.full_name.ilike(like), Employee.employee_code.ilike(like), Employee.email.ilike(like)))
    return list(db.scalars(stmt).all())


@router.post("/employees", response_model=EmployeeOut, status_code=status.HTTP_201_CREATED)
def create_employee(payload: EmployeeIn, db: Session = Depends(get_db), _=Depends(require_roles("ADMIN", "HR"))):
    if db.scalar(select(Employee).where((Employee.employee_code == payload.employee_code) | (Employee.email == payload.email))):
        raise HTTPException(409, "Mã nhân viên hoặc email đã tồn tại")
    obj = Employee(**payload.model_dump())
    db.add(obj); db.commit(); db.refresh(obj)
    return obj


@router.put("/employees/{employee_id}", response_model=EmployeeOut)
def update_employee(employee_id: int, payload: EmployeeIn, db: Session = Depends(get_db), _=Depends(require_roles("ADMIN", "HR"))):
    obj = db.get(Employee, employee_id)
    if not obj: raise HTTPException(404, "Không tìm thấy nhân viên")
    for k, v in payload.model_dump().items(): setattr(obj, k, v)
    db.commit(); db.refresh(obj); return obj


@router.delete("/employees/{employee_id}", status_code=204)
def deactivate_employee(employee_id: int, db: Session = Depends(get_db), _=Depends(require_roles("ADMIN", "HR"))):
    obj = db.get(Employee, employee_id)
    if not obj: raise HTTPException(404, "Không tìm thấy nhân viên")
    obj.status = "INACTIVE"; db.commit()


@router.get("/departments", response_model=list[DepartmentOut])
def departments(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return list(db.scalars(select(Department).order_by(Department.name)).all())


@router.post("/departments", response_model=DepartmentOut)
def create_department(payload: DepartmentIn, db: Session = Depends(get_db), _=Depends(require_roles("ADMIN", "HR"))):
    obj = Department(**payload.model_dump()); db.add(obj); db.commit(); db.refresh(obj); return obj


@router.get("/positions", response_model=list[PositionOut])
def positions(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return list(db.scalars(select(Position).order_by(Position.name)).all())


@router.post("/positions", response_model=PositionOut)
def create_position(payload: PositionIn, db: Session = Depends(get_db), _=Depends(require_roles("ADMIN", "HR"))):
    obj = Position(**payload.model_dump()); db.add(obj); db.commit(); db.refresh(obj); return obj
