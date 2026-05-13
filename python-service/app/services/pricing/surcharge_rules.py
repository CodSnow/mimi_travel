from app.rules.pricing_rules import CARE_SURCHARGE_FEN, RIDE_SURCHARGE_FEN
from app.schemas.pricing import PricingBreakdownDTO, PricingDemandDTO


def collect_surcharges(demand: PricingDemandDTO) -> list[PricingBreakdownDTO]:
    items: list[PricingBreakdownDTO] = []

    care = demand.care_requirements or {}
    for key, amount in CARE_SURCHARGE_FEN.items():
        if care.get(key):
            items.append(
                PricingBreakdownDTO(
                    code=key,
                    label=key.replace("_", " "),
                    amount_fen=amount,
                )
            )

    ride = demand.ride_requirements or {}
    for key, amount in RIDE_SURCHARGE_FEN.items():
        if ride.get(key):
            items.append(
                PricingBreakdownDTO(
                    code=key,
                    label=key.replace("_", " "),
                    amount_fen=amount,
                )
            )

    return items
