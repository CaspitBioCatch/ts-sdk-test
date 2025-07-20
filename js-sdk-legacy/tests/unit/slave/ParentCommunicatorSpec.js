import MessageEventHandler from '../../../src/slave/handlers/MessageEventHandler';
import ParentCommunicator from '../../../src/slave/ParentCommunicator';
import { MasterSlaveMessage } from '../../../src/slave/MasterSlaveMessage';
import { SIDChangeType } from '../../../src/main/core/session/SIDChangeType';
import TestFeatureSupport from "../../TestFeatureSupport";

describe('ParentCommunicator tests:', function () {
    const assert = chai.assert;

    function getWindowMsgMock(msgType, data, source) {
        return {
            data: { msgType, data },
            source: source || { postMessage: sinon.spy() },
            origin: 'myOrigin',
        };
    }

    beforeEach(function () {
        if (TestFeatureSupport.isSpyNotSupported()) {
            this.skip();
            return;
        }

        this.sandbox = sinon.createSandbox();
        this.messageEventHandler = this.sandbox.stub(new MessageEventHandler());
        this.sendToParent = this.messageEventHandler.sendToParent;
    });

    afterEach(function () {
        if (this.sandbox) {
            this.sandbox.restore();
        }
    });

    describe('Message passing tests:', function () {
        it('do not handle messages with same window origin', function () {
            const pc = new ParentCommunicator(this.messageEventHandler);

            pc.registerToParent();

            assert(this.sendToParent.calledWith({ msgType: MasterSlaveMessage.registerSlave }), 'registerToParent did not send registerSlave message');

            assert.equal(pc._slaves.length, 0, 'the slaves contains elements');

            assert(this.sendToParent.calledOnce, 'the parent.postMessage was not called twice');
        });

        it('handle messages that contain isNative tag', function () {
            const pc = new ParentCommunicator(this.messageEventHandler);

            // mock getting a registerSlave msg
            const registerSlaveMsg = getWindowMsgMock(MasterSlaveMessage.registerSlave, {});

            pc.registerToParent();

            assert(this.sendToParent.calledWith({ msgType: MasterSlaveMessage.registerSlave }), 'registerToParent did not send registerSlave message');

            const messageEventCallback = pc._getWindowMessageCallback();
            messageEventCallback(registerSlaveMsg, registerSlaveMsg.data.msgType);

            assert.equal(pc._slaves.length, 1, 'the slaves contains more than one slave');
            const registeredSlave = pc._slaves[0];
            assert.equal(registeredSlave.origin, registerSlaveMsg.origin, 'the origin does not match');
            assert.equal(registeredSlave.source, registerSlaveMsg.source, 'the source does not match');

            assert(this.sendToParent.calledTwice, 'the parent.postMessage was not called twice');
        });

        it('registerSlave msg is being passed to parent and the slave is added to the slave list', function () {
            const pc = new ParentCommunicator(this.messageEventHandler);

            // mock getting a registerSlave msg
            const registerSlaveMsg = getWindowMsgMock(MasterSlaveMessage.registerSlave);

            pc.registerToParent();

            const messageEventCallback = pc._getWindowMessageCallback();
            messageEventCallback(registerSlaveMsg, registerSlaveMsg.data.msgType);

            assert(this.sendToParent.calledWith({ msgType: MasterSlaveMessage.registerSlave }), 'registerToParent did not send registerSlave message');

            assert.equal(pc._slaves.length, 1, 'the slaves contains more than one slave');
            const registeredSlave = pc._slaves[0];
            assert.equal(registeredSlave.origin, registerSlaveMsg.origin, 'the origin does not match');
            assert.equal(registeredSlave.source, registerSlaveMsg.source, 'the source does not match');

            assert(this.sendToParent.calledTwice, 'the parent.postMessage was not called twice');
        });

        it('dataFromSlave msg is passed to parent', function () {
            const pc = new ParentCommunicator(this.messageEventHandler);

            pc.registerToParent();

            // get the addEventListener callback for using it to send messages

            const dataFromSlaveMsg = getWindowMsgMock(MasterSlaveMessage.dataFromSlave, [1, 2, 3, 4]);
            this.sendToParent.resetHistory();// to reset the call number from the registration

            // simulated getting messages
            const messageEventCallback = pc._getWindowMessageCallback();
            messageEventCallback(dataFromSlaveMsg, dataFromSlaveMsg.data.msgType);
            messageEventCallback(dataFromSlaveMsg, dataFromSlaveMsg.data.msgType);

            assert(this.sendToParent.calledTwice, 'parent.postMessage was not called twice');
            assert(this.sendToParent.calledWith(dataFromSlaveMsg.data), 'dataFromSlave was not passed to parent');
        });

        it('updateSlaveConf msg is passed to all slaves and is calling subscribers that are registered on it', function () {
            const pc = new ParentCommunicator(this.messageEventHandler);

            pc.registerToParent();

            const registerFirstSlaveMsg = getWindowMsgMock(MasterSlaveMessage.registerSlave);
            registerFirstSlaveMsg.origin = 'firstSlave';

            const registerSecondSlaveMsg = getWindowMsgMock(MasterSlaveMessage.registerSlave);
            registerSecondSlaveMsg.origin = 'secondSlave';

            // register both slaves
            const messageEventCallback = pc._getWindowMessageCallback();
            messageEventCallback(registerFirstSlaveMsg, registerFirstSlaveMsg.data.msgType);
            messageEventCallback(registerSecondSlaveMsg, registerSecondSlaveMsg.data.msgType);

            // register to config messages using the WorkerCommunicator api
            const configSubscriber1 = this.sandbox.spy();
            const configSubscriber2 = this.sandbox.spy();
            pc.addMessageListener(MasterSlaveMessage.updateSlaveConf, configSubscriber1);
            pc.addMessageListener(MasterSlaveMessage.updateSlaveConf, configSubscriber2);

            const updateSlaveConfMsg = getWindowMsgMock(MasterSlaveMessage.updateSlaveConf, { a: 'a', b: 'b' });
            this.sendToParent.resetHistory();// to reset the call number from the registrations

            // simulated getting message
            messageEventCallback(updateSlaveConfMsg, updateSlaveConfMsg.data.msgType);

            assert(registerFirstSlaveMsg.source.postMessage.calledWith(updateSlaveConfMsg.data, registerFirstSlaveMsg.origin), 'first slave did not got config');
            assert(registerSecondSlaveMsg.source.postMessage.calledWith(updateSlaveConfMsg.data, registerSecondSlaveMsg.origin), 'second slave did not got config');
            assert(configSubscriber1.calledWith(updateSlaveConfMsg.data.data), 'subscriber 1 was not called with relevant data');
            assert(configSubscriber2.calledWith(updateSlaveConfMsg.data.data), 'subscriber 2 was not called with relevant data');
        });

        it('updateMasterContext msg is sent to parent', function () {
            const pc = new ParentCommunicator(this.messageEventHandler);

            pc.registerToParent();

            const updateMasterContextMsg = getWindowMsgMock(MasterSlaveMessage.updateMasterContext, {
                name: 'myCtx',
                contextId: 1,
            });
            this.sendToParent.resetHistory();// to reset the call number from the registration

            // simulated getting messages
            const messageEventCallback = pc._getWindowMessageCallback();
            messageEventCallback(updateMasterContextMsg, updateMasterContextMsg.data.msgType);

            assert(this.sendToParent.calledWith(updateMasterContextMsg.data), 'parent.postMessage was not called with the updateMasterContextMsg.data');
        });

        it('resetSession msg is sent to parent', function () {
            const pc = new ParentCommunicator(this.messageEventHandler);

            pc.registerToParent();

            const resetSessionFromSlaveMsg = getWindowMsgMock(MasterSlaveMessage.resetSessionTriggerFromSlave, { resetReason: SIDChangeType.configurationFromSlave }).data;
            this.sendToParent.resetHistory();// to reset the call number from the registration

            // simulated getting messages
            const messageEventCallback = pc._getWindowMessageCallback();
            messageEventCallback(resetSessionFromSlaveMsg, resetSessionFromSlaveMsg.msgType);

            assert(this.sendToParent.calledWith(resetSessionFromSlaveMsg.data), 'parent.postMessage was not called with the resetSessionMsg.data');
        });

        it('updateSlaveState msg is passed to all slaves and is calling subscribers that are registered on it', function () {
            const pc = new ParentCommunicator(this.messageEventHandler);

            pc.registerToParent();

            const registerFirstSlaveMsg = getWindowMsgMock(MasterSlaveMessage.registerSlave);
            registerFirstSlaveMsg.origin = 'firstSlave';

            const registerSecondSlaveMsg = getWindowMsgMock(MasterSlaveMessage.registerSlave);
            registerSecondSlaveMsg.origin = 'secondSlave';

            // register both slaves
            const messageEventCallback = pc._getWindowMessageCallback();
            messageEventCallback(registerFirstSlaveMsg, registerFirstSlaveMsg.data.msgType);
            messageEventCallback(registerSecondSlaveMsg, registerSecondSlaveMsg.data.msgType);

            // register to state change messages using the WorkerCommunicator api
            const stateSubscriber1 = this.sandbox.spy();
            const stateSubscriber2 = this.sandbox.spy();
            pc.addMessageListener(MasterSlaveMessage.updateSlaveState, stateSubscriber1);
            pc.addMessageListener(MasterSlaveMessage.updateSlaveState, stateSubscriber2);

            const updateSlaveStateMsg = getWindowMsgMock(MasterSlaveMessage.updateSlaveState, { toState: 'pause' });
            this.sendToParent.resetHistory();// to reset the call number from the registrations

            // simulated getting message
            messageEventCallback(updateSlaveStateMsg, updateSlaveStateMsg.data.msgType);

            assert(registerFirstSlaveMsg.source.postMessage.calledWith(updateSlaveStateMsg.data, registerFirstSlaveMsg.origin), 'first slave did not get state change');
            assert(registerSecondSlaveMsg.source.postMessage.calledWith(updateSlaveStateMsg.data, registerSecondSlaveMsg.origin), 'second slave did not state change');
            assert(stateSubscriber1.calledWith(updateSlaveStateMsg.data.data), 'subscriber 1 was not called with relevant data');
            assert(stateSubscriber2.calledWith(updateSlaveStateMsg.data.data), 'subscriber 2 was not called with relevant data');
        });

        it('unknown message is not sent and not throw exception', function () {
            const pc = new ParentCommunicator(this.messageEventHandler);

            pc.registerToParent();

            const unknownMsg = getWindowMsgMock('blabla');
            this.sendToParent.resetHistory();// to reset the call number from the registration

            // simulated getting messages
            const messageEventCallback = pc._getWindowMessageCallback();
            messageEventCallback(unknownMsg, unknownMsg.data.msgType);

            assert(this.sendToParent.notCalled, 'parent.postMessage was called although it should not');
        });
    });

    describe('onContextChange: ', function () {
        context('when context is slave_cd_auto:', function () {
            it('should not send updateMasterContext message', function () {
                const pc = new ParentCommunicator(this.messageEventHandler);

                pc.registerToParent();

                this.sendToParent.resetHistory();// to reset the call number from the registration

                // simulated context change
                const contextData = { name: 'slave_cd_auto' };
                pc.notifyContextChange(contextData);

                assert(this.sendToParent.notCalled, 'parent.postMessage was called although it should not');
            });
        });
        context('when context is different from slave_cd_auto', function () {
            it('should send updateMasterContext message', function () {
                const pc = new ParentCommunicator(this.messageEventHandler);

                pc.registerToParent();

                this.sendToParent.resetHistory();// to reset the call number from the registration

                // simulated context change
                const contextData = { name: 'myContext' };
                pc.notifyContextChange(contextData);

                assert(this.sendToParent.calledWith({
                    msgType: MasterSlaveMessage.updateMasterContext,
                    data: contextData,
                }), 'parent.postMessage was not called');
            });
        });
    });

    describe('NotifyResetSession: ', function () {
        context('when reset reason is config:', function () {
            it('should send resetSession message', function () {
                const pc = new ParentCommunicator(this.messageEventHandler);

                pc.registerToParent();

                this.sendToParent.resetHistory();// to reset the call number from the registration

                // simulated reset session
                const resetReason = { resetReason: SIDChangeType.configurationFromSlave };
                pc.notifyResetSession(resetReason);

                assert(this.sendToParent.calledWith({
                    msgType: MasterSlaveMessage.resetSessionTriggerFromSlave,
                    data: resetReason,
                }), 'parent.postMessage was not called');
            });
        });
    });
});
