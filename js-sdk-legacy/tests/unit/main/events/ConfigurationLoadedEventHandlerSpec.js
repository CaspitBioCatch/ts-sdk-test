import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import StateService from '../../../../src/main/core/state/StateService';
import PerfMonitor from '../../../../src/main/technicalServices/PerfMonitor';
import ConfigurationLoadedEventHandler from '../../../../src/main/events/ConfigurationLoadedEventHandler';
import { MockObjects } from '../../mocks/mockObjects';
import { MessageBusEventType } from '../../../../src/main/events/MessageBusEventType';
import MetadataService from '../../../../src/main/core/metadata/MetadataService';
import PauseResumeManager from '../../../../src/main/core/state/PauseResumeManager';
import SlaveListener from '../../../../src/main/services/SlaveListener';
import SensorsDataQueue from '../../../../src/main/collectors/events/SensorsDataQueue';
import SessionService from '../../../../src/main/core/session/SessionService';
import DataQ from '../../../../src/main/technicalServices/DataQ';
import FeatureService from '../../../../src/main/collectors/FeatureService';
import HeartBeatService from '../../../../src/main/services/HeartBeatService';
import SensorGateKeeper from '../../../../src/main/collectors/SensorGateKeeper';
import SidRepository from "../../../../src/main/core/session/SidRepository";
import CoordinatesMaskingConfigurationUpdater from "../../../../src/main/api/CoordinatesMaskingConfigurationUpdater";

