from fastapi import APIRouter, HTTPException, status

from app.models.schemas import SimplifyTranslatePayload, SimplifyTranslateResponse
from app.services.simplification import simplify_translate

router = APIRouter()


@router.post("/simplify", response_model=SimplifyTranslateResponse)
def simplify_clause(payload: SimplifyTranslatePayload):
    if not payload.originalText.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Original clause must not be empty.",
        )
    return simplify_translate(payload)
