from collections.abc import Generator

from sqlalchemy.orm import Session

from app.config.security import verify_internal_token
from app.db.session import SessionLocal


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


__all__ = ["get_db", "verify_internal_token"]
