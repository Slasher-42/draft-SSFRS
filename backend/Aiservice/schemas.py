from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class WorkerRateRequest(BaseModel):
    worker_id: str
    worker_name: str
    worker_email: str
    specialization: str
    years_of_experience: int
    additional_credentials: Optional[str] = None
    completed_projects: int = 0
    past_failures: int = 0


class WorkerRatingResponse(BaseModel):
    worker_id: str
    worker_name: str
    specialization: str
    cv_score: float
    experience_score: float
    projects_score: float
    ratings_score: float
    failure_score: float
    overall_score: float
    reasoning: str
    completed_projects: int
    past_failures: int
    updated_at: Optional[datetime] = None


class WorkerInputForRanking(BaseModel):
    worker_id: str
    worker_name: str
    worker_email: str
    specialization: str
    years_of_experience: int
    additional_credentials: Optional[str] = None
    rating_score: float = 0.0


class RankCandidatesRequest(BaseModel):
    project_id: str
    title: str
    scope_of_work: str
    required_skills: str
    workers: List[WorkerInputForRanking]


class RankedCandidate(BaseModel):
    worker_id: str
    worker_name: str
    worker_email: str
    specialization: str
    years_of_experience: int
    rating_score: float
    match_score: float
    match_reasoning: str


class RankCandidatesResponse(BaseModel):
    project_id: str
    ranked_workers: List[RankedCandidate]


class MediateClaimRequest(BaseModel):
    claim_id: str
    project_id: str
    provider_id: str
    worker_id: str
    project_title: str
    required_skills: str
    budget: float
    description: str
    worker_response: Optional[str] = None
    geolocation_summary: Optional[str] = None


class MediationReportResponse(BaseModel):
    claim_id: str
    analysis: str
    recommendation: str
    reasoning: str
    key_findings: List[str]
    confidence_score: float


class VerifyGeolocationRequest(BaseModel):
    claim_id: str
    latitude: float
    longitude: float
    photo_timestamp: Optional[str] = None
    project_location: Optional[str] = None
    project_start_date: Optional[str] = None
    project_end_date: Optional[str] = None


class GeolocationResultResponse(BaseModel):
    claim_id: str
    latitude: float
    longitude: float
    address: str
    photo_timestamp: Optional[str]
    location_status: str
    timeline_status: str
    flags: List[str]
    summary: str


class PenalizeWorkerRequest(BaseModel):
    worker_id: str
    claim_id: str
    severity: str = "STANDARD"
