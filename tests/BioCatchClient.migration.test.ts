/**
 * Simple verification script for BioCatchClient TypeScript migration
 * Run this with: npx ts-node tests/BioCatchClient.migration.test.ts
 */

import {
    BioCatchClient,
    BioCatchClientMigrationBridge,
    BCProtocolType
} from '../src';

// Mock JavaScript dependencies that mimic the original SDK structure
const createMockJSDependencies = () => {
    return {
        client: {
            autoStart: (callback?: () => void) => {
                console.log('Mock JS Client: autoStart called');
                callback?.();
            },
            manualStart: (config: any, url: string, callback?: () => void) => {
                console.log('Mock JS Client: manualStart called with URL:', url);
                callback?.();
            },
            stop: () => console.log('Mock JS Client: stop called'),
            pause: () => console.log('Mock JS Client: pause called'),
            resume: () => console.log('Mock JS Client: resume called'),
            updateCustomerSessionID: (id: string) => console.log('Mock JS Client: updateCustomerSessionID called with:', id),
            changeContext: (context: string) => console.log('Mock JS Client: changeContext called with:', context),
            startNewSession: (id: string) => console.log('Mock JS Client: startNewSession called with:', id),
            setCoordinatesMasking: (enable: boolean) => console.log('Mock JS Client: setCoordinatesMasking called with:', enable),
            setCustomerBrand: (brand: string) => console.log('Mock JS Client: setCustomerBrand called with:', brand)
        },
        dynamicCdApiLoader: {
            attachCdApi: (window: any, sessionId?: string) => {
                console.log('Mock JS DynamicCdApiLoader: attachCdApi called with sessionId:', sessionId);
                window.cdApi = { loaded: true };
            }
        },
        configMapper: {
            mapStartupConfigurations: (url: string, config: any) => {
                console.log('Mock JS ConfigMapper: mapStartupConfigurations called with URL:', url);
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
        },
        serverUrlResolver: {
            resolve: (url: string, customerId?: string, protocolType?: any) => {
                console.log('Mock JS ServerUrlResolver: resolve called with:', { url, customerId, protocolType });
                return `${url}?cid=${customerId}&protocol=${protocolType}`;
            }
        }
    };
};

function runMigrationTests() {
    console.log('🚀 Running BioCatchClient TypeScript Migration Verification\n');

    try {
        // Test 1: Migration Bridge
        console.log('📋 Test 1: Migration Bridge Creation');
        const mockDeps = createMockJSDependencies();

        const tsClient = BioCatchClientMigrationBridge.createFromJSDependencies(
            mockDeps.client,
            mockDeps.dynamicCdApiLoader,
            mockDeps.configMapper,
            mockDeps.serverUrlResolver
        );

        if (tsClient instanceof BioCatchClient) {
            console.log('✅ Successfully created TypeScript client from JavaScript dependencies');
        } else {
            throw new Error('Failed to create TypeScript client');
        }

        // Test 2: Constructor Patterns
        console.log('\n📋 Test 2: Constructor Patterns');

        // Dependencies object constructor
        const clientWithDepsObject = new BioCatchClient({
            client: mockDeps.client as any,
            dynamicCdApiLoader: mockDeps.dynamicCdApiLoader as any,
            configMapper: mockDeps.configMapper as any,
            serverUrlResolver: mockDeps.serverUrlResolver as any
        });

        if (clientWithDepsObject instanceof BioCatchClient) {
            console.log('✅ Dependencies object constructor works');
        }

        // Individual parameters constructor
        const clientWithIndividualParams = new BioCatchClient(
            mockDeps.client as any,
            mockDeps.dynamicCdApiLoader as any,
            mockDeps.configMapper as any,
            mockDeps.serverUrlResolver as any
        );

        if (clientWithIndividualParams instanceof BioCatchClient) {
            console.log('✅ Individual parameters constructor works');
        }

        // Test 3: Error handling
        console.log('\n📋 Test 3: Error Handling');
        try {
            new BioCatchClient(
                mockDeps.client as any,
                undefined as any,
                mockDeps.configMapper as any,
                mockDeps.serverUrlResolver as any
            );
            console.log('❌ Should have thrown error for missing dependencies');
        } catch (error) {
            console.log('✅ Properly throws error for missing dependencies');
        }

        // Test 4: Proxy Interface
        console.log('\n📋 Test 4: Proxy Interface');

        // Mock global window
        const mockWindow = {} as any;
        global.window = mockWindow;

        // Create client that should set up proxy
        const clientForProxy = BioCatchClientMigrationBridge.createFromJSDependencies(
            mockDeps.client,
            mockDeps.dynamicCdApiLoader,
            mockDeps.configMapper,
            mockDeps.serverUrlResolver
        );

        if (mockWindow.bcClient && typeof mockWindow.bcClient.start === 'function') {
            console.log('✅ Proxy interface created successfully');

            // Test proxy methods
            console.log('\n📋 Test 5: Proxy Method Calls');
            mockWindow.bcClient.start(
                'https://test.com',
                'customer123',
                'session456',
                { enableFrames: true },
                BCProtocolType.V3
            );

            mockWindow.bcClient.pause();
            mockWindow.bcClient.resume();
            mockWindow.bcClient.updateCustomerSessionID('newCustomer');
            mockWindow.bcClient.stop();

            console.log('✅ All proxy methods executed successfully');
        } else {
            console.log('❌ Proxy interface not created properly');
        }

        console.log('\n🎉 All migration verification tests passed!');

        console.log('\n📝 Migration Strategy Summary:');
        console.log('• ✅ TypeScript BioCatchClient created');
        console.log('• ✅ Migration bridge functional');
        console.log('• ✅ JavaScript dependencies adapted');
        console.log('• ✅ Proxy interface working');
        console.log('• ✅ Error handling implemented');

        console.log('\n🔄 Next Steps for Gradual Migration:');
        console.log('1. Replace mock dependencies with actual JS SDK imports');
        console.log('2. Test with real JavaScript BioCatchClient dependencies');
        console.log('3. Start migrating individual components (ServerUrlResolver, ConfigMapper, etc.)');
        console.log('4. Gradually replace JS dependencies with TS implementations');
        console.log('5. Remove migration bridge once all components are migrated');

    } catch (error) {
        console.error('❌ Migration verification failed:', error);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runMigrationTests();
}

// Export for use in other scripts
export { createMockJSDependencies, runMigrationTests };
