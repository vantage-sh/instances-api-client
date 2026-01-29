type EC2VPC = {
    maxEnis: number;
    ipsPerEni: number;
};

type EC2PlatformPricing = {
    ondemand?: string;
    reserved?: {
        [K in AWSReservedTerms]?: string;
    };
    spot_min?: string;
    spot_max?: string;
    pct_interrupt?: string;
    pct_savings_od?: number;
    spot_avg?: string;
};

type EC2Platform =
    | "dedicated"
    | "linux"
    | "linuxSQL"
    | "linuxSQLEnterprise"
    | "linuxSQLWeb"
    | "mswin"
    | "mswinSQL"
    | "mswinSQLEnterprise"
    | "mswinSQLWeb"
    | "rhel"
    | "rhelSQL"
    | "rhelSQLEnterprise"
    | "rhelSQLWeb"
    | "sles"
    | "ubuntu";

type EC2Platforms = {
    [key in EC2Platform]?: EC2PlatformPricing;
} & {
    emr?: {
        emr: string;
    };
} & {
    [key: string]: EC2PlatformPricing | undefined;
};

type EC2Pricing<Regions extends string> = {
    [key in Regions]?: EC2Platforms;
} & {
    [key: string]: EC2Platforms | undefined;
};

type EC2Storage = {
    ssd: boolean;
    trimSupport: boolean;
    nvmeSsd: boolean;
    storageNeedsInitialization: boolean;
    includesSwapPartition: boolean;
    devices: number;
    size: number;
    sizeUnit: string;
};

/** Defines the EC2 instance object. */
export type EC2Instance<Regions extends string> = {
    instanceType: string;
    family: string;
    vCPU: number;
    memory: number;
    prettyName: string;
    arch: string[];
    networkPerformance: string | null;
    physicalProcessor: string;
    generation: string;
    currentGeneration: boolean;
    GPU: number;
    FPGA: number;
    ebsAsNvme: boolean;
    vpc: EC2VPC | null;
    ebsOptimized: boolean;
    ebsBaselineThroughput: number;
    ebsBaselineIops: number;
    ebsBaselineBandwidth: number;
    ebsThroughput: number;
    ebsIops: number;
    ebsMaxBandwidth: number;
    ECU: number;
    intelAvx512: boolean | null;
    intelAvx2: boolean | null;
    intelAvx: boolean | null;
    intelTurbo: boolean | null;
    clockSpeedGhz: string | null;
    enhancedNetworking: boolean;
    pricing: EC2Pricing<Regions>;
    regions: { [regionSlug: string]: string };
    linuxVirtualizationTypes: string[];
    vpcOnly: boolean;
    basePerformance: number | null;
    burstMinutes: number | null;
    GPUModel: string | null;
    computeCapability: number | null;
    GPUMemory: string | null;
    placementGroupSupport: boolean;
    storage: EC2Storage | null;
    emr: boolean;
    ipv6Support: boolean;
};

export type RDSRemapItems =
    | "postgres"
    | "mysql"
    | "sqlServerExpress"
    | "sqlServerWeb"
    | "sqlServerStandard"
    | "sqlServerEnterprise"
    | "auroraPgMySQL"
    | "auroraIoOptimized"
    | "mariadb"
    | "oracleEnterprise";

type HalfRegionPricing = {
    ondemand: number;
    reserved?: {
        [K in AWSReservedTerms]?: number;
    };
};

type RDSPricingPlatforms = {
    [K in RDSRemapItems]?: HalfRegionPricing;
} & {
    [key: string]: HalfRegionPricing | undefined;
};

type RDSPricing<Regions extends string> = {
    [key in Regions]?: RDSPricingPlatforms;
} & {
    [key: string]: RDSPricingPlatforms | undefined;
};

/** Defines the RDS instance object. */
export type RDSInstance<Regions extends string> = {
    arch: string;
    currentGeneration: boolean;
    ebsBaselineBandwidth: number;
    ebsBaselineIops: number;
    ebsBaselineThroughput: number;
    ebsIops: number;
    ebsMaxBandwidth: number;
    ebsOptimized: boolean;
    ebsThroughput: number;
    instanceFamily: string;
    instanceType: string;
    instanceTypeFamily: string;
    memory: number;
    networkPerformance: string | null;
    normalizationSizeFactor: number;
    physicalProcessor: string;
    prettyName: string;
    pricing: RDSPricing<Regions>;
    processorArchitecture: string;
    regionCode: string;
    regions: { [regionSlug: string]: string };
    storage: string;
    vcpu: number;
};

