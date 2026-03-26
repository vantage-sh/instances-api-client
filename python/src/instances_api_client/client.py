"""Main API client for the Vantage Instances API."""

from __future__ import annotations

import json
import re
import urllib.error
import urllib.parse
import urllib.request
from collections.abc import Iterator
from typing import Any, Literal, overload

from instances_api_client.errors import (
    ERROR_MAP,
    InvalidRequestError,
    NotFoundError,
    UnknownHTTPError,
)
from instances_api_client.types import (
    AzureInstance,
    CacheInstance,
    ChinaService,
    EC2Instance,
    GCPInstance,
    GlobalService,
    OpenSearchInstance,
    RDSInstance,
    RedshiftInstance,
)
from instances_api_client.virtual_instances import (
    VirtualInstancesColumn,
    VirtualInstancesRequest,
)

BASE_URL = "https://instances-api.vantage.sh"
USER_AGENT = "instances-api-client-python"

GLOBAL_SERVICES_JSON_URLS: dict[GlobalService, str] = {
    "ec2": "https://instances.vantage.sh/instances.json",
    "rds": "https://instances.vantage.sh/rds/instances.json",
    "cache": "https://instances.vantage.sh/cache/instances.json",
    "redshift": "https://instances.vantage.sh/redshift/instances.json",
    "opensearch": "https://instances.vantage.sh/opensearch/instances.json",
    "azure": "https://instances.vantage.sh/azure/instances.json",
    "gcp": "https://instances.vantage.sh/gcp/instances.json",
}

CHINA_SERVICES_JSON_URLS: dict[ChinaService, str] = {
    "ec2": "https://instances.vantage.sh/instances-cn.json",
    "rds": "https://instances.vantage.sh/rds/instances-cn.json",
    "cache": "https://instances.vantage.sh/cache/instances-cn.json",
    "redshift": "https://instances.vantage.sh/redshift/instances-cn.json",
    "opensearch": "https://instances.vantage.sh/opensearch/instances-cn.json",
}

USES_SINGLE_PAGE_READ = {"cache", "redshift", "opensearch"}

RDS_PLATFORM_REMAPPING: dict[str, str] = {
    "14": "postgres",
    "2": "mysql",
    "10": "sqlServerExpress",
    "11": "sqlServerWeb",
    "12": "sqlServerStandard",
    "15": "sqlServerEnterprise",
    "21": "auroraPgMySQL",
    "211": "auroraIoOptimized",
    "18": "mariadb",
    "5": "oracleEnterprise",
}

NUMERIC_FIELDS = {
    "gpu",
    "memory_gib",
    "vcpu",
    "slices_per_node",
    "max_clients",
    "memory",
    "normalization_size_factor",
}


def _camel_to_snake(name: str) -> str:
    """Convert camelCase or PascalCase to snake_case."""
    # Handle acronyms like GPU, FPGA, ECU, ACU
    name = re.sub(r"([A-Z]+)([A-Z][a-z])", r"\1_\2", name)
    # Handle normal camelCase
    name = re.sub(r"([a-z\d])([A-Z])", r"\1_\2", name)
    # Handle kebab-case
    name = name.replace("-", "_")
    return name.lower()


def _remap_obj(obj: Any, service: str) -> Any:
    """Remap object keys and values to snake_case."""
    if obj is None or not isinstance(obj, dict):
        return obj

    result: dict[str, Any] = {}

    for key, value in obj.items():
        # Skip remapping pricing and regions
        if key in ("pricing", "regions"):
            result[key] = value
            continue

        # Convert key to snake_case
        new_key = _camel_to_snake(key)

        # Handle currentGeneration / current_generation
        if new_key == "current_generation":
            result[new_key] = value == "Yes" if isinstance(value, str) else bool(value)
            continue

        # Convert numeric string values
        if new_key in NUMERIC_FIELDS and isinstance(value, str):
            try:
                result[new_key] = float(value)
            except ValueError:
                result[new_key] = value
        else:
            result[new_key] = value

    # Service-specific remapping
    if service == "rds" and "pricing" in result:
        _remap_rds_platforms(result)
    elif service == "ec2" and "generation" in result:
        result["current_generation"] = result["generation"] == "current"
        del result["generation"]

    return result


