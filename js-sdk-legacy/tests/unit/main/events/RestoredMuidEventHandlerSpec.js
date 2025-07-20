import { assert } from 'chai';
import {MessageBusEventType} from "../../../../src/main/events/MessageBusEventType";
import sinon from "sinon";
import MessageBus from "../../../../src/main/technicalServices/MessageBus";
import MuidService from "../../../../src/main/core/MuidService";
import ClientEventService from "../../../../src/main/api/ClientEventService";
import RestoredMuidEventHandler from "../../../../src/main/events/RestoredMuidEventHandler";
import WorkerCommunicator from "../../../../src/main/technicalServices/WorkerCommunicator";


describe('RestoredMuidEventHandler class', function(){

    let sandbox = null;
    let messageBus = null;
    let muidService = null;
    let clientEventService = null;

    beforeEach(function(){
        sandbox = sinon.createSandbox();
        messageBus = new MessageBus();
        muidService = sinon.createStubInstance(MuidService);
        clientEventService = sinon.createStubInstance(ClientEventService);

    });

    afterEach(function(){
        sandbox.restore();
        messageBus = null;
        muidService = null;
        clientEventService = null;
    })

    it('should update muid + fire a postMessage of the eventName ',function(){

        const muid = '1666717589890-5871DDCB-E3DD-4838-B375-D7AC541AA46C';
        const messageBusSubscribeSpy = sandbox.spy(MessageBus.prototype,'subscribe');
        const restoredMuidServiceEventHandler = new RestoredMuidEventHandler(messageBus,muidService,clientEventService, new WorkerCommunicator());

        //getting messageBus subscribe calls:
        const subscribeArgs = messageBusSubscribeSpy.getCall(0).args;

        //publish the restored muid messageBus event
        messageBus.publish(MessageBusEventType.ServerRestoredMuidEvent,muid);

        assert.equal(subscribeArgs[0], MessageBusEventType.ServerRestoredMuidEvent, ` expected messageType to be ${MessageBusEventType.ServerRestoredMuidEvent}`);
        assert.isTrue(subscribeArgs[2],'expected to true');

        assert.isTrue(restoredMuidServiceEventHandler._muidService.updateMuid.calledOnce, 'expected updateMuid to be called once');
        assert.isTrue(restoredMuidServiceEventHandler._muidService.updateMuid.calledWith(muid), `expected updateMuid to be called with ${muid}`);

        assert.isTrue(restoredMuidServiceEventHandler._clientEventService.publishRestoredMuidEvent.calledOnce,'expected publishRestoredMuid to be called once');
        assert.isTrue(restoredMuidServiceEventHandler._clientEventService.publishRestoredMuidEvent.calledWith(muid),`expected publishEventMuidEvent to be called with ${muid}`);
        sandbox.restore();
    });

});