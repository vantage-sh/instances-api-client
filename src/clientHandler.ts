import type {
    EC2Instance,
    RDSInstance,
    CacheInstance,
    RedshiftInstance,
    OpenSearchInstance,
    AzureInstance,
    ChinaRegions,
    GlobalRegions,
    SupportedServices,
} from "./apiTypings";
import {
    UnknownHTTPError,
    errors,
} from "./apiErrors";

async function throw_(res: Response) {
    const t = await res.text();
    let j: any;
    try {
        j = JSON.parse(t);
    } catch {
        throw new UnknownHTTPError(res.status, res.statusText);
    }

    const errorHandler = errors[(j.code as keyof typeof errors) || ""];
    if (errorHandler) {
        throw new errorHandler(j.error || t);
    }
    throw new UnknownHTTPError(res.status, res.statusText);
}

function instanceGetter<T>(service: string, isChina: boolean) {
    /** Gets a specific instance type for a service. */
    return async (instanceType: string, fetchClient?: typeof fetch) => {
        const fetcher = fetchClient || fetch;
        const url = `https://instances-api.vantage.sh/api/v1/${service}/${
            isChina ? "china" : "global"
        }/${encodeURIComponent(instanceType)}`;
        const res = await fetcher(url);
        if (!res.ok) await throw_(res);
        return res.json() as Promise<T>;
    };
}

function getInstanceObj(isChina: boolean) {
    return {
        ec2: instanceGetter<EC2Instance>("ec2", isChina),
        rds: instanceGetter<RDSInstance>("rds", isChina),
        cache: instanceGetter<CacheInstance>("cache", isChina),
        redshift: instanceGetter<RedshiftInstance>("redshift", isChina),
        opensearch: instanceGetter<OpenSearchInstance>("opensearch", isChina),
    };
}

type RemapColumns<S extends string> = {
    [K in S]: {
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
}[S];

export type VirtualInstancesRequestBody<
    Regions extends string,
    ServiceKey extends keyof SupportedServices,
> = {
    /** Defines the region that virtual instances will be ran in. */
    region: Regions;

    /** Defines the columns to be included in the virtual instances request. */
    columns: RemapColumns<SupportedServices[ServiceKey]["columns"]>[];

    /** A search term to be applied to all columns. */
    globalSearch?: string;

    /** Defines the time granularity for cost estimation. */
    costDuration?: "secondly" | "minutely" | "hourly" | "daily" | "weekly" | "monthly" | "annually";

    /** Defines the pricing unit for cost estimation. */
    pricingUnit?: "instance" | "vcpu" | "ecu" | "memory";

    /** Defines the reserved terms for the virtual instances request. */
    reservedTerms?: SupportedServices[ServiceKey]["reservedTerms"];

    /** The currency for cost estimation. Defaults to USD. */
    currency?: string;
};

export type VirtualInstancesResult = {
    headers: string[];
    instances: {
        [instanceType: string]: string[];
    };
};

type VirtualInstancesCategoriesIncludingAzure<Regions extends string> = {
    [K in keyof SupportedServices]: (body: VirtualInstancesRequestBody<Regions, K>) => Promise<VirtualInstancesResult>;
};

type VirtualInstancesCategory<Regions extends string, ExcludeAzure extends boolean> = ExcludeAzure extends true
    ? Omit<VirtualInstancesCategoriesIncludingAzure<Regions>, "azure">
    : VirtualInstancesCategoriesIncludingAzure<Regions>;

function virtualInstances<
    Regions extends string,
    ExcludeAzure extends boolean,
>(apiKey: string, excludeAzure: ExcludeAzure, fetchClient?: typeof fetch): VirtualInstancesCategory<Regions, ExcludeAzure> {
    const fetcher = fetchClient || fetch;
    const generateReq = async <ServiceKey extends keyof SupportedServices>(
        service: ServiceKey, bodyRemainder: VirtualInstancesRequestBody<Regions, ServiceKey>,
    ) => {
        const body = JSON.stringify({
            service,
            ...bodyRemainder,
        });
        const fetchRes = await fetcher(
            "https://instances-api.vantage.sh/api/v1/virtual-instances",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body,
            },
        );
        if (!fetchRes.ok) await throw_(fetchRes);
        return fetchRes.json() as Promise<VirtualInstancesResult>;
    };

    const all: VirtualInstancesCategoriesIncludingAzure<Regions> = {
        ec2: (body) => generateReq("ec2", body),
        rds: (body) => generateReq("rds", body),
        cache: (body) => generateReq("cache", body),
        redshift: (body) => generateReq("redshift", body),
        opensearch: (body) => generateReq("opensearch", body),
        azure: (body) => generateReq("azure", body),
    };

    if (excludeAzure) {
        // @ts-ignore: Some type hackery
        delete all.azure;
    }

    return all;
}

export const apiV1 = {
    china: {
        getInstance: getInstanceObj(true),
        virtualInstances: (apiKey: string, fetchClient?: typeof fetch) =>
            virtualInstances<ChinaRegions, true>(apiKey, true, fetchClient),
    },
    global: {
        getInstance: {
            ...getInstanceObj(false),
            azure: instanceGetter<AzureInstance>("azure", false),
        },
        virtualInstances: (apiKey: string, fetchClient?: typeof fetch) =>
            virtualInstances<GlobalRegions, false>(apiKey, false, fetchClient),
    },
};
