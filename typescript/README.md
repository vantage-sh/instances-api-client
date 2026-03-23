# Instances API Client for TypeScript

A TypeScript client library for the [Vantage Instances API](https://instances-api.vantage.sh), providing access to cloud instance pricing and specifications for AWS EC2, RDS, ElastiCache, Redshift, OpenSearch, Azure, and GCP.

## Features

- **Full type safety** with generic service/region types
- **Typed models** for all instance types with camelCase attributes
- **Async streaming** for large datasets
- **Virtual instances queries** with typed column specifications

## Installation

```bash
npm install @vantage-sh/instances-api-client
```

## Requirements

- Node.js 18+

## Usage

### Initialize the client

```ts
import { APIV1Client } from "@vantage-sh/instances-api-client";

const client = new APIV1Client("your-api-key");
```

### Get a single instance

```ts
// Returns EC2Instance
const ec2 = await client.getGlobalInstance("ec2", "m5.large");
console.log(ec2.instanceType); // "m5.large"
console.log(ec2.vCPU);         // 2
console.log(ec2.memory);       // 8.0

// Returns AzureInstance
const azure = await client.getGlobalInstance("azure", "Standard_D2s_v3");

// China regions
const chinaEc2 = await client.getChinaInstance("ec2", "m5.large");
```

### Get an instance family

```ts
// Returns EC2Instance[]
const m5 = await client.getGlobalInstanceFamily("ec2", "m5");
for (const instance of m5) {
    console.log(`${instance.instanceType}: ${instance.vCPU} vCPUs, ${instance.memory} GB`);
}
```

### Stream all instances

```ts
// Yields pages of EC2Instance[]
for await (const page of client.getAllGlobalInstances("ec2")) {
    for (const instance of page) {
        console.log(instance.instanceType);
    }
}
```

### Run a virtual instances query

```ts
const result = await client.runVirtualInstances({
    service: "ec2",
    region: "us-east-1",
    columns: [
        { key: "instanceType" },
        { key: "vCPU" },
        { key: "memory" },
        { key: "costOndemand", sortDesc: false },
    ],
    globalSearch: "m5",
    costDuration: "hourly",
    pricingUnit: "instance",
    currency: "USD",
});

for (const [instanceType, columns] of Object.entries(result)) {
    console.log(instanceType);
    for (const col of columns) {
        console.log(`  ${col.headerText}: ${col.text}`);
    }
}
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

**China region services:** `ec2`, `rds`, `cache`, `redshift`, `opensearch`

## Error Handling

```ts
import {
    APIError,
    InvalidRequestError,
    NotFoundError,
    RateLimitExceededError,
    UnauthorizedError,
    UnknownHTTPError,
} from "@vantage-sh/instances-api-client";

try {
    await client.getGlobalInstance("ec2", "invalid-type");
} catch (e) {
    if (e instanceof NotFoundError) console.error("Instance not found");
    else if (e instanceof UnauthorizedError) console.error("Invalid API key");
    else if (e instanceof RateLimitExceededError) console.error("Rate limited");
    else if (e instanceof InvalidRequestError) console.error("Bad request");
    else if (e instanceof UnknownHTTPError) console.error(`HTTP ${e.status}`);
}
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Format
npm run format
```
