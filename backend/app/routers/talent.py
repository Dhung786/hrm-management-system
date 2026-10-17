from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import ensure_manager_employee_scope, get_current_user, manager_department_id, require_roles
from app.models import Candidate, Contract, Employee, JobPosting, PerformanceReview, UserAccount
from app.schemas import CandidateIn, CandidateOut, ContractIn, ContractOut, JobIn, JobOut, ReviewIn, ReviewOut

router = APIRouter(prefix="/api/talent", tags=["talent"])


def _commit_or_conflict(db: Session, message: str) -> None:
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, message)


def _employee_ids_for_manager(user: UserAccount, db: Session):
    department_id = manager_department_id(user, db)
    if not department_id:
        return None
    return select(Employee.id).where(Employee.department_id == department_id)


@router.get("/contracts", response_model=list[ContractOut])
def contracts(db: Session = Depends(get_db), user: UserAccount = Depends(get_current_user)):
    stmt = select(Contract).order_by(Contract.id.desc())
    if user.role == "EMPLOYEE":
        if not user.employee_id:
            return []
        stmt = stmt.where(Contract.employee_id == user.employee_id)
    elif user.role == "MANAGER":
        employee_ids = _employee_ids_for_manager(user, db)
        if employee_ids is None:
            return []
        stmt = stmt.where(Contract.employee_id.in_(employee_ids))
    elif user.role not in {"ADMIN", "HR", "PAYROLL"}:
        raise HTTPException(403, "Bạn không có quyền xem hợp đồng")
    return list(db.scalars(stmt).all())


@router.post("/contracts", response_model=ContractOut)
def create_contract(payload: ContractIn, db: Session = Depends(get_db), _=Depends(require_roles("ADMIN", "HR"))):
    employee = db.get(Employee, payload.employee_id)
    if not employee:
        raise HTTPException(404, "Không tìm thấy nhân viên")
    if employee.status == "INACTIVE":
        raise HTTPException(400, "Không thể tạo hợp đồng cho nhân viên đã nghỉ việc")
    if db.scalar(select(Contract).where(Contract.contract_no == payload.contract_no)):
        raise HTTPException(409, "Số hợp đồng đã tồn tại")
    obj = Contract(**payload.model_dump())
    db.add(obj)
    _commit_or_conflict(db, "Số hợp đồng đã tồn tại")
    db.refresh(obj)
    return obj


@router.put("/contracts/{contract_id}", response_model=ContractOut)
def update_contract(contract_id: int, payload: ContractIn, db: Session = Depends(get_db), _=Depends(require_roles("ADMIN", "HR"))):
    obj = db.get(Contract, contract_id)
    if not obj:
        raise HTTPException(404, "Không tìm thấy hợp đồng")
    if not db.get(Employee, payload.employee_id):
        raise HTTPException(404, "Không tìm thấy nhân viên")
    duplicate = db.scalar(select(Contract).where(Contract.id != contract_id, Contract.contract_no == payload.contract_no))
    if duplicate:
        raise HTTPException(409, "Số hợp đồng đã tồn tại")
    for key, value in payload.model_dump().items():
        setattr(obj, key, value)
    _commit_or_conflict(db, "Số hợp đồng đã tồn tại")
    db.refresh(obj)
    return obj


@router.get("/reviews", response_model=list[ReviewOut])
def reviews(db: Session = Depends(get_db), user: UserAccount = Depends(get_current_user)):
    stmt = select(PerformanceReview).order_by(PerformanceReview.id.desc())
    if user.role == "EMPLOYEE":
        if not user.employee_id:
            return []
        stmt = stmt.where(PerformanceReview.employee_id == user.employee_id)
    elif user.role == "MANAGER":
        employee_ids = _employee_ids_for_manager(user, db)
        if employee_ids is None:
            return []
        stmt = stmt.where(PerformanceReview.employee_id.in_(employee_ids))
    elif user.role not in {"ADMIN", "HR"}:
        raise HTTPException(403, "Bạn không có quyền xem đánh giá hiệu suất")
    return list(db.scalars(stmt).all())


@router.post("/reviews", response_model=ReviewOut)
def create_review(
    payload: ReviewIn,
    db: Session = Depends(get_db),
    user: UserAccount = Depends(require_roles("ADMIN", "HR", "MANAGER")),
):
    employee = db.get(Employee, payload.employee_id)
    if not employee:
        raise HTTPException(404, "Không tìm thấy nhân viên")
    ensure_manager_employee_scope(user, employee, db)
    obj = PerformanceReview(**payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_roles("ADMIN")),
):
    obj = db.get(PerformanceReview, review_id)
    if not obj:
        raise HTTPException(404, "Không tìm thấy đánh giá")
    db.delete(obj)
    db.commit()
    return None


@router.get("/jobs", response_model=list[JobOut])
def jobs(db: Session = Depends(get_db), _=Depends(require_roles("ADMIN", "HR"))):
    return list(db.scalars(select(JobPosting).order_by(JobPosting.id.desc())).all())


@router.post("/jobs", response_model=JobOut)
def create_job(payload: JobIn, db: Session = Depends(get_db), _=Depends(require_roles("ADMIN", "HR"))):
    obj = JobPosting(**payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/jobs/{job_id}", response_model=JobOut)
def update_job(job_id: int, payload: JobIn, db: Session = Depends(get_db), _=Depends(require_roles("ADMIN", "HR"))):
    obj = db.get(JobPosting, job_id)
    if not obj:
        raise HTTPException(404, "Không tìm thấy tin tuyển dụng")
    for key, value in payload.model_dump().items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("/candidates", response_model=list[CandidateOut])
def candidates(db: Session = Depends(get_db), _=Depends(require_roles("ADMIN", "HR"))):
    return list(db.scalars(select(Candidate).order_by(Candidate.id.desc())).all())


@router.post("/candidates", response_model=CandidateOut)
def create_candidate(payload: CandidateIn, db: Session = Depends(get_db), _=Depends(require_roles("ADMIN", "HR"))):
    if payload.job_posting_id and not db.get(JobPosting, payload.job_posting_id):
        raise HTTPException(404, "Tin tuyển dụng không tồn tại")
    obj = Candidate(**payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/candidates/{candidate_id}", response_model=CandidateOut)
def update_candidate(candidate_id: int, payload: CandidateIn, db: Session = Depends(get_db), _=Depends(require_roles("ADMIN", "HR"))):
    obj = db.get(Candidate, candidate_id)
    if not obj:
        raise HTTPException(404, "Không tìm thấy ứng viên")
    if payload.job_posting_id and not db.get(JobPosting, payload.job_posting_id):
        raise HTTPException(404, "Tin tuyển dụng không tồn tại")
    for key, value in payload.model_dump().items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj
