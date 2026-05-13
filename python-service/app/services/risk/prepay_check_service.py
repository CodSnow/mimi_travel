from app.schemas.risk import PrepayRiskCheckRequest, PrepayRiskCheckResponse
from app.services.risk.fraud_rules import evaluate_prepay_risk


class PrepayCheckService:
    def check(self, payload: PrepayRiskCheckRequest) -> PrepayRiskCheckResponse:
        allowed, risk_level, reason_codes, human_message = evaluate_prepay_risk(payload)
        return PrepayRiskCheckResponse(
            request_id=payload.meta.request_id,
            allowed=allowed,
            risk_level=risk_level,
            reason_codes=reason_codes,
            human_message=human_message,
        )
