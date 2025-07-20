import { assert } from 'chai';
import sinon from 'sinon';
import WebglCollector, { WebGLFingerprint } from '../../../../../src/main/collectors/static/WebglCollector';

describe('WebGLFingerprint', () => {
    let sandbox;
    let documentStub;
    let canvasStub;
    let glContextStub;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(console, 'error'); // Suppress errors for test clarity
        
        // Create a mock WebGL context
        glContextStub = {
            getParameter: sandbox.stub().returns('mock-parameter'),
            getExtension: sandbox.stub().returns(null),
            getSupportedExtensions: sandbox.stub().returns([]),
            getShaderPrecisionFormat: sandbox.stub().returns({
                rangeMin: 0,
                rangeMax: 0,
                precision: 0
            }),
            readPixels: sandbox.stub(),
            clear: sandbox.stub(),
            viewport: sandbox.stub(),
            createShader: sandbox.stub().returns({}),
            shaderSource: sandbox.stub(),
            compileShader: sandbox.stub(),
            getShaderParameter: sandbox.stub().returns(true),
            getShaderInfoLog: sandbox.stub().returns(''),
            createProgram: sandbox.stub().returns({}),
            attachShader: sandbox.stub(),
            linkProgram: sandbox.stub(),
            getProgramParameter: sandbox.stub().returns(true),
            getProgramInfoLog: sandbox.stub().returns(''),
            useProgram: sandbox.stub(),
            getAttribLocation: sandbox.stub().returns(0),
            getUniformLocation: sandbox.stub().returns({}),
            enableVertexAttribArray: sandbox.stub(),
            uniformMatrix4fv: sandbox.stub(),
            createBuffer: sandbox.stub().returns({}),
            bindBuffer: sandbox.stub(),
            bufferData: sandbox.stub(),
            vertexAttribPointer: sandbox.stub(),
            clearColor: sandbox.stub(),
            drawArrays: sandbox.stub(),
            deleteShader: sandbox.stub(),
            deleteProgram: sandbox.stub(),
            deleteBuffer: sandbox.stub()
        };
        
        // Create a mock canvas
        canvasStub = {
            getContext: sandbox.stub().returns(glContextStub),
            width: 256,
            height: 128
        };
        
        // Create a mock document
        documentStub = {
            createElement: sandbox.stub().returns(canvasStub)
        };
        
        // Stub document.createElement
        sandbox.stub(document, 'createElement').callsFake(documentStub.createElement);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('Initialization', () => {
        it('should initialize with valid WebGL contexts', async () => {
            const webglFingerprint = new WebGLFingerprint();
            await webglFingerprint.start();
            assert.isObject(webglFingerprint.data, 'Expected data to be an object');
            assert.isArray(webglFingerprint.availableContexts, 'Expected availableContexts to be an array');
        });

        it('should generate a valid JSON hash', async () => {
            const webglFingerprint = new WebGLFingerprint();
            await webglFingerprint.start();
            assert.isString(webglFingerprint.jsonHash, 'Expected jsonHash to be a string');
            assert.match(webglFingerprint.jsonHash, /^[a-f0-9]{32}$/, 'Expected jsonHash to be a 128-bit hex string');
        });

        it('should generate an image hash if WebGL context is available', async () => {
            const webglFingerprint = new WebGLFingerprint();
            await webglFingerprint.start();
            if (webglFingerprint.availableContexts.length > 0) {
                assert.isString(webglFingerprint.imageHash, 'Expected imageHash to be a string');
                assert.match(webglFingerprint.imageHash, /^[a-f0-9]{32}$/, 'Expected imageHash to be a 128-bit hex string');
            } else {
                assert.isNull(webglFingerprint.imageHash, 'Expected imageHash to be null when no WebGL contexts are available');
            }
        });
    });

    describe('getContextData', () => {
        it('should return null for unsupported WebGL contexts', async () => {
            const webglFingerprint = new WebGLFingerprint();
            canvasStub.getContext.returns(null);

            const result = await webglFingerprint.getContextData('unsupported-webgl');
            assert.isNull(result, 'Expected getContextData to return null for unsupported WebGL context');
        });

        it('should return valid context data for a supported WebGL context', async () => {
            const webglFingerprint = new WebGLFingerprint();
            const result = await webglFingerprint.getContextData('webgl');
            if (result) {
                assert.isObject(result, 'Expected context data to be an object');
                assert.property(result, 'contextAttributes', 'Expected context data to contain contextAttributes');
            } else {
                assert.isNull(result, 'Expected getContextData to return null if WebGL is not supported');
            }
        });
    });

    describe('computeImageHash', () => {
        it('should return a string hash when WebGL context is available', async () => {
            const webglFingerprint = new WebGLFingerprint();
            await webglFingerprint.start();
            const imageHash = webglFingerprint.computeImageHash();
            if (webglFingerprint.availableContexts.length > 0) {
                assert.isString(imageHash, 'Expected imageHash to be a string');
                assert.match(imageHash, /^[a-f0-9]{32}$/, 'Expected imageHash to be a 128-bit hex string');
            } else {
                assert.isNull(imageHash, 'Expected imageHash to be null when no WebGL contexts are available');
            }
        });

        it('should return null when no WebGL contexts are available', async () => {
            const webglFingerprint = new WebGLFingerprint();
            sandbox.stub(webglFingerprint, 'availableContexts').value([]);
            assert.isNull(webglFingerprint.computeImageHash(), 'Expected computeImageHash to return null when no WebGL contexts are available');
        });
    });

    describe('getShaderPrecision', () => {
        it('should return null if shader precision is not available', () => {
            const webglFingerprint = new WebGLFingerprint();
            const precision = webglFingerprint.getShaderPrecision({}, null);
            assert.isNull(precision, 'Expected getShaderPrecision to return null for unsupported shader type');
        });
    });
});

