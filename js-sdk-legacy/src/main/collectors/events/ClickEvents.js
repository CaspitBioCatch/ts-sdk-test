import Event from './Event';
import { MessageBusEventType } from '../../events/MessageBusEventType';
import { ConfigurationFields } from '../../core/configuration/ConfigurationFields';
import Log from "../../technicalServices/log/Logger";

export const onClickSelectors = "input[type='button'], input[type='radio'], input[type='checkbox'], button";

/**
 * OnCLickEvents Data Collector
 */
class ClickEvents extends Event {
    /**
     * @param sendToQueue
     */
    constructor(sendToQueue, CDUtils, messageBus, configurationRepository, StandardOnClickEventsEmitter, maskingService, elements, maxShadowDepth, iframeLoadingTimeout) {
        super();
        this._elements = elements;
        this._sendToQueue = sendToQueue;
        this._CDUtils = CDUtils;

        this._messageBus = messageBus;
        this._StandardOnClickEventsEmitter = StandardOnClickEventsEmitter;
        this._configurationRepository = configurationRepository;
        this._enableElementHierarchy = configurationRepository.get(ConfigurationFields.enableElementHierarchy);
        this._enableElementCategory = configurationRepository.get(ConfigurationFields.enableElementCategory);
        this._maskingService = maskingService
        this._maxShadowDepth = maxShadowDepth;
        this._iframeLoadingTimeout = iframeLoadingTimeout;
    }

    /**
     * @param {BrowserContext} browserContext
     */
    bind(browserContext) {
        this._messageBus.subscribe(MessageBusEventType.StandardOnClickEvent, this.handleOnClickEvents);
        browserContext.collectAllElementsBySelectorAsync(onClickSelectors, this._maxShadowDepth, this._iframeLoadingTimeout)
            .then((_onClickElements) => {
                this._StandardOnClickEventsEmitter.start(_onClickElements);
            })
    }

    /**
     * @param {BrowserContext}browserContext
     */
    unbind(browserContext) {
        this._messageBus.unsubscribe(MessageBusEventType.StandardOnClickEvent, this.handleOnClickEvents);
        browserContext.collectAllElementsBySelectorAsync(onClickSelectors, this._maxShadowDepth, this._iframeLoadingTimeout)
            .then((_onClickElements) => {
                this._StandardOnClickEventsEmitter.stop(_onClickElements);
            })
    }

  addOnLoadInputData(browserContext, isChange) {
        if (!this._enableElementHierarchy && !this._enableElementCategory) return;
        browserContext.collectAllElementsBySelectorAsync(onClickSelectors, this._maxShadowDepth, this._iframeLoadingTimeout)
            .then((elements) => {
                this.processElements(elements, isChange, this._elements, this._elements.resendElementPerContext, this._elements.getElement);
            })
    }

    /**
     *
     * @param e
     */
    handleOnClickEvents = (e) => {
        // in input of type button we wish to see the value in the button,
        // in input of type radio the value of the element clicked is the value
        // in input of type checkbox the value is the value property,
        // in button tag the value in the innerHTML
        // we send whether the value is checked un the selected property
        const { target } = e;
        let newValue = target.value || target.innerHTML || '';
        newValue = this._maskingService.maskText(newValue, e.target.id)
        this._sendToQueue(e, {
            length: newValue.length,
            elementValues: newValue,
            selected: target.checked === undefined ? -1 : (target.checked ? 1 : 0),
        });
    }
}

export default ClickEvents;
