# Instances API Client for Python

A fully type-safe Python client library for the [Vantage Instances API](https://instances-api.vantage.sh), providing access to cloud instance pricing and specifications for AWS EC2, RDS, ElastiCache, Redshift, OpenSearch, Azure, and GCP.

## Features

- **Full type safety** with `@overload` decorators for method return types
- **Dataclass models** for all instance types with snake_case attributes
- **Literal types** for services, regions, and columns
- **TypedDict** for request bodies
- **Iterator-based streaming** for large datasets
- **Zero dependencies** (uses only stdlib)

## Installation

```bash
pip install instances-api-client
```

## Requirements

- Python 3.11+

## Usage

### Initialize the client

```python
from instances_api_client import APIV1Client

client = APIV1Client("your-api-key")
```

### Get a single instance

The return type is automatically inferred based on the service:

```python
# Returns EC2Instance
ec2 = client.get_global_instance("ec2", "m5.large")
print(ec2.instance_type)  # "m5.large"
print(ec2.vcpu)           # 2
print(ec2.memory)         # 8.0

# Returns RDSInstance
rds = client.get_global_instance("rds", "db.m5.large")
print(rds.vcpu)           # 2

# Returns AzureInstance
azure = client.get_global_instance("azure", "Standard_D2s_v3")
print(azure.vcpu)         # 2

# China regions
china_ec2 = client.get_china_instance("ec2", "m5.large")
```

### Get an instance family

```python
# Returns list[EC2Instance]
m5_instances = client.get_global_instance_family("ec2", "m5")
for instance in m5_instances:
    print(f"{instance.instance_type}: {instance.vcpu} vCPUs, {instance.memory} GB")
```

### Stream all instances

For large datasets, instances are yielded in pages to reduce memory usage:

```python
# Yields Iterator[list[EC2Instance]]
for page in client.get_all_global_instances("ec2"):
    for instance in page:
        print(instance.instance_type)

# Collect all instances (loads everything into memory)
all_ec2 = [
    instance
    for page in client.get_all_global_instances("ec2")
    for instance in page
]
```

### Run virtual instances query

Query instances with specific columns and filters. Note that request body fields use camelCase to match the API:

```python
from instances_api_client import VirtualInstancesRequest

request: VirtualInstancesRequest = {
    "service": "ec2",
    "region": "us-east-1",
    "columns": [
        {"key": "instanceType"},
        {"key": "vCPU"},
        {"key": "memory"},
        {"key": "costOndemand", "sortDesc": False},
    ],
    "globalSearch": "m5",
    "costDuration": "hourly",
    "pricingUnit": "instance",
    "currency": "USD",
}

result = client.run_virtual_instances(request)

for instance_type, columns in result.items():
    print(f"{instance_type}:")
    for col in columns:
        print(f"  {col.header_text}: {col.text} (number: {col.number})")
```

### Type-safe column specifications

Use the provided Literal types for column keys (these match the API exactly):

```python
from instances_api_client.virtual_instances import EC2Column, ColumnSpec

# Type checker will catch invalid column names
columns: list[ColumnSpec] = [
    {"key": "instanceType"},  # Valid EC2Column
    {"key": "vCPU", "sortDesc": True},
    {"key": "memory", "filter": ">16"},
]
```

## Available Services

**Global services:**
| Service | Return Type |
|---------|-------------|
| `ec2` | `EC2Instance` |
| `rds` | `RDSInstance` |
| `cache` | `CacheInstance` |
| `redshift` | `RedshiftInstance` |
| `opensearch` | `OpenSearchInstance` |
| `azure` | `AzureInstance` |
| `gcp` | `GCPInstance` |

**China region services:**

- `ec2`, `rds`, `cache`, `redshift`, `opensearch`

## Error Handling

The client raises specific exceptions for different error conditions:

```python
from instances_api_client import (
    APIError,
    InvalidRequestError,
    NotFoundError,
    RateLimitExceededError,
    UnauthorizedError,
    UnknownHTTPError,
)

try:
    client.get_global_instance("ec2", "invalid-type")
except NotFoundError as e:
    print(f"Instance not found: {e}")
except UnauthorizedError as e:
    print(f"Invalid API key: {e}")
except RateLimitExceededError as e:
    print(f"Rate limited: {e}")
except InvalidRequestError as e:
    print(f"Bad request: {e}")
except UnknownHTTPError as e:
    print(f"HTTP {e.status}: {e.status_text}")
except APIError as e:
    print(f"API error: {e}")
```

## Type Checking

This library is fully typed and includes a `py.typed` marker. Run mypy with strict mode:

```bash
mypy --strict your_code.py
```

Example of type inference:

```python
# mypy knows this is EC2Instance
instance = client.get_global_instance("ec2", "m5.large")
reveal_type(instance)  # Revealed type is "EC2Instance"

# mypy knows this is list[RDSInstance]
family = client.get_global_instance_family("rds", "db.m5")
reveal_type(family)  # Revealed type is "list[RDSInstance]"

# mypy will catch invalid services
client.get_global_instance("invalid", "m5.large")  # Error!
```

## Naming Conventions

**Instance model attributes** use Python's snake_case convention:

```python
ec2 = client.get_global_instance("ec2", "m5.large")

# Core attributes
ec2.instance_type      # "m5.large"
ec2.vcpu               # 2
ec2.memory             # 8.0
ec2.pretty_name        # "M5 Large"
ec2.current_generation # True

# EBS attributes
ec2.ebs_optimized           # True
ec2.ebs_baseline_bandwidth  # 4750.0
ec2.ebs_baseline_iops       # 18750.0

# GPU attributes
ec2.gpu                # 0
ec2.gpu_model          # None
ec2.gpu_memory         # None

# Network attributes
ec2.network_performance    # "Up to 10 Gigabit"
ec2.enhanced_networking    # True
```

**API values** (request body fields, column keys, reserved terms) use camelCase to match the API exactly:

```python
# Request body fields are camelCase
request = {
    "service": "ec2",
    "globalSearch": "m5",       # not global_search
    "costDuration": "hourly",   # not cost_duration
    "pricingUnit": "instance",  # not pricing_unit
}

# Column keys are camelCase
columns = [{"key": "instanceType"}, {"key": "vCPU"}]

# Reserved terms match the API
reserved_term = "yrTerm1Standard.noUpfront"
```

## Region Types

Use the provided Literal types for regions:

```python
from instances_api_client import GlobalAWSRegion, GlobalAzureRegion, GlobalGCPRegion

region: GlobalAWSRegion = "us-east-1"  # Valid
region: GlobalAWSRegion = "invalid"    # Type error!
```

## Development

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Type check
mypy src

# Lint
ruff check src
```
