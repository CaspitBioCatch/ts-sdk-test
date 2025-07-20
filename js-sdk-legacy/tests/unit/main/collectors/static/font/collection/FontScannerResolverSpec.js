import { assert } from 'chai';
import sinon from 'sinon';

import BatchFontScanner from '../../../../../../../src/main/collectors/static/font/collection/v2/BatchFontScanner';
import FontVersionType from '../../../../../../../src/main/collectors/static/font/collection/v2/types/FontVersionType';

import OldOffloadFontsScanner from '../../../../../../../src/main/collectors/static/font/collection/v1/OldOffloadFontsScanner';
import OldBatchFontsScanner from '../../../../../../../src/main/collectors/static/font/collection/v1/OldBatchFontsScanner';

import { ConfigurationFields } from '../../../../../../../src/main/core/configuration/ConfigurationFields';
import resolveFontScanner from '../../../../../../../src/main/collectors/static/font/collection/FontScannerResolver';

describe('resolveFontScanner Unit Tests', () => {
    let configurationRepositoryStub, domUtilsStub, utilsStub, sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        configurationRepositoryStub = {
            get: sandbox.stub()
        };

        domUtilsStub = sandbox.stub();
        utilsStub = sandbox.stub();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should resolve OldOffloadFontsScanner for FontVersionType.VERSION1 with offloadFontsCollectionEnabled true', () => {
        configurationRepositoryStub.get.withArgs(ConfigurationFields.offloadFontsCollectionEnabled).returns(true);

        const scanner = resolveFontScanner({
            utils: utilsStub,
            domUtils: domUtilsStub,
            configurationRepository: configurationRepositoryStub,
            fontVersion: FontVersionType.VERSION1
        });

        assert.instanceOf(scanner, OldOffloadFontsScanner, 'The resolved scanner is not an instance of OldOffloadFontsScanner.');
    });

    it('should resolve OldBatchFontsScanner for FontVersionType.VERSION1 with offloadFontsCollectionEnabled false', () => {
        configurationRepositoryStub.get.withArgs(ConfigurationFields.offloadFontsCollectionEnabled).returns(false);

        const scanner = resolveFontScanner({
            utils: utilsStub,
            domUtils: domUtilsStub,
            configurationRepository: configurationRepositoryStub,
            fontVersion: FontVersionType.VERSION1
        });

        assert.instanceOf(scanner, OldBatchFontsScanner, 'The resolved scanner is not an instance of OldBatchFontsScanner.');
    });

    it('should resolve BatchFontScanner for FontVersionType.VERSION2 with no pre-existing scanner or detector', () => {
        const scanner = resolveFontScanner({
            utils: utilsStub,
            domUtils: domUtilsStub,
            configurationRepository: configurationRepositoryStub,
            fontVersion: FontVersionType.VERSION2
        });

        assert.instanceOf(scanner, BatchFontScanner, 'The resolved scanner is not an instance of BatchFontScanner.');
    });

    it('should use provided fontDetector when resolving BatchFontScanner for FontVersionType.VERSION2', () => {
        const customDetector = {};

        const scanner = resolveFontScanner({
            utils: utilsStub,
            domUtils: domUtilsStub,
            configurationRepository: configurationRepositoryStub,
            fontVersion: FontVersionType.VERSION2,
            fontDetector: customDetector
        });

        assert.instanceOf(scanner, BatchFontScanner, 'The resolved scanner is not an instance of BatchFontScanner.');
        assert.equal(scanner.detector, customDetector, 'The provided fontDetector was not used.');
    });
});
