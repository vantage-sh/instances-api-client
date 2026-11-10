package instancesapi_test

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"reflect"
	"slices"
	"strings"
	"testing"
	"testing/iotest"

	instancesapi "github.com/vantage-sh/instances-api-client/go"
)

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(req *http.Request) (*http.Response, error) {
	return f(req)
}

type trackedBody struct {
	io.Reader
	closed bool
}

func (b *trackedBody) Close() error {
	b.closed = true
	return nil
}

func clientWithTransport(transport roundTripFunc) *instancesapi.APIV1Client {
	return instancesapi.NewAPIV1Client("test-key", instancesapi.WithHTTPClient(&http.Client{Transport: transport}))
}

func TestInstanceRoutes(t *testing.T) {
	ctx := context.Background()
	const selector = "test +/é?"
	const escaped = "test%20%2B%2F%C3%A9%3F"
	const record = `{"instance_type":"test","generation":"current","vCPU":"2","memory":"3.5"}`

	for _, tc := range []struct {
		name, path string
		auth       bool
		call       func(*instancesapi.APIV1Client) (instancesapi.Instance, error)
	}{
		{"global instance", "/ec2/" + escaped + "/global", true, func(c *instancesapi.APIV1Client) (instancesapi.Instance, error) {
			return c.GetGlobalInstance(ctx, instancesapi.ServiceEC2, selector)
		}},
		{"China instance", "/ec2/" + escaped + "/china", true, func(c *instancesapi.APIV1Client) (instancesapi.Instance, error) {
			return c.GetChinaInstance(ctx, instancesapi.ServiceEC2, selector)
		}},
		{"global family", "/ec2/families/" + escaped + "/global", false, func(c *instancesapi.APIV1Client) (instancesapi.Instance, error) {
			rows, err := c.GetGlobalInstanceFamily(ctx, instancesapi.ServiceEC2, selector)
			if err != nil {
				return nil, err
			}
			return rows[0], nil
		}},
		{"China family", "/ec2/families/" + escaped + "/china", false, func(c *instancesapi.APIV1Client) (instancesapi.Instance, error) {
			rows, err := c.GetChinaInstanceFamily(ctx, instancesapi.ServiceEC2, selector)
			if err != nil {
				return nil, err
			}
			return rows[0], nil
		}},
	} {
		t.Run(tc.name, func(t *testing.T) {
			payload, authorization := "["+record+"]", ""
			if tc.auth {
				payload, authorization = record, "Bearer test-key"
			}
			body := &trackedBody{Reader: strings.NewReader(payload)}
			client := clientWithTransport(func(req *http.Request) (*http.Response, error) {
				wantURL := "https://instances-api.vantage.sh/api/v1/instances" + tc.path
				if req.Method != http.MethodGet || req.URL.String() != wantURL {
					t.Fatalf("request = %s %s, want GET %s", req.Method, req.URL, wantURL)
				}
				if req.Header.Get("Authorization") != authorization ||
					req.Header.Get("Content-Type") != "application/json" ||
					req.UserAgent() != "instances-api-client-go" {
					t.Fatalf("headers = %v", req.Header)
				}
				return &http.Response{StatusCode: http.StatusOK, Body: body}, nil
			})
			instance, err := tc.call(client)
			if err != nil {
				t.Fatal(err)
			}
			row, ok := instance.(*instancesapi.EC2Instance)
			if !ok || row.InstanceType != "test" || !row.CurrentGeneration || row.VCPU != 2 || row.Memory != 3.5 {
				t.Fatalf("decoded instance = %#v", instance)
			}
			if !body.closed {
				t.Fatal("response body remained open")
			}
		})
	}
}

