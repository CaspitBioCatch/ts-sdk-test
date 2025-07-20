import DataCollector from '../DataCollector';
import Log from '../../technicalServices/log/Logger';

const featureSettings = {
    configKey: 'isMetadataCollect',
    isDefault: true,
    shouldRunPerContext: false,
    shouldRunPerSession: false,
    shouldRun: true,
    isFrameRelated: false,
    runInSlave: true,
    runInLean: true,
    runInUns: false,
    isRunning: false,
    instance: null,
};

export default class MetadataCollector extends DataCollector {
    static getDefaultSettings() {
        return featureSettings;
    }

    constructor(configurationRepository, dataQ, metaDataSiteMapper, utils) {
        super();
        this._configurationRepository = configurationRepository;
        this._dataQ = dataQ;
        this._metaDataSiteMapper = metaDataSiteMapper;
        this._utils = utils;
        this._metaDataSiteMapper.updateObserver(this.onSiteMapperMatch.bind(this));
    }

    startFeature() {
        this._metaDataSiteMapper.initTracking();
    }

    stopFeature() {
        this._metaDataSiteMapper.stopTracking();
    }

    onSiteMapperMatch(matchedMapping) {
        Log.debug(`Metadata Collector mapper match - ${JSON.stringify(matchedMapping)}`);
        if (matchedMapping.metaVal) {
            this._dataQ.addToQueue('metadata_map', [null, matchedMapping.metaVal, this._utils.dateNow()]);
        }
    }

    updateFeatureConfig() {
        this._metaDataSiteMapper.onConfigUpdate(this._configurationRepository);
    }
}
