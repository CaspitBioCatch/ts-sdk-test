import DataCollector from '../DataCollector';

const featureSettings = {
    configKey: 'isStorageEvents',
    isDefault: false,
    shouldRunPerContext: false,
    shouldRunPerSession: false,
    shouldRun: false,
    isFrameRelated: false,
    runInSlave: false,
    runInLean: false,
    runInUns: false,
    isRunning: false,
    instance: null,
};

const StorageEventType = {
    'storage': 0,
};

const EventStructure = ['eventSequence', 'timestamp', 'keys', 'action', 'tabsOpened']; // "keys" - what keys were changed. "area" - the name of the storage area - 'sync', 'local' or 'managed'

export default class StorageEventCollector extends DataCollector {
    static getDefaultSettings() {
        return featureSettings;
    }

    constructor(utils, elements, dataQ, msgBus) {
        super();
        this._utils = utils;
        this._dataQ = dataQ;
        this._elements = elements;
        this._msgBus = msgBus;
        this._onAllStorageEventBinded = this._onAllStorageEvent.bind(this);
    }

    /**
     * @param {BrowserContext} browserContext
     */
    startFeature(browserContext) {
        this._bind(browserContext);
    }

    /**
     * @param {BrowserContext} browserContext
     */
    stopFeature(browserContext) {
        this._unbind(browserContext);
    }

    _addToCommunicationQueue(type, keys, action, tabsopened, e) {
        if (type === StorageEventType.storage) {
            this._msgBus.publish('storageEvent', { action: type });
        }

        const time = this.getEventTimestamp(e);

        const eventSeq = this._utils.StorageUtils.getAndUpdateEventSequenceNumber();

        this._dataQ.addToQueue('storage_events',
            this._utils.convertToArrayByMap(EventStructure, {
                eventSequence: eventSeq,
                timestamp: time,
                keys,
                action,
                tabsOpened: tabsopened,
            }));
    }

    /**
     * @param {BrowserContext} browserContext
     * @private
     */
    _bind(browserContext) {
        let eventsToListen;
        const windowContext = browserContext.Context;

        if (windowContext.localStorage || windowContext.sessionStorage) {
            eventsToListen = ['storage'];
        }

        this._listeningToEvents = eventsToListen;
        if (this._listeningToEvents.length > 0) {
            for (let i = 0; i < this._listeningToEvents.length; i++) {
                this._utils.addEventListener(windowContext, this._listeningToEvents[i],
                    this._onAllStorageEventBinded, true);
            }
        }
    }

    /**
     * @param {BrowserContext} browserContext
     * @private
     */
    _unbind(browserContext) {
        if (this._listeningToEvents) {
            for (let i = 0; i < this._listeningToEvents.length; i++) {
                this._utils.removeEventListener(browserContext.Context, this._listeningToEvents[i], this._onAllStorageEventBinded, true);
            }
        }
    }

    _onAllStorageEvent(e) {
        switch (e.type) {
            case 'storage':
                this._onStorageEvent(e);
                break;
            default:
        }

        return true;
    }

    /**
     *
     * @param e
     * @private
     */
    _onStorageEvent(e) {
        let tabs = false;
        let keys = null;
        let action = null;
        if (e.key === null) {
            keys = null;
        }
        if (typeof e.key === 'string' && e.newValue === null) {
            keys = e.key;
            action = 'delete';
        } else {
            keys = e.key;
            action = 'update';
        }
        const tabList = this._utils.StorageUtils.getFromLocalStorage('cdTabList');
        if (tabList && typeof tabList[0] === 'object') {
            tabs = true;
        }
        tabs = tabs ? 1 : 0;
        this._addToCommunicationQueue(e.type, keys, action, tabs, e);
    }
}