type CachePlatforms = {
    Redis?: HalfRegionPricing;
    Memcached?: HalfRegionPricing;
    Valkey?: HalfRegionPricing;
    [key: string]: HalfRegionPricing | undefined;
};

type CachePricing<Regions extends string> = {
    [key in Regions]?: CachePlatforms;
} & {
    [key: string]: CachePlatforms | undefined;
};

/** Defines the Cache instance object. */
export type CacheInstance<Regions extends string> = {
    currentGeneration: boolean;
    instanceFamily: string;
    instanceType: string;
    maxClients: number;
    memory: number;
    networkPerformance: string | null;
    prettyName: string;
    pricing: CachePricing<Regions>;
    regionCode: string;
    regions: { [regionSlug: string]: string };
    vcpu: number;
};

type HalfPricing<Regions extends string> = {
    [key in Regions]?: HalfRegionPricing;
} & {
    [key: string]: HalfRegionPricing | undefined;
};

/** Defines the Redshift instance object. */
export type RedshiftInstance<Regions extends string> = {
    currentGeneration: boolean;
    ecu: string;
    family: string;
    instanceType: string;
    io: string;
    memory: number;
    nodeRange: string;
    prettyName: string;
    pricing: HalfPricing<Regions>;
    regionCode: string;
    regions: { [regionSlug: string]: string };
    slicesPerNode: number;
    storage: string;
    storageCapacity: string;
    storagePerNode: string;
    usageFamily: string;
    vcpu: number;
};

/** Defines the OpenSearch instance object. */
export type OpenSearchInstance<Regions extends string> = {
    currentGeneration: boolean;
    ecu: string;
    instanceFamily: string;
    instanceType: string;
    maxEbsGp2: string;
    maxEbsGp3: string;
    maxHttpPayload: string;
    memoryGib: number;
    minEbs: string;
    prettyName: string;
    pricing: HalfPricing<Regions>;
    regionCode: string;
    regions: { [regionSlug: string]: string };
    vcpu: number;
};

type AzurePlatformPricing = {
    on_demand?: number;
    spot_min?: number;
    hybridbenefit?: number;
    lowpriority?: number;
    basic?: number;
    "basic-spot"?: number;
    reserved?: {
        [K in AzureReservedTerms]?: number;
    };
};

type AzurePlatforms = {
    linux?: AzurePlatformPricing;
    windows?: AzurePlatformPricing;
    [key: string]: AzurePlatformPricing | undefined;
};

type AzurePricing = {
    [key in GlobalAzureRegions]?: AzurePlatforms;
} & {
    [key: string]: AzurePlatforms | undefined;
};

/** Defines the Azure instance object. */
export type AzureInstance = {
    prettyName: string;
    family: string;
    category: string;
    vcpu: number;
    memory: number;
    size: number;
    GPU: number;
    pricing: AzurePricing;
    regions: { [regionSlug: string]: string };
    prettyNameAzure: string;
    instanceType: string;
    storage: {
        nvmeSsd: boolean;
        devices: number;
        size: number;
        maxWriteDisks?: string;
    };
    ACU: number;
    memoryMaintenance: boolean;
    hypervGenerations: string;
    arch: string[];
    lowPriority: boolean;
    premiumIo: boolean;
    vmDeployment: string | null;
    vcpusAvailable: number;
    vcpusPercore: number;
    iops: number | null;
    readIo: number;
    writeIo: number;
    cachedDisk: number;
    uncachedDisk: number;
    uncachedDiskIo: number;
    encryption: boolean;
    capacitySupport: boolean;
    acceleratedNetworking: boolean;
    rdma: boolean;
    ultraSsd: boolean;
    hibernation: boolean | null;
    trustedLaunch: boolean | null;
    confidential: boolean;
};

type GCPPlatformPricing = {
    ondemand?: string;
    spot?: string;
};

