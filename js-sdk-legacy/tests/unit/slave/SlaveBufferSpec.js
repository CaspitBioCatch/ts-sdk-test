import { assert } from 'chai';
import SlaveBuffer from '../../../src/slave/SlaveBuffer';
import TestFeatureSupport from "../../TestFeatureSupport";
import {MockObjects} from "../mocks/mockObjects";
import {TestUtils} from "../../TestUtils";
import Log from "../../../src/main/technicalServices/log/Logger";
import ConfigurationRepository from "../../../src/main/core/configuration/ConfigurationRepository";

describe('SlaveBuffer tests:', function () {

    function getWindowMsgMock(msgType, data, source) {
        return {
            data: { msgType, data },
            source: source || { postMessage: sinon.spy() },
            origin: 'myOrigin',
        };
    }

    let configurationRepository = null;
    let cdUtils = null;


    beforeEach( function () {
        if (TestFeatureSupport.isSpyNotSupported()) {
            this.skip();
            return;
        }
        this.sandbox = sinon.createSandbox();
        cdUtils = MockObjects.cdUtils;
        configurationRepository = this.sandbox.createStubInstance(ConfigurationRepository);
        this.slaveBuffer = new SlaveBuffer(configurationRepository, cdUtils);

        // because in each test a clearBuffer is called which makes the enableBuffering to false
        // but we want to have the enableBuffering as true for next test
        //
        // also in case the clearbuffer was not called because a unit test was failing in the middle
        // then we still want to clearbuffer for the next unit test
        // but since we are spying the clearbuffer function then we will clear it manually
        // so we avoid the confusion of clearbuffer calls
        this.slaveBuffer._preHandshakeBuffer = [];
        this.slaveBuffer._enableBuffering = true;
    });

    afterEach(function(){
        if(this.sandbox){
            this.sandbox.restore();
        }
        configurationRepository = null;
        cdUtils = null;
    });

    describe('basic buffer functions tests:', function () {

        it('messages are added successfully to the buffer and cleared successfully', function () {

            const numberOfMessages = 10;
            // added messages to buffer
            const msg = getWindowMsgMock('test', 'testData').data;
            for (let i = 0; i < numberOfMessages; i++) {
                this.slaveBuffer.addToBuffer(msg);
            }

            // verify that the messages added successfully to buffer
            assert.isTrue(this.slaveBuffer._enableBuffering, 'buffering is disabled, should be enabled by default');
            assert.equal(this.slaveBuffer._preHandshakeBuffer.length, numberOfMessages, 'buffer size is wrong');

            this.slaveBuffer.clearBuffer();

            // verify that the buffer was cleared successfully
            assert.isFalse(this.slaveBuffer._enableBuffering, 'buffering is still enabled');
            assert.equal(this.slaveBuffer._preHandshakeBuffer.length, 0, 'buffer still exists and was not cleared');
        });

        it('should not clear the buffer when acknowledgeMessageEventsHandler is enabled', function(){
            const numberOfMessages = 10;
            this.slaveBuffer._configurationRepository.get = this.sandbox.stub();
            this.slaveBuffer._configurationRepository.get.returns(true);

            const msg = getWindowMsgMock('test', 'testData').data;
            for (let i = 0; i < numberOfMessages; i++) {
                this.slaveBuffer.addToBuffer(msg);
            }

            // verify that the messages added successfully to buffer
            assert.isTrue(this.slaveBuffer._enableBuffering, 'buffering is disabled, should be enabled by default');
            assert.equal(this.slaveBuffer._preHandshakeBuffer.length, numberOfMessages, 'buffer size is wrong');

            this.slaveBuffer.clearBuffer();
            assert.notEqual(this.slaveBuffer._preHandshakeBuffer.length, numberOfMessages, 'buffer still exists and was not cleared');
        })
    });

    describe('sending messages from the buffer tests:', function () {

        it('buffer messages are sent successfully to channel and buffer is cleared',async function () {

            const numberOfMessages = 3;

            // add messages to buffer
            const msg = getWindowMsgMock('test', 'testData').data;
            for (let i = 0; i < numberOfMessages; i++) {
                this.slaveBuffer.addToBuffer(msg);
            }

            // send all buffer's messages to channel
            this.postMessageToChannelSpy = this.sandbox.spy();
            const clearBufferSpy = this.sandbox.spy(this.slaveBuffer, "clearBuffer");

            this.slaveBuffer.sendBufferedMessagesToChannel(this.postMessageToChannelSpy);

            // spy the postMessageToChannel, should be called when buffer was sent
            assert.equal(this.postMessageToChannelSpy.callCount, numberOfMessages, `postMessage was not called ${numberOfMessages}. It was called ${this.postMessageToChannelSpy.callCount} times.`);
            assert.isTrue(this.postMessageToChannelSpy.calledWith(msg), `postMessage was not called.`);

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(clearBufferSpy.called, "clear buffer was not called");
                // verify buffer is cleared and disabled
                assert.isFalse(this.slaveBuffer._enableBuffering, 'buffering is still enabled');
                assert.equal(this.slaveBuffer._preHandshakeBuffer.length, 0, 'buffer still exists and was not cleared');
            })

        });

        it('buffer messages are sent successfully to parent window and buffer is cleared', function () {
            this.slaveBuffer._configurationRepository.get = this.sandbox.stub();
            this.slaveBuffer._configurationRepository.get.returns(false);
            const clearBufferSpy = this.sandbox.spy(this.slaveBuffer, "clearBuffer");

            const numberOfMessages = 3;

            // add messages to buffer
            const msg = getWindowMsgMock('test', 'testData').data;
            for (let i = 0; i < numberOfMessages; i++) {
                this.slaveBuffer.addToBuffer(msg);
            }

            // send all buffer's messages to parent window
            const postMessageSpy = this.sandbox.spy(window.parent, 'postMessage');
            this.slaveBuffer.postBufferedMessagesToParent();

            // spy the postMessage, should be called when buffer was sent
            assert.equal(postMessageSpy.callCount, numberOfMessages, `postMessage was not called ${numberOfMessages}. It was called ${postMessageSpy.callCount} times.`);
            assert.isTrue(postMessageSpy.calledWith(msg), `postMessage was not called.`);

            // spy the clearbuffer, should be called once buffer was sent
            assert.isTrue(clearBufferSpy.calledOnce, 'clearBuffer was not called after buffer was sent');

            // verify buffer is cleared and disabled
            assert.isFalse(this.slaveBuffer._enableBuffering, 'buffering is still enabled');
            assert.equal(this.slaveBuffer._preHandshakeBuffer.length, 0, 'buffer still exists and was not cleared');
        });
    });

    describe('Pre handshake buffer feature', function(){
        let msg =  null;

        let postMessageCallback = null;
        let configurationRepository = null;
        const cdUtils = MockObjects.cdUtils;

        beforeEach(function(){
            configurationRepository = this.sandbox.createStubInstance(ConfigurationRepository);
            this.slaveBuffer = new SlaveBuffer(configurationRepository,cdUtils);
            msg = getWindowMsgMock('test','testData').data;
            postMessageCallback = this.sandbox.spy();
        });

        afterEach(function(){
            if(this.sandbox){
                this.sandbox.restore();
            }
            msg = null;
            postMessageCallback = null;
        });

        it('should call addAckIdToEvent + have msgId attribute when feature enabled', async function(){
            this.slaveBuffer._configurationRepository.get = this.sandbox.stub();
            this.slaveBuffer._configurationRepository.get.returns(true);
            this.slaveBuffer._addAckIdToEvent = this.sandbox.spy();
            this.slaveBuffer._addAckIdToEvent = this.sandbox.stub();
            const msgId = '1234';
            msg.msgId = msgId;

            this.slaveBuffer._addAckIdToEvent.returns({msgId:msgId,msg});

            this.slaveBuffer.addToBuffer(msg);

            assert.isTrue(this.slaveBuffer._addAckIdToEvent.calledWith(msg), 'addAckIdToEvent was not called');
            assert.isTrue(this.slaveBuffer._addAckIdToEvent.calledOnce, 'addAckIdToEvent was called more than once');
            assert.exists(this.slaveBuffer._preHandshakeBuffer[0].msgId, 'messageId attribute does not exist in array');
            assert.exists(this.slaveBuffer._preHandshakeBuffer[0].msg.msgId, 'messageId attribute does not exist in array');

        });

        it('should add ack id to message',async function(){
            const cdUtils =  MockObjects.cdUtils;
            cdUtils.generateUUID = this.sandbox.stub();
            cdUtils.generateUUID.returns('1234');
            const slaveBuffer = new SlaveBuffer(configurationRepository, cdUtils);
            slaveBuffer._preHandshakeBuffer = [];

            const returnedMessage = slaveBuffer._addAckIdToEvent(msg);

            await TestUtils.waitForNoAssertion(() =>{
                assert.isTrue(cdUtils.generateUUID.calledOnce, 'generateUUID was called more than once');
                assert.isTrue(msg.hasOwnProperty('msgId'),'_preHandshakeBuffer does not have msgId property');
                const parsedMessage =JSON.parse(msg.msgId)
                assert.equal(parsedMessage,'1234', 'id is not equal to 1234');
                assert.exists(returnedMessage.msgId, 'does not have msgId property');
                assert.exists(returnedMessage.msg, 'does not have msg property');
            });
        });

        it('should send ack messages to channel', function(){
            const numberOfMessages = 3;
            const cdUtils =  MockObjects.cdUtils;

            for (let i = 0; i < numberOfMessages; i++) {
                const msg = getWindowMsgMock('dataFromSlave', {eventName:'elements',data:['test',cdUtils.generateUUID()]}).data;
                this.slaveBuffer._preHandshakeBuffer.push(msg);
            }

            assert.equal(this.slaveBuffer._preHandshakeBuffer.length, 3, 'buffer length is not equal to 3');

            this.slaveBuffer.sendBufferedAckMessagesToChannel(postMessageCallback);

            assert.equal(postMessageCallback.callCount,3,`expected for 3 messages to be sent but only ${postMessageCallback.callCount}`);
        });

        it('should handle the ack message received from channel', function(){
            const cdUtils =  MockObjects.cdUtils;
            this.slaveBuffer._removeMessageIdFromBuffer = this.sandbox.spy();
            const logSpy = this.sandbox.spy(Log, 'info');
            const msgId = 123456;

            this.slaveBuffer._preHandshakeBuffer.push(getWindowMsgMock('dataFromSlave', {eventName:'elements',data:['test',cdUtils.generateUUID()]}).data);
            this.slaveBuffer.removeAcknowledgedMessage(msgId);

            const args = this.slaveBuffer._removeMessageIdFromBuffer.firstCall.args[0];

            assert.isTrue(this.slaveBuffer._removeMessageIdFromBuffer.calledOnce, 'was called more than once');
            assert.equal(args,msgId, 'message id is not equal');

            this.slaveBuffer._preHandshakeBuffer = [];
            this.slaveBuffer.removeAcknowledgedMessage(msgId);
            const logArgs= logSpy.firstCall.args[0];

            assert.equal(logArgs, 'received ack message request but pre handshake queue is empty', 'has not received log message');
            assert.isTrue(this.slaveBuffer._removeMessageIdFromBuffer.calledOnce, 'was called more than once');

        });

        it('should filter message id out of the elementsBuffer array', function(){
            const cdUtils =  MockObjects.cdUtils;
            this.slaveBuffer._preHandshakeBuffer = [];
            const numberOfMessages = 3;

            for (let i = 0; i < numberOfMessages; i++) {
                const msgId = cdUtils.generateUUID();
                const msg = getWindowMsgMock('dataFromSlave', {eventName:'elements',data:{eventName:'test', msgId:msgId}}).data;
                this.slaveBuffer._preHandshakeBuffer.push({msgId,msg});
            }
            const msgIdToFilter = this.slaveBuffer._preHandshakeBuffer[1].msgId;
            this.slaveBuffer._removeMessageIdFromBuffer(msgIdToFilter);

            assert.equal(this.slaveBuffer._preHandshakeBuffer.length, 2, 'filter did not take effect');
            this.slaveBuffer._preHandshakeBuffer.forEach((message) => {
                assert.notEqual(message.msgId, msgIdToFilter, 'message has not been removed from array');
            });

        });

        it('should return if elements buffer is empty', function(){
            this.slaveBuffer._preHandshakeBuffer.push(1,2);
            const isEmptyFirstCall = this.slaveBuffer.isEmpty();

            assert.isFalse(isEmptyFirstCall, 'expected for false');

            this.slaveBuffer._preHandshakeBuffer = [];
            const isEmptySecondCall = this.slaveBuffer.isEmpty();

            assert.isTrue(isEmptySecondCall, 'expected for true');

        });


    });
});
