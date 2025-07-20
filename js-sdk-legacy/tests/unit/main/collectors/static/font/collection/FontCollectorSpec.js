import { assert } from 'chai';
import sinon from 'sinon';
import FontCollection from '../../../../../../../src/main/collectors/static/font/collection/FontCollection';
import FontsCache from '../../../../../../../src/main/collectors/static/font/collection/v2/FontsCache';
import FontsProvider from '../../../../../../../src/main/collectors/static/font/collection/FontsProvider';
import BatchFontScanner from '../../../../../../../src/main/collectors/static/font/collection/v2/BatchFontScanner';
import FontVersionType from '../../../../../../../src/main/collectors/static/font/collection/v2/types/FontVersionType';

import DataQueue from '../../../../../../../src/main/technicalServices/DataQ';
import ConfigurationRepository from '../../../../../../../src/main/core/configuration/ConfigurationRepository';
import { MockObjects } from '../../../../../mocks/mockObjects';

describe('FontCollection Unit Tests', function () {
    let fontCollection;
    let sandbox, utilsStub, domUtilsStub, dataQueueStub, configRepoStub;
    let fontsCacheStub, fontsProviderStub, fontScannerStub;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        // Mock dependencies
        utilsStub = sandbox.stub();
        utilsStub.StorageUtils = sandbox.stub();
        utilsStub.getHash = sandbox.stub().returns('test-hash');
        domUtilsStub = sandbox.stub(MockObjects.domUtils);

        fontsCacheStub = sandbox.createStubInstance(FontsCache);
        fontsProviderStub = sandbox.createStubInstance(FontsProvider);
        fontScannerStub = sandbox.createStubInstance(BatchFontScanner);
        configRepoStub = sandbox.createStubInstance(ConfigurationRepository);
        dataQueueStub = sandbox.createStubInstance(DataQueue);
        
        // Stub scanner
        fontScannerStub.scan.resolves([]);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('Constructor Validation', () => {
        it('should initialize correctly with valid parameters', () => {
            fontCollection = new FontCollection(
                utilsStub,
                domUtilsStub,
                dataQueueStub,
                configRepoStub,
                FontVersionType.VERSION1,
                fontScannerStub,
                fontsProviderStub,
                fontsCacheStub
            );
            assert.isNotNull(fontCollection);
            assert.equal(fontCollection._fontVersion, FontVersionType.VERSION1);
        });

        it('should throw an error if required parameters are missing', () => {
            assert.throws(() => {
                new FontCollection(null, domUtilsStub, dataQueueStub, configRepoStub, FontVersionType.VERSION1);
            }, /CDUtils instance is required/);

            assert.throws(() => {
                new FontCollection(utilsStub, null, dataQueueStub, configRepoStub, FontVersionType.VERSION1);
            }, /DOMUtils instance is required/);

            assert.throws(() => {
                new FontCollection(utilsStub, domUtilsStub, null, configRepoStub, FontVersionType.VERSION1);
            }, /DataQueue instance is required/);

            assert.throws(() => {
                new FontCollection(utilsStub, domUtilsStub, dataQueueStub, null, FontVersionType.VERSION1);
            }, /ConfigurationRepository instance is required/);
        });

        it('should throw an error for unsupported font versions', () => {
            assert.throws(() => {
                new FontCollection(utilsStub, domUtilsStub, dataQueueStub, configRepoStub, 'INVALID_VERSION');
            }, /Invalid font version type/);
        });
    });

    describe('collectFonts', () => {
        it('should use cached fonts if the cache is valid', async () => {
            fontsCacheStub.getStoredFonts.returns({ installedFonts: ['font1'], scannedAt: Date.now() });
            fontCollection = new FontCollection(
                utilsStub,
                domUtilsStub,
                dataQueueStub,
                configRepoStub,
                FontVersionType.VERSION1,
                fontScannerStub,
                fontsProviderStub,
                fontsCacheStub
            );

            const result = await fontCollection.collectFonts();
            assert.deepEqual(result, ['font1']);
        });

        it('should scan for fonts when the cache is expired', async () => {
            fontsCacheStub.getStoredFonts.returns({ installedFonts: ['font1'], scannedAt: Date.now() - 25 * 60 * 60 * 1000 }); // Expired cache
            fontsProviderStub.getFontsByVersion.returns({ monospace: ['font1'] });
            fontScannerStub.scan.resolves(['font2']);

            fontCollection = new FontCollection(
                utilsStub,
                domUtilsStub,
                dataQueueStub,
                configRepoStub,
                FontVersionType.VERSION1,
                fontScannerStub,
                fontsProviderStub,
                fontsCacheStub
            );

            const result = await fontCollection.collectFonts();
            assert.deepEqual(result, ['font2']);
            assert.isTrue(fontsCacheStub.saveFonts.calledOnce);
        });

        it('should scan for fonts when no cache is found', async () => {
            fontsCacheStub.getStoredFonts.returns(null);
            fontsProviderStub.getFontsByVersion.returns({ monospace: ['font1'] });
            fontScannerStub.scan.resolves(['font1']);

            fontCollection = new FontCollection(
                utilsStub,
                domUtilsStub,
                dataQueueStub,
                configRepoStub,
                FontVersionType.VERSION1,
                fontScannerStub,
                fontsProviderStub,
                fontsCacheStub
            );

            const result = await fontCollection.collectFonts();
            assert.deepEqual(result, ['font1']);
        });

        it('should handle cache with legacy format (direct array)', async () => {
            fontsCacheStub.getStoredFonts.returns(['font1', 'font2']);
            fontCollection = new FontCollection(
                utilsStub,
                domUtilsStub,
                dataQueueStub,
                configRepoStub,
                FontVersionType.VERSION1,
                fontScannerStub,
                fontsProviderStub,
                fontsCacheStub
            );

            const result = await fontCollection.collectFonts();
            assert.deepEqual(result, ['font1', 'font2']);
        });

    });

    describe('release', () => {
        it('should release the font scanner', () => {
            fontCollection = new FontCollection(
                utilsStub,
                domUtilsStub,
                dataQueueStub,
                configRepoStub,
                FontVersionType.VERSION1,
                fontScannerStub,
                fontsProviderStub,
                fontsCacheStub
            );

            fontCollection.release();
            assert.isTrue(fontScannerStub.release.calledOnce);
            assert.isTrue(fontCollection._collectorHasStopped);
        });
    });

    describe('_scanForInstalledFonts', () => {
        it('should scan fonts and return the result', async () => {
            fontsProviderStub.getFontsByVersion.returns({ monospace: ['font1'], sans: ['font2'] });
            fontScannerStub.scan.resolves(['font1']);

            fontCollection = new FontCollection(
                utilsStub,
                domUtilsStub,
                dataQueueStub,
                configRepoStub,
                FontVersionType.VERSION1,
                fontScannerStub,
                fontsProviderStub,
                fontsCacheStub
            );

            const result = await fontCollection._scanForInstalledFonts();
            assert.deepEqual(result.installedFonts, ['font1']);
            assert.isNumber(result.scanTime);
            assert.isNumber(result.scannedAt);
            assert.equal(result.totalFontsScanned, 2);
            assert.equal(result.totalFontsFound, 1);
        });

        it('should handle multiple font families and deduplicate results', async () => {
            fontsProviderStub.getFontsByVersion.returns({ 
                monospace: ['font1', 'font2'], 
                sans: ['font2', 'font3'] 
            });
            fontScannerStub.scan.resolves(['font1', 'font2']);

            fontCollection = new FontCollection(
                utilsStub,
                domUtilsStub,
                dataQueueStub,
                configRepoStub,
                FontVersionType.VERSION1,
                fontScannerStub,
                fontsProviderStub,
                fontsCacheStub
            );

            const result = await fontCollection._scanForInstalledFonts();
            assert.deepEqual(result.installedFonts.sort(), ['font1', 'font2'].sort());
            assert.equal(result.totalFontsScanned, 4);
            assert.equal(result.totalFontsFound, 2);
        });
    });
});
