import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas import MediateClaimRequest, MediationReportResponse
from services import claim_service
from messaging.producer import publish_event

router = APIRouter(prefix="/api/ai/claim", tags=["Claim Mediation"])


@router.post("/mediate", response_model=MediationReportResponse)
def mediate_claim(request: MediateClaimRequest, db: Session = Depends(get_db)):
    try:
        report = claim_service.mediate_claim(request.model_dump(), db)
        publish_event("claim-mediation-completed", f"{request.claim_id}:{report.recommendation}")
        publish_event("mediation-report-generated", request.claim_id)
        return MediationReportResponse(
            claim_id=report.claim_id,
            analysis=report.analysis,
            recommendation=report.recommendation,
            reasoning=report.reasoning,
            key_findings=json.loads(report.key_findings or "[]"),
            confidence_score=report.confidence_score,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/report/{claim_id}", response_model=MediationReportResponse)
def get_report(claim_id: str, db: Session = Depends(get_db)):
    report = claim_service.get_report(claim_id, db)
    if not report:
        raise HTTPException(status_code=404, detail="Mediation report not found.")
    return MediationReportResponse(
        claim_id=report.claim_id,
        analysis=report.analysis,
        recommendation=report.recommendation,
        reasoning=report.reasoning,
        key_findings=json.loads(report.key_findings or "[]"),
        confidence_score=report.confidence_score,
    )
