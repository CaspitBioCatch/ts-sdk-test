import * as CDMap from '../../infrastructure/CDMap';

/**
 * Instances of this class expose a Map (CDMap) interface for storing and retrieving of
 * browser contexts detected by the BrowserContextDetector(s)
 */
export default class BrowserContextsCache {
    constructor() {
        this._contexts = CDMap.create();
    }

    get contexts() {
        const contexts = [];
        this._contexts.forEach((value, key) => {
            contexts.push(key);
        });

        return contexts;
    }

    /**
     * Returns a list of available browser contexts
     * @returns {[]}
     */
    get browserContexts() {
        const contexts = [];
        this._contexts.forEach((value) => {
            contexts.push(value.browserContext);
        });

        return contexts;
    }

    get count() {
        return this._contexts.size;
    }

    add(context) {
        this._contexts.set(context, {
            registered: true,
            features: CDMap.create(),
        });
    }

    /**
     * @param {BrowserContext} browserContext
     */
    addBrowserContext(browserContext) {
        this._contexts.set(browserContext.Context, {
            registered: true,
            features: CDMap.create(),
            browserContext,
        });
    }

    remove(context) {
        if (this.exists(context) && this._contexts.get(context).features.size === 0) {
            this._contexts.delete(context);
        }
    }

    get(context) {
        return this._contexts.get(context);
    }

    exists(context) {
        return this._contexts.has(context) && this._contexts.get(context).registered;
    }

    registerContextFeature(context, feature) {
        if (this.exists(context)) {
            this._contexts.get(context).features.set(feature.configKey, true);
        }
    }

    unRegisterContextFeature(context, feature) {
        if (this.exists(context, feature)) {
            this._contexts.get(context).features.delete(feature.configKey);
        }
    }

    unRegisterContextFeatures(context, features) {
        for (let i = 0; i < features.length; i++) {
            const feature = features[i];
            this.unRegisterContextFeature(context, feature);
        }
    }

    hasFeature(context, feature) {
        return this.exists(context) && this._contexts.get(context).features.has(feature.configKey);
    }
}
