import DataCollector from '../DataCollector';
import Log from '../../technicalServices/log/Logger';

const featureSettings = {
    configKey: 'isTabsEvents',
    isDefault: true,
    shouldRunPerContext: false,
    shouldRunPerSession: false,
    shouldRun: true,
    isFrameRelated: false,
    runInSlave: false,
    runInLean: false,
    runInUns: false,
    isRunning: false,
    instance: null,
};

export const TabEventType = {
    openTab: 0,
    newTab: 1,
    closeTab: 2,
};

export const EventStructure = ['eventSequence', 'timestamp', 'type', 'id', 'href', 'referrer', 'currentTabsList'];

/**
 * Identify tabs and manage this info and send to server
 *
 * https://stackoverflow.com/questions/1366483/javascript-sharing-data-between-tabs
 * local storage is shared between tabs and storage event fires when other tabs
 * make changes to localStorage. This is quite handy for communication purposes.
 */
export default class TabEventCollector extends DataCollector {
    static getDefaultSettings() {
        return featureSettings;
    }

    constructor(utils, dataQ) {
        super();
        this._utils = utils;
        this._currState = null;
        this._dataQueue = dataQ;

        this._tabData = {
            id: '',
            openTabTS: 0,
        };
        this._onUnloadTabBinded = this._onUnloadTab.bind(this);

    }

    startFeature() {
        Log.info('Starting tab events feature');
        this._initTabInfo();
        window.addEventListener('beforeunload', this._onUnloadTabBinded);
    }

    stopFeature() {
        Log.info('Stopping tab events feature');
        window.removeEventListener('beforeunload', this._onUnloadTabBinded);
    }

    /**
     * save the tab id in the session storage, so a new tab will not have an id
     * and the list in local storage
     * we can reach this function on reload, reset session, etc
     */
    _initTabInfo() {
        let tabList = this._utils.StorageUtils.getFromLocalStorage('cdTabList');
        if (!tabList) {
            tabList = [];
        }
        // if tab data already exists it might refresh etc
        let type = TabEventType.openTab;

        this._tabData = this._utils.StorageUtils.getFromSessionStorage('cdTabData') || this._tabData.id;
        // session storage is not saved between tabs except on duplicate
        // local storage is saved between tabs
        // if no data in session storage
        // except for IE - which works the other way around
        if (!this._tabData) {
            this._updateTabData();
            type = TabEventType.newTab;
        }

        let index = -1;
        for (let i = 0, len = tabList.length; i < len; i++) {
            if (tabList[i][0] === this._tabData.id) {
                index = i;
                break;
            }
        }

        // if tab is not in the list, add it
        // can happen on new tab, or reload
        if (index === -1 || index === tabList.length) {
            // need to add every time if doesn't exist since every unload it's removed (refresh/reload page)
            tabList.push([this._tabData.id, this._tabData.openTabTS]);
            this._utils.StorageUtils.saveToLocalStorage('cdTabList', tabList);
            Log.debug('added tab to list. ' + this._tabData.id + ', tab index=' + tabList.length);
        }

        const url = this._utils.getDocUrl();
        const eventSeq = this._utils.StorageUtils.getAndUpdateEventSequenceNumber();
        const tabListStr = JSON.stringify(tabList);

        this._dataQueue.addToQueue('tab_events',
            this._utils.convertToArrayByMap(EventStructure,
                {
                    eventSequence: eventSeq,
                    timestamp: this._tabData.openTabTS,
                    type,
                    id: this._tabData.id || '',
                    href: url || '',
                    referrer: this._utils.clearTextFromNumbers(document.referrer),
                    currentTabsList: tabListStr || '',
                }));
    }

    /**
     * Remove the tab info on tab close, after sending th list of tabs
     * can be also on reload, load other page etc
     */
    _onUnloadTab() {
        let tabList = this._utils.StorageUtils.getFromLocalStorage('cdTabList');
        if (!tabList) {
            tabList = [];
        }

        const time = this.getEventTimestamp();
        const eventSeq = this._utils.StorageUtils.getAndUpdateEventSequenceNumber();
        const url = this._utils.getDocUrl();
        const type = TabEventType.closeTab;
        const tabListStr = JSON.stringify(tabList);

        Log.debug(`removing tab from list. id:${this._tabData.id}, timestamp:${time}`);
        this._dataQueue.addToQueue('tab_events',
            this._utils.convertToArrayByMap(EventStructure,
                {
                    eventSequence: eventSeq,
                    timestamp: time,
                    type,
                    id: this._tabData.id || '',
                    href: url || '',
                    referrer: this._utils.clearTextFromNumbers(document.referrer),
                    currentTabsList: tabListStr || '',
                }), true, true);

        // remove current tab from list
        for (let i = 0, len = tabList.length; i < len; i++) {
            if (tabList[i][0] === this._tabData.id) {
                tabList.splice(i, 1);
                break;
            }
        }
        this._utils.StorageUtils.saveToLocalStorage('cdTabList', tabList);
    }

    _updateTabData() {
        this._tabData = {};
        this._tabData = {
            id: this._utils.generateUUID(),
            openTabTS: this.getEventTimestamp(),
        };

        Log.debug(`initialize tab data: id:${this._tabData.id}, timestamp:${this._tabData.openTabTS}`);
        this._utils.StorageUtils.saveToSessionStorage('cdTabData', this._tabData);
    }
}
