# Instances API Client

Client libraries for the [Vantage Instances API](https://instances-api.vantage.sh), providing access to cloud instance pricing and specifications for AWS EC2, RDS, ElastiCache, Redshift, OpenSearch, Azure, and GCP.

## Packages

| Language | Directory | Package |
|----------|-----------|---------|
| Python | [`python/`](./python) | `instances-api-client` on PyPI |
| TypeScript | [`typescript/`](./typescript) | `@vantage-sh/instances-api-client` on npm |

## API Reference

All endpoints are served from `https://instances-api.vantage.sh`. Endpoints that require authentication accept a Bearer token via the `Authorization` header.

### Services

The following services are supported:

| Service key | Description |
|-------------|-------------|
| `ec2` | AWS EC2 |
| `rds` | AWS RDS |
| `cache` | AWS ElastiCache |
| `redshift` | AWS Redshift |
| `opensearch` | AWS OpenSearch |
| `azure` | Azure VMs |
| `gcp` | GCP Compute |

China region endpoints support `ec2`, `rds`, `cache`, `redshift`, and `opensearch` only.

---

### `GET /api/v1/instances/{service}/{instanceType}/global`

Returns a single instance by type from the global dataset.

**Authentication:** Required

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `service` | One of the service keys above |
| `instanceType` | The instance type identifier (e.g. `m5.xlarge`, `db.r6g.large`) |

**Response:** A single instance object for the given service (see [Instance Objects](#instance-objects)).

---

### `GET /api/v1/instances/{service}/{instanceType}/china`

Returns a single instance by type from the China region dataset.

**Authentication:** Required

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `service` | One of: `ec2`, `rds`, `cache`, `redshift`, `opensearch` |
| `instanceType` | The instance type identifier |

**Response:** A single instance object for the given service.

---

### `GET /api/v1/instances/{service}/families/{family}/global`

Returns all instances belonging to a given instance family from the global dataset.

**Authentication:** Not required

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `service` | One of the service keys above |
| `family` | The instance family name (e.g. `m5`, `r6g`) |

**Response:** Array of instance objects for the given service.

---

### `GET /api/v1/instances/{service}/families/{family}/china`

Returns all instances belonging to a given instance family from the China region dataset.

**Authentication:** Not required

**Path parameters:**

| Parameter | Description |
|-----------|-------------|
| `service` | One of: `ec2`, `rds`, `cache`, `redshift`, `opensearch` |
| `family` | The instance family name |

**Response:** Array of instance objects for the given service.

---

### Bulk instance data (JSON feeds)

Full instance lists are available as static JSON feeds — no authentication required. These are streamed by the client SDKs for memory efficiency.

| Service | Global | China |
|---------|--------|-------|
| EC2 | `https://instances.vantage.sh/instances.json` | `https://instances.vantage.sh/instances-cn.json` |
| RDS | `https://instances.vantage.sh/rds/instances.json` | `https://instances.vantage.sh/rds/instances-cn.json` |
| ElastiCache | `https://instances.vantage.sh/cache/instances.json` | `https://instances.vantage.sh/cache/instances-cn.json` |
| Redshift | `https://instances.vantage.sh/redshift/instances.json` | `https://instances.vantage.sh/redshift/instances-cn.json` |
| OpenSearch | `https://instances.vantage.sh/opensearch/instances.json` | `https://instances.vantage.sh/opensearch/instances-cn.json` |
| Azure | `https://instances.vantage.sh/azure/instances.json` | — |
| GCP | `https://instances.vantage.sh/gcp/instances.json` | — |

---

### `POST /api/v1/virtual-instances`

Headlessly runs a query equivalent to [instances.vantage.sh](https://instances.vantage.sh), returning a filtered and sorted table of instances with rendered HTML column values.

**Authentication:** Required

**Request body (JSON):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `service` | string | Yes | One of the service keys above |
| `region` | string | Yes | A region slug valid for the chosen service (see [Regions](#regions)) |
| `columns` | array | Yes | Columns to include in the response (see [Columns](#columns)) |
| `globalSearch` | string | No | A search term applied across all columns |
| `costDuration` | string | No | Time granularity for pricing: `secondly`, `minutely`, `hourly`, `daily`, `weekly`, `monthly`, `annually` |
| `pricingUnit` | string | No | Unit for cost display: `instance`, `vcpu`, `memory`, `ecu` (AWS), `acu` (Azure) |
| `currency` | string | No | Currency code for pricing display, defaults to `USD` |
| `reservedTerm` | string | No | Reserved instance term (not applicable for GCP; see [Reserved Terms](#reserved-terms)) |

Each entry in `columns` is an object:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `key` | string | Yes | Column identifier (see [Columns](#columns)) |
| `filter` | string | No | Filter expression for this column |
| `sortDesc` | boolean | No | If `true`, sort descending by this column; if `false`, sort ascending |

**Response:**

```json
{
  "headers": ["Name", "Instance Type", "Memory", "..."],
  "instances": {
    "m5.xlarge": ["<html>", "<html>", "<html>", "..."],
    "m5.2xlarge": ["<html>", "<html>", "<html>", "..."]
  }
}
```

Each value in the `instances` arrays is an HTML string corresponding to the header at the same index.

---

## Instance Objects

### EC2Instance

| Field | Type | Description |
|-------|------|-------------|
| `instanceType` | string | Instance type identifier |
| `family` | string | Instance family |
| `prettyName` | string | Human-readable name |
| `vCPU` | number | vCPU count |
| `memory` | number | Memory in GiB |
| `arch` | string[] | CPU architectures |
| `GPU` | number | GPU count |
| `GPUModel` | string \| null | GPU model name |
| `GPUMemory` | string \| null | GPU memory |
| `FPGA` | number | FPGA count |
| `networkPerformance` | string \| null | Network bandwidth description |
| `physicalProcessor` | string | Processor name |
| `clockSpeedGhz` | string \| null | Clock speed |
| `currentGeneration` | boolean | Whether this is a current-gen instance |
| `generation` | string | Generation string |
| `storage` | object \| null | Local storage details |
| `ebsOptimized` | boolean | EBS optimized support |
| `ebsBaselineBandwidth` | number | EBS baseline bandwidth (Mbps) |
| `ebsBaselineThroughput` | number | EBS baseline throughput (MB/s) |
| `ebsBaselineIops` | number | EBS baseline IOPS |
| `ebsMaxBandwidth` | number | EBS max bandwidth (Mbps) |
| `ebsThroughput` | number | EBS max throughput (MB/s) |
| `ebsIops` | number | EBS max IOPS |
| `ebsAsNvme` | boolean | Whether EBS is presented as NVMe |
| `vpc` | object \| null | VPC networking limits (`maxEnis`, `ipsPerEni`) |
| `enhancedNetworking` | boolean | Enhanced networking support |
| `vpcOnly` | boolean | VPC-only instance |
| `ipv6Support` | boolean | IPv6 support |
| `placementGroupSupport` | boolean | Placement group support |
| `linuxVirtualizationTypes` | string[] | Supported virtualization types |
| `emr` | boolean | EMR support |
| `ECU` | number | EC2 Compute Units |
| `intelAvx` | boolean \| null | Intel AVX support |
| `intelAvx2` | boolean \| null | Intel AVX2 support |
| `intelAvx512` | boolean \| null | Intel AVX-512 support |
| `intelTurbo` | boolean \| null | Intel Turbo Boost support |
| `basePerformance` | number \| null | Burstable base performance |
| `burstMinutes` | number \| null | Burstable burst duration |
| `computeCapability` | number \| null | CUDA compute capability |
| `pricing` | object | Pricing by region → platform → term |
| `regions` | object | Map of region slug → region name |

### RDSInstance

| Field | Type | Description |
|-------|------|-------------|
| `instanceType` | string | Instance type identifier |
| `instanceFamily` | string | Instance family |
| `prettyName` | string | Human-readable name |
| `vcpu` | number | vCPU count |
| `memory` | number | Memory in GiB |
| `arch` | string | CPU architecture |
| `networkPerformance` | string \| null | Network bandwidth |
| `physicalProcessor` | string | Processor name |
| `currentGeneration` | boolean | Current generation flag |
| `storage` | string | Storage description |
| `ebsOptimized` | boolean | EBS optimized |
| `ebsBaselineBandwidth` | number | EBS baseline bandwidth |
| `ebsBaselineThroughput` | number | EBS baseline throughput |
| `ebsBaselineIops` | number | EBS baseline IOPS |
| `ebsMaxBandwidth` | number | EBS max bandwidth |
| `ebsThroughput` | number | EBS max throughput |
| `ebsIops` | number | EBS max IOPS |
| `normalizationSizeFactor` | number | Reserved instance normalization factor |
| `pricing` | object | Pricing by region → engine → term. Engine keys: `postgres`, `mysql`, `sqlServerExpress`, `sqlServerWeb`, `sqlServerStandard`, `sqlServerEnterprise`, `auroraPgMySQL`, `auroraIoOptimized`, `mariadb`, `oracleEnterprise` |
| `regions` | object | Map of region slug → region name |

### CacheInstance

| Field | Type | Description |
|-------|------|-------------|
| `instanceType` | string | Instance type identifier |
| `instanceFamily` | string | Instance family |
| `prettyName` | string | Human-readable name |
| `vcpu` | number | vCPU count |
| `memory` | number | Memory in GiB |
| `maxClients` | number | Maximum client connections |
| `networkPerformance` | string \| null | Network bandwidth |
| `currentGeneration` | boolean | Current generation flag |
| `pricing` | object | Pricing by region → engine → term. Engine keys: `Redis`, `Memcached`, `Valkey` |
| `regions` | object | Map of region slug → region name |

### RedshiftInstance

| Field | Type | Description |
|-------|------|-------------|
| `instanceType` | string | Instance type identifier |
| `family` | string | Instance family |
| `prettyName` | string | Human-readable name |
| `vcpu` | number | vCPU count |
| `memory` | number | Memory in GiB |
| `storage` | string | Storage type |
| `storageCapacity` | string | Total storage capacity |
| `storagePerNode` | string | Storage per node |
| `nodeRange` | string | Supported node range |
| `slicesPerNode` | number | Slices per node |
| `io` | string | I/O description |
| `ecu` | string | Elastic Compute Units |
| `usageFamily` | string | Usage family |
| `currentGeneration` | boolean | Current generation flag |
| `pricing` | object | Pricing by region → term |
| `regions` | object | Map of region slug → region name |

### OpenSearchInstance

| Field | Type | Description |
|-------|------|-------------|
| `instanceType` | string | Instance type identifier |
| `instanceFamily` | string | Instance family |
| `prettyName` | string | Human-readable name |
| `vcpu` | number | vCPU count |
| `memoryGib` | number | Memory in GiB |
| `ecu` | string | Elastic Compute Units |
| `maxEbsGp2` | string | Max EBS GP2 storage |
| `maxEbsGp3` | string | Max EBS GP3 storage |
| `minEbs` | string | Minimum EBS storage |
| `maxHttpPayload` | string | Max HTTP payload size |
| `currentGeneration` | boolean | Current generation flag |
| `pricing` | object | Pricing by region → term |
| `regions` | object | Map of region slug → region name |

### AzureInstance

| Field | Type | Description |
|-------|------|-------------|
| `instanceType` | string | Instance type identifier |
| `prettyName` | string | Human-readable name |
| `prettyNameAzure` | string | Azure-style display name |
| `family` | string | Instance family |
| `category` | string | Instance category |
| `vcpu` | number | vCPU count |
| `vcpusAvailable` | number | vCPUs available to the VM |
| `vcpusPercore` | number | vCPUs per physical core |
| `memory` | number | Memory in GiB |
| `size` | number | Disk size |
| `GPU` | number | GPU count |
| `arch` | string[] | CPU architectures |
| `storage` | object | Local storage (`nvmeSsd`, `devices`, `size`, `maxWriteDisks`) |
| `ACU` | number | Azure Compute Units |
| `iops` | number \| null | Max IOPS |
| `readIo` | number | Read throughput |
| `writeIo` | number | Write throughput |
| `cachedDisk` | number | Cached disk throughput |
| `uncachedDisk` | number | Uncached disk throughput |
| `uncachedDiskIo` | number | Uncached disk IOPS |
| `hypervGenerations` | string | Supported Hyper-V generations |
| `acceleratedNetworking` | boolean | Accelerated networking support |
| `premiumIo` | boolean | Premium IO support |
| `ultraSsd` | boolean | Ultra SSD support |
| `encryption` | boolean | Encryption at host support |
| `confidential` | boolean | Confidential VM support |
| `trustedLaunch` | boolean \| null | Trusted launch support |
| `hibernation` | boolean \| null | Hibernation support |
| `rdma` | boolean | RDMA support |
| `capacitySupport` | boolean | Capacity reservation support |
| `memoryMaintenance` | boolean | Memory-preserving maintenance |
| `lowPriority` | boolean | Low priority VM support |
| `vmDeployment` | string \| null | Deployment type |
| `pricing` | object | Pricing by region → platform (`linux`, `windows`) → term |
| `regions` | object | Map of region slug → region name |

### GCPInstance

| Field | Type | Description |
|-------|------|-------------|
| `instanceType` | string | Instance type identifier |
| `prettyName` | string | Human-readable name |
| `family` | string | Instance family |
| `vCPU` | number | vCPU count |
| `memory` | number | Memory in GiB |
| `GPU` | number | GPU count |
| `networkPerformance` | string \| null | Network bandwidth |
| `generation` | string | Generation |
| `localSsd` | boolean | Local SSD available |
| `sharedCpu` | boolean | Shared-core CPU |
| `computeOptimized` | boolean | Compute-optimized flag |
| `pricing` | object | Pricing by region → platform (`linux`, `windows`) → term (`ondemand`, `spot`) |
| `regions` | object | Map of region slug → region name |

---

## Pricing Structure

### AWS pricing terms

Reserved instance pricing keys follow the pattern `yrTerm{length}{type}.{upfront}`:

| Key | Description |
|-----|-------------|
| `yrTerm1Standard.noUpfront` | 1-year standard, no upfront |
| `yrTerm1Standard.partialUpfront` | 1-year standard, partial upfront |
| `yrTerm1Standard.allUpfront` | 1-year standard, all upfront |
| `yrTerm3Standard.noUpfront` | 3-year standard, no upfront |
| `yrTerm3Standard.partialUpfront` | 3-year standard, partial upfront |
| `yrTerm3Standard.allUpfront` | 3-year standard, all upfront |
| `yrTerm1Convertible.noUpfront` | 1-year convertible, no upfront |
| `yrTerm1Convertible.partialUpfront` | 1-year convertible, partial upfront |
| `yrTerm1Convertible.allUpfront` | 1-year convertible, all upfront |
| `yrTerm3Convertible.noUpfront` | 3-year convertible, no upfront |
| `yrTerm3Convertible.partialUpfront` | 3-year convertible, partial upfront |
| `yrTerm3Convertible.allUpfront` | 3-year convertible, all upfront |

EC2 platform pricing also includes `spot_min`, `spot_max`, `spot_avg`, `pct_interrupt`, and `pct_savings_od`.

### Azure pricing terms

| Key | Description |
|-----|-------------|
| `yrTerm1Standard.allUpfront` | 1-year reserved |
| `yrTerm3Standard.allUpfront` | 3-year reserved |
| `yrTerm1Standard.hybridbenefit` | 1-year with Azure Hybrid Benefit |
| `yrTerm3Standard.hybridbenefit` | 3-year with Azure Hybrid Benefit |

Azure platform pricing also includes `on_demand`, `spot_min`, `hybridbenefit`, `lowpriority`, `basic`, and `basic-spot`.

### GCP pricing

GCP pricing uses `ondemand` and `spot` keys only. There are no reserved terms.

---

## Columns

Columns are used in the `POST /api/v1/virtual-instances` request body. Each service has its own set of valid column keys.

### EC2 columns

`prettyName`, `instanceType`, `family`, `memory`, `ECU`, `vCPU`, `memoryPerVcpu`, `GPU`, `GPUModel`, `GPUMemory`, `computeCapability`, `FPGA`, `ECUPerVcpu`, `physicalProcessor`, `clockSpeedGhz`, `intelAvx`, `intelAvx2`, `intelAvx512`, `intelTurbo`, `storage`, `warmedUp`, `trimSupport`, `arch`, `networkPerformance`, `ebsBaselineBandwidth`, `ebsBaselineThroughput`, `ebsBaselineIops`, `ebsMaxBandwidth`, `ebsThroughput`, `ebsIops`, `ebsAsNvme`, `maxIps`, `maxEnis`, `enhancedNetworking`, `vpcOnly`, `ipv6Support`, `placementGroupSupport`, `linuxVirtualizationTypes`, `emr`, `availabilityZones`, `generation`, `isBareMetal`, `isTrunkingCompatible`, `branchInterface`, `costOndemand`, `costReserved`, `costSpotMin`, `costSpotMax`, `costOndemandRhel`, `costReservedRhel`, `costOndemandRhelHA`, `costReservedRhelHA`, `costSpotMinRhel`, `costSpotMaxRhel`, `costOndemandSles`, `costReservedSles`, `costSpotMinSles`, `costSpotMaxSles`, `costOndemandMswin`, `costReservedMswin`, `costSpotMinMswin`, `costSpotMaxMswin`, `costOndemandDedicated`, `costReservedDedicated`, `costOndemandMswinSQLWeb`, `costReservedMswinSQLWeb`, `costOndemandMswinSQL`, `costReservedMswinSQL`, `costOndemandMswinSQLEnterprise`, `costReservedMswinSQLEnterprise`, `costOndemandLinuxSQLWeb`, `costReservedLinuxSQLWeb`, `costOndemandLinuxSQL`, `costReservedLinuxSQL`, `costOndemandLinuxSQLEnterprise`, `costReservedLinuxSQLEnterprise`, `spotInterruptRate`, `costEmr`, `coremarkIterationsSecond`, `gpuArchitectures`, `gpuCurrentTempAvgCelsius`, `gpuPowerMaxWattsAvg`, `gpuPowerDrawWattsAvg`, `ffmpegUsedCuda`, `ffmpegSpeed`, `ffmpegFps`, `gpuClocksGraphicsAvg`, `gpuClocksSmAvg`, `gpuClocksMemoryAvg`, `gpuClocksVideoAvg`, `memorySpeed`, `usesNumaArchitecture`, `numaNodeCount`, `maxNumaDistance`, `coreCountPerNumaNode`, `threadCountPerNumaNode`, `memoryPerNumaNodeMb`, `l3PerNumaNodeMb`, `l3Shared`, `computeFamily`

### RDS columns

`name`, `apiName`, `memory`, `storage`, `vCPU`, `networkPerf`, `architecture`, `ebsBaselineBandwidth`, `ebsBaselineThroughput`, `ebsBaselineIops`, `ebsMaxBandwidth`, `ebsMaxThroughput`, `ebsIops`, `costOnDemandPostgres`, `costReservedPostgres`, `costOnDemandMySQL`, `costReservedMySQL`, `costOnDemandSQLServerExpress`, `costReservedSQLServerExpress`, `costOnDemandSQLServerWeb`, `costReservedSQLServerWeb`, `costOnDemandSQLServerStandard`, `costReservedSQLServerStandard`, `costOnDemandSQLServerEnterprise`, `costReservedSQLServerEnterprise`, `costOnDemandAurora`, `costReservedAurora`, `costOnDemandAuroraIO`, `costOnDemandMariaDB`, `costReservedMariaDB`, `costOnDemandOracleEnterprise`, `costReservedOracleEnterprise`

### ElastiCache columns

`prettyName`, `instanceType`, `memory`, `vCPU`, `networkPerf`, `generation`, `costOnDemandRedis`, `costReservedRedis`, `costOnDemandMemcached`, `costReservedMemcached`, `costOnDemandValkey`, `costReservedValkey`

### Redshift columns

`prettyName`, `instanceType`, `memory`, `vCPU`, `storage`, `io`, `ECU`, `generation`, `costOndemand`, `costReserved`

### OpenSearch columns

`prettyName`, `instanceType`, `memory`, `vCPU`, `storage`, `ECU`, `generation`, `costOndemand`, `costReserved`

### Azure columns

`prettyNameAzure`, `instanceType`, `memory`, `vCPU`, `memoryPerVcpu`, `GPU`, `size`, `linuxOndemand`, `linuxSavings`, `linuxReserved`, `linuxSpot`, `windowsOndemand`, `windowsSavings`, `windowsReserved`, `windowsSpot`

### GCP columns

`prettyName`, `instanceType`, `memory`, `vCPU`, `memoryPerVcpu`, `GPU`, `networkPerformance`, `generation`, `localSsd`, `sharedCpu`, `linuxOndemand`, `linuxSpot`, `windowsOndemand`, `windowsSpot`

---

## Regions

### AWS Global regions

`ap-northeast-1`, `ap-northeast-2`, `ap-northeast-3`, `ap-south-1`, `ap-south-2`, `ap-southeast-1`, `ap-southeast-2`, `ap-southeast-3`, `ap-southeast-4`, `ap-southeast-5`, `ap-southeast-7`, `ap-east-1`, `ap-east-2`, `af-south-1`, `ca-central-1`, `ca-west-1`, `eu-central-1`, `eu-central-2`, `eu-north-1`, `eu-south-1`, `eu-south-2`, `eu-west-1`, `eu-west-2`, `eu-west-3`, `il-central-1`, `me-central-1`, `me-south-1`, `mx-central-1`, `sa-east-1`, `us-east-1`, `us-east-2`, `us-west-1`, `us-west-2`, `us-gov-east-1`, `us-gov-west-1`

### AWS China regions

`cn-north-1`, `cn-northwest-1`, `cn-north-1-pkx-1`

### Azure regions

`asia-pacific-east`, `asia-pacific-southeast`, `australia-central`, `australia-central-2`, `australia-east`, `australia-southeast`, `austria-east`, `belgium-central`, `brazil-south`, `brazil-southeast`, `canada-central`, `canada-east`, `central-india`, `chile-central`, `europe-north`, `europe-west`, `france-central`, `france-south`, `germany-north`, `germany-west-central`, `indonesia-central`, `israel-central`, `italy-north`, `japan-east`, `japan-west`, `korea-central`, `korea-south`, `malaysia-west`, `mexico-central`, `new-zealand-north`, `norway-east`, `norway-west`, `poland-central`, `qatar-central`, `south-africa-north`, `south-africa-west`, `south-india`, `spain-central`, `sweden-central`, `sweden-south`, `switzerland-north`, `switzerland-west`, `uae-central`, `uae-north`, `united-kingdom-south`, `united-kingdom-west`, `us-central`, `us-east`, `us-east-2`, `us-north-central`, `us-south-central`, `us-west`, `us-west-2`, `us-west-3`, `us-west-central`, `usgov-arizona`, `usgov-texas`, `usgov-virginia`, `west-india`

### GCP regions

`africa-south1`, `asia-east1`, `asia-east2`, `asia-northeast1`, `asia-northeast2`, `asia-northeast3`, `asia-south1`, `asia-south2`, `asia-southeast1`, `asia-southeast2`, `asia-southeast3`, `australia-southeast1`, `australia-southeast2`, `europe-central2`, `europe-north1`, `europe-north2`, `europe-southwest1`, `europe-west1`, `europe-west2`, `europe-west3`, `europe-west4`, `europe-west5`, `europe-west6`, `europe-west8`, `europe-west9`, `europe-west10`, `europe-west12`, `me-central1`, `me-central2`, `me-west1`, `multi-americas`, `northamerica-northeast1`, `northamerica-northeast2`, `northamerica-south1`, `southamerica-east1`, `southamerica-west1`, `us-central1`, `us-east1`, `us-east4`, `us-east5`, `us-east7`, `us-south1`, `us-west1`, `us-west2`, `us-west3`, `us-west4`, `us-west8`

---

## Reserved Terms

### AWS

Pass one of these as `reservedTerm` in a Virtual Instances request for EC2, RDS, ElastiCache, Redshift, or OpenSearch:

`yrTerm1Standard.noUpfront`, `yrTerm1Standard.partialUpfront`, `yrTerm1Standard.allUpfront`, `yrTerm3Standard.noUpfront`, `yrTerm3Standard.partialUpfront`, `yrTerm3Standard.allUpfront`, `yrTerm1Convertible.noUpfront`, `yrTerm1Convertible.partialUpfront`, `yrTerm1Convertible.allUpfront`, `yrTerm3Convertible.noUpfront`, `yrTerm3Convertible.partialUpfront`, `yrTerm3Convertible.allUpfront`

### Azure

`yrTerm1Standard.allUpfront`, `yrTerm3Standard.allUpfront`, `yrTerm1Standard.hybridbenefit`, `yrTerm3Standard.hybridbenefit`

### GCP

GCP does not support reserved terms.

---

## License

MIT — see [LICENSE](./LICENSE).
