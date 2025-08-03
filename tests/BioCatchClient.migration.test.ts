/**
 * Vitest tests for BioCatchClient TypeScript migration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
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

describe('BioCatchClient TypeScript Migration', () => {
    let mockDeps: ReturnType<typeof createMockJSDependencies>;

    beforeEach(() => {
        mockDeps = createMockJSDependencies();
        // Reset global window for each test
        vi.stubGlobal('window', {});
    });

    describe('Migration Bridge', () => {
        it('should create TypeScript client from JavaScript dependencies', () => {
            const tsClient = BioCatchClientMigrationBridge.createFromJSDependencies(
                mockDeps.client,
                mockDeps.dynamicCdApiLoader,
                mockDeps.configMapper,
                mockDeps.serverUrlResolver
            );

            expect(tsClient).toBeInstanceOf(BioCatchClient);
        });
    });

    describe('Constructor Patterns', () => {
        it('should work with dependencies object constructor', () => {
            const clientWithDepsObject = new BioCatchClient({
                client: mockDeps.client as any,
                dynamicCdApiLoader: mockDeps.dynamicCdApiLoader as any,
                configMapper: mockDeps.configMapper as any,
                serverUrlResolver: mockDeps.serverUrlResolver as any
            });

            expect(clientWithDepsObject).toBeInstanceOf(BioCatchClient);
        });

        it('should work with individual parameters constructor', () => {
            const clientWithIndividualParams = new BioCatchClient(
                mockDeps.client as any,
                mockDeps.dynamicCdApiLoader as any,
                mockDeps.configMapper as any,
                mockDeps.serverUrlResolver as any
            );

            expect(clientWithIndividualParams).toBeInstanceOf(BioCatchClient);
        });
    });

    describe('Error Handling', () => {
        it('should throw error for missing dependencies', () => {
            expect(() => {
                new BioCatchClient(
                    mockDeps.client as any,
                    undefined as any,
                    mockDeps.configMapper as any,
                    mockDeps.serverUrlResolver as any
                );
            }).toThrow();
        });
    });

    describe('Proxy Interface', () => {
        it('should create proxy interface on window when cdApi is not present', () => {
            // Clear window first
            if (typeof window !== 'undefined') {
                delete (window as any).cdApi;
                delete (window as any).bcClient;
            }

            BioCatchClientMigrationBridge.createFromJSDependencies(
                mockDeps.client,
                mockDeps.dynamicCdApiLoader,
                mockDeps.configMapper,
                mockDeps.serverUrlResolver
            );

            expect((window as any).bcClient).toBeDefined();
            expect(typeof (window as any).bcClient.start).toBe('function');
        });

        it('should execute proxy methods without errors', () => {
            // Clear window first
            if (typeof window !== 'undefined') {
                delete (window as any).cdApi;
                delete (window as any).bcClient;
            }

            BioCatchClientMigrationBridge.createFromJSDependencies(
                mockDeps.client,
                mockDeps.dynamicCdApiLoader,
                mockDeps.configMapper,
                mockDeps.serverUrlResolver
            );

            expect(() => {
                (window as any).bcClient.start(
                    'https://test.com',
                    'customer123',
                    'session456',
                    { enableFrames: true },
                    BCProtocolType.V3
                );
                (window as any).bcClient.pause();
                (window as any).bcClient.resume();
                (window as any).bcClient.updateCustomerSessionID('newCustomer');
                (window as any).bcClient.stop();
            }).not.toThrow();
        });
    });
});

// Export for use in other scripts
export { createMockJSDependencies };