describe('ConfigurationLoadedEventHandler tests:', function () {
    const assert = chai.assert;

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
        this.messageBus = new MessageBus();

        this.configurationRepositoryStub = sinon.stub();

        this.featureServiceStub = sinon.createStubInstance(FeatureService);
        this.dataQStub = sinon.createStubInstance(DataQ);
        this.pauseResumeMgrStub = this.sandbox.createStubInstance(PauseResumeManager);
        this.handleMetadataStub = this.sandbox.createStubInstance(MetadataService);
        this.loggerStub = sinon.stub(MockObjects.logger);
        this.contextMgrStub = sinon.stub(MockObjects.contextMgr);
        this.sessionServiceStub = sinon.createStubInstance(SessionService);
        this.sensorDataQStub = this.sandbox.createStubInstance(SensorsDataQueue);
        this.slaveListenerStub = this.sandbox.createStubInstance(SlaveListener);
        this.stateServiceStub = sinon.createStubInstance(StateService);
        this.performanceCounterStub = sinon.createStubInstance(PerfMonitor);
        this.heartBeatMessageServiceStub = sinon.createStubInstance(HeartBeatService);
        this._sensorGateKeeper = sinon.createStubInstance(SensorGateKeeper);
        this.sidRepositoryStub = sinon.createStubInstance(SidRepository);
        this.coordinatesMaskingConfigurationUpdater = sinon.createStubInstance(CoordinatesMaskingConfigurationUpdater);

        this.workerConfigurationLoadedEventHandler = new ConfigurationLoadedEventHandler(this.messageBus, this.featureServiceStub, this.dataQStub,
            this.pauseResumeMgrStub, this.handleMetadataStub, this.loggerStub, this.contextMgrStub, this.sessionServiceStub,
            this.sensorDataQStub, this.slaveListenerStub, this.stateServiceStub, this.performanceCounterStub, this.heartBeatMessageServiceStub, this._sensorGateKeeper,this.sidRepositoryStub,
            this.coordinatesMaskingConfigurationUpdater );
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    it('should handle config update once event is triggered', function () {
        this.messageBus.publish(MessageBusEventType.ConfigurationLoadedEvent, this.configurationRepositoryStub);

        assert.isTrue(this.featureServiceStub.updateRunByConfig.calledOnce, 'FeatureService was not called once');
        assert.equal(this.featureServiceStub.updateRunByConfig.firstCall.args[0], this.configurationRepositoryStub, 'FeatureService.updateRunByConfig was not called with expected args');

        assert.isTrue(this.dataQStub.updateWithConfig.calledOnce, 'DataQ was not called once');
        assert.equal(this.dataQStub.updateWithConfig.firstCall.args[0], this.configurationRepositoryStub, 'DataQ.updateWithConfig was not called with expected args');

        assert.isTrue(this.pauseResumeMgrStub.onConfigUpdate.calledOnce, 'PauseResumeMgr was not called once');
        assert.equal(this.pauseResumeMgrStub.onConfigUpdate.firstCall.args[0], this.configurationRepositoryStub, 'PauseResumeMgr.onConfigUpdate was not called with expected args');

        assert.isTrue(this.handleMetadataStub.onConfigUpdate.calledOnce, 'HandleMetadata was not called once');
        assert.equal(this.handleMetadataStub.onConfigUpdate.firstCall.args[0], this.configurationRepositoryStub, 'HandleMetadata.onConfigUpdate was not called with expected args');

        assert.isTrue(this.loggerStub.updateLogConfig.calledOnce, 'Logger was not called once');
        assert.equal(this.loggerStub.updateLogConfig.firstCall.args[0], this.configurationRepositoryStub, 'Logger.updateLogConfig was not called with expected args');

        assert.isTrue(this.contextMgrStub.onConfigUpdate.calledOnce, 'ContextMgr was not called once');
        assert.equal(this.contextMgrStub.onConfigUpdate.firstCall.args[0], this.configurationRepositoryStub, 'ContextMgr.onConfigUpdate was not called with expected args');

        assert.isTrue(this.sessionServiceStub.onConfigUpdate.calledOnce, 'SessionService was not called once');
        assert.equal(this.sessionServiceStub.onConfigUpdate.firstCall.args[0], this.configurationRepositoryStub, 'SessionService.onConfigUpdate was not called with expected args');

        assert.isTrue(this.sensorDataQStub.onConfigUpdate.calledOnce, 'SensorDataQ was not called once');
        assert.equal(this.sensorDataQStub.onConfigUpdate.firstCall.args[0], this.configurationRepositoryStub, 'SensorDataQ.onConfigUpdate was not called with expected args');

        assert.isTrue(this.slaveListenerStub.onConfigUpdate.calledOnce, 'SlaveListener was not called once');
        assert.equal(this.slaveListenerStub.onConfigUpdate.firstCall.args[0], this.configurationRepositoryStub, 'SlaveListener.onConfigUpdate was not called with expected args');

        assert.isTrue(this.stateServiceStub.updateState.calledOnce, 'StateService was not called once');
        assert.equal(this.stateServiceStub.updateState.firstCall.args[0], 'started', 'StateService.updateState was not called with expected args');

        assert.isTrue(this.performanceCounterStub.stopMonitor.calledOnce, 'PerformanceCounter was not called once');
        assert.equal(this.performanceCounterStub.stopMonitor.firstCall.args[0], 't.timeTillServerConfig', 'PerformanceCounter.stopMonitor was not called with expected args');

        assert.isTrue(this.heartBeatMessageServiceStub.updateConfig.calledOnce, 'HeartBeatMessageService was not called once');
        assert.equal(this.heartBeatMessageServiceStub.updateConfig.firstCall.args[0], this.configurationRepositoryStub, 'HeartBeatMessageService.updateConfig was not called with expected args');

        assert.isTrue(this.sidRepositoryStub.onConfigUpdate.calledOnce, 'sidRepository was not called once');
        assert.equal(this.sidRepositoryStub.onConfigUpdate.firstCall.args[0], this.configurationRepositoryStub, 'sidRepository.updateConfig was not called with expected args');

        assert.isTrue(this.coordinatesMaskingConfigurationUpdater.onConfigUpdate.calledOnce, 'coordinatesMaskingConfigurationUpdater was not called once');

    });

    it('should handle multiple config updates once multiple events are triggered', function () {
        this.messageBus.publish(MessageBusEventType.ConfigurationLoadedEvent, this.configurationRepositoryStub);
        this.messageBus.publish(MessageBusEventType.ConfigurationLoadedEvent, null);
        this.messageBus.publish(MessageBusEventType.ConfigurationLoadedEvent, undefined);

        assert.isTrue(this.featureServiceStub.updateRunByConfig.calledThrice, 'FeatureService was not called thrice');
        assert.equal(this.featureServiceStub.updateRunByConfig.firstCall.args[0], this.configurationRepositoryStub, 'FeatureService.updateRunByConfig was not called with expected args');
        assert.equal(this.featureServiceStub.updateRunByConfig.secondCall.args[0], null, 'FeatureService.updateRunByConfig was not called with expected args');
        assert.equal(this.featureServiceStub.updateRunByConfig.thirdCall.args[0], undefined, 'FeatureService.updateRunByConfig was not called with expected args');

        assert.isTrue(this.dataQStub.updateWithConfig.calledThrice, 'DataQ was not called thrice');
        assert.equal(this.dataQStub.updateWithConfig.firstCall.args[0], this.configurationRepositoryStub, 'DataQ.updateWithConfig was not called with expected args');
        assert.equal(this.dataQStub.updateWithConfig.secondCall.args[0], null, 'DataQ.updateWithConfig was not called with expected args');
        assert.equal(this.dataQStub.updateWithConfig.thirdCall.args[0], undefined, 'DataQ.updateWithConfig was not called with expected args');

        assert.isTrue(this.pauseResumeMgrStub.onConfigUpdate.calledThrice, 'PauseResumeMgr was not called thrice');
        assert.equal(this.pauseResumeMgrStub.onConfigUpdate.firstCall.args[0], this.configurationRepositoryStub, 'PauseResumeMgr.onConfigUpdate was not called with expected args');
        assert.equal(this.pauseResumeMgrStub.onConfigUpdate.secondCall.args[0], null, 'PauseResumeMgr.onConfigUpdate was not called with expected args');
        assert.equal(this.pauseResumeMgrStub.onConfigUpdate.thirdCall.args[0], undefined, 'PauseResumeMgr.onConfigUpdate was not called with expected args');

        assert.isTrue(this.handleMetadataStub.onConfigUpdate.calledThrice, 'HandleMetadata was not called thrice');
        assert.equal(this.handleMetadataStub.onConfigUpdate.firstCall.args[0], this.configurationRepositoryStub, 'HandleMetadata.onConfigUpdate was not called with expected args');
        assert.equal(this.handleMetadataStub.onConfigUpdate.secondCall.args[0], null, 'HandleMetadata.onConfigUpdate was not called with expected args');
        assert.equal(this.handleMetadataStub.onConfigUpdate.thirdCall.args[0], undefined, 'HandleMetadata.onConfigUpdate was not called with expected args');

        assert.isTrue(this.loggerStub.updateLogConfig.calledThrice, 'Logger was not called thrice');
        assert.equal(this.loggerStub.updateLogConfig.firstCall.args[0], this.configurationRepositoryStub, 'Logger.updateLogConfig was not called with expected args');
        assert.equal(this.loggerStub.updateLogConfig.secondCall.args[0], null, 'Logger.updateLogConfig was not called with expected args');
        assert.equal(this.loggerStub.updateLogConfig.thirdCall.args[0], undefined, 'Logger.updateLogConfig was not called with expected args');

        assert.isTrue(this.contextMgrStub.onConfigUpdate.calledThrice, 'ContextMgr was not called thrice');
        assert.equal(this.contextMgrStub.onConfigUpdate.firstCall.args[0], this.configurationRepositoryStub, 'ContextMgr.onConfigUpdate was not called with expected args');
        assert.equal(this.contextMgrStub.onConfigUpdate.secondCall.args[0], null, 'ContextMgr.onConfigUpdate was not called with expected args');
        assert.equal(this.contextMgrStub.onConfigUpdate.thirdCall.args[0], undefined, 'ContextMgr.onConfigUpdate was not called with expected args');

        assert.isTrue(this.sessionServiceStub.onConfigUpdate.calledThrice, 'SessionService was not called thrice');
        assert.equal(this.sessionServiceStub.onConfigUpdate.firstCall.args[0], this.configurationRepositoryStub, 'SessionService.onConfigUpdate was not called with expected args');
        assert.equal(this.sessionServiceStub.onConfigUpdate.secondCall.args[0], null, 'SessionService.onConfigUpdate was not called with expected args');
        assert.equal(this.sessionServiceStub.onConfigUpdate.thirdCall.args[0], undefined, 'SessionService.onConfigUpdate was not called with expected args');

        assert.isTrue(this.sensorDataQStub.onConfigUpdate.calledThrice, 'SensorDataQ was not called thrice');
        assert.equal(this.sensorDataQStub.onConfigUpdate.firstCall.args[0], this.configurationRepositoryStub, 'SensorDataQ.onConfigUpdate was not called with expected args');
        assert.equal(this.sensorDataQStub.onConfigUpdate.secondCall.args[0], null, 'SensorDataQ.onConfigUpdate was not called with expected args');
        assert.equal(this.sensorDataQStub.onConfigUpdate.thirdCall.args[0], undefined, 'SensorDataQ.onConfigUpdate was not called with expected args');

        assert.isTrue(this.slaveListenerStub.onConfigUpdate.calledThrice, 'SlaveListener was not called thrice');
        assert.equal(this.slaveListenerStub.onConfigUpdate.firstCall.args[0], this.configurationRepositoryStub, 'SlaveListener.onConfigUpdate was not called with expected args');
        assert.equal(this.slaveListenerStub.onConfigUpdate.secondCall.args[0], null, 'SlaveListener.onConfigUpdate was not called with expected args');
        assert.equal(this.slaveListenerStub.onConfigUpdate.thirdCall.args[0], undefined, 'SlaveListener.onConfigUpdate was not called with expected args');

        assert.isTrue(this.stateServiceStub.updateState.calledThrice, 'StateService was not called thrice');
        assert.equal(this.stateServiceStub.updateState.firstCall.args[0], 'started', 'StateService.updateState was not called with expected args');
        assert.equal(this.stateServiceStub.updateState.secondCall.args[0], 'started', 'StateService.updateState was not called with expected args');
        assert.equal(this.stateServiceStub.updateState.thirdCall.args[0], 'started', 'StateService.updateState was not called with expected args');

        assert.isTrue(this.performanceCounterStub.stopMonitor.calledThrice, 'PerformanceCounter was not called thrice');
        assert.equal(this.performanceCounterStub.stopMonitor.firstCall.args[0], 't.timeTillServerConfig', 'PerformanceCounter.stopMonitor was not called with expected args');
        assert.equal(this.performanceCounterStub.stopMonitor.secondCall.args[0], 't.timeTillServerConfig', 'PerformanceCounter.stopMonitor was not called with expected args');
        assert.equal(this.performanceCounterStub.stopMonitor.thirdCall.args[0], 't.timeTillServerConfig', 'PerformanceCounter.stopMonitor was not called with expected args');

        assert.isTrue(this.heartBeatMessageServiceStub.updateConfig.calledThrice, 'HeartBeatMessageService was not called thrice');
        assert.equal(this.heartBeatMessageServiceStub.updateConfig.firstCall.args[0], this.configurationRepositoryStub, 'HeartBeatMessageService.updateConfig was not called with expected args');
        assert.equal(this.heartBeatMessageServiceStub.updateConfig.secondCall.args[0], null, 'HeartBeatMessageService.updateConfig was not called with expected args');
        assert.equal(this.heartBeatMessageServiceStub.updateConfig.thirdCall.args[0], undefined, 'HeartBeatMessageService.updateConfig was not called with expected args');

        assert.isTrue(this.sidRepositoryStub.onConfigUpdate.calledThrice, 'sidRepositoryStub was not called thrice');
        assert.equal(this.sidRepositoryStub.onConfigUpdate.firstCall.args[0], this.configurationRepositoryStub, 'sidRepositoryStub.onConfigUpdate was not called with expected args');
        assert.equal(this.sidRepositoryStub.onConfigUpdate.secondCall.args[0], null, 'sidRepositoryStub.onConfigUpdate was not called with expected args');
        assert.equal(this.sidRepositoryStub.onConfigUpdate.thirdCall.args[0], undefined, 'sidRepositoryStub.onConfigUpdate was not called with expected args');

        assert.isTrue(this.coordinatesMaskingConfigurationUpdater.onConfigUpdate.calledThrice, 'coordinatesMaskingConfigurationUpdater was not called thrice');
        assert.equal(this.coordinatesMaskingConfigurationUpdater.onConfigUpdate.firstCall.args[0],
            this.configurationRepositoryStub, 'coordinatesMaskingConfigurationUpdater was not called thrice');
        assert.equal(this.coordinatesMaskingConfigurationUpdater.onConfigUpdate.secondCall.args[0],
            null, 'coordinatesMaskingConfigurationUpdater.onServerUpdate was not called with expected args');
        assert.equal(this.coordinatesMaskingConfigurationUpdater.onConfigUpdate.thirdCall.args[0],
            undefined, 'coordinatesMaskingConfigurationUpdater.onServerUpdate was not called with expected args');

    });

    it('should not handle config update once an irrelevant event is triggered', function () {
        this.messageBus.publish(MessageBusEventType.TouchEvent, this.configurationRepositoryStub);

        assert.isTrue(this.featureServiceStub.updateRunByConfig.notCalled, 'FeatureService was called');
        assert.isTrue(this.dataQStub.updateWithConfig.notCalled, 'DataQ was called');
        assert.isTrue(this.pauseResumeMgrStub.onConfigUpdate.notCalled, 'PauseResumeMgr was called');
        assert.isTrue(this.handleMetadataStub.onConfigUpdate.notCalled, 'HandleMetadata was called');
        assert.isTrue(this.loggerStub.updateLogConfig.notCalled, 'Logger was called');
        assert.isTrue(this.contextMgrStub.onConfigUpdate.notCalled, 'ContextMgr was called');
        assert.isTrue(this.sessionServiceStub.onConfigUpdate.notCalled, 'SessionService was called');
        assert.isTrue(this.sensorDataQStub.onConfigUpdate.notCalled, 'SensorDataQ was called');
        assert.isTrue(this.slaveListenerStub.onConfigUpdate.notCalled, 'SlaveListener was called');
        assert.isTrue(this.stateServiceStub.updateState.notCalled, 'StateService was called');
        assert.isTrue(this.performanceCounterStub.stopMonitor.notCalled, 'PerformanceCounter was called');
        assert.isTrue(this.heartBeatMessageServiceStub.updateConfig.notCalled, 'HeartBeatMessageService was called');
        assert.isTrue(this.sidRepositoryStub.onConfigUpdate.notCalled, 'sidRepositoryStub was called');
        assert.isTrue(this.coordinatesMaskingConfigurationUpdater.onConfigUpdate.notCalled, 'coordinatesMaskingConfigurationUpdater was called');

    });
});
