import { BCProtocolTypeValue } from './BCProtocolType';

/**
 * Configuration object for SDK startup
 */
export interface SDKConfiguration {
    [key: string]: any;
}

/**
 * Startup configurations interface
 */
export interface StartupConfigurations {
    getWupServerURL(): string;
    getLogServerURL(): string | null;
    getEnableFramesProcessing(): boolean;
    getEnableCustomElementsProcessing(): boolean;
    getEnableSameSiteNoneAndSecureCookies(): boolean;
    getUseUrlWorker(): boolean;
    getWorkerUrl(): string | null;
    getIsWupServerURLProxy(): boolean;
    getClientSettings(): any;
    getCollectionSettings(): any;
    getEnableStartupCustomerSessionId(): boolean;
    getMutationMaxChunkSize(): number;
    getMutationChunkDelayMs(): number;
    getPasswordIdMaskingList(): string[];
    getEnableUnmaskedValues(): boolean;
    getAllowedUnmaskedValuesList(): string[];
    getEnableCoordinatesMasking(): boolean;
    getIsFlutterApp(): boolean;
    getEnableMinifiedWupUri(): boolean;
    getEnableMinifiedLogUri(): boolean;
    getMaxShadowDepth(): number;
    getEnableGraphCard(): boolean;
    getEnableBrowserDisplayDetect(): boolean;
    getEnableMathDetect(): boolean;
}

/**
 * Client interface - represents the main client functionality
 */
export interface IClient {
    autoStart(remoteConfigurationLoadedCallback?: () => void): void;
    manualStart(
        startupConfigurations: StartupConfigurations,
        resolvedServerUrl: string,
        remoteConfigurationLoadedCallback?: () => void
    ): void;
    stop(): void;
    pause(): void;
    resume(): void;
    updateCustomerSessionID(customerID: string): void;
    changeContext(contextName: string): void;
    startNewSession(customerSessionID: string): void;
    setCoordinatesMasking(isEnable: boolean): void;
    setCustomerBrand(brand: string): void;
}

/**
 * Dynamic CD API Loader interface
 */
export interface IDynamicCdApiLoader {
    attachCdApi(window: Window, customerSessionID?: string): void;
}

/**
 * Configuration Mapper interface
 */
export interface IConfigMapper {
    mapStartupConfigurations(
        wupServerUrl: string,
        configurations: SDKConfiguration
    ): StartupConfigurations;
}

/**
 * Server URL Resolver interface
 */
export interface IServerUrlResolver {
    resolve(
        wupServerUrl: string,
        customerID?: string,
        protocolType?: BCProtocolTypeValue
    ): string;
}

/**
 * BioCatch Client Proxy Interface - the public API
 */
export interface IBioCatchClientProxy {
    start(
        wupServerUrl: string,
        customerID: string,
        customerSessionID: string,
        configurations: SDKConfiguration,
        protocolType?: BCProtocolTypeValue
    ): void;
    stop(): void;
    pause(): void;
    resume(): void;
    updateCustomerSessionID(customerID: string): void;
    changeContext(contextName: string): void;
    startNewSession(customerSessionID: string): void;
    setCoordinatesMasking(isEnable: boolean): void;
    setCustomerBrand(brand: string): void;
}

/**
 * BioCatch Client Constructor Dependencies
 */
export interface BioCatchClientDependencies {
    client: IClient;
    dynamicCdApiLoader: IDynamicCdApiLoader;
    configMapper: IConfigMapper;
    serverUrlResolver: IServerUrlResolver;
    remoteConfigurationLoadedCallback?: () => void;
}
