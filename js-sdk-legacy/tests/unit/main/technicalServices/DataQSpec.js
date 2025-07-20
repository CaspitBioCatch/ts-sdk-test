import { WorkerCommand } from '../../../../src/main/events/WorkerCommand';
import DataQ from '../../../../src/main/technicalServices/DataQ';
import DOMUtils from '../../../../src/main/technicalServices/DOMUtils';
import ConfigurationRepository from '../../../../src/main/core/configuration/ConfigurationRepository';
import WorkerCommunicator from '../../../../src/main/technicalServices/WorkerCommunicator';
import ContextMgr from '../../../../src/main/core/context/ContextMgr';
import { ConfigurationFields } from '../../../../src/main/core/configuration/ConfigurationFields';

describe('DataQ tests:', function () {
    const assert = chai.assert;

    before(function () {
        this.clock = sinon.useFakeTimers();
    });

    after(function () {
        this.clock.restore();
    });

    describe('Constructor tests:', function () {
        it('should not set an interval id when passToWorkerInterval not passed', function () {
            const workerCommunicator = sinon.createStubInstance(WorkerCommunicator);
            const contextMgr = sinon.createStubInstance(ContextMgr);
            const dataQ = new DataQ(DOMUtils, workerCommunicator, contextMgr);

            assert.isUndefined(dataQ._intervalId);
            assert.equal(0, dataQ._passToWorkerInterval);
        });

        it('should set an interval id and call _sendToServerWorker on the interval', function () {
            const workerCommunicator = sinon.createStubInstance(WorkerCommunicator);
            const contextMgr = sinon.createStubInstance(ContextMgr);
            const dataQ = new DataQ(DOMUtils, workerCommunicator, contextMgr, 'a', WorkerCommand.sendDataCommand, 1000);
            const data = { eventType: 'testEvent', data: [1, 2, 3] };
            dataQ._Q.push(data);

            this.clock.tick(1000);
            assert.isTrue(workerCommunicator.sendAsync.calledOnce);
            assert.isTrue(workerCommunicator.sendAsync.calledWith(WorkerCommand.sendDataCommand));
            assert.equal(0, dataQ._Q.length);

            workerCommunicator.sendAsync.reset();

            this.clock.tick(1000);
            assert.isTrue(workerCommunicator.sendAsync.notCalled);

            dataQ._Q.push(data);
            dataQ._Q.push(data);

            this.clock.tick(1000);
            assert.isTrue(workerCommunicator.sendAsync.calledOnce);
            assert.isTrue(workerCommunicator.sendAsync.calledWith(WorkerCommand.sendDataCommand, [data, data]));
            assert.equal(0, dataQ._Q.length);
        });
    });

    describe('addToQueue tests: ', function () {
        it('should add contextId to in the begin of data and send immediately when no interval given', function () {
            const workerCommunicator = sinon.createStubInstance(WorkerCommunicator);
            const contextMgr = sinon.createStubInstance(ContextMgr);
            const dataQ = new DataQ(DOMUtils, workerCommunicator, contextMgr, 'a', WorkerCommand.sendDataCommand);

            contextMgr.contextHash = 123456;
            dataQ.addToQueue('eventXXX', [null, 1, 2, 3]);
            dataQ.addToQueue('eventYYY', [null, 4, 5, 6]);
            assert.isTrue(workerCommunicator.sendAsync.calledTwice);
            let sendAsyncArgs = workerCommunicator.sendAsync.getCall(0).args;
            assert.equal(WorkerCommand.sendDataCommand, sendAsyncArgs[0]);
            assert.equal('eventXXX', sendAsyncArgs[1].eventName);
            assert.equal(1, sendAsyncArgs[1].data[1]);
            assert.equal(123456, sendAsyncArgs[1].data[0]);
            sendAsyncArgs = workerCommunicator.sendAsync.getCall(1).args;
            assert.equal(WorkerCommand.sendDataCommand, sendAsyncArgs[0]);
            assert.equal('eventYYY', sendAsyncArgs[1].eventName);
            assert.equal(4, sendAsyncArgs[1].data[1]);
            assert.equal(123456, sendAsyncArgs[1].data[0]);
        });

        it('should add contextId to in the begin of data and send when interval pass interval given', function () {
            const workerCommunicator = sinon.createStubInstance(WorkerCommunicator);
            const contextMgr = sinon.createStubInstance(ContextMgr);
            const dataQ = new DataQ(DOMUtils, workerCommunicator, contextMgr, 'a', WorkerCommand.sendDataCommand, 500);

            contextMgr.contextHash = 123456;
            dataQ.addToQueue('eventXXX', [null, 1, 2, 3]);
            dataQ.addToQueue('eventYYY', [null, 4, 5, 6]);
            assert.isTrue(workerCommunicator.sendAsync.notCalled);
            this.clock.tick(500);
            const sendAsyncArgs = workerCommunicator.sendAsync.getCall(0).args;
            assert.equal(WorkerCommand.sendDataCommand, sendAsyncArgs[0]);
            assert.equal('eventXXX', sendAsyncArgs[1][0].eventName);
            assert.equal(1, sendAsyncArgs[1][0].data[1]);
            assert.equal(123456, sendAsyncArgs[1][0].data[0]);
            assert.equal('eventYYY', sendAsyncArgs[1][1].eventName);
            assert.equal(4, sendAsyncArgs[1][1].data[1]);
            assert.equal(123456, sendAsyncArgs[1][1].data[0]);
        });

        it('should add contextId to in the begin of data and send immediately when immediate wup', function () {
            const workerCommunicator = sinon.createStubInstance(WorkerCommunicator);
            const contextMgr = sinon.createStubInstance(ContextMgr);
            const dataQ = new DataQ(DOMUtils, workerCommunicator, contextMgr, 'a', WorkerCommand.sendDataCommand, 500);

            contextMgr.contextHash = 123456;
            dataQ.addToQueue('eventXXX', [null, 1, 2, 3]);
            assert.isTrue(workerCommunicator.sendAsync.notCalled);

            dataQ.addToQueue('eventYYY', [null, 4, 5, 6], true, true);
            assert.isTrue(workerCommunicator.sendAsync.calledOnce);

            const sendAsyncArgs = workerCommunicator.sendAsync.getCall(0).args;
            assert.equal(WorkerCommand.sendDataCommand, sendAsyncArgs[0]);
            assert.equal('eventXXX', sendAsyncArgs[1][0].eventName);
            assert.equal(1, sendAsyncArgs[1][0].data[1]);
            assert.equal(123456, sendAsyncArgs[1][0].data[0]);

            assert.equal('eventYYY', sendAsyncArgs[1][1].eventName);
            assert.equal(4, sendAsyncArgs[1][1].data[1]);
            assert.equal(123456, sendAsyncArgs[1][1].data[0]);
        });

        it('should not add contextId in the begin of data and send immediately when immediate wup', function () {
            const workerCommunicator = sinon.createStubInstance(WorkerCommunicator);
            const contextMgr = sinon.createStubInstance(ContextMgr);
            const dataQ = new DataQ(DOMUtils, workerCommunicator, contextMgr, 'a', WorkerCommand.sendDataCommand, 500);

            contextMgr.contextHash = 123456;
            dataQ.addToQueue('eventXXX', [1, 2, 3], false);
            assert.isTrue(workerCommunicator.sendAsync.notCalled);

            dataQ.addToQueue('eventYYY', [4, 5, 6], false, true);
            assert.isTrue(workerCommunicator.sendAsync.calledOnce);

            const sendAsyncArgs = workerCommunicator.sendAsync.getCall(0).args;
            assert.equal(WorkerCommand.sendDataCommand, sendAsyncArgs[0]);
            assert.equal('eventXXX', sendAsyncArgs[1][0].eventName);
            assert.equal(1, sendAsyncArgs[1][0].data[0]);

            assert.equal('eventYYY', sendAsyncArgs[1][1].eventName);
            assert.equal(4, sendAsyncArgs[1][1].data[0]);
        });
    });

    describe('updateWithConfig tests: ', function () {
        it('should change the interval of flushes to the new interval', function () {
            const workerCommunicator = sinon.createStubInstance(WorkerCommunicator);
            const contextMgr = sinon.createStubInstance(ContextMgr);
            const dataQ = new DataQ(DOMUtils, workerCommunicator, contextMgr, 'dataQPassWorkerInterval', WorkerCommand.sendDataCommand, 100);

            contextMgr.contextHash = 123456;
            dataQ.addToQueue('eventXXX', [null, 1, 2, 3]);
            dataQ.addToQueue('eventYYY', [null, 4, 5, 6]);

            const configurationRepository = sinon.stub(new ConfigurationRepository());
            configurationRepository.get.withArgs(ConfigurationFields.dataQPassWorkerInterval).returns(50);

            dataQ.updateWithConfig(configurationRepository);

            assert.isTrue(workerCommunicator.sendAsync.notCalled);
            this.clock.tick(60);
            assert.isTrue(workerCommunicator.sendAsync.calledOnce);
            const sendAsyncArgs = workerCommunicator.sendAsync.getCall(0).args;
            assert.equal(WorkerCommand.sendDataCommand, sendAsyncArgs[0]);
            assert.equal('eventXXX', sendAsyncArgs[1][0].eventName);
            assert.equal(1, sendAsyncArgs[1][0].data[1]);
            assert.equal(123456, sendAsyncArgs[1][0].data[0]);

            assert.equal('eventYYY', sendAsyncArgs[1][1].eventName);
            assert.equal(4, sendAsyncArgs[1][1].data[1]);
            assert.equal(123456, sendAsyncArgs[1][1].data[0]);
        });

        it('should not change the interval of flushes when dataQPassWorkerInterval not sent', function () {
            const workerCommunicator = sinon.createStubInstance(WorkerCommunicator);
            const contextMgr = sinon.createStubInstance(ContextMgr);
            const dataQ = new DataQ(DOMUtils, workerCommunicator, contextMgr, 'dataQPassWorkerInterval', WorkerCommand.sendDataCommand, 100);

            contextMgr.contextHash = 123456;
            dataQ.addToQueue('eventXXX', [null, 1, 2, 3]);
            dataQ.addToQueue('eventYYY', [null, 4, 5, 6]);

            const configurationRepository = sinon.stub(new ConfigurationRepository());
            configurationRepository.get.withArgs(ConfigurationFields.dataQPassWorkerInterval).returns(undefined);

            dataQ.updateWithConfig(configurationRepository);

            assert.isTrue(workerCommunicator.sendAsync.notCalled);
            this.clock.tick(60);
            assert.isTrue(workerCommunicator.sendAsync.notCalled);
            this.clock.tick(40);
            const sendAsyncArgs = workerCommunicator.sendAsync.getCall(0).args;
            assert.equal(WorkerCommand.sendDataCommand, sendAsyncArgs[0]);
            assert.equal('eventXXX', sendAsyncArgs[1][0].eventName);
            assert.equal(1, sendAsyncArgs[1][0].data[1]);
            assert.equal(123456, sendAsyncArgs[1][0].data[0]);

            assert.equal('eventYYY', sendAsyncArgs[1][1].eventName);
            assert.equal(4, sendAsyncArgs[1][1].data[1]);
            assert.equal(123456, sendAsyncArgs[1][1].data[0]);
        });

        it('should not set interval of flushes when dataQPassWorkerInterval not sent and base interval was 0', function () {
            const workerCommunicator = sinon.createStubInstance(WorkerCommunicator);
            const contextMgr = sinon.createStubInstance(ContextMgr);
            const dataQ = new DataQ(DOMUtils, workerCommunicator, contextMgr, 'dataQPassWorkerInterval', WorkerCommand.sendDataCommand);

            contextMgr.contextHash = 123456;
            dataQ.addToQueue('eventXXX', [null, 1, 2, 3]);

            assert.isTrue(workerCommunicator.sendAsync.calledOnce);
            let sendAsyncArgs = workerCommunicator.sendAsync.getCall(0).args;
            assert.equal(WorkerCommand.sendDataCommand, sendAsyncArgs[0]);
            assert.equal('eventXXX', sendAsyncArgs[1].eventName);
            assert.equal(1, sendAsyncArgs[1].data[1]);
            assert.equal(123456, sendAsyncArgs[1].data[0]);

            const configurationRepository = sinon.stub(new ConfigurationRepository());
            configurationRepository.get.withArgs(ConfigurationFields.dataQPassWorkerInterval).returns(undefined);
            dataQ.updateWithConfig(configurationRepository);

            dataQ.addToQueue('eventYYY', [null, 4, 5, 6]);
            assert.isTrue(workerCommunicator.sendAsync.calledTwice);
            sendAsyncArgs = workerCommunicator.sendAsync.getCall(1).args;
            assert.equal(WorkerCommand.sendDataCommand, sendAsyncArgs[0]);
            assert.equal('eventYYY', sendAsyncArgs[1].eventName);
            assert.equal(4, sendAsyncArgs[1].data[1]);
            assert.equal(123456, sendAsyncArgs[1].data[0]);
        });
    });

    describe('sending the data tests: ', function () {
        it('should send data in single messages if there is error in sending the entire Q', function () {
            const workerCommunicator = sinon.createStubInstance(WorkerCommunicator);
            const contextMgr = sinon.createStubInstance(ContextMgr);
            const dataQ = new DataQ(DOMUtils, workerCommunicator, contextMgr, 'a', WorkerCommand.sendDataCommand, 10000);

            workerCommunicator.sendAsync.onFirstCall().throws('invalid data error');
            workerCommunicator.sendAsync.onThirdCall().throws('invalid data error');

            contextMgr.contextHash = 123456;
            dataQ.addToQueue('eventXXX', [null, 1, 2, 3]);
            dataQ.addToQueue('BAD DATA', [null, 1, 1, 1]);
            dataQ.addToQueue('eventYYY', [null, 4, 5, 6]);
            dataQ.addToQueue('eventYYY', [null, 7, 8, 9], true, true);

            assert.isTrue(workerCommunicator.sendAsync.callCount === 5, 'sendAsync was not called 5 times');
            let sendAsyncArgs = workerCommunicator.sendAsync.getCall(0).args;
            assert.equal(sendAsyncArgs[0], WorkerCommand.sendDataCommand);
            assert.equal(sendAsyncArgs[1][0].eventName, 'eventXXX');
            assert.equal(sendAsyncArgs[1][1].data[0], 123456);
            assert.equal(sendAsyncArgs[1][1].data[1], 1);

            sendAsyncArgs = workerCommunicator.sendAsync.getCall(1).args;
            assert.equal(sendAsyncArgs[0], WorkerCommand.sendDataCommand);
            assert.equal(sendAsyncArgs[1].eventName, 'eventXXX');
            assert.equal(sendAsyncArgs[1].data[0], 123456);
            assert.equal(sendAsyncArgs[1].data[1], 1);
            assert.equal(sendAsyncArgs[1].origin,'BC', 'did not have origin');

            sendAsyncArgs = workerCommunicator.sendAsync.getCall(2).args;
            assert.equal(sendAsyncArgs[0], WorkerCommand.sendDataCommand);
            assert.equal(sendAsyncArgs[1].eventName, 'BAD DATA');
            assert.equal(sendAsyncArgs[1].data[0], 123456);
            assert.equal(sendAsyncArgs[1].data[1], 1);
            assert.equal(sendAsyncArgs[1].origin,'BC', 'did not have origin');

            sendAsyncArgs = workerCommunicator.sendAsync.getCall(3).args;
            assert.equal(sendAsyncArgs[0], WorkerCommand.sendDataCommand);
            assert.equal(sendAsyncArgs[1].eventName, 'eventYYY');
            assert.equal(sendAsyncArgs[1].data[0], 123456);
            assert.equal(sendAsyncArgs[1].data[1], 4);
            assert.equal(sendAsyncArgs[1].origin,'BC', 'did not have origin');

            sendAsyncArgs = workerCommunicator.sendAsync.getCall(4).args;
            assert.equal(sendAsyncArgs[0], WorkerCommand.sendDataCommand);
            assert.equal(sendAsyncArgs[1].eventName, 'eventYYY');
            assert.equal(sendAsyncArgs[1].data[0], 123456);
            assert.equal(sendAsyncArgs[1].data[1], 7);
            assert.equal(sendAsyncArgs[1].origin,'BC', 'did not have origin');

        });
    });

    describe('flush tests:', function () {
        it('should send flushData message when flushAllMessages is called', function () {
            const workerCommunicator = sinon.createStubInstance(WorkerCommunicator);
            const contextMgr = sinon.createStubInstance(ContextMgr);
            const dataQ = new DataQ(DOMUtils, workerCommunicator, contextMgr, 'a', WorkerCommand.sendDataCommand, 10000);

            dataQ.flushAllMessages();

            assert.isTrue(workerCommunicator.sendAsync.calledOnce);

            const sendAsyncArgs = workerCommunicator.sendAsync.getCall(0).args;
            assert.equal(sendAsyncArgs[0], WorkerCommand.sendDataCommand);
            assert.equal(sendAsyncArgs[1][0].eventName, 'flushData');
        });

        it('should flushData on beforeunload event', function () {
            const workerCommunicator = sinon.createStubInstance(WorkerCommunicator);
            const contextMgr = sinon.createStubInstance(ContextMgr);
            const dataQ = new DataQ(DOMUtils, workerCommunicator, contextMgr, 'a', WorkerCommand.sendDataCommand, 10000);

            const sandbox = sinon.createSandbox();
            const flushAllMessages = sandbox.spy(dataQ, 'flushAllMessages');

            dataQ._onUnload();

            assert.isTrue(workerCommunicator.sendAsync.calledOnce);

            assert.isTrue(flushAllMessages.called);
            const sendAsyncArgs = workerCommunicator.sendAsync.getCall(0).args;
            assert.equal(sendAsyncArgs[0], WorkerCommand.sendDataCommand);
            assert.equal(sendAsyncArgs[1][0].eventName, 'flushData');
        });
    });
});
