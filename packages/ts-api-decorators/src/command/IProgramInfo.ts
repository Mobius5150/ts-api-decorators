export interface IProgramContactInfo {
    name?: string;
    url?: string;
    email?: string;
}

export interface IProgramLicenseInfo {
    name: string;
    url?: string;
}

export interface IProgramInfo {
    /**
     * The title of the API
     */
    title: string;
    /**
     * The main homepage for the API
     */
    homepage?: string;
    /**
     * A description of the API
     */
    description?: string;
    /**
     * A link to the terms of service for the API
     */
    termsOfService?: string;
    /**
     * Contact information for questions regarding the API
     */
    contact?: IProgramContactInfo;
    /**
     * One or more licenses that apply to the API and SDK
     */
    license?: IProgramLicenseInfo[];
    /**
     * The version of the API
     */
    version: string;
    /**
     * The host the API can be found at
     */
    host?: string;
    /**
     * The base path for all api methods
     */
    basePath?: string;
    /**
     * Http schemes for accessing the api
     */
    schemes?: string[];
}