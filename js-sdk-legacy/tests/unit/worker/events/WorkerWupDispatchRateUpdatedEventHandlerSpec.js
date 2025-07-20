import { assert } from 'chai';
import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import { MockObjects } from '../../mocks/mockObjects';
import WorkerWupDispatchRateUpdatedEventHandler
    from '../../../../src/worker/events/WorkerWupDispatchRateUpdatedEventHandler';
import { MessageBusEventType } from '../../../../src/main/events/MessageBusEventType';
import DataDispatcher from '../../../../src/worker/DataDispatcher';

describe('WorkerWupDispatchRateUpdatedEventHandler tests:', function () {
    beforeEach(function () {
        this.sandbox = sinon.createSandbox();

        this.messageBus = new MessageBus();
        this.dataDispatcherStub = this.sandbox.createStubInstance(DataDispatcher);

        this.loggerStub = this.sandbox.stub(MockObjects.logger);
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    it('should handle a new wup dispatch rate update once triggered', function () {
        const workerWupDispatchRateUpdatedEventHandler = new WorkerWupDispatchRateUpdatedEventHandler(this.messageBus, this.dataDispatcherStub, this.loggerStub);

        this.messageBus.publish(MessageBusEventType.WupDispatchRateUpdatedEvent, 1234);

        assert.exists(workerWupDispatchRateUpdatedEventHandler);
        assert.isTrue(this.dataDispatcherStub.scheduleNextDispatching.calledOnce, 'scheduleNextDispatching publish was not called once');
    });

    it('should handle multiple wup rate update event triggered', function () {
        const workerWupDispatchRateUpdatedEventHandler = new WorkerWupDispatchRateUpdatedEventHandler(this.messageBus, this.dataDispatcherStub, this.loggerStub);

        this.messageBus.publish(MessageBusEventType.WupDispatchRateUpdatedEvent, 444);
        this.messageBus.publish(MessageBusEventType.WupDispatchRateUpdatedEvent, 555);

        assert.isTrue(this.dataDispatcherStub.scheduleNextDispatching.calledTwice, 'scheduleNextDispatching publish was not called twice');

        this.messageBus.publish(MessageBusEventType.WupDispatchRateUpdatedEvent, 1);

        assert.exists(workerWupDispatchRateUpdatedEventHandler);
        assert.isTrue(this.dataDispatcherStub.scheduleNextDispatching.calledThrice, 'scheduleNextDispatching publish was not called thrice');
    });

    it('should not handle wup dispatch update event once an irrelevant event is triggered', function () {
        const workerWupDispatchRateUpdatedEventHandler = new WorkerWupDispatchRateUpdatedEventHandler(this.messageBus, this.dataDispatcherStub, this.loggerStub);

        this.messageBus.publish(MessageBusEventType.TouchEvent, this.configurationRepositoryStub);

        assert.exists(workerWupDispatchRateUpdatedEventHandler);
        assert.isTrue(this.dataDispatcherStub.scheduleNextDispatching.notCalled, 'scheduleNextDispatching publish was called');
    });
});
