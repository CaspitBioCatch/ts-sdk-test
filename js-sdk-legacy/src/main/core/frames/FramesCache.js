import * as CDMap from '../../infrastructure/CDMap';

export default class FramesCache {
    constructor() {
        this._frames = CDMap.create();
    }

    get frames() {
        const frames = [];
        this._frames.forEach((value, key) => {
            frames.push(key);
        });

        return frames;
    }

    get count() {
        return this._frames.size;
    }

    add(frame) {
        this._frames.set(frame, {
            registered: true,
            features: CDMap.create(),
        });
    }

    remove(frame) {
        if (this.exists(frame) && this._frames.get(frame).features.size === 0) {
            this._frames.delete(frame);
        }
    }

    get(frame) {
        return this._frames.get(frame);
    }

    exists(frame) {
        return this._frames.has(frame) && this._frames.get(frame).registered;
    }

    registerFrameFeature(frame, feature) {
        if (this.exists(frame)) {
            this._frames.get(frame).features.set(feature.configKey, true);
        }
    }

    unRegisterFrameFeature(frame, feature) {
        if (this.exists(frame, feature)) {
            this._frames.get(frame).features.delete(feature.configKey);
        }
    }

    unRegisterFrameFeatures(frame, features) {
        for (let i = 0; i < features.length; i++) {
            const feature = features[i];
            this.unRegisterFrameFeature(frame, feature);
        }
    }

    hasFeature(frame, feature) {
        return this.exists(frame) && this._frames.get(frame).features.has(feature.configKey);
    }
}
