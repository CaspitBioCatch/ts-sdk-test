import FramesHandlerBase from './FramesHandlerBase';
import { SystemFrameName } from './SystemFrameName';
import Log from '../../technicalServices/log/Logger';
import FrameContext from './FrameContext';
import {ConfigurationFields} from "../configuration/ConfigurationFields";

export default class FramesHandler extends FramesHandlerBase {
    constructor(framesCache, framesDetector, domUtils, utils, useLegacyZeroTimeout) {
        super();
        this._framesCache = framesCache;
        this._framesDetector = framesDetector;
        this._framesDetector.frameAdded.subscribe(this._onFrameAdded.bind(this));
        this._framesDetector.frameRemoved.subscribe(this._onFrameRemoved.bind(this));
        this._framesDetector.frameInaccessible.subscribe(this._onFrameInaccessible.bind(this));
        this._featuresList = [];
        this._domUtils = domUtils;
        this._utils = utils;

        this._framesDetector.addToIgnoreList(SystemFrameName.rtcframe);
        this._framesDetector.addToIgnoreList(SystemFrameName.fontDetectionFrame);

        this.callMethod = useLegacyZeroTimeout
            ? this._utils.asyncCall
            : this._utils.asyncTimeoutCall;


        // Startup the frames detector
        this._framesDetector.start(window.self);

        // Create the frames cache so it will be up to date with the current frames state.
        // from now on it will be updated in the frames detector events
        this._buildFramesCache();
    }

    startFeatures(features) {
        try {
            this._buildFeaturesMap(features);

            if (this._featuresList.length === 0) {
                return;
            }

            Log.debug(`startFeatures:Running features on ${this._framesCache.count} frames`);
            this._startFeaturesOnFrames(this._framesCache.contexts, features);
        } catch (ex) {
            Log.debug(`Failed to start features in FrameHandler.startFeatures: ${ex.message}`, ex);
        }
}

    startFeature(feature) {
        try {
            // Add the feature to the features map
            this._featuresList.push(feature);

            feature.isRunning = true;
            this._startFeaturesOnFrames(this._framesCache.contexts, [feature]);
        } catch (ex) {
            Log.debug(`Failed to start feature in FrameHandler.startFeature: ${ex.message}`, ex);
        }
    }

    stopFeatures(features) {
        try {
            this._stopFeaturesOnFrames(features, this._framesCache.contexts);
        } catch (ex) {
            Log.debug(`Failed to stop features in FrameHandler.stopFeatures: ${ex.message}`, ex);
        }
    }

    stopFeature(feature) {
        try {
            feature.isRunning = false;
            this._stopFeaturesOnFrames([feature], this._framesCache.contexts);
        } catch (ex) {
            Log.debug(`Failed to stop feature in FrameHandler.stopFeature: ${ex.message}`, ex);
        }
    }

    /**
     * After server configuration - features that might change inner behaviour need to
     * recheck configuration (stop/start mutation obeserver)
     * @param feature
     */
    updateFeatureConfig(feature) {
        if (feature.instance.updateFeatureConfig) {
            this._updateFeaturesConfigOnFrames([feature], this._framesCache.contexts);
        }
    }

    _onFrameAdded(frame) {
        try {
            Log.debug(`Frame:${frame.name}, id:${frame.id}. was loaded.`);

            if (!this._framesCache.exists(frame)) {
                this._framesCache.add(frame);
            } else {
                // If the frame already existed in the cache we unregister the features
                // so we can run them on the frame again
                // This can happen if the frame was reloaded
                this._framesCache.unRegisterContextFeatures(frame, this._featuresList);
            }

            this._startFeaturesOnFrames([frame], this._featuresList);
        } catch (ex) {
            Log.warn(`Failed to start features on frame ${frame.id}: ${ex.message}`, ex);
        }
    }

    _onFrameRemoved(frame) {
        try {
            Log.debug(`Frame:${frame.name}, id:${frame.id}. was removed.`);

            this._stopFeaturesOnFrames(this._featuresList, [frame]);
        } catch (ex) {
            Log.warn(`Failed to stop features on frame ${frame.id}: ${ex.message}`, ex);
        }
    }

    _onFrameInaccessible(frame) {
        Log.debug(`Frame:${frame.name}, id:${frame.id}. was detected as inaccessible.`);
    }

    /**
     * Builds the features map structure
     * @param features - the list of features from which the structure is built
     * @private
     */
    _buildFeaturesMap(features) {
        this._featuresList = [];

        features.forEach((feature) => {
            this._featuresList.push(feature);
        });
    }

    /**
     * Updates the frames cache from the frames detector
     * @private
     */
    _buildFramesCache() {
        this._framesDetector.frames.forEach((frame) => {
            if (!this._framesCache.exists(frame)) {
                this._framesCache.add(frame);
            }
        });
    }