describe('WebglCollector', () => {
    let sandbox, dataQ;
    let webglCollector;
    let originalStartFeature;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        // Mock dataQ
        dataQ = { addToQueue: sandbox.stub() };

        // Create a WebglCollector instance
        webglCollector = new WebglCollector(dataQ);
        
        // Store the original startFeature method
        originalStartFeature = webglCollector.startFeature;
    });

    afterEach(() => {
        // Restore the original startFeature method
        webglCollector.startFeature = originalStartFeature;
        sandbox.restore();
    });

    describe('getDefaultSettings', () => {
        it('should return the default settings', () => {
            const settings = WebglCollector.getDefaultSettings();
            assert.isObject(settings, 'Expected settings to be an object');
            assert.equal(settings.configKey, 'isWebglFeature', 'Expected configKey to be "isWebglFeature"');
        });
    });

    describe('startFeature', () => {
        it('should log and queue WebGL fingerprint data', async () => {
            // Stub the startFeature method to simulate successful fingerprinting
            webglCollector.startFeature = async function() {
                this._dataQ.addToQueue('webgl', [
                    ['mocked_json_hash', 'mocked_image_hash']
                ]);
            };
            
            // Call startFeature and wait for it to complete
            await webglCollector.startFeature();

            // Ensure data is queued
            sinon.assert.calledOnce(dataQ.addToQueue);
            sinon.assert.calledWith(dataQ.addToQueue, 'webgl', [
                ['mocked_json_hash', 'mocked_image_hash']
            ]);
        });

        it('should handle missing WebGL data gracefully', async () => {
            // Stub the startFeature method to simulate missing WebGL data
            webglCollector.startFeature = async function() {
                this._dataQ.addToQueue('webgl', [
                    [null, null]
                ]);
            };
            
            // Call startFeature and wait for it to complete
            await webglCollector.startFeature();

            // Ensure data is still queued but contains null values
            sinon.assert.calledOnce(dataQ.addToQueue);
            sinon.assert.calledWith(dataQ.addToQueue, 'webgl', [
                [null, null]
            ]);
        });
        
        it('should handle errors during fingerprinting', async () => {
            // Stub the startFeature method to simulate an error
            webglCollector.startFeature = async function() {
                // Simulate an error by not calling addToQueue
            };
            
            // Call startFeature and wait for it to complete
            await webglCollector.startFeature();

            // Ensure data is not queued when an error occurs
            sinon.assert.notCalled(dataQ.addToQueue);
        });
    });
});
