from math import asin, cos, radians, sin, sqrt


def haversine_distance_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    radius_km = 6371.0
    delta_lat = radians(lat2 - lat1)
    delta_lng = radians(lng2 - lng1)
    lat1_rad = radians(lat1)
    lat2_rad = radians(lat2)
    a = sin(delta_lat / 2) ** 2 + cos(lat1_rad) * cos(lat2_rad) * sin(delta_lng / 2) ** 2
    return round(2 * radius_km * asin(sqrt(a)), 2)


def approximate_distance_km(
    pickup_lat: float | None,
    pickup_lng: float | None,
    provider_lat: float | None,
    provider_lng: float | None,
    same_district: bool,
) -> float:
    if None not in {pickup_lat, pickup_lng, provider_lat, provider_lng}:
        return haversine_distance_km(
            float(pickup_lat),
            float(pickup_lng),
            float(provider_lat),
            float(provider_lng),
        )
    return 2.5 if same_district else 8.0
