import Log from '../technicalServices/log/Logger';
import BrowserContext from '../core/browsercontexts/BrowserContext';
import {ConfigurationFields} from "../core/configuration/ConfigurationFields";

export default class FeatureService {
    /**
     * This class manages all the feature execution by configuration.
     * @param featuresList FeaturesList object
     * @param {FramesHandler} frameHandler is used to run features on frames
     * @param {ConfigurationRepository} configurationRepository
     * @param {DOMUtils} domUtils
     * @param {BrowserContextsCache} browserContextsCache Contains a map of browser contexts (e.g. custom handlers) collected by designated event handlers
     * @constructor
     */
    constructor(featuresList, frameHandler, configurationRepository, domUtils, utils, browserContextsCache) {
        this._features = featuresList;
        this._frameHandler = frameHandler;
        this._configurationRepository = configurationRepository;
        this._domUtils = domUtils;
        this._cdUtils = utils;
        this._browserContextsCache = browserContextsCache;
        this.callMethod = this._configurationRepository.get(ConfigurationFields.useLegacyZeroTimeout)
            ? this._cdUtils.asyncCall
            : this._cdUtils.asyncTimeoutCall;


        // This is a super hack to initialize the component for backwards compatibility.
        this.buildFrameRelatedLists();
    }

    // TODO: Get rid of this crap. We can get this by iterating over the features instead of building these arrays.
    buildFrameRelatedLists() {
        this._frameRelatedDefaultFeatures = this._collectFrameRelated(this._features.getDefaultFeatures());
        this._frameRelatedNonDefaultFeatures = this._collectFrameRelated(this._features.getNonDefaultFeatures());
    }

    runDefault() {
        Log.info('Running default features');

        // We don't check configuration was updated here like in the other feature runs because default features
        // run before configuration arrives from the server
        if (document.readyState === 'complete') {
            // Already fully loaded
            this._runFeatures(this._features.getDefaultFeatures(), this._frameRelatedDefaultFeatures);
        } else {
            window.addEventListener('load', () => {
                this._runFeatures(this._features.getDefaultFeatures(), this._frameRelatedDefaultFeatures);
            }, { once: true });
        }
    }

    stopDefault() {
        Log.info('Stopping default features');
        this._stopFeatures(this._features.getDefaultFeatures(), this._frameRelatedDefaultFeatures);
    }

    runPerSessionFeatures() {
        Log.info('Running per session features');

        if (!this._configurationRepository.isConfigurationUpdatedFromServer()) {
            Log.info("We didn't receive configurations from the server yet. Skipping per session features start until configuration arrives.");
            return;
        }

        // Start the per session features according to the configuration
        this._startFeatures(this._features.getPerSessionFeatures());
    }

    stopPerSessionFeatures() {
        Log.info('Stopping per session features');
        this._stopFeatures(this._features.getPerSessionFeatures());
    }

    runNonDefault() {
        Log.info('Running non default features');

        if (!this._configurationRepository.isConfigurationUpdatedFromServer()) {
            Log.info("We didn't receive configurations from the server yet. Skipping non default features start until configuration arrives.");
            return;
        }

        this._runFeatures(this._features.getNonDefaultFeatures(), this._frameRelatedNonDefaultFeatures);
    }

    stopNonDefault() {
        Log.info('Stopping non default features');

        this._stopFeatures(this._features.getNonDefaultFeatures(), this._frameRelatedNonDefaultFeatures);
    }

    runPerContextFeatures(contextData) {
        Log.info('Running per context features');

        if (!this._configurationRepository.isConfigurationUpdatedFromServer()) {
            Log.info("We didn't receive configurations from the server yet. Skipping per context features start until configuration arrives.");
            return;
        }

        this._runFeatures(this._features.getPerContextFeatures());

        if (contextData.name !== 'cd_auto') {
            // pass the frame related features to the FrameHandler that will start them
            this._frameRelatedDefaultFeatures && this._frameHandler.startFeatures(this._frameRelatedDefaultFeatures);
        }
    }

