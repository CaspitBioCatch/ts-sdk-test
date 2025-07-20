import DataCollector from '../DataCollector';
import Log from '../../technicalServices/log/Logger';
import { MessageBusEventType } from '../../events/MessageBusEventType';
import BrowserContext from '../../core/browsercontexts/BrowserContext';
import { ConfigurationFields } from '../../core/configuration/ConfigurationFields';
import { SystemFrameName } from '../../core/frames/SystemFrameName';

const featureSettings = {
    configKey: 'isCrossdomain',
    isDefault: false,
    shouldRunPerContext: false,
    shouldRunPerSession: false,
    shouldRun: true,
    isFrameRelated: false,
    runInUns: false,
    runInSlave: false,
    runInLean: false,
    isRunning: false,
    instance: null,
};

export const CrossmuidEventType = {
    found: 0,
    new: 1,
};

// REGEX to detect usage of child-src with Content Security Policy meta tag
export const CSP_REGEX = /(?=(child\-src)|(frame\-src))([^;]+)/gi;
// REGEX to detect domain URL excluding request uri
export const DOMAIN_REGEX = /http[s]?:\/\/([^\/]+)/gi;

// Domain states props template
export const DOMAIN_STATES_PROPS = {
    resource: null,
    iframeElement: false, // Iframe element appended to DOM
    blockedByCSP: false, // CSP child-src rule is used without the domains occurrence
    iframeLoaded: false, // Iframe event has been received
    ACKMessageSent: false, // ACK message has been sent (always include generated muid)
    ACKMessageRecieved: false, // ACK message has been received in the cross client script
    unavailable: false, // Domain is not available - do not report again
};

export const EventStructure = ['eventSequence', 'timestamp', 'eventType', 'domainUrl', 'muid'];

class CrossDomainMuidCollector extends DataCollector {
    static getDefaultSettings() {
        return featureSettings;
    }

    /**
     * Returns a CrossDomain DataCollector builder
     * @returns {Builder}
     * @constructor
     */
    static get Builder() {
        class Builder {
            constructor(configurationRepository, dataQ, utils, domUtils, eventType) {
                this.configurationRepository = configurationRepository;
                this.dataQ = dataQ;
                this.utils = utils;
                this.domUtils = domUtils;
                this.eventType = eventType;
            }

            /**
             * @param {MessageBus} messageBus
             * @returns {Builder}
             */
            withMessageBus(messageBus) {
                this.messageBus = messageBus;
                return this;
            }

            /**
             *
             * @param {WindowMessageEventEmitter} windowMessageEventEmitter
             * @returns {Builder}
             */
            withWindowMessageEventEmitter(windowMessageEventEmitter) {
                this.windowMessageEventEmitter = windowMessageEventEmitter;
                return this;
            }

            build() {
                return new CrossDomainMuidCollector(this);
            }
        }

        return Builder;
    }

