import { assert } from 'chai';
import sinon from 'sinon';
import { BatchFontScanner } from '../../../../../../../../src/main/collectors/static/font/collection/v2';
import Log from '../../../../../../../../src/main/technicalServices/log/Logger';

describe('BatchFontScanner Unit Tests', function () {
    let sandbox, utilsStub, domUtilsStub, detectorStub, batchFontScanner;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        utilsStub = { mock: true };
        domUtilsStub = { mock: true };
        detectorStub = {
            init: sandbox.stub().resolves(),
            release: sandbox.stub().resolves(),
            detect: sandbox.stub().resolves(false),
        };

        batchFontScanner = new BatchFontScanner({
            utils: utilsStub,
            domUtils: domUtilsStub,
            detector: detectorStub,
            batchSize: 5,
            timeoutGap: 10,
        });
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('scan (edge cases)', () => {
        it('should throw an error if scan is called with null', async () => {
            try {
                await batchFontScanner.scan(null, 'monospace');
                assert.fail('Expected scan to throw an error with null input');
            } catch (error) {
                assert.match(error.message, /The 'fonts' parameter must be an array./);
            }
        });

        it('should throw an error if scan is called with a non-array value', async () => {
            try {
                await batchFontScanner.scan('not-an-array', 'monospace');
                assert.fail('Expected scan to throw an error with non-array input');
            } catch (error) {
                assert.match(error.message, /The 'fonts' parameter must be an array./);
            }
        });

        it('should throw an error if the scanner is released before scanning', async () => {
            batchFontScanner.release();
            try {
                await batchFontScanner.scan(['font1', 'font2'], 'monospace');
                assert.fail('Expected scan to throw an error after release');
            } catch (error) {
                assert.match(error.message, /BatchFontScanner has been released and cannot be used./);
            }
        });

        it('should throw an error if the scanner is released during scanning', async () => {
            const fonts = ['font1', 'font2', 'font3', 'font4'];
            detectorStub.detect.callsFake(async (font) => {
                if (font === 'font2') {
                    batchFontScanner.release(); // Simulate release mid-scan
                }
                return true;
            });

            try {
                await batchFontScanner.scan(fonts, 'monospace');
                assert.fail('Expected scan to throw an error when released mid-scan');
            } catch (error) {
                assert.isTrue(error instanceof Error, 'Expected an Error to be thrown');
            }
        });
    });

    describe('_processBatch', () => {
        it('should process all fonts in the batch', async () => {
            const fonts = ['font1', 'font2'];
            detectorStub.detect.resolves(true);

            const detectedFonts = [];
            await batchFontScanner._processBatch(fonts, detectedFonts);

            assert.deepEqual(detectedFonts, fonts);
            assert.equal(detectorStub.detect.callCount, fonts.length);
        });

        it('should throw an error if scanner is released during batch processing', async () => {
            const fonts = ['font1', 'font2', 'font2', 'font2', 'font2', 'font2', 'font2', 'font2', 'font2', 'font2', 'font2', 'font2', 'font2', 'font2', 'font2', 'font2'];
            detectorStub.detect.callsFake(async (font) => {
                if (font === 'font1') {
                    batchFontScanner.release(); // Simulate release during batch processing
                }
                return true;
            });

            try {
                const detectedFonts = [];
                await batchFontScanner._processBatch(fonts, detectedFonts);
                assert.fail('Expected _processBatch to throw an error if released mid-batch');
            } catch (error) {
                assert.match(error.message, /BatchFontScanner was released during batch processing. Operation aborted./);
            }
        });
    });

    describe('scan (detector null)', () => {
        it('should not fail if no detector is provided and detect is called', async () => {
            batchFontScanner = new BatchFontScanner({
                utils: utilsStub,
                domUtils: domUtilsStub,
                detector: null,
                batchSize: 5,
                timeoutGap: 10,
            });

            const fonts = ['font1', 'font2'];
            const result = await batchFontScanner.scan(fonts, 'monospace');

            assert.deepEqual(result, []); // Nothing detected
        });
    });

    describe('_delay (logging)', () => {
        it('should not log errors on delay execution', async () => {
            const logSpy = sandbox.spy(Log, 'error');
            await batchFontScanner._delay(10);
            assert.isTrue(logSpy.notCalled);
        });
    });
});
