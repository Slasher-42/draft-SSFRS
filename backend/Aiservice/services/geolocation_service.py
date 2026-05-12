import json
import httpx
from models import GeolocationResult
from sqlalchemy.orm import Session


def reverse_geocode(lat: float, lon: float) -> str:
    """Convert GPS coordinates to a human-readable address using Nominatim."""
    try:
        url = "https://nominatim.openstreetmap.org/reverse"
        params = {"lat": lat, "lon": lon, "format": "json"}
        headers = {"User-Agent": "SSFRS-AI-Service/1.0"}
        response = httpx.get(url, params=params, headers=headers, timeout=10)
        data = response.json()
        return data.get("display_name", f"{lat}, {lon}")
    except Exception:
        return f"{lat:.4f}, {lon:.4f}"


def verify_geolocation(data: dict, db: Session) -> GeolocationResult:
    """
    5-step geolocation verification:
    1. Coordinates received (already extracted by Service 2)
    2. Reverse geocode to address
    3. Location relevance check
    4. Timestamp validation
    5. Compile report
    """
    lat = data["latitude"]
    lon = data["longitude"]
    claim_id = data["claim_id"]
    flags = []

    # Step 2 — Reverse geocode
    address = reverse_geocode(lat, lon)

    # Step 3 — Location relevance check
    project_location = data.get("project_location", "").lower()
    location_status = "VERIFIED"
    if project_location:
        address_lower = address.lower()
        keywords = [k.strip() for k in project_location.split(",")]
        if not any(k in address_lower for k in keywords if k):
            location_status = "MISMATCH"
            flags.append(
                f"Photo location ({address}) does not match expected project area ({data.get('project_location')})."
            )
    else:
        location_status = "VERIFIED"
        flags.append("No project location on record — location cross-reference skipped.")

    # Step 4 — Timestamp validation
    timeline_status = "UNKNOWN"
    timestamp = data.get("photo_timestamp")
    if not timestamp:
        flags.append("Photo timestamp could not be extracted from EXIF data.")
    else:
        start = data.get("project_start_date")
        end = data.get("project_end_date")
        if start and end:
            if start <= timestamp <= end:
                timeline_status = "CONSISTENT"
            else:
                timeline_status = "INCONSISTENT"
                flags.append(
                    f"Photo timestamp ({timestamp}) falls outside the project period "
                    f"({start} to {end})."
                )
        else:
            timeline_status = "UNKNOWN"

    # Persist
    existing = db.query(GeolocationResult).filter(GeolocationResult.claim_id == claim_id).first()
    if existing:
        existing.latitude = lat
        existing.longitude = lon
        existing.address = address
        existing.photo_timestamp = timestamp
        existing.location_status = location_status
        existing.timeline_status = timeline_status
        existing.flags = json.dumps(flags)
        db.commit()
        db.refresh(existing)
        return existing

    result = GeolocationResult(
        claim_id=claim_id,
        latitude=lat,
        longitude=lon,
        address=address,
        photo_timestamp=timestamp,
        location_status=location_status,
        timeline_status=timeline_status,
        flags=json.dumps(flags),
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return result


def build_summary(geo: GeolocationResult) -> str:
    flags = json.loads(geo.flags or "[]")
    flag_text = " ".join(flags) if flags else "No flags raised."
    return (
        f"GPS coordinates: ({geo.latitude:.4f}, {geo.longitude:.4f}). "
        f"Address: {geo.address}. "
        f"Location status: {geo.location_status}. "
        f"Timeline status: {geo.timeline_status}. "
        f"{flag_text}"
    )
