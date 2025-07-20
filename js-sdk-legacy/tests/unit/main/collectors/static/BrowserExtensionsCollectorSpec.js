import { assert } from 'chai';
import sinon from 'sinon';
import BrowserExtensionsCollector, { RegularExtensionsScanner } from '../../../../../src/main/collectors/static/BrowserExtensionsCollector';
import Log from '../../../../../src/main/technicalServices/log/Logger';

describe('BrowserExtensionsCollector', () => {
    let sandbox;
    let dataQ;
    let configurationRepository;
    let utils;
    let domUtils;
    let browserExtensionsCollector;
    let regularExtensionsScanner;
    let mockDocument;
    let mockWindow;
    let mockLog;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        
        // Create mock document
        mockDocument = {
            createElement: sandbox.stub().returns({
                className: '',
                style: {},
                offsetHeight: 50,
                offsetWidth: 50
            }),
            body: {
                appendChild: sandbox.stub(),
                removeChild: sandbox.stub()
            },
            querySelector: sandbox.stub().returns(null),
            querySelectorAll: sandbox.stub().returns([])
        };
        
        // Create mock window
        mockWindow = {
            getComputedStyle: sandbox.stub().returns({
                display: 'block',
                visibility: 'visible',
                backgroundColor: 'rgb(255, 255, 255)'
            }),
            ethereum: null,
            solana: null,
            BinanceChain: null,
            navigator: {
                brave: null
            },
            ApplePaySession: null,
            google: null,
            __REACT_DEVTOOLS_GLOBAL_HOOK__: null,
            __VUE_DEVTOOLS_GLOBAL_HOOK__: null,
            __REDUX_DEVTOOLS_EXTENSION__: null,
            ng: null,
            __SVELTE_DEVTOOLS_GLOBAL_HOOK__: null,
            _sentryDebugIds: null,
            sessionStorage: {
                getItem: sandbox.stub().returns(null)
            }
        };

        // Mock Log
        mockLog = {
            debug: sandbox.stub(),
            info: sandbox.stub(),
            error: sandbox.stub()
        };
        sandbox.stub(Log, 'debug').callsFake(mockLog.debug);
        sandbox.stub(Log, 'info').callsFake(mockLog.info);
        sandbox.stub(Log, 'error').callsFake(mockLog.error);
        
        // Create scanner with mocked dependencies
        regularExtensionsScanner = new RegularExtensionsScanner(mockWindow, mockDocument);
        
        // Initialize dependencies
        dataQ = { addToQueue: sandbox.stub() };
        configurationRepository = { get: sandbox.stub() };
        utils = {};
        domUtils = {};
        
        // Create collector instance
        browserExtensionsCollector = new BrowserExtensionsCollector(
            configurationRepository,
            utils,
            domUtils,
            dataQ,
            regularExtensionsScanner
        );
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('getDefaultSettings', () => {
        it('should return the default settings', () => {
            const settings = BrowserExtensionsCollector.getDefaultSettings();
            assert.isObject(settings, 'Expected settings to be an object');
            assert.equal(settings.configKey, 'isBrowserExtensionsFeature', 'Expected configKey to be "isBrowserExtensionsFeature"');
        });
    });

    describe('startFeature', () => {
        it('should detect extensions and add them to the queue', async () => {
            const detectedExtensions = ['MetaMask', 'Grammarly'];
            sandbox.stub(regularExtensionsScanner, 'scan').resolves(detectedExtensions);

            await browserExtensionsCollector.startFeature();

            sinon.assert.calledOnce(dataQ.addToQueue);
            sinon.assert.calledWith(dataQ.addToQueue, 'static_fields', ['browser_extensions', ['v1', detectedExtensions]]);
            sinon.assert.calledWith(mockLog.info, `Detected browser extensions: ${detectedExtensions.join(', ')}`);
        });

        it('should handle errors gracefully and still send data', async () => {
            const error = new Error('Test error');
            sandbox.stub(regularExtensionsScanner, 'scan').rejects(error);

            await browserExtensionsCollector.startFeature();

            sinon.assert.calledOnce(dataQ.addToQueue);
            sinon.assert.calledWith(dataQ.addToQueue, 'static_fields', ['browser_extensions', ['v1', []]]);
            sinon.assert.calledWith(mockLog.error, `Failed to detect browser extensions: ${error.message}`);
        });

        it('should send empty array when no extensions are detected', async () => {
            sandbox.stub(regularExtensionsScanner, 'scan').resolves([]);

            await browserExtensionsCollector.startFeature();

            sinon.assert.calledOnce(dataQ.addToQueue);
            sinon.assert.calledWith(dataQ.addToQueue, 'static_fields', ['browser_extensions', ['v1', []]]);
            sinon.assert.calledWith(mockLog.info, 'No browser extensions detected');
        });
    });
});

