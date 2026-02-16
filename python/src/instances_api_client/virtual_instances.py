"""Virtual instances types and classes."""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Literal, TypedDict

from instances_api_client.regions import (
    ChinaAWSRegion,
    GlobalAWSRegion,
    GlobalAzureRegion,
    GlobalGCPRegion,
)

# Cost duration options
CostDuration = Literal[
    "secondly",
    "minutely",
    "hourly",
    "daily",
    "weekly",
    "monthly",
    "annually",
]

# Pricing unit options
AWSPricingUnit = Literal["instance", "vcpu", "memory", "ecu"]
AzurePricingUnit = Literal["instance", "vcpu", "memory", "acu"]
GCPPricingUnit = Literal["instance", "vcpu", "memory"]

# EC2 allowed columns (API values)
EC2Column = Literal[
    "prettyName",
    "instanceType",
    "family",
    "memory",
    "ECU",
    "vCPU",
    "memoryPerVcpu",
    "GPU",
    "GPUModel",
    "GPUMemory",
    "computeCapability",
    "FPGA",
    "ECUPerVcpu",
    "physicalProcessor",
    "clockSpeedGhz",
    "intelAvx",
    "intelAvx2",
    "intelAvx512",
    "intelTurbo",
    "storage",
    "warmedUp",
    "trimSupport",
    "arch",
    "networkPerformance",
    "ebsBaselineBandwidth",
    "ebsBaselineThroughput",
    "ebsBaselineIops",
    "ebsMaxBandwidth",
    "ebsThroughput",
    "ebsIops",
    "ebsAsNvme",
    "maxIps",
    "maxEnis",
    "enhancedNetworking",
    "vpcOnly",
    "ipv6Support",
    "placementGroupSupport",
    "linuxVirtualizationTypes",
    "emr",
    "availabilityZones",
    "costOndemand",
    "costReserved",
    "costSpotMin",
    "costSpotMax",
    "costOndemandRhel",
    "costReservedRhel",
    "costSpotMinRhel",
    "costSpotMaxRhel",
    "costOndemandSles",
    "costReservedSles",
    "costSpotMinSles",
    "costSpotMaxSles",
    "costOndemandMswin",
    "costReservedMswin",
    "costSpotMinMswin",
    "costSpotMaxMswin",
    "costOndemandDedicated",
    "costReservedDedicated",
    "costOndemandMswinSQLWeb",
    "costReservedMswinSQLWeb",
    "costOndemandMswinSQL",
    "costReservedMswinSQL",
    "costOndemandMswinSQLEnterprise",
    "costReservedMswinSQLEnterprise",
    "costOndemandLinuxSQLWeb",
    "costReservedLinuxSQLWeb",
    "costOndemandLinuxSQL",
    "costReservedLinuxSQL",
    "costOndemandLinuxSQLEnterprise",
    "costReservedLinuxSQLEnterprise",
    "spotInterruptRate",
    "costEmr",
    "generation",
]

# RDS allowed columns (API values)
RDSColumn = Literal[
    "name",
    "apiName",
    "memory",
    "storage",
    "vCPU",
    "networkPerf",
    "architecture",
    "costOnDemandPostgres",
    "costReservedPostgres",
    "costOnDemandMySQL",
    "costReservedMySQL",
    "costOnDemandSQLServerExpress",
    "costReservedSQLServerExpress",
    "costOnDemandSQLServerWeb",
    "costReservedSQLServerWeb",
    "costOnDemandSQLServerStandard",
    "costReservedSQLServerStandard",
    "costOnDemandSQLServerEnterprise",
    "costReservedSQLServerEnterprise",
    "costOnDemandAurora",
    "costReservedAurora",
    "costOnDemandAuroraIO",
    "costOnDemandMariaDB",
    "costReservedMariaDB",
    "costOnDemandOracleEnterprise",
    "costReservedOracleEnterprise",
    "ebsBaselineBandwidth",
    "ebsBaselineThroughput",
    "ebsBaselineIops",
    "ebsMaxBandwidth",
    "ebsMaxThroughput",
    "ebsIops",
]

# Cache allowed columns (API values)
CacheColumn = Literal[
    "prettyName",
    "instanceType",
    "memory",
    "vCPU",
    "networkPerf",
    "costOnDemandRedis",
    "costReservedRedis",
    "costOnDemandMemcached",
    "costReservedMemcached",
    "costOnDemandValkey",
    "costReservedValkey",
    "generation",
]

# Redshift allowed columns (API values)
RedshiftColumn = Literal[
    "prettyName",
    "instanceType",
    "memory",
    "vCPU",
    "storage",
    "io",
    "ECU",
    "generation",
    "costOndemand",
    "costReserved",
]

# OpenSearch allowed columns (API values)
OpenSearchColumn = Literal[
    "prettyName",
    "instanceType",
    "memory",
    "vCPU",
    "storage",
    "ECU",
    "costOndemand",
    "costReserved",
    "generation",
]

# Azure allowed columns (API values)
AzureColumn = Literal[
    "prettyNameAzure",
    "instanceType",
    "memory",
    "vCPU",
    "memoryPerVcpu",
    "GPU",
    "size",
    "linuxOndemand",
    "linuxSavings",
    "linuxReserved",
    "linuxSpot",
    "windowsOndemand",
    "windowsSavings",
    "windowsReserved",
    "windowsSpot",
]

