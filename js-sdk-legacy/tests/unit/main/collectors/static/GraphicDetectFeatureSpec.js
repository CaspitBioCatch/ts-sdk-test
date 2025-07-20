import { assert } from 'chai';
import GraphicDetectFeature from '../../../../../src/main/collectors/static/GraphicDetectFeature';
import Log from '../../../../../src/main/technicalServices/log/Logger';
import DataQ from '../../../../../src/main/technicalServices/DataQ';

describe('GraphicDetect tests:', function () {
    describe('startFeature tests:', function () {
        beforeEach(function () {
            this.sandbox = sinon.createSandbox();
        });

        afterEach(function () {
            this.sandbox.restore();
        });

        it('should collect graphic data', function () {
            const dataQ = this.sandbox.createStubInstance(DataQ);
            const configurations = {
                isGraphCardEnabled: this.sandbox.stub().returns(true)
            };
            const gpFeature = new GraphicDetectFeature(dataQ, configurations);
            gpFeature.startFeature();

            assert.isTrue(dataQ.addToQueue.called, 'addToQueue was not called');
            const callArgs = dataQ.addToQueue.getCall(0).args;
            assert.equal('static_fields', callArgs[0], 'expected event name to be static');
            assert.equal('grph_card', callArgs[1][0], 'expected first field to be grph_card');

            assert.notEqual(0, callArgs[1].length, 'the graphic data is empty');
        });

        it('should handle exceptions during graphic card info collection', function () {
            const dataQ = this.sandbox.createStubInstance(DataQ);
            const configurations = {
                isGraphCardEnabled: this.sandbox.stub().returns(true)
            };
            const gpFeature = new GraphicDetectFeature(dataQ, configurations);
            const _getMappedRenderInfoStub = this.sandbox.stub(gpFeature, '_getMappedRenderInfo');
            _getMappedRenderInfoStub.throws('error error error');

            this._logErrorStub = this.sandbox.spy(Log, 'error');

            assert.doesNotThrow(() => { return gpFeature.startFeature(); });

            assert.isTrue(dataQ.addToQueue.notCalled, 'add to q called even there is not data');

            assert.isTrue(this._logErrorStub.calledOnce);
            assert.equal(this._logErrorStub.firstCall.args[0], 'Failed collecting Graphic Card information. error error error');
        });

        it('should not collect graphic data when isGraphCardEnabled is false', function () {
            const dataQ = this.sandbox.createStubInstance(DataQ);
            const configurations = {
                isGraphCardEnabled: this.sandbox.stub().returns(false)
            };
            const gpFeature = new GraphicDetectFeature(dataQ, configurations);
            const _getMappedRenderInfoStub = this.sandbox.stub(gpFeature, '_getMappedRenderInfo');

            gpFeature.startFeature();

            assert.isTrue(_getMappedRenderInfoStub.notCalled, '_getMappedRenderInfo should not be called when isGraphCardEnabled is false');
            assert.isTrue(dataQ.addToQueue.notCalled, 'addToQueue should not be called when isGraphCardEnabled is false');
            assert.isTrue(configurations.isGraphCardEnabled.calledOnce, 'isGraphCardEnabled should be called once');
        });

        it('should not collect graphic data when configurations is null', function () {
            const dataQ = this.sandbox.createStubInstance(DataQ);
            const configurations = null;
            const gpFeature = new GraphicDetectFeature(dataQ, configurations);
            const _getMappedRenderInfoStub = this.sandbox.stub(gpFeature, '_getMappedRenderInfo');

            assert.doesNotThrow(() => { return gpFeature.startFeature(); });

            assert.isTrue(_getMappedRenderInfoStub.notCalled, '_getMappedRenderInfo should not be called when configurations is null');
            assert.isTrue(dataQ.addToQueue.notCalled, 'addToQueue should not be called when configurations is null');
        });

        it('should not collect graphic data when configurations is undefined', function () {
            const dataQ = this.sandbox.createStubInstance(DataQ);
            const gpFeature = new GraphicDetectFeature(dataQ, undefined);
            const _getMappedRenderInfoStub = this.sandbox.stub(gpFeature, '_getMappedRenderInfo');

            assert.doesNotThrow(() => { return gpFeature.startFeature(); });

            assert.isTrue(_getMappedRenderInfoStub.notCalled, '_getMappedRenderInfo should not be called when configurations is undefined');
            assert.isTrue(dataQ.addToQueue.notCalled, 'addToQueue should not be called when configurations is undefined');
        });
    });
});
