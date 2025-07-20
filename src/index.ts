// Main client export
export { BioCatchClient } from './client/BioCatchClient';

// Migration utilities for gradual migration from JS to TS
export { BioCatchClientMigrationBridge, createBioCatchClient } from './client/BioCatchClientMigrationBridge';

// Type exports
export { BCProtocolType } from './types/BCProtocolType';
export type { BCProtocolTypeValue } from './types/BCProtocolType';
export type {
    SDKConfiguration,
    StartupConfigurations,
    IClient,
    IDynamicCdApiLoader,
    IConfigMapper,
    IServerUrlResolver,
    IBioCatchClientProxy,
    BioCatchClientDependencies
} from './types/interfaces';

// Utility exports
export { SupportedBrowserChecker } from './client/SupportedBrowserChecker';
