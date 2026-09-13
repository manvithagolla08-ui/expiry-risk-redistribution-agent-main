from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routers import router as api_router
from app.api.analytics import router as analytics_router

app = FastAPI(title="SH-204 Expiry Risk & Redistribution Agent")

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")
app.include_router(analytics_router, prefix="/api/analytics")

@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "service": "expiry-risk-redistribution-agent"
    }
