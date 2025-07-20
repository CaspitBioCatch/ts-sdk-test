import {inject} from "../../system/service";
import DataCollector from "../../src/features/events/DataCollector";

const defaultSettings = {
    configKey: '',
    shouldRun: true,
    isFrameRelated: true,
    runInUns: false,
    runInSlave: true,
    isRunning: false,
    instance: null,
};

class %%CLASSNAME%% extends DataCollector {
    static getDefaultSettings() {
        return defaultSettings;
    }

    constructor(configurationRepository, dataQ) {
        super();
        this._configurationRepository = configurationRepository;
        this._dataQ = dataQ;
    }

    startFeature = (frame) => {
        if (!frame) {
            frame = window.self;
        }
    }

    stopFeature = (frame) => {

    }

    updateFeatureConfig = (frame) => {

    }
}

export default %%CLASSNAME%%;