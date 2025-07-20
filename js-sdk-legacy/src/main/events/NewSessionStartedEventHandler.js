/**
 * This class is for handling a new session start event. This event occurs once per session once the session starts.
 * The event is triggered after a new session id is received from the server. This can be due to the server deciding
 * that the session should be reset, or due to a request from the SDK.
 */
import { MessageBusEventType } from './MessageBusEventType';

export default class NewSessionStartedEventHandler {
    constructor(messageBus,
                featureService,
                customerApiBridge,
                contextMgr,
                clientEventService,
                sessionInfoService) {
        this._messageBus = messageBus;
        this._featureService = featureService;
        this._customerApiBridge = customerApiBridge;
        this._contextMgr = contextMgr;
        this._clientEventService = clientEventService;
        this._sessionInfoService = sessionInfoService;

        this._messageBus.subscribe(MessageBusEventType.NewSessionStartedEvent, this._handle.bind(this));
    }

    _handle(sessionId) {
        // Mark the session start time on the client side.
        this._sessionInfoService.markStartTime();

        this._featureService.runPerSessionFeatures();
        // Send the legacy session started event
        this._customerApiBridge.notifySessionReset(sessionId);
        this._contextMgr.onSessionReset();

        // Publish the new event
        this._clientEventService.publishNewSessionStartedEvent(sessionId);
    }
}
