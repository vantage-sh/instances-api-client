"""Error classes for the Instances API Client."""

from __future__ import annotations


class APIError(Exception):
    """Base error class for all API errors."""

    pass


class UnknownHTTPError(APIError):
    """Raised when an unknown HTTP error occurs."""

    def __init__(self, status: int, status_text: str) -> None:
        self.status = status
        self.status_text = status_text
        super().__init__(f"Unknown HTTP error: {status} {status_text}")


class InvalidRequestError(APIError):
    """Raised when the request is invalid."""

    pass


class UnauthorizedError(APIError):
    """Raised when the request is unauthorized."""

    pass


class InternalServerError(APIError):
    """Raised when an internal server error occurs."""

    pass


class RateLimitExceededError(APIError):
    """Raised when the rate limit is exceeded."""

    pass


class NotFoundError(APIError):
    """Raised when a resource is not found."""

    pass


ERROR_MAP: dict[str, type[APIError]] = {
    "INVALID_REQUEST": InvalidRequestError,
    "UNAUTHORIZED": UnauthorizedError,
    "INTERNAL_SERVER_ERROR": InternalServerError,
    "RATE_LIMIT_EXCEEDED": RateLimitExceededError,
    "NOT_FOUND": NotFoundError,
}
