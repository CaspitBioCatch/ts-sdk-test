import WorkerCommunicator from '../main/technicalServices/WorkerCommunicator';
import WorkerSysLoader from './WorkerSysLoader';
import { WorkerStatusCategoryType } from './WorkerStatusCategoryType';
import { statusTypes } from '../main/events/HeartBeatEvent';
import MessageBus from '../main/technicalServices/MessageBus';
import { MessageBusEventType } from '../main/events/MessageBusEventType';
import HeartBeatEvent from '../main/events/HeartBeatEvent';
import CDPort from '../main/infrastructure/CDPort';

export default class WorkerStartPoint {
    start() {
        // start the system
        const mainCommunicator = new WorkerCommunicator();
        const msgBus = new MessageBus();
        const workerSysLoader = new WorkerSysLoader(mainCommunicator, msgBus);
        this._loadWorkerSystem(mainCommunicator, msgBus, workerSysLoader, new CDPort(self));
    }

    _loadWorkerSystem(mainCommunicator, msgBus, workerSysLoader, port) {
        try {
            mainCommunicator.setMessagingPort(port);
            workerSysLoader.loadSystem();
            msgBus.publish(MessageBusEventType.WorkerSystemStatusEvent, new HeartBeatEvent(WorkerStatusCategoryType.WorkerSetup, statusTypes.Ok));
        } catch (e) {
            msgBus.publish(MessageBusEventType.WorkerSystemStatusEvent, new HeartBeatEvent(WorkerStatusCategoryType.WorkerSetup, statusTypes.Error));
        }
    }
}
