import json
import re
from groq import Groq
from config import settings

_client = Groq(api_key=settings.groq_api_key)


def chat(prompt: str, temperature: float = 0.4, max_tokens: int = 1500) -> str:
    response = _client.chat.completions.create(
        model=settings.groq_model,
        messages=[{"role": "user", "content": prompt}],
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content.strip()


def chat_json(prompt: str, temperature: float = 0.4, max_tokens: int = 1500) -> dict:
    """Call Groq and parse the response as JSON, stripping markdown fences if present."""
    raw = chat(prompt, temperature, max_tokens)
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
    cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.MULTILINE)
    return json.loads(cleaned.strip())