    stopPerContextFeatures() {
        Log.info('Stopping per context features');

        this._stopFeatures(this._features.getPerContextFeatures());
    }

    stopAllFeatures() {
        Log.info('Stopping all features');
        this.stopDefault();
        this.stopNonDefault();
        this.stopPerSessionFeatures();
        this.stopPerContextFeatures();
    }

    updateRunByConfig(configurationRepository) {
        Log.info('Updating features configuration');
        this._updateFeatures(this._features.getDefaultFeatures(), configurationRepository);
        this._updateFeatures(this._features.getNonDefaultFeatures(), configurationRepository);
        this._updateFeatures(this._features.getPerContextFeatures(), configurationRepository);

        // Don't run the per session features here. They are started once a new session starts.
        // Running them here, will cause them to run every configuration load which is every page
    }

    /**
     * Run available registered features against the provided browserContext
     * @param {BrowserContext} browserContext
     */
    runFeaturesOnBrowserContext(browserContext) {
        const defaultFeatures = this._features.getDefaultFeatures();
        if (defaultFeatures) {
            this._browserContextsCache.unRegisterContextFeatures(browserContext.Context, defaultFeatures);
            Object.keys(defaultFeatures).forEach((featureKey) => {
                const feature = defaultFeatures[featureKey];
                if (feature.shouldRun && feature.isFrameRelated) {
                    feature.isRunning = true;
                    feature.instance && this.callMethod.call(feature.instance.startFeature, feature.instance, browserContext);
                }
            });
        }
    }

    /**
     * @param {BrowserContext} browserContext
     */
    stopFeaturesOnBrowserContextRemove(browserContext) {
        const defaultFeatures = this._features.getDefaultFeatures();
        if (defaultFeatures) {
            this._browserContextsCache.unRegisterContextFeatures(browserContext.Context, defaultFeatures);
            Object.keys(defaultFeatures).forEach((featureKey) => {
                const feature = defaultFeatures[featureKey];
                if (feature.shouldRun && feature.isFrameRelated && feature.isRunning) {
                    feature.instance && this.callMethod.call(feature.instance.stopFeature, feature.instance, browserContext);
                }
            });
        }
    }

    _runFeatures(features, frameRelatedFeatures) {
        if (features) {
            Object.keys(features).forEach((featureKey) => {
                const feature = features[featureKey];
                if (feature.shouldRun) {
                    this.callMethod.call(feature.instance.startFeature, feature.instance, new BrowserContext(window.self));
                    feature.isRunning = true;
                }
            });
        }

        // TODO: Refactor this shit. Why is this here and why the duplicate startFeatures????
        if (frameRelatedFeatures) {
            // pass the frame related features to the FrameHandler that will start them
            this._frameHandler.startFeatures(frameRelatedFeatures);

            this._domUtils.onPageLoad(window, () => {
                this._frameHandler.startFeatures(frameRelatedFeatures);
            });
        }
    }

    _stopFeatures(features, frameRelatedFeatures) {
        if (features) {
            Object.keys(features).forEach((featureKey) => {
                const feature = features[featureKey];
                feature.instance.stopFeature && this.callMethod.call(feature.instance.stopFeature, feature.instance, new BrowserContext(window.self));
                feature.isRunning = false;
            });
        }

        if (frameRelatedFeatures) {
            // pass the frame related features to the FrameHandler that will start them
            this._frameHandler.stopFeatures(frameRelatedFeatures);
        }
    }

    _actOnFeature(feature, actFunc) {
        // for frame related also call framesHandler, in any case call it on window
        if (feature.isFrameRelated) {
            this._frameHandler[actFunc](feature); // The frameHandler will call start / update with callAsync
        }

        feature.instance[actFunc] && this.callMethod.call(feature.instance[actFunc], feature.instance, new BrowserContext(window.self));
    }

