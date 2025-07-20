import { assert } from 'chai';
import sinon from 'sinon';
import FontCollectionFeature from '../../../../../../../src/main/collectors/static/font/collection/FontCollectionFeature';
import FontCollection from '../../../../../../../src/main/collectors/static/font/collection/FontCollection';
import DataQueue from '../../../../../../../src/main/technicalServices/DataQ';
import ConfigurationRepository from '../../../../../../../src/main/core/configuration/ConfigurationRepository';
import { FontDataType } from '../../../../../../../src/main/contract/staticContracts/FontsDetectionContract';

describe('FontCollectionFeature Unit Tests', function () {
    let fontFeature, utilsStub, domUtilsStub, dataQueueStub, configRepoStub, sandbox, v1CollectorStub, v2CollectorStub;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        // Mock dependencies
        utilsStub = sandbox.stub();
        domUtilsStub = sandbox.stub();
        dataQueueStub = sandbox.createStubInstance(DataQueue);
        configRepoStub = sandbox.createStubInstance(ConfigurationRepository);
        v1CollectorStub = sandbox.createStubInstance(FontCollection);
        v2CollectorStub = sandbox.createStubInstance(FontCollection);

        // Mock methods expected by FontCollection
        domUtilsStub.onWindowDocumentReady = sandbox.stub().yields();
        v1CollectorStub.collectFonts = sandbox.stub().resolves(['V1-Font1', 'V1-Font2']);
        v2CollectorStub.collectFonts = sandbox.stub().resolves(['V2-Font1', 'V2-Font2']);
        v1CollectorStub.release = sandbox.stub();
        v2CollectorStub.release = sandbox.stub();

        fontFeature = new FontCollectionFeature(utilsStub, domUtilsStub, dataQueueStub, configRepoStub, v1CollectorStub, v2CollectorStub);
    });

    afterEach(() => {
        sandbox.restore();
    });

    // ... (Constructor validation tests remain the same)

    describe('startFeature', () => {

        it('should handle mobile device detection and abort font detection', async () => {
            // Mock navigator.userAgent for mobile environment
            sandbox.stub(global.navigator, 'userAgent').value('iPhone');

            await fontFeature.startFeature();

            assert.isTrue(v1CollectorStub.collectFonts.notCalled);
            assert.isTrue(v2CollectorStub.collectFonts.notCalled);
        });

        it('should proceed with font detection on non-mobile devices', async () => {
            // Mock navigator.userAgent for non-mobile environment
            sandbox.stub(global.navigator, 'userAgent').value('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

            const enqueueSpy = sandbox.spy(fontFeature, '_enqueueFontData');

            await fontFeature.startFeature();

            assert.isTrue(v1CollectorStub.collectFonts.calledOnce);
            assert.isTrue(v2CollectorStub.collectFonts.calledOnce);

            assert.isTrue(enqueueSpy.calledTwice);
            assert.deepEqual(enqueueSpy.getCall(0).args, [FontDataType.V1_ONLY, [['V1-Font1', 'V1-Font2'], null]]);
            assert.deepEqual(enqueueSpy.getCall(1).args, [FontDataType.V1_AND_V2, [['V1-Font1', 'V1-Font2'], ['V2-Font1', 'V2-Font2']]]);
        });
    });

    describe('stopFeature', () => {
        it('should release both collectors on stopFeature', () => {
            fontFeature.stopFeature();

            assert.isTrue(v1CollectorStub.release.calledOnce);
            assert.isTrue(v2CollectorStub.release.calledOnce);
        });
    });

    describe('_enqueueFontData', () => {
        it('should enqueue fonts in the correct format for V1_ONLY', () => {
            const fonts = [['V1-Font1', 'V1-Font2'], null];
            const dataType = FontDataType.V1_ONLY;

            fontFeature._enqueueFontData(dataType, fonts);

            assert.isTrue(dataQueueStub.addToQueue.calledOnce);
            const args = dataQueueStub.addToQueue.firstCall.args;
            assert.equal(args[0], 'static_fields');
            assert.equal(args[1][0], 'fonts');
            assert.deepEqual(args[1][1], [FontDataType.V1_ONLY, 'V1-Font1,V1-Font2']);
        });

        it('should enqueue fonts in the correct format for V2_ONLY', () => {
            const fonts = [null, ['V2-Font1', 'V2-Font2']];
            const dataType = FontDataType.V2_ONLY;

            fontFeature._enqueueFontData(dataType, fonts);

            assert.isTrue(dataQueueStub.addToQueue.calledOnce);
            const args = dataQueueStub.addToQueue.firstCall.args;
            assert.equal(args[0], 'static_fields');
            assert.equal(args[1][0], 'fonts');
            assert.deepEqual(args[1][1], [FontDataType.V2_ONLY, ['V2-Font1', 'V2-Font2']]);
        });

        it('should enqueue fonts in the correct format for V1_AND_V2', () => {
            const fonts = [['V1-Font1', 'V1-Font2'], ['V2-Font1', 'V2-Font2']];
            const dataType = FontDataType.V1_AND_V2;

            fontFeature._enqueueFontData(dataType, fonts);

            assert.isTrue(dataQueueStub.addToQueue.calledOnce);
            const args = dataQueueStub.addToQueue.firstCall.args;
            assert.equal(args[0], 'static_fields');
            assert.equal(args[1][0], 'fonts');
            assert.deepEqual(args[1][1], [FontDataType.V1_AND_V2, ['V1-Font1,V1-Font2', ['V2-Font1', 'V2-Font2']]]);
        });


        it('should throw an error if fonts are undefined', () => {
            assert.throws(() => fontFeature._enqueueFontData(FontDataType.V1_AND_V2, undefined), "IllegalState fonts undefined");
        });
    });
});