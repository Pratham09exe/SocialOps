from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import base as _db_base  # noqa: F401 - Ensures all SQLAlchemy mappers are loaded
from app.core.config import settings
from app.api.v1.router import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="SocialOps Enterprise API — Agency Operations & Multi-tier Governance",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc"
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register v1 routes
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "service": "SocialOps Enterprise Backend",
        "docs": f"{settings.API_V1_STR}/docs",
        "status": "online"
    }