# GCP allowed columns (API values)
GCPColumn = Literal[
    "prettyName",
    "instanceType",
    "memory",
    "vCPU",
    "memoryPerVcpu",
    "GPU",
    "networkPerformance",
    "generation",
    "localSsd",
    "sharedCpu",
    "linuxOndemand",
    "linuxSpot",
    "windowsOndemand",
    "windowsSpot",
]

# AWS reserved terms (API values - do not convert to snake_case)
AWSReservedTerm = Literal[
    "yrTerm1Standard.noUpfront",
    "yrTerm1Standard.partialUpfront",
    "yrTerm1Standard.allUpfront",
    "yrTerm3Standard.noUpfront",
    "yrTerm3Standard.partialUpfront",
    "yrTerm3Standard.allUpfront",
    "yrTerm1Convertible.noUpfront",
    "yrTerm1Convertible.partialUpfront",
    "yrTerm1Convertible.allUpfront",
    "yrTerm3Convertible.noUpfront",
    "yrTerm3Convertible.partialUpfront",
    "yrTerm3Convertible.allUpfront",
]

# Azure reserved terms (API values - do not convert to snake_case)
AzureReservedTerm = Literal[
    "yrTerm1Standard.allUpfront",
    "yrTerm3Standard.allUpfront",
    "yrTerm1Standard.hybridbenefit",
    "yrTerm3Standard.hybridbenefit",
]


class ColumnSpec(TypedDict, total=False):
    """Column specification for virtual instances request."""

    key: str
    filter: str
    sortDesc: bool


class EC2VirtualInstancesRequest(TypedDict, total=False):
    """Virtual instances request for EC2."""

    service: Literal["ec2"]
    region: GlobalAWSRegion | ChinaAWSRegion
    columns: list[ColumnSpec]
    globalSearch: str
    costDuration: CostDuration
    pricingUnit: AWSPricingUnit
    currency: str
    reservedTerm: AWSReservedTerm


class RDSVirtualInstancesRequest(TypedDict, total=False):
    """Virtual instances request for RDS."""

    service: Literal["rds"]
    region: GlobalAWSRegion | ChinaAWSRegion
    columns: list[ColumnSpec]
    globalSearch: str
    costDuration: CostDuration
    pricingUnit: AWSPricingUnit
    currency: str
    reservedTerm: AWSReservedTerm


class CacheVirtualInstancesRequest(TypedDict, total=False):
    """Virtual instances request for Cache."""

    service: Literal["cache"]
    region: GlobalAWSRegion | ChinaAWSRegion
    columns: list[ColumnSpec]
    globalSearch: str
    costDuration: CostDuration
    pricingUnit: AWSPricingUnit
    currency: str
    reservedTerm: AWSReservedTerm


class RedshiftVirtualInstancesRequest(TypedDict, total=False):
    """Virtual instances request for Redshift."""

    service: Literal["redshift"]
    region: GlobalAWSRegion | ChinaAWSRegion
    columns: list[ColumnSpec]
    globalSearch: str
    costDuration: CostDuration
    pricingUnit: AWSPricingUnit
    currency: str
    reservedTerm: AWSReservedTerm


class OpenSearchVirtualInstancesRequest(TypedDict, total=False):
    """Virtual instances request for OpenSearch."""

    service: Literal["opensearch"]
    region: GlobalAWSRegion | ChinaAWSRegion
    columns: list[ColumnSpec]
    globalSearch: str
    costDuration: CostDuration
    pricingUnit: AWSPricingUnit
    currency: str
    reservedTerm: AWSReservedTerm


class AzureVirtualInstancesRequest(TypedDict, total=False):
    """Virtual instances request for Azure."""

    service: Literal["azure"]
    region: GlobalAzureRegion
    columns: list[ColumnSpec]
    globalSearch: str
    costDuration: CostDuration
    pricingUnit: AzurePricingUnit
    currency: str
    reservedTerm: AzureReservedTerm


class GCPVirtualInstancesRequest(TypedDict, total=False):
    """Virtual instances request for GCP."""

    service: Literal["gcp"]
    region: GlobalGCPRegion
    columns: list[ColumnSpec]
    globalSearch: str
    costDuration: CostDuration
    pricingUnit: GCPPricingUnit
    currency: str


# Union type for all virtual instances requests
VirtualInstancesRequest = (
    EC2VirtualInstancesRequest
    | RDSVirtualInstancesRequest
    | CacheVirtualInstancesRequest
    | RedshiftVirtualInstancesRequest
    | OpenSearchVirtualInstancesRequest
    | AzureVirtualInstancesRequest
    | GCPVirtualInstancesRequest
)


@dataclass
class VirtualInstancesColumn:
    """Represents a column in virtual instances result."""

    html: str
    header_text: str
    _text_cache: str | None = None

    _NUMBER_REGEX = re.compile(r"\d+(\.\d+)?")

    @property
    def text(self) -> str:
        """Get the plain text content (HTML stripped)."""
        if self._text_cache is None:
            # Simple HTML tag stripping without external dependencies
            self._text_cache = re.sub(r"<[^>]+>", "", self.html)
        return self._text_cache

    @property
    def number(self) -> float | int | None:
        """Get the first number found in the text, if any."""
        match = self._NUMBER_REGEX.search(self.text)
        if match:
            value = match.group(0)
            if "." in value:
                return float(value)
            return int(value)
        return None
