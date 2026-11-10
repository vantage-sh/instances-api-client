// Package instancesapi provides a client for the Vantage Instances API.
package instancesapi

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
)

const (
	apiBaseURL  = "https://instances-api.vantage.sh"
	feedBaseURL = "https://instances.vantage.sh"
	userAgent   = "instances-api-client-go"
)

// Service identifies a cloud service in API paths and virtual queries.
type Service string

const (
	ServiceEC2        Service = "ec2"
	ServiceRDS        Service = "rds"
	ServiceCache      Service = "cache"
	ServiceRedshift   Service = "redshift"
	ServiceOpenSearch Service = "opensearch"
	ServiceAzure      Service = "azure"
	ServiceGCP        Service = "gcp"
)

type dataset string

const (
	global dataset = "global"
	china  dataset = "china"
)

// APIV1Client queries instance specifications and pricing. Clients can be reused
// across goroutines.
type APIV1Client struct {
	apiKey     string
	httpClient *http.Client
}

// ClientOption configures a client when it is created.
type ClientOption func(*APIV1Client)

// WithHTTPClient sets the HTTP client for both API calls and public feeds.
// A nil client uses http.DefaultClient.
func WithHTTPClient(client *http.Client) ClientOption {
	return func(c *APIV1Client) {
		c.httpClient = client
	}
}

// NewAPIV1Client constructs a client with a Bearer token for authenticated calls.
// An empty apiKey is sufficient for family lookups and public feeds.
func NewAPIV1Client(apiKey string, options ...ClientOption) *APIV1Client {
	client := &APIV1Client{apiKey: apiKey}
	for _, option := range options {
		option(client)
	}
	return client
}

// GetGlobalInstance fetches one instance from the global dataset. The returned
// Instance has the concrete model for service, such as *EC2Instance.
func (c *APIV1Client) GetGlobalInstance(ctx context.Context, service Service, instanceType string) (Instance, error) {
	return c.getInstance(ctx, service, instanceType, global)
}

// GetChinaInstance fetches one instance from the AWS China dataset.
func (c *APIV1Client) GetChinaInstance(ctx context.Context, service Service, instanceType string) (Instance, error) {
	return c.getInstance(ctx, service, instanceType, china)
}

// GetGlobalInstanceFamily fetches a family of global instances without a token.
func (c *APIV1Client) GetGlobalInstanceFamily(ctx context.Context, service Service, family string) ([]Instance, error) {
	return c.getInstanceFamily(ctx, service, family, global)
}

// GetChinaInstanceFamily fetches a family of AWS China instances without a token.
func (c *APIV1Client) GetChinaInstanceFamily(ctx context.Context, service Service, family string) ([]Instance, error) {
	return c.getInstanceFamily(ctx, service, family, china)
}

func (c *APIV1Client) getInstance(ctx context.Context, service Service, instanceType string, data dataset) (Instance, error) {
	if instanceType == "" {
		return nil, invalidRequest("Instance type is required")
	}
	if err := validateService(service, data); err != nil {
		return nil, err
	}

	path := fmt.Sprintf("/api/v1/instances/%s/%s/%s", service, escapeSegment(instanceType), data)
	body, err := c.apiRequest(ctx, http.MethodGet, path, nil, true)
	if err != nil {
		return nil, err
	}
	defer body.Close()

	raw, err := io.ReadAll(body)
	if err != nil {
		return nil, err
	}
	return decodeInstance(service, raw)
}

func (c *APIV1Client) getInstanceFamily(ctx context.Context, service Service, family string, data dataset) ([]Instance, error) {
	if err := validateService(service, data); err != nil {
		return nil, err
	}
	path := fmt.Sprintf("/api/v1/instances/%s/families/%s/%s", service, escapeSegment(family), data)
	body, err := c.apiRequest(ctx, http.MethodGet, path, nil, false)
	if err != nil {
		return nil, err
	}
	defer body.Close()

	var instances []Instance
	err = decodePages(body, service, 0, func(page []Instance) bool {
		instances = page
		return true
	})
	return instances, err
}

func (c *APIV1Client) apiRequest(ctx context.Context, method, path string, payload any, authenticated bool) (io.ReadCloser, error) {
	var body io.Reader
	if payload != nil {
		data, err := json.Marshal(payload)
		if err != nil {
			return nil, fmt.Errorf("encode request: %w", err)
		}
		body = bytes.NewReader(data)
	}
	req, err := http.NewRequestWithContext(ctx, method, apiBaseURL+path, body)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	if authenticated {
		req.Header.Set("Authorization", "Bearer "+c.apiKey)
	}
	res, err := c.do(req)
	if err != nil {
		return nil, err
	}
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		defer res.Body.Close()
		return nil, apiResponseError(res)
	}
	return res.Body, nil
}

func (c *APIV1Client) do(req *http.Request) (*http.Response, error) {
	req.Header.Set("User-Agent", userAgent)
	client := c.httpClient
	if client == nil {
		client = http.DefaultClient
	}
	return client.Do(req)
}

func validateService(service Service, data dataset) error {
	switch service {
	case ServiceEC2, ServiceRDS, ServiceCache, ServiceRedshift, ServiceOpenSearch:
		return nil
	case ServiceAzure, ServiceGCP:
		if data == global {
			return nil
		}
	}
	return invalidRequest(fmt.Sprintf("Unsupported %s service: %q", data, service))
}

func escapeSegment(segment string) string {
	// QueryEscape encodes reserved characters, including those allowed in a
	// path by PathEscape. Spaces in a path segment use percent encoding.
	return strings.ReplaceAll(url.QueryEscape(segment), "+", "%20")
}
