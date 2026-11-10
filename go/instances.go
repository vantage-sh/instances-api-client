package instancesapi

import "encoding/json"

// Instance is an EC2, RDS, ElastiCache, Redshift, OpenSearch, Azure, or GCP
// instance. Use Info for common fields and a type assertion for service fields.
type Instance interface {
	Info() InstanceInfo
}

// InstanceInfo holds the fields shared by all seven instance models.
type InstanceInfo struct {
	InstanceType string            `json:"instanceType"`
	PrettyName   string            `json:"prettyName"`
	Regions      map[Region]string `json:"regions"`

	// Attributes preserves source specification keys and values, including
	// provider-specific fields. Pricing and Regions have separate fields.
	Attributes map[string]json.RawMessage `json:"-"`
}

// Info returns the common fields of an instance.
func (info InstanceInfo) Info() InstanceInfo { return info }

// RegionPricing maps a region to its pricing table. Redshift and OpenSearch
// expose rates at this level. The other services group rates by platform or
// engine, with some EC2 rates also available directly.
type RegionPricing map[Region]PricingTerms

// PricingTerms retains the API's pricing keys and JSON values. Use Rate for
// a quoted decimal or JSON number and Group for a nested table.
type PricingTerms map[string]json.RawMessage

// Rate returns the exact decimal representation of a numeric term. It accepts
// both JSON numbers and quoted decimals.
func (terms PricingTerms) Rate(key string) (json.Number, bool) {
	var rate json.Number
	err := json.Unmarshal(terms[key], &rate)
	return rate, err == nil && rate != ""
}

// Group returns a nested table such as a platform, engine, reserved, or multi_az.
func (terms PricingTerms) Group(key string) (PricingTerms, bool) {
	var group PricingTerms
	err := json.Unmarshal(terms[key], &group)
	return group, err == nil && group != nil
}

// EC2VPC contains network interface limits.
type EC2VPC struct {
	MaxENIs   int `json:"maxEnis"`
	IPsPerENI int `json:"ipsPerEni"`
}

// EC2Storage describes EC2 instance store devices.
type EC2Storage struct {
	SSD                        bool    `json:"ssd"`
	TrimSupport                bool    `json:"trimSupport"`
	NVMeSSD                    bool    `json:"nvmeSsd"`
	StorageNeedsInitialization bool    `json:"storageNeedsInitialization"`
	IncludesSwapPartition      bool    `json:"includesSwapPartition"`
	Devices                    int     `json:"devices"`
	Size                       float64 `json:"size"`
	SizeUnit                   string  `json:"sizeUnit"`
}

