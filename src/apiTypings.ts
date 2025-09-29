/** Defines the EC2 instance object. */
export type EC2Instance = {
};

/** Defines the RDS instance object. */
export type RDSInstance = {
};

type HalfRegionPricing = {
    ondemand: number;
    reserved?: {
        [K in AWSReservedTerms]?: number;
    };
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
    memory: string;
    networkPerformance: string;
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
    memory: string;
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

/** Defines the supported regions for China based AWS region queries. */
export type ChinaAWSRegions = "cn-north-1" | "cn-northwest-1" | "cn-north-1-pkx-1";

/** Defines the supported regions for global AWS region queries. */
export type GlobalAWSRegions =
    "ap-northeast-1" |
    "ap-south-1" |
    "ap-southeast-1" |
    "ap-southeast-2" |
    "eu-central-1" |
    "eu-west-1" |
    "us-east-1" |
    "us-east-2" |
    "us-west-2" |
    "sa-east-1" |
    "us-gov-east-1" |
    "us-gov-west-1" |
    "us-west-1" |
    "ap-northeast-2" |
    "ap-northeast-3" |
    "ca-central-1" |
    "eu-west-2" |
    "af-south-1" |
    "ap-east-1" |
    "ap-south-2" |
    "ap-southeast-3" |
    "ap-southeast-4" |
    "ca-west-1" |
    "eu-central-2" |
    "eu-north-1" |
    "eu-south-1" |
    "eu-south-2" |
    "eu-west-3" |
    "il-central-1" |
    "me-central-1" |
    "me-south-1" |
    "ap-east-2" |
    "ap-southeast-5" |
    "ap-southeast-7" |
    "mx-central-1";

/** Defines the supported regions for global Azure region queries. */
export type GlobalAzureRegions = 
    "asia-pacific-east" |
    "asia-pacific-southeast" |
    "australia-central" |
    "australia-central-2" |
    "australia-east" |
    "australia-southeast" |
    "brazil-south" |
    "brazil-southeast" |
    "canada-central" |
    "canada-east" |
    "central-india" |
    "europe-north" |
    "europe-west" |
    "france-central" |
    "france-south" |
    "japan-east" |
    "japan-west" |
    "korea-central" |
    "korea-south" |
    "poland-central" |
    "qatar-central" |
    "south-india" |
    "united-kingdom-south" |
    "united-kingdom-west" |
    "us-central" |
    "us-east" |
    "us-east-2" |
    "us-north-central" |
    "us-south-central" |
    "us-west" |
    "us-west-2" |
    "us-west-central" |
    "usgov-arizona" |
    "usgov-texas" |
    "usgov-virginia" |
    "west-india" |
    "austria-east" |
    "belgium-central" |
    "germany-north" |
    "germany-west-central" |
    "indonesia-central" |
    "israel-central" |
    "italy-north" |
    "malaysia-west" |
    "mexico-central" |
    "new-zealand-north" |
    "norway-east" |
    "norway-west" |
    "south-africa-north" |
    "south-africa-west" |
    "spain-central" |
    "sweden-central" |
    "sweden-south" |
    "switzerland-north" |
    "switzerland-west" |
    "uae-central" |
    "uae-north" |
    "us-west-3" |
    "chile-central";

type EC2AllowedColumns =
    "prettyName" |
    "instanceType" |
    "family" |
    "memory" |
    "ECU" |
    "vCPU" |
    "memoryPerVcpu" |
    "GPU" |
    "GPUModel" |
    "GPUMemory" |
    "computeCapability" |
    "FPGA" |
    "ECUPerVcpu" |
    "physicalProcessor" |
    "clockSpeedGhz" |
    "intelAvx" |
    "intelAvx2" |
    "intelAvx512" |
    "intelTurbo" |
    "storage" |
    "warmedUp" |
    "trimSupport" |
    "arch" |
    "networkPerformance" |
    "ebsBaselineBandwidth" |
    "ebsBaselineThroughput" |
    "ebsBaselineIops" |
    "ebsMaxBandwidth" |
    "ebsThroughput" |
    "ebsIops" |
    "ebsAsNvme" |
    "maxIps" |
    "maxEnis" |
    "enhancedNetworking" |
    "vpcOnly" |
    "ipv6Support" |
    "placementGroupSupport" |
    "linuxVirtualizationTypes" |
    "emr" |
    "availabilityZones" |
    "costOndemand" |
    "costReserved" |
    "costSpotMin" |
    "costSpotMax" |
    "costOndemandRhel" |
    "costReservedRhel" |
    "costSpotMinRhel" |
    "costSpotMaxRhel" |
    "costOndemandSles" |
    "costReservedSles" |
    "costSpotMinSles" |
    "costSpotMaxSles" |
    "costOndemandMswin" |
    "costReservedMswin" |
    "costSpotMinMswin" |
    "costSpotMaxMswin" |
    "costOndemandDedicated" |
    "costReservedDedicated" |
    "costOndemandMswinSQLWeb" |
    "costReservedMswinSQLWeb" |
    "costOndemandMswinSQL" |
    "costReservedMswinSQL" |
    "costOndemandMswinSQLEnterprise" |
    "costReservedMswinSQLEnterprise" |
    "costOndemandLinuxSQLWeb" |
    "costReservedLinuxSQLWeb" |
    "costOndemandLinuxSQL" |
    "costReservedLinuxSQL" |
    "costOndemandLinuxSQLEnterprise" |
    "costReservedLinuxSQLEnterprise" |
    "spotInterruptRate" |
    "costEmr" |
    "generation";

type RDSAllowedColumns =
    "name" |
    "apiName" |
    "memory" |
    "storage" |
    "vCPU" |
    "networkPerf" |
    "architecture" |
    "costOnDemandPostgres" |
    "costReservedPostgres" |
    "costOnDemandMySQL" |
    "costReservedMySQL" |
    "costOnDemandSQLServerExpress" |
    "costReservedSQLServerExpress" |
    "costOnDemandSQLServerWeb" |
    "costReservedSQLServerWeb" |
    "costOnDemandSQLServerStandard" |
    "costReservedSQLServerStandard" |
    "costOnDemandSQLServerEnterprise" |
    "costReservedSQLServerEnterprise" |
    "costOnDemandAurora" |
    "costReservedAurora" |
    "costOnDemandAuroraIO" |
    "costOnDemandMariaDB" |
    "costReservedMariaDB" |
    "costOnDemandOracleEnterprise" |
    "costReservedOracleEnterprise" |
    "ebsBaselineBandwidth" |
    "ebsBaselineThroughput" |
    "ebsBaselineIops" |
    "ebsMaxBandwidth" |
    "ebsMaxThroughput" |
    "ebsIops";

type CacheAllowedColumns =
    "prettyName" |
    "instanceType" |
    "memory" |
    "vCPU" |
    "networkPerf" |
    "costOnDemandRedis" |
    "costReservedRedis" |
    "costOnDemandMemcached" |
    "costReservedMemcached" |
    "costOnDemandValkey" |
    "costReservedValkey" |
    "generation";

type RedshiftAllowedColumns =
    "prettyName" |
    "instanceType" |
    "memory" |
    "vCPU" |
    "storage" |
    "io" |
    "ECU" |
    "generation" |
    "costOndemand" |
    "costReserved";

type OpensearchAllowedColumns =
    "prettyName" |
    "instanceType" |
    "memory" |
    "vCPU" |
    "storage" |
    "ECU" |
    "costOndemand" |
    "costReserved" |
    "generation";

type AzureAllowedColumns =
    "prettyNameAzure" |
    "instanceType" |
    "memory" |
    "vCPU" |
    "memoryPerVcpu" |
    "GPU" |
    "size" |
    "linuxOndemand" |
    "linuxSavings" |
    "linuxReserved" |
    "linuxSpot" |
    "windowsOndemand" |
    "windowsSavings" |
    "windowsReserved" |
    "windowsSpot";

type AWSReservedTerms =
    "yrTerm1Standard.noUpfront" |
    "yrTerm1Standard.partialUpfront" |
    "yrTerm1Standard.allUpfront" |
    "yrTerm3Standard.noUpfront" |
    "yrTerm3Standard.partialUpfront" |
    "yrTerm3Standard.allUpfront" |
    "yrTerm1Convertible.noUpfront" |
    "yrTerm1Convertible.partialUpfront" |
    "yrTerm1Convertible.allUpfront" |
    "yrTerm3Convertible.noUpfront" |
    "yrTerm3Convertible.partialUpfront" |
    "yrTerm3Convertible.allUpfront";

type AzureReservedTerms =
    "yrTerm1Standard.allUpfront" |
    "yrTerm3Standard.allUpfront" |
    "yrTerm1Standard.hybridbenefit" |
    "yrTerm3Standard.hybridbenefit";

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
};

/** Get the reserved terms for a specific service. */
export type ReservedTerms<Key extends keyof SupportedServices> = SupportedServices[Key]["reservedTerms"];

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
export type Columns<Key extends keyof SupportedServices> = RemapColumns<SupportedServices[Key]["columns"]>;
