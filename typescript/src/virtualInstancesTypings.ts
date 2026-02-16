import { Columns, SupportedServices } from "./apiTypings";

export type VirtualInstancesRequestBodyBasic<
    Regions extends string,
    ServiceKey extends keyof SupportedServices,
> = {
    /** Defines the service that virtual instances will be ran in. */
    service: ServiceKey;

    /** Defines the region that virtual instances will be ran in. */
    region: Regions;

    /** Defines the columns to be included in the virtual instances request. */
    columns: Columns<ServiceKey>[];

    /** A search term to be applied to all columns. */
    globalSearch?: string;

    /** Defines the time granularity for cost estimation. */
    costDuration?:
        | "secondly"
        | "minutely"
        | "hourly"
        | "daily"
        | "weekly"
        | "monthly"
        | "annually";

    /** Defines the pricing unit for cost estimation. */
    pricingUnit?:
        | "instance"
        | "vcpu"
        | "memory"
        | SupportedServices[ServiceKey]["ecu"];

    /** The currency for cost estimation. Defaults to USD. */
    currency?: string;
};

export type VirtualInstancesRequestBodyWithInfo<
    Regions extends string,
    ServiceKey extends keyof SupportedServices,
> = SupportedServices[ServiceKey]["reservedTerms"] extends null
    ? VirtualInstancesRequestBodyBasic<Regions, ServiceKey>
    : VirtualInstancesRequestBodyBasic<Regions, ServiceKey> & {
          /** Defines the reserved term for the virtual instances request. */
          reservedTerm?: SupportedServices[ServiceKey]["reservedTerms"];
      };
