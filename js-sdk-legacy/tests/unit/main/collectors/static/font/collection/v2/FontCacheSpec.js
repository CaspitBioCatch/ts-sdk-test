import { assert } from 'chai';
import sinon from 'sinon';
import FontsCache from '../../../../../../../../src/main/collectors/static/font/collection/v2/FontsCache';
import { FontVersionType } from '../../../../../../../../src/main/collectors/static/font/collection/v2';
import Log from '../../../../../../../../src/main/technicalServices/log/Logger';

describe('FontsCache Unit Tests', function () {
    let fontsCache;
    let storageUtilsStub, sandbox;

    beforeEach(() => {
        // Initialize Sinon sandbox
        sandbox = sinon.createSandbox();

        // Stub storage utilities
        storageUtilsStub = {
            saveToLocalStorage: sandbox.stub(),
            getFromLocalStorage: sandbox.stub(),
        };

        // Create instance of FontsCache
        fontsCache = new FontsCache(storageUtilsStub);
    });

    afterEach(() => {
        // Restore Sinon sandbox
        sandbox.restore();
    });

    describe('Constructor', () => {
        it('should initialize with storage utilities and version keys', () => {
            assert.isDefined(fontsCache._storageUtils);
            assert.isObject(fontsCache._versionKeys);
            assert.equal(fontsCache._versionKeys[FontVersionType.VERSION1], 'detectedFonts_2.1.5');
            assert.equal(fontsCache._versionKeys[FontVersionType.VERSION2], 'detectedFonts_3');
        });
    });

    describe('_getKeyByVersion', () => {
        it('should return the correct key for VERSION1', () => {
            const key = fontsCache._getKeyByVersion(FontVersionType.VERSION1);
            assert.equal(key, 'detectedFonts_2.1.5');
        });

        it('should return the correct key for VERSION2', () => {
            const key = fontsCache._getKeyByVersion(FontVersionType.VERSION2);
            assert.equal(key, 'detectedFonts_3');
        });

        it('should throw an error for an unsupported version', () => {
            assert.throws(() => fontsCache._getKeyByVersion('INVALID_VERSION'), 'Unsupported font version type: INVALID_VERSION');
        });
    });

    describe('saveFonts', () => {
        it('should save fonts to local storage with the correct key for VERSION1', () => {
            const fonts = 'Arial, Verdana';
            fontsCache.saveFonts(fonts, FontVersionType.VERSION1);

            assert.isTrue(storageUtilsStub.saveToLocalStorage.calledOnce);
            const args = storageUtilsStub.saveToLocalStorage.getCall(0).args;
            assert.equal(args[0], 'detectedFonts_2.1.5');
            assert.equal(args[1], fonts);
        });

        it('should save fonts to local storage with the correct key for VERSION2', () => {
            const fonts = 'Roboto, Open Sans';
            fontsCache.saveFonts(fonts, FontVersionType.VERSION2);

            assert.isTrue(storageUtilsStub.saveToLocalStorage.calledOnce);
            const args = storageUtilsStub.saveToLocalStorage.getCall(0).args;
            assert.equal(args[0], 'detectedFonts_3');
            assert.equal(args[1], fonts);
        });

        it('should log the saving operation', () => {
            const logSpy = sandbox.spy(Log, 'debug');
            const fonts = 'Arial, Verdana';

            fontsCache.saveFonts(fonts, FontVersionType.VERSION1);

            assert.isTrue(logSpy.calledOnce);
            assert.match(logSpy.getCall(0).args[0], /Saving fonts to localStorage under key:/);
        });
    });

    describe('getStoredFonts', () => {
        it('should retrieve stored fonts from local storage for VERSION1', () => {
            storageUtilsStub.getFromLocalStorage.withArgs('detectedFonts_2.1.5').returns('Arial, Verdana');

            const storedFonts = fontsCache.getStoredFonts(FontVersionType.VERSION1);
            assert.equal(storedFonts, 'Arial, Verdana');
            assert.isTrue(storageUtilsStub.getFromLocalStorage.calledOnceWith('detectedFonts_2.1.5'));
        });

        it('should retrieve stored fonts from local storage for VERSION2', () => {
            storageUtilsStub.getFromLocalStorage.withArgs('detectedFonts_3').returns('Roboto, Open Sans');

            const storedFonts = fontsCache.getStoredFonts(FontVersionType.VERSION2);
            assert.equal(storedFonts, 'Roboto, Open Sans');
            assert.isTrue(storageUtilsStub.getFromLocalStorage.calledOnceWith('detectedFonts_3'));
        });

        it('should return null if no fonts are stored', () => {
            storageUtilsStub.getFromLocalStorage.returns(null);

            const storedFonts = fontsCache.getStoredFonts(FontVersionType.VERSION1);
            assert.isNull(storedFonts);
        });

        it('should log the retrieval operation', () => {
            const logSpy = sandbox.spy(Log, 'debug');
            storageUtilsStub.getFromLocalStorage.withArgs('detectedFonts_2.1.5').returns('Arial, Verdana');

            fontsCache.getStoredFonts(FontVersionType.VERSION1);

            assert.isTrue(logSpy.calledOnce);
            assert.match(logSpy.getCall(0).args[0], /Retrieved fonts from localStorage under key/);
        });
    });
});
