import { assert } from 'chai';
import sinon from "sinon";
import {TestUtils} from "../../../TestUtils";
import {WorkerEvent} from "../../../../src/main/events/WorkerEvent";
import RestoredMuidEventHandler from "../../../../src/main/events/RestoredMuidEventHandler";
import ClientEventService from "../../../../src/main/api/ClientEventService";
import DummyWorker from 'worker-loader?inline=no-fallback&filename=worker.js!../../../unit/main/technicalServices/WorkerCommunicatorDummyDedicatedWorker';
import WorkerWrapper from "../../../../src/main/technicalServices/WorkerWrapper";
import WorkerCommunicator from "../../../../src/main/technicalServices/WorkerCommunicator";
import CDUtils from "../../../../src/main/technicalServices/CDUtils";


describe('RestoredMuidEventHandler class:', function(){

    let sandbox = null;

    beforeEach(function(){
        sandbox = sinon.createSandbox();
    });

    afterEach(function(){
        sandbox.restore();

    });

    it("should send the worker a restored muid message:", async function(){
        //setting a random MUID to be restored from the server
        const restoredMuid = CDUtils.dateNow() + '-' + CDUtils.generateUUID().toUpperCase();
        //the current session MUID
        const startMuid = this.systemBootstrapper.getMuidService()?.muid;

        //dummy worker to simulate Worker event request
        const dummyWorker = new DummyWorker();
        const workerWrapper = new WorkerWrapper(dummyWorker);
        const workerComm = new WorkerCommunicator();
        workerComm.setMessagingPort(workerWrapper.port);

        // systemBootstarpper initial values
        const messageBus = this.systemBootstrapper.getMessageBus();
        const muidService = this.systemBootstrapper.getMuidService();
        const clientEventService = new ClientEventService();

        //an instance of the RestoredMuidEventHandler class
        const restoredMuidEvent = new RestoredMuidEventHandler(messageBus,muidService,clientEventService,workerComm);
        restoredMuidEvent._publish = sandbox.spy();

        //This to verify callback was indeed called;
        let callbackCalled = false;

        workerComm.addMessageListener('WorkerAlive', () => {
            workerComm.addMessageListener(WorkerEvent.ServerRestoredMuidEvent, function (data) {
                assert.equal(data, restoredMuid, 'expected same value for muids');
                restoredMuidEvent._publish(data);
                workerWrapper.close();
                callbackCalled = true;
            }, true);

            workerComm.sendAsync('ServerRestoredMuid', restoredMuid);
        }, true);

        await TestUtils.waitForNoAssertion(()=>{
            assert.isTrue(callbackCalled,'expected callback to be called');
            const args = restoredMuidEvent._publish.getCall(0).args[0];

            //confirm what was sent from the server is the restored muid generated in the first line
            assert.equal(args,restoredMuid,'expected same value for the muids');

            //the startMuid value should be changed once we get the restored muid from the server,
            //hence the session's muid is changed at the end of the process
            assert.notEqual(startMuid,this.systemBootstrapper.getMuidService()?.muid, 'expected muids to be different')

        }).finally(() => {
            workerWrapper.close();
            sandbox.restore();
        });


    });
})