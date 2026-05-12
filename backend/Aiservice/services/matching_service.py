import json
from groq_client import chat_json
from models import WorkerRating
from sqlalchemy.orm import Session


def rank_candidates(project: dict, workers: list[dict], db: Session) -> list[dict]:
    """Use Groq to rank workers for a specific project based on their profiles and AI ratings."""
    if not workers:
        return []

    # Enrich each worker with their AI rating from our DB
    enriched = []
    for w in workers:
        stored = db.query(WorkerRating).filter(WorkerRating.worker_id == w["worker_id"]).first()
        ai_score = stored.overall_score if stored else w.get("rating_score", 0.0)
        enriched.append({**w, "ai_overall_score": ai_score})

    workers_text = "\n".join([
        f"  Worker {i+1}: ID={w['worker_id']}, Name={w['worker_name']}, "
        f"Specialization={w['specialization']}, "
        f"Experience={w['years_of_experience']} years, "
        f"AI Overall Rating={w['ai_overall_score']:.2f}/10, "
        f"Credentials={w.get('additional_credentials') or 'None'}"
        for i, w in enumerate(enriched)
    ])

    prompt = f"""You are an AI matching engine for SSFRS — a professional service platform.
Your task is to rank workers for a specific project based on skill match and overall quality.

PROJECT:
- Title: {project.get('title')}
- Required Skills: {project.get('required_skills')}
- Scope of Work: {project.get('scope_of_work')}

AVAILABLE WORKERS:
{workers_text}

Rank ALL workers from most to least suitable. For each worker assign a match_score (0–100).
Consider:
1. Specialization match with required skills (most important)
2. AI Overall Rating score
3. Years of experience
4. Listed credentials

Respond ONLY with valid JSON, no markdown:
{{
  "ranked_workers": [
    {{
      "worker_id": "<id>",
      "match_score": <0-100 float>,
      "match_reasoning": "<one clear sentence why this rank>"
    }}
  ]
}}

List ALL {len(workers)} workers in ranked order."""

    result = chat_json(prompt, max_tokens=2000)
    ranked_ids = {r["worker_id"]: r for r in result.get("ranked_workers", [])}

    # Merge AI ranking with full worker details
    output = []
    for w in enriched:
        rank_info = ranked_ids.get(w["worker_id"], {
            "match_score": w["ai_overall_score"] * 10,
            "match_reasoning": "Ranked by AI rating score."
        })
        output.append({
            "worker_id": w["worker_id"],
            "worker_name": w["worker_name"],
            "worker_email": w["worker_email"],
            "specialization": w["specialization"],
            "years_of_experience": w["years_of_experience"],
            "rating_score": w["ai_overall_score"],
            "match_score": float(rank_info.get("match_score", 0)),
            "match_reasoning": rank_info.get("match_reasoning", ""),
        })

    output.sort(key=lambda x: x["match_score"], reverse=True)
    return output