    /**
     * Start the list of features according to the configuration. Features will be run even, if already started
     * @param features
     * @private
     */
    _startFeatures(features) {
        if (!features) {
            return;
        }

        Object.keys(features).forEach((featureKey) => {
            const currFeature = features[featureKey];
            // Get the configuration indicating if the feature is enabled or disabled
            const configShouldRun = this._configurationRepository.get(currFeature.configKey);
            if (typeof configShouldRun === 'boolean') {
                currFeature.shouldRun = configShouldRun;
            }

            if (currFeature.shouldRun) {
                this._actOnFeature(currFeature, 'startFeature');
                currFeature.isRunning = true;
            }
        });
    }

    /**
     * Re-start features against available browser contexts
     * @param features
     * @private
     */
    _startFeatureOnBrowserContexts(feature) {
        if (!feature.isFrameRelated) return;
        const browserContexts = this._browserContextsCache.browserContexts;
        browserContexts.forEach((browserContext) => {
            if (feature.shouldRun && !this._browserContextsCache.hasFeature(browserContext.Context, feature)) {
                this._browserContextsCache.registerContextFeature(browserContext.Context, feature);
                this.callMethod.call(feature.instance.startFeature, feature.instance, browserContext);
                feature.isRunning = true;
            }
        });
    }

    /**
     * Stop features against available browser contexts
     * @param feature
     * @private
     */
    _stopFeatureOnBrowserContexts(feature) {
        if (!feature.isFrameRelated) return;
        const browserContexts = this._browserContextsCache.browserContexts;
        browserContexts.forEach((browserContext) => {
            if (this._browserContextsCache.hasFeature(browserContext.Context, feature)) {
                this.callMethod.call(feature.instance.stopFeature, feature.instance, browserContext);
            }
            feature.isRunning = false;

            if (this._browserContextsCache.exists(browserContext.Context)) {
                this._browserContextsCache.unRegisterContextFeature(browserContext.Context, feature);
            }
            this._browserContextsCache.remove(browserContext.Context);
        });
    }

    /**
     * Update a feature config against available browser contexts
     * @param feature
     * @private
     */
    _updateFeatureConfigOnBrowserContexts(feature) {
        if (!feature.isFrameRelated) return;
        const browserContexts = this._browserContextsCache.browserContexts;
        browserContexts.forEach((browserContext) => {
            if (this._browserContextsCache.hasFeature(browserContext.Context, feature)) {
                this.callMethod.call(feature.instance.updateFeatureConfig, feature.instance, browserContext);
            }
        });
    }

    _updateFeatures(features, configurationRepository) {
        if (!features) {
            return;
        }

        Object.keys(features).forEach((featureKey) => {
            const currFeature = features[featureKey];
            const configShouldRun = configurationRepository.get(currFeature.configKey);
            if (typeof configShouldRun === 'boolean') {
                currFeature.shouldRun = configShouldRun;
            }
            if (currFeature.isRunning && !currFeature.shouldRun) {
                this._actOnFeature(currFeature, 'stopFeature');
                this._stopFeatureOnBrowserContexts(currFeature);
                currFeature.isRunning = false;
            } else if (!currFeature.isRunning && currFeature.shouldRun) {
                this._actOnFeature(currFeature, 'startFeature');
                this._startFeatureOnBrowserContexts(currFeature);
                currFeature.isRunning = true;
            }

            if (currFeature.isRunning) { // in this case shouldRun == true
                // update the feature with the retrieved configuration
                this._actOnFeature(currFeature, 'updateFeatureConfig');
                this._updateFeatureConfigOnBrowserContexts(currFeature);
            }
        });
    }

    _collectFrameRelated(features) {
        const frameRelatedFeatures = [];

        if (features) {
            Object.keys(features).forEach((featureKey) => {
                const feature = features[featureKey];
                if (feature.isFrameRelated) {
                    frameRelatedFeatures.push(feature);
                }
            });
        }

        return frameRelatedFeatures;
    }
}
