import DataCollector from '../DataCollector';

const featureSettings = {
        configKey: 'isFilesFeature',
        isDefault: false,
        shouldRunPerContext: false,
        shouldRunPerSession: true,
        shouldRun: true,
        isFrameRelated: false,
        runInUns: false,
        runInSlave: false,
        runInLean: false,
        isRunning: false,
        instance: null,
};

export default class FilesFeature extends DataCollector {
    static getDefaultSettings() {
        return featureSettings;
    }

    constructor(configurationRepository, utils, sessionService, muidService, cidCache) {
        super();
        this._utils = utils;
        this._configurationRepository = configurationRepository;
        this._sessionService = sessionService;
        this._muidService = muidService;
        this._cidCache = cidCache;
    }

    /**
     * generic function for commends of getting files for different purposes
     * is list is empty or null do not run
     *
     * All the parameters need to be updated in order to call the feature
     */
    getFiles() {
        if (this._customerId && this._muid && this._sid && this._addrList && this._addrList.length > 0) {
            let url;
            for (let i = 0; i < this._addrList.length; i++) {
                // build url
                url = this._addrList[i] + '?cid=' + this._customerId + '&snum=' + this._sid + '&muid=' + this._muid;
                this._utils.getPostUrl(url, 'GET', null, null, null);
                this._isSent = true;
            }
        }
    }

    startFeature() {
        this._isSent = false;
        try {
            this._addrList = JSON.parse(this._configurationRepository.get('getAddrList'));
        } catch (ex) {
            this._addrList = '';
        }

        this._customerId = this._cidCache.get() || '';
        this._muid = this._muidService?.muid || '';
        this._sid = this._sessionService.sessionId || '';
        this.getFiles();
    }

    updateFeatureConfig() {
        try {
            this._addrList = JSON.parse(this._configurationRepository.get('getAddrList'));
        } catch (ex) {
            this._addrList = '';
        }
        this._customerId = this._cidCache.get() || '';
        this._muid = this._muidService?.muid || '';
        this._sid = this._sessionService.sessionId || '';
        if (!this._isSent) {
            this.getFiles();
        }
    }
}
