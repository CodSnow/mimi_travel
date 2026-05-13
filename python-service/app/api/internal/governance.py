from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, verify_internal_token
from app.repositories.governance_repo import GovernanceRepository
from app.schemas.governance import (
    AdminAuditLogResponse,
    AdminDashboardResponse,
    ComplaintCreateRequest,
    ComplaintHandleRequest,
    ComplaintListResponse,
    ComplaintResponse,
    DisputeCreateRequest,
    DisputeHandleRequest,
    DisputeListResponse,
    DisputeResponse,
    PolicyFavoriteCreateRequest,
    PolicyFavoriteDeleteRequest,
    PolicyFavoriteListResponse,
    PolicyFavoriteResponse,
    ReviewProviderApplicationRequest,
    ReviewProviderApplicationResponse,
)
from app.schemas.marketplace import OrderResponse
from app.schemas.payments import RefundResponse
from app.schemas.profile import ProviderApplicationResponse
from app.services.governance.governance_service import GovernanceService, GovernanceServiceError


router = APIRouter(dependencies=[Depends(verify_internal_token)])


def _service(db: Session) -> GovernanceService:
    return GovernanceService(GovernanceRepository(db))


def _raise_http(error: GovernanceServiceError) -> None:
    raise HTTPException(status_code=error.status_code, detail=str(error))


@router.get("/admin/dashboard", response_model=AdminDashboardResponse)
def admin_dashboard(admin_user_id: UUID, db: Session = Depends(get_db)) -> AdminDashboardResponse:
    try:
        service = _service(db)
        service.require_admin(admin_user_id)
        repo = service.repo
        return AdminDashboardResponse(
            provider_applications=[ProviderApplicationResponse.model_validate(item) for item in repo.list_provider_applications()],
            complaints=[ComplaintResponse.model_validate(item) for item in repo.list_complaints()],
            disputes=[DisputeResponse.model_validate(item) for item in repo.list_disputes()],
            orders=[OrderResponse.model_validate(item) for item in repo.list_orders()],
            refunds=[RefundResponse.model_validate(item) for item in repo.list_refunds()],
            audit_logs=[AdminAuditLogResponse.model_validate(item) for item in repo.list_audit_logs()],
        )
    except GovernanceServiceError as error:
        _raise_http(error)


@router.get("/provider-applications", response_model=list[ProviderApplicationResponse])
def list_provider_applications(
    admin_user_id: UUID,
    status: str | None = None,
    db: Session = Depends(get_db),
) -> list[ProviderApplicationResponse]:
    try:
        items = _service(db).list_provider_applications(admin_user_id, status)
        return [ProviderApplicationResponse.model_validate(item) for item in items]
    except GovernanceServiceError as error:
        _raise_http(error)


@router.post("/provider-applications/{application_id}/review", response_model=ReviewProviderApplicationResponse)
def review_provider_application(
    application_id: UUID,
    payload: ReviewProviderApplicationRequest,
    db: Session = Depends(get_db),
) -> ReviewProviderApplicationResponse:
    try:
        result = _service(db).review_provider_application(application_id, **payload.model_dump())
        db.commit()
        return ReviewProviderApplicationResponse(
            application=ProviderApplicationResponse.model_validate(result.application)
        )
    except GovernanceServiceError as error:
        db.rollback()
        _raise_http(error)


@router.post("/complaints", response_model=ComplaintResponse)
def create_complaint(payload: ComplaintCreateRequest, db: Session = Depends(get_db)) -> ComplaintResponse:
    try:
        complaint = _service(db).create_complaint(**payload.model_dump())
        db.commit()
        return ComplaintResponse.model_validate(complaint)
    except GovernanceServiceError as error:
        db.rollback()
        _raise_http(error)


@router.get("/complaints", response_model=ComplaintListResponse)
def list_complaints(status: str | None = None, db: Session = Depends(get_db)) -> ComplaintListResponse:
    items = GovernanceRepository(db).list_complaints(status)
    return ComplaintListResponse(items=[ComplaintResponse.model_validate(item) for item in items])


@router.post("/complaints/{complaint_id}/handle", response_model=ComplaintResponse)
def handle_complaint(
    complaint_id: UUID,
    payload: ComplaintHandleRequest,
    db: Session = Depends(get_db),
) -> ComplaintResponse:
    try:
        complaint = _service(db).handle_complaint(complaint_id, **payload.model_dump())
        db.commit()
        return ComplaintResponse.model_validate(complaint)
    except GovernanceServiceError as error:
        db.rollback()
        _raise_http(error)


@router.post("/disputes", response_model=DisputeResponse)
def create_dispute(payload: DisputeCreateRequest, db: Session = Depends(get_db)) -> DisputeResponse:
    try:
        dispute = _service(db).create_dispute(**payload.model_dump())
        db.commit()
        return DisputeResponse.model_validate(dispute)
    except GovernanceServiceError as error:
        db.rollback()
        _raise_http(error)


@router.get("/disputes", response_model=DisputeListResponse)
def list_disputes(status: str | None = None, db: Session = Depends(get_db)) -> DisputeListResponse:
    items = GovernanceRepository(db).list_disputes(status)
    return DisputeListResponse(items=[DisputeResponse.model_validate(item) for item in items])


@router.post("/disputes/{dispute_id}/handle", response_model=DisputeResponse)
def handle_dispute(
    dispute_id: UUID,
    payload: DisputeHandleRequest,
    db: Session = Depends(get_db),
) -> DisputeResponse:
    try:
        dispute = _service(db).handle_dispute(dispute_id, **payload.model_dump())
        db.commit()
        return DisputeResponse.model_validate(dispute)
    except GovernanceServiceError as error:
        db.rollback()
        _raise_http(error)


@router.get("/policy-favorites", response_model=PolicyFavoriteListResponse)
def list_policy_favorites(user_id: UUID, db: Session = Depends(get_db)) -> PolicyFavoriteListResponse:
    items = GovernanceRepository(db).list_policy_favorites(user_id)
    return PolicyFavoriteListResponse(items=[PolicyFavoriteResponse.model_validate(item) for item in items])


@router.post("/policy-favorites", response_model=PolicyFavoriteResponse)
def create_policy_favorite(
    payload: PolicyFavoriteCreateRequest,
    db: Session = Depends(get_db),
) -> PolicyFavoriteResponse:
    favorite = GovernanceRepository(db).upsert_policy_favorite(**payload.model_dump())
    db.commit()
    return PolicyFavoriteResponse.model_validate(favorite)


@router.delete("/policy-favorites/{policy_id}")
def delete_policy_favorite(
    policy_id: str,
    payload: PolicyFavoriteDeleteRequest,
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    deleted = GovernanceRepository(db).delete_policy_favorite(payload.user_id, policy_id)
    db.commit()
    return {"ok": True, "deleted": deleted}
