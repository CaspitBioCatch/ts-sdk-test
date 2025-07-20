import {assert} from "chai";
import sinon from "sinon";
import AcknowledgeMessageEventsHandler from "../../../../src/slave/handlers/AcknowledgeMessageEventsHandler";
import SlaveBuffer from "../../../../src/slave/SlaveBuffer";
import TestFeatureSupport from "../../../TestFeatureSupport";
import AcknowledgeDataDispatcher from "../../../../src/slave/services/AcknowledgeDataDispatcher";
import ConfigurationRepository from "../../../../src/main/core/configuration/ConfigurationRepository";

describe('AcknowledgeMessageEventsHandler tests: ', function(){

    let sandbox = null;
    let acknowledgeMessageEventsHandler = null;
    let slaveBuffer = null;
    let configurationRepository = null;
    let postMessageCallback = null;
    let portIsOpenCallback = null;
    let acknowledgeDataDispatcher = null;

    beforeEach(function(){
        if (TestFeatureSupport.isSpyNotSupported()) {
            this.skip();
            return;
        }

        sandbox = sinon.createSandbox();
        slaveBuffer = sandbox.createStubInstance(SlaveBuffer);
        configurationRepository = sandbox.createStubInstance(ConfigurationRepository)
        acknowledgeDataDispatcher =sandbox.createStubInstance(AcknowledgeDataDispatcher);
        acknowledgeMessageEventsHandler = new AcknowledgeMessageEventsHandler(slaveBuffer,configurationRepository,acknowledgeDataDispatcher);
        postMessageCallback = sandbox.spy();
        portIsOpenCallback = sandbox.spy();

        acknowledgeMessageEventsHandler._isBufferAckMessageEnabled = sandbox.stub();
        acknowledgeMessageEventsHandler._isBufferAckMessageEnabled.returns(true);
    });

    afterEach(function(){
        if(sandbox){
            sandbox.restore();
        }
        acknowledgeDataDispatcher = null;
        slaveBuffer = null;
        configurationRepository = null;
        postMessageCallback = null;
        portIsOpenCallback = null;
        acknowledgeMessageEventsHandler = null;
    });

    it('should start pre handshake buffer',async function(){
        acknowledgeMessageEventsHandler._acknowledgeDataDispatcher.start = sandbox.spy();
        acknowledgeMessageEventsHandler.enableAcknowledgeMessageEvents(postMessageCallback, portIsOpenCallback);

        const args = acknowledgeMessageEventsHandler._acknowledgeDataDispatcher.start.firstCall.args;

        assert.isTrue(acknowledgeMessageEventsHandler._acknowledgeDataDispatcher.start.calledOnce, 'called more than once');
        assert.equal(args[0], 'spy','callback function was not passed to function');
        assert.equal(args[1], 'spy','callback function was not passed to function');
    });

    it('should not start pre handshake buffer',async function(){
        acknowledgeMessageEventsHandler._acknowledgeDataDispatcher.start = sandbox.spy();
        acknowledgeMessageEventsHandler.enableAcknowledgeMessageEvents(postMessageCallback, portIsOpenCallback);

        assert.isTrue(acknowledgeMessageEventsHandler._acknowledgeDataDispatcher.start.called, 'start was not called');
    });


    it('should handle ack message id from channel', function(){
        acknowledgeMessageEventsHandler._slaveBuffer.removeAcknowledgedMessage = sandbox.spy();
        const msgId = 12345;
        acknowledgeMessageEventsHandler.removeAcknowledgedMessage(msgId);

        const args = acknowledgeMessageEventsHandler._slaveBuffer.removeAcknowledgedMessage.firstCall.args[0];

        assert.equal(args, msgId, 'wrong message id');
        assert.isTrue(acknowledgeMessageEventsHandler._slaveBuffer.removeAcknowledgedMessage.calledOnce, 'called more than once');

    });

    it('should handle BeforeUnloadEvent when received', function(){
        acknowledgeMessageEventsHandler._acknowledgeDataDispatcher.beforeUnloadEvent = sandbox.spy();
        configurationRepository.get.returns(true);
        const portIsOpenCallback = sandbox.spy();

        acknowledgeMessageEventsHandler.handleBeforeUnloadEvent(postMessageCallback,portIsOpenCallback);

        assert.isTrue(acknowledgeMessageEventsHandler._acknowledgeDataDispatcher.beforeUnloadEvent.calledWith(postMessageCallback,portIsOpenCallback),
            'sendToChannel was not called with a callback function');
        assert.isTrue(acknowledgeMessageEventsHandler._acknowledgeDataDispatcher.beforeUnloadEvent.calledOnce, 'sendToChannel was called more than once');
    });

});