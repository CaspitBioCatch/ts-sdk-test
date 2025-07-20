// eslint-disable-next-line max-classes-per-file
import DataCollector from '../DataCollector';
import { ConfigurationFields } from '../../core/configuration/ConfigurationFields';
import { IsTrustedValue } from './IsTrustedValue';
import Log from '../../technicalServices/log/Logger';
import { MessageBusEventType } from '../../events/MessageBusEventType';

const featureSettings = {
    configKey: 'isElementsEvent',
    isDefault: true,
    shouldRunPerContext: true,
    shouldRunPerSession: false,
    shouldRun: true,
    isFrameRelated: true,
    runInUns: false,
    runInSlave: true,
    runInLean: true,
    isRunning: false,
    instance: null,
};

export const ElementEventType = {
    input: 0,
    initial: 1,
    focus: 2,
    blur: 3,
    change: 4,
    click: 5,
    submit: 6,
};

export const EventStructure = ['eventSequence', 'timestamp', 'eventType', 'isTrusted', 'elementHash', 'length',
    'elementValues', 'selected', 'hashedValue' ,'relativeTime'];

class ElementEventCollector extends DataCollector {
    static getDefaultSettings() {
        return featureSettings;
    }

    /**
     * Designated ElementEvents Class Builder
     * @returns {Builder}
     * @constructor
     */
    static get Builder() {
        class Builder {
            constructor(configurationRepository, utils, domUtils, elements, dataQ, configuration) {
                this.configurationRepository = configurationRepository;
                this.utils = utils;
                this.domUtils = domUtils;
                this.elements = elements;
                this.dataQ = dataQ;
                this.maxShadowDepth = configuration.getMaxShadowDepth();
                this.iframeLoadingTimeout = configuration.getIframeLoadingTimeout();
            }

            withMessageBus(messageBus) {
                this.messageBus = messageBus;
                return this;
            }

            withMutationEmitter(mutationEmitter) {
                this.mutationEmitter = mutationEmitter;
                return this;
            }

            withjQueryElementListenerSiteMapper(jQueryElementListenerSiteMapper) {
                this.jQueryElementListenerSiteMapper = jQueryElementListenerSiteMapper;
                return this;
            }

            withjQueryElementsHandler(JqueryElementsHandler) {
                this.JqueryElementsHandler = JqueryElementsHandler;
                return this;
            }

            withInputEvents(InputEvents, inputSelectors, MaskingService) {
                this.InputEvents = InputEvents;
                this.inputSelectors = inputSelectors;
                this.maskingService = MaskingService
                return this;
            }

            withStandardInputEventsEmitter(StandardInputEventsEmitter) {
                this.StandardInputEventsEmitter = StandardInputEventsEmitter;
                return this;
            }

            withSyntheticMaskInputEventsHandler(SyntheticMaskInputEventsHandler) {
                this.SyntheticMaskInputEventsHandler = SyntheticMaskInputEventsHandler;
                return this;
            }

            withSyntheticAutotabInputEventsHandler(SyntheticAutotabInputEventsHandler) {
                this.SyntheticAutotabInputEventsHandler = SyntheticAutotabInputEventsHandler;
                return this;
            }

            withClickEvents(ClickEvents, onClickSelectors) {
                this.ClickEvents = ClickEvents;
                this.onClickSelectors = onClickSelectors;
                return this;
            }

            withStandardOnClickEventsEmitter(StandardOnClickEventsEmitter) {
                this.StandardOnClickEventsEmitter = StandardOnClickEventsEmitter;
                return this;
            }

            withSelectElementEvents(SelectElementEvents, onSelectSelectors) {
                this.SelectElementEvents = SelectElementEvents;
                this.onSelectSelectors = onSelectSelectors;
                return this;
            }

            withStandardOnChangeEventsEmitter(StandardOnChangeEventsEmitter) {
                this.StandardOnChangeEventsEmitter = StandardOnChangeEventsEmitter;
                return this;
            }

            withElementFocusEventsEmitter(ElementFocusEventsEmitter) {
                this.ElementFocusEventsEmitter = ElementFocusEventsEmitter;
                return this;
            }

            withElementBlurEventsEmitter(ElementBlurEventsEmitter) {
                this.ElementBlurEventsEmitter = ElementBlurEventsEmitter;
                return this;
            }

            withFormEvents(FormEvents, onFormSelectors) {
                this.FormEvents = FormEvents;
                this.onFormSelectors = onFormSelectors;
                return this;
            }

            withStandardOnFormEventsEmitter(StandardOnFormEventsEmitter) {
                this.StandardOnFormEventsEmitter = StandardOnFormEventsEmitter;
                return this;
            }

            withCustomInputEventEmitter(CustomInputEvents, StandardCustomInputEmitter) {
                this.CustomInputEvents = CustomInputEvents;
                this.StandardCustomInputEmitter = StandardCustomInputEmitter;
                return this;
            }

            build() {
                return new ElementEventCollector(this);
            }
        }

        return Builder;
    }

