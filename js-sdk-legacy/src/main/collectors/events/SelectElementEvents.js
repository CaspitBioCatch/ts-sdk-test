import Event from './Event';
import { MessageBusEventType } from '../../events/MessageBusEventType';
import { ConfigurationFields } from "../../core/configuration/ConfigurationFields";

export const onSelectSelectors = 'select';

class SelectElementEvents extends Event {
    /**
     *
     * @param sendToQueue
     */
    constructor(
        sendToQueue,
        cdUtils,
        messageBus,
        standardOnChangeEventsEmitter,
        elementFocusEventEmitter,
        elementBlurEventEmitter,
        configurationRepository,
        maskingService,
        maxShadowDepth,
        iframeLoadingTimeout) {
        super();
        this._sendToQueue = sendToQueue;
        this._CDUtils = cdUtils;

        this._messageBus = messageBus;
        this._StandardOnChangeEventsEmitter = standardOnChangeEventsEmitter;
        this._elementFocusEventEmitter = elementFocusEventEmitter;
        this._elementBlurEventEmitter = elementBlurEventEmitter;
        this._configurationRepository = configurationRepository;
        this._collectSelectElementBlurAndFocusEvents = this._configurationRepository.get(ConfigurationFields.collectSelectElementBlurAndFocusEvents);
        this._maskingService = maskingService
        this._maxShadowDepth = maxShadowDepth;
        this._iframeLoadingTimeout = iframeLoadingTimeout;
    }

    /**
     * @param {BrowserContext} browserContext
     */
    bind(browserContext) {
        this._messageBus.subscribe(MessageBusEventType.StandardOnSelectEvent, this.handleOnChangeEvents);
        this._messageBus.subscribe(MessageBusEventType.ElementFocusEvent, this.handleFocusEvent);
        this._messageBus.subscribe(MessageBusEventType.ElementBlurEvent, this.handleBlurEvent);

        browserContext.collectAllElementsBySelectorAsync(onSelectSelectors, this._maxShadowDepth, this._iframeLoadingTimeout)
            .then((_onSelectElements) => {
                this._StandardOnChangeEventsEmitter.start(_onSelectElements);
                if (this._collectSelectElementBlurAndFocusEvents) {
                    this._elementFocusEventEmitter.start(_onSelectElements);
                    this._elementBlurEventEmitter.start(_onSelectElements);
                }
            })
    }

    /**
     * @param {BrowserContext} browserContext
     */
    unbind(browserContext) {
        browserContext.collectAllElementsBySelectorAsync(onSelectSelectors, this._maxShadowDepth, this._iframeLoadingTimeout)
            .then((_onSelectElements) => {
                this._StandardOnChangeEventsEmitter.stop(_onSelectElements);
                this._elementFocusEventEmitter.stop(_onSelectElements);
                this._elementBlurEventEmitter.stop(_onSelectElements);
            })
        this._messageBus.unsubscribe(MessageBusEventType.StandardOnSelectEvent, this.handleOnChangeEvents);
        this._messageBus.unsubscribe(MessageBusEventType.ElementFocusEvent, this.handleFocusEvent);
        this._messageBus.unsubscribe(MessageBusEventType.ElementBlurEvent, this.handleBlurEvent);
    }

    updateSettings(browserContext) {
        this._collectSelectElementBlurAndFocusEvents = this._configurationRepository.get(ConfigurationFields.collectSelectElementBlurAndFocusEvents);
        if(!this._collectSelectElementBlurAndFocusEvents) {
            browserContext.collectAllElementsBySelectorAsync(onSelectSelectors, this._maxShadowDepth, this._iframeLoadingTimeout)
                .then((_onSelectElements) => {
                    this._elementFocusEventEmitter.stop(_onSelectElements);
                    this._elementBlurEventEmitter.stop(_onSelectElements);
                })
        }
    }

    /**
     *
     * @param e
     */
    handleOnChangeEvents = (e) => {
        let optionsVals = this._CDUtils.getDropDownListValues(e.target, this._maskingService).join(';');
        optionsVals = this._CDUtils.clearTextFromNumbers(optionsVals);
        const selected = e.target.selectedIndex;
        const { length } = e.target.value;

        this._sendToQueue(e, {
            length,
            selected,
            elementValues: optionsVals,
        });
    }

    /**
     *
     * @param e
     */
    handleBlurEvent = (e) => {
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
    handleFocusEvent = (e) => {
        this._sendToQueue(e, {
            length: 0,
            selected: -1,
            elementValues: '',
        });
    }
}

export default SelectElementEvents;
