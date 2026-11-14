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

class SecurityHeadersMiddleware:
    """Pure ASGI middleware to append standard security headers to every HTTP response."""
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))
                headers.append((b"x-content-type-options", b"nosniff"))
                headers.append((b"x-frame-options", b"DENY"))
                headers.append((b"referrer-policy", b"strict-origin-when-cross-origin"))
                headers.append((b"permissions-policy", b"camera=(), microphone=(), geolocation=()"))
                headers.append((
                    b"content-security-policy",
                    b"default-src 'self'; "
                    b"script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                    b"style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                    b"img-src 'self' data: https: https://fastapi.tiangolo.com; "
                    b"font-src 'self' data: https://cdn.jsdelivr.net; "
                    b"connect-src 'self' http://localhost:5173 http://localhost:8000 http://127.0.0.1:8000; "
                    b"frame-ancestors 'none'; "
                    b"object-src 'none'; "
                    b"base-uri 'self';"
                ))
                message["headers"] = headers
            await send(message)

        await self.app(scope, receive, send_wrapper)

# Register pure ASGI Security Headers Middleware
app.add_middleware(SecurityHeadersMiddleware)

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