    constructor(builder) {
        super();
        this._configurationRepository = builder.configurationRepository;
        this._utils = builder.utils;
        this._domUtils = builder.domUtils;
        this._dataQ = builder.dataQ;
        this._elements = builder.elements;
        this._jQueryElementListenerSiteMapper = builder.jQueryElementListenerSiteMapper;

        this._jQueryElementListenerSiteMapper.updateObserver(this._onSiteMapperMatch);

        this._messageBus = builder.messageBus;
        this._mutationEmitter = builder.mutationEmitter;
        this._messageBus.subscribe(MessageBusEventType.MutationSingleEvent, this.mutationMessageHandler);

        this._StandardInputEventsEmitter = builder.StandardInputEventsEmitter;
        this._SyntheticMaskInputEventsHandler = builder.SyntheticMaskInputEventsHandler;
        this._SyntheticAutotabInputEventsHandler = builder.SyntheticAutotabInputEventsHandler;
        this._maskingService = builder.maskingService;
        this._inputEvents = new builder.InputEvents(
            this._elements,
            this.sendToQueue.bind(this),
            this._utils,
            this._messageBus,
            this._StandardInputEventsEmitter,
            this._SyntheticMaskInputEventsHandler,
            this._SyntheticAutotabInputEventsHandler,
            this._maskingService,
            builder.maxShadowDepth,
            builder.iframeLoadingTimeout
        );
        this._inputSelectors = builder.inputSelectors;

        this._StandardOnClickEventsEmitter = builder.StandardOnClickEventsEmitter;

        if (
            this._configurationRepository.get(ConfigurationFields.parentElementSelector) &&
            this._configurationRepository.get(ConfigurationFields.childElementWithCustomAttribute) &&
            this._configurationRepository.get(ConfigurationFields.elementDataAttribute)
        ) {
            this._StandardCustomInputEmitter = builder.StandardCustomInputEmitter;
            this._inputElementSettings = {
                parentElementSelector: this._configurationRepository.get(ConfigurationFields.parentElementSelector),
                childElementWithCustomAttribute: this._configurationRepository.get(
                    ConfigurationFields.childElementWithCustomAttribute
                ),
                elementDataAttribute: this._configurationRepository.get(ConfigurationFields.elementDataAttribute),
                customButtons: this._configurationRepository.get(ConfigurationFields.customButtons),
            };
            this._customInputEvents = new builder.CustomInputEvents(
                this._elements,
                this.sendToQueue.bind(this),
                this._utils,
                this._messageBus,
                this._StandardCustomInputEmitter,
                this._maskingService,
                (this.inputElementSettings = this._inputElementSettings)
            );
        }

        this._clickEvents = new builder.ClickEvents(
            this.sendToQueue.bind(this),
            this._utils,
            this._messageBus,
            this._configurationRepository,
            this._StandardOnClickEventsEmitter,
            this._maskingService,
            this._elements,
            builder.maxShadowDepth,
            builder.iframeLoadingTimeout,
        );
        this._onClickSelectors = builder.onClickSelectors;

        this._StandardOnChangeEventsEmitter = builder.StandardOnChangeEventsEmitter;
        this._elementFocusEventEmitter = builder.ElementFocusEventsEmitter
        this._elementBlurEventEmitter = builder.ElementBlurEventsEmitter
        this._selectElementEvents = new builder.SelectElementEvents(
            this.sendToQueue.bind(this),
            this._utils,
            this._messageBus,
            this._StandardOnChangeEventsEmitter,
            this._elementFocusEventEmitter,
            this._elementBlurEventEmitter,
            this._configurationRepository,
            this._maskingService,
            builder.maxShadowDepth,
            builder.iframeLoadingTimeout,
        );
        this._onSelectSelectors = builder.onSelectSelectors;

        this._StandardOnFormEventsEmitter = builder.StandardOnFormEventsEmitter;
        this._formEvents = new builder.FormEvents(
            this.sendToQueue.bind(this),
            this._messageBus,
            this._StandardOnFormEventsEmitter,
            builder.maxShadowDepth,
            builder.iframeLoadingTimeout,
        );
        this._onFormSelectors = builder.onFormSelectors;

        this._jqueryEventHandler = builder.JqueryElementsHandler;

        this._maxElemValLength = 200;
        this._hashTruncationLength = this._configurationRepository.get('elementHashTruncationLength') || 2;
    }

