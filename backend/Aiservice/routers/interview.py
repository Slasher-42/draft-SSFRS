from fastapi import APIRouter
from pydantic import BaseModel
from groq_client import chat_json

router = APIRouter(prefix="/api/ai/interview", tags=["Interview"])


class RefineRequest(BaseModel):
    raw_transcript: str
    question: str


class RefineResponse(BaseModel):
    refined_transcript: str


@router.post("/refine-transcript", response_model=RefineResponse)
def refine_transcript(request: RefineRequest):
    if not request.raw_transcript.strip():
        return RefineResponse(refined_transcript="")

    prompt = f"""You are a transcript correction assistant for an interview platform.
A worker answered a question verbally. The speech-to-text captured their response but may contain mispronounced words, incomplete words, or unclear phrases due to accent or pronunciation.

INTERVIEW QUESTION: {request.question}

RAW TRANSCRIPT: {request.raw_transcript}

Your task:
1. Fix mispronounced or unclear words based on the context of the question
2. Fill in obviously missing or cut-off words
3. Keep the worker's original meaning and speaking style — do NOT rephrase, improve, or add new ideas
4. Remove only excessive filler words (um, uh) — keep the rest natural

Respond ONLY with valid JSON, no markdown:
{{"refined_transcript": "<corrected transcript here>"}}"""

    try:
        result = chat_json(prompt, temperature=0.2, max_tokens=600)
        refined = result.get("refined_transcript", "").strip()
        return RefineResponse(refined_transcript=refined or request.raw_transcript)
    except Exception:
        return RefineResponse(refined_transcript=request.raw_transcript)