func TestInstanceNormalization(t *testing.T) {
	t.Run("EC2 mixed pricing and GPU clocks", func(t *testing.T) {
		client := clientWithTransport(jsonResponse(`{
			"instance_type":"test", "GPU_memory":80, "gpu_clocks":[{"graphics":1234},"1200"],
			"storage":{"nvme_ssd":true,"size_unit":"GB"}, "vpc":{"max_enis":4,"ips-per-eni":15},
			"availability_zones":{"us-east-1":["us-east-1a"]},
			"pricing":{"us-east-1":{"ebs":"0.01","linux":{"ondemand":"0.1234567890123456789","reserved":{"yrTerm1Standard.noUpfront":"0.02"}}}},
			"regions":{"us-east-1":"US East"}
		}`))
		instance, err := client.GetGlobalInstance(context.Background(), instancesapi.ServiceEC2, "test")
		if err != nil {
			t.Fatal(err)
		}
		row := instance.(*instancesapi.EC2Instance)
		if row.GPUMemory == nil || *row.GPUMemory != "80" || len(row.GPUClocks) != 2 ||
			row.Storage == nil || !row.Storage.NVMeSSD || row.Storage.SizeUnit != "GB" ||
			row.VPC == nil || row.VPC.MaxENIs != 4 || row.VPC.IPsPerENI != 15 {
			t.Fatalf("normalized specifications = %#v", row)
		}
		const region = instancesapi.RegionAWSUSEast1
		if row.Regions[region] != "US East" || len(row.Attributes["availability_zones"]) == 0 {
			t.Fatalf("regions or raw attributes were lost: %#v", row.Info())
		}
		rates := row.Pricing[region]
		linux, ok := rates.Group("linux")
		reserved, hasReserved := linux.Group("reserved")
		if !ok || !hasReserved {
			t.Fatalf("missing platform or reserved rates: %v", rates)
		}
		requireRate(t, rates, "ebs", "0.01")
		requireRate(t, linux, "ondemand", "0.1234567890123456789")
		requireRate(t, reserved, string(instancesapi.ReservedTerm1YearStandardNoUpfront), "0.02")
	})

	t.Run("RDS engine and nested rates", func(t *testing.T) {
		client := clientWithTransport(jsonResponse(`{
			"instanceType":"db.test", "currentGeneration":"Yes", "normalizationSizeFactor":"0.5",
			"pricing":{"cn-north-1":{"14":{"ondemand":0.25,"multi_az":{"ondemand":0.5}},"newEngine":{"ondemand":0.3}}}
		}`))
		instance, err := client.GetChinaInstance(context.Background(), instancesapi.ServiceRDS, "db.test")
		if err != nil {
			t.Fatal(err)
		}
		row := instance.(*instancesapi.RDSInstance)
		engines := row.Pricing[instancesapi.RegionAWSCNNorth1]
		postgres, _ := engines.Group("postgres")
		multiAZ, _ := postgres.Group("multi_az")
		newEngine, _ := engines.Group("newEngine")
		if !row.CurrentGeneration || row.NormalizationSizeFactor != 0.5 || engines["14"] != nil {
			t.Fatalf("RDS row = %#v", row)
		}
		requireRate(t, postgres, "ondemand", "0.25")
		requireRate(t, multiAZ, "ondemand", "0.5")
		requireRate(t, newEngine, "ondemand", "0.3")
	})

	t.Run("Azure preserves GPU descriptions", func(t *testing.T) {
		client := clientWithTransport(jsonResponse(`{
			"instance_type":"test", "GPU":"1/2X A10", "trusted_launch":null, "vcpus_percore":2,
			"storage":{"nvme_ssd":true,"max_write_disks":"4"}
		}`))
		instance, err := client.GetGlobalInstance(context.Background(), instancesapi.ServiceAzure, "test")
		if err != nil {
			t.Fatal(err)
		}
		row := instance.(*instancesapi.AzureInstance)
		if row.GPU != "1/2X A10" || row.TrustedLaunch != nil || row.VCPUsPerCore != 2 ||
			!row.Storage.NVMeSSD || row.Storage.MaxWriteDisks == nil || *row.Storage.MaxWriteDisks != "4" {
			t.Fatalf("Azure row = %#v", row)
		}
	})
}

