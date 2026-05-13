from app.rules.risk_rules import BLOCKED_AMOUNT_FEN, HIGH_RISK_AMOUNT_FEN
from app.schemas.risk import PrepayRiskCheckRequest


def evaluate_prepay_risk(payload: PrepayRiskCheckRequest) -> tuple[bool, str, list[str], str | None]:
    reasons: list[str] = []

    if payload.order.buyer_user_id == payload.order.seller_user_id:
        reasons.append("same_buyer_and_seller")
    if payload.order.amount_fen <= 0:
        reasons.append("invalid_amount")
    if payload.order.amount_fen >= BLOCKED_AMOUNT_FEN:
        reasons.append("amount_over_block_limit")
    elif payload.order.amount_fen >= HIGH_RISK_AMOUNT_FEN:
        reasons.append("amount_requires_manual_review")

    if payload.payment.scene == "deposit" and payload.order.amount_fen >= 200000:
        reasons.append("deposit_amount_too_high")
    if payload.order.service_type in {"hospital", "shipping_assist"}:
        reasons.append("sensitive_service_type")

    if {"same_buyer_and_seller", "invalid_amount", "amount_over_block_limit"} & set(reasons):
        return False, "high", reasons, "当前订单存在明显异常，已阻止发起支付。"
    if reasons:
        return True, "medium", reasons, "订单已标记为中风险，建议在支付前补充核验。"
    return True, "low", [], None
