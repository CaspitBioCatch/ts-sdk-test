import { assert } from 'chai';
import sinon from 'sinon';
import CanvasFontDetector from '../../../../../../../../../src/main/collectors/static/font/collection/v2/detector/CanvasFontDetector';

describe('CanvasFontDetector Tests:', function () {
    beforeEach(async function () {
        this.sandbox = sinon.createSandbox();

        const domUtilsStub = this.sandbox.stub();
        domUtilsStub.onWindowDocumentReady = this.sandbox.stub().yields();
        domUtilsStub.awaitWindowDocumentReady = () => Promise.resolve();

        this.detector = new CanvasFontDetector(domUtilsStub);
    });

    afterEach(function () {
        this.detector.release(); // Clean up resources
        this.sandbox.restore();
    });

    describe('init Method', function () {
        it('should initialize the canvas and context', async function () {
            await this.detector._initialize(); // Initialize the font detector before running tests
            
            assert.isNotNull(this.detector._canvas, 'Canvas element was not initialized');
            assert.isNotNull(this.detector._context, 'Canvas 2D context was not initialized');
        });
    });

    describe('detect Method', function () {
        it('should detect a nonexistent font as unavailable', async function () {
            const result = await this.detector.detect('NonExistentFont');
            assert.isFalse(result, 'NonExistentFont should not be detected as available');
        });

        it('should throw an error if not initialized', async function () {
            await this.detector.release(); // Simulate uninitialized state
            try {
                await this.detector.detect('sans-serif');
                assert.fail('The method did not throw an error as expected');
            } catch (error) {
                assert.isTrue(error instanceof Error, 'Expected an error to be thrown');
            }
        });

        it('should handle at least one platform-agnostic fallback font', async function () {
            const fallbackFonts = [
                'Arial',            // Common on Windows and most platforms
                'Times New Roman',  // Common on Windows and most platforms
                'Times New Roman Bold',
                'Helvetica',        // Common on macOS and iOS
                'Roboto',           // Default on Android
                'San Francisco',    // Default on iOS/macOS
            ];

            let fontDetected = false;

            for (const font of fallbackFonts) {
                const result = await this.detector.detect(font);
                if (result) {
                    fontDetected = true;
                    break;
                }
            }

            assert.isTrue(fontDetected, 'At least one platform-agnostic fallback font should be detected');
        });
    });

    describe('release Method', function () {
        it('should clear canvas and context', async function () {
            await this.detector.release();
            assert.isNull(this.detector._canvas, 'Canvas should be null after release');
            assert.isNull(this.detector._context, 'Context should be null after release');
        });
    });

    describe('isSupported Method', function () {
        it('should return true if the canvas API is supported', function () {
            assert.isTrue(this.detector.isSupported(), 'isSupported should return true if the canvas API is available');
        });

        it('should return false if the canvas API is not supported', function () {
            this.sandbox.stub(document, 'createElement').throws(new Error('Canvas not supported'));
            const isSupported = this.detector.isSupported();
            assert.isFalse(isSupported, 'isSupported should return false if the canvas API is unavailable');
        });
    });
});