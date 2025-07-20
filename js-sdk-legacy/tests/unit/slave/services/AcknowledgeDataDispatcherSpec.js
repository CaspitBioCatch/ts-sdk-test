import {assert} from "chai";
import sinon from "sinon";
import SlaveBuffer from "../../../../src/slave/SlaveBuffer";
import ConfigurationRepository from "../../../../src/main/core/configuration/ConfigurationRepository";
import AcknowledgeDataDispatcher from "../../../../src/slave/services/AcknowledgeDataDispatcher";
import MessageEventHandler from "../../../../src/slave/handlers/MessageEventHandler";

describe('PreHandshakeMessageDataDispatcher tests: ', function(){
    let sandbox = null;
    let slaveBuffer = null;
    let postMessageCallback = null;
    let acknowledgeDataDispatcher = null;
    let configurationRepository = null;
    let portIsOpenCallback = null;

    beforeEach(function(){
        sandbox = sinon.createSandbox();
        slaveBuffer = sandbox.createStubInstance(SlaveBuffer);
        configurationRepository = sandbox.createStubInstance(ConfigurationRepository);
        postMessageCallback = sandbox.spy();
        portIsOpenCallback = sandbox.spy();
        acknowledgeDataDispatcher = new AcknowledgeDataDispatcher(configurationRepository,slaveBuffer);
    });

    afterEach(function(){
        if(sandbox){
            sandbox.restore();
        }
        slaveBuffer = null;
        postMessageCallback = null;
        portIsOpenCallback = null
        acknowledgeDataDispatcher = null;
        configurationRepository = null;
    });

    it('should call setInterval + dispatchFirstMessage functions', function(){
        acknowledgeDataDispatcher._configurationRepository.get = sandbox.stub();
        acknowledgeDataDispatcher._configurationRepository.get.returns(20);
        acknowledgeDataDispatcher._dataToChannelManager = sandbox.spy();

        const clock = sandbox.useFakeTimers({
            toFake:['setInterval']
        });

        acknowledgeDataDispatcher.start(postMessageCallback, portIsOpenCallback);

        clock.tick(20);
        assert.isTrue(acknowledgeDataDispatcher._dataToChannelManager.calledWith(postMessageCallback, portIsOpenCallback), 'was not called with callback message');

        clock.restore();
    });


    it('should send to channel if configuration is set to true', function(){
        acknowledgeDataDispatcher._configurationRepository.get = sandbox.stub();
        acknowledgeDataDispatcher._configurationRepository.get.returns(true);
        const messageEventHandler = sandbox.createStubInstance(MessageEventHandler);
        const portIsOpenCallback = messageEventHandler.portIsOpen;
        portIsOpenCallback.returns(true);

        acknowledgeDataDispatcher._sendToChannel = sandbox.spy();
        acknowledgeDataDispatcher._dataToChannelManager(postMessageCallback, portIsOpenCallback);
        acknowledgeDataDispatcher._dataToChannelManager(postMessageCallback, portIsOpenCallback);

        assert.isTrue(acknowledgeDataDispatcher._sendToChannel.calledTwice,'_sendToChannel was not called twice');
        assert.isTrue(acknowledgeDataDispatcher._sendToChannel.calledWith(postMessageCallback),'post message was not attached to request');

    });

    it('should not send to channel if configuration is set to false', function(){
        acknowledgeDataDispatcher._configurationRepository.get = sandbox.stub();
        acknowledgeDataDispatcher._configurationRepository.get.returns(false);
        const messageEventHandler = sandbox.createStubInstance(MessageEventHandler);
        const portIsOpenCallback = messageEventHandler.portIsOpen;
        portIsOpenCallback.returns(true);

        acknowledgeDataDispatcher._sendToChannel = sandbox.spy();
        acknowledgeDataDispatcher._dataToChannelManager(postMessageCallback, portIsOpenCallback);

        assert.isTrue(acknowledgeDataDispatcher._sendToChannel.notCalled,'_sendToChannel was called');
    });

    it('should send message to channel', function(){
        acknowledgeDataDispatcher._slaveBuffer.sendBufferedMessagesToChannel = sandbox.spy();
        acknowledgeDataDispatcher._sendToChannel(postMessageCallback);

        assert.isTrue(acknowledgeDataDispatcher._slaveBuffer.sendBufferedAckMessagesToChannel.calledOnce, 'sendBufferedMessagesToChannel called more than once');
    });

    it('should call clear interval', function(){
        window.clearInterval = sandbox.spy();
        acknowledgeDataDispatcher.clearInterval();

        assert.isFalse(window.clearInterval.called, 'clear interval was called');

        acknowledgeDataDispatcher._ackDispatcherIntervalId = 5;
        acknowledgeDataDispatcher.clearInterval();

        assert.isTrue(window.clearInterval.calledOnce, 'clearInterval was called more than once');
    });


    it('should send buffered messages on beforeUnloadEvent event', function (){
        acknowledgeDataDispatcher._slaveBuffer.isEmpty = sandbox.stub();
        acknowledgeDataDispatcher._slaveBuffer.isEmpty.returns(false);
        acknowledgeDataDispatcher._sendToChannel = sandbox.spy();
        acknowledgeDataDispatcher.clearInterval = sandbox.spy();
       const portIsOpen = sandbox.stub();
       portIsOpen.returns(true);

        acknowledgeDataDispatcher.beforeUnloadEvent(postMessageCallback, portIsOpen);

       assert.isTrue(acknowledgeDataDispatcher._sendToChannel.calledOnce, 'sendToChannel called more than once');
       assert.isTrue(acknowledgeDataDispatcher._sendToChannel.calledWith(postMessageCallback), 'sendToChannel was not called with callback function');
       assert.isTrue(acknowledgeDataDispatcher.clearInterval.calledOnce, 'clearInterval was not called');
       assert.isTrue(portIsOpen.calledOnce, 'portIsOpen was not called')

    });

});