describe('RegularExtensionsScanner', () => {
    let sandbox;
    let regularExtensionsScanner;
    let mockDocument;
    let mockWindow;
    let mockLog;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        
        // Create mock document
        mockDocument = {
            createElement: sandbox.stub().returns({
                className: '',
                style: {},
                offsetHeight: 50,
                offsetWidth: 50
            }),
            body: {
                appendChild: sandbox.stub(),
                removeChild: sandbox.stub()
            },
            querySelector: sandbox.stub().returns(null),
            querySelectorAll: sandbox.stub().returns([])
        };
        
        // Create mock window
        mockWindow = {
            getComputedStyle: sandbox.stub().returns({
                display: 'block',
                visibility: 'visible',
                backgroundColor: 'rgb(255, 255, 255)'
            }),
            ethereum: null,
            solana: null,
            BinanceChain: null,
            navigator: {
                brave: null
            },
            ApplePaySession: null,
            google: null,
            __REACT_DEVTOOLS_GLOBAL_HOOK__: null,
            __VUE_DEVTOOLS_GLOBAL_HOOK__: null,
            __REDUX_DEVTOOLS_EXTENSION__: null,
            ng: null,
            __SVELTE_DEVTOOLS_GLOBAL_HOOK__: null,
            _sentryDebugIds: null,
            sessionStorage: {
                getItem: sandbox.stub().returns(null)
            }
        };

        // Mock Log
        mockLog = {
            debug: sandbox.stub(),
            info: sandbox.stub(),
            error: sandbox.stub()
        };
        sandbox.stub(Log, 'debug').callsFake(mockLog.debug);
        sandbox.stub(Log, 'info').callsFake(mockLog.info);
        sandbox.stub(Log, 'error').callsFake(mockLog.error);
        
        regularExtensionsScanner = new RegularExtensionsScanner(mockWindow, mockDocument);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('scan', () => {
        it('should return an array of detected extensions', async () => {
            mockWindow.ethereum = { isMetaMask: true };
            mockDocument.querySelector.returns({});

            const detectedExtensions = await regularExtensionsScanner.scan();

            assert.isArray(detectedExtensions, 'Expected detectedExtensions to be an array');
            assert.include(detectedExtensions, 'MetaMask', 'Expected MetaMask to be detected');
            assert.include(detectedExtensions, 'Grammarly', 'Expected Grammarly to be detected');
        });

        it('should return an empty array when no extensions are detected', async () => {
            const detectedExtensions = await regularExtensionsScanner.scan();

            assert.isArray(detectedExtensions, 'Expected detectedExtensions to be an array');
            assert.equal(detectedExtensions.length, 0, 'Expected no extensions to be detected');
        });

        it('should handle errors gracefully', async () => {
            mockDocument.createElement.throws(new Error('Test error'));

            const detectedExtensions = await regularExtensionsScanner.scan();

            assert.isArray(detectedExtensions, 'Expected detectedExtensions to be an array');
            assert.equal(detectedExtensions.length, 0, 'Expected no extensions to be detected');
            sinon.assert.calledWith(mockLog.debug, 'Ad blocker detection error: Test error');
        });
    });

    describe('detectExtension', () => {
        it('should detect MetaMask extension', async () => {
            mockWindow.ethereum = { isMetaMask: true };

            const extension = regularExtensionsScanner.extensions.find(ext => ext.name === 'MetaMask');
            const result = await regularExtensionsScanner.detectExtension(extension);

            assert.isTrue(result, 'Expected MetaMask to be detected');
        });

        it('should detect Grammarly extension', async () => {
            mockDocument.querySelector.returns({});

            const extension = regularExtensionsScanner.extensions.find(ext => ext.name === 'Grammarly');
            const result = await regularExtensionsScanner.detectExtension(extension);

            assert.isTrue(result, 'Expected Grammarly to be detected');
        });

        it('should handle errors gracefully', async () => {
            mockDocument.createElement.throws(new Error('Test error'));

            const extension = regularExtensionsScanner.extensions.find(ext => ext.name === 'Ad Blocker');
            const result = await regularExtensionsScanner.detectExtension(extension);

            assert.isFalse(result, 'Expected Ad Blocker detection to fail gracefully');
            sinon.assert.calledWith(mockLog.debug, 'Ad blocker detection error: Test error');
        });

        it('should use cached results for the same extension', async () => {
            mockWindow.ethereum = { isMetaMask: true };

            const extension = regularExtensionsScanner.extensions.find(ext => ext.name === 'MetaMask');
            
            const result1 = await regularExtensionsScanner.detectExtension(extension);
            mockWindow.ethereum = null;
            const result2 = await regularExtensionsScanner.detectExtension(extension);

            assert.isTrue(result1, 'Expected first MetaMask detection to be true');
            assert.isTrue(result2, 'Expected second MetaMask detection to use cached result');
        });
    });

    describe('individual detection methods', () => {
        it('should detect Ad Blocker when ad is blocked', async () => {
            mockWindow.getComputedStyle.returns({
                display: 'none',
                visibility: 'visible'
            });

            const result = await regularExtensionsScanner._detectAdBlocker();

            assert.isTrue(result, 'Expected Ad Blocker to be detected');
        });

        it('should detect LastPass when LastPass elements are present', async () => {
            mockDocument.querySelectorAll.returns([{ id: 'lastpass-element' }]);

            const result = await regularExtensionsScanner._detectLastPass();

            assert.isTrue(result, 'Expected LastPass to be detected');
        });

        it('should detect MetaMask when ethereum.isMetaMask is true', async () => {
            mockWindow.ethereum = { isMetaMask: true };

            const result = await regularExtensionsScanner._detectMetaMask();

            assert.isTrue(result, 'Expected MetaMask to be detected');
        });

        it('should detect React DevTools when __REACT_DEVTOOLS_GLOBAL_HOOK__ is present', async () => {
            mockWindow.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {};

            const result = await regularExtensionsScanner._detectReactDevTools();

            assert.isTrue(result, 'Expected React DevTools to be detected');
        });

        it('should detect Dark Reader when background color is changed', async () => {
            mockWindow.getComputedStyle.returns({
                backgroundColor: 'rgb(0, 0, 0)'
            });

            const result = await regularExtensionsScanner._detectDarkReader();

            assert.isTrue(result, 'Expected Dark Reader to be detected');
        });
    });
});
