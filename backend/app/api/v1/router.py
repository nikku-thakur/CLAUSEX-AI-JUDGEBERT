from fastapi import APIRouter
from app.api.v1.endpoints import health, analyze, documents, simplify

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(analyze.router, tags=["Analyzer"])
api_router.include_router(simplify.router, tags=["Simplification and Translation"])
api_router.include_router(documents.router, prefix="/documents", tags=["Documents"])
