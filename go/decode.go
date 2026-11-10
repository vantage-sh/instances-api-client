package instancesapi

import (
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"slices"
	"strconv"
	"strings"
)

var (
	keySeparators = strings.NewReplacer("-", "", "_", "")
	rdsEngines    = map[string]string{
		"14":  "postgres",
		"2":   "mysql",
		"10":  "sqlServerExpress",
		"11":  "sqlServerWeb",
		"12":  "sqlServerStandard",
		"15":  "sqlServerEnterprise",
		"21":  "auroraPgMySQL",
		"211": "auroraIoOptimized",
		"18":  "mariadb",
		"5":   "oracleEnterprise",
	}
)

func decodeInstance(service Service, raw json.RawMessage) (Instance, error) {
	instance, err := unmarshalInstance(service, raw)
	if err != nil {
		return nil, fmt.Errorf("decode %s instance: %w", service, err)
	}
	return instance, nil
}

func unmarshalInstance(service Service, raw json.RawMessage) (Instance, error) {
	var fields map[string]json.RawMessage
	if err := json.Unmarshal(raw, &fields); err != nil {
		return nil, err
	}
	if fields == nil {
		return nil, errors.New("expected a JSON object")
	}

	var instance Instance
	var info *InstanceInfo
	var pricing any
	switch service {
	case ServiceEC2:
		row := new(EC2Instance)
		instance, info, pricing = row, &row.InstanceInfo, &row.Pricing
	case ServiceRDS:
		row := new(RDSInstance)
		instance, info, pricing = row, &row.InstanceInfo, &row.Pricing
	case ServiceCache:
		row := new(CacheInstance)
		instance, info, pricing = row, &row.InstanceInfo, &row.Pricing
	case ServiceRedshift:
		row := new(RedshiftInstance)
		instance, info, pricing = row, &row.InstanceInfo, &row.Pricing
	case ServiceOpenSearch:
		row := new(OpenSearchInstance)
		instance, info, pricing = row, &row.InstanceInfo, &row.Pricing
	case ServiceAzure:
		row := new(AzureInstance)
		instance, info, pricing = row, &row.InstanceInfo, &row.Pricing
	case ServiceGCP:
		row := new(GCPInstance)
		instance, info, pricing = row, &row.InstanceInfo, &row.Pricing
	default:
		return nil, fmt.Errorf("unknown service %q", service)
	}

	spec := canonicalFields(fields)
	// The pricing subtree can be large. Decode it directly and keep region,
	// platform, and term keys intact.
	if rates := spec["pricing"]; rates != nil {
		if err := json.Unmarshal(rates, pricing); err != nil {
			return nil, fmt.Errorf("pricing: %w", err)
		}
		delete(spec, "pricing")
	}
	if row, ok := instance.(*RDSInstance); ok {
		for _, engines := range row.Pricing {
			for id, name := range rdsEngines {
				if terms, ok := engines[id]; ok {
					engines[name] = terms
					delete(engines, id)
				}
			}
		}
	}

	if err := normalizeSpec(service, spec); err != nil {
		return nil, err
	}
	normalized, err := json.Marshal(spec)
	if err != nil {
		return nil, err
	}
	if err := json.Unmarshal(normalized, instance); err != nil {
		return nil, err
	}
	for key := range fields {
		switch canonicalKey(key) {
		case "pricing", "regions":
			delete(fields, key)
		}
	}
	info.Attributes = fields
	return instance, nil
}

func canonicalKey(key string) string {
	return strings.ToLower(keySeparators.Replace(key))
}

func canonicalFields(fields map[string]json.RawMessage) map[string]json.RawMessage {
	keys := make([]string, 0, len(fields))
	for key := range fields {
		keys = append(keys, key)
	}
	// Some feeds include both camelCase and snake_case aliases. Keep the
	// tie-break deterministic even when the input comes from a map.
	slices.Sort(keys)
	result := make(map[string]json.RawMessage, len(fields))
	for _, key := range keys {
		result[canonicalKey(key)] = fields[key]
	}
	return result
}

func normalizeSpec(service Service, spec map[string]json.RawMessage) error {
	if raw := spec["currentgeneration"]; len(raw) > 0 && raw[0] == '"' {
		var generation string
		if err := json.Unmarshal(raw, &generation); err != nil {
			return err
		}
		spec["currentgeneration"] = strconv.AppendBool(nil, generation == "Yes")
	}
	if service == ServiceEC2 {
		if raw := spec["generation"]; raw != nil {
			var generation string
			if err := json.Unmarshal(raw, &generation); err != nil {
				return err
			}
			spec["currentgeneration"] = strconv.AppendBool(nil, generation == "current")
		}
		// The EC2 feeds use a number where the API model also allows text.
		if raw := spec["gpumemory"]; len(raw) > 0 && (raw[0] == '-' || raw[0] >= '0' && raw[0] <= '9') {
			spec["gpumemory"] = strconv.AppendQuote(nil, string(raw))
		}
	}

	for _, key := range []string{"gpu", "memorygib", "vcpu", "slicespernode", "maxclients", "memory", "normalizationsizefactor"} {
		raw := spec[key]
		if len(raw) == 0 || raw[0] != '"' {
			continue
		}
		var text string
		if err := json.Unmarshal(raw, &text); err != nil {
			return err
		}
		number, err := strconv.ParseFloat(strings.TrimSpace(text), 64)
		switch {
		case err == nil && !math.IsNaN(number) && !math.IsInf(number, 0):
			spec[key] = strconv.AppendFloat(nil, number, 'g', -1, 64)
		case service == ServiceAzure && key == "gpu":
			// Azure publishes fractional GPU descriptions such as "1/2X A10".
		default:
			// The original value remains available in Attributes.
			delete(spec, key)
		}
	}
	for _, key := range []string{"vpc", "storage"} {
		raw := spec[key]
		if len(raw) == 0 || raw[0] != '{' {
			continue
		}
		var nested map[string]json.RawMessage
		if err := json.Unmarshal(raw, &nested); err != nil {
			return err
		}
		value, err := json.Marshal(canonicalFields(nested))
		if err != nil {
			return err
		}
		spec[key] = value
	}
	return nil
}
