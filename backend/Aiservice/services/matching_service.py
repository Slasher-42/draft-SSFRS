import json
from groq_client import chat_json
from models import WorkerRating
from sqlalchemy.orm import Session


def rank_candidates(project: dict, workers: list[dict], db: Session) -> list[dict]:
    if not workers:
        return []

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
Your task is to rank workers for a project based on field relevance and quality.

PROJECT:
- Title: {project.get('title')}
- Required Skills: {project.get('required_skills')}
- Scope of Work: {project.get('scope_of_work')}

AVAILABLE WORKERS:
{workers_text}

STRICT RULES:
1. ONLY include workers whose specialization directly matches the project field. A software/IT worker must NOT appear for a construction project. A construction worker must NOT appear for a software project. Apply this rule firmly across all industries.
2. For workers who DO match the field, rank them by: specialization fit (most important), AI Overall Rating, years of experience, credentials.
3. Assign match_score 0 to any worker whose specialization is unrelated to the project field — they will be excluded.

Respond ONLY with valid JSON, no markdown:
{{
  "ranked_workers": [
    {{
      "worker_id": "<id>",
      "match_score": <0-100 float>,
      "match_reasoning": "<one clear sentence explaining the match or exclusion>"
    }}
  ]
}}

Only list workers who are relevant to this project."""

    result = chat_json(prompt, max_tokens=2000)
    ranked_ids = {r["worker_id"]: r for r in result.get("ranked_workers", [])}

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
    return [w for w in output if w["match_score"] > 15]
