from groq_client import chat_json
from models import WorkerRating
from sqlalchemy.orm import Session
import json
from datetime import datetime


def rate_worker(data: dict, db: Session) -> WorkerRating:
    prompt = f"""You are an AI evaluator for a professional service platform called SSFRS (Smart Service Failure Refund System).
Analyze this worker profile and generate a fair rating.

WORKER PROFILE:
- Specialization: {data.get('specialization', 'Not specified')}
- Years of Experience: {data.get('years_of_experience', 0)} years
- Additional Credentials: {data.get('additional_credentials') or 'None provided'}
- Successfully Completed Projects on platform: {data.get('completed_projects', 0)}
- Past Failures / Claims Filed Against Them: {data.get('past_failures', 0)}

RATING CRITERIA (each scored 0.0 to 10.0):
1. cv_score — Based on specialization depth and listed credentials
2. experience_score — Based on years of professional experience
3. projects_score — Based on number of successfully completed projects
4. ratings_score — Estimated client satisfaction (use completed vs failure ratio as proxy)
5. failure_score — Starts at 10.0, reduced by 1.5 per past failure (minimum 0.0)

OVERALL SCORE formula (weighted):
overall = (cv_score * 0.20) + (experience_score * 0.25) + (projects_score * 0.25) + (ratings_score * 0.15) + (failure_score * 0.15)

Respond ONLY with valid JSON, no markdown, no explanation outside JSON:
{{
  "cv_score": <float 0-10>,
  "experience_score": <float 0-10>,
  "projects_score": <float 0-10>,
  "ratings_score": <float 0-10>,
  "failure_score": <float 0-10>,
  "overall_score": <float 0-10>,
  "reasoning": "<2-3 sentence explanation of the rating>"
}}"""

    result = chat_json(prompt)

    existing = db.query(WorkerRating).filter(WorkerRating.worker_id == data["worker_id"]).first()
    if existing:
        existing.cv_score = result["cv_score"]
        existing.experience_score = result["experience_score"]
        existing.projects_score = result["projects_score"]
        existing.ratings_score = result["ratings_score"]
        existing.failure_score = result["failure_score"]
        existing.overall_score = result["overall_score"]
        existing.reasoning = result["reasoning"]
        existing.completed_projects = data.get("completed_projects", existing.completed_projects)
        existing.past_failures = data.get("past_failures", existing.past_failures)
        existing.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing
    else:
        rating = WorkerRating(
            worker_id=data["worker_id"],
            worker_name=data.get("worker_name", ""),
            worker_email=data.get("worker_email", ""),
            specialization=data.get("specialization", ""),
            cv_score=result["cv_score"],
            experience_score=result["experience_score"],
            projects_score=result["projects_score"],
            ratings_score=result["ratings_score"],
            failure_score=result["failure_score"],
            overall_score=result["overall_score"],
            reasoning=result["reasoning"],
            completed_projects=data.get("completed_projects", 0),
            past_failures=data.get("past_failures", 0),
        )
        db.add(rating)
        db.commit()
        db.refresh(rating)
        return rating


def get_rating(worker_id: str, db: Session) -> WorkerRating | None:
    return db.query(WorkerRating).filter(WorkerRating.worker_id == worker_id).first()


def apply_failure_penalty(worker_id: str, severity: str, db: Session) -> WorkerRating | None:
    rating = get_rating(worker_id, db)
    if not rating:
        return None

    penalty = 2.0 if severity == "SEVERE" else 1.5
    rating.failure_score = max(0.0, rating.failure_score - penalty)
    rating.past_failures += 1
    rating.overall_score = (
        rating.cv_score * 0.20
        + rating.experience_score * 0.25
        + rating.projects_score * 0.25
        + rating.ratings_score * 0.15
        + rating.failure_score * 0.15
    )
    rating.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(rating)
    return rating
