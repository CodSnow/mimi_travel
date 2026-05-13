from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, verify_internal_token
from app.repositories.user_repo import UserRepository
from app.schemas.identity import LoginRequest, LoginResponse, LoginSessionResponse, UserResponse
from app.services.identity.session_service import SessionService


router = APIRouter(dependencies=[Depends(verify_internal_token)])


@router.post("/login", response_model=LoginResponse)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
) -> LoginResponse:
    user_repo = UserRepository(db)
    user = user_repo.upsert_by_phone(
        phone=payload.phone,
        nickname=payload.nickname,
        avatar=payload.avatar,
    )
    token, session = SessionService(user_repo).create_login_session(user.id)
    db.commit()
    return LoginResponse(
        user=UserResponse.model_validate(user),
        session=LoginSessionResponse(token=token, expires_at=session.expires_at),
    )
