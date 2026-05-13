from fastapi import FastAPI
from sqlalchemy.exc import SQLAlchemyError

from app.api.router import api_router
from app.config.logging import configure_logging
from app.config.settings import settings
from app.db.seed import seed_sample_providers
from app.db.session import SessionLocal


configure_logging()
app = FastAPI(title=settings.app_name)
app.include_router(api_router)


@app.on_event("startup")
def startup_seed() -> None:
    with SessionLocal() as db:
        try:
            seed_sample_providers(db)
            db.commit()
        except SQLAlchemyError:
            db.rollback()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
