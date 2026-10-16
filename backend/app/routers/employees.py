from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models import Department, Employee, Position
from app.schemas import DepartmentIn, DepartmentOut, EmployeeIn, EmployeeOut, PositionIn, PositionOut

router = APIRouter(prefix="/api/hr", tags=["human-resources"])


def _validate_employee_refs(payload: EmployeeIn, db: Session) -> None:
    if payload.department_id and not db.get(Department, payload.department_id):
        raise HTTPException(400, "Phòng ban không tồn tại")
    if payload.position_id and not db.get(Position, payload.position_id):
        raise HTTPException(400, "Chức vụ không tồn tại")


def _commit_or_conflict(db: Session, message: str) -> None:
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, message)


@router.get("/employees", response_model=list[EmployeeOut])
def list_employees(q: str | None = Query(default=None, max_length=100), db: Session = Depends(get_db), _=Depends(get_current_user)):
    stmt = select(Employee).order_by(Employee.id.desc())
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(or_(Employee.full_name.ilike(like), Employee.employee_code.ilike(like), Employee.email.ilike(like), Employee.phone.ilike(like)))
    return list(db.scalars(stmt).all())


@router.get("/employees/{employee_id}", response_model=EmployeeOut)
def get_employee(employee_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    obj = db.get(Employee, employee_id)
    if not obj:
        raise HTTPException(404, "Không tìm thấy nhân viên")
    return obj


@router.post("/employees", response_model=EmployeeOut, status_code=status.HTTP_201_CREATED)
def create_employee(payload: EmployeeIn, db: Session = Depends(get_db), _=Depends(require_roles("ADMIN", "HR"))):
    _validate_employee_refs(payload, db)
    duplicate = db.scalar(select(Employee).where((Employee.employee_code == payload.employee_code) | (Employee.email == str(payload.email))))
    if duplicate:
        raise HTTPException(409, "Mã nhân viên hoặc email đã tồn tại")
    obj = Employee(**payload.model_dump())
    db.add(obj)
    _commit_or_conflict(db, "Mã nhân viên hoặc email đã tồn tại")
    db.refresh(obj)
    return obj


@router.put("/employees/{employee_id}", response_model=EmployeeOut)
def update_employee(employee_id: int, payload: EmployeeIn, db: Session = Depends(get_db), _=Depends(require_roles("ADMIN", "HR"))):
    obj = db.get(Employee, employee_id)
    if not obj:
        raise HTTPException(404, "Không tìm thấy nhân viên")
    _validate_employee_refs(payload, db)
    duplicate = db.scalar(
        select(Employee).where(
            Employee.id != employee_id,
            (Employee.employee_code == payload.employee_code) | (Employee.email == str(payload.email)),
        )
    )
    if duplicate:
        raise HTTPException(409, "Mã nhân viên hoặc email đã được dùng bởi nhân viên khác")
    for key, value in payload.model_dump().items():
        setattr(obj, key, value)
    _commit_or_conflict(db, "Dữ liệu nhân viên bị trùng")
    db.refresh(obj)
    return obj


@router.delete("/employees/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_employee(employee_id: int, db: Session = Depends(get_db), _=Depends(require_roles("ADMIN", "HR"))):
    obj = db.get(Employee, employee_id)
    if not obj:
        raise HTTPException(404, "Không tìm thấy nhân viên")
    if obj.status == "INACTIVE":
        return None
    obj.status = "INACTIVE"
    db.commit()
    return None


@router.get("/departments", response_model=list[DepartmentOut])
def departments(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return list(db.scalars(select(Department).order_by(Department.name)).all())


@router.post("/departments", response_model=DepartmentOut, status_code=status.HTTP_201_CREATED)
def create_department(payload: DepartmentIn, db: Session = Depends(get_db), _=Depends(require_roles("ADMIN", "HR"))):
    if db.scalar(select(Department).where(Department.name.ilike(payload.name))):
        raise HTTPException(409, "Tên phòng ban đã tồn tại")
    obj = Department(**payload.model_dump())
    db.add(obj)
    _commit_or_conflict(db, "Tên phòng ban đã tồn tại")
    db.refresh(obj)
    return obj


@router.put("/departments/{department_id}", response_model=DepartmentOut)
def update_department(department_id: int, payload: DepartmentIn, db: Session = Depends(get_db), _=Depends(require_roles("ADMIN", "HR"))):
    obj = db.get(Department, department_id)
    if not obj:
        raise HTTPException(404, "Không tìm thấy phòng ban")
    duplicate = db.scalar(select(Department).where(Department.id != department_id, Department.name.ilike(payload.name)))
    if duplicate:
        raise HTTPException(409, "Tên phòng ban đã tồn tại")
    obj.name = payload.name
    obj.description = payload.description
    _commit_or_conflict(db, "Tên phòng ban đã tồn tại")
    db.refresh(obj)
    return obj


@router.delete("/departments/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_department(department_id: int, db: Session = Depends(get_db), _=Depends(require_roles("ADMIN", "HR"))):
    obj = db.get(Department, department_id)
    if not obj:
        raise HTTPException(404, "Không tìm thấy phòng ban")
    if db.scalar(select(Employee.id).where(Employee.department_id == department_id).limit(1)):
        raise HTTPException(409, "Không thể xóa phòng ban đang có nhân viên")
    db.delete(obj)
    db.commit()
    return None


@router.get("/positions", response_model=list[PositionOut])
def positions(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return list(db.scalars(select(Position).order_by(Position.name)).all())


@router.post("/positions", response_model=PositionOut, status_code=status.HTTP_201_CREATED)
def create_position(payload: PositionIn, db: Session = Depends(get_db), _=Depends(require_roles("ADMIN", "HR"))):
    if db.scalar(select(Position).where(Position.name.ilike(payload.name))):
        raise HTTPException(409, "Tên chức vụ đã tồn tại")
    obj = Position(**payload.model_dump())
    db.add(obj)
    _commit_or_conflict(db, "Tên chức vụ đã tồn tại")
    db.refresh(obj)
    return obj


@router.put("/positions/{position_id}", response_model=PositionOut)
def update_position(position_id: int, payload: PositionIn, db: Session = Depends(get_db), _=Depends(require_roles("ADMIN", "HR"))):
    obj = db.get(Position, position_id)
    if not obj:
        raise HTTPException(404, "Không tìm thấy chức vụ")
    duplicate = db.scalar(select(Position).where(Position.id != position_id, Position.name.ilike(payload.name)))
    if duplicate:
        raise HTTPException(409, "Tên chức vụ đã tồn tại")
    obj.name = payload.name
    obj.level = payload.level
    _commit_or_conflict(db, "Tên chức vụ đã tồn tại")
    db.refresh(obj)
    return obj


@router.delete("/positions/{position_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_position(position_id: int, db: Session = Depends(get_db), _=Depends(require_roles("ADMIN", "HR"))):
    obj = db.get(Position, position_id)
    if not obj:
        raise HTTPException(404, "Không tìm thấy chức vụ")
    if db.scalar(select(Employee.id).where(Employee.position_id == position_id).limit(1)):
        raise HTTPException(409, "Không thể xóa chức vụ đang được gán cho nhân viên")
    db.delete(obj)
    db.commit()
    return None