func requireRate(t *testing.T, terms instancesapi.PricingTerms, key, want string) {
	t.Helper()
	rate, ok := terms.Rate(key)
	if !ok || rate.String() != want {
		t.Fatalf("rate %q = %q (%t), want %q", key, rate, ok, want)
	}
}

func jsonResponse(payload string) roundTripFunc {
	return func(*http.Request) (*http.Response, error) {
		return &http.Response{StatusCode: http.StatusOK, Body: io.NopCloser(strings.NewReader(payload))}, nil
	}
}

func TestFeedRoutesAndPageSizes(t *testing.T) {
	payload := "[" + strings.Repeat(`{"instance_type":"café"}`+",", 100) + `{"instanceType":"last"}]`
	for _, tc := range []struct {
		service instancesapi.Service
		model   instancesapi.Instance
		china   bool
		pages   []int
	}{
		{instancesapi.ServiceEC2, (*instancesapi.EC2Instance)(nil), true, []int{50, 50, 1}},
		{instancesapi.ServiceRDS, (*instancesapi.RDSInstance)(nil), true, []int{50, 50, 1}},
		{instancesapi.ServiceCache, (*instancesapi.CacheInstance)(nil), true, []int{101}},
		{instancesapi.ServiceRedshift, (*instancesapi.RedshiftInstance)(nil), true, []int{101}},
		{instancesapi.ServiceOpenSearch, (*instancesapi.OpenSearchInstance)(nil), true, []int{101}},
		{instancesapi.ServiceAzure, (*instancesapi.AzureInstance)(nil), false, []int{50, 50, 1}},
		{instancesapi.ServiceGCP, (*instancesapi.GCPInstance)(nil), false, []int{50, 50, 1}},
	} {
		for _, dataset := range []string{"global", "china"} {
			if dataset == "china" && !tc.china {
				continue
			}
			t.Run(string(tc.service)+"/"+dataset, func(t *testing.T) {
				body := &trackedBody{Reader: iotest.OneByteReader(strings.NewReader(payload))}
				requested := false
				client := clientWithTransport(func(req *http.Request) (*http.Response, error) {
					requested = true
					wantURL := "https://instances.vantage.sh/"
					if tc.service != instancesapi.ServiceEC2 {
						wantURL += string(tc.service) + "/"
					}
					wantURL += "instances"
					if dataset == "china" {
						wantURL += "-cn"
					}
					wantURL += ".json"
					if req.Method != http.MethodGet || req.URL.String() != wantURL ||
						req.Header.Get("Authorization") != "" || req.Header.Get("Content-Type") != "" ||
						req.UserAgent() != "instances-api-client-go" {
						t.Fatalf("feed request = %s %s %v, want GET %s with public headers", req.Method, req.URL, req.Header, wantURL)
					}
					return &http.Response{StatusCode: http.StatusOK, Body: body}, nil
				})
				ctx := context.Background()
				pages := client.GetAllGlobalInstances(ctx, tc.service)
				if dataset == "china" {
					pages = client.GetAllChinaInstances(ctx, tc.service)
				}
				if requested {
					t.Fatal("feed request started before iteration")
				}
				var sizes []int
				var saved [][]instancesapi.Instance
				for page, err := range pages {
					if err != nil {
						t.Fatal(err)
					}
					sizes = append(sizes, len(page))
					saved = append(saved, page)
				}
				if !slices.Equal(sizes, tc.pages) || !body.closed {
					t.Fatalf("page sizes = %v, closed = %t, want %v and closed", sizes, body.closed, tc.pages)
				}
				first, last := saved[0][0], saved[len(saved)-1][len(saved[len(saved)-1])-1]
				if reflect.TypeOf(first) != reflect.TypeOf(tc.model) ||
					first.Info().InstanceType != "café" || last.Info().InstanceType != "last" {
					t.Fatalf("unexpected stream entries: %#v, %#v", first, last)
				}
			})
		}
	}
}

