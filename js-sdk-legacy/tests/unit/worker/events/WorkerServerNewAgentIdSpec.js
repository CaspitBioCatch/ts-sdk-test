import {assert} from "chai";
import sinon from "sinon";
import MessageBus from "../../../../src/main/technicalServices/MessageBus";
import WorkerCommunicator from "../../../../src/main/technicalServices/WorkerCommunicator";
import {MessageBusEventType} from "../../../../src/main/events/MessageBusEventType";
import WorkerServerNewAgentId from "../../../../src/worker/events/WorkerServerNewAgentId";
import {WorkerEvent} from "../../../../src/main/events/WorkerEvent";

describe('WorkerCommunicator tests:', function () {
    let sandbox;
    let messageBus;
    let workerCommunicator;

    beforeEach(function () {
        sandbox = sinon.createSandbox();
        messageBus = new MessageBus();
        workerCommunicator = sandbox.createStubInstance(WorkerCommunicator);
    });

    afterEach(function () {
        sandbox.restore();
        messageBus = null;
        workerCommunicator = null;
    })

    it('should send a ServerNewAgentIdEvent event to client from worker', function () {
        const agentId = 'stam-agent-id';
        const workerServerNewAgentId = new WorkerServerNewAgentId(messageBus, workerCommunicator);
        workerServerNewAgentId._mainCommunicator.sendAsync = sandbox.stub();
       messageBus.publish(MessageBusEventType.ServerNewAgentIdEvent, agentId);
       const args = workerServerNewAgentId._mainCommunicator.sendAsync.getCall(0).args;

       assert.equal(args[0], WorkerEvent.ServerNewAgentIdEvent, `expected for ${WorkerEvent.ServerNewAgentIdEvent} event`);
       assert.equal(args[1], agentId, `expected agentId value to be ${agentId}`);
       assert.isTrue(workerServerNewAgentId._mainCommunicator.sendAsync.calledOnce, 'expected sendAsync to be called once');
    });
});