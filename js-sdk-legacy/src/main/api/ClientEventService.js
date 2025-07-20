import { ApiEventType } from './ApiEventType';

export default class ClientEventService {
    publishNewSessionStartedEvent(sid) {
        window.postMessage({
            type: ApiEventType.NewSessionStartedEvent,
            event: { sessionID: sid },
        }, window.location.href);
    }

    publishStateChangedEvent(state) {
        window.postMessage({
            type: ApiEventType.StateChangedEvent,
            event: { state },
        }, window.location.href);
    }

    publishRestoredMuidEvent(muid){
        window.postMessage({
            type:ApiEventType.RestoredMuidEvent,
            event:{muid}
        },window.location.href);
    }
}
