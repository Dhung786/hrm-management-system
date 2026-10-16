from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models import Candidate, Contract, JobPosting, PerformanceReview
from app.schemas import CandidateIn, CandidateOut, ContractIn, ContractOut, JobIn, JobOut, ReviewIn, ReviewOut

router = APIRouter(prefix="/api/talent", tags=["talent"])


@router.get("/contracts", response_model=list[ContractOut])
def contracts(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return list(db.scalars(select(Contract).order_by(Contract.id.desc())).all())


@router.post("/contracts", response_model=ContractOut)
def create_contract(payload: ContractIn, db: Session = Depends(get_db), _=Depends(require_roles("ADMIN", "HR"))):
    obj = Contract(**payload.model_dump()); db.add(obj); db.commit(); db.refresh(obj); return obj


@router.get("/reviews", response_model=list[ReviewOut])
def reviews(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return list(db.scalars(select(PerformanceReview).order_by(PerformanceReview.id.desc())).all())


@router.post("/reviews", response_model=ReviewOut)
def create_review(payload: ReviewIn, db: Session = Depends(get_db), _=Depends(require_roles("ADMIN", "HR", "MANAGER"))):
    obj = PerformanceReview(**payload.model_dump()); db.add(obj); db.commit(); db.refresh(obj); return obj


@router.get("/jobs", response_model=list[JobOut])
def jobs(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return list(db.scalars(select(JobPosting).order_by(JobPosting.id.desc())).all())


@router.post("/jobs", response_model=JobOut)
def create_job(payload: JobIn, db: Session = Depends(get_db), _=Depends(require_roles("ADMIN", "HR"))):
    obj = JobPosting(**payload.model_dump()); db.add(obj); db.commit(); db.refresh(obj); return obj


@router.get("/candidates", response_model=list[CandidateOut])
def candidates(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return list(db.scalars(select(Candidate).order_by(Candidate.id.desc())).all())


@router.post("/candidates", response_model=CandidateOut)
def create_candidate(payload: CandidateIn, db: Session = Depends(get_db), _=Depends(require_roles("ADMIN", "HR"))):
    obj = Candidate(**payload.model_dump()); db.add(obj); db.commit(); db.refresh(obj); return obj
