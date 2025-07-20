import OldOffloadFontsScanner from '../../../../../../../../src/main/collectors/static/font/collection/v1/OldOffloadFontsScanner';

import { assert } from 'chai';
import sinon from 'sinon';

describe('OldOffloadFontsScanner Tests', () => {
    let scanner, domUtilsStub, callbackStub, setTimeoutStub;
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        domUtilsStub = sandbox.stub();
        domUtilsStub.onWindowDocumentReady = sandbox.stub().yields();
        scanner = new OldOffloadFontsScanner(domUtilsStub);
        callbackStub = sandbox.stub();
    });

    afterEach(() => {
        // Restore Sinon sandbox
        sandbox.restore();
    });

    describe('Constructor Tests', () => {
        it('should initialize without errors', () => {
            assert.doesNotThrow(() => new OldOffloadFontsScanner(domUtilsStub));
        });
    });

    describe('scan Method Tests', () => {
        it('should resolve with an empty array if detectCallback returns no fonts', async () => {
            sandbox.stub(scanner, 'detectCallback').callsFake((fonts, fontFamily, callback) => {
                callback([]);
            });

            const result = await scanner.scan(['Font1'], 'Arial');
            assert.deepEqual(result, []);
        });

        it('should reject if detectCallback throws an error', async () => {
            sandbox.stub(scanner, 'detectCallback').throws(new Error('Mock Error'));

            try {
                await scanner.scan(['Font1'], 'Arial');
                assert.fail('Expected promise to reject');
            } catch (error) {
                assert.equal(error.message, 'Mock Error');
            }
        });
    });

    describe('detectCallback Method Tests', () => {
        it('should return empty array if _spanArray is null', () => {
            scanner._spanArray = null;

            // await scanner.init()
            const result = scanner.detectCallback(['Font1'], 'Arial', callbackStub);
            assert.deepEqual(result, []);
            assert.isTrue(callbackStub.calledOnceWith([]));
        });

        // it('should return empty array if _spanArray is empty', () => {
        //     scanner._spanArray = { getElementsByTagName: () => [] };

        //     const result = scanner.detectCallback(['Font1'], 'Arial', callbackStub);
        //     assert.deepEqual(result, []);
        //     assert.isTrue(callbackStub.calledOnceWith([]));
        // });

        it('should create and execute tasks for fonts', async () => {
            scanner._spanArray = {
                getElementsByTagName: sandbox.stub().returns([{}, {}])
            };
            const fonts = ['Font1', 'Font2'];
            const fontFamily = 'Arial';

            const runCallbackSpy = sandbox.stub();
            sandbox.stub(scanner, '_applyFontsToSpanElements').callsFake((iterator) => {
                iterator.runCallback();
            });

            await scanner.init()
            scanner.detectCallback(fonts, fontFamily, runCallbackSpy);
            assert.isTrue(runCallbackSpy.calledOnce);
        });
    });

    describe('_applyFontsToSpanElements Method Tests', () => {
        let setTimeoutSpy;

        beforeEach(() => {
            setTimeoutSpy = sandbox.spy(window, 'setTimeout');
        });

        afterEach(() => {
            setTimeoutSpy.restore();
        });

        it('should process spans and schedule offset tasks', () => {
            const taskIteratorMock = {
                next: sandbox.stub().onFirstCall().returns({ style: {}, id: '' }).onSecondCall().returns(null),
                getFontsArray: sandbox.stub().returns(['Font1']),
                getFontFamily: sandbox.stub().returns('Arial'),
                reset: sandbox.stub(),
                runCallback: sandbox.stub()
            };

            scanner._applyFontsToSpanElements(taskIteratorMock, 0);

            assert.isTrue(taskIteratorMock.next.called);
            assert.isTrue(taskIteratorMock.getFontsArray.called);
            assert.isTrue(taskIteratorMock.getFontFamily.called);
            assert.isTrue(setTimeoutSpy.called);
        });

        it('should handle when fontsLoopIndex >= fontsArray.length immediately', () => {
            const taskIteratorMock = {
                next: sandbox.stub().returns(null),
                getFontsArray: sandbox.stub().returns(['Font1']),
                getFontFamily: sandbox.stub().returns('Arial'),
                reset: sandbox.stub(),
                runCallback: sandbox.stub()
            };

            // Force fontsLoopIndex to be greater than fontsArray length
            scanner._applyFontsToSpanElements(taskIteratorMock, 1);

            // Should schedule a setTimeout for _getElementOffsetTask due to _lastChunck logic
            assert.isTrue(setTimeoutSpy.calledOnce);
        });
    });

    describe('_getElementOffsetTask Method Tests', () => {

        let setTimeoutSpy;

        beforeEach(() => {
            setTimeoutSpy = sandbox.stub(window, 'setTimeout').callsFake((callback, delay) => {
                // Optionally, you can log or verify the delay here
                return callback();
            });
        });

        afterEach(() => {
            setTimeoutSpy.restore();
        });

        // it('should process element offsets and add detected fontss', () => {

        //     const mockScanner = new OldOffloadFontsScanner(domUtilsStub);
        //     mockScanner._defaultWidth = { Arial: 100 };
        //     mockScanner._defaultHeight = { Arial: 100 };
        //     mockScanner._allFontsDiffs = [];

        //     const taskIteratorMock = {
        //         next: sandbox.stub().returns({ offsetWidth: 102, offsetHeight: 104, id: 'Font1' }),
        //         getFontFamily: sandbox.stub().returns('Arial'),
        //         getFontsArray:  sandbox.stub().returns(['Font1']),
        //         addFont: sandbox.stub(),
        //         reset: sandbox.stub()
        //     };

        //     mockScanner._getElementOffsetTask(taskIteratorMock, 0);

        //     // assert.equal(mockScanner._allFontsDiffs.length, 1);
        //     // assert.deepEqual(mockScanner._allFontsDiffs[0], ['Font1', 2, 4]);
        //     // assert.isTrue(taskIteratorMock.addFont.calledOnceWith('Font1'));
        // });

        // it('should not add font if no dimension difference', () => {

        //     const mockScanner = new OldOffloadFontsScanner(domUtilsStub);
        //     mockScanner._defaultWidth = { Arial: 100 };
        //     mockScanner._defaultHeight = { Arial: 100 };
        //     mockScanner._allFontsDiffs = [];

        //     const taskIteratorMock = {
        //         next: sandbox.stub().returns({ offsetWidth: 100, offsetHeight: 100, id: 'FontNoDiff' }),
        //         getFontFamily: sandbox.stub().returns('Arial'),
        //         addFont: sandbox.stub(),
        //         reset: sandbox.stub()
        //     };

        //     mockScanner._getElementOffsetTask(taskIteratorMock, 0);

        //     assert.equal(mockScanner._allFontsDiffs.length, 1);
        //     assert.deepEqual(mockScanner._allFontsDiffs[0], ['FontNoDiff', 0, 0]);
        //     assert.isFalse(taskIteratorMock.addFont.called, 'Should not add font if no difference');
        // });

        it('should reset iterator and call _applyFontsToSpanElements on completion', () => {

            const mockScanner = new OldOffloadFontsScanner(domUtilsStub);
            mockScanner._defaultWidth = { Arial: 100 };
            mockScanner._defaultHeight = { Arial: 100 };
            mockScanner._allFontsDiffs = [];

            const spansTaskIteratorMock = {
                next: sandbox.stub().returns(null),
                reset: sandbox.stub(),
                getFontFamily: sandbox.stub().returns('Arial'),
                getFontsArray: sandbox.stub().returns([])
            };

            sandbox.stub(mockScanner, '_applyFontsToSpanElements');

            mockScanner._getElementOffsetTask(spansTaskIteratorMock, 0);
            assert.isTrue(spansTaskIteratorMock.reset.calledOnce);
            assert.isTrue(mockScanner._applyFontsToSpanElements.calledOnceWith(spansTaskIteratorMock, 0));
        });
    });

    describe('Multiple Chunks Handling', () => {
        let setTimeoutStub;
        beforeEach(() => {
            // Simulate multiple fonts to trigger chunking
            scanner._chunkSize = 1; // Force only one font per chunk
            scanner._spanArray = {
                getElementsByTagName: sandbox.stub().returns([{ style: {}, id: '' }, { style: {}, id: '' }])
            };
            scanner._defaultWidth = { Arial: 100 };
            scanner._defaultHeight = { Arial: 100 };
            scanner._allFontsDiffs = [];
            setTimeoutStub = sandbox.stub(window, 'setTimeout').callsFake((fn) => fn());
        });

        afterEach(() => {
            setTimeoutStub.restore();
        });

        it('should handle multiple fonts in separate chunks', async () => {
            const fonts = ['Font1', 'Font2'];
            try {
                const availableFonts = await scanner.scan(fonts, 'Arial');
                // Assert that the returned value is an array
                assert.isArray(availableFonts, 'Should return an array of available fonts');
            } catch (err) {
                assert.fail('Should not reject promise, error: ' + err.message);
            }
        });

    });

    describe('Edge Case Tests', () => {
        it('should handle empty fonts array gracefully', async () => {
            scanner._spanArray = { getElementsByTagName: sandbox.stub().returns([]) };
            const result = await scanner.scan([], 'Arial');
            assert.deepEqual(result, []);
        });

        it('should handle a null fontFamily gracefully', async () => {
            scanner._spanArray = {
                getElementsByTagName: sandbox.stub().returns([{ style: {}, id: '' }])
            };
            sandbox.stub(scanner, '_getElementOffsetTask').callsFake((taskIterator) => {
                taskIterator.runCallback();
            });

            const result = await scanner.scan(['Font1'], null);
            assert.deepEqual(result, []);
        });
    });

    describe('isSupported Method Tests', () => {
        it('should always return true', () => {
            assert.isTrue(scanner.isSupported());
        });
    });
});