    /**
     * Start features on the frames
     * @param frames - the frames to start the features on
     * @param features - features to start on each frame
     * @private
     */
    _startFeaturesOnFrames(frames, features) {
        frames.forEach((innerFrame) => {
            try {
                if (!this._domUtils.canAccessIFrame(innerFrame)) {
                    return;
                }

                for (let i = 0; i < features.length; i++) {
                    const feature = features[i];
                    if (feature.shouldRun && !this._framesCache.hasFeature(innerFrame, feature)) {
                        this._framesCache.registerContextFeature(innerFrame, feature);
                        if (this._domUtils.isWindowDocumentReady(innerFrame.contentWindow)) {
                            Log.debug(`_startFeaturesOnFrames: run feature on frame:${innerFrame.name}, id:${innerFrame.id}. feature:${feature.configKey}`);
                            this.callMethod.call(this._runFeatureOnFrame, this, innerFrame, feature);
                            feature.isRunning = true;
                        }
                    }
                }
            } catch (e) {
                Log.error(`An error has occurred while starting features on frame ${innerFrame.name} with id: ${innerFrame.id}. Error: ${e.message}`, e);
            }
        });
    }

    _runFeatureOnFrame(frame, feature) {
        try {
            if (this._domUtils.canAccessIFrame(frame)) {
                feature.instance.startFeature(new FrameContext(frame.contentWindow));
            } else {
                Log.debug(`Not starting features on frame ${frame.name} with id: ${frame.id} as it is not accessible`);
            }
        } catch (ex) {
            Log.error(`An error has occurred while starting feature ${feature.configKey} on frame ${frame.name} with id: ${frame.id}. Error: ${ex.message}`, ex);
        }
    }

    _stopFeaturesOnFrames(features, frames) {
        try {
            // I am using forEach and not iterator since IE 11 does not support
            frames.forEach((innerFrame) => {
                try {
                    if (!this._domUtils.canAccessIFrame(innerFrame)) {
                        return;
                    }

                    if (innerFrame.contentWindow && innerFrame.contentWindow.document) {
                        for (let j = 0, len = features.length; j < len; j++) {
                            if (this._framesCache.hasFeature(innerFrame, features[j])) {
                                this.callMethod.call(this._stopFeatureOnFrame, this, innerFrame, features[j]);
                            }
                            features[j].isRunning = false;
                        }
                    }
                } catch (e) {
                    Log.error(`An error has occurred while stopping features on frame ${innerFrame.name} with id: ${innerFrame.id}. Error: ${e.message}`, e);
                }

                if (this._framesCache.exists(innerFrame)) {
                    this._framesCache.unRegisterContextFeatures(innerFrame, features);
                }
                this._framesCache.remove(innerFrame);
            });
        } catch (err) {
            Log.warn(`Failed stopping features on frames ${err.message}`, err);
        }
    }

    _stopFeatureOnFrame(frame, feature) {
        try {
            if (this._domUtils.canAccessIFrame(frame)) {
                feature.instance.stopFeature(new FrameContext(frame.contentWindow));
            } else {
                Log.debug(`Not stopping feature ${feature.configKey} on frame ${frame.name} with id: ${frame.id} as it is not accessible`);
            }
        } catch (ex) {
            Log.error(`An error has occurred while stopping feature ${feature.configKey} ${func} on frame ${frame.name} with id: ${frame.id}. Error: ${ex.message}`, ex);
        }
    }

    _updateFeaturesConfigOnFrames(features, frames) {
        // I am using forEach and not iterator since IE 11 does not support
        frames.forEach((innerFrame) => {
            try {
                // If we can't access the iframe for some reason (cross domain...) we don't continue past this point
                if (!this._domUtils.canAccessIFrame(innerFrame)) {
                    return;
                }

                for (let j = 0, len = features.length; j < len; j++) {
                    if (this._framesCache.hasFeature(innerFrame, features[j])) {
                        this.callMethod.call(this._updateFeatureConfigOnFrame, this, innerFrame, features[j]);
                    }
                }
            } catch (e) {
                Log.error(`An error has occurred while updating features configuration on frame ${innerFrame.name} with id: ${innerFrame.id}. Error: ${e.message}`, e);
            }
        });
    }

    _updateFeatureConfigOnFrame(frame, feature) {
        try {
            if (this._domUtils.canAccessIFrame(frame)) {
                feature.instance.updateFeatureConfig(new FrameContext(frame.contentWindow));
            } else {
                Log.debug(`Not updating feature ${feature.configKey} config on frame ${frame.name} with id: ${frame.id} as it is not accessible`);
            }
        } catch (ex) {
            Log.error(`An error has occurred while updating feature ${feature.configKey} config on frame ${frame.name} with id: ${frame.id}. Error: ${ex.message}`, ex);
        }
    }
}
