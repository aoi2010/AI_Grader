"""AI Router - Exposes non-secret AI runtime info for observability."""

from fastapi import APIRouter

from backend.config import settings
from backend.gemini_service import gemini_service

router = APIRouter()


@router.get("/info")
async def get_ai_info():
    """Return non-secret information about the configured AI + last used model/key."""
    last_key_1_based = None
    if gemini_service.last_key_index_used is not None:
        last_key_1_based = gemini_service.last_key_index_used + 1

    return {
        "configured_model": settings.GEMINI_MODEL,
        "fallback_models": gemini_service.fallback_models,
        "api_keys_configured": len(gemini_service.api_keys),
        "last_model_used": gemini_service.last_model_used,
        "last_api_key_index": last_key_1_based,
    }
