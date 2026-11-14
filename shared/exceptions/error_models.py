"""Error models for AuraMed microservices."""

from datetime import datetime, timezone
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    """Standard error response payload across all AuraMed APIs."""
    error_code: str = Field(
        ...,
        description="Standardized error code (e.g., VALIDATION_ERROR, NO_PROTOCOL_FOUND, GATEWAY_TIMEOUT)"
    )
    message: str = Field(
        ...,
        description="Human-readable technical summary of the error"
    )
    request_id: str = Field(
        ...,
        description="Unique request tracing identifier"
    )
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp in UTC when error occurred"
    )
    details: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Detailed field violations or diagnostic data"
    )
