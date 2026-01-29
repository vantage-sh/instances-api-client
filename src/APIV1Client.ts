import {
    objRemappers,
    remap,
    jsonStream,
    singlePageReadStream,
} from "./jsonStream";
import { errors, InvalidRequestError, UnknownHTTPError } from "./apiErrors";
import {
    AzureInstance,
    CacheInstance,
    RDSInstance,
    EC2Instance,
    GlobalAWSRegions,
    OpenSearchInstance,
    RedshiftInstance,
    ChinaAWSRegions,
    GCPInstance,
    GlobalAzureRegions,
    GlobalGCPRegions,
} from "./apiTypings";
import type { VirtualInstancesRequestBodyWithInfo } from "./virtualInstancesTypings";
import { parse } from "node-html-parser";

const BASE_URL = "https://instances-api.vantagesh.workers.dev";

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

type GlobalServiceTypes = {
    ec2: EC2Instance<GlobalAWSRegions>;
    rds: RDSInstance<GlobalAWSRegions>;
    cache: CacheInstance<GlobalAWSRegions>;
    redshift: RedshiftInstance<GlobalAWSRegions>;
    opensearch: OpenSearchInstance<GlobalAWSRegions>;
    azure: AzureInstance;
    gcp: GCPInstance;
};

type ChinaServiceTypes = {
    ec2: EC2Instance<ChinaAWSRegions>;
    rds: RDSInstance<ChinaAWSRegions>;
    cache: CacheInstance<ChinaAWSRegions>;
    redshift: RedshiftInstance<ChinaAWSRegions>;
    opensearch: OpenSearchInstance<ChinaAWSRegions>;
};

export type GlobalServices = keyof GlobalServiceTypes;
export type ChinaServices = keyof ChinaServiceTypes;

const GLOBAL_SERVICES_JSON_URLS = {
    ec2: "https://instances.vantage.sh/instances.json",
    rds: "https://instances.vantage.sh/rds/instances.json",
    cache: "https://instances.vantage.sh/cache/instances.json",
    redshift: "https://instances.vantage.sh/redshift/instances.json",
    opensearch: "https://instances.vantage.sh/opensearch/instances.json",
    azure: "https://instances.vantage.sh/azure/instances.json",
    gcp: "https://instances.vantage.sh/gcp/instances.json",
} as const;

const CHINA_SERVICES_JSON_URLS = {
    ec2: "https://instances.vantage.sh/instances-cn.json",
    rds: "https://instances.vantage.sh/rds/instances-cn.json",
    cache: "https://instances.vantage.sh/cache/instances-cn.json",
    redshift: "https://instances.vantage.sh/redshift/instances-cn.json",
    opensearch: "https://instances.vantage.sh/opensearch/instances-cn.json",
} as const;

const USES_SINGLE_PAGE_READ_STREAM = ["cache", "redshift", "opensearch"];

type VirtualInstancesRequestBodyTypesGlobal = {
    ec2: VirtualInstancesRequestBodyWithInfo<GlobalAWSRegions, "ec2">;
    rds: VirtualInstancesRequestBodyWithInfo<GlobalAWSRegions, "rds">;
    cache: VirtualInstancesRequestBodyWithInfo<GlobalAWSRegions, "cache">;
    redshift: VirtualInstancesRequestBodyWithInfo<GlobalAWSRegions, "redshift">;
    opensearch: VirtualInstancesRequestBodyWithInfo<
        GlobalAWSRegions,
        "opensearch"
    >;
    azure: VirtualInstancesRequestBodyWithInfo<GlobalAzureRegions, "azure">;
    gcp: VirtualInstancesRequestBodyWithInfo<GlobalGCPRegions, "gcp">;
}[keyof GlobalServiceTypes];

type VirtualInstancesRequestBodyTypesChina = {
    ec2: VirtualInstancesRequestBodyWithInfo<ChinaAWSRegions, "ec2">;
    rds: VirtualInstancesRequestBodyWithInfo<ChinaAWSRegions, "rds">;
    cache: VirtualInstancesRequestBodyWithInfo<ChinaAWSRegions, "cache">;
    redshift: VirtualInstancesRequestBodyWithInfo<ChinaAWSRegions, "redshift">;
    opensearch: VirtualInstancesRequestBodyWithInfo<
        ChinaAWSRegions,
        "opensearch"
    >;
}[keyof ChinaServiceTypes];

export type VirtualInstancesRequestBody =
    | VirtualInstancesRequestBodyTypesGlobal
    | VirtualInstancesRequestBodyTypesChina;

type VirtualInstancesResultRaw = {
    headers: string[];
    instances: {
        [instanceType: string]: string[];
    };
};

const NUMBER_REGEX = /\d+(\.\d+)?/g;

export class VirtualInstancesColumn {
    private textCache_: string | null = null;

    constructor(
        public readonly html: string,
        public readonly headerText: string,
    ) {}

    /**
     * Gets the text of the column.
     * @returns The text of the column.
     */
    get text() {
        if (this.textCache_ === null) {
            this.textCache_ = parse(this.html).text;
        }
        return this.textCache_;
    }

    /**
     * Gets the number of the column, if there is a number in the text.
     * @returns The number of the column, or null if there is no number in the text.
     */
    get number() {
        const match = this.text.match(NUMBER_REGEX);
        if (match) {
            return Number(match[0]);
        }
        return null;
    }
}

