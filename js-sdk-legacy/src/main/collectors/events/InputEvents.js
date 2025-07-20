import Event from './Event';
import {MessageBusEventType} from '../../events/MessageBusEventType';
import Log from "../../technicalServices/log/Logger";

export const inputSelectors = "input:not([type='color']):not([type='hidden']):not([type='file']):not"
    + "([type='image']):not([type='button']):not([type='radio']):not([type='checkbox']), textarea";

/**
 * Private instance of the input events data collector
 * @param eventEmitter
 * @param maxShadowDepth
 * @returns {{applyAction: _applyAction}}
 * @private
 */
const _InputEventsCollector = (eventEmitter, maxShadowDepth, iframeLoadingTimeout) => {
    function _applyAction(browserContext, action, shouldSkipElement) {
        const supportedActions = ['start', 'stop'];
        if (!supportedActions.includes(action)) return false;

        browserContext.collectAllElementsBySelectorAsync(inputSelectors, maxShadowDepth, iframeLoadingTimeout)
            .then((elements) => {
                if (elements.length > 0) {
                    eventEmitter[action](elements, browserContext.Context, shouldSkipElement);
                }
            })
    }

    return {
        applyAction: _applyAction,
    };
};

/**
 * InputEvents Data Collector. Controlled by ElementsEvent Data Collector
 */
class InputEvents extends Event {
    constructor(
        elements,
        sendToQueue,
        CDUtils,
        MessageBus,
        StandardInputEventsEmitter,
        SyntheticMaskInputEventsHandler,
        SyntheticAutotabInputEventsHandler,
        MaskingService,
        maxShadowDepth,
        iframeLoadingTimeout,
    ) {
        super();

        this._elements = elements;
        this._sendToQueue = sendToQueue;
        this._messageBus = MessageBus;
        this._CDUtils = CDUtils;

        this._StandardInputEventsEmitter = StandardInputEventsEmitter;
        this._SyntheticMaskInputEventsHandler = SyntheticMaskInputEventsHandler;
        this._SyntheticAutotabInputEventsHandler = SyntheticAutotabInputEventsHandler;
        this._maskingService = MaskingService;
        this._inputEventsPerElement = new WeakMap();
        this._maxShadowDepth = maxShadowDepth
        this._iframeLoadingTimeout = iframeLoadingTimeout
    }

    /**
     * @param {BrowserContext} browserContext
     */
    bind(browserContext) {
        this._messageBus.subscribe(MessageBusEventType.StandardInputEvent, this.handleInputEvents);
        this._messageBus.subscribe(MessageBusEventType.StandardInputFocusEvent, this.handleFocusBlurEvents);
        this._messageBus.subscribe(MessageBusEventType.StandardInputBlurEvent, this.handleFocusBlurEvents);
        this._messageBus.subscribe(MessageBusEventType.SyntheticInputMaskEvent, this.handleSyntheticInputEvents);

        _InputEventsCollector(this._StandardInputEventsEmitter,this._maxShadowDepth, this._iframeLoadingTimeout).applyAction(browserContext, 'start');
        _InputEventsCollector(this._SyntheticMaskInputEventsHandler,this._maxShadowDepth, this._iframeLoadingTimeout).applyAction(browserContext, 'start');
        _InputEventsCollector(this._SyntheticAutotabInputEventsHandler,this._maxShadowDepth, this._iframeLoadingTimeout).applyAction(browserContext, 'start');
    }

    /**
     * @param {BrowserContext} browserContext
     */
    unbind(browserContext) {
        _InputEventsCollector(this._StandardInputEventsEmitter,this._maxShadowDepth, this._iframeLoadingTimeout).applyAction(browserContext, 'stop');
        _InputEventsCollector(this._SyntheticMaskInputEventsHandler,this._maxShadowDepth, this._iframeLoadingTimeout).applyAction(browserContext, 'stop');
        _InputEventsCollector(this._SyntheticAutotabInputEventsHandler,this._maxShadowDepth, this._iframeLoadingTimeout).applyAction(browserContext, 'stop');

        this._messageBus.unsubscribe(MessageBusEventType.StandardInputEvent, this.handleInputEvents);
        this._messageBus.unsubscribe(MessageBusEventType.StandardInputFocusEvent, this.handleFocusBlurEvents);
        this._messageBus.unsubscribe(MessageBusEventType.StandardInputBlurEvent, this.handleFocusBlurEvents);
        this._messageBus.unsubscribe(MessageBusEventType.SyntheticInputMaskEvent, this.handleSyntheticInputEvents);
    }

    /**
     * @param {BrowserContext} browserContext
     * @param isChange
     */
    addOnLoadInputData(browserContext, isChange) {
        browserContext.collectAllElementsBySelectorAsync(inputSelectors, this._maxShadowDepth, this._iframeLoadingTimeout)
            .then((elements) => {
                this.processElements(elements, isChange, this._elements, this._elements.resendElementPerContext, this._elements.getElement);
            })
    }

    /**
     * Receive the requested event from the handler
     */
    handleInputEvents = (e) => {
        if (e.constructor.name === 'InputEvent') {
            this._inputEventsPerElement.set(e.target, {});
        }

        let newValue = e.target.value || '';
        if (newValue !== '') {
            // mask all chars, but preserve length
            newValue = this._maskingService.maskText(newValue, e.target.id);
        }
        this._sendToQueue(e, {
                length: newValue ? newValue.length : 0,
                elementValues: newValue,
                selected: -1,
        });
    }

    /**
     *
     * @param e
     */
    handleFocusBlurEvents = (e) => {
        this._sendToQueue(e, {
            length: 0,
            selected: -1,
            elementValues: '',
        });
    }

    /**
     *
     * @param e
     */
    handleSyntheticInputEvents = (e) => {
        // jQuery autotab plugin special handling!
        // Backspace keys are not reported as custom input events in case of jQuery autotab plugin is applied on
        // the current target.
        // This allows any other subsequent custom key events (that are not backspace) to be reported as
        // input events despite having the current target hashed in _inputEventNameTags
        if (!!this._inputEventsPerElement.has(e.target)
            && !(typeof e.jQueryMask !== 'undefined'
                && (e.jQueryMask === 'autotab' || e.jQueryMask === 'prasleyValidator'))) {
            return;
        }

        let newValue = e.target.value || '';
        if (newValue !== '') {
            // mask all chars, but preserve length
            newValue = this._maskingService.maskText(newValue, e.target.id);
        }

        this._sendToQueue(e, {
            length: newValue ? newValue.length : 0,
            elementValues: newValue,
            selected: -1,
        });
    }
}

export default InputEvents;
