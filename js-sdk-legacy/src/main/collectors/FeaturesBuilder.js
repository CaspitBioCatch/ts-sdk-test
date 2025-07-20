import Log from "../technicalServices/log/Logger";

/*
 *
 * @param allFeatures: A FeatureList object contains all the features
 * @param utils: utilites object supplied to the features that needs it
 * @param elements: An Elements object supplied to the features that needs it
 * @param mutationObserver
 * @param dataQueue: The Q that each of the features will fill with data
 * @param sessionService: handles sid and csid
 * @param muidService: handles and holds muid
 * @param perfMonitor: sends performance data, start and end times for features
 * @param sensorDataQ: handles history buffer for sensor events near touch events
 * @param msgBus: communicator between modules
 * @constructor
 */
export default class FeaturesBuilder {
    /* eslint-disable no-bitwise, no-restricted-syntax */

    constructor(allFeatures, configurationRepository, utils, elements, mutationObserver, dataQueue, devDebugDataQ, configurations,
                sessionService, muidService, muidEncryptedService, perfMonitor, sensorDataQ, msgBus, cidCache, sameCharService, maskingService, contextMgr) {
        this._features = allFeatures;
        this._configurationRepository = configurationRepository; // Don't remove! Its used by the features
        this._utils = utils;
        this._elements = elements; // TODO: consider to change name to elementUtils
        this._mutationObserver = mutationObserver;
        this._dataQ = dataQueue;
        this._devDebugDataQueue = devDebugDataQ;
        this._sessionService = sessionService;
        this._muidService = muidService;
        this._muidEncryptedService = muidEncryptedService;
        this._perfMonitor = perfMonitor;
        this._sensorDataQ = sensorDataQ;
        this._msgBus = msgBus;
        this._cidCache = cidCache;
        this._sameCharService = sameCharService;
        this._maskingService = maskingService;
        this._configurations = configurations;
        this._contextMgr = contextMgr;
    }

    buildFeatures() {
        const me = this;
        function buildFeaturesInList(featureList) {
            if (!featureList) {
                return;
            }

            Object.keys(featureList).forEach((featureKey) => {
                const feature = featureList[featureKey];
                try {
                    feature.init.apply(me);
                } catch (e) {
                    const name = feature.name || featureKey;
                    Log.error(`Failed to initialize feature "${name}": ${e.message}\nStack: ${e.stack}`);
                    // Its a static list, so it will remove it from all parts of code.
                    // Best option for now, because if we don't delete the item, it will use it as null which cause to error in other parts of code
                    delete featureList[featureKey]; // Remove the feature if it fails initialization
                }
            });
            
        }

        buildFeaturesInList(this._features.list);
    }

}
