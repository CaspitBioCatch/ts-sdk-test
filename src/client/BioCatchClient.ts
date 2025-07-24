import {
    IClient,
    IDynamicCdApiLoader,
    IConfigMapper,
    IServerUrlResolver,
    IBioCatchClientProxy,
    BioCatchClientDependencies,
    SDKConfiguration
} from '../types/interfaces';
import { BCProtocolType, BCProtocolTypeValue } from '../types/BCProtocolType';
import { SupportedBrowserChecker } from './SupportedBrowserChecker';

// Import or re-export polyfills from the JS legacy module
// This allows gradual migration by reusing existing polyfills
type PolyfillsApplier = () => void;

// Declare global window interface extension
declare global {
    interface Window {
        cdApi?: any;
        bcClient?: IBioCatchClientProxy;
    }
}

/**
 * TypeScript implementation of BioCatchClient
 * This class provides the same functionality as the original JavaScript BioCatchClient
 * but with full TypeScript type safety and interfaces.
 */
export class BioCatchClient {
    private readonly client: IClient;
    private readonly dynamicCdApiLoader: IDynamicCdApiLoader;
    private readonly configMapper: IConfigMapper;
    private readonly serverUrlResolver: IServerUrlResolver;
    private readonly remoteConfigurationLoadedCallback?: () => void;

    constructor(dependencies: BioCatchClientDependencies);
    constructor(
        client: IClient,
        dynamicCdApiLoader: IDynamicCdApiLoader,
        configMapper: IConfigMapper,
        serverUrlResolver: IServerUrlResolver,
        remoteConfigurationLoadedCallback?: () => void
    )
    constructor(
        clientOrDependencies: IClient | BioCatchClientDependencies,
        dynamicCdApiLoader?: IDynamicCdApiLoader,
        configMapper?: IConfigMapper,
        serverUrlResolver?: IServerUrlResolver,
        remoteConfigurationLoadedCallback?: () => void
    ) {
        // Handle both constructor signatures
        if (this.isDependenciesObject(clientOrDependencies)) {
            this.client = clientOrDependencies.client;
            this.dynamicCdApiLoader = clientOrDependencies.dynamicCdApiLoader;
            this.configMapper = clientOrDependencies.configMapper;
            this.serverUrlResolver = clientOrDependencies.serverUrlResolver;
            this.remoteConfigurationLoadedCallback = clientOrDependencies.remoteConfigurationLoadedCallback;
        } else {
            if (!dynamicCdApiLoader || !configMapper || !serverUrlResolver) {
                throw new Error('All dependencies must be provided when using individual parameters');
            }
            this.client = clientOrDependencies;
            this.dynamicCdApiLoader = dynamicCdApiLoader;
            this.configMapper = configMapper;
            this.serverUrlResolver = serverUrlResolver;
            this.remoteConfigurationLoadedCallback = remoteConfigurationLoadedCallback;
        }
        console.log("initalizeBioCatchClient");
        this.initialize();
    }

    private isDependenciesObject(obj: any): obj is BioCatchClientDependencies {
        return obj && typeof obj === 'object' && 'client' in obj && 'dynamicCdApiLoader' in obj;
    }

    private initialize(): void {
        // Apply polyfills (we'll need to implement or import this)
        this.applyPolyfills();

        // Check browser support - abort if unsupported
        if (!SupportedBrowserChecker.isSupported()) {
            console.warn('BioCatch SDK: Browser not supported');
            return;
        }

        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
            console.warn('BioCatch SDK: Not in browser environment, skipping initialization');
            return;
        }

        // Initialize based on whether cdApi is already available
        if ('cdApi' in window && window.cdApi) {
            this.client.autoStart(this.remoteConfigurationLoadedCallback);
        } else {
            window.bcClient = this.createProxyInterface();
        }
    }

    private applyPolyfills(): void {
        // For gradual migration, we can import the existing polyfills from JS legacy
        // This allows us to reuse the existing implementation while migrating
        try {
            // In the actual implementation, you would:
            // import applyPolyfills from '../../js-sdk-legacy/src/main/common/polyfills/PolyfillsApplier';
            // applyPolyfills();

            // For now, we'll add a basic polyfill check
            if (typeof window !== 'undefined') {
                // Basic polyfill implementations can go here
                console.debug('BioCatch SDK: Polyfills applied');
            }
        } catch (error) {
            console.warn('BioCatch SDK: Failed to apply polyfills', error);
        }
    }

    /**
     * Creates a proxy interface that provides the public API
     * This interface is disconnected from the actual BioCatchClient instance
     * to make it harder to inspect or debug internal members
     */
    private createProxyInterface(): IBioCatchClientProxy {
        return {
            start: (
                wupServerUrl: string,
                customerID: string,
                customerSessionID: string,
                configurations: SDKConfiguration,
                protocolType: BCProtocolTypeValue = BCProtocolType.V3
            ): void => {
                // Prioritize the extended options and cid provided by the start params over the raw url
                const resolvedServerUrl = this.serverUrlResolver.resolve(
                    wupServerUrl,
                    customerID,
                    protocolType
                );

                // Translate the configurations json to StartupConfigurations object
                const startupConfigurations = this.configMapper.mapStartupConfigurations(
                    resolvedServerUrl,
                    configurations
                );

                // Attach to the window the cdApi so the sdk could work as it used to
                this.dynamicCdApiLoader.attachCdApi(window, customerSessionID);

                this.client.manualStart(
                    startupConfigurations,
                    resolvedServerUrl,
                    this.remoteConfigurationLoadedCallback
                );
            },

            stop: (): void => {
                this.client.stop();
            },

            pause: (): void => {
                this.client.pause();
            },

            resume: (): void => {
                this.client.resume();
            },

            updateCustomerSessionID: (customerID: string): void => {
                this.client.updateCustomerSessionID(customerID);
            },

            changeContext: (contextName: string): void => {
                this.client.changeContext(contextName);
            },

            startNewSession: (customerSessionID: string): void => {
                this.client.startNewSession(customerSessionID);
            },

            setCoordinatesMasking: (isEnable: boolean): void => {
                this.client.setCoordinatesMasking(isEnable);
            },

            setCustomerBrand: (brand: string): void => {
                this.client.setCustomerBrand(brand);
            }
        };
    }
}