type GCPPlatforms = {
    linux?: GCPPlatformPricing;
    windows?: GCPPlatformPricing;
    [key: string]: GCPPlatformPricing | undefined;
};

type GCPPricing = {
    [key in GlobalGCPRegions]?: GCPPlatforms;
} & {
    [key: string]: GCPPlatforms | undefined;
};

/** Defines the GCP instance object. */
export type GCPInstance = {
    prettyName: string;
    instanceType: string;
    family: string;
    vCPU: number;
    memory: number;
    networkPerformance: string | null;
    generation: string;
    GPU: number;
    pricing: GCPPricing;
    regions: { [regionSlug: string]: string };
    localSsd: boolean;
    sharedCpu: boolean;
    computeOptimized: boolean;
};

/** Defines the supported regions for China based AWS region queries. */
export type ChinaAWSRegions =
    | "cn-north-1"
    | "cn-northwest-1"
    | "cn-north-1-pkx-1";

/** Defines the supported regions for global AWS region queries. */
export type GlobalAWSRegions =
    | "ap-northeast-1"
    | "ap-south-1"
    | "ap-southeast-1"
    | "ap-southeast-2"
    | "eu-central-1"
    | "eu-west-1"
    | "us-east-1"
    | "us-east-2"
    | "us-west-2"
    | "sa-east-1"
    | "us-gov-east-1"
    | "us-gov-west-1"
    | "us-west-1"
    | "ap-northeast-2"
    | "ap-northeast-3"
    | "ca-central-1"
    | "eu-west-2"
    | "af-south-1"
    | "ap-east-1"
    | "ap-south-2"
    | "ap-southeast-3"
    | "ap-southeast-4"
    | "ca-west-1"
    | "eu-central-2"
    | "eu-north-1"
    | "eu-south-1"
    | "eu-south-2"
    | "eu-west-3"
    | "il-central-1"
    | "me-central-1"
    | "me-south-1"
    | "ap-east-2"
    | "ap-southeast-5"
    | "ap-southeast-7"
    | "mx-central-1";

/** Defines the supported regions for global Azure region queries. */
export type GlobalAzureRegions =
    | "asia-pacific-east"
    | "asia-pacific-southeast"
    | "australia-central"
    | "australia-central-2"
    | "australia-east"
    | "australia-southeast"
    | "brazil-south"
    | "brazil-southeast"
    | "canada-central"
    | "canada-east"
    | "central-india"
    | "europe-north"
    | "europe-west"
    | "france-central"
    | "france-south"
    | "japan-east"
    | "japan-west"
    | "korea-central"
    | "korea-south"
    | "poland-central"
    | "qatar-central"
    | "south-india"
    | "united-kingdom-south"
    | "united-kingdom-west"
    | "us-central"
    | "us-east"
    | "us-east-2"
    | "us-north-central"
    | "us-south-central"
    | "us-west"
    | "us-west-2"
    | "us-west-central"
    | "usgov-arizona"
    | "usgov-texas"
    | "usgov-virginia"
    | "west-india"
    | "austria-east"
    | "belgium-central"
    | "germany-north"
    | "germany-west-central"
    | "indonesia-central"
    | "israel-central"
    | "italy-north"
    | "malaysia-west"
    | "mexico-central"
    | "new-zealand-north"
    | "norway-east"
    | "norway-west"
    | "south-africa-north"
    | "south-africa-west"
    | "spain-central"
    | "sweden-central"
    | "sweden-south"
    | "switzerland-north"
    | "switzerland-west"
    | "uae-central"
    | "uae-north"
    | "us-west-3"
    | "chile-central";