// EC2Instance describes an EC2 instance in either dataset.
type EC2Instance struct {
	InstanceInfo
	Family                   string            `json:"family"`
	VCPU                     float64           `json:"vCPU"`
	Memory                   float64           `json:"memory"`
	Arch                     []string          `json:"arch"`
	NetworkPerformance       *string           `json:"networkPerformance"`
	PhysicalProcessor        string            `json:"physicalProcessor"`
	Generation               string            `json:"generation"`
	CurrentGeneration        bool              `json:"currentGeneration"`
	GPU                      float64           `json:"GPU"`
	FPGA                     float64           `json:"FPGA"`
	EBSAsNVMe                bool              `json:"ebsAsNvme"`
	VPC                      *EC2VPC           `json:"vpc"`
	EBSOptimized             bool              `json:"ebsOptimized"`
	EBSBaselineThroughput    float64           `json:"ebsBaselineThroughput"`
	EBSBaselineIOPS          float64           `json:"ebsBaselineIops"`
	EBSBaselineBandwidth     float64           `json:"ebsBaselineBandwidth"`
	EBSThroughput            float64           `json:"ebsThroughput"`
	EBSIOPS                  float64           `json:"ebsIops"`
	EBSMaxBandwidth          float64           `json:"ebsMaxBandwidth"`
	ECU                      float64           `json:"ECU"`
	IntelAVX512              *bool             `json:"intelAvx512"`
	IntelAVX2                *bool             `json:"intelAvx2"`
	IntelAVX                 *bool             `json:"intelAvx"`
	IntelTurbo               *bool             `json:"intelTurbo"`
	ClockSpeedGHz            *string           `json:"clockSpeedGhz"`
	EnhancedNetworking       bool              `json:"enhancedNetworking"`
	Pricing                  RegionPricing     `json:"pricing"`
	LinuxVirtualizationTypes []string          `json:"linuxVirtualizationTypes"`
	VPCOnly                  bool              `json:"vpcOnly"`
	BasePerformance          *float64          `json:"basePerformance"`
	BurstMinutes             *float64          `json:"burstMinutes"`
	GPUModel                 *string           `json:"GPUModel"`
	ComputeCapability        *float64          `json:"computeCapability"`
	GPUMemory                *string           `json:"GPUMemory"`
	PlacementGroupSupport    bool              `json:"placementGroupSupport"`
	Storage                  *EC2Storage       `json:"storage"`
	EMR                      bool              `json:"emr"`
	IPv6Support              bool              `json:"ipv6Support"`
	CoreMarkIterationsSecond *float64          `json:"coremarkIterationsSecond"`
	GPUArchitectures         []string          `json:"gpuArchitectures"`
	GPUCurrentTempAvgCelsius *float64          `json:"gpuCurrentTempAvgCelsius"`
	FFmpegUsedCUDA           *bool             `json:"ffmpegUsedCuda"`
	FFmpegSpeed              *float64          `json:"ffmpegSpeed"`
	FFmpegFPS                *float64          `json:"ffmpegFPS"`
	GPUPowerDrawWattsAvg     *float64          `json:"gpuPowerDrawWattsAvg"`
	GPUClocks                []json.RawMessage `json:"gpuClocks"`
	NUMANodeCount            *int              `json:"numaNodeCount"`
	UsesNUMAArchitecture     *bool             `json:"usesNumaArchitecture"`
	MaxNUMADistance          *int              `json:"maxNumaDistance"`
	CoreCountPerNUMANode     *int              `json:"coreCountPerNumaNode"`
	ThreadCountPerNUMANode   *int              `json:"threadCountPerNumaNode"`
	MemoryPerNUMANodeMB      *float64          `json:"memoryPerNumaNodeMB"`
	L3PerNUMANodeMB          *float64          `json:"l3PerNumaNodeMB"`
	L3Shared                 *bool             `json:"l3Shared"`
}

// RDSInstance describes an RDS instance in either dataset.
type RDSInstance struct {
	InstanceInfo
	Arch                    string        `json:"arch"`
	CurrentGeneration       bool          `json:"currentGeneration"`
	EBSBaselineBandwidth    float64       `json:"ebsBaselineBandwidth"`
	EBSBaselineIOPS         float64       `json:"ebsBaselineIops"`
	EBSBaselineThroughput   float64       `json:"ebsBaselineThroughput"`
	EBSIOPS                 float64       `json:"ebsIops"`
	EBSMaxBandwidth         float64       `json:"ebsMaxBandwidth"`
	EBSOptimized            bool          `json:"ebsOptimized"`
	EBSThroughput           float64       `json:"ebsThroughput"`
	InstanceFamily          string        `json:"instanceFamily"`
	InstanceTypeFamily      string        `json:"instanceTypeFamily"`
	Memory                  float64       `json:"memory"`
	NetworkPerformance      *string       `json:"networkPerformance"`
	NormalizationSizeFactor float64       `json:"normalizationSizeFactor"`
	PhysicalProcessor       string        `json:"physicalProcessor"`
	Pricing                 RegionPricing `json:"pricing"`
	ProcessorArchitecture   string        `json:"processorArchitecture"`
	RegionCode              string        `json:"regionCode"`
	Storage                 string        `json:"storage"`
	VCPU                    float64       `json:"vcpu"`
}

// CacheInstance describes an ElastiCache instance in either dataset.
type CacheInstance struct {
	InstanceInfo
	CurrentGeneration  bool          `json:"currentGeneration"`
	InstanceFamily     string        `json:"instanceFamily"`
	MaxClients         float64       `json:"maxClients"`
	Memory             float64       `json:"memory"`
	NetworkPerformance *string       `json:"networkPerformance"`
	Pricing            RegionPricing `json:"pricing"`
	RegionCode         string        `json:"regionCode"`
	VCPU               float64       `json:"vcpu"`
}

