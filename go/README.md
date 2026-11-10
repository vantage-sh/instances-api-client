# Vantage Instances API client for Go

The Go client provides the same Vantage Instances API operations as the [Python](../python) and [TypeScript](../typescript) clients. It requires Go 1.26 or newer.

| Operation | Go method | Bearer token |
| --- | --- | --- |
| Look up one instance | `GetGlobalInstance`, `GetChinaInstance` | Required |
| Look up an instance family | `GetGlobalInstanceFamily`, `GetChinaInstanceFamily` | Optional |
| Stream the full catalog | `GetAllGlobalInstances`, `GetAllChinaInstances` | Optional |
| Query a virtual instance table | `RunVirtualInstances` | Required |

The global dataset covers EC2, RDS, ElastiCache, Redshift, OpenSearch, Azure, and GCP. The China dataset covers the five AWS services.

## Use from a checkout

The module path is `github.com/vantage-sh/instances-api-client/go`. To use a local checkout, add the import to your application and run these commands from the application's module. Set the replacement path to the checkout's `go/` directory.

```sh
go mod edit -require=github.com/vantage-sh/instances-api-client/go@v0.0.0
go mod edit -replace=github.com/vantage-sh/instances-api-client/go=../instances-api-client/go
go mod tidy
```

## Look up an instance and its pricing

```go
package main

import (
	"context"
	"fmt"
	"log"
	"os"

	instancesapi "github.com/vantage-sh/instances-api-client/go"
)

func main() {
	ctx := context.Background()
	client := instancesapi.NewAPIV1Client(os.Getenv("VANTAGE_API_KEY"))
	instance, err := client.GetGlobalInstance(ctx, instancesapi.ServiceEC2, "m5.xlarge")
	if err != nil {
		log.Fatal(err)
	}

	ec2 := instance.(*instancesapi.EC2Instance)
	linux, _ := ec2.Pricing[instancesapi.RegionAWSUSEast1].Group("linux")
	if rate, ok := linux.Rate("ondemand"); ok {
		fmt.Printf("%s has %g vCPUs and costs %s per hour\n", ec2.InstanceType, ec2.VCPU, rate)
	}
}
```

`Instance.Info()` exposes the instance type, display name, regions, and raw specification fields. The concrete service models expose typed specifications and regional pricing. Redshift and OpenSearch have rates directly under the region. Use `Group` to access platform, engine, or reservation tables and `Rate` to read a decimal value without losing its original precision.

Use `WithHTTPClient` to supply an application HTTP client. Each operation accepts a context for deadlines and cancellation.

## Stream the public catalog

```go
client := instancesapi.NewAPIV1Client("")
for page, err := range client.GetAllGlobalInstances(ctx, instancesapi.ServiceGCP) {
	if err != nil {
		log.Fatal(err)
	}
	for _, instance := range page {
		fmt.Println(instance.Info().InstanceType)
	}
}
```

EC2, RDS, Azure, and GCP yield pages of up to 50 records. ElastiCache, Redshift, and OpenSearch yield one page per feed. Iteration begins the request and breaking the loop closes its response. Use `CollectPages` when you need all pages in a single slice.

## Query the virtual table

```go
ascending := false
result, err := client.RunVirtualInstances(ctx, instancesapi.VirtualInstancesRequest{
	Service: instancesapi.ServiceEC2,
	Region:  instancesapi.RegionAWSUSEast1,
	Columns: []instancesapi.ColumnSpec{
		{Key: instancesapi.ColumnInstanceType},
		{Key: instancesapi.ColumnCostOnDemand, SortDesc: &ascending},
	},
	CostDuration: instancesapi.CostDurationHourly,
})
if err != nil {
	log.Fatal(err)
}
for _, instanceType := range result.Order {
	price := result.Instances[instanceType][1]
	fmt.Println(instanceType, price.Text())
}
```

Each cell has `HTML` and `HeaderText` fields, a `Text()` method, and a `Number()` method that returns the first number and whether it was present. Iterate `Order` to preserve server sorting. Use the [API reference](../README.md#api-reference) for the valid regions, columns, and reservation terms for each service.

## Handle errors

```go
var notFound *instancesapi.NotFoundError
if errors.As(err, &notFound) {
	log.Print(notFound.Message)
}
```

Use `errors.As` with `*APIError` to access the status, status text, code, and message shared by the specific API error types. Network and decoding errors use the standard Go error chain.

## Development

```sh
go test ./...
go vet ./...
```
