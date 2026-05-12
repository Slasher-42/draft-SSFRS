"""
Background Kafka consumer — listens to Service 2 events and triggers AI processing.
Run this in a background thread via main.py startup.
"""
import threading
import httpx
from kafka import KafkaConsumer
from config import settings
from database import SessionLocal
from services import rating_service, claim_service, geolocation_service


INTERNAL_HEADERS = {"X-Internal-Key": settings.internal_api_key}


def _get_db():
    db = SessionLocal()
    try:
        return db
    finally:
        pass


def handle_worker_cv_submitted(payload: str):
    """
    Payload format: workerId
    Fetch CV details from Service 2 then trigger AI rating.
    """
    worker_id = payload.strip()
    try:
        resp = httpx.get(
            f"{settings.service2_base_url}/api/worker-cv/{worker_id}",
            headers=INTERNAL_HEADERS,
            timeout=10,
        )
        if resp.status_code != 200:
            print(f"[Consumer] Could not fetch CV for worker {worker_id}")
            return
        cv = resp.json()
        db = SessionLocal()
        try:
            existing_rating = rating_service.get_rating(worker_id, db)
            worker_data = {
                "worker_id": worker_id,
                "worker_name": cv.get("workerName", ""),
                "worker_email": cv.get("workerEmail", ""),
                "specialization": cv.get("specialization", ""),
                "years_of_experience": cv.get("yearsOfExperience", 0),
                "additional_credentials": cv.get("additionalCredentials"),
                "completed_projects": existing_rating.completed_projects if existing_rating else 0,
                "past_failures": existing_rating.past_failures if existing_rating else 0,
            }
            rating = rating_service.rate_worker(worker_data, db)
            # Push score back to Service 2
            httpx.patch(
                f"{settings.service2_base_url}/api/internal/worker-cv/{worker_id}/rating",
                json={"ratingScore": rating.overall_score},
                headers=INTERNAL_HEADERS,
                timeout=10,
            )
            print(f"[AI] Rated worker {worker_id}: {rating.overall_score:.2f}")
        finally:
            db.close()
    except Exception as e:
        print(f"[Consumer] Error rating worker {worker_id}: {e}")


def handle_claim_filed(payload: str):
    """
    Payload format: claimId:projectId:workerId
    Fetch claim details from Service 2, run geolocation if needed, then mediate.
    """
    parts = payload.strip().split(":")
    if len(parts) < 3:
        return
    claim_id, project_id, worker_id = parts[0], parts[1], parts[2]
    try:
        claim_resp = httpx.get(
            f"{settings.service2_base_url}/api/claims/{claim_id}",
            headers=INTERNAL_HEADERS,
            timeout=10,
        )
        project_resp = httpx.get(
            f"{settings.service2_base_url}/api/projects/{project_id}",
            headers=INTERNAL_HEADERS,
            timeout=10,
        )
        if claim_resp.status_code != 200 or project_resp.status_code != 200:
            print(f"[Consumer] Could not fetch data for claim {claim_id}")
            return

        claim = claim_resp.json()
        project = project_resp.json()

        geo_summary = None
        db = SessionLocal()
        try:
            # Run geolocation if coordinates are available
            if claim.get("extractedLat") and claim.get("extractedLon"):
                geo = geolocation_service.verify_geolocation({
                    "claim_id": claim_id,
                    "latitude": claim["extractedLat"],
                    "longitude": claim["extractedLon"],
                    "photo_timestamp": claim.get("extractedPhotoTimestamp"),
                    "project_location": None,
                    "project_start_date": None,
                    "project_end_date": project.get("deadline"),
                }, db)
                geo_summary = geolocation_service.build_summary(geo)

            mediation_data = {
                "claim_id": claim_id,
                "project_id": project_id,
                "provider_id": claim.get("providerId", ""),
                "worker_id": worker_id,
                "project_title": project.get("title", "Unknown"),
                "required_skills": project.get("requiredSkills", ""),
                "budget": float(project.get("budget", 0)),
                "description": claim.get("description", ""),
                "worker_response": claim.get("workerResponse"),
                "geolocation_summary": geo_summary,
            }
            report = claim_service.mediate_claim(mediation_data, db)

            # Push mediation report back to Service 2
            httpx.patch(
                f"{settings.service2_base_url}/api/internal/claims/{claim_id}/mediation",
                json={
                    "aiMediationReport": (
                        f"AI Recommendation: {report.recommendation}\n\n"
                        f"{report.analysis}\n\nReasoning: {report.reasoning}"
                    )
                },
                headers=INTERNAL_HEADERS,
                timeout=10,
            )
            print(f"[AI] Mediated claim {claim_id}: {report.recommendation}")
        finally:
            db.close()
    except Exception as e:
        print(f"[Consumer] Error mediating claim {claim_id}: {e}")


def handle_worker_claim_response(payload: str):
    """Re-run mediation after worker responds."""
    parts = payload.strip().split(":")
    if len(parts) < 2:
        return
    claim_id = parts[0]
    handle_claim_filed(f"{claim_id}:{payload}")


def start_consumer():
    """Run Kafka consumer in a background thread."""
    def _run():
        try:
            consumer = KafkaConsumer(
                "worker-cv-submitted",
                "claim-filed",
                "worker-claim-response-submitted",
                bootstrap_servers=settings.kafka_bootstrap_servers,
                group_id="ai-service-group",
                auto_offset_reset="latest",
                enable_auto_commit=True,
            )
            print("[Kafka Consumer] Started — listening for events...")
            for msg in consumer:
                topic = msg.topic
                value = msg.value.decode("utf-8") if msg.value else ""
                print(f"[Kafka] Received: {topic} → {value}")

                if topic == "worker-cv-submitted":
                    threading.Thread(target=handle_worker_cv_submitted, args=(value,), daemon=True).start()
                elif topic == "claim-filed":
                    threading.Thread(target=handle_claim_filed, args=(value,), daemon=True).start()
                elif topic == "worker-claim-response-submitted":
                    threading.Thread(target=handle_worker_claim_response, args=(value,), daemon=True).start()
        except Exception as e:
            print(f"[Kafka Consumer] Error: {e}")

    thread = threading.Thread(target=_run, daemon=True)
    thread.start()
    return thread
