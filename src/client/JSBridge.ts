/**
 * Example: Bridging TypeScript BioCatchClient with existing JavaScript dependencies
 * 
 * This file shows how to use the new TypeScript BioCatchClient while still
 * leveraging the existing JavaScript dependencies during the gradual migration.
 */

import { BioCatchClient } from './BioCatchClient';
import {
    IClient,
    IDynamicCdApiLoader,
    IConfigMapper,
    IServerUrlResolver
} from '../types/interfaces';

/**
 * Wrapper to adapt existing JavaScript Client to TypeScript interface
 */
class ClientAdapter implements IClient {
    constructor(private jsClient: any) { }

    autoStart(remoteConfigurationLoadedCallback?: () => void): void {
        this.jsClient.autoStart(remoteConfigurationLoadedCallback);
    }

    manualStart(startupConfigurations: any, resolvedServerUrl: string, remoteConfigurationLoadedCallback?: () => void): void {
        this.jsClient.manualStart(startupConfigurations, resolvedServerUrl, remoteConfigurationLoadedCallback);
    }

    stop(): void {
        this.jsClient.stop();
    }

    pause(): void {
        this.jsClient.pause();
    }

    resume(): void {
        this.jsClient.resume();
    }

    updateCustomerSessionID(customerID: string): void {
        this.jsClient.updateCustomerSessionID(customerID);
    }

    changeContext(contextName: string): void {
        this.jsClient.changeContext(contextName);
    }

    startNewSession(customerSessionID: string): void {
        this.jsClient.startNewSession(customerSessionID);
    }

    setCoordinatesMasking(isEnable: boolean): void {
        this.jsClient.setCoordinatesMasking(isEnable);
    }

    setCustomerBrand(brand: string): void {
        this.jsClient.setCustomerBrand(brand);
    }
}

/**
 * Wrapper to adapt existing JavaScript DynamicCdApiLoader to TypeScript interface
 */
class DynamicCdApiLoaderAdapter implements IDynamicCdApiLoader {
    constructor(private jsLoader: any) { }

    attachCdApi(window: Window, customerSessionID?: string): void {
        this.jsLoader.attachCdApi(window, customerSessionID);
    }
}

/**
 * Wrapper to adapt existing JavaScript ConfigMapper to TypeScript interface
 */
class ConfigMapperAdapter implements IConfigMapper {
    constructor(private jsMapper: any) { }

    mapStartupConfigurations(wupServerUrl: string, configurations: any): any {
        return this.jsMapper.mapStartupConfigurations(wupServerUrl, configurations);
    }
}

/**
 * Wrapper to adapt existing JavaScript ServerUrlResolver to TypeScript interface
 */
class ServerUrlResolverAdapter implements IServerUrlResolver {
    constructor(private jsResolver: any) { }

    resolve(wupServerUrl: string, customerID?: string, protocolType?: any): string {
        return this.jsResolver.resolve(wupServerUrl, customerID, protocolType);
    }
}

/**
 * Factory function to create TypeScript BioCatchClient using existing JavaScript dependencies
 * 
 * @param jsClient - Existing JavaScript Client instance
 * @param jsDynamicCdApiLoader - Existing JavaScript DynamicCdApiLoader instance
 * @param jsConfigMapper - Existing JavaScript ConfigMapper instance
 * @param jsServerUrlResolver - Existing JavaScript ServerUrlResolver instance
 * @param remoteConfigurationLoadedCallback - Optional callback function
 * @returns TypeScript BioCatchClient instance
 */
export function createBioCatchClientFromJS(
    jsClient: any,
    jsDynamicCdApiLoader: any,
    jsConfigMapper: any,
    jsServerUrlResolver: any,
    remoteConfigurationLoadedCallback?: () => void
): BioCatchClient {
    const clientAdapter = new ClientAdapter(jsClient);
    const loaderAdapter = new DynamicCdApiLoaderAdapter(jsDynamicCdApiLoader);
    const mapperAdapter = new ConfigMapperAdapter(jsConfigMapper);
    const resolverAdapter = new ServerUrlResolverAdapter(jsServerUrlResolver);

    return new BioCatchClient(
        clientAdapter,
        loaderAdapter,
        mapperAdapter,
        resolverAdapter,
        remoteConfigurationLoadedCallback
    );
}

/**
 * Example usage:
 * 
 * ```typescript
 * // Import existing JavaScript modules
 * import Client from '../js-sdk-legacy/src/main/Client';
 * import { DynamicCdApiLoader } from '../js-sdk-legacy/src/main/core/DynamicCdApiLoader';
 * import { ConfigMapper } from '../js-sdk-legacy/src/main/core/ConfigMapper';
 * import { ServerUrlResolver } from '../js-sdk-legacy/src/main/core/ServerUrlResolver';
 * 
 * // Create instances
 * const client = new Client();
 * const dynamicCdApiLoader = new DynamicCdApiLoader();
 * const configMapper = new ConfigMapper();
 * const serverUrlResolver = new ServerUrlResolver();
 * 
 * // Create TypeScript BioCatchClient
 * const tsClient = createBioCatchClientFromJS(
 *   client,
 *   dynamicCdApiLoader,
 *   configMapper,
 *   serverUrlResolver,
 *   () => console.log('Configuration loaded')
 * );
 * ```
 */
