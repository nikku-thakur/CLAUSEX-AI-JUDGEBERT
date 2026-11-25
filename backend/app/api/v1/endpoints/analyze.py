from fastapi import APIRouter, HTTPException, status
from app.models.schemas import AnalyzePayload, AnalysisResult
from app.core.analyzer import analyze_clause_pair

router = APIRouter()

@router.post("/analyze", response_model=AnalysisResult)
async def analyze_clause(payload: AnalyzePayload):
    # Additional validation
    if not payload.originalText.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Original legal clause must not be empty or whitespace."
        )
    if not payload.simplifiedText.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Simplified legal clause must not be empty or whitespace."
        )

    try:
        result = analyze_clause_pair(payload)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing legal analysis pipeline: {str(e)}"
        )
