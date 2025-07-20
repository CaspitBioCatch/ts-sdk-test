import { BioCatchClient } from './BioCatchClient';
import {
    IClient,
    IDynamicCdApiLoader,
    IConfigMapper,
    IServerUrlResolver,
    BioCatchClientDependencies,
    SDKConfiguration
} from '../types/interfaces';
import { BCProtocolTypeValue } from '../types/BCProtocolType';

/**
 * Migration Bridge for gradual migration from JS to TS BioCatchClient
 * This class allows you to gradually migrate by providing adapters
 * for existing JavaScript implementations while using the new TypeScript structure
 */
export class BioCatchClientMigrationBridge {
    private tsClient?: BioCatchClient;

    /**
     * Creates a TypeScript BioCatchClient instance using existing JavaScript dependencies
     * This enables gradual migration by wrapping JS implementations with TS interfaces
     */
    static createFromJSDependencies(
        jsClient: any, // The existing JavaScript client
        jsDynamicCdApiLoader: any,
        jsConfigMapper: any,
        jsServerUrlResolver: any,
        remoteConfigurationLoadedCallback?: () => void
    ): BioCatchClient {

        // Create TypeScript adapters for JavaScript dependencies
        const dependencies: BioCatchClientDependencies = {
            client: BioCatchClientMigrationBridge.createClientAdapter(jsClient),
            dynamicCdApiLoader: BioCatchClientMigrationBridge.createDynamicCdApiLoaderAdapter(jsDynamicCdApiLoader),
            configMapper: BioCatchClientMigrationBridge.createConfigMapperAdapter(jsConfigMapper),
            serverUrlResolver: BioCatchClientMigrationBridge.createServerUrlResolverAdapter(jsServerUrlResolver),
            remoteConfigurationLoadedCallback
        };

        return new BioCatchClient(dependencies);
    }

    /**
     * Adapter pattern for JavaScript Client to TypeScript IClient interface
     */
    private static createClientAdapter(jsClient: any): IClient {
        return {
            autoStart: (callback?: () => void) => jsClient.autoStart?.(callback),
            manualStart: (startupConfigurations, resolvedServerUrl, callback?) =>
                jsClient.manualStart?.(startupConfigurations, resolvedServerUrl, callback),
            stop: () => jsClient.stop?.(),
            pause: () => jsClient.pause?.(),
            resume: () => jsClient.resume?.(),
            updateCustomerSessionID: (customerID: string) => jsClient.updateCustomerSessionID?.(customerID),
            changeContext: (contextName: string) => jsClient.changeContext?.(contextName),
            startNewSession: (customerSessionID: string) => jsClient.startNewSession?.(customerSessionID),
            setCoordinatesMasking: (isEnable: boolean) => jsClient.setCoordinatesMasking?.(isEnable),
            setCustomerBrand: (brand: string) => jsClient.setCustomerBrand?.(brand)
        };
    }

    /**
     * Adapter for JavaScript DynamicCdApiLoader to TypeScript interface
     */
    private static createDynamicCdApiLoaderAdapter(jsLoader: any): IDynamicCdApiLoader {
        return {
            attachCdApi: (window: Window, customerSessionID?: string) =>
                jsLoader.attachCdApi?.(window, customerSessionID)
        };
    }

    /**
     * Adapter for JavaScript ConfigMapper to TypeScript interface
     */
    private static createConfigMapperAdapter(jsMapper: any): IConfigMapper {
        return {
            mapStartupConfigurations: (wupServerUrl: string, configurations: SDKConfiguration) =>
                jsMapper.mapStartupConfigurations?.(wupServerUrl, configurations)
        };
    }

    /**
     * Adapter for JavaScript ServerUrlResolver to TypeScript interface
     */
    private static createServerUrlResolverAdapter(jsResolver: any): IServerUrlResolver {
        return {
            resolve: (wupServerUrl: string, customerID?: string, protocolType?: BCProtocolTypeValue) =>
                jsResolver.resolve?.(wupServerUrl, customerID, protocolType)
        };
    }

    /**
     * Factory method to create BioCatchClient that mimics the original JS constructor
     * This provides backward compatibility during migration
     */
    static createLegacyCompatible(
        client: any,
        dynamicCdApiLoader: any,
        configMapper: any,
        serverUrlResolver: any,
        remoteConfigurationLoadedCallback?: () => void
    ): BioCatchClient {
        return this.createFromJSDependencies(
            client,
            dynamicCdApiLoader,
            configMapper,
            serverUrlResolver,
            remoteConfigurationLoadedCallback
        );
    }
}

/**
 * Export a factory function that mimics the original JavaScript BioCatchClient constructor
 * This allows existing code to work with minimal changes during migration
 */
export function createBioCatchClient(
    client: any,
    dynamicCdApiLoader: any,
    configMapper: any,
    serverUrlResolver: any,
    remoteConfigurationLoadedCallback?: () => void
): BioCatchClient {
    return BioCatchClientMigrationBridge.createLegacyCompatible(
        client,
        dynamicCdApiLoader,
        configMapper,
        serverUrlResolver,
        remoteConfigurationLoadedCallback
    );
}
