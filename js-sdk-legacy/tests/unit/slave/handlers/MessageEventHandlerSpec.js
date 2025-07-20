import { assert } from 'chai';
import ConfigurationRepository from '../../../../src/main/core/configuration/ConfigurationRepository';
import SlaveBuffer from "../../../../src/slave/SlaveBuffer";
import MessageEventHandler from '../../../../src/slave/handlers/MessageEventHandler';
import { MasterSlaveMessage } from '../../../../src/slave/MasterSlaveMessage';
import { TestUtils } from '../../../TestUtils';
import { MockObjects } from '../../mocks/mockObjects';
import TestFeatureSupport from "../../../TestFeatureSupport";
import AcknowledgeMessageEventsHandler from "../../../../src/slave/handlers/AcknowledgeMessageEventsHandler";

describe('MessageEventHandler tests:', function () {
    function getWindowMsgMock(msgType, data, source) {
        return {
            data: { msgType, data },
            source: source || { postMessage: sinon.spy() },
            origin: 'myOrigin',
        };
    }

    let acknowledgeMessageEventsHandler = null;

    beforeEach(function () {
        if (TestFeatureSupport.isSpyNotSupported()) {
            this.skip();
            return;
        }

        this.sandbox = sinon.createSandbox();
        this.configurationRepositoryStub = this.sandbox.createStubInstance(ConfigurationRepository);
        this.configurationRepositoryStub.get.returns(1000);

        this.slaveBufferStub = this.sandbox.createStubInstance(SlaveBuffer);

        this.messageCallbackSpy = this.sandbox.spy();
        window.parent.addEventListener('message', this.messageCallbackSpy);

        this.eventAggregatorStub = this.sandbox.stub(MockObjects.eventAggregator);
        acknowledgeMessageEventsHandler = this.sandbox.createStubInstance(AcknowledgeMessageEventsHandler);

        this.messageEventHandler = new MessageEventHandler(this.configurationRepositoryStub, this.slaveBufferStub, this.eventAggregatorStub,acknowledgeMessageEventsHandler);
        this._handleChannelMessage = this.sandbox.spy(this.messageEventHandler, '_handleChannelMessage');
        this._handleWindowPostMessage = this.sandbox.spy(this.messageEventHandler, '_handleWindowPostMessage');
    });

    afterEach(function () {
        if(this.sandbox){
            this.sandbox.restore();
        }
        acknowledgeMessageEventsHandler = null;
        this.messageEventHandler = null;
        window.parent.removeEventListener('message', this.messageCallbackSpy);
    });

    describe('channel messages + buffer tests:', function () {

        it('should post and buffer message before handshake', async function () {
            this.messageEventHandler._isEnableAckMessageLogic = this.sandbox.stub();
            this.messageEventHandler._isEnableAckMessageLogic.returns(false);
            this.messageEventHandler._isHandshakeCompleted = true;
            const sendToChannel = this.sandbox.spy(this.messageEventHandler, '_sendToChannel');
            const msg = getWindowMsgMock('test1', 'testData').data;

            this.messageEventHandler.sendToParent(msg);

            await TestUtils.waitForNoAssertion(() => {
                const postedMessageCall = this.messageCallbackSpy.getCalls().filter((item) => {
                    return item.args[0].data && item.args[0].data.msgType === 'test1';
                });

                assert.exists(postedMessageCall, 'message was not posted.');
                assert.equal(postedMessageCall.length, 1, 'found unexpected calls to post message');
                assert.deepEqual(postedMessageCall[0].args[0].data, msg, 'message callback was called with invalid event');
                assert(sendToChannel.calledWith(msg), 'send to channel not called');
                assert.isFalse(this.messageEventHandler.portIsOpen(), 'port is opened so we do not add to buffer');
            });
        });

        it('should add message to slaveBuffer when configuration is true', async function () {
            this.messageEventHandler._isEnableAckMessageLogic = this.sandbox.stub();
            this.messageEventHandler._isEnableAckMessageLogic.returns(true);
            this.messageEventHandler.portIsOpen = this.sandbox.stub();
            this.messageEventHandler.portIsOpen.returns(true);
            this.messageEventHandler._slaveBuffer.addToBuffer = this.sandbox.spy();
            const sendToChannel = this.sandbox.spy(this.messageEventHandler, '_sendToChannel');
            const msg = getWindowMsgMock('test1', 'testData').data;

            this.messageEventHandler.sendToParent(msg);

            assert.isTrue(sendToChannel.called, 'send to channel was not called');
            assert.isTrue(this.messageEventHandler._slaveBuffer.addToBuffer.called, "addToBuffer was not called");

        });

        it('should stop and clear buffering after handshake timeout', async function () {
            const msg = getWindowMsgMock('test', 'testData').data;

            this.messageEventHandler.sendToParent(msg);
            this.messageEventHandler.sendToParent(msg);

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this.messageCallbackSpy.calledTwice, `message callback was not called twice. It was called ${this.messageCallbackSpy.callCount} times.`);
                assert.isFalse(this.messageEventHandler.portIsOpen(), 'port is opened so we do not add to buffer');
            });

            this.configurationRepositoryStub.get.returns(100);
            this.messageEventHandler.subscribeToMessageEvents(() => {
            }, () => {
            });

            this.messageEventHandler.sendToParent(msg);

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this.messageCallbackSpy.calledThrice, `message callback was not called thrice. It was called ${this.messageCallbackSpy.callCount} times.`);
                assert.isFalse(this.messageEventHandler.portIsOpen(), 'port is opened so we do not add to buffer');
            });
        });


        it('should perform handshake process successfully', async function () {
            const msg = getWindowMsgMock('test', 'testData').data;

            const postChannel = this.sandbox.spy(this.messageEventHandler, '_postMessageToChannel');

            this.messageEventHandler.subscribeToMessageEvents(() => {
            }, () => {
            });

            this.messageEventHandler.sendToParent(msg);

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this.messageCallbackSpy.calledOnce, `message callback was not called once. It was called ${this.messageCallbackSpy.callCount} times.`);
                assert.deepEqual(this.messageCallbackSpy.firstCall.args[0].data, msg, 'message callback was called with invalid event');

                // if passed, if port is false so port is not opened and we added to buffer
                assert.isFalse(this.messageEventHandler.portIsOpen(), 'port is opened so we do not add to buffer');
            });

            const handShakeMsgEvent = getWindowMsgMock('test', MasterSlaveMessage.cdHandShake).data;
            handShakeMsgEvent.ports = [{
                postMessage: () => {
                },
            }];

            const onMsgCb = this.eventAggregatorStub.addEventListener.getCall(0).args[2];
            onMsgCb(handShakeMsgEvent);

            assert.isTrue(this._handleChannelMessage.calledOnce, 'handle channel message not called');
            assert.isTrue(postChannel.calledThrice, 'not posted register and handshake messages');
            assert.isTrue(postChannel.calledWith(this.sandbox.match({ msgType: MasterSlaveMessage.slaveHandShake })), 'post slaveHandshake message not called');
            assert.isTrue(postChannel.calledWith(this.sandbox.match({ msgType: MasterSlaveMessage.registerSlave })), 'post registerSlave message not called');
            assert.isTrue(postChannel.calledWith(this.sandbox.match({ msgType: MasterSlaveMessage.slaveAlive })), 'post slaveAlive message not called');

            this.messageEventHandler._channelPort.onmessage({
                ports: [],
                data: JSON.stringify({ msgType: MasterSlaveMessage.updateSlaveConf }),
            });

        });

        it('should handle ios handshake message', async function () {
            const msg = getWindowMsgMock('test', 'testData').data;

            this.messageEventHandler.subscribeToMessageEvents(() => {
            }, () => {
            });

            this.messageEventHandler.sendToParent(msg);

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this.messageCallbackSpy.calledOnce, `message callback was not called once. It was called ${this.messageCallbackSpy.callCount} times.`);
                assert.deepEqual(this.messageCallbackSpy.firstCall.args[0].data, msg, 'message callback was called with invalid event');

                // if passed, if port is false so port is not opened and we added to buffer
                assert.isFalse(this.messageEventHandler.portIsOpen(), 'port is opened so we do not add to buffer');
            });

            const handShakeMsgEvent = getWindowMsgMock(MasterSlaveMessage.iosHandshake, MasterSlaveMessage.cdHandShake);
            handShakeMsgEvent.data.isNative = true;

            const onMsgCb = this.eventAggregatorStub.addEventListener.getCall(0).args[2];
            onMsgCb(handShakeMsgEvent);

            assert.isTrue(this._handleWindowPostMessage.calledOnce, 'handle window post message not called');

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this.messageCallbackSpy.calledOnce, `message callback was not called once. It was called ${this.messageCallbackSpy.callCount} times.`);
                assert.deepEqual(this.messageCallbackSpy.firstCall.args[0].data, msg, 'slaveHandshake message not called');
            });
        });

        it('should post to parent buffered messages on update conf message', async function () {
            const msg = getWindowMsgMock('test', 'testData').data;

            this.messageEventHandler.subscribeToMessageEvents(() => {
            }, () => {
            });

            this.messageEventHandler.sendToParent(msg);

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this.messageCallbackSpy.calledOnce, `message callback was not called once. It was called ${this.messageCallbackSpy.callCount} times.`);
                assert.deepEqual(this.messageCallbackSpy.firstCall.args[0].data, msg, 'message callback was called with invalid event');

                // if passed, if port is false so port is not opened and we added to buffer
                assert.isFalse(this.messageEventHandler.portIsOpen(), 'port is opened so we do not add to buffer');
            });

            const updateConfMsgEvent = getWindowMsgMock(MasterSlaveMessage.updateSlaveConf, {});
            updateConfMsgEvent.data.isNative = true;

            const onMsgCb = this.eventAggregatorStub.addEventListener.getCall(0).args[2];
            onMsgCb(updateConfMsgEvent);

            // _handleWindowPostMessage is calling postBufferedMessagesToParent
            assert.isTrue(this._handleWindowPostMessage.calledOnce, 'handle window post message not called');

            await TestUtils.waitForNoAssertion(() => {

                // if passed, if port is false so port is not opened and we added to buffer
                assert.isFalse(this.messageEventHandler.portIsOpen(), 'port is opened so we do not add to buffer');
            });
        });

        it('should NOT post to parent buffered messages on wrong update conf message', async function () {
            const msg = getWindowMsgMock('test', 'testData').data;

            this.messageEventHandler.subscribeToMessageEvents(() => {
            }, () => {
            });

            this.messageEventHandler.sendToParent(msg);

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this.messageCallbackSpy.calledOnce, `message callback was not called once. It was called ${this.messageCallbackSpy.callCount} times.`);
                assert.deepEqual(this.messageCallbackSpy.firstCall.args[0].data, msg, 'message callback was called with invalid event');

                // if passed, if port is false so port is not opened and we added to buffer
                assert.isFalse(this.messageEventHandler.portIsOpen(), 'port is opened so we do not add to buffer');
            });

            const updateConfMsgEvent = getWindowMsgMock(MasterSlaveMessage.updateSlaveConf, {});

            const onMsgCb = this.eventAggregatorStub.addEventListener.getCall(0).args[2];
            onMsgCb(updateConfMsgEvent);

            assert.isTrue(this._handleWindowPostMessage.calledOnce, 'handle window post message not called');

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this.messageCallbackSpy.calledOnce, 'message callback was not called once');
            });
        });

        it('should send message to channel on beforeunload', function () {
            const sendToChannel = this.sandbox.spy(this.messageEventHandler, '_sendToChannel');

            this.messageEventHandler.subscribeToMessageEvents(() => {
            }, () => {
            });

            const onBeforeUnload = this.eventAggregatorStub.addEventListener.getCall(1).args[2];
            onBeforeUnload();

            assert(sendToChannel.calledWith(this.sandbox.match({ msgType: MasterSlaveMessage.onBeforeUnload })));

            // if passed, if port is false so port is not opened and we added to buffer
            assert.isFalse(this.messageEventHandler.portIsOpen(), 'port is opened so we do not add to buffer');
        });


        it('should send messages to channel if exist on beforeunload', function () {
            this.messageEventHandler._postMessageToChannel = this.sandbox.spy();
            this.messageEventHandler._acknowledgeMessageEventsHandler.handleBeforeUnloadEvent = this.sandbox.spy();

            this.messageEventHandler.subscribeToMessageEvents(() => {
            }, () => {
            });

            const onBeforeUnload = this.eventAggregatorStub.addEventListener.getCall(1).args[2];
            onBeforeUnload();

            //if passed, if port is false so port is not opened and we added to buffer
            assert.isTrue(this.messageEventHandler._acknowledgeMessageEventsHandler.handleBeforeUnloadEvent.calledOnce, 'called more than once');

        });

        it('should handle ack message from the channel', function(){
            this.messageEventHandler._postMessageToChannel = this.sandbox.spy();
            this.messageEventHandler._acknowledgeMessageEventsHandler.removeAcknowledgedMessage = this.sandbox.spy();
            const msg = {msgType: 'channelMessageIdAck',msgId:1234};
            const data = JSON.stringify(msg);
            const event = {
                ports: ['postMessage'],
                data: data
            };

            const channelEventHandler = this.messageEventHandler._portMessageHandler(this.messageEventHandler._postMessageToChannel);
            channelEventHandler(event);

            assert.isTrue(this.messageEventHandler._acknowledgeMessageEventsHandler.removeAcknowledgedMessage.calledOnce, 'removeAcknowledgedMessage called more than once');
        });

        it("should set isChannelSupportsAckMessageLogic to true", function(){
            this.messageEventHandler._postMessageToChannel = this.sandbox.spy();
            this.messageEventHandler._configurationRepository.set= this.sandbox.spy();
            const msg = {msgType: 'isChannelSupportsAckMessageLogic'};
            const data = JSON.stringify(msg);
            const event = {
                ports: ['postMessage'],
                data: data
            };

            const channelEventHandler = this.messageEventHandler._portMessageHandler(this.messageEventHandler._postMessageToChannel);
            channelEventHandler(event);

            const args = this.messageEventHandler._configurationRepository.set.firstCall.args;

            assert.isTrue(args[1], "was not true");
            assert.equal(args[0], msg.msgType, "was not equal");
            assert.isTrue(this.messageEventHandler._configurationRepository.set.calledOnce, 'called more than once');

        });

        it(" should not clear buffer on updateSlaveConf message", function () {
            this.messageEventHandler._isEnableAckMessageLogic = this.sandbox.stub();
            this.messageEventHandler._isEnableAckMessageLogic.returns(true);
            this.messageEventHandler._acknowledgeMessageEventsHandler.enableAcknowledgeMessageEvents = this.sandbox.spy();
            this.messageEventHandler._slaveBuffer.sendBufferedMessagesToChannel = this.sandbox.spy();
            this.messageEventHandler._postMessageToChannel = this.sandbox.spy();
            this.messageEventHandler._configurationRepository.set= this.sandbox.spy();
            const msg = {msgType: MasterSlaveMessage.updateSlaveConf};
            const data = JSON.stringify(msg);
            const event = {
                ports: ['postMessage'],
                data: data
            };

            const channelEventHandler = this.messageEventHandler._portMessageHandler(this.messageEventHandler._postMessageToChannel);
            channelEventHandler(event);

            assert.isTrue(this.messageEventHandler._acknowledgeMessageEventsHandler.enableAcknowledgeMessageEvents.called, "enableAcknowledgeMessageEvents was not called");
            assert.isTrue(this.messageEventHandler._slaveBuffer.sendBufferedMessagesToChannel.notCalled, "sendBufferedMessagesToChannel was called");
        })

    });

    describe('post messages tests:', function () {
        it('should handle message with different window origin', function () {
            const postMessageCallback = this.sandbox.spy();
            const msg = getWindowMsgMock('test', {}, 'bla');
            this.messageEventHandler.subscribeToMessageEvents(() => {
            }, postMessageCallback);
            const onMsgCb = this.eventAggregatorStub.addEventListener.getCall(0).args[2];
            onMsgCb(msg);
            assert.isTrue(this._handleWindowPostMessage.calledOnce, 'handle window post message not called');
            assert.isTrue(postMessageCallback.calledOnce, 'post message callback not called');
            assert(postMessageCallback.calledWith(msg, 'test'), 'post message callback called with wrong arg');
        });

        it('should handle native message', function () {
            const postMessageCallback = this.sandbox.spy();
            const msg = getWindowMsgMock('test', {}, window);
            msg.data.isNative = true;
            this.messageEventHandler.subscribeToMessageEvents(() => {
            }, postMessageCallback);
            const onMsgCb = this.eventAggregatorStub.addEventListener.getCall(0).args[2];
            onMsgCb(msg);

            assert.isTrue(this._handleWindowPostMessage.calledOnce, 'handle window post message not called');
            assert.isTrue(postMessageCallback.calledOnce, 'post message callback not called');
            assert(postMessageCallback.calledWith(msg, 'test'), 'post message callback called with wrong arg');
        });

        it('should not handle messages with same window origin', function () {
            const postMessageCallback = this.sandbox.spy();
            const msg = getWindowMsgMock('test', {}, window);
            this.messageEventHandler.subscribeToMessageEvents(() => {
            }, postMessageCallback);
            const onMsgCb = this.eventAggregatorStub.addEventListener.getCall(0).args[2];
            onMsgCb(msg);

            assert.isTrue(this._handleWindowPostMessage.calledOnce, 'handle window post message not called');
            assert.isTrue(postMessageCallback.notCalled, 'post message call back');
        });
    });

    describe("configuration testing: ", function(){
        it("should return false", function(){
            this.messageEventHandler._isRecivedIsChannelSupportsAckMessage = false;
            const result = this.messageEventHandler._isEnableAckMessageLogic();
            assert.isFalse(result, "_isEnableAckMessageLogic returned true");
        });

        it("should return false", function () {
            this.messageEventHandler._isRecivedIsChannelSupportsAckMessage = true;
            this.configurationRepositoryStub.get.returns(false);
            const result = this.messageEventHandler._isEnableAckMessageLogic();
            assert.isFalse(result, "_isEnableAckMessageLogic returned true");
        });

        it("should return true", function () {
            this.messageEventHandler._isRecivedIsChannelSupportsAckMessage = true;
            this.configurationRepositoryStub.get.returns(true);
            const result = this.messageEventHandler._isEnableAckMessageLogic();
            assert.isTrue(result, "_isEnableAckMessageLogic returned true");
        });
    });

});
