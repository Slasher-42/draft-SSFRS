import json
import re
import time
from groq import Groq, RateLimitError
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
    """Call Groq and parse the response as JSON, retrying on rate limits or bad JSON."""
    last_error: Exception = RuntimeError("chat_json: no attempts made")
    for attempt in range(3):
        try:
            raw = chat(prompt, temperature, max_tokens)
            cleaned = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
            cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.MULTILINE)
            return json.loads(cleaned.strip())
        except RateLimitError as e:
            last_error = e
            wait = 2 ** attempt + 1   # 2s, 3s, 5s
            print(f"[Groq] Rate limited (attempt {attempt + 1}/3) — retrying in {wait}s: {e}")
            time.sleep(wait)
        except json.JSONDecodeError as e:
            last_error = e
            print(f"[Groq] JSON parse error (attempt {attempt + 1}/3): {e}")
            if attempt < 2:
                time.sleep(1)
        except Exception as e:
            last_error = e
            print(f"[Groq] Unexpected error (attempt {attempt + 1}/3): {e}")
            if attempt < 2:
                time.sleep(2 ** attempt)
    raise last_error
