import { assert } from 'chai';
import sinon from 'sinon';
import NativeFontDetector from '../../../../../../../../../src/main/collectors/static/font/collection/v2/detector/NativeFontDetector';

describe('NativeFontDetector Tests:', function () {
    let sandbox;
    let mockDocument;
    let mockFontFace;
    let mockFontFaceSet;

    beforeEach(function () {
        sandbox = sinon.createSandbox();
        
        // Mock FontFaceSet with proper function setup
        mockFontFaceSet = {
            add: sandbox.stub(),
            check: sandbox.stub(),
            delete: sandbox.stub()
        };

        // Mock FontFace with proper async load method
        mockFontFace = {
            load: sandbox.stub().resolves()
        };
        
        // Mock document
        mockDocument = {
            fonts: mockFontFaceSet
        };

        // Mock global FontFace constructor to return the mock
        global.FontFace = sandbox.stub().returns(mockFontFace);
    });

    afterEach(function () {
        sandbox.restore();
    });

    describe('Constructor', function () {
        it('should initialize with default document when no parameter provided', function () {
            const detector = new NativeFontDetector();
            assert.equal(detector._document, window.document);
            assert.equal(detector._testSize, '16px');
        });

        it('should initialize with provided document', function () {
            const detector = new NativeFontDetector(mockDocument);
            assert.equal(detector._document, mockDocument);
            assert.equal(detector._testSize, '16px');
        });
    });

    describe('isSupported Method', function () {
        it('should return true when document.fonts API is supported', function () {
            const detector = new NativeFontDetector(mockDocument);
            
            const result = detector.isSupported();
            
            assert.isTrue(result);
        });

        it('should return false when document.fonts is not available', function () {
            const detector = new NativeFontDetector({ fonts: null });
            
            const result = detector.isSupported();
            
            assert.isFalse(result);
        });

        it('should return false when document.fonts.check is not a function', function () {
            const detector = new NativeFontDetector({ fonts: {} });
            
            const result = detector.isSupported();
            
            assert.isFalse(result);
        });
    });

    describe('detect Method', function () {
        it('should detect available font as true', async function () {
            const detector = new NativeFontDetector(mockDocument);
            mockFontFaceSet.check.returns(true);

            const result = await detector.detect('Arial', 'sans-serif');

            assert.isTrue(result);
            assert.isTrue(global.FontFace.calledWith('Arial', 'local("Arial")'));
            assert.isTrue(mockFontFace.load.called);
            assert.isTrue(mockFontFaceSet.add.calledWith(mockFontFace));
            assert.isTrue(mockFontFaceSet.check.calledWith('16px "Arial"'));
            assert.isTrue(mockFontFaceSet.delete.calledWith(mockFontFace));
        });

        it('should detect unavailable font as false', async function () {
            const detector = new NativeFontDetector(mockDocument);
            mockFontFaceSet.check.returns(false);

            const result = await detector.detect('NonExistentFont', 'sans-serif');

            assert.isFalse(result);
            assert.isTrue(mockFontFaceSet.add.calledWith(mockFontFace));
            assert.isTrue(mockFontFaceSet.check.calledWith('16px "NonExistentFont"'));
            assert.isTrue(mockFontFaceSet.delete.calledWith(mockFontFace));
        });
    });

    describe('release Method', function () {
        it('should not throw any errors', function () {
            const detector = new NativeFontDetector(mockDocument);
            
            assert.doesNotThrow(() => detector.release());
        });
    });

    describe('Integration with real document.fonts API', function () {
        it('should work with actual document.fonts when available', function () {
            // This test only runs if document.fonts is actually available
            if (typeof document !== 'undefined' && document.fonts && typeof document.fonts.check === 'function') {
                const detector = new NativeFontDetector();
                const result = detector.isSupported();
                assert.isTrue(result);
            } else {
                this.skip();
            }
        });
    });
}); 