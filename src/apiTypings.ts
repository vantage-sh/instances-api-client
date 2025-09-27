export type EC2Instance = {
};

export type RDSInstance = {
};

export type CacheInstance = {
};

export type RedshiftInstance = {
};

export type OpenSearchInstance = {
};

export type AzureInstance = {
};

export type ChinaRegions = "cn-north-1" | "cn-northwest-1" | "cn-north-1-pkx-1";
export type GlobalRegions = string;

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
    "GPUModel" |
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

export type SupportedServices = {
    ec2: {
        columns: EC2AllowedColumns;
        reservedTerms: "b";
    };
    rds: {
        columns: RDSAllowedColumns;
        reservedTerms: "d";
    };
    cache: {
        columns: CacheAllowedColumns;
        reservedTerms: "f";
    };
    redshift: {
        columns: RedshiftAllowedColumns;
        reservedTerms: "h";
    };
    opensearch: {
        columns: OpensearchAllowedColumns;
        reservedTerms: "j";
    };
    azure: {
        columns: AzureAllowedColumns;
        reservedTerms: "l";
    };
};

/** Get the columns for a specific service. */
export type Columns<Key extends keyof SupportedServices> = SupportedServices[Key]["columns"];
