"""Vantage Instances API Client for Python."""

from instances_api_client.client import APIV1Client
from instances_api_client.errors import (
    APIError,
    InternalServerError,
    InvalidRequestError,
    NotFoundError,
    RateLimitExceededError,
    UnauthorizedError,
    UnknownHTTPError,
)
from instances_api_client.types import (
    AzureInstance,
    CacheInstance,
    ChinaAWSRegion,
    EC2Instance,
    GCPInstance,
    GlobalAWSRegion,
    GlobalAzureRegion,
    GlobalGCPRegion,
    OpenSearchInstance,
    RDSInstance,
    RedshiftInstance,
)
from instances_api_client.virtual_instances import (
    VirtualInstancesColumn,
    VirtualInstancesRequest,
)

__version__ = "1.0.0"

__all__ = [
    # Client
    "APIV1Client",
    # Errors
    "APIError",
    "UnknownHTTPError",
    "InvalidRequestError",
    "UnauthorizedError",
    "InternalServerError",
    "NotFoundError",
    "RateLimitExceededError",
    # Instance types
    "EC2Instance",
    "RDSInstance",
    "CacheInstance",
    "RedshiftInstance",
    "OpenSearchInstance",
    "AzureInstance",
    "GCPInstance",
    # Regions
    "GlobalAWSRegion",
    "ChinaAWSRegion",
    "GlobalAzureRegion",
    "GlobalGCPRegion",
    # Virtual instances
    "VirtualInstancesColumn",
    "VirtualInstancesRequest",
]
