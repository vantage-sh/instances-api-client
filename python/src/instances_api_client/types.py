"""Type definitions for instance data structures."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal, TypedDict

from instances_api_client.regions import (
    ChinaAWSRegion,
    GlobalAWSRegion,
    GlobalAzureRegion,
    GlobalGCPRegion,
)

# Re-export region types
__all__ = [
    "GlobalAWSRegion",
    "ChinaAWSRegion",
    "GlobalAzureRegion",
    "GlobalGCPRegion",
    "EC2Instance",
    "RDSInstance",
    "CacheInstance",
    "RedshiftInstance",
    "OpenSearchInstance",
    "AzureInstance",
    "GCPInstance",
    "GlobalService",
    "ChinaService",
    "AWSReservedTerm",
    "AzureReservedTerm",
]

# Service types
GlobalService = Literal["ec2", "rds", "cache", "redshift", "opensearch", "azure", "gcp"]
ChinaService = Literal["ec2", "rds", "cache", "redshift", "opensearch"]

# Reserved terms (API values - do not convert to snake_case)
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

AzureReservedTerm = Literal[
    "yrTerm1Standard.allUpfront",
    "yrTerm3Standard.allUpfront",
    "yrTerm1Standard.hybridbenefit",
    "yrTerm3Standard.hybridbenefit",
]

# EC2 Platform type (API values)
EC2Platform = Literal[
    "dedicated",
    "linux",
    "linuxSQL",
    "linuxSQLEnterprise",
    "linuxSQLWeb",
    "mswin",
    "mswinSQL",
    "mswinSQLEnterprise",
    "mswinSQLWeb",
    "rhel",
    "rhelSQL",
    "rhelSQLEnterprise",
    "rhelSQLWeb",
    "sles",
    "ubuntu",
]

# RDS Platform type (API values)
RDSPlatform = Literal[
    "postgres",
    "mysql",
    "sqlServerExpress",
    "sqlServerWeb",
    "sqlServerStandard",
    "sqlServerEnterprise",
    "auroraPgMySQL",
    "auroraIoOptimized",
    "mariadb",
    "oracleEnterprise",
]

# Cache Platform type (API values)
CachePlatform = Literal["Redis", "Memcached", "Valkey"]


class EC2VPC(TypedDict):
    """EC2 VPC configuration."""

    max_enis: int
    ips_per_eni: int


class EC2Storage(TypedDict):
    """EC2 storage configuration."""

    ssd: bool
    trim_support: bool
    nvme_ssd: bool
    storage_needs_initialization: bool
    includes_swap_partition: bool
    devices: int
    size: int
    size_unit: str


class EC2ReservedPricing(TypedDict, total=False):
    """EC2 reserved pricing terms."""

    yr_term_1_standard_no_upfront: str
    yr_term_1_standard_partial_upfront: str
    yr_term_1_standard_all_upfront: str
    yr_term_3_standard_no_upfront: str
    yr_term_3_standard_partial_upfront: str
    yr_term_3_standard_all_upfront: str
    yr_term_1_convertible_no_upfront: str
    yr_term_1_convertible_partial_upfront: str
    yr_term_1_convertible_all_upfront: str
    yr_term_3_convertible_no_upfront: str
    yr_term_3_convertible_partial_upfront: str
    yr_term_3_convertible_all_upfront: str


class EC2PlatformPricing(TypedDict, total=False):
    """EC2 platform pricing."""

    ondemand: str
    reserved: EC2ReservedPricing
    spot_min: str
    spot_max: str
    pct_interrupt: str
    pct_savings_od: float
    spot_avg: str


@dataclass
class EC2Instance:
    """EC2 instance data."""

    instance_type: str
    family: str
    vcpu: int
    memory: float
    pretty_name: str
    arch: list[str]
    network_performance: str | None
    physical_processor: str
    generation: str
    current_generation: bool
    gpu: int
    fpga: int
    ebs_as_nvme: bool
    vpc: EC2VPC | None
    ebs_optimized: bool
    ebs_baseline_throughput: float
    ebs_baseline_iops: float
    ebs_baseline_bandwidth: float
    ebs_throughput: float
    ebs_iops: float
    ebs_max_bandwidth: float
    ecu: float
    intel_avx512: bool | None
    intel_avx2: bool | None
    intel_avx: bool | None
    intel_turbo: bool | None
    clock_speed_ghz: str | None
    enhanced_networking: bool
    pricing: dict[str, dict[str, EC2PlatformPricing]]
    regions: dict[str, str]
    linux_virtualization_types: list[str]
    vpc_only: bool
    base_performance: float | None
    burst_minutes: float | None
    gpu_model: str | None
    compute_capability: float | None
    gpu_memory: str | None
    placement_group_support: bool
    storage: EC2Storage | None
    emr: bool
    ipv6_support: bool
    coremark_iterations_second: float | None = None
    gpu_architectures: list[str] | None = None
    gpu_current_temp_avg_celsius: float | None = None
    ffmpeg_used_cuda: bool | None = None
    ffmpeg_speed: float | None = None
    ffmpeg_fps: float | None = None
    gpu_power_draw_watts_avg: float | None = None
    gpu_clocks: list[str] = field(default_factory=list)
    numa_node_count: int | None = None
    uses_numa_architecture: bool | None = None
    max_numa_distance: int | None = None
    core_count_per_numa_node: int | None = None
    thread_count_per_numa_node: int | None = None
    memory_per_numa_node_mb: float | None = None
    l3_per_numa_node_mb: float | None = None
    l3_shared: bool | None = None

    @classmethod
    def from_dict(cls, data: dict) -> "EC2Instance":
        """Create an EC2Instance from a dictionary."""
        return cls(
            instance_type=data.get("instance_type", ""),
            family=data.get("family", ""),
            vcpu=data.get("vcpu", 0),
            memory=data.get("memory", 0),
            pretty_name=data.get("pretty_name", ""),
            arch=data.get("arch", []),
            network_performance=data.get("network_performance"),
            physical_processor=data.get("physical_processor", ""),
            generation=data.get("generation", ""),
            current_generation=data.get("current_generation", False),
            gpu=data.get("gpu", 0),
            fpga=data.get("fpga", 0),
            ebs_as_nvme=data.get("ebs_as_nvme", False),
            vpc=data.get("vpc"),
            ebs_optimized=data.get("ebs_optimized", False),
            ebs_baseline_throughput=data.get("ebs_baseline_throughput", 0),
            ebs_baseline_iops=data.get("ebs_baseline_iops", 0),
            ebs_baseline_bandwidth=data.get("ebs_baseline_bandwidth", 0),
            ebs_throughput=data.get("ebs_throughput", 0),
            ebs_iops=data.get("ebs_iops", 0),
            ebs_max_bandwidth=data.get("ebs_max_bandwidth", 0),
            ecu=data.get("ecu", 0),
            intel_avx512=data.get("intel_avx512"),
            intel_avx2=data.get("intel_avx2"),
            intel_avx=data.get("intel_avx"),
            intel_turbo=data.get("intel_turbo"),
            clock_speed_ghz=data.get("clock_speed_ghz"),
            enhanced_networking=data.get("enhanced_networking", False),
            pricing=data.get("pricing", {}),
            regions=data.get("regions", {}),
            linux_virtualization_types=data.get("linux_virtualization_types", []),
            vpc_only=data.get("vpc_only", False),
            base_performance=data.get("base_performance"),
            burst_minutes=data.get("burst_minutes"),
            gpu_model=data.get("gpu_model"),
            compute_capability=data.get("compute_capability"),
            gpu_memory=data.get("gpu_memory"),
            placement_group_support=data.get("placement_group_support", False),
            storage=data.get("storage"),
            emr=data.get("emr", False),
            ipv6_support=data.get("ipv6_support", False),
            coremark_iterations_second=data.get("coremark_iterations_second"),
            gpu_architectures=data.get("gpu_architectures"),
            gpu_current_temp_avg_celsius=data.get("gpu_current_temp_avg_celsius"),
            ffmpeg_used_cuda=data.get("ffmpeg_used_cuda"),
            ffmpeg_speed=data.get("ffmpeg_speed"),
            ffmpeg_fps=data.get("ffmpeg_fps"),
            gpu_power_draw_watts_avg=data.get("gpu_power_draw_watts_avg"),
            gpu_clocks=data.get("gpu_clocks", []),
            numa_node_count=data.get("numa_node_count"),
            uses_numa_architecture=data.get("uses_numa_architecture"),
            max_numa_distance=data.get("max_numa_distance"),
            core_count_per_numa_node=data.get("core_count_per_numa_node"),
            thread_count_per_numa_node=data.get("thread_count_per_numa_node"),
            memory_per_numa_node_mb=data.get("memory_per_numa_node_mb"),
            l3_per_numa_node_mb=data.get("l3_per_numa_node_mb"),
            l3_shared=data.get("l3_shared"),
        )


class HalfRegionPricing(TypedDict, total=False):
    """Pricing with ondemand and optional reserved terms."""

    ondemand: float
    reserved: dict[str, float]


@dataclass
class RDSInstance:
    """RDS instance data."""

    arch: str
    current_generation: bool
    ebs_baseline_bandwidth: float
    ebs_baseline_iops: float
    ebs_baseline_throughput: float
    ebs_iops: float
    ebs_max_bandwidth: float
    ebs_optimized: bool
    ebs_throughput: float
    instance_family: str
    instance_type: str
    instance_type_family: str
    memory: float
    network_performance: str | None
    normalization_size_factor: float
    physical_processor: str
    pretty_name: str
    pricing: dict[str, dict[str, HalfRegionPricing]]
    processor_architecture: str
    region_code: str
    regions: dict[str, str]
    storage: str
    vcpu: int

    @classmethod
    def from_dict(cls, data: dict) -> "RDSInstance":
        """Create an RDSInstance from a dictionary."""
        return cls(
            arch=data.get("arch", ""),
            current_generation=data.get("current_generation", False),
            ebs_baseline_bandwidth=data.get("ebs_baseline_bandwidth", 0),
            ebs_baseline_iops=data.get("ebs_baseline_iops", 0),
            ebs_baseline_throughput=data.get("ebs_baseline_throughput", 0),
            ebs_iops=data.get("ebs_iops", 0),
            ebs_max_bandwidth=data.get("ebs_max_bandwidth", 0),
            ebs_optimized=data.get("ebs_optimized", False),
            ebs_throughput=data.get("ebs_throughput", 0),
            instance_family=data.get("instance_family", ""),
            instance_type=data.get("instance_type", ""),
            instance_type_family=data.get("instance_type_family", ""),
            memory=data.get("memory", 0),
            network_performance=data.get("network_performance"),
            normalization_size_factor=data.get("normalization_size_factor", 0),
            physical_processor=data.get("physical_processor", ""),
            pretty_name=data.get("pretty_name", ""),
            pricing=data.get("pricing", {}),
            processor_architecture=data.get("processor_architecture", ""),
            region_code=data.get("region_code", ""),
            regions=data.get("regions", {}),
            storage=data.get("storage", ""),
            vcpu=data.get("vcpu", 0),
        )


@dataclass
class CacheInstance:
    """ElastiCache instance data."""

    current_generation: bool
    instance_family: str
    instance_type: str
    max_clients: int
    memory: float
    network_performance: str | None
    pretty_name: str
    pricing: dict[str, dict[str, HalfRegionPricing]]
    region_code: str
    regions: dict[str, str]
    vcpu: int

    @classmethod
    def from_dict(cls, data: dict) -> "CacheInstance":
        """Create a CacheInstance from a dictionary."""
        return cls(
            current_generation=data.get("current_generation", False),
            instance_family=data.get("instance_family", ""),
            instance_type=data.get("instance_type", ""),
            max_clients=data.get("max_clients", 0),
            memory=data.get("memory", 0),
            network_performance=data.get("network_performance"),
            pretty_name=data.get("pretty_name", ""),
            pricing=data.get("pricing", {}),
            region_code=data.get("region_code", ""),
            regions=data.get("regions", {}),
            vcpu=data.get("vcpu", 0),
        )


@dataclass
class RedshiftInstance:
    """Redshift instance data."""

    current_generation: bool
    ecu: str
    family: str
    instance_type: str
    io: str
    memory: float
    node_range: str
    pretty_name: str
    pricing: dict[str, HalfRegionPricing]
    region_code: str
    regions: dict[str, str]
    slices_per_node: int
    storage: str
    storage_capacity: str
    storage_per_node: str
    usage_family: str
    vcpu: int

    @classmethod
    def from_dict(cls, data: dict) -> "RedshiftInstance":
        """Create a RedshiftInstance from a dictionary."""
        return cls(
            current_generation=data.get("current_generation", False),
            ecu=data.get("ecu", ""),
            family=data.get("family", ""),
            instance_type=data.get("instance_type", ""),
            io=data.get("io", ""),
            memory=data.get("memory", 0),
            node_range=data.get("node_range", ""),
            pretty_name=data.get("pretty_name", ""),
            pricing=data.get("pricing", {}),
            region_code=data.get("region_code", ""),
            regions=data.get("regions", {}),
            slices_per_node=data.get("slices_per_node", 0),
            storage=data.get("storage", ""),
            storage_capacity=data.get("storage_capacity", ""),
            storage_per_node=data.get("storage_per_node", ""),
            usage_family=data.get("usage_family", ""),
            vcpu=data.get("vcpu", 0),
        )


@dataclass
class OpenSearchInstance:
    """OpenSearch instance data."""

    current_generation: bool
    ecu: str
    instance_family: str
    instance_type: str
    max_ebs_gp2: str
    max_ebs_gp3: str
    max_http_payload: str
    memory_gib: float
    min_ebs: str
    pretty_name: str
    pricing: dict[str, HalfRegionPricing]
    region_code: str
    regions: dict[str, str]
    vcpu: int

    @classmethod
    def from_dict(cls, data: dict) -> "OpenSearchInstance":
        """Create an OpenSearchInstance from a dictionary."""
        return cls(
            current_generation=data.get("current_generation", False),
            ecu=data.get("ecu", ""),
            instance_family=data.get("instance_family", ""),
            instance_type=data.get("instance_type", ""),
            max_ebs_gp2=data.get("max_ebs_gp2", ""),
            max_ebs_gp3=data.get("max_ebs_gp3", ""),
            max_http_payload=data.get("max_http_payload", ""),
            memory_gib=data.get("memory_gib", 0),
            min_ebs=data.get("min_ebs", ""),
            pretty_name=data.get("pretty_name", ""),
            pricing=data.get("pricing", {}),
            region_code=data.get("region_code", ""),
            regions=data.get("regions", {}),
            vcpu=data.get("vcpu", 0),
        )


class AzureStorage(TypedDict, total=False):
    """Azure storage configuration."""

    nvme_ssd: bool
    devices: int
    size: int
    max_write_disks: str


class AzurePlatformPricing(TypedDict, total=False):
    """Azure platform pricing."""

    on_demand: float
    spot_min: float
    hybrid_benefit: float
    low_priority: float
    basic: float
    basic_spot: float
    reserved: dict[str, float]


@dataclass
class AzureInstance:
    """Azure instance data."""

    pretty_name: str
    family: str
    category: str
    vcpu: int
    memory: float
    size: int
    gpu: int
    pricing: dict[str, dict[str, AzurePlatformPricing]]
    regions: dict[str, str]
    pretty_name_azure: str
    instance_type: str
    storage: AzureStorage
    acu: int
    memory_maintenance: bool
    hyperv_generations: str
    arch: list[str]
    low_priority: bool
    premium_io: bool
    vm_deployment: str | None
    vcpus_available: int
    vcpus_per_core: int
    iops: int | None
    read_io: int
    write_io: int
    cached_disk: int
    uncached_disk: int
    uncached_disk_io: int
    encryption: bool
    capacity_support: bool
    accelerated_networking: bool
    rdma: bool
    ultra_ssd: bool
    hibernation: bool | None
    trusted_launch: bool | None
    confidential: bool

    @classmethod
    def from_dict(cls, data: dict) -> "AzureInstance":
        """Create an AzureInstance from a dictionary."""
        return cls(
            pretty_name=data.get("pretty_name", ""),
            family=data.get("family", ""),
            category=data.get("category", ""),
            vcpu=data.get("vcpu", 0),
            memory=data.get("memory", 0),
            size=data.get("size", 0),
            gpu=data.get("gpu", 0),
            pricing=data.get("pricing", {}),
            regions=data.get("regions", {}),
            pretty_name_azure=data.get("pretty_name_azure", ""),
            instance_type=data.get("instance_type", ""),
            storage=data.get("storage", {}),
            acu=data.get("acu", 0),
            memory_maintenance=data.get("memory_maintenance", False),
            hyperv_generations=data.get("hyperv_generations", ""),
            arch=data.get("arch", []),
            low_priority=data.get("low_priority", False),
            premium_io=data.get("premium_io", False),
            vm_deployment=data.get("vm_deployment"),
            vcpus_available=data.get("vcpus_available", 0),
            vcpus_per_core=data.get("vcpus_per_core", 0),
            iops=data.get("iops"),
            read_io=data.get("read_io", 0),
            write_io=data.get("write_io", 0),
            cached_disk=data.get("cached_disk", 0),
            uncached_disk=data.get("uncached_disk", 0),
            uncached_disk_io=data.get("uncached_disk_io", 0),
            encryption=data.get("encryption", False),
            capacity_support=data.get("capacity_support", False),
            accelerated_networking=data.get("accelerated_networking", False),
            rdma=data.get("rdma", False),
            ultra_ssd=data.get("ultra_ssd", False),
            hibernation=data.get("hibernation"),
            trusted_launch=data.get("trusted_launch"),
            confidential=data.get("confidential", False),
        )


class GCPPlatformPricing(TypedDict, total=False):
    """GCP platform pricing."""

    ondemand: str
    spot: str


@dataclass
class GCPInstance:
    """GCP instance data."""

    pretty_name: str
    instance_type: str
    family: str
    vcpu: int
    memory: float
    network_performance: str | None
    generation: str
    gpu: int
    pricing: dict[str, dict[str, GCPPlatformPricing]]
    regions: dict[str, str]
    local_ssd: bool
    shared_cpu: bool
    compute_optimized: bool

    @classmethod
    def from_dict(cls, data: dict) -> "GCPInstance":
        """Create a GCPInstance from a dictionary."""
        return cls(
            pretty_name=data.get("pretty_name", ""),
            instance_type=data.get("instance_type", ""),
            family=data.get("family", ""),
            vcpu=data.get("vcpu", 0),
            memory=data.get("memory", 0),
            network_performance=data.get("network_performance"),
            generation=data.get("generation", ""),
            gpu=data.get("gpu", 0),
            pricing=data.get("pricing", {}),
            regions=data.get("regions", {}),
            local_ssd=data.get("local_ssd", False),
            shared_cpu=data.get("shared_cpu", False),
            compute_optimized=data.get("compute_optimized", False),
        )


# Type aliases for instances with specific region types
GlobalEC2Instance = EC2Instance
ChinaEC2Instance = EC2Instance
GlobalRDSInstance = RDSInstance
ChinaRDSInstance = RDSInstance
GlobalCacheInstance = CacheInstance
ChinaCacheInstance = CacheInstance
GlobalRedshiftInstance = RedshiftInstance
ChinaRedshiftInstance = RedshiftInstance
GlobalOpenSearchInstance = OpenSearchInstance
ChinaOpenSearchInstance = OpenSearchInstance
