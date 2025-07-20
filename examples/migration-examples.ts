/**
 * Example demonstrating gradual migration from JavaScript to TypeScript BioCatchClient
 * 
 * This example shows how to use the migration bridge to gradually transition
 * from JavaScript dependencies to TypeScript implementations.
 */

// Import the TypeScript SDK
import {
    BioCatchClient,
    BioCatchClientMigrationBridge,
    createBioCatchClient,
    BCProtocolType
} from '../src';

// Example 1: Using the migration bridge with mock JavaScript dependencies
function exampleGradualMigration() {
    // These would be your actual JavaScript dependencies from the legacy SDK
    const mockJsClient = {
        autoStart: (callback?: () => void) => {
            console.log('JS Client: Auto start called');
            callback?.();
        },
        manualStart: (config: any, url: string, callback?: () => void) => {
            console.log('JS Client: Manual start called', { url });
            callback?.();
        },
        stop: () => console.log('JS Client: Stop called'),
        pause: () => console.log('JS Client: Pause called'),
        resume: () => console.log('JS Client: Resume called'),
        updateCustomerSessionID: (id: string) => console.log('JS Client: Update session ID', id),
        changeContext: (context: string) => console.log('JS Client: Change context', context),
        startNewSession: (id: string) => console.log('JS Client: Start new session', id),
        setCoordinatesMasking: (enable: boolean) => console.log('JS Client: Set coordinates masking', enable),
        setCustomerBrand: (brand: string) => console.log('JS Client: Set customer brand', brand)
    };

    const mockJsDynamicCdApiLoader = {
        attachCdApi: (window: Window, sessionId?: string) => {
            console.log('JS DynamicCdApiLoader: Attach CD API', { sessionId });
            // Mock adding cdApi to window
            (window as any).cdApi = { loaded: true };
        }
    };

    const mockJsConfigMapper = {
        mapStartupConfigurations: (url: string, config: any) => {
            console.log('JS ConfigMapper: Map startup configurations', { url });
            return {
                getWupServerURL: () => url,
                getLogServerURL: () => null,
                getEnableFramesProcessing: () => true,
                getEnableCustomElementsProcessing: () => true,
                getEnableSameSiteNoneAndSecureCookies: () => true,
                getUseUrlWorker: () => false,
                getWorkerUrl: () => null,
                getIsWupServerURLProxy: () => false,
                getClientSettings: () => ({}),
                getCollectionSettings: () => ({}),
                getEnableStartupCustomerSessionId: () => true,
                getMutationMaxChunkSize: () => 1000,
                getMutationChunkDelayMs: () => 100,
                getPasswordIdMaskingList: () => [],
                getEnableUnmaskedValues: () => false,
                getAllowedUnmaskedValuesList: () => [],
                getEnableCoordinatesMasking: () => false,
                getIsFlutterApp: () => false,
                getEnableMinifiedWupUri: () => true,
                getEnableMinifiedLogUri: () => true,
                getMaxShadowDepth: () => 10,
                getEnableGraphCard: () => true,
                getEnableBrowserDisplayDetect: () => true,
                getEnableMathDetect: () => true
            };
        }
    };

    const mockJsServerUrlResolver = {
        resolve: (url: string, customerId?: string, protocolType?: any) => {
            console.log('JS ServerUrlResolver: Resolve URL', { url, customerId, protocolType });
            return `${url}?cid=${customerId}&protocol=${protocolType}`;
        }
    };

    // Create TypeScript client using JavaScript dependencies
    const tsClient = BioCatchClientMigrationBridge.createFromJSDependencies(
        mockJsClient,
        mockJsDynamicCdApiLoader,
        mockJsConfigMapper,
        mockJsServerUrlResolver,
        () => console.log('Remote configuration loaded!')
    );

    console.log('✅ Created TypeScript BioCatchClient using JavaScript dependencies');
    return tsClient;
}

// Example 2: Using the legacy compatible factory
function exampleLegacyCompatible() {
    // Mock the same dependencies as above (in real scenario, these would be imported from JS SDK)
    const mockDependencies = {
        client: { autoStart: () => console.log('Legacy client auto start') },
        loader: { attachCdApi: () => console.log('Legacy loader attach') },
        mapper: { mapStartupConfigurations: () => ({}) },
        resolver: { resolve: (url: string) => url }
    };

    // This function signature matches the original JavaScript BioCatchClient constructor exactly
    const tsClient = createBioCatchClient(
        mockDependencies.client,
        mockDependencies.loader,
        mockDependencies.mapper,
        mockDependencies.resolver,
        () => console.log('Legacy callback executed')
    );

    console.log('✅ Created TypeScript BioCatchClient using legacy factory');
    return tsClient;
}

// Example 3: Testing the client proxy interface
function exampleClientUsage() {
    const client = exampleGradualMigration();

    // Simulate how the client would be used
    console.log('\n--- Simulating Client Usage ---');

    // Access the global bcClient (if cdApi not already present)
    if (typeof window !== 'undefined' && window.bcClient) {
        window.bcClient.start(
            'https://api.biocatch.com',
            'customer123',
            'session456',
            { enableFrames: true },
            BCProtocolType.V3
        );

        window.bcClient.pause();
        window.bcClient.resume();
        window.bcClient.updateCustomerSessionID('newCustomer789');
        window.bcClient.changeContext('login');
        window.bcClient.setCoordinatesMasking(true);
        window.bcClient.setCustomerBrand('MyBank');
        window.bcClient.stop();
    }
}

// Example 4: Migration progression
function exampleMigrationProgression() {
    console.log('\n--- Migration Progression Example ---');

    // Step 1: Start with all JavaScript dependencies
    console.log('Step 1: All JS dependencies');
    const allJsClient = exampleGradualMigration();

    // Step 2: Replace one dependency with TypeScript (e.g., ServerUrlResolver)
    console.log('\nStep 2: Mixed JS/TS dependencies (ServerUrlResolver migrated to TS)');

    // In a real scenario, you would create actual TypeScript implementations
    const tsServerUrlResolver = {
        resolve: (url: string, customerId?: string, protocolType?: any) => {
            console.log('TS ServerUrlResolver: Enhanced resolve with validation', { url, customerId, protocolType });

            // Add TypeScript-specific validation
            if (!url || typeof url !== 'string') {
                throw new Error('Invalid URL provided to ServerUrlResolver');
            }

            return `${url}?cid=${customerId}&protocol=${protocolType}&ts_version=1`;
        }
    };

    // Continue using JS for other dependencies while gradually migrating
    // This shows how you can mix and match during the transition

    console.log('✅ Gradual migration allows mixing JS and TS implementations');
}

// Run examples if this file is executed directly
if (require.main === module) {
    console.log('🚀 BioCatch SDK TypeScript Migration Examples\n');

    try {
        exampleGradualMigration();
        exampleLegacyCompatible();
        exampleClientUsage();
        exampleMigrationProgression();

        console.log('\n✅ All examples completed successfully!');
        console.log('\n📝 Next steps:');
        console.log('1. Import actual JavaScript dependencies from your legacy SDK');
        console.log('2. Test the migration bridge with real dependencies');
        console.log('3. Start migrating individual components to TypeScript');
        console.log('4. Gradually replace JS dependencies with TS implementations');
    } catch (error) {
        console.error('❌ Example failed:', error);
    }
}

export {
    exampleGradualMigration,
    exampleLegacyCompatible,
    exampleClientUsage,
    exampleMigrationProgression
};
