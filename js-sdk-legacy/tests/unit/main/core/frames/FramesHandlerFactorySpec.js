import { assert } from 'chai';
import ConfigurationRepository from '../../../../../src/main/core/configuration/ConfigurationRepository';
import FramesHandler from '../../../../../src/main/core/frames/FramesHandler';
import NullFramesHandler from '../../../../../src/main/core/frames/NullFramesHandler';
import FramesHandlerFactory from '../../../../../src/main/core/frames/FramesHandlerFactory';
import { MockObjects } from '../../../mocks/mockObjects';
import TestFeatureSupport from '../../../../TestFeatureSupport';
import CDUtils from "../../../../../src/main/technicalServices/CDUtils";

describe('FramesHandlerFactory tests:', function () {
    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
        this.configurationRepositoryStub = this.sandbox.stub(new ConfigurationRepository());
        this.domUtilsStub = this.sandbox.stub(MockObjects.domUtils);
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    describe('create tests:', function () {
        it('create a FramesHandler', function () {
            if (!TestFeatureSupport.isMutationObserverSupported()) {
                this.skip();
                return;
            }

            this.configurationRepositoryStub.get.withArgs('enableFramesProcessing').returns(true);

            const framesHandlerFactory = new FramesHandlerFactory(this.configurationRepositoryStub, this.domUtilsStub, CDUtils);

            const framesHandler = framesHandlerFactory.create();

            assert.exists(framesHandler);
            assert.instanceOf(framesHandler, FramesHandler);
        });

        it('create a NullFramesHandler', function () {
            this.configurationRepositoryStub.get.withArgs('enableFramesProcessing').returns(false);

            const framesHandlerFactory = new FramesHandlerFactory(this.configurationRepositoryStub, this.domUtilsStub, CDUtils);

            const framesHandler = framesHandlerFactory.create();

            assert.exists(framesHandler);
            assert.instanceOf(framesHandler, NullFramesHandler);
        });
    });
});
