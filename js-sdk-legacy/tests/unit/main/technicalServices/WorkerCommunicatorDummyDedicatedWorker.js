import WorkerCommunicator from '../../../../src/main/technicalServices/WorkerCommunicator';
import CDPort from '../../../../src/main/infrastructure/CDPort';
import {WorkerEvent} from "../../../../src/main/events/WorkerEvent";

function buildCommunicator(port) {
    const mainCommunicator = new WorkerCommunicator();
    mainCommunicator.setMessagingPort(port);

    mainCommunicator.addMessageListener('mainToWorker', function (data) {
        if (data === 'mainToWorkerData') {
            mainCommunicator.sendAsync('workerToMain', 'workerToMainData');
        }
    });

    mainCommunicator.addMessageListener('testMainListenerStart', function (data) {
        if (data === 'testMainListenerStartData') {
            mainCommunicator.sendAsync('testMainListenerStartResponse', 'testMainListenerStartDataResponse');
        }
    });

    mainCommunicator.addMessageListener('ServerRestoredMuid', function (data) {
            mainCommunicator.sendAsync(WorkerEvent.ServerRestoredMuidEvent, data);

    });

    // Notify that we are alive every 10 millis. This helps us identify that the worker is up during tests and resume testing
    setInterval(function () {
        mainCommunicator.sendAsync('WorkerAlive');
    }, 10);
}

// This is for the regular worker
buildCommunicator(new CDPort(self));