type EC2AllowedColumns =
    | "prettyName"
    | "instanceType"
    | "family"
    | "memory"
    | "ECU"
    | "vCPU"
    | "memoryPerVcpu"
    | "GPU"
    | "GPUModel"
    | "GPUMemory"
    | "computeCapability"
    | "FPGA"
    | "ECUPerVcpu"
    | "physicalProcessor"
    | "clockSpeedGhz"
    | "intelAvx"
    | "intelAvx2"
    | "intelAvx512"
    | "intelTurbo"
    | "storage"
    | "warmedUp"
    | "trimSupport"
    | "arch"
    | "networkPerformance"
    | "ebsBaselineBandwidth"
    | "ebsBaselineThroughput"
    | "ebsBaselineIops"
    | "ebsMaxBandwidth"
    | "ebsThroughput"
    | "ebsIops"
    | "ebsAsNvme"
    | "maxIps"
    | "maxEnis"
    | "enhancedNetworking"
    | "vpcOnly"
    | "ipv6Support"
    | "placementGroupSupport"
    | "linuxVirtualizationTypes"
    | "emr"
    | "availabilityZones"
    | "costOndemand"
    | "costReserved"
    | "costSpotMin"
    | "costSpotMax"
    | "costOndemandRhel"
    | "costReservedRhel"
    | "costSpotMinRhel"
    | "costSpotMaxRhel"
    | "costOndemandSles"
    | "costReservedSles"
    | "costSpotMinSles"
    | "costSpotMaxSles"
    | "costOndemandMswin"
    | "costReservedMswin"
    | "costSpotMinMswin"
    | "costSpotMaxMswin"
    | "costOndemandDedicated"
    | "costReservedDedicated"
    | "costOndemandMswinSQLWeb"
    | "costReservedMswinSQLWeb"
    | "costOndemandMswinSQL"
    | "costReservedMswinSQL"
    | "costOndemandMswinSQLEnterprise"
    | "costReservedMswinSQLEnterprise"
    | "costOndemandLinuxSQLWeb"
    | "costReservedLinuxSQLWeb"
    | "costOndemandLinuxSQL"
    | "costReservedLinuxSQL"
    | "costOndemandLinuxSQLEnterprise"
    | "costReservedLinuxSQLEnterprise"
    | "spotInterruptRate"
    | "costEmr"
    | "generation";

type RDSAllowedColumns =
    | "name"
    | "apiName"
    | "memory"
    | "storage"
    | "vCPU"
    | "networkPerf"
    | "architecture"
    | "costOnDemandPostgres"
    | "costReservedPostgres"
    | "costOnDemandMySQL"
    | "costReservedMySQL"
    | "costOnDemandSQLServerExpress"
    | "costReservedSQLServerExpress"
    | "costOnDemandSQLServerWeb"
    | "costReservedSQLServerWeb"
    | "costOnDemandSQLServerStandard"
    | "costReservedSQLServerStandard"
    | "costOnDemandSQLServerEnterprise"
    | "costReservedSQLServerEnterprise"
    | "costOnDemandAurora"
    | "costReservedAurora"
    | "costOnDemandAuroraIO"
    | "costOnDemandMariaDB"
    | "costReservedMariaDB"
    | "costOnDemandOracleEnterprise"
    | "costReservedOracleEnterprise"
    | "ebsBaselineBandwidth"
    | "ebsBaselineThroughput"
    | "ebsBaselineIops"
    | "ebsMaxBandwidth"
    | "ebsMaxThroughput"
    | "ebsIops";

type CacheAllowedColumns =
    | "prettyName"
    | "instanceType"
    | "memory"
    | "vCPU"
    | "networkPerf"
    | "costOnDemandRedis"
    | "costReservedRedis"
    | "costOnDemandMemcached"
    | "costReservedMemcached"
    | "costOnDemandValkey"
    | "costReservedValkey"
    | "generation";

type RedshiftAllowedColumns =
    | "prettyName"
    | "instanceType"
    | "memory"
    | "vCPU"
    | "storage"
    | "io"
    | "ECU"
    | "generation"
    | "costOndemand"
    | "costReserved";

type OpensearchAllowedColumns =
    | "prettyName"
    | "instanceType"
    | "memory"
    | "vCPU"
    | "storage"
    | "ECU"
    | "costOndemand"
    | "costReserved"
    | "generation";

type AzureAllowedColumns =
    | "prettyNameAzure"
    | "instanceType"
    | "memory"
    | "vCPU"
    | "memoryPerVcpu"
    | "GPU"
    | "size"
    | "linuxOndemand"
    | "linuxSavings"
    | "linuxReserved"
    | "linuxSpot"
    | "windowsOndemand"
    | "windowsSavings"
    | "windowsReserved"
    | "windowsSpot";

