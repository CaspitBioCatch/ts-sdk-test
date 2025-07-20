import { assert } from 'chai';
import {MessageBusEventType} from "../../../../src/main/events/MessageBusEventType";
import {WorkerEvent} from "../../../../src/main/events/WorkerEvent";
import sinon from "sinon";
import MessageBus from "../../../../src/main/technicalServices/MessageBus";
import WorkerCommunicator from "../../../../src/main/technicalServices/WorkerCommunicator";
import WorkerServerRestoredMuidEventHandler from "../../../../src/worker/events/WorkerServerRestoredMuidEventHandler";

describe('WorkerServerRestoredMuidEventHandler class', function(){
    let messageBus = null;
    let mainCommunicator = null;
    let sandbox = null
    beforeEach(function(){
        sandbox = sinon.createSandbox();
        messageBus = new MessageBus();
        mainCommunicator = sinon.createStubInstance(WorkerCommunicator);
    });

    afterEach(function(){
        sandbox.restore()
        messageBus=null;
        mainCommunicator = null;
    });

    it("should subscribe to restored muid event", function(){
        const muid = "1666717589890-5871DDCB-E3DD-4838-B375-D7AC541AA46C";
        const messageBusSpy = sandbox.spy(MessageBus.prototype, 'subscribe');
        const workerServerRestoredMuid = new WorkerServerRestoredMuidEventHandler(messageBus,mainCommunicator);
        messageBus.publish(MessageBusEventType.ServerRestoredMuidEvent,muid);
        const args = workerServerRestoredMuid._mainCommunicator.sendAsync.getCall(0).args;
        const messageBusArgs = messageBusSpy.getCall(0).args;

        assert.equal(MessageBusEventType.ServerRestoredMuidEvent,args[0], `expected messageBusEventNameType to be ${MessageBusEventType.ServerRestoredMuidEvent}`);
        assert.equal(messageBusArgs[2], true, 'expected true');
        assert.equal(typeof (workerServerRestoredMuid._handler), typeof(messageBusArgs[1]), 'expected both to be a function type')

        assert.equal(args[0], WorkerEvent.ServerRestoredMuidEvent, `expected for ${WorkerEvent.ServerRestoredMuidEvent} event`);
        assert.equal(args[1],muid, `expected muid value to be ${muid}`);
        assert.isTrue(workerServerRestoredMuid._mainCommunicator.sendAsync.calledOnce, 'expected sendAsync to be called once');
    });

})