    static generateRandomID() {
        const charset = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let randomId = '';
        for (let i = 0; i < 16; i++) {
            randomId += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return randomId;
    }

    /**
     * Use a CrossDomain builder to create a new instance
     * @param builder {Builder}
     */
    constructor(builder) {
        super();
        this._configurationRepository = builder.configurationRepository;
        this._dataQ = builder.dataQ;
        this._utils = builder.utils;
        this._domUtils = builder.domUtils;
        this._eventType = builder.eventType;
        this._messageBus = builder.messageBus;
        this._windowMessageEmitter = builder.windowMessageEventEmitter;
        this._messageBus.subscribe(MessageBusEventType.WindowMessageEvent, this.windowMessageHandler);
        // Cross client MUID to be sent by default for every domain provided
        this._generatedMUID = this._utils.dateNow() + '-' + this._utils.generateUUID().toUpperCase();
        this._domainsStates = {};
        // Full domain resources list provided by the config manager
        this._domainsResources = [];
        // Actual domains array used for internal iteration
        this._domains = [];
        this._domainsTimeoutFunc = null;
    }

    /**
     * Iterate over the domains and create a default state for each domain
     * Detect domains in CSP meta tag
     * Start connection between Cross Domain feature and the cross client domains
     * @param {BrowserContext} browserContext
     */
    startFeature = (browserContext) => {
        // Expecting a list of domains
        this._domainsResources = this._configurationRepository.get(ConfigurationFields.crossDomainsList);
        this._crossDomainsTimeout = this._configurationRepository.get(ConfigurationFields.crossDomainsTimeout);
        if (Array.isArray(this._domainsResources) && this._domainsResources.length > 0) {
            // Start window Message event observing
            this._windowMessageEmitter.startObserver(browserContext);
            this._domainsResources.forEach((element) => {
                const _domainMatch = element.match(DOMAIN_REGEX);
                if (_domainMatch !== null && typeof _domainMatch[0] === 'string') {
                    const _domain = _domainMatch[0];
                    if (typeof this._domainsStates[_domain] === 'object') return;
                    this._domainsStates[_domain] = { ...DOMAIN_STATES_PROPS };
                    this._domainsStates[_domain].resource = element;
                    this._domains.push(_domain);
                }
            });

            // If invalid domains of any sort are provided, verify this._domains has at least a single valid
            // domain element that can be connected
            if (Array.isArray(this._domains) && this._domains.length > 0) {
                // Apply the Content Security Policy assertion to every available domain
                this.isBlockedByCSP(browserContext, this._domains);
                this._domUtils.onDocumentBody(browserContext.Context, () => {
                    this.connectDomains(browserContext);
                });
            }
        }
    };

    /**
     * Stop the CrossDomain's message emitter
     * @param {BrowserContext} browserContext
     */
    stopFeature = (browserContext) => {
        this._clearFeaturesObjects(browserContext);
    };

    /**
     * @param {BrowserContext} browserContext
     * @private
     */
    _clearFeaturesObjects = (browserContext) => {
        this._windowMessageEmitter.stopObserver(browserContext);
        if (Array.isArray(this._domains) && this._domains.length > 0) {
            this._domains.forEach((domain) => {
                this.clearDomElements(browserContext, domain);
            });
            this._domains = [];
            this._domainsStates = {};
        }
    };

    /**
     * Start/Continue the connection between the current window to the cross client domains
     * Once the cross domain connection is started, using setTimeout, allow up to X milliseconds
     * (using the crossDomainsTimeout directive) before removing each iframe created per a given domain.
     * @param {BrowserContext} browserContext
     * @param domains
     */
    connectDomains = (browserContext) => {
        if (Array.isArray(this._domains) && this._domains.length > 0) {
            this._domains.forEach((domain) => {
                // Do not create iframe in the following cases
                if (!this._domainsStates[domain].blockedByCSP
                    && this._domainsStates[domain].iframeElement === false) {
                    this.createIframe(browserContext, domain);
                }
            });
            this._domainsTimeoutFunc = setTimeout(() => {
                this._domains.forEach((domain) => {
                    if (typeof this._domainsStates[domain] === 'object'
                        && this._domainsStates[domain].ACKMessageRecieved === false
                        && this._domainsStates[domain].unavailable === false
                    ) {
                        Log.warn(`Cross Domain feature - domain ${domain} is unavailable`);
                        this._domainsStates[domain].unavailable = true;
                        this.clearDomElements(browserContext, domain);
                    }
                });
            }, this._crossDomainsTimeout);
        }
    };

    /**
     * Create the iframe element, setup an onload event
     * @param {BrowserContext} browserContext
     * @param domain
     */
    createIframe = (browserContext, domain) => {
        const iframe = browserContext.getDocument().createElement('iframe');
        iframe.onload = () => {
            this.postNextMessage(domain);
        };
        iframe.id = SystemFrameName.ignorePrefixFrame + CrossDomainMuidCollector.generateRandomID();
        iframe.src = this._domainsStates[domain].resource;
        iframe.style.display = 'none';
        iframe.style.opacity = '0';
        iframe.style.width = '1px';
        iframe.style.height = '1px';
        browserContext.getDocument().body.appendChild(iframe);
        this._domainsStates[domain].iframeElement = iframe;
    };

    /**
     * Clear the iframe for the requested domain
     * @param {BrowserContext} browserContext
     * @param domain
     */
    clearDomElements = (browserContext, domain) => {
        const _domainFrame = this._domainsStates[domain].iframeElement;
        if (typeof _domainFrame === 'object') {
            const _domainFrameElement = browserContext.getDocument().getElementById(this._domainsStates[domain].iframeElement.id);
            if (_domainFrameElement !== null) {
                browserContext.getDocument().body.removeChild(_domainFrame);
            }
        }
    }

    /**
     * Post the next message based on the domains state
     * Message is sent only if the ACK has not been sent and if the iframeElement is available
     * At this stage, generated MUID is sent by default whether the cross client script needs it or not
     * @param domain
     */
    postNextMessage = (domain) => {
        if (!this._domainsStates[domain].ACKMessageRecieved && this._domainsStates[domain].iframeElement) {
            const message = {
                'muid': this._generatedMUID,
            };
            this._domainsStates[domain].iframeElement.contentWindow.postMessage(
                JSON.stringify(message),
                domain,
            );
            this._domainsStates[domain].ACKMessageSent = true;
        }
    };

    /**
     * Attempt to locate a Content-Security-Policy meta tag with child-src rule
     * Updates the states of every domain if detected
     * @param {BrowserContext} browserContext
     * @param domains
     */
    isBlockedByCSP = (browserContext, domains) => {
        if (!Array.isArray(domains) || domains.length < 1) {
            throw new Error('Domains are expected for content security policy assertion');
        }
        let cspFound = false;
        [].slice.call(browserContext.getDocument().getElementsByTagName('meta')).forEach((metaElem) => {
            if (metaElem.getAttribute('http-equiv') === 'Content-Security-Policy') {
                cspFound = true;
                const cspMatch = metaElem.getAttribute('content').match(CSP_REGEX);
                domains.forEach((domain) => {
                    if (cspMatch && cspMatch[0].indexOf(domain) === -1) {
                        if (typeof this._domainsStates[domain] === 'object') {
                            this._domainsStates[domain].blockedByCSP = true;
                            Log.warn(`Cross Domain feature - domain ${domain} is blocked by CSP`);
                        }
                    }
                });
            }
            if (cspFound) return false;
        });
    };

    /**
     * Will clear the frame element immediately upon handling cross client message
     * @param message
     */
    windowMessageHandler = (message) => {
        const domain = message.message.origin;
        if (this._domainsStates.hasOwnProperty(domain)) {
            // Determine the next state based on the cross client message
            if (this._domainsStates[domain].ACKMessageRecieved === true) return;
            this._domainsStates[domain].ACKMessageRecieved = true;
            this.clearDomElements(new BrowserContext(message.message.currentTarget), domain);
            const _data = message.message.data;
            this.sendToQueue(domain, _data);
        }
    };

    /**
     * Send the found/new data to queue
     * @param domain
     * @param data
     */
    sendToQueue = (domainUrl, data) => {
        const domain = domainUrl.replace(/http[s]?:\/\//i, '');
        if (typeof data.found === 'object') {
            Object.keys(data.found).forEach((item) => {
                const eventSeq = this._utils.StorageUtils.getAndUpdateEventSequenceNumber();
                const foundKey = domain;
                const foundValue = data.found[item].split('__');
                const eventData = {
                    eventType: this._eventType.found,
                    eventSequence: eventSeq,
                    domainUrl: foundKey,
                    muid: foundValue[0],
                    timestamp: foundValue[1],
                };
                this._dataQ.addToQueue('crossmuid_event',
                    this._utils.convertToArrayByMap(EventStructure, eventData), true);
            });
        }
        if (typeof data.new === 'object') {
            Object.keys(data.new).forEach((item) => {
                const eventSeq = this._utils.StorageUtils.getAndUpdateEventSequenceNumber();
                const newKey = domain;
                const newValue = data.new[item].split('__');
                const eventData = {
                    eventType: this._eventType.new,
                    eventSequence: eventSeq,
                    domainUrl: newKey,
                    muid: newValue[0],
                    timestamp: newValue[1],
                };
                this._dataQ.addToQueue('crossmuid_event',
                    this._utils.convertToArrayByMap(EventStructure, eventData));
            });
        }
        if (typeof data.error_message === 'object') {
            Log.warn(`Cross Domain feature - domain ${domain} error. Error Message: 
                ${data.error_message} Code: ${data.error_code}`);
        }
    }

    /**
     * @param {BrowserContext} browserContext
     */
    updateFeatureConfig = (browserContext) => {
        this._domainsResources = this._configurationRepository.get(ConfigurationFields.crossDomainsList);
        this._crossDomainsTimeout = this._configurationRepository.get(ConfigurationFields.crossDomainsTimeout);
        clearTimeout(this._domainsTimeoutFunc);
        this._domainsTimeoutFunc = null;
        this.updateDomainStates(browserContext);
    }

    /**
     * Update the _domainStates object in case unhandled domains are found
     * Do not clear or remove the state of handled domains
     * @param {BrowserContext} browserContext
     */
    updateDomainStates = (browserContext) => {
        if (Array.isArray(this._domainsResources) && this._domainsResources.length > 0) {
            this._domains = [];
            this._domainsResources.forEach((element) => {
                const _domainMatch = element.match(DOMAIN_REGEX);
                if (_domainMatch !== null && typeof _domainMatch[0] === 'string') {
                    const _domain = _domainMatch[0];
                    // No need to recreated the state for existing domain
                    if (typeof this._domainsStates[_domain] !== 'object') {
                        this._domainsStates[_domain] = { ...DOMAIN_STATES_PROPS };
                        this._domainsStates[_domain].resource = element;
                    }
                    this._domains.push(_domain);
                }
            });

            // If invalid domains of any sort are provided, verify this._domains has at least a single valid
            // domain element that can be connected
            if (Array.isArray(this._domains) && this._domains.length > 0) {
                // Apply the Content Security Policy assertion to every available domain
                this.isBlockedByCSP(browserContext, this._domains);
                this._domUtils.onDocumentBody(browserContext.Context, () => {
                    this.connectDomains(browserContext);
                });
            }
        }
    };
}

export default CrossDomainMuidCollector;
