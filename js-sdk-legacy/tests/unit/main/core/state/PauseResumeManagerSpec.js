import PauseResumeManager, { PauseResumeState } from '../../../../../src/main/core/state/PauseResumeManager';
import ConfigurationRepository from '../../../../../src/main/core/configuration/ConfigurationRepository';
import DataQ from '../../../../../src/main/technicalServices/DataQ';
import FeatureService from '../../../../../src/main/collectors/FeatureService';
import { ConfigurationFields } from '../../../../../src/main/core/configuration/ConfigurationFields';
import StateService from "../../../../../src/main/core/state/StateService";
import WorkerCommunicator from "../../../../../src/main/technicalServices/WorkerCommunicator";

describe('PauseResumeManager tests:', function () {
    const assert = chai.assert;

    describe('CTOR tests:', function () {
        it('CTOR should set its state to RUNNING and disable itself by default', function () {
            const prMgr = new PauseResumeManager(sinon.createStubInstance(FeatureService), sinon.stub(new ConfigurationRepository()), sinon.createStubInstance(DataQ));
            assert.equal(PauseResumeState.RUNNING, prMgr._sdkState, 'initial state is not RUNNING');
            assert.equal(false, prMgr._pauseResumeEnabled, 'initial _pauseResumeEnabled should be false');
        });
    });

    describe('onPause:', function () {
        it('should change the state to PAUSED and call FeatureService stop functions', function () {
            const featureMgr = sinon.createStubInstance(FeatureService);
            const configurationRepositoryStub = sinon.stub(new ConfigurationRepository());
            configurationRepositoryStub.get.withArgs(ConfigurationFields.stateChangeEnabled).returns(true);
            const dataQ = sinon.createStubInstance(DataQ);
            const stateServiceStub = sinon.createStubInstance(StateService);
            const workerCommunicatorStub = sinon.createStubInstance(WorkerCommunicator);
            const prMgr = new PauseResumeManager(featureMgr, configurationRepositoryStub, dataQ, stateServiceStub, workerCommunicatorStub);

            prMgr.onPause();
            assert.isTrue(featureMgr.stopAllFeatures.calledOnce, 'stopAllFeatures was not called');
            assert.equal(PauseResumeState.PAUSED, prMgr._sdkState, 'state is not paused');
            assert.isFalse(prMgr.isCustomerApiEnabled(), 'customer api should be disabled');
        });

        it('should do nothing if the state is already PAUSED', function () {
            const featureMgr = sinon.createStubInstance(FeatureService);
            const configurationRepositoryStub = sinon.stub(new ConfigurationRepository());
            configurationRepositoryStub.get.withArgs(ConfigurationFields.stateChangeEnabled).returns(true);
            const dataQ = sinon.createStubInstance(DataQ);
            const stateServiceStub = sinon.createStubInstance(StateService);
            const workerCommunicatorStub = sinon.createStubInstance(WorkerCommunicator);
            const prMgr = new PauseResumeManager(featureMgr, configurationRepositoryStub, dataQ, stateServiceStub, workerCommunicatorStub);

            prMgr.onPause(); // change the state to paused
            featureMgr.stopAllFeatures.reset();
            prMgr.onPause();
            assert.isTrue(featureMgr.stopAllFeatures.notCalled, 'stopAllFeatures was called');
            assert.equal(PauseResumeState.PAUSED, prMgr._sdkState, 'state is not running');
        });

        it('due to configUpdate should change the state to PAUSED and call FeatureService stop functions', function () {
            const featureMgr = sinon.createStubInstance(FeatureService);
            const configurationRepositoryStub = sinon.stub(new ConfigurationRepository());
            configurationRepositoryStub.get.withArgs(ConfigurationFields.stateChangeEnabled).returns(true);
            configurationRepositoryStub.get.withArgs('isEnabled').returns(false);
            const dataQ = sinon.createStubInstance(DataQ);
            const stateServiceStub = sinon.createStubInstance(StateService);
            const workerCommunicatorStub = sinon.createStubInstance(WorkerCommunicator);
            const prMgr = new PauseResumeManager(featureMgr, configurationRepositoryStub, dataQ, stateServiceStub, workerCommunicatorStub);

            prMgr.onConfigUpdate();
            assert.isTrue(featureMgr.stopAllFeatures.calledOnce, 'stopAllFeatures was not called');
            assert.equal(PauseResumeState.PAUSED, prMgr._sdkState, 'state is not paused');
            assert.isFalse(prMgr.isCustomerApiEnabled(), 'customer api should be disabled');
        });

        it('isEnabled is undefined so system should stay enabled', function () {
            const featureMgr = sinon.createStubInstance(FeatureService);
            const configurationRepositoryStub = sinon.stub(new ConfigurationRepository());
            configurationRepositoryStub.get.withArgs(ConfigurationFields.stateChangeEnabled).returns(true);
            const dataQ = sinon.createStubInstance(DataQ);
            const stateServiceStub = sinon.createStubInstance(StateService);
            const workerCommunicatorStub = sinon.createStubInstance(WorkerCommunicator);
            const prMgr = new PauseResumeManager(featureMgr, configurationRepositoryStub, dataQ, stateServiceStub, workerCommunicatorStub);

            prMgr.onConfigUpdate();
            assert.isFalse(featureMgr.stopAllFeatures.called, 'stopAllFeatures was not called');
            assert.equal(PauseResumeState.RUNNING, prMgr._sdkState, 'state is paused');
            assert.isTrue(prMgr.isCustomerApiEnabled(), 'customer api should be enabled');
        });
    });

    describe('onResume: ', function () {
        it('should change the state to RUNNING and call FeatureService updateRunByConfig', function () {
            const featureMgr = sinon.createStubInstance(FeatureService);
            const configurationRepositoryStub = sinon.stub(new ConfigurationRepository());
            configurationRepositoryStub.get.withArgs(ConfigurationFields.stateChangeEnabled).returns(true);
            const dataQ = sinon.createStubInstance(DataQ);
            const stateServiceStub = sinon.createStubInstance(StateService);
            const workerCommunicatorStub = sinon.createStubInstance(WorkerCommunicator);
            const prMgr = new PauseResumeManager(featureMgr, configurationRepositoryStub, dataQ, stateServiceStub, workerCommunicatorStub);

            prMgr.onPause();
            prMgr.onResume();
            assert.equal(PauseResumeState.RUNNING, prMgr._sdkState, 'state is not RUNNING');
            assert.isTrue(featureMgr.updateRunByConfig.calledWith(prMgr._configurationRepository), 'updateRunByConfig was not called');
        });

        it('should do nothing if the state is already RUNNING', function () {
            const featureMgr = sinon.createStubInstance(FeatureService);
            const configurationRepositoryStub = sinon.stub(new ConfigurationRepository());
            configurationRepositoryStub.get.withArgs(ConfigurationFields.stateChangeEnabled).returns(true);
            const dataQ = sinon.createStubInstance(DataQ);
            const prMgr = new PauseResumeManager(featureMgr, configurationRepositoryStub, dataQ);

            prMgr.onResume();
            assert.isTrue(featureMgr.updateRunByConfig.notCalled, 'updateRunByConfig was called');
        });
    });

    describe('onStateChange: ', function () {
        it('should call onPause on msg with toState pause', function () {
            const featureMgr = sinon.createStubInstance(FeatureService);
            const configurationRepositoryStub = sinon.stub(new ConfigurationRepository());
            configurationRepositoryStub.get.withArgs(ConfigurationFields.stateChangeEnabled).returns(true);
            const dataQ = sinon.createStubInstance(DataQ);
            const stateServiceStub = sinon.createStubInstance(StateService);
            const workerCommunicatorStub = sinon.createStubInstance(WorkerCommunicator);
            const prMgr = new PauseResumeManager(featureMgr, configurationRepositoryStub, dataQ, stateServiceStub, workerCommunicatorStub);

            prMgr.onStateChange({ toState: 'pause' });
            assert.isTrue(featureMgr.stopAllFeatures.calledOnce, 'stopAllFeatures was not called');
            assert.equal(PauseResumeState.PAUSED, prMgr._sdkState, 'state is not paused');
            assert.isFalse(prMgr.isCustomerApiEnabled(), 'customer api should be disabled');
        });

        it('should call onResume on msg with toState resume', function () {
            const featureMgr = sinon.createStubInstance(FeatureService);
            const configurationRepositoryStub = sinon.stub(new ConfigurationRepository());
            configurationRepositoryStub.get.withArgs(ConfigurationFields.stateChangeEnabled).returns(true);
            const dataQ = sinon.createStubInstance(DataQ);
            const stateServiceStub = sinon.createStubInstance(StateService);
            const workerCommunicatorStub = sinon.createStubInstance(WorkerCommunicator);
            const prMgr = new PauseResumeManager(featureMgr, configurationRepositoryStub, dataQ, stateServiceStub, workerCommunicatorStub);

            prMgr.onPause();
            prMgr.onStateChange({ toState: 'run' });
            assert.equal(PauseResumeState.RUNNING, prMgr._sdkState, 'state is not RUNNING');
            assert.isTrue(featureMgr.updateRunByConfig.calledWith(prMgr._configurationRepository), 'updateRunByConfig was not called');
        });

        it('should not change the state to PAUSED when pause api not enabled and should call dataQ', function () {
            const featureMgr = sinon.createStubInstance(FeatureService);
            const configurationRepositoryStub = sinon.stub(new ConfigurationRepository());
            configurationRepositoryStub.get.withArgs(ConfigurationFields.stateChangeEnabled).returns(false);
            const dataQ = sinon.createStubInstance(DataQ);
            const stateServiceStub = sinon.createStubInstance(StateService);
            const workerCommunicatorStub = sinon.createStubInstance(WorkerCommunicator);
            const prMgr = new PauseResumeManager(featureMgr, configurationRepositoryStub, dataQ, stateServiceStub, workerCommunicatorStub);

            prMgr.onStateChange({ toState: 'pause' });
            assert.isTrue(featureMgr.updateRunByConfig.notCalled, 'updateRunByConfig was called');
            assert.equal(PauseResumeState.RUNNING, prMgr._sdkState, 'state is not running');
            assert.isTrue(prMgr.isCustomerApiEnabled(), 'customer api should be enabled');
            assert.isTrue(dataQ.addToQueue.calledWithExactly('forbidden_api_call', [null, 'pause']));
        });

        it('should not change the state to RUNNING when resume api not enabled and should call dataQ', function () {
            const featureMgr = sinon.createStubInstance(FeatureService);
            const configurationRepositoryStub = sinon.stub(new ConfigurationRepository());
            configurationRepositoryStub.get.withArgs(ConfigurationFields.stateChangeEnabled).returns(false);
            const dataQ = sinon.createStubInstance(DataQ);
            const stateServiceStub = sinon.createStubInstance(StateService);
            const workerCommunicatorStub = sinon.createStubInstance(WorkerCommunicator);
            const prMgr = new PauseResumeManager(featureMgr, configurationRepositoryStub, dataQ, stateServiceStub, workerCommunicatorStub);
            prMgr.onPause();

            prMgr.onStateChange({ toState: 'run' });
            assert.isTrue(featureMgr.updateRunByConfig.notCalled, 'updateRunByConfig was called');
            assert.equal(PauseResumeState.PAUSED, prMgr._sdkState, 'state is not paused');
            assert.isFalse(prMgr.isCustomerApiEnabled(), 'customer api should be disabled');
            assert.isTrue(dataQ.addToQueue.calledWithExactly('forbidden_api_call', [null, 'run']));
        });
    });

    describe('onConfigUpdate: ', function () {
        it('should update the _pauseResumeEnabled according to stateChangeEnabled configuration', function () {
            const featureMgr = sinon.createStubInstance(FeatureService);
            const configurationRepositoryStub = sinon.stub(new ConfigurationRepository());
            configurationRepositoryStub.get.withArgs(ConfigurationFields.stateChangeEnabled).returns(true);
            const dataQ = sinon.createStubInstance(DataQ);
            const stateServiceStub = sinon.createStubInstance(StateService);
            const workerCommunicatorStub = sinon.createStubInstance(WorkerCommunicator);
            const prMgr = new PauseResumeManager(featureMgr, configurationRepositoryStub, dataQ, stateServiceStub, workerCommunicatorStub);

            configurationRepositoryStub.get.withArgs(ConfigurationFields.stateChangeEnabled).returns(false);
            prMgr.onConfigUpdate();
            assert.equal(false, prMgr._pauseResumeEnabled, 'pauseResumeEnabled is not false 1');
            assert.equal(false, prMgr._verifyApiAllowed('a'), '_verifyApiAllowed did not returned false 1');

            configurationRepositoryStub.get.withArgs(ConfigurationFields.stateChangeEnabled).returns(true);
            prMgr.onConfigUpdate();
            assert.equal(true, prMgr._pauseResumeEnabled, 'pauseResumeEnabled is not true');
            assert.equal(true, prMgr._verifyApiAllowed('a'), '_verifyApiAllowed did not returned true');

            configurationRepositoryStub.get.withArgs(ConfigurationFields.stateChangeEnabled).returns(undefined);
            prMgr.onConfigUpdate();
            assert.equal(false, prMgr._pauseResumeEnabled, 'pauseResumeEnabled is not false 2');
            assert.equal(false, prMgr._verifyApiAllowed('a'), '_verifyApiAllowed did not returned false 2');
        });
    });
});
