def rating_to_score(value: float | None, default: float = 70.0) -> float:
    if value is None:
        return default
    return max(0.0, min(100.0, value / 5 * 100))


def inverse_distance_score(distance_km: float, max_distance_km: float) -> float:
    if max_distance_km <= 0:
        return 0.0
    ratio = min(distance_km / max_distance_km, 1.0)
    return round((1 - ratio) * 100, 2)


def eta_score(eta_minutes: int) -> float:
    return max(20.0, min(100.0, 100 - eta_minutes * 3))


def price_alignment_score(
    budget_min: int,
    budget_max: int,
    quote_min: int | None,
    quote_max: int | None,
) -> float:
    if quote_min is None and quote_max is None:
        return 60.0

    budget_mid = (budget_min + budget_max) / 2
    quote_mid = ((quote_min or budget_mid) + (quote_max or budget_mid)) / 2
    if budget_mid <= 0:
        return 60.0

    diff_ratio = min(abs(quote_mid - budget_mid) / budget_mid, 1.0)
    return round((1 - diff_ratio) * 100, 2)


def weighted_score(parts: dict[str, float], weights: dict[str, float]) -> float:
    return round(sum(parts[key] * weights[key] for key in parts), 2)
