import Event from './Event';
import Log from '../../technicalServices/log/Logger';
import { MessageBusEventType } from '../../events/MessageBusEventType';

export const onFormSelectors = 'form';

class FormEvents extends Event {
    /**
     *
     * @param sendToQueue
     * @param MessageBus
     * @param StandardOnFormEventsEmitter
     */
    constructor(sendToQueue, MessageBus, StandardOnFormEventsEmitter, maxShadowDepth, iframeLoadingTimeout) {
        super();
        this._sendToQueue = sendToQueue;

        this._messageBus = MessageBus;
        this._StandardOnFormEventsEmitter = StandardOnFormEventsEmitter;
        this._maxShadowDepth = maxShadowDepth;
        this._iframeLoadingTimeout = iframeLoadingTimeout;
    }

    /**
     * @param {BrowserContext} browserContext
     */
    bind(browserContext) {
        const doc = browserContext.getDocument();
        browserContext.collectAllElementsBySelectorAsync(onFormSelectors, this._maxShadowDepth, this._iframeLoadingTimeout)
            .then((_onFormElements) => {
                this._StandardOnFormEventsEmitter.start(_onFormElements);
            })

        this._messageBus.subscribe(MessageBusEventType.StandardOnFormSubmitEvent, this.handleOnFormEvents);
    }

    /**
     * @param {BrowserContext} browserContext
     */
    unbind(browserContext) {
        browserContext.collectAllElementsBySelectorAsync(onFormSelectors, this._maxShadowDepth, this._iframeLoadingTimeout)
            .then((_onFormElements) => {
                this._StandardOnFormEventsEmitter.stop(_onFormElements);
            })

        this._messageBus.unsubscribe(MessageBusEventType.StandardOnFormSubmitEvent, this.handleOnFormEvents);
    }

    /**
     *
     * @param e
     */
    handleOnFormEvents = (e) => {
        Log.trace('ElementEvents:_onFormSubmitEvent');

        this._sendToQueue(e, {
            length: 0,
            selected: -1,
            elementValues: '',
        });
    }
}

export default FormEvents;
