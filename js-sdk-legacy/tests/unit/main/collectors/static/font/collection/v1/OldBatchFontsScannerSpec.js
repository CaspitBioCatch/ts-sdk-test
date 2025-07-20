import OldBatchFontsScanner from '../../../../../../../../src/main/collectors/static/font/collection/v1/OldBatchFontsScanner';

import sinon from 'sinon';
import { assert } from 'chai';

describe('OldBatchFontsScanner Tests', () => {
    let scanner, domUtilsStub, resolveCallback;
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        domUtilsStub = sandbox.stub();
        domUtilsStub.onWindowDocumentReady = sandbox.stub().yields();
        scanner = new OldBatchFontsScanner(domUtilsStub);

        // Mock resolve callback for Promise
        resolveCallback = sandbox.stub();
    });

    afterEach(() => {
        // Restore Sinon sandbox
        sandbox.restore();
    });

    describe('Constructor Tests', () => {
        it('should initialize without throwing errors', () => {
            assert.doesNotThrow(() => new OldBatchFontsScanner(domUtilsStub));
        });
    });

    describe('scan Method Tests', () => {
        it('should resolve with an empty array if no spans are available', async () => {
            scanner._spanArray = null; // Simulate missing span array
            const result = await scanner.scan([], 'Arial');
            assert.deepEqual(result, []);
        });

        it('should handle empty font list gracefully', async () => {
            scanner._spanArray = { getElementsByTagName: sinon.stub().returns([]) }; // Mock span array
            const result = await scanner.scan([], 'Arial');
            assert.deepEqual(result, []);
        });

        it('should call detectCallback during scanning', async () => {
            const fonts = ['Font1', 'Font2'];
            const fontFamily = 'Arial';

            scanner._spanArray = {
                getElementsByTagName: sinon.stub().returns([
                    { style: {}, id: '' },
                    { style: {}, id: '' },
                ]),
            };

            const detectCallbackSpy = sinon.spy(scanner, 'detectCallback');
            await scanner.scan(fonts, fontFamily);

            assert.isTrue(detectCallbackSpy.calledOnce);
        });

        it('should reject with an error if detectCallback throws', async () => {
            const error = new Error('Mock error');
            sinon.stub(scanner, 'detectCallback').throws(error);

            try {
                await scanner.scan(['Font1'], 'Arial');
                assert.fail('Expected promise to reject');
            } catch (err) {
                assert.equal(err, error);
            }
        });
    });

    describe('detectCallback Method Tests', () => {
        it('should return empty array if _spanArray is null', () => {
            scanner._spanArray = null; // Simulate missing span array
            const result = scanner.detectCallback([], 'Arial', resolveCallback);

            assert.deepEqual(result, []);
            assert.isTrue(resolveCallback.calledWith([]));
        });

        it('should call callback with available fonts when fonts are detected', () => {
            const fonts = ['Font1', 'Font2'];
            const fontFamily = 'Arial';

            scanner._spanArray = {
                getElementsByTagName: sinon.stub().returns([
                    { style: {}, id: 'Font1', offsetWidth: 105, offsetHeight: 105 },
                    { style: {}, id: 'Font2', offsetWidth: 110, offsetHeight: 110 },
                ]),
            };

            scanner._defaultWidth = { [fontFamily]: 100 };
            scanner._defaultHeight = { [fontFamily]: 100 };

            scanner.detectCallback(fonts, fontFamily, (availableFonts) => {
                assert.isArray(availableFonts);
                assert.deepEqual(availableFonts, ['Font1', 'Font2']);
            });
        });

        it('should handle font dimensions correctly during detection', () => {
            const fonts = ['Font1', 'Font2'];
            const fontFamily = 'Arial';

            scanner._spanArray = {
                getElementsByTagName: sinon.stub().returns([
                    { style: {}, id: 'Font1', offsetWidth: 102, offsetHeight: 102 },
                    { style: {}, id: 'Font2', offsetWidth: 108, offsetHeight: 108 },
                ]),
            };

            scanner._defaultWidth = { [fontFamily]: 100 };
            scanner._defaultHeight = { [fontFamily]: 100 };

            scanner.detectCallback(fonts, fontFamily, (availableFonts) => {
                assert.lengthOf(availableFonts, 2);
                assert.deepEqual(availableFonts, ['Font1', 'Font2']);
            });
        });

        it('should handle fontFamily concatenation correctly', () => {
            const mockSpans = [
                { offsetWidth: 100, offsetHeight: 100, id: '', style: {} },
            ];
            scanner._spanArray = { getElementsByTagName: sinon.stub().returns(mockSpans) };
            scanner._defaultWidth = { Arial: 100 };
            scanner._defaultHeight = { Arial: 100 };
            scanner._chunkSize = 1;

            scanner.detectCallback(['Font1'], 'Arial', resolveCallback);

            assert.equal(mockSpans[0].style.fontFamily, 'Font1,Arial');
        });
    });

    it('should trigger checkDetection multiple times when chunk size is exceeded', () => {
        const fonts = ['Font1', 'Font2', 'Font3'];
        const fontFamily = 'Arial';

        // Set a small chunk size to force multiple calls to checkDetection
        scanner._chunkSize = 1;

        // Mock spans (at least one span per chunk)
        const mockSpans = [
            { style: {}, id: '', offsetWidth: 102, offsetHeight: 102 },
            { style: {}, id: '', offsetWidth: 105, offsetHeight: 105 },
            { style: {}, id: '', offsetWidth: 110, offsetHeight: 110 },
        ];

        scanner._spanArray = {
            getElementsByTagName: sinon.stub().returns(mockSpans),
        };

        scanner._defaultWidth = { [fontFamily]: 100 };
        scanner._defaultHeight = { [fontFamily]: 100 };
        scanner._allFontsDiffs = [];

        // Run detectCallback directly and capture the returned fonts
        scanner.detectCallback(fonts, fontFamily, () => {
            // Since we have three fonts and chunk size is 1, checkDetection should run:
            // - After processing Font1 (first chunk full)
            // - After processing Font2 (second chunk full)
            // - After the loop ends, Font3 would also have been processed in a chunk of size 1

            // Ensure that multiple detection cycles happened by checking _allFontsDiffs.
            // Each call to checkDetection adds entries for the processed spans.
            // With 3 fonts and a chunk size of 1, we expect at least 3 entries (one per font processed).
            assert.isAtLeast(scanner._allFontsDiffs.length, 3, 'Expected multiple checkDetection calls to populate _allFontsDiffs');

            // // Verify that the availableFonts array includes all three fonts.
            // assert.deepEqual(availableFonts.sort(), fonts.sort(), 'All provided fonts should be detected as available');
        });
    });

});
