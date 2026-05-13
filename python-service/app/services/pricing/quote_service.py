from app.rules.pricing_rules import SERVICE_BASE_PRICE_FEN
from app.schemas.pricing import PricingBreakdownDTO, PricingQuoteRequest, PricingQuoteResponse
from app.services.pricing.surcharge_rules import collect_surcharges


class QuoteService:
    def quote(self, payload: PricingQuoteRequest) -> PricingQuoteResponse:
        base_amount = SERVICE_BASE_PRICE_FEN.get(payload.demand.service_type, 4500)
        breakdown = [
            PricingBreakdownDTO(
                code="base_service",
                label="基础服务费",
                amount_fen=base_amount,
            )
        ]
        breakdown.extend(collect_surcharges(payload.demand))

        if payload.demand.district in {"临安区", "淳安县", "桐庐县"}:
            breakdown.append(
                PricingBreakdownDTO(
                    code="outer_district",
                    label="远郊区域加价",
                    amount_fen=1000,
                )
            )

        if payload.provider and payload.provider.vehicle_id:
            breakdown.append(
                PricingBreakdownDTO(
                    code="assigned_provider",
                    label="指定服务者锁单",
                    amount_fen=600,
                )
            )

        amount_fen = sum(item.amount_fen for item in breakdown)
        budget_min = payload.demand.budget_min
        budget_max = payload.demand.budget_max

        if budget_max is not None and amount_fen > budget_max:
            amount_fen = max(budget_max, budget_min or 0)
        elif budget_min is not None and amount_fen < budget_min:
            amount_fen = budget_min

        return PricingQuoteResponse(
            request_id=payload.meta.request_id,
            amount_fen=amount_fen,
            breakdown=breakdown,
        )
