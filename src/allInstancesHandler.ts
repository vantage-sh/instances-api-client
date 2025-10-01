import { NotFoundError, UnknownHTTPError } from "./apiErrors";
import type {
    EC2Instance,
    RDSInstance,
    CacheInstance,
    RedshiftInstance,
    OpenSearchInstance,
    RDSRemapItems,
    AzureInstance,
} from "./apiTypings";

const toConvert = [
    "GPU",
    "memoryGib",
    "vcpu",
    "slicesPerNode",
    "maxClients",
    "memory",
    "normalizationSizeFactor",
];

export function remap(obj: any, objRemapper?: (obj: any) => any): any {
    if (obj === null || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map((item) => remap(item, objRemapper));
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
        const unsnake = key.replace(/[-_]([a-z])/g, (_, letter) =>
            letter.toUpperCase(),
        );
        if (unsnake !== key) {
            obj[unsnake] = remap(obj[key]);
            delete obj[key];
        }
        if (toConvert.includes(unsnake) && typeof obj[unsnake] === "string") {
            const num = Number(obj[unsnake]);
            if (!isNaN(num)) obj[unsnake] = num;
        }
    }
    if (objRemapper) obj = objRemapper(obj);
    return obj;
}

const rdsRemapping: { [platform: string]: RDSRemapItems } = {
    "14": "postgres",
    "2": "mysql",
    "10": "sqlServerExpress",
    "11": "sqlServerWeb",
    "12": "sqlServerStandard",
    "15": "sqlServerEnterprise",
    "21": "auroraPgMySQL",
    "211": "auroraIoOptimized",
    "18": "mariadb",
    "5": "oracleEnterprise",
};

function remapRdsPlatforms(obj: any): any {
    for (const platform in obj) {
        const remapping = rdsRemapping[platform];
        if (remapping) {
            obj[remapping] = obj[platform];
            delete obj[platform];
        }
    }
}

function remapRds(obj: any): any {
    for (const region in obj.pricing) {
        remapRdsPlatforms(obj.pricing[region]);
    }
    return obj;
}

function remapEc2(obj: any): any {
    const generation = obj.generation === "current";
    obj.currentGeneration = generation;
    delete obj.generation;
    return obj;
}

export const objRemappers: { [service: string]: (obj: any) => any } = {
    rds: remapRds,
    ec2: remapEc2,
};

function throw_(res: Response) {
    if (res.status === 404) {
        throw new NotFoundError("Instance group not found");
    }
    throw new UnknownHTTPError(res.status, res.statusText);
}

function singlePageReadStream<T>(
    url: string,
    svc: string,
    fetchClient?: typeof fetch,
): AsyncGenerator<T[]> {
    return (async function* () {
        const res = await (fetchClient || fetch)(url);
        if (!res.ok) throw_(res);
        const j = await res.json();
        yield remap(j, objRemappers[svc]) as T[];
    })();
}

const nlSpaceClosingCurlyBracketAndComma = "\n },\n";

const td = new TextDecoder();

function jsonStream<T>(
    url: string,
    svc: string,
    fetchClient?: typeof fetch,
): AsyncGenerator<T[]> {
    return (async function* () {
        const res = await (fetchClient || fetch)(url);
        if (!res.ok) throw_(res);

        const reader = res.body?.getReader();
        if (!reader) {
            throw new Error("Response body is null");
        }

        let buffer = "";
        const page: any[] = [];

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
                buffer += td.decode(value, { stream: true });
                let endIndexOf = buffer.lastIndexOf(
                    nlSpaceClosingCurlyBracketAndComma,
                );
                if (endIndexOf !== -1) {
                    const chunk = buffer.slice(0, endIndexOf + 3);
                    buffer = buffer.slice(endIndexOf + 4).trim();
                    if (buffer === "") {
                        buffer = "[";
                    } else {
                        buffer = "[" + buffer;
                    }
                    page.push(...JSON.parse(chunk + "]"));
                    if (page.length >= 50) {
                        yield remap(page, objRemappers[svc]) as T[];
                        page.length = 0;
                    }
                }
            }
        }

        if (buffer.trim() !== "") {
            page.push(...JSON.parse(buffer));
        }
        if (page.length > 0) {
            yield remap(page, objRemappers[svc]) as T[];
        }
    })();
}

type AllGeneratorsIncludingAzure<AWSRegions extends string> = {
    ec2: (
        fetchClient?: typeof fetch,
    ) => AsyncGenerator<EC2Instance<AWSRegions>[]>;
    rds: (
        fetchClient?: typeof fetch,
    ) => AsyncGenerator<RDSInstance<AWSRegions>[]>;
    cache: (
        fetchClient?: typeof fetch,
    ) => AsyncGenerator<CacheInstance<AWSRegions>[]>;
    redshift: (
        fetchClient?: typeof fetch,
    ) => AsyncGenerator<RedshiftInstance<AWSRegions>[]>;
    opensearch: (
        fetchClient?: typeof fetch,
    ) => AsyncGenerator<OpenSearchInstance<AWSRegions>[]>;
    azure: (fetchClient?: typeof fetch) => AsyncGenerator<AzureInstance[]>;
};

type AllInstancesGenerators<
    AWSRegions extends string,
    ExcludeAzure extends boolean,
> = ExcludeAzure extends true
    ? Omit<AllGeneratorsIncludingAzure<AWSRegions>, "azure">
    : AllGeneratorsIncludingAzure<AWSRegions>;

export function getAllInstancesObj<
    AWSRegions extends string,
    ExcludeAzure extends boolean,
>(
    isChina: ExcludeAzure,
    urlSuffix: string,
): AllInstancesGenerators<AWSRegions, ExcludeAzure> {
    const baseUrl = "https://instances.vantage.sh/";
    const generators: AllGeneratorsIncludingAzure<AWSRegions> = {
        cache: (fetchClient?: typeof fetch) =>
            singlePageReadStream<CacheInstance<AWSRegions>>(
                `${baseUrl}cache/instances${urlSuffix}`,
                "cache",
                fetchClient,
            ),
        redshift: (fetchClient?: typeof fetch) =>
            singlePageReadStream<RedshiftInstance<AWSRegions>>(
                `${baseUrl}redshift/instances${urlSuffix}`,
                "redshift",
                fetchClient,
            ),
        opensearch: (fetchClient?: typeof fetch) =>
            singlePageReadStream<OpenSearchInstance<AWSRegions>>(
                `${baseUrl}opensearch/instances${urlSuffix}`,
                "opensearch",
                fetchClient,
            ),

        ec2: (fetchClient?: typeof fetch) =>
            jsonStream<EC2Instance<AWSRegions>>(
                `${baseUrl}instances${urlSuffix}`,
                "ec2",
                fetchClient,
            ),
        rds: (fetchClient?: typeof fetch) =>
            jsonStream<RDSInstance<AWSRegions>>(
                `${baseUrl}rds/instances${urlSuffix}`,
                "rds",
                fetchClient,
            ),
        azure: (fetchClient?: typeof fetch) =>
            jsonStream<AzureInstance>(
                `${baseUrl}azure/instances${urlSuffix}`,
                "azure",
                fetchClient,
            ),
    };

    if (isChina) {
        // @ts-ignore: Some type hackery. Seems to break vs code but not tsup so is an ignore.
        delete generators.azure;
    }

    return generators;
}