export class APIV1Client {
    /**
     * The base constructor for the APIV1Client.
     * @param apiKey - The API key to use for the client.
     * @param fetchClient - The fetch client to use for the client.
     */
    constructor(
        private readonly apiKey: string,
        private readonly fetchClient?: typeof fetch,
    ) {}

    /**
     * Gets a individual global instance of a service.
     * @param service - The service to get the instance of.
     * @param instanceType - The type of instance to get.
     * @returns The instance of the service.
     */
    async getGlobalInstance<Svc extends GlobalServices>(
        service: Svc,
        instanceType: string,
    ) {
        if (!instanceType) {
            throw new InvalidRequestError("Instance type is required");
        }
        const res = await (this.fetchClient || fetch)(
            `${BASE_URL}/api/v1/instances/${service}/${encodeURIComponent(instanceType)}/global`,
            {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json",
                    "User-Agent": "instances-api-client-ts",
                },
            },
        );
        if (!res.ok) await throw_(res);
        return remap(
            await res.json(),
            objRemappers[service],
        ) as GlobalServiceTypes[typeof service];
    }

    /**
     * Gets a individual China instance of a service.
     * @param service - The service to get the instance of.
     * @param instanceType - The type of instance to get.
     * @returns The instance of the service.
     */
    async getChinaInstance<Svc extends ChinaServices>(
        service: Svc,
        instanceType: string,
    ) {
        if (!instanceType) {
            throw new InvalidRequestError("Instance type is required");
        }
        const res = await (this.fetchClient || fetch)(
            `${BASE_URL}/api/v1/instances/${service}/${encodeURIComponent(instanceType)}/china`,
            {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json",
                    "User-Agent": "instances-api-client-ts",
                },
            },
        );
        if (!res.ok) await throw_(res);
        return remap(
            await res.json(),
            objRemappers[service],
        ) as ChinaServiceTypes[typeof service];
    }

    /**
     * Gets a family of global instances of a service.
     * @param service - The service to get the instances of.
     * @param family - The family of instances to get.
     * @returns The instances of the family of instances.
     */
    async getGlobalInstanceFamily<Svc extends GlobalServices>(
        service: Svc,
        family: string,
    ) {
        const res = await (this.fetchClient || fetch)(
            `${BASE_URL}/api/v1/instances/${service}/families/${encodeURIComponent(family)}/global`,
            {
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent": "instances-api-client-ts",
                },
            },
        );
        if (!res.ok) await throw_(res);
        return (await res.json()).map((instance: any) =>
            remap(instance, objRemappers[service]),
        ) as GlobalServiceTypes[typeof service][];
    }

    /**
     * Gets a family of China instances of a service.
     * @param service - The service to get the instances of.
     * @param family - The family of instances to get.
     * @returns The instances of the family of instances.
     */
    async getChinaInstanceFamily<Svc extends ChinaServices>(
        service: Svc,
        family: string,
    ) {
        const res = await (this.fetchClient || fetch)(
            `${BASE_URL}/api/v1/instances/${service}/families/${encodeURIComponent(family)}/china`,
            {
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent": "instances-api-client-ts",
                },
            },
        );
        if (!res.ok) await throw_(res);
        return (await res.json()).map((instance: any) =>
            remap(instance, objRemappers[service]),
        ) as ChinaServiceTypes[typeof service][];
    }

    /**
     * Gets all global instances of a service.
     * @param service - The service to get the instances of.
     * @returns The instances of the service.
     */
    getAllGlobalInstances<Svc extends GlobalServices>(
        service: Svc,
    ): AsyncGenerator<GlobalServiceTypes[typeof service][]> {
        if (USES_SINGLE_PAGE_READ_STREAM.includes(service)) {
            return singlePageReadStream(
                GLOBAL_SERVICES_JSON_URLS[service],
                service,
                this.fetchClient,
            );
        }
        return jsonStream(
            GLOBAL_SERVICES_JSON_URLS[service],
            service,
            this.fetchClient,
        );
    }

    /**
     * Gets all China instances of a service.
     * @param service - The service to get the instances of.
     * @returns The instances of the service.
     */
    getAllChinaInstances<Svc extends ChinaServices>(
        service: Svc,
    ): AsyncGenerator<ChinaServiceTypes[typeof service][]> {
        if (USES_SINGLE_PAGE_READ_STREAM.includes(service)) {
            return singlePageReadStream(
                CHINA_SERVICES_JSON_URLS[service],
                service,
                this.fetchClient,
            );
        }
        return jsonStream(
            CHINA_SERVICES_JSON_URLS[service],
            service,
            this.fetchClient,
        );
    }

    /**
     * Runs a virtual copy of instances.vantage.sh headlessly.
     * @param body - The body of the request.
     * @returns The result of the virtual copy of instances.vantage.sh.
     */
    async runVirtualInstances(body: VirtualInstancesRequestBody) {
        const res = await (this.fetchClient || fetch)(
            `${BASE_URL}/api/v1/virtual-instances`,
            {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json",
                    "User-Agent": "instances-api-client-ts",
                },
                method: "POST",
                body: JSON.stringify(body),
            },
        );
        if (!res.ok) await throw_(res);
        const j = (await res.json()) as VirtualInstancesResultRaw;
        return Object.fromEntries(
            Object.entries(j.instances).map(([instanceType, columns]) => [
                instanceType,
                columns.map(
                    (column, index) =>
                        new VirtualInstancesColumn(column, j.headers[index]),
                ),
            ]),
        );
    }
}
