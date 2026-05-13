import hashlib
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.models.session import SessionRecord
from app.models.user import User


class UserRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def upsert_by_phone(self, phone: str, nickname: str, avatar: str | None = None) -> User:
        stmt = (
            insert(User)
            .values(phone=phone, nickname=nickname, avatar=avatar)
            .on_conflict_do_update(
                index_elements=[User.phone],
                set_={
                    "nickname": nickname,
                    "avatar": avatar,
                    "updated_at": func.now(),
                },
            )
            .returning(User)
        )
        return self.db.scalars(stmt).one()

    def create_session(
        self,
        user_id: uuid.UUID,
        token_hash: str | None = None,
        expires_at: datetime | None = None,
    ) -> SessionRecord:
        if token_hash is None:
            token_hash = hashlib.sha256(uuid.uuid4().hex.encode("utf-8")).hexdigest()
        if expires_at is None:
            expires_at = datetime.now(UTC) + timedelta(days=14)

        session = SessionRecord(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
        self.db.add(session)
        self.db.flush()
        self.db.refresh(session)
        return session

    def get_by_session_token(self, token_hash: str) -> User | None:
        now = datetime.now(UTC)
        stmt = (
            select(User)
            .join(SessionRecord, SessionRecord.user_id == User.id)
            .where(
                SessionRecord.token_hash == token_hash,
                SessionRecord.revoked_at.is_(None),
                SessionRecord.expires_at > now,
            )
        )
        return self.db.execute(stmt).scalar_one_or_none()
