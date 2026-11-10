package instancesapi

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"golang.org/x/net/html"
)

// CostDuration sets the time granularity for displayed prices.
type CostDuration string

const (
	CostDurationSecondly CostDuration = "secondly"
	CostDurationMinutely CostDuration = "minutely"
	CostDurationHourly   CostDuration = "hourly"
	CostDurationDaily    CostDuration = "daily"
	CostDurationWeekly   CostDuration = "weekly"
	CostDurationMonthly  CostDuration = "monthly"
	CostDurationAnnually CostDuration = "annually"
)

// PricingUnit sets the basis for displayed prices.
type PricingUnit string

const (
	PricingUnitInstance PricingUnit = "instance"
	PricingUnitVCPU     PricingUnit = "vcpu"
	PricingUnitMemory   PricingUnit = "memory"
	PricingUnitECU      PricingUnit = "ecu" // AWS
	PricingUnitACU      PricingUnit = "acu" // Azure
)

// ReservedTerm identifies an AWS or Azure reservation term.
type ReservedTerm string

const (
	ReservedTerm1YearStandardNoUpfront         ReservedTerm = "yrTerm1Standard.noUpfront"
	ReservedTerm1YearStandardPartialUpfront    ReservedTerm = "yrTerm1Standard.partialUpfront"
	ReservedTerm1YearStandardAllUpfront        ReservedTerm = "yrTerm1Standard.allUpfront"
	ReservedTerm3YearStandardNoUpfront         ReservedTerm = "yrTerm3Standard.noUpfront"
	ReservedTerm3YearStandardPartialUpfront    ReservedTerm = "yrTerm3Standard.partialUpfront"
	ReservedTerm3YearStandardAllUpfront        ReservedTerm = "yrTerm3Standard.allUpfront"
	ReservedTerm1YearConvertibleNoUpfront      ReservedTerm = "yrTerm1Convertible.noUpfront"
	ReservedTerm1YearConvertiblePartialUpfront ReservedTerm = "yrTerm1Convertible.partialUpfront"
	ReservedTerm1YearConvertibleAllUpfront     ReservedTerm = "yrTerm1Convertible.allUpfront"
	ReservedTerm3YearConvertibleNoUpfront      ReservedTerm = "yrTerm3Convertible.noUpfront"
	ReservedTerm3YearConvertiblePartialUpfront ReservedTerm = "yrTerm3Convertible.partialUpfront"
	ReservedTerm3YearConvertibleAllUpfront     ReservedTerm = "yrTerm3Convertible.allUpfront"
	ReservedTerm1YearStandardHybridBenefit     ReservedTerm = "yrTerm1Standard.hybridbenefit"
	ReservedTerm3YearStandardHybridBenefit     ReservedTerm = "yrTerm3Standard.hybridbenefit"
)

// ColumnSpec selects a virtual column and optionally filters or sorts it.
// SortDesc is nil for no sort, false for ascending, or true for descending.
type ColumnSpec struct {
	Key      ColumnKey `json:"key"`
	Filter   *string   `json:"filter,omitempty"`
	SortDesc *bool     `json:"sortDesc,omitempty"`
}

// VirtualInstancesRequest describes a virtual table query. The API validates
// the region, column keys, pricing unit, and reservation term for the service.
type VirtualInstancesRequest struct {
	Service      Service      `json:"service"`
	Region       Region       `json:"region"`
	Columns      []ColumnSpec `json:"columns"`
	GlobalSearch *string      `json:"globalSearch,omitempty"`
	CostDuration CostDuration `json:"costDuration,omitempty"`
	PricingUnit  PricingUnit  `json:"pricingUnit,omitempty"`
	Currency     *string      `json:"currency,omitempty"`
	ReservedTerm ReservedTerm `json:"reservedTerm,omitempty"`
}

// VirtualInstancesResult indexes rows by instance type. Order contains the
// instance types in the order sent by the API, including any requested sort.
type VirtualInstancesResult struct {
	Instances map[string][]VirtualInstancesColumn
	Order     []string
}

// VirtualInstancesColumn holds a rendered cell and the corresponding header.
type VirtualInstancesColumn struct {
	HTML       string
	HeaderText string
}

// Text returns the cell's text content with HTML entities decoded.
func (column VirtualInstancesColumn) Text() string {
	tokens := html.NewTokenizer(strings.NewReader(column.HTML))
	var text strings.Builder
	for {
		switch tokens.Next() {
		case html.TextToken:
			text.Write(tokens.Text())
		case html.ErrorToken:
			return text.String()
		}
	}
}

var firstNumber = regexp.MustCompile(`[0-9]+(\.[0-9]+)?`)

// Number returns the first numeric substring in the cell text, if present.
func (column VirtualInstancesColumn) Number() (float64, bool) {
	match := firstNumber.FindString(column.Text())
	if match == "" {
		return 0, false
	}
	number, _ := strconv.ParseFloat(match, 64)
	return number, true
}

// RunVirtualInstances runs an authenticated query against the virtual table.
func (c *APIV1Client) RunVirtualInstances(ctx context.Context, request VirtualInstancesRequest) (VirtualInstancesResult, error) {
	body, err := c.apiRequest(ctx, http.MethodPost, "/api/v1/virtual-instances", request, true)
	if err != nil {
		return VirtualInstancesResult{}, err
	}
	defer body.Close()

	result, err := decodeVirtualInstances(body)
	if err != nil {
		return VirtualInstancesResult{}, fmt.Errorf("decode virtual instances: %w", err)
	}
	return result, nil
}

func decodeVirtualInstances(body io.Reader) (VirtualInstancesResult, error) {
	var wire struct {
		Headers   []string        `json:"headers"`
		Instances json.RawMessage `json:"instances"`
	}
	raw, err := io.ReadAll(body)
	if err != nil {
		return VirtualInstancesResult{}, err
	}
	if err := json.Unmarshal(raw, &wire); err != nil {
		return VirtualInstancesResult{}, err
	}
	if wire.Headers == nil {
		return VirtualInstancesResult{}, fmt.Errorf("expected a headers array")
	}

	// Decode object entries in wire order so Go's map iteration cannot lose the
	// sort order returned by the virtual query.
	decoder := json.NewDecoder(bytes.NewReader(wire.Instances))
	start, err := decoder.Token()
	if err != nil {
		return VirtualInstancesResult{}, err
	}
	if start != json.Delim('{') {
		return VirtualInstancesResult{}, fmt.Errorf("expected an instances object")
	}
	result := VirtualInstancesResult{
		Instances: make(map[string][]VirtualInstancesColumn),
		Order:     make([]string, 0),
	}
	for decoder.More() {
		key, err := decoder.Token()
		if err != nil {
			return VirtualInstancesResult{}, err
		}
		instanceType := key.(string) // The decoder yields a string for an object key.
		var cells []string
		if err := decoder.Decode(&cells); err != nil {
			return VirtualInstancesResult{}, err
		}
		if cells == nil || len(cells) > len(wire.Headers) {
			return VirtualInstancesResult{}, fmt.Errorf("invalid cells for instance %q", instanceType)
		}
		columns := make([]VirtualInstancesColumn, len(cells))
		for i, cell := range cells {
			columns[i] = VirtualInstancesColumn{HTML: cell, HeaderText: wire.Headers[i]}
		}
		if _, exists := result.Instances[instanceType]; !exists {
			result.Order = append(result.Order, instanceType)
		}
		result.Instances[instanceType] = columns
	}
	return result, nil
}
