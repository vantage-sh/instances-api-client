package instancesapi

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"iter"
	"net/http"
)

const feedPageSize = 50

// GetAllGlobalInstances returns a lazy iterator over the public global feed.
// Each iteration opens a fresh request. Breaking the loop closes the response.
func (c *APIV1Client) GetAllGlobalInstances(ctx context.Context, service Service) iter.Seq2[[]Instance, error] {
	return c.getAllInstances(ctx, service, global)
}

// GetAllChinaInstances returns a lazy iterator over the public AWS China feed.
// Each iteration opens a fresh request. Breaking the loop closes the response.
func (c *APIV1Client) GetAllChinaInstances(ctx context.Context, service Service) iter.Seq2[[]Instance, error] {
	return c.getAllInstances(ctx, service, china)
}

// CollectPages flattens a page iterator into a slice. A stream error returns
// the error and discards the accumulated slice.
func CollectPages[T any](pages iter.Seq2[[]T, error]) ([]T, error) {
	items := make([]T, 0)
	for page, err := range pages {
		if err != nil {
			return nil, err
		}
		items = append(items, page...)
	}
	return items, nil
}

func (c *APIV1Client) getAllInstances(ctx context.Context, service Service, data dataset) iter.Seq2[[]Instance, error] {
	return func(yield func([]Instance, error) bool) {
		err := c.readFeed(ctx, service, data, func(page []Instance) bool {
			return yield(page, nil)
		})
		if err != nil {
			yield(nil, err)
		}
	}
}

func (c *APIV1Client) readFeed(ctx context.Context, service Service, data dataset, yield func([]Instance) bool) error {
	if err := validateService(service, data); err != nil {
		return err
	}
	path := "/"
	if service != ServiceEC2 {
		path += string(service) + "/"
	}
	if data == china {
		path += "instances-cn.json"
	} else {
		path += "instances.json"
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, feedBaseURL+path, nil)
	if err != nil {
		return err
	}
	res, err := c.do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.StatusCode == http.StatusNotFound {
		details := httpErrorDetails(res)
		details.Code, details.Message = "NOT_FOUND", "Instance group not found"
		return &NotFoundError{details}
	}
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return unknownHTTPError(httpErrorDetails(res))
	}

	pageSize := feedPageSize
	switch service {
	case ServiceCache, ServiceRedshift, ServiceOpenSearch:
		pageSize = 0
	}
	return decodePages(res.Body, service, pageSize, yield)
}

// decodePages reads one JSON array. A zero page size keeps the entire array
// together and yields an empty page for an empty array.
func decodePages(body io.Reader, service Service, pageSize int, yield func([]Instance) bool) error {
	decoder := json.NewDecoder(body)
	start, err := decoder.Token()
	if err != nil {
		return fmt.Errorf("read %s instance array: %w", service, err)
	}
	if start != json.Delim('[') {
		return fmt.Errorf("read %s instance array: expected a JSON array", service)
	}

	page := make([]Instance, 0, pageSize)
	for decoder.More() {
		var raw json.RawMessage
		if err := decoder.Decode(&raw); err != nil {
			return fmt.Errorf("read %s instance: %w", service, err)
		}
		instance, err := decodeInstance(service, raw)
		if err != nil {
			return err
		}
		page = append(page, instance)
		if len(page) == pageSize {
			if !yield(page) {
				return nil
			}
			page = make([]Instance, 0, pageSize)
		}
	}
	if _, err := decoder.Token(); err != nil {
		return fmt.Errorf("finish %s instance array: %w", service, err)
	}
	if _, err := decoder.Token(); !errors.Is(err, io.EOF) {
		if err == nil {
			err = errors.New("unexpected data after the JSON array")
		}
		return fmt.Errorf("finish %s instance array: %w", service, err)
	}
	if len(page) != 0 || pageSize == 0 {
		yield(page)
	}
	return nil
}