def _remap_rds_platforms(obj: dict[str, Any]) -> None:
    """Remap RDS platform keys in pricing."""
    pricing = obj.get("pricing", {})
    if not isinstance(pricing, dict):
        return

    for region_pricing in pricing.values():
        if not isinstance(region_pricing, dict):
            continue
        for old_key, new_key in RDS_PLATFORM_REMAPPING.items():
            if old_key in region_pricing:
                region_pricing[new_key] = region_pricing.pop(old_key)


def _handle_error_response(response: urllib.request.Request, body: bytes) -> None:
    """Handle error response from the API."""
    status = getattr(response, "status", getattr(response, "code", 0))
    reason = getattr(response, "reason", "Unknown")

    try:
        data = json.loads(body.decode("utf-8"))
        error_code = data.get("code", "")
        error_class = ERROR_MAP.get(error_code)
        if error_class:
            raise error_class(data.get("error", str(body)))
    except json.JSONDecodeError:
        pass

    raise UnknownHTTPError(status, reason)


class APIV1Client:
    """Client for the Vantage Instances API."""

    def __init__(self, api_key: str) -> None:
        """Initialize the client.

        Args:
            api_key: The API key for authenticated requests.
        """
        self._api_key = api_key

    def _make_request(
        self,
        url: str,
        *,
        method: str = "GET",
        body: dict[str, Any] | None = None,
        authenticated: bool = False,
    ) -> Any:
        """Make an HTTP request."""
        headers = {
            "Content-Type": "application/json",
            "User-Agent": USER_AGENT,
        }
        if authenticated:
            headers["Authorization"] = f"Bearer {self._api_key}"

        data = json.dumps(body).encode("utf-8") if body else None
        request = urllib.request.Request(url, data=data, headers=headers, method=method)

        try:
            with urllib.request.urlopen(request) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            body_bytes = e.read()
            _handle_error_response(e, body_bytes)

    # Overloads for get_global_instance with proper return types
    @overload
    def get_global_instance(
        self, service: Literal["ec2"], instance_type: str
    ) -> EC2Instance: ...

    @overload
    def get_global_instance(
        self, service: Literal["rds"], instance_type: str
    ) -> RDSInstance: ...

    @overload
    def get_global_instance(
        self, service: Literal["cache"], instance_type: str
    ) -> CacheInstance: ...

    @overload
    def get_global_instance(
        self, service: Literal["redshift"], instance_type: str
    ) -> RedshiftInstance: ...

    @overload
    def get_global_instance(
        self, service: Literal["opensearch"], instance_type: str
    ) -> OpenSearchInstance: ...

    @overload
    def get_global_instance(
        self, service: Literal["azure"], instance_type: str
    ) -> AzureInstance: ...

    @overload
    def get_global_instance(
        self, service: Literal["gcp"], instance_type: str
    ) -> GCPInstance: ...

    def get_global_instance(
        self, service: GlobalService, instance_type: str
    ) -> (
        EC2Instance
        | RDSInstance
        | CacheInstance
        | RedshiftInstance
        | OpenSearchInstance
        | AzureInstance
        | GCPInstance
    ):
        """Get a single global instance.

        Args:
            service: The service to query.
            instance_type: The instance type identifier.

        Returns:
            The instance data.

        Raises:
            InvalidRequestError: If instance_type is empty.
            NotFoundError: If the instance is not found.
        """
        if not instance_type:
            raise InvalidRequestError("Instance type is required")

        encoded_type = urllib.parse.quote(instance_type, safe="")
        url = f"{BASE_URL}/api/v1/instances/{service}/{encoded_type}/global"
        data = self._make_request(url, authenticated=True)
        remapped = _remap_obj(data, service)

        return self._create_instance(service, remapped)

    # Overloads for get_china_instance
    @overload
    def get_china_instance(
        self, service: Literal["ec2"], instance_type: str
    ) -> EC2Instance: ...

    @overload
    def get_china_instance(
        self, service: Literal["rds"], instance_type: str
    ) -> RDSInstance: ...

    @overload
    def get_china_instance(
        self, service: Literal["cache"], instance_type: str
    ) -> CacheInstance: ...

    @overload
    def get_china_instance(
        self, service: Literal["redshift"], instance_type: str
    ) -> RedshiftInstance: ...

    @overload
    def get_china_instance(
        self, service: Literal["opensearch"], instance_type: str
    ) -> OpenSearchInstance: ...

    def get_china_instance(
        self, service: ChinaService, instance_type: str
    ) -> (
        EC2Instance
        | RDSInstance
        | CacheInstance
        | RedshiftInstance
        | OpenSearchInstance
    ):
        """Get a single China region instance.

        Args:
            service: The service to query.
            instance_type: The instance type identifier.

        Returns:
            The instance data.

        Raises:
            InvalidRequestError: If instance_type is empty.
            NotFoundError: If the instance is not found.
        """
        if not instance_type:
            raise InvalidRequestError("Instance type is required")

        encoded_type = urllib.parse.quote(instance_type, safe="")
        url = f"{BASE_URL}/api/v1/instances/{service}/{encoded_type}/china"
        data = self._make_request(url, authenticated=True)
        remapped = _remap_obj(data, service)

        return self._create_instance(service, remapped)

    # Overloads for get_global_instance_family
    @overload
    def get_global_instance_family(
        self, service: Literal["ec2"], family: str
    ) -> list[EC2Instance]: ...

    @overload
    def get_global_instance_family(
        self, service: Literal["rds"], family: str
    ) -> list[RDSInstance]: ...

    @overload
    def get_global_instance_family(
        self, service: Literal["cache"], family: str
    ) -> list[CacheInstance]: ...

    @overload
    def get_global_instance_family(
        self, service: Literal["redshift"], family: str
    ) -> list[RedshiftInstance]: ...

    @overload
    def get_global_instance_family(
        self, service: Literal["opensearch"], family: str
    ) -> list[OpenSearchInstance]: ...

    @overload
    def get_global_instance_family(
        self, service: Literal["azure"], family: str
    ) -> list[AzureInstance]: ...

    @overload
    def get_global_instance_family(
        self, service: Literal["gcp"], family: str
    ) -> list[GCPInstance]: ...

    def get_global_instance_family(
        self, service: GlobalService, family: str
    ) -> (
        list[EC2Instance]
        | list[RDSInstance]
        | list[CacheInstance]
        | list[RedshiftInstance]
        | list[OpenSearchInstance]
        | list[AzureInstance]
        | list[GCPInstance]
    ):
        """Get all instances in a global instance family.

        Args:
            service: The service to query.
            family: The instance family name.

        Returns:
            List of instances in the family.
        """
        encoded_family = urllib.parse.quote(family, safe="")
        url = f"{BASE_URL}/api/v1/instances/{service}/families/{encoded_family}/global"
        data = self._make_request(url, authenticated=False)

        return [
            self._create_instance(service, _remap_obj(item, service)) for item in data
        ]

    # Overloads for get_china_instance_family
    @overload
    def get_china_instance_family(
        self, service: Literal["ec2"], family: str
    ) -> list[EC2Instance]: ...

    @overload
    def get_china_instance_family(
        self, service: Literal["rds"], family: str
    ) -> list[RDSInstance]: ...

    @overload
    def get_china_instance_family(
        self, service: Literal["cache"], family: str
    ) -> list[CacheInstance]: ...

    @overload
    def get_china_instance_family(
        self, service: Literal["redshift"], family: str
    ) -> list[RedshiftInstance]: ...

    @overload
    def get_china_instance_family(
        self, service: Literal["opensearch"], family: str
    ) -> list[OpenSearchInstance]: ...

    def get_china_instance_family(
        self, service: ChinaService, family: str
    ) -> (
        list[EC2Instance]
        | list[RDSInstance]
        | list[CacheInstance]
        | list[RedshiftInstance]
        | list[OpenSearchInstance]
    ):
        """Get all instances in a China region instance family.

        Args:
            service: The service to query.
            family: The instance family name.

        Returns:
            List of instances in the family.
        """
        encoded_family = urllib.parse.quote(family, safe="")
        url = f"{BASE_URL}/api/v1/instances/{service}/families/{encoded_family}/china"
        data = self._make_request(url, authenticated=False)

        return [
            self._create_instance(service, _remap_obj(item, service)) for item in data
        ]

    # Overloads for get_all_global_instances
    @overload
    def get_all_global_instances(
        self, service: Literal["ec2"]
    ) -> Iterator[list[EC2Instance]]: ...

    @overload
    def get_all_global_instances(
        self, service: Literal["rds"]
    ) -> Iterator[list[RDSInstance]]: ...

    @overload
    def get_all_global_instances(
        self, service: Literal["cache"]
    ) -> Iterator[list[CacheInstance]]: ...

    @overload
    def get_all_global_instances(
        self, service: Literal["redshift"]
    ) -> Iterator[list[RedshiftInstance]]: ...

    @overload
    def get_all_global_instances(
        self, service: Literal["opensearch"]
    ) -> Iterator[list[OpenSearchInstance]]: ...

    @overload
    def get_all_global_instances(
        self, service: Literal["azure"]
    ) -> Iterator[list[AzureInstance]]: ...

    @overload
    def get_all_global_instances(
        self, service: Literal["gcp"]
    ) -> Iterator[list[GCPInstance]]: ...

    def get_all_global_instances(
        self, service: GlobalService
    ) -> Iterator[
        list[EC2Instance]
        | list[RDSInstance]
        | list[CacheInstance]
        | list[RedshiftInstance]
        | list[OpenSearchInstance]
        | list[AzureInstance]
        | list[GCPInstance]
    ]:
        """Get all global instances of a service.

        Yields pages of instances for memory efficiency.

        Args:
            service: The service to query.

        Yields:
            Pages of instance data.
        """
        url = GLOBAL_SERVICES_JSON_URLS[service]
        yield from self._stream_instances(url, service)

    # Overloads for get_all_china_instances
    @overload
    def get_all_china_instances(
        self, service: Literal["ec2"]
    ) -> Iterator[list[EC2Instance]]: ...

    @overload
    def get_all_china_instances(
        self, service: Literal["rds"]
    ) -> Iterator[list[RDSInstance]]: ...

    @overload
    def get_all_china_instances(
        self, service: Literal["cache"]
    ) -> Iterator[list[CacheInstance]]: ...

    @overload
    def get_all_china_instances(
        self, service: Literal["redshift"]
    ) -> Iterator[list[RedshiftInstance]]: ...

    @overload
    def get_all_china_instances(
        self, service: Literal["opensearch"]
    ) -> Iterator[list[OpenSearchInstance]]: ...

    def get_all_china_instances(
        self, service: ChinaService
    ) -> Iterator[
        list[EC2Instance]
        | list[RDSInstance]
        | list[CacheInstance]
        | list[RedshiftInstance]
        | list[OpenSearchInstance]
    ]:
        """Get all China region instances of a service.

        Yields pages of instances for memory efficiency.

        Args:
            service: The service to query.

        Yields:
            Pages of instance data.
        """
        url = CHINA_SERVICES_JSON_URLS[service]
        yield from self._stream_instances(url, service)

    def run_virtual_instances(
        self, body: VirtualInstancesRequest
    ) -> dict[str, list[VirtualInstancesColumn]]:
        """Run a virtual instances query.

        Args:
            body: The request body with service, region, columns, etc.

        Returns:
            Dictionary mapping instance type to list of columns.
        """
        url = f"{BASE_URL}/api/v1/virtual-instances"
        response = self._make_request(url, method="POST", body=body, authenticated=True)

        headers: list[str] = response["headers"]
        instances: dict[str, list[str]] = response["instances"]

        return {
            instance_type: [
                VirtualInstancesColumn(html=col, header_text=headers[i])
                for i, col in enumerate(columns)
            ]
            for instance_type, columns in instances.items()
        }

    def _stream_instances(self, url: str, service: str) -> Iterator[list[Any]]:
        """Stream instances from a URL."""
        if service in USES_SINGLE_PAGE_READ:
            yield from self._single_page_read(url, service)
        else:
            yield from self._json_stream(url, service)

    def _single_page_read(self, url: str, service: str) -> Iterator[list[Any]]:
        """Read all instances in a single request."""
        request = urllib.request.Request(
            url, headers={"User-Agent": USER_AGENT}, method="GET"
        )

        try:
            with urllib.request.urlopen(request) as response:
                data = json.loads(response.read().decode("utf-8"))
                yield [
                    self._create_instance(service, _remap_obj(item, service))
                    for item in data
                ]
        except urllib.error.HTTPError as e:
            if e.code == 404:
                raise NotFoundError("Instance group not found")
            raise UnknownHTTPError(e.code, e.reason)

    def _json_stream(self, url: str, service: str) -> Iterator[list[Any]]:
        """Stream JSON data in chunks."""
        request = urllib.request.Request(
            url, headers={"User-Agent": USER_AGENT}, method="GET"
        )

        try:
            with urllib.request.urlopen(request) as response:
                buffer = ""
                page: list[Any] = []
                delimiter = "\n },\n"

                while True:
                    chunk = response.read(8192)
                    if not chunk:
                        break

                    buffer += chunk.decode("utf-8")
                    end_index = buffer.rfind(delimiter)

                    if end_index != -1:
                        chunk_to_parse = buffer[: end_index + 3]
                        buffer = "[" + buffer[end_index + 4 :].lstrip()

                        try:
                            parsed = json.loads(chunk_to_parse + "]")
                            page.extend(parsed)

                            if len(page) >= 50:
                                yield [
                                    self._create_instance(
                                        service, _remap_obj(item, service)
                                    )
                                    for item in page
                                ]
                                page = []
                        except json.JSONDecodeError:
                            pass

                # Handle remaining buffer
                if buffer.strip():
                    try:
                        parsed = json.loads(buffer)
                        page.extend(parsed)
                    except json.JSONDecodeError:
                        pass

                if page:
                    yield [
                        self._create_instance(service, _remap_obj(item, service))
                        for item in page
                    ]

        except urllib.error.HTTPError as e:
            if e.code == 404:
                raise NotFoundError("Instance group not found")
            raise UnknownHTTPError(e.code, e.reason)

    def _create_instance(
        self, service: str, data: dict[str, Any]
    ) -> (
        EC2Instance
        | RDSInstance
        | CacheInstance
        | RedshiftInstance
        | OpenSearchInstance
        | AzureInstance
        | GCPInstance
    ):
        """Create an instance object from data."""
        match service:
            case "ec2":
                return EC2Instance.from_dict(data)
            case "rds":
                return RDSInstance.from_dict(data)
            case "cache":
                return CacheInstance.from_dict(data)
            case "redshift":
                return RedshiftInstance.from_dict(data)
            case "opensearch":
                return OpenSearchInstance.from_dict(data)
            case "azure":
                return AzureInstance.from_dict(data)
            case "gcp":
                return GCPInstance.from_dict(data)
            case _:
                raise ValueError(f"Unknown service: {service}")
