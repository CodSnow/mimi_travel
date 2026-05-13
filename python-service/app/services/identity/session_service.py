import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from app.models.session import SessionRecord
from app.repositories.user_repo import UserRepository


class SessionService:
    def __init__(self, user_repo: UserRepository) -> None:
        self.user_repo = user_repo

    @staticmethod
    def hash_token(token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

    def create_login_session(self, user_id: uuid.UUID) -> tuple[str, SessionRecord]:
        token = secrets.token_urlsafe(32)
        token_hash = self.hash_token(token)
        expires_at = datetime.now(timezone.utc) + timedelta(days=14)
        session = self.user_repo.create_session(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        return token, session