type AWSReservedTerms =
    | "yrTerm1Standard.noUpfront"
    | "yrTerm1Standard.partialUpfront"
    | "yrTerm1Standard.allUpfront"
    | "yrTerm3Standard.noUpfront"
    | "yrTerm3Standard.partialUpfront"
    | "yrTerm3Standard.allUpfront"
    | "yrTerm1Convertible.noUpfront"
    | "yrTerm1Convertible.partialUpfront"
    | "yrTerm1Convertible.allUpfront"
    | "yrTerm3Convertible.noUpfront"
    | "yrTerm3Convertible.partialUpfront"
    | "yrTerm3Convertible.allUpfront";

type AzureReservedTerms =
    | "yrTerm1Standard.allUpfront"
    | "yrTerm3Standard.allUpfront"
    | "yrTerm1Standard.hybridbenefit"
    | "yrTerm3Standard.hybridbenefit";

export type GCPAllowedColumns =
    | "prettyName"
    | "instanceType"
    | "memory"
    | "vCPU"
    | "memoryPerVcpu"
    | "GPU"
    | "networkPerformance"
    | "generation"
    | "localSsd"
    | "sharedCpu"
    | "linuxOndemand"
    | "linuxSpot"
    | "windowsOndemand"
    | "windowsSpot";

export type SupportedServices = {
    ec2: {
        columns: EC2AllowedColumns;
        reservedTerms: AWSReservedTerms;
        ecu: "ecu";
    };
    rds: {
        columns: RDSAllowedColumns;
        reservedTerms: AWSReservedTerms;
        ecu: "ecu";
    };
    cache: {
        columns: CacheAllowedColumns;
        reservedTerms: AWSReservedTerms;
        ecu: "ecu";
    };
    redshift: {
        columns: RedshiftAllowedColumns;
        reservedTerms: AWSReservedTerms;
        ecu: "ecu";
    };
    opensearch: {
        columns: OpensearchAllowedColumns;
        reservedTerms: AWSReservedTerms;
        ecu: "ecu";
    };
    azure: {
        columns: AzureAllowedColumns;
        reservedTerms: AzureReservedTerms;
        ecu: "acu";
    };
    gcp: {
        columns: GCPAllowedColumns;
        reservedTerms: null;
        ecu: never;
    };
};

export type GlobalGCPRegions =
    | "africa-south1"
    | "asia-east1"
    | "asia-east2"
    | "asia-northeast1"
    | "asia-northeast2"
    | "asia-northeast3"
    | "asia-south1"
    | "asia-south2"
    | "asia-southeast1"
    | "asia-southeast2"
    | "australia-southeast1"
    | "australia-southeast2"
    | "europe-central2"
    | "europe-north1"
    | "europe-southwest1"
    | "europe-west1"
    | "europe-west10"
    | "europe-west12"
    | "europe-west2"
    | "europe-west3"
    | "europe-west4"
    | "europe-west6"
    | "europe-west8"
    | "europe-west9"
    | "me-central1"
    | "me-central2"
    | "me-west1"
    | "multi-americas"
    | "northamerica-northeast1"
    | "northamerica-northeast2"
    | "southamerica-east1"
    | "southamerica-west1"
    | "us-central1"
    | "us-east1"
    | "us-east4"
    | "us-east5"
    | "us-south1"
    | "us-west1"
    | "us-west2"
    | "us-west3"
    | "us-west4"
    | "us-west8"
    | "europe-north2"
    | "northamerica-south1"
    | "asia-southeast3"
    | "europe-west5"
    | "us-east7";

/** Get the reserved terms for a specific service. */
export type ReservedTerms<Key extends keyof SupportedServices> =
    SupportedServices[Key]["reservedTerms"];

type RemappedColumn<K extends string> = {
    /** Defines the key of the column to show. */
    key: K;

    /** A filter to be applied to this column. */
    filter?: string;

    /**
     * If set, defines the sorting order for this column. If true, the column will be sorted in descending order.
     * If false, the column will be sorted in ascending order. If not set, no sorting will be applied.
     */
    sortDesc?: boolean;
};

type RemapColumns<S extends string> = {
    [K in S]: RemappedColumn<K>;
}[S];

/** Gets the columns for a specific service. */
export type Columns<Key extends keyof SupportedServices> = RemapColumns<
    SupportedServices[Key]["columns"]
>;
