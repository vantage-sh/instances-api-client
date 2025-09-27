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

export type ChinaRegions = string;
export type GlobalRegions = string;

export type SupportedServices = {
    ec2: {
        columns: "a";
        reservedTerms: "b";
    };
    rds: {
        columns: "c";
        reservedTerms: "d";
    };
    cache: {
        columns: "e";
        reservedTerms: "f";
    };
    redshift: {
        columns: "g";
        reservedTerms: "h";
    };
    opensearch: {
        columns: "i";
        reservedTerms: "j";
    };
    azure: {
        columns: "k";
        reservedTerms: "l";
    };
};
