import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas import WorkerRateRequest, WorkerRatingResponse, PenalizeWorkerRequest
from services import rating_service
from messaging.producer import publish_event

router = APIRouter(prefix="/api/ai/rating", tags=["Rating"])


@router.post("/rate-worker", response_model=WorkerRatingResponse)
def rate_worker(request: WorkerRateRequest, db: Session = Depends(get_db)):
    try:
        rating = rating_service.rate_worker(request.model_dump(), db)
        publish_event("worker-rating-generated", f"{rating.worker_id}:{rating.overall_score:.2f}")
        return WorkerRatingResponse(
            worker_id=rating.worker_id,
            worker_name=rating.worker_name,
            specialization=rating.specialization,
            cv_score=rating.cv_score,
            experience_score=rating.experience_score,
            projects_score=rating.projects_score,
            ratings_score=rating.ratings_score,
            failure_score=rating.failure_score,
            overall_score=rating.overall_score,
            reasoning=rating.reasoning or "",
            completed_projects=rating.completed_projects,
            past_failures=rating.past_failures,
            updated_at=rating.updated_at,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/worker/{worker_id}", response_model=WorkerRatingResponse)
def get_worker_rating(worker_id: str, db: Session = Depends(get_db)):
    rating = rating_service.get_rating(worker_id, db)
    if not rating:
        raise HTTPException(status_code=404, detail="No AI rating found for this worker.")
    return WorkerRatingResponse(
        worker_id=rating.worker_id,
        worker_name=rating.worker_name,
        specialization=rating.specialization,
        cv_score=rating.cv_score,
        experience_score=rating.experience_score,
        projects_score=rating.projects_score,
        ratings_score=rating.ratings_score,
        failure_score=rating.failure_score,
        overall_score=rating.overall_score,
        reasoning=rating.reasoning or "",
        completed_projects=rating.completed_projects,
        past_failures=rating.past_failures,
        updated_at=rating.updated_at,
    )


@router.post("/penalize")
def penalize_worker(request: PenalizeWorkerRequest, db: Session = Depends(get_db)):
    rating = rating_service.apply_failure_penalty(request.worker_id, request.severity, db)
    if not rating:
        raise HTTPException(status_code=404, detail="Worker rating not found.")
    publish_event("failure-penalty-applied", f"{request.worker_id}:{request.claim_id}")
    return {"message": "Penalty applied.", "new_overall_score": rating.overall_score}
