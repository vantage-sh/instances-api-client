package instancesapi

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
)

// APIError holds the common details of an API or feed error. Use errors.As to
// access it from any of the specific error types. Status is zero for local
// validation failures.
type APIError struct {
	Status     int
	StatusText string
	Code       string
	Message    string
}

func (e *APIError) Error() string { return e.Message }

// InvalidRequestError indicates a missing input or a rejected API request.
type InvalidRequestError struct{ APIError }

func (e *InvalidRequestError) Unwrap() error { return &e.APIError }

// UnauthorizedError indicates that the API rejected the credentials.
type UnauthorizedError struct{ APIError }

func (e *UnauthorizedError) Unwrap() error { return &e.APIError }

// InternalServerError indicates an API failure reported by the server.
type InternalServerError struct{ APIError }

func (e *InternalServerError) Unwrap() error { return &e.APIError }

// RateLimitExceededError indicates that the API rate limit was exceeded.
type RateLimitExceededError struct{ APIError }

func (e *RateLimitExceededError) Unwrap() error { return &e.APIError }

// NotFoundError indicates a missing instance, family, or public feed.
type NotFoundError struct{ APIError }

func (e *NotFoundError) Unwrap() error { return &e.APIError }

// UnknownHTTPError records an HTTP response without a recognized API error.
type UnknownHTTPError struct{ APIError }

func (e *UnknownHTTPError) Unwrap() error { return &e.APIError }

func invalidRequest(message string) error {
	return &InvalidRequestError{APIError{Code: "INVALID_REQUEST", Message: message}}
}

func httpErrorDetails(res *http.Response) APIError {
	_, reason, _ := strings.Cut(res.Status, " ")
	if reason == "" {
		reason = http.StatusText(res.StatusCode)
	}
	return APIError{Status: res.StatusCode, StatusText: reason}
}

func unknownHTTPError(details APIError) error {
	details.Message = strings.TrimSpace(fmt.Sprintf("Unknown HTTP error: %d %s", details.Status, details.StatusText))
	return &UnknownHTTPError{details}
}

func apiResponseError(res *http.Response) error {
	details := httpErrorDetails(res)
	body, err := io.ReadAll(io.LimitReader(res.Body, 1<<20))
	if err != nil {
		return unknownHTTPError(details)
	}
	var payload struct {
		Code  string          `json:"code"`
		Error json.RawMessage `json:"error"`
	}
	if err := json.Unmarshal(body, &payload); err != nil {
		return unknownHTTPError(details)
	}

	details.Code = payload.Code
	if err := json.Unmarshal(payload.Error, &details.Message); err != nil || details.Message == "" {
		details.Message = string(body)
	}
	switch payload.Code {
	case "INVALID_REQUEST":
		return &InvalidRequestError{details}
	case "UNAUTHORIZED":
		return &UnauthorizedError{details}
	case "INTERNAL_SERVER_ERROR":
		return &InternalServerError{details}
	case "RATE_LIMIT_EXCEEDED":
		return &RateLimitExceededError{details}
	case "NOT_FOUND":
		return &NotFoundError{details}
	default:
		return unknownHTTPError(details)
	}
}
