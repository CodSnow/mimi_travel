from fastapi import FastAPI

from app.api.router import api_router
from app.config.logging import configure_logging
from app.config.settings import settings


configure_logging()
app = FastAPI(title=settings.app_name)
app.include_router(api_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
