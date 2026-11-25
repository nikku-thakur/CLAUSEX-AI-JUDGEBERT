from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.api.v1.endpoints import health, analyze, documents, simplify

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Preload and warm up JudgeBERT inference on startup
    try:
        from ml.inference import JudgeBERTInference
        engine = JudgeBERTInference.get_instance()
        if engine.is_available():
            print(f"[STARTUP] JudgeBERT v2 warmed up successfully on {engine.device}.")
        else:
            print("[STARTUP] JudgeBERT running in rule-based fallback mode.")
    except Exception as e:
        print(f"[STARTUP] Warning preloading JudgeBERT: {e}")
    try:
        from ml.inference import MultilingualJudgeBERTInference
        multilingual_engine = MultilingualJudgeBERTInference.get_instance()
        if multilingual_engine.is_available():
            print(f"[STARTUP] Experimental Hindi/Spanish JudgeBERT v3 loaded on {multilingual_engine.device}.")
        else:
            print("[STARTUP] Hindi/Spanish JudgeBERT v3 is unavailable; those analysis requests return a configuration error.")
    except Exception as e:
        print(f"[STARTUP] Warning preloading multilingual JudgeBERT v3: {e}")
    yield

app = FastAPI(
    title="ClauseX AI — JUDGEBERT Inference Service",
    description="Explainable Multilingual Legal Meaning Preservation (LMP) Inference Engine",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount /api/v1 routes
app.include_router(api_router, prefix="/api/v1")

# Also mount at root for convenient direct access
app.include_router(health.router, tags=["Health"])
app.include_router(analyze.router, tags=["Analyzer"])
app.include_router(simplify.router, tags=["Simplification and Translation"])
app.include_router(documents.router, prefix="/documents", tags=["Documents"])



@app.get("/")
def root():
    return {
        "service": "ClauseX AI — JUDGEBERT Legal Meaning Preservation Engine",
        "status": "operational",
        "docs_url": "/docs",
        "api_v1_prefix": "/api/v1"
    }