func TestFeedStopsAndReportsInvalidJSON(t *testing.T) {
	const record = `{"instanceType":"test"}`
	data := "[" + strings.Repeat(record+",", 50) + `{"instanceType":`
	for _, stopEarly := range []bool{true, false} {
		t.Run(fmt.Sprintf("stopEarly=%t", stopEarly), func(t *testing.T) {
			source := strings.NewReader(data)
			body := &trackedBody{Reader: iotest.OneByteReader(source)}
			client := clientWithTransport(func(*http.Request) (*http.Response, error) {
				return &http.Response{StatusCode: http.StatusOK, Body: body}, nil
			})
			seq := client.GetAllGlobalInstances(context.Background(), instancesapi.ServiceEC2)
			if stopEarly {
				for page, err := range seq {
					if err != nil || len(page) != 50 || source.Len() == 0 {
						t.Fatalf("first page size = %d, bytes remaining = %d, err = %v", len(page), source.Len(), err)
					}
					break
				}
			} else {
				if rows, err := instancesapi.CollectPages(seq); rows != nil || err == nil {
					t.Fatalf("CollectPages returned %d rows, err = %v", len(rows), err)
				}
			}
			if !body.closed {
				t.Fatal("response body remained open")
			}
		})
	}
}

func TestTypedErrors(t *testing.T) {
	for _, tc := range []struct {
		status int
		code   string
		want   error
	}{
		{400, "INVALID_REQUEST", (*instancesapi.InvalidRequestError)(nil)},
		{401, "UNAUTHORIZED", (*instancesapi.UnauthorizedError)(nil)},
		{404, "NOT_FOUND", (*instancesapi.NotFoundError)(nil)},
		{429, "RATE_LIMIT_EXCEEDED", (*instancesapi.RateLimitExceededError)(nil)},
		{500, "INTERNAL_SERVER_ERROR", (*instancesapi.InternalServerError)(nil)},
		{503, "UNRECOGNIZED", (*instancesapi.UnknownHTTPError)(nil)},
	} {
		t.Run(tc.code, func(t *testing.T) {
			body := &trackedBody{Reader: strings.NewReader(fmt.Sprintf(`{"code":%q,"error":"details"}`, tc.code))}
			client := clientWithTransport(func(*http.Request) (*http.Response, error) {
				return &http.Response{StatusCode: tc.status, Body: body}, nil
			})
			_, err := client.GetGlobalInstance(context.Background(), instancesapi.ServiceEC2, "test")
			var details *instancesapi.APIError
			if reflect.TypeOf(err) != reflect.TypeOf(tc.want) || !errors.As(err, &details) ||
				details.Status != tc.status || details.StatusText != http.StatusText(tc.status) ||
				details.Code != tc.code || !body.closed {
				t.Fatalf("error = %T %v, details = %#v, closed = %t", err, err, details, body.closed)
			}
			if tc.code != "UNRECOGNIZED" && err.Error() != "details" {
				t.Fatalf("message = %q", err.Error())
			}
		})
	}

	client := clientWithTransport(func(*http.Request) (*http.Response, error) {
		t.Fatal("invalid requests should fail before HTTP")
		return nil, nil
	})
	ctx := context.Background()
	_, err := client.GetGlobalInstance(ctx, instancesapi.ServiceEC2, "")
	var invalid *instancesapi.InvalidRequestError
	if !errors.As(err, &invalid) || invalid.Error() != "Instance type is required" {
		t.Fatalf("empty instance error = %v", err)
	}
	_, err = instancesapi.CollectPages(client.GetAllChinaInstances(ctx, instancesapi.ServiceAzure))
	if !errors.As(err, &invalid) {
		t.Fatalf("unsupported China service error = %v", err)
	}
}

