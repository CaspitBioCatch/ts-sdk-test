import FramesDetector from './FramesDetector';
import FramesHandler from './FramesHandler';
import NullFramesHandler from './NullFramesHandler';
import { ConfigurationFields } from '../configuration/ConfigurationFields';
import BrowserContextsCache from '../browsercontexts/BrowserContextsCache';
import ElementsMutationObserverFactory from '../browsercontexts/ElementsMutationObserverFactory';

/**
 * The class creates the appropriate FramesHandler. He takes into consideration:
 * 1. If enableFramesProcessing configuration is enabled it creates the default FramesHandler
 * 2. If enableFramesProcessing configuration is disabled it creates the NullFramesHandler
 */
export default class FramesHandlerFactory {
    constructor(configurationRepository, domUtils, utils) {
        this._configurationRepository = configurationRepository;
        this._domUtils = domUtils;
        this._utils = utils;
    }

    create() {
        const enableFramesProcessing = this._configurationRepository.get(ConfigurationFields.enableFramesProcessing);
        const useLegacyZeroTimeout = this._configurationRepository.get(ConfigurationFields.useLegacyZeroTimeout);

        if (enableFramesProcessing) {
            const framesCache = new BrowserContextsCache();
            const framesDetector = new FramesDetector(new ElementsMutationObserverFactory(), this._domUtils, this._configurationRepository,);

            return new FramesHandler(framesCache, framesDetector, this._domUtils, this._utils, useLegacyZeroTimeout);
        }

        // Create the NullFramesHandler which is an empty skeleton implementation
        return new NullFramesHandler();
    }
}
