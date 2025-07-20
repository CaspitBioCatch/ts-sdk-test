import { assert } from 'chai';
import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import ConfigurationRepository from '../../../../src/main/core/configuration/ConfigurationRepository';
import { ConfigurationFields } from '../../../../src/main/core/configuration/ConfigurationFields';
import { MockObjects } from '../../mocks/mockObjects';
import WorkerConfigurationLoadedEventHandler
    from '../../../../src/worker/events/WorkerConfigurationLoadedEventHandler';
import { MessageBusEventType } from '../../../../src/main/events/MessageBusEventType';
import { WorkerEvent } from '../../../../src/main/events/WorkerEvent';
import DataDispatcher from '../../../../src/worker/DataDispatcher';
import WupServerClient from '../../../../src/worker/communication/WupServerClient';
import LogServerClient from '../../../../src/worker/communication/LogServerClient';
import WupStatisticsService from '../../../../src/worker/wup/WupStatisticsService';
import WorkerCommunicator from '../../../../src/main/technicalServices/WorkerCommunicator';
import ServerCommunicator from '../../../../src/worker/communication/ServerCommunicator';

describe('WorkerConfigurationLoadedEventHandler tests:', function () {
    beforeEach(function () {
        this.sandbox = sinon.createSandbox();

        this.messageBus = new MessageBus();

        this.configurationRepositoryStub = this.sandbox.stub(new ConfigurationRepository());
        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.dataWupDispatchRateSettings).returns({ stam: 'stam' });
        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.logWupDispatchRateSettings).returns({ log: 'log' });

        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.wupStatisticsLogIntervalMs).returns(1234);
        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.serverCommunicationSettings).returns({
            sendRetryRate: 4421,
            queueLoadThreshold: 112,
        });
        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.wupMessageRequestTimeout).returns(12);
        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.logMessageRequestTimeout).returns(121212);
        this.configurationRepositoryStub.getAll.returns({ manyConfigs: 'tadada' });

        this.wupStatisticsServiceStub = this.sandbox.createStubInstance(WupStatisticsService);
        this.dataDispatcherStub = this.sandbox.createStubInstance(DataDispatcher);
        this.logDataDispatcherStub = this.sandbox.createStubInstance(DataDispatcher);
        this.serverCommunicatorStub = this.sandbox.createStubInstance(ServerCommunicator);

        this.wupServerClientStub = this.sandbox.createStubInstance(WupServerClient);
        this.logServerClientStub = this.sandbox.createStubInstance(LogServerClient);

        this.loggerStub = this.sandbox.stub(MockObjects.logger);
        this.mainCommunicatorStub = this.sandbox.createStubInstance(WorkerCommunicator);

        this.workerConfigurationLoadedEventHandler = new WorkerConfigurationLoadedEventHandler(this.messageBus, this.wupStatisticsServiceStub,
            this.dataDispatcherStub, this.logDataDispatcherStub, this.serverCommunicatorStub,
            this.wupServerClientStub, this.logServerClientStub, this.loggerStub, this.mainCommunicatorStub);
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    it('should handle config update once event is triggered', function () {
        this.messageBus.publish(MessageBusEventType.ConfigurationLoadedEvent, this.configurationRepositoryStub);

        assert.isTrue(this.wupStatisticsServiceStub.updateSettings.calledOnce, 'WupStatisticsService was not called once');
        assert.equal(this.wupStatisticsServiceStub.updateSettings.firstCall.args[0], 1234, 'WupStatisticsService.updateSettings was not called with expected args');

        assert.isTrue(this.dataDispatcherStub.updateByConfig.calledOnce, 'dataDispatcher was not called once');
        assert.equal(this.dataDispatcherStub.updateByConfig.firstCall.args[0], this.configurationRepositoryStub.get(ConfigurationFields.dataWupDispatchRateSettings),
            'DataAggregator.updateByConfig was not called with expected args');

        assert.isTrue(this.logDataDispatcherStub.updateByConfig.calledOnce, 'LogPerfAggregator was not called once');
        assert.equal(this.logDataDispatcherStub.updateByConfig.firstCall.args[0], this.configurationRepositoryStub.get(ConfigurationFields.logWupDispatchRateSettings),
            'LogPerfAggregator.updateByConfig was not called with expected args');

        assert.isTrue(this.serverCommunicatorStub.updateSettings.calledOnce, 'ServerCommunicator was not called once');
        assert.deepEqual(this.serverCommunicatorStub.updateSettings.firstCall.args[0], {
                sendRetryRate: 4421,
                queueLoadThreshold: 112,
            },
            'ServerCommunicator.updateSettings was not called with expected args');

        assert.isTrue(this.wupServerClientStub.setRequestTimeout.calledOnce, 'WupServerClient was not called once');
        assert.equal(this.wupServerClientStub.setRequestTimeout.firstCall.args[0], 12, 'WupServerClient.setRequestTimeout was not called with expected args');

        assert.isTrue(this.logServerClientStub.setRequestTimeout.calledOnce, 'LogServerClient was not called once');
        assert.equal(this.logServerClientStub.setRequestTimeout.firstCall.args[0], 121212, 'LogServerClient.setRequestTimeout was not called with expected args');

        assert.isTrue(this.loggerStub.updateLogConfig.calledOnce, 'Logger was not called once');
        assert.equal(this.loggerStub.updateLogConfig.firstCall.args[0], this.configurationRepositoryStub, 'Logger.updateLogConfig was not called with expected args');

        assert.isTrue(this.mainCommunicatorStub.sendAsync.calledOnce, 'MainCommunicator was not called once');
        assert.equal(this.mainCommunicatorStub.sendAsync.firstCall.args[0], WorkerEvent.ConfigurationLoadedEvent, 'MainCommunicator.sendAsnyc was not called with expected args');
        assert.deepEqual(this.mainCommunicatorStub.sendAsync.firstCall.args[1], { manyConfigs: 'tadada' }, 'MainCommunicator.sendAsnyc was not called with expected args');
    });

    it('should handle multiple config updates once multiple events are triggered', function () {
        const configurationRepositoryStub1 = this.sandbox.stub(new ConfigurationRepository());
        configurationRepositoryStub1.get.withArgs(ConfigurationFields.wupStatisticsLogIntervalMs).returns(1111111111111);
        configurationRepositoryStub1.get.withArgs(ConfigurationFields.serverCommunicationSettings).returns({
            sendRetryRate: 1234,
            queueLoadThreshold: 23,
        });
        configurationRepositoryStub1.get.withArgs(ConfigurationFields.wupMessageRequestTimeout).returns(13);
        configurationRepositoryStub1.get.withArgs(ConfigurationFields.logMessageRequestTimeout).returns(131313);
        configurationRepositoryStub1.get.withArgs(ConfigurationFields.dataWupDispatchRateSettings).returns({ stam: 'stam3' });
        configurationRepositoryStub1.get.withArgs(ConfigurationFields.dataWupDispatchRateSettings).returns({ log: 'log3333' });
        configurationRepositoryStub1.getAll.returns('manyConfigs');

        const configurationRepositoryStub2 = this.sandbox.stub(new ConfigurationRepository());
        configurationRepositoryStub2.get.withArgs(ConfigurationFields.wupStatisticsLogIntervalMs).returns(1343234);
        configurationRepositoryStub2.get.withArgs(ConfigurationFields.serverCommunicationSettings).returns({
            sendRetryRate: 321,
            queueLoadThreshold: 44,
        });
        configurationRepositoryStub2.get.withArgs(ConfigurationFields.wupMessageRequestTimeout).returns(15);
        configurationRepositoryStub2.get.withArgs(ConfigurationFields.logMessageRequestTimeout).returns(131415);
        configurationRepositoryStub2.get.withArgs(ConfigurationFields.dataWupDispatchRateSettings).returns({ stam: 'stam2' });
        configurationRepositoryStub2.get.withArgs(ConfigurationFields.dataWupDispatchRateSettings).returns({ log: 'stam2122' });
        configurationRepositoryStub2.getAll.returns('manyConfigs2');

        this.messageBus.publish(MessageBusEventType.ConfigurationLoadedEvent, this.configurationRepositoryStub);
        this.messageBus.publish(MessageBusEventType.ConfigurationLoadedEvent, configurationRepositoryStub1);
        this.messageBus.publish(MessageBusEventType.ConfigurationLoadedEvent, configurationRepositoryStub2);

        assert.isTrue(this.wupStatisticsServiceStub.updateSettings.calledThrice, 'WupStatisticsService was not called thrice');
        assert.equal(this.wupStatisticsServiceStub.updateSettings.firstCall.args[0], 1234, 'WupStatisticsService.updateSettings was not called with expected args');
        assert.equal(this.wupStatisticsServiceStub.updateSettings.secondCall.args[0], 1111111111111, 'WupStatisticsService.updateSettings was not called with expected args');
        assert.equal(this.wupStatisticsServiceStub.updateSettings.thirdCall.args[0], 1343234, 'WupStatisticsService.updateSettings was not called with expected args');

        assert.isTrue(this.dataDispatcherStub.updateByConfig.calledThrice, 'DataAggregator was not called thrice');
        assert.equal(this.dataDispatcherStub.updateByConfig.firstCall.args[0], this.configurationRepositoryStub.get(ConfigurationFields.dataWupDispatchRateSettings),
            'DataDispatcher.updateByConfig was not called with expected args');
        assert.equal(this.dataDispatcherStub.updateByConfig.secondCall.args[0], configurationRepositoryStub1.get(ConfigurationFields.dataWupDispatchRateSettings),
            'DataAggregator.updateByConfig was not called with expected args');
        assert.equal(this.dataDispatcherStub.updateByConfig.thirdCall.args[0], configurationRepositoryStub2.get(ConfigurationFields.dataWupDispatchRateSettings),
            'DataAggregator.updateByConfig was not called with expected args');

        assert.isTrue(this.serverCommunicatorStub.updateSettings.calledThrice, 'ServerCommunicator was not called thrice');
        assert.deepEqual(this.serverCommunicatorStub.updateSettings.firstCall.args[0], {
                sendRetryRate: 4421,
                queueLoadThreshold: 112,
            },
            'ServerCommunicator.updateSettings was not called with expected args');
        assert.deepEqual(this.serverCommunicatorStub.updateSettings.secondCall.args[0], {
                sendRetryRate: 1234,
                queueLoadThreshold: 23,
            },
            'ServerCommunicator.updateSettings was not called with expected args');
        assert.deepEqual(this.serverCommunicatorStub.updateSettings.thirdCall.args[0], {
                sendRetryRate: 321,
                queueLoadThreshold: 44,
            },
            'ServerCommunicator.updateSettings was not called with expected args');

        assert.isTrue(this.logDataDispatcherStub.updateByConfig.calledThrice, 'LogPerfAggregator was not called thrice');
        assert.equal(this.logDataDispatcherStub.updateByConfig.firstCall.args[0], this.configurationRepositoryStub.get(ConfigurationFields.logWupDispatchRateSettings),
            'LogPerfAggregator.updateByConfig was not called with expected args');
        assert.equal(this.logDataDispatcherStub.updateByConfig.secondCall.args[0], configurationRepositoryStub1.get(ConfigurationFields.logWupDispatchRateSettings),
            'LogPerfAggregator.updateByConfig was not called with expected args');
        assert.equal(this.logDataDispatcherStub.updateByConfig.thirdCall.args[0], configurationRepositoryStub2.get(ConfigurationFields.logWupDispatchRateSettings),
            'LogPerfAggregator.updateByConfig was not called with expected args');

        assert.isTrue(this.wupServerClientStub.setRequestTimeout.calledThrice, 'WupServerClient was not called thrice');
        assert.equal(this.wupServerClientStub.setRequestTimeout.firstCall.args[0], 12, 'WupServerClient.setRequestTimeout was not called with expected args');
        assert.equal(this.wupServerClientStub.setRequestTimeout.secondCall.args[0], 13, 'WupServerClient.setRequestTimeout was not called with expected args');
        assert.equal(this.wupServerClientStub.setRequestTimeout.thirdCall.args[0], 15, 'WupServerClient.setRequestTimeout was not called with expected args');

        assert.isTrue(this.logServerClientStub.setRequestTimeout.calledThrice, 'LogServerClient was not called thrice');
        assert.equal(this.logServerClientStub.setRequestTimeout.firstCall.args[0], 121212, 'LogServerClient.setRequestTimeout was not called with expected args');
        assert.equal(this.logServerClientStub.setRequestTimeout.secondCall.args[0], 131313, 'LogServerClient.setRequestTimeout was not called with expected args');
        assert.equal(this.logServerClientStub.setRequestTimeout.thirdCall.args[0], 131415, 'LogServerClient.setRequestTimeout was not called with expected args');

        assert.isTrue(this.loggerStub.updateLogConfig.calledThrice, 'Logger was not called thrice');
        assert.equal(this.loggerStub.updateLogConfig.firstCall.args[0], this.configurationRepositoryStub, 'Logger.updateLogConfig was not called with expected args');
        assert.equal(this.loggerStub.updateLogConfig.secondCall.args[0], configurationRepositoryStub1, 'Logger.updateLogConfig was not called with expected args');
        assert.equal(this.loggerStub.updateLogConfig.thirdCall.args[0], configurationRepositoryStub2, 'Logger.updateLogConfig was not called with expected args');

        assert.isTrue(this.mainCommunicatorStub.sendAsync.calledThrice, 'MainCommunicator was not called thrice');
        assert.equal(this.mainCommunicatorStub.sendAsync.firstCall.args[0], WorkerEvent.ConfigurationLoadedEvent, 'MainCommunicator.sendAsnyc was not called with expected args');
        assert.deepEqual(this.mainCommunicatorStub.sendAsync.firstCall.args[1], { manyConfigs: 'tadada' }, 'MainCommunicator.sendAsnyc was not called with expected args');
        assert.equal(this.mainCommunicatorStub.sendAsync.secondCall.args[0], WorkerEvent.ConfigurationLoadedEvent, 'MainCommunicator.sendAsnyc was not called with expected args');
        assert.deepEqual(this.mainCommunicatorStub.sendAsync.secondCall.args[1], 'manyConfigs', 'MainCommunicator.sendAsnyc was not called with expected args');
        assert.equal(this.mainCommunicatorStub.sendAsync.thirdCall.args[0], WorkerEvent.ConfigurationLoadedEvent, 'MainCommunicator.sendAsnyc was not called with expected args');
        assert.deepEqual(this.mainCommunicatorStub.sendAsync.thirdCall.args[1], 'manyConfigs2', 'MainCommunicator.sendAsnyc was not called with expected args');
    });

    it('should not handle config update once an irrelevant event is triggered', function () {
        this.messageBus.publish(MessageBusEventType.TouchEvent, this.configurationRepositoryStub);

        assert.isTrue(this.wupStatisticsServiceStub.updateSettings.notCalled, 'WupStatisticsService was called');
        assert.isTrue(this.dataDispatcherStub.updateByConfig.notCalled, 'DataAggregator was called');
        assert.isTrue(this.logDataDispatcherStub.updateByConfig.notCalled, 'LogPerfAggregator was called');
        assert.isTrue(this.serverCommunicatorStub.updateSettings.notCalled, 'ServerCommunicator was called');
        assert.isTrue(this.wupServerClientStub.setRequestTimeout.notCalled, 'WupServerClient was called');
        assert.isTrue(this.logServerClientStub.setRequestTimeout.notCalled, 'LogServerClient was called');
        assert.isTrue(this.loggerStub.updateLogConfig.notCalled, 'Logger was called');
        assert.isTrue(this.mainCommunicatorStub.sendAsync.notCalled, 'MainCommunicator was called');
    });

    it('should handle config update of wupResponseTimeout legacy configuration', function () {
        const configurationRepositoryStub1 = this.sandbox.stub(new ConfigurationRepository());
        configurationRepositoryStub1.get.withArgs(ConfigurationFields.wupStatisticsLogIntervalMs).returns(1111111111111);
        configurationRepositoryStub1.get.withArgs(ConfigurationFields.serverCommunicationSettings).returns({
            sendRetryRate: 1234,
            queueLoadThreshold: 23,
        });
        configurationRepositoryStub1.get.withArgs(ConfigurationFields.wupResponseTimeout).returns(45);
        configurationRepositoryStub1.get.withArgs(ConfigurationFields.wupMessageRequestTimeout).returns(null);
        configurationRepositoryStub1.get.withArgs(ConfigurationFields.logMessageRequestTimeout).returns(131313);

        this.messageBus.publish(MessageBusEventType.ConfigurationLoadedEvent, configurationRepositoryStub1);

        assert.isTrue(this.wupServerClientStub.setRequestTimeout.calledOnce, 'WupServerClient was not called once');
        assert.equal(this.wupServerClientStub.setRequestTimeout.firstCall.args[0], 45, 'WupServerClient.setRequestTimeout was not called with expected args');
    });

    it('should force dynamic rate dispatcher when force configuration is on', function () {
        const configurationRepositoryStub1 = this.sandbox.stub(new ConfigurationRepository());
        configurationRepositoryStub1.get.withArgs(ConfigurationFields.dataWupDispatchRateSettings).returns({ type: 'incremental' });
        configurationRepositoryStub1.get.withArgs(ConfigurationFields.logWupDispatchRateSettings).returns({ type: 'constant' });
        configurationRepositoryStub1.get.withArgs(ConfigurationFields.forceDynamicDataWupDispatchSettings).returns(true);

        this.messageBus.publish(MessageBusEventType.ConfigurationLoadedEvent, configurationRepositoryStub1);

        assert.isTrue(this.dataDispatcherStub.updateByConfig.calledOnce, 'DataDispatcher was not called once.');
        assert.deepEqual(this.dataDispatcherStub.updateByConfig.firstCall.args[0], { type: 'dynamic' }, 'DataDispatcher.setRequestTimeout was not called with expected args');
    });

    it('should not force dynamic rate dispatcher when force configuration is off', function () {
        const configurationRepositoryStub1 = this.sandbox.stub(new ConfigurationRepository());
        configurationRepositoryStub1.get.withArgs(ConfigurationFields.dataWupDispatchRateSettings).returns({ type: 'incremental' });
        configurationRepositoryStub1.get.withArgs(ConfigurationFields.logWupDispatchRateSettings).returns({ type: 'constant' });
        configurationRepositoryStub1.get.withArgs(ConfigurationFields.forceDynamicDataWupDispatchSettings).returns(false);

        this.messageBus.publish(MessageBusEventType.ConfigurationLoadedEvent, configurationRepositoryStub1);

        assert.isTrue(this.dataDispatcherStub.updateByConfig.calledOnce, 'DataDispatcher was not called once.');
        assert.deepEqual(this.dataDispatcherStub.updateByConfig.firstCall.args[0], { type: 'incremental' }, 'DataDispatcher.setRequestTimeout was not called with expected args');
    });
});