func TestFeedErrors(t *testing.T) {
	for _, tc := range []struct {
		status int
		want   error
	}{
		{404, (*instancesapi.NotFoundError)(nil)},
		{429, (*instancesapi.UnknownHTTPError)(nil)},
	} {
		client := clientWithTransport(func(*http.Request) (*http.Response, error) {
			body := io.NopCloser(strings.NewReader(`{"code":"RATE_LIMIT_EXCEEDED","error":"details"}`))
			return &http.Response{StatusCode: tc.status, Body: body}, nil
		})
		_, err := instancesapi.CollectPages(client.GetAllGlobalInstances(context.Background(), instancesapi.ServiceCache))
		if reflect.TypeOf(err) != reflect.TypeOf(tc.want) {
			t.Fatalf("feed status %d error = %T %v, want %T", tc.status, err, err, tc.want)
		}
	}
}

func TestVirtualInstances(t *testing.T) {
	const wantRequest = `{"service":"ec2","region":"us-east-1","columns":[{"key":"prettyName"},{"key":"costOndemand","filter":"<1","sortDesc":false}],"globalSearch":"","costDuration":"hourly","pricingUnit":"vcpu","currency":"USD","reservedTerm":"yrTerm1Standard.noUpfront"}`
	const response = `{"headers":["Name","Cost"],"instances":{"z.2xlarge":["<span title='x>y'>Fast &amp; compact</span>","<em>&#36;0.125</em>/hour"],"a.large":["Small","N/A"]}}`
	client := clientWithTransport(func(req *http.Request) (*http.Response, error) {
		if req.Method != http.MethodPost || req.URL.String() != "https://instances-api.vantage.sh/api/v1/virtual-instances" ||
			req.Header.Get("Authorization") != "Bearer test-key" || req.Header.Get("Content-Type") != "application/json" {
			t.Fatalf("virtual request = %s %s %v", req.Method, req.URL, req.Header)
		}
		var got, want map[string]any
		if err := json.NewDecoder(req.Body).Decode(&got); err != nil {
			t.Fatal(err)
		}
		if err := json.Unmarshal([]byte(wantRequest), &want); err != nil {
			t.Fatal(err)
		}
		if !reflect.DeepEqual(got, want) {
			t.Fatalf("request body = %#v, want %#v", got, want)
		}
		return jsonResponse(response)(req)
	})
	ascending, filter, search, currency := false, "<1", "", "USD"
	result, err := client.RunVirtualInstances(context.Background(), instancesapi.VirtualInstancesRequest{
		Service: instancesapi.ServiceEC2,
		Region:  instancesapi.RegionAWSUSEast1,
		Columns: []instancesapi.ColumnSpec{
			{Key: instancesapi.ColumnPrettyName},
			{Key: instancesapi.ColumnCostOnDemand, Filter: &filter, SortDesc: &ascending},
		},
		GlobalSearch: &search,
		CostDuration: instancesapi.CostDurationHourly,
		PricingUnit:  instancesapi.PricingUnitVCPU,
		Currency:     &currency,
		ReservedTerm: instancesapi.ReservedTerm1YearStandardNoUpfront,
	})
	if err != nil {
		t.Fatal(err)
	}
	if !slices.Equal(result.Order, []string{"z.2xlarge", "a.large"}) {
		t.Fatalf("row order = %v", result.Order)
	}
	name, price := result.Instances["z.2xlarge"][0], result.Instances["z.2xlarge"][1]
	if name.HeaderText != "Name" || name.Text() != "Fast & compact" ||
		price.HTML != "<em>&#36;0.125</em>/hour" || price.HeaderText != "Cost" || price.Text() != "$0.125/hour" {
		t.Fatalf("virtual cells = %#v, %#v", name, price)
	}
	if value, ok := price.Number(); !ok || value != 0.125 {
		t.Fatalf("numeric cost = %f, %t", value, ok)
	}
	if _, ok := result.Instances["a.large"][1].Number(); ok {
		t.Fatal("N/A was parsed as a number")
	}
}