    mutationMessageHandler = (message) => {
        if (message.browserContext) {
            this._inputEvents.addOnLoadInputData(message.browserContext, true);
            this._inputEvents.bind(message.browserContext);
            this._clickEvents.addOnLoadInputData(message.browserContext, true);
            this._clickEvents.bind(message.browserContext);
            this._selectElementEvents.bind(message.browserContext);
            this._formEvents.bind(message.browserContext);
            this._customInputEvents?.addOnLoadInputData(message.browserContext, true);
            this._customInputEvents?.bind(message.browserContext);
        }
    }

    /**
     * @param {BrowserContext} browserContext
     */
    startFeature = (browserContext) => {
        this._inputEvents.addOnLoadInputData(browserContext, false);
        this._inputEvents.bind(browserContext);
        this._clickEvents.addOnLoadInputData(browserContext, false);
        this._clickEvents.bind(browserContext);
        this._selectElementEvents.bind(browserContext);
        this._customInputEvents?.addOnLoadInputData(browserContext, false);
        this._customInputEvents?.bind(browserContext);
        this._formEvents.bind(browserContext);
        if (this._configurationRepository.get(ConfigurationFields.isMutationObserver)
            && this._mutationEmitter) {
            this._mutationEmitter.startObserver(browserContext);
            this._jQueryElementListenerSiteMapper.initTracking();
        }
    };

    /**
     * @param {BrowserContext} browserContext
     */
    stopFeature(browserContext) {
        this._inputEvents.unbind(browserContext);
        this._clickEvents.unbind(browserContext);
        this._selectElementEvents.unbind(browserContext);
        this._customInputEvents?.unbind(browserContext);
        this._formEvents.unbind(browserContext);

        this._jQueryElementListenerSiteMapper.stopTracking();
        this._mutationEmitter.stopObserver(browserContext);
    }

    /**
     * @param {BrowserContext} browserContext
     */
    updateFeatureConfig(browserContext) {
        if (this._configurationRepository.get('isMutationObserver') && this._mutationEmitter) {
            this._mutationEmitter.startObserver(browserContext);
            this._jQueryElementListenerSiteMapper.onConfigUpdate(this._configurationRepository);
        }

        this._hashTruncationLength = this._configurationRepository.get('elementHashTruncationLength') !== undefined
            ? this._configurationRepository.get('elementHashTruncationLength') : this._hashTruncationLength;
        this._elements.updateFeatureConfig();
        this._selectElementEvents.updateSettings(browserContext);
    }

    /**
     *
     * @param matchedMapping
     * @private
     */
    _onSiteMapperMatch = (matchedMapping) => {
        const { selector } = matchedMapping;

        if (!selector) {
            Log.warn('ElementEvents._onSiteMapperMatch - No selector defined for match.'
                + ' Aborting jQuery element listening process.');
            return;
        }

        try {
            const element = window.document.querySelector(selector);

            if (!element) {
                Log.error(`ElementEvents._onSiteMapperMatch - selector:${JSON.stringify(selector)} not found on page`);
                return;
            }

            if (this._domUtils.matches(element, this._inputSelectors)) {
                this._jqueryEventHandler.bindInputEvents(element);
            } else if (this._domUtils.matches(element, this._onClickSelectors)) {
                this._jqueryEventHandler.bindOnClickEvents(element);
            } else if (this._domUtils.matches(element, this._onSelectSelectors)) {
                this._jqueryEventHandler.bindOnChangeEvents(element);
            } else if (this._domUtils.matches(element, this._onFormSelectors)) {
                this._jqueryEventHandler.bindOnFormsEvents(element);
            } else {
                Log.error(`ElementEvents._onSiteMapperMatch - Unable to match the element with selector:
                ${JSON.stringify(selector)} to any selectors group. Aborting jQuery element listening process.`);
            }
        } catch (ex) {
            Log.error(`ElementEvents._onSiteMapperMatch - ${ex.message}`, ex);
        }
    }

    sendToQueue(e, eventData) {
        const isTrusted = IsTrustedValue[e.isTrusted];
        const time = this.getEventTimestamp(e);
        const relativeTimestamp = this.getTimestampFromEvent(e);
        let type = ElementEventType[e.type];

        if (this._utils.isUndefinedNull(type)) {
            type = -1;
        }

        const element = this._elements.getElementHashFromEvent(e);
        const eventSeq = this._utils.StorageUtils.getAndUpdateEventSequenceNumber();
        eventData = eventData || {};
        if (eventData.elementValues && eventData.elementValues.length > this._maxElemValLength) {
            eventData.elementValues = '';
        }

        const fullEventData = {...eventData, ...{
                eventType: type,
                eventSequence: eventSeq,
                timestamp: time,
                elementHash: element,
                isTrusted: isTrusted,
                hashedValue: '',
                relativeTime: relativeTimestamp,
            }}

        this._dataQ.addToQueue('element_events',
            this._utils.convertToArrayByMap(EventStructure, fullEventData),
            true);
    }
}

export default ElementEventCollector;