// RedshiftInstance describes a Redshift instance in either dataset.
type RedshiftInstance struct {
	InstanceInfo
	CurrentGeneration bool          `json:"currentGeneration"`
	ECU               string        `json:"ecu"`
	Family            string        `json:"family"`
	IO                string        `json:"io"`
	Memory            float64       `json:"memory"`
	NodeRange         string        `json:"nodeRange"`
	Pricing           RegionPricing `json:"pricing"`
	RegionCode        string        `json:"regionCode"`
	SlicesPerNode     float64       `json:"slicesPerNode"`
	Storage           string        `json:"storage"`
	StorageCapacity   string        `json:"storageCapacity"`
	StoragePerNode    string        `json:"storagePerNode"`
	UsageFamily       string        `json:"usageFamily"`
	VCPU              float64       `json:"vcpu"`
}

// OpenSearchInstance describes an OpenSearch instance in either dataset.
type OpenSearchInstance struct {
	InstanceInfo
	CurrentGeneration bool          `json:"currentGeneration"`
	ECU               string        `json:"ecu"`
	InstanceFamily    string        `json:"instanceFamily"`
	MaxEBSGP2         string        `json:"maxEbsGp2"`
	MaxEBSGP3         string        `json:"maxEbsGp3"`
	MaxHTTPPayload    string        `json:"maxHttpPayload"`
	MemoryGiB         float64       `json:"memoryGib"`
	MinEBS            string        `json:"minEbs"`
	Pricing           RegionPricing `json:"pricing"`
	RegionCode        string        `json:"regionCode"`
	VCPU              float64       `json:"vcpu"`
}

// AzureStorage describes the VM's local storage.
type AzureStorage struct {
	NVMeSSD       bool    `json:"nvmeSsd"`
	Devices       int     `json:"devices"`
	Size          float64 `json:"size"`
	MaxWriteDisks *string `json:"maxWriteDisks"`
}

// AzureInstance describes an Azure VM.
type AzureInstance struct {
	InstanceInfo
	Family   string  `json:"family"`
	Category string  `json:"category"`
	VCPU     float64 `json:"vcpu"`
	Memory   float64 `json:"memory"`
	Size     float64 `json:"size"`

	// GPU holds a float64 count, a string description such as "1/2X A10",
	// or nil when absent.
	GPU                   any           `json:"GPU"`
	Pricing               RegionPricing `json:"pricing"`
	PrettyNameAzure       string        `json:"prettyNameAzure"`
	Storage               AzureStorage  `json:"storage"`
	ACU                   float64       `json:"ACU"`
	MemoryMaintenance     bool          `json:"memoryMaintenance"`
	HyperVGenerations     *string       `json:"hypervGenerations"`
	Arch                  []string      `json:"arch"`
	LowPriority           bool          `json:"lowPriority"`
	PremiumIO             bool          `json:"premiumIo"`
	VMDeployment          *string       `json:"vmDeployment"`
	VCPUsAvailable        float64       `json:"vcpusAvailable"`
	VCPUsPerCore          float64       `json:"vcpusPercore"`
	IOPS                  *float64      `json:"iops"`
	ReadIO                float64       `json:"readIo"`
	WriteIO               float64       `json:"writeIo"`
	CachedDisk            float64       `json:"cachedDisk"`
	UncachedDisk          float64       `json:"uncachedDisk"`
	UncachedDiskIO        float64       `json:"uncachedDiskIo"`
	Encryption            bool          `json:"encryption"`
	CapacitySupport       bool          `json:"capacitySupport"`
	AcceleratedNetworking bool          `json:"acceleratedNetworking"`
	RDMA                  bool          `json:"rdma"`
	UltraSSD              bool          `json:"ultraSsd"`
	Hibernation           *bool         `json:"hibernation"`
	TrustedLaunch         *bool         `json:"trustedLaunch"`
	Confidential          bool          `json:"confidential"`
}

// GCPInstance describes a GCP Compute Engine instance.
type GCPInstance struct {
	InstanceInfo
	Family             string        `json:"family"`
	VCPU               float64       `json:"vCPU"`
	Memory             float64       `json:"memory"`
	NetworkPerformance *string       `json:"networkPerformance"`
	Generation         string        `json:"generation"`
	GPU                float64       `json:"GPU"`
	Pricing            RegionPricing `json:"pricing"`
	LocalSSD           bool          `json:"localSsd"`
	SharedCPU          bool          `json:"sharedCpu"`
	ComputeOptimized   bool          `json:"computeOptimized"`
}
