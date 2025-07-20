import { assert } from 'chai';
import MessageProcessor from '../../../src/worker/MessageProcessor';
import DataDispatcher from '../../../src/worker/DataDispatcher';

describe('MessageProcessorSpec tests:', function () {
    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    describe('process:', function () {
        it('should send data to data aggregator', function () {
            const dataDispatcher = this.sandbox.createStubInstance(DataDispatcher);

            const msgFromMain1 = {
                eventName: 'key_events',
                data: [1, 2, 3],
            };

            const messageProcessor = new MessageProcessor(dataDispatcher);
            messageProcessor.process(msgFromMain1);

            assert.isTrue(dataDispatcher.add.calledOnce, 'add not called');
            assert.equal(dataDispatcher.add.firstCall.args[0], msgFromMain1);
            assert.isTrue(dataDispatcher.sendIfRequired.calledOnce, 'sendIfRequired not called');
            assert.equal(dataDispatcher.sendIfRequired.firstCall.args[0], false);
        });

        it('should flush data when a flushdata event is received', function () {
            const dataDispatcher = this.sandbox.createStubInstance(DataDispatcher);

            const msgFromMain1 = {
                eventName: 'flushData',
            };

            const messageProcessor = new MessageProcessor(dataDispatcher);
            messageProcessor.process(msgFromMain1);

            assert.isTrue(dataDispatcher.add.notCalled, 'add called');
            assert.isTrue(dataDispatcher.sendIfRequired.calledOnce, 'sendIfRequired not called');
            assert.equal(dataDispatcher.sendIfRequired.firstCall.args[0], true);
        });

        it('should flush data when a shouldFlush flag is marked true on the message which is received', function () {
            const dataDispatcher = this.sandbox.createStubInstance(DataDispatcher);

            const msgFromMain1 = {
                eventName: 'key_events',
                data: [1, 2, 3],
                shouldFlush: true,
            };

            const messageProcessor = new MessageProcessor(dataDispatcher);
            messageProcessor.process(msgFromMain1);

            assert.isTrue(dataDispatcher.add.called, 'add not called');
            assert.equal(dataDispatcher.add.firstCall.args[0], msgFromMain1);
            assert.isTrue(dataDispatcher.sendIfRequired.calledOnce, 'sendIfRequired not called');
            assert.equal(dataDispatcher.sendIfRequired.firstCall.args[0], true);
        });

        it('should throw error if empty message object is received', function () {
            const dataDispatcher = this.sandbox.createStubInstance(DataDispatcher);

            const msgFromMain1 = {};

            const messageProcessor = new MessageProcessor(dataDispatcher);
            assert.throw(() => {
                return messageProcessor.process(msgFromMain1);
            });

            assert.isTrue(dataDispatcher.sendIfRequired.notCalled, 'sendIfRequired called');
        });

        it('should throw error if a message is missing the eventName field', function () {
            const dataDispatcher = this.sandbox.createStubInstance(DataDispatcher);

            const msgFromMain1 = {
                data: { bb: 'data' },
            };

            const messageProcessor = new MessageProcessor(dataDispatcher);
            assert.throw(() => {
                return messageProcessor.process(msgFromMain1);
            });

            assert.isTrue(dataDispatcher.sendIfRequired.notCalled, 'sendIfRequired called');
        });

        it('should throw error if a message is missing the data field', function () {
            const dataDispatcher = this.sandbox.createStubInstance(DataDispatcher);

            const msgFromMain1 = {
                eventName: 'key_events',
            };

            const messageProcessor = new MessageProcessor(dataDispatcher);
            assert.throw(() => {
                return messageProcessor.process(msgFromMain1);
            });

            assert.isTrue(dataDispatcher.sendIfRequired.notCalled, 'sendIfRequired called');
        });
    });

    describe('SendLogCommand:', function () {
        it('should send log to log aggregator', function () {
            const logDataDispatcher = this.sandbox.createStubInstance(DataDispatcher);

            const logFromMain = {
                eventName: 'log',
                data: {
                    msg: 'dummy message', url: 'tests', level: 'info', sn: 0,
                },
            };

            const messageProcessor = new MessageProcessor(logDataDispatcher);
            messageProcessor.process(logFromMain);

            assert.isTrue(logDataDispatcher.add.calledOnce, 'add not called');
            assert.deepEqual(logDataDispatcher.add.firstCall.args[0], logFromMain);
            assert.isTrue(logDataDispatcher.sendIfRequired.calledOnce, 'sendIfRequired not called');
        });

        it('should throw error if empty message object is received', function () {
            const logDataDispatcher = this.sandbox.createStubInstance(DataDispatcher);

            const logFromMain = {};

            const messageProcessor = new MessageProcessor(logDataDispatcher);
            assert.throw(() => {
                return messageProcessor.process(logFromMain);
            });

            assert.isTrue(logDataDispatcher.add.notCalled, 'add called');
            assert.isTrue(logDataDispatcher.sendIfRequired.notCalled, 'sendIfRequired called');
        });

        it('should throw error if a message is missing the eventName field', function () {
            const logDataDispatcher = this.sandbox.createStubInstance(DataDispatcher);

            const logFromMain = {
                data: { a: 'ababa' },
            };

            const messageProcessor = new MessageProcessor(logDataDispatcher);
            assert.throw(() => {
                return messageProcessor.process(logFromMain);
            });

            assert.isTrue(logDataDispatcher.add.notCalled, 'add called');
            assert.isTrue(logDataDispatcher.sendIfRequired.notCalled, 'sendIfRequired called');
        });

        it('should throw error if a message is missing the data field', function () {
            const logDataDispatcher = this.sandbox.createStubInstance(DataDispatcher);

            const logFromMain = {
                eventName: 'lalalala',
            };

            const messageProcessor = new MessageProcessor(logDataDispatcher);
            assert.throw(() => {
                return messageProcessor.process(logFromMain);
            });

            assert.isTrue(logDataDispatcher.add.notCalled, 'add called');
            assert.isTrue(logDataDispatcher.sendIfRequired.notCalled, 'sendIfRequired called');
        });
    });
});
