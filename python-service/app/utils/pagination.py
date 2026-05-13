from typing import TypeVar

from app.config.settings import settings


T = TypeVar("T")


def normalize_page(page: int | None) -> int:
    return max(page or 1, 1)


def normalize_page_size(page_size: int | None) -> int:
    raw_value = page_size or settings.default_page_size
    return max(1, min(raw_value, settings.max_page_size))


def paginate_items(items: list[T], page: int | None, page_size: int | None) -> list[T]:
    normalized_page = normalize_page(page)
    normalized_page_size = normalize_page_size(page_size)
    start = (normalized_page - 1) * normalized_page_size
    end = start + normalized_page_size
    return items[start:end]
