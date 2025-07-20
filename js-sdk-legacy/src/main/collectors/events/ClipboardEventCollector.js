// eslint-disable-next-line max-classes-per-file
import DataCollector from '../DataCollector';
import Log from '../../technicalServices/log/Logger';
import { MessageBusEventType } from '../../events/MessageBusEventType';

const featureSettings = {
    configKey: 'isClipboardEvent',
    isDefault: true,
    shouldRunPerContext: false,
    shouldRunPerSession: false,
    shouldRun: true,
    isFrameRelated: true,
    runInUns: false,
    runInSlave: true,
    runInLean: true,
    isRunning: false,
    instance: null,
};

export const ClipboardEventType = {
    copy: 0,
    paste: 1,
    cut: 2,
};

export const EventStructure = ['eventSequence', 'timestamp', 'clipboardEventType', 'elementHash', 'copiedText'];

class ClipboardEventCollector extends DataCollector {
    static getDefaultSettings() {
        return featureSettings;
    }

    static get Builder() {
        class Builder {
            constructor(utils, elements, dataQ, configuration) {
                this.utils = utils;
                this.dataQueue = dataQ;
                this.elements = elements;
                this.maxShadowDepth = configuration.getMaxShadowDepth();
                this.iframeLoadingTimeout = configuration.getIframeLoadingTimeout();
            }

            withMessageBus(messageBus) {
                this.messageBus = messageBus;
                return this;
            }

            withCutEventEmitter(cutEventEmitter) {
                this.cutEventEmitter = cutEventEmitter;
                return this;
            }

            withCopyEventEmitter(copyEventEmitter) {
                this.copyEventEmitter = copyEventEmitter;
                return this;
            }

            withPasteEventEmitter(pasteEventEmitter) {
                this.pasteEventEmitter = pasteEventEmitter;
                return this;
            }

            build() {
                return new ClipboardEventCollector(this);
            }
        }

        return Builder;
    }

    /**
     *
     * @param utils
     * @param elements
     * @param dataQ
     */
    constructor(builder) {
        super();
        this._utils = builder.utils;
        this._dataQueue = builder.dataQueue;
        this._elements = builder.elements;
        this._messageBus = builder.messageBus;
        this._cutEventEmitter = builder.cutEventEmitter;
        this._copyEventEmitter = builder.copyEventEmitter;
        this._pasteEventEmitter = builder.pasteEventEmitter;
        this._maxShadowDepth = builder.maxShadowDepth;
        this._iframeLoadingTimeout = builder.iframeLoadingTimeout
    }

    /**
     * @param {BrowserContext} browserContext
     */
    startFeature = (browserContext) => {
        try {
            const currDocument = browserContext.getDocument();

            this._cutEventEmitter.start(currDocument);
            this._copyEventEmitter.start(currDocument);
            this._pasteEventEmitter.start(currDocument);

            browserContext.collectAllElementsBySelectorAsync('iframe', this._maxShadowDepth, this._iframeLoadingTimeout)
                .then((iframes) => {
                    iframes.forEach((iframe) => {
                        if (iframe && iframe.contentDocument) {
                            this._cutEventEmitter.start(iframe.contentDocument);
                            this._copyEventEmitter.start(iframe.contentDocument);
                            this._pasteEventEmitter.start(iframe.contentDocument);
                        }
                    });
                })


            this._messageBus.subscribe(MessageBusEventType.CutEvent, this._handleClipboardEvent);
            this._messageBus.subscribe(MessageBusEventType.CopyEvent, this._handleClipboardEvent);
            this._messageBus.subscribe(MessageBusEventType.PasteEvent, this._handleClipboardEvent);

        } catch (err) {
            Log.error(`Failed starting the ClipboardEvents feature. msg: ${err.message}`, err);
        }
    };

    /**
     * @param {BrowserContext} browserContext
     */
    stopFeature(browserContext) {
        try {
            const currDocument = browserContext.getDocument();

            this._cutEventEmitter.stop(currDocument);
            this._copyEventEmitter.stop(currDocument);
            this._pasteEventEmitter.stop(currDocument);

            browserContext.collectAllElementsBySelectorAsync('iframe', this._maxShadowDepth, this._iframeLoadingTimeout)
                .then((iframes) => {
                    iframes.forEach((iframe) => {
                        if (iframe && iframe.contentDocument) {
                            this._cutEventEmitter.stop(iframe.contentDocument);
                            this._copyEventEmitter.stop(iframe.contentDocument);
                            this._pasteEventEmitter.stop(iframe.contentDocument);
                        }
                    });
                })


            this._messageBus.unsubscribe(MessageBusEventType.CutEvent, this._handleClipboardEvent);
            this._messageBus.unsubscribe(MessageBusEventType.CopyEvent, this._handleClipboardEvent);
            this._messageBus.unsubscribe(MessageBusEventType.PasteEvent, this._handleClipboardEvent);
        } catch (err) {
            Log.error(`Failed stopping the ClipboardEvents feature. msg: ${err.message}`, err);
        }
    }

    _handleClipboardEvent = (e) => {
        this._sendToQueue(e);
    }

    _sendToQueue = (e) => {
        try {
            const time = this.getEventTimestamp(e);
            const element = this._elements.getElementHashFromEvent(e);
            const eventSeq = this._utils.StorageUtils.getAndUpdateEventSequenceNumber();

            let textValue = e.clipboardData ? e.clipboardData.getData('text')
                : window.clipboardData ? window.clipboardData.getData('text') : '';
            textValue = textValue || '';
            // mask all chars, but preserve length
            if (textValue !== '') {
                textValue = textValue.replace(/[\d]/g, '1').replace(/[a-zA-Z]/g, 'a').replace(/[^a-zA-Z\d]/g, '*');
            }

            let type = ClipboardEventType[e.type];
            if (this._utils.isUndefinedNull(type)) {
                type = -1;
            }

            this._dataQueue.addToQueue('clipboard_events',
                this._utils.convertToArrayByMap(EventStructure,
                    {
                        eventSequence: eventSeq,
                        timestamp: time,
                        elementHash: element,
                        copiedText: textValue,
                        clipboardEventType: type,
                    }));
        } catch (error) {
            Log.error(`Failed handling ClipboardEvent. msg: ${error.message}`, error);
        }
    }
}

export default ClipboardEventCollector;
