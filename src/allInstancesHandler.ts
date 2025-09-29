import type { RDSRemapItems } from "./apiTypings";

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

export function getAllInstancesObj<
    AWSRegions extends string,
    AzureRegions extends string,
    ExcludeAzure extends boolean,
>(isChina: ExcludeAzure, urlSuffix: string) {
    // TODO
}
