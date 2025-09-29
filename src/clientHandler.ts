import type {
    EC2Instance,
    RDSInstance,
    CacheInstance,
    RedshiftInstance,
    OpenSearchInstance,
    AzureInstance,
    ChinaAWSRegions,
    GlobalAWSRegions,
    GlobalAzureRegions,
    SupportedServices,
    Columns,
    ReservedTerms,
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

const toConvert = ["GPU", "memoryGib", "vcpu", "slicesPerNode", "maxClients"];

function remap(obj: any): any {
    if (obj === null || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map(remap);
    for (const key in obj) {
        if (key === "pricing" || key === "regions") {
            // Ignore pricing objects as they are nested and complex
            continue;
        }
        if (key === "currentGeneration") {
            // Turn it into a boolean
            obj[key] = obj[key] === "Yes";
            continue;
        }
        const unsnake = key.replace(/[-_]([a-z])/g, (_, letter) => letter.toUpperCase());
        if (unsnake !== key) {
            obj[unsnake] = remap(obj[key]);
            delete obj[key];
        }
        if (toConvert.includes(unsnake) && typeof obj[unsnake] === "string") {
            const num = Number(obj[unsnake]);
            if (!isNaN(num)) obj[unsnake] = num;
        }
    }
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
        return remap(await res.json()) as T;
    };
}

function getInstanceObj<AWSRegions extends string>(isChina: boolean) {
    return {
        ec2: instanceGetter<EC2Instance>("ec2", isChina),
        rds: instanceGetter<RDSInstance>("rds", isChina),
        cache: instanceGetter<CacheInstance<AWSRegions>>("cache", isChina),
        redshift: instanceGetter<RedshiftInstance<AWSRegions>>("redshift", isChina),
        opensearch: instanceGetter<OpenSearchInstance<AWSRegions>>("opensearch", isChina),
    };
}

export type VirtualInstancesRequestBody<
    Regions extends string,
    ServiceKey extends keyof SupportedServices,
> = {
    /** Defines the region that virtual instances will be ran in. */
    region: Regions;

    /** Defines the columns to be included in the virtual instances request. */
    columns: Columns<ServiceKey>[];

    /** A search term to be applied to all columns. */
    globalSearch?: string;

    /** Defines the time granularity for cost estimation. */
    costDuration?: "secondly" | "minutely" | "hourly" | "daily" | "weekly" | "monthly" | "annually";

    /** Defines the pricing unit for cost estimation. */
    pricingUnit?: "instance" | "vcpu" | "memory" | SupportedServices[ServiceKey]["ecu"];

    /** Defines the reserved term for the virtual instances request. */
    reservedTerm?: ReservedTerms<ServiceKey>;

    /** The currency for cost estimation. Defaults to USD. */
    currency?: string;
};

export type VirtualInstancesResult = {
    headers: string[];
    instances: {
        [instanceType: string]: string[];
    };
};

type VirtualInstancesCategoriesIncludingAzure<AWSRegions extends string, AzureRegions extends string> = {
    [K in keyof SupportedServices]: K extends "azure"
        ? (body: VirtualInstancesRequestBody<AzureRegions, K>) => Promise<VirtualInstancesResult>
        : (body: VirtualInstancesRequestBody<AWSRegions, K>) => Promise<VirtualInstancesResult>;
};

type VirtualInstancesCategory<AWSRegions extends string, AzureRegions extends string, ExcludeAzure extends boolean> = ExcludeAzure extends true
    ? Omit<VirtualInstancesCategoriesIncludingAzure<AWSRegions, AzureRegions>, "azure">
    : VirtualInstancesCategoriesIncludingAzure<AWSRegions, AzureRegions>;

function virtualInstances<
    AWSRegions extends string,
    AzureRegions extends string,
    ExcludeAzure extends boolean,
>(apiKey: string, excludeAzure: ExcludeAzure, fetchClient?: typeof fetch): VirtualInstancesCategory<AWSRegions, AzureRegions, ExcludeAzure> {
    const fetcher = fetchClient || fetch;
    const generateReq = async <ServiceKey extends keyof SupportedServices>(
        service: ServiceKey, bodyRemainder: ServiceKey extends "azure"
            ? VirtualInstancesRequestBody<AzureRegions, ServiceKey>
            : VirtualInstancesRequestBody<AWSRegions, ServiceKey>,
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

    const all: VirtualInstancesCategoriesIncludingAzure<AWSRegions, AzureRegions> = {
        ec2: (body) => generateReq("ec2", body),
        rds: (body) => generateReq("rds", body),
        cache: (body) => generateReq("cache", body),
        redshift: (body) => generateReq("redshift", body),
        opensearch: (body) => generateReq("opensearch", body),
        azure: (body) => generateReq("azure", body),
    };

    if (excludeAzure) {
        // @ts-ignore: Some type hackery. Seems to break vs code but not tsup so is an ignore.
        delete all.azure;
    }

    return all;
}

export const apiV1 = {
    china: {
        getInstance: getInstanceObj<ChinaAWSRegions>(true),
        virtualInstances: (apiKey: string, fetchClient?: typeof fetch) =>
            virtualInstances<ChinaAWSRegions, string, true>(apiKey, true, fetchClient),
    },
    global: {
        getInstance: {
            ...getInstanceObj<GlobalAWSRegions>(false),
            azure: instanceGetter<AzureInstance>("azure", false),
        },
        virtualInstances: (apiKey: string, fetchClient?: typeof fetch) =>
            virtualInstances<GlobalAWSRegions, GlobalAzureRegions, false>(apiKey, false, fetchClient),
    },
};
