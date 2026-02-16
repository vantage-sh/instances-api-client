import type {
    CacheInstance,
    ChinaAWSRegions,
    EC2Instance,
    GlobalAWSRegions,
    OpenSearchInstance,
    RDSInstance,
    RedshiftInstance,
} from "./apiTypings";

/**
 * Helper function to take an async generator of page arrays and return a single array.
 * @param generatorFunction The async generator function that yields pages of items that you wish to combine.
 * @param args The arguments to pass to the generator function.
 * @returns A promise that resolves to a single array containing all items from all pages.
 */
export async function asyncPageGeneratorToArray<T, Args extends unknown[]>(
    generatorFunction: (...args: Args) => AsyncGenerator<T[]>,
    ...args: Args
): Promise<T[]> {
    const pages: T[][] = [];
    for await (const page of generatorFunction(...args)) {
        pages.push(page);
    }
    return pages.flat();
}

/** Defines a global EC2 instance. */
export type GlobalEC2Instance = EC2Instance<GlobalAWSRegions>;

/** Defines a China EC2 instance. */
export type ChinaEC2Instance = EC2Instance<ChinaAWSRegions>;

/** Defines a global RDS instance. */
export type GlobalRDSInstance = RDSInstance<GlobalAWSRegions>;

/** Defines a China RDS instance. */
export type ChinaRDSInstance = RDSInstance<ChinaAWSRegions>;

/** Defines a global Cache instance. */
export type GlobalCacheInstance = CacheInstance<GlobalAWSRegions>;

/** Defines a China Cache instance. */
export type ChinaCacheInstance = CacheInstance<ChinaAWSRegions>;

/** Defines a global Redshift instance. */
export type GlobalRedshiftInstance = RedshiftInstance<GlobalAWSRegions>;

/** Defines a China Redshift instance. */
export type ChinaRedshiftInstance = RedshiftInstance<ChinaAWSRegions>;

/** Defines a global OpenSearch instance. */
export type GlobalOpenSearchInstance = OpenSearchInstance<GlobalAWSRegions>;

/** Defines a China OpenSearch instance. */
export type ChinaOpenSearchInstance = OpenSearchInstance<ChinaAWSRegions>;
