import json
import urllib.request
import urllib.error
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import groq_client as _gc
from config import settings

router = APIRouter(prefix="/api/ai/chat", tags=["Chat"])


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    user_role: str  # "WORKER" | "PROVIDER"
    user_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str


def _get_json(url: str, internal_key: str) -> list:
    """Make a GET request with the internal key header, return parsed JSON or empty list."""
    req = urllib.request.Request(
        url,
        headers={"X-Internal-Key": internal_key},
    )
    with urllib.request.urlopen(req, timeout=4) as resp:
        return json.loads(resp.read().decode())


def _fetch_available_projects() -> str:
    """Fetch available/open projects from the Execution Service."""
    try:
        url = f"{settings.service2_base_url}/api/projects/available-for-ai"
        projects = _get_json(url, settings.internal_api_key)
        if not projects:
            return "There are currently no open projects in the system."
        lines = ["Current open projects in the system:"]
        for p in projects[:20]:
            lines.append(
                f"- [{p.get('category', 'General')}] {p.get('title', 'Untitled')} "
                f"| Budget: {p.get('budget', '?')} | Location: {p.get('constructionLocation') or 'Not specified'}"
            )
        return "\n".join(lines)
    except Exception:
        pass
    return "Project data is temporarily unavailable."


def _fetch_available_workers() -> str:
    """Fetch rated workers from the Execution Service."""
    try:
        url = f"{settings.service2_base_url}/api/workers/available-for-ai"
        workers = _get_json(url, settings.internal_api_key)
        if not workers:
            return "There are currently no registered workers in the system."
        lines = ["Workers currently registered in the system:"]
        for w in workers[:20]:
            lines.append(
                f"- {w.get('fullName', 'Unknown')} | Specialization: {w.get('specialization') or 'General'} "
                f"| AI Score: {w.get('overallScore', 'Not rated')} | Status: {w.get('status', 'Active')}"
            )
        return "\n".join(lines)
    except Exception:
        pass
    return "Worker data is temporarily unavailable."


def _build_system_prompt(user_role: str) -> str:
    if user_role == "WORKER":
        project_context = _fetch_available_projects()
        return (
            "You are the SSFRS (Service Failure Refund System) AI Assistant, available exclusively to workers. "
            "You are helpful, knowledgeable, and friendly. You can answer questions about the platform, "
            "about the construction and service industry, career advice, and any general topic the worker asks about.\n\n"
            "SYSTEM CONTEXT — LIVE DATA:\n"
            f"{project_context}\n\n"
            "When asked about projects, use the live data above. "
            "When asked about general knowledge, answer freely and helpfully. "
            "Keep responses concise and practical."
        )
    else:  # PROVIDER
        worker_context = _fetch_available_workers()
        return (
            "You are the SSFRS (Service Failure Refund System) AI Assistant, available exclusively to project providers. "
            "You are helpful, knowledgeable, and friendly. You can answer questions about the platform, "
            "about hiring and managing workers, project management, and any general topic the provider asks about.\n\n"
            "SYSTEM CONTEXT — LIVE DATA:\n"
            f"{worker_context}\n\n"
            "When asked about workers or fields of expertise, use the live data above. "
            "When asked about general knowledge, answer freely and helpfully. "
            "Keep responses concise and practical."
        )


@router.post("", response_model=ChatResponse)
def chat(request: ChatRequest):
    if not request.messages:
        raise HTTPException(status_code=400, detail="messages cannot be empty")

    system_prompt = _build_system_prompt(request.user_role)

    groq_messages = [{"role": "system", "content": system_prompt}]
    for m in request.messages[-20:]:  # keep last 20 turns to stay within token limits
        groq_messages.append({"role": m.role, "content": m.content})

    try:
        completion = _gc._client.chat.completions.create(
            model=settings.groq_model,
            messages=groq_messages,
            max_tokens=1024,
            temperature=0.7,
        )
        reply = completion.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

    return ChatResponse(response=reply)
