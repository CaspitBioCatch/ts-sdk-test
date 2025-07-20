import { WorkerCommand } from '../../events/WorkerCommand';
import CDEvent from '../../infrastructure/CDEvent';
import Log from '../../technicalServices/log/Logger';

/**
 * The context is changing in the following logic:
 * - a new contextId on every page reload
 * - a url is taken on every page reload
 * - contextName is null unless the user updates about the context and then
 *   we are updating the server with an event. In the next page reload we will loose the state.
 *   The creation of ContextApiHandler will cause this class to generate the first context and since
 *   this is happening before reporting any data it is OK
 */
export default class ContextMgr {
    constructor(utils, siteMapper, workerComm, storageUtilsWrapper) {
        this._utils = utils;
        this._storageUtilsWrapper = storageUtilsWrapper
        this._contextSiteMapper = siteMapper;
        // every time ContextMgr is created we are creating new context id (page load on non SPA).
        // on SPA this will stay fixed :(
        this.contextName = '';
        this.referrer = '';
        this.historyLen = -1;
        this.onContextChange = new CDEvent();
        this._contextSiteMapper.updateObserver(this.onSiteMapperMatch.bind(this));
        this._workerComm = workerComm;
        this._contextIdKey = 'cdContextId';

        // Generate a random value during initialization
        this.randomValue = Math.floor(Math.random() * 1000000); // Adjust the range as needed
    }

    contextData() { // not a getter because of IE8
        return {
            contextId: this.contextId,
            contextHash: this.contextHash,
            url: this.url,
            name: this.contextName,
            referrer: this.referrer,
            hLength: this.historyLen,
            timestamp: this.timestamp,
        };
    }

    getContextName() {
        return this.contextName;
    }

    setContext(contextData) {
        // call changeContext in order to generate and save new context id.
        // Now keep the url, referrer and history of the context that was sent -
        // from the slave
        this.contextName = contextData.name;
        this._genContext();
        this.url = contextData.url;
        this.referrer = contextData.referrer;
        this.historyLen = contextData.hLength;
        this.timestamp = contextData.timestamp;
        this._publishContext();
    }

    /**
     * Publish the context change for every module registered
     * @param contextName
     */
    changeContext(contextName) {
        if (!contextName) {
            Log.error(`Received an invalid context name ${contextName}. Aborting context change operation`);
            return;
        }

        if (contextName === this.contextName) {
            Log.warn(`Received context ${contextName} but this is already the current context. Aborting operation.`);
            return;
        }

        this.contextName = contextName;
        this._updateContext();
        this._publishContext();

        Log.info(`Context changed to ${contextName} and Context hash its ${this.contextHash}`);
    }

    onSiteMapperMatch(matchedMapping) {
        // If a trigger happened and we are about to change context to our current context, we abort at this stage
        // No need for the extra processing...
        if (matchedMapping.contextName === this.contextName) {
            return;
        }

        this.changeContext(matchedMapping.contextName);
    }

    _updateContext() {
        this._genContext();
        this.url = this._utils.getDocUrl();
        this.referrer = this._utils.clearTextFromNumbers(document.referrer);
        this.historyLen = window.history.length;
        this.timestamp = this._utils.dateNow();
    }

    _genContext() {
        // moved from random number as context id to a running number, to keep track
        // save the id in a cookie in order to share across tabs but will not keep state between sessions
        this.contextId = this._storageUtilsWrapper.getCookie(this._contextIdKey);
        if (!this.contextId || isNaN(this.contextId)) {
            this.contextId = this._storageUtilsWrapper.getFromLocalStorage(this._contextIdKey);
            if (!this.contextId || isNaN(this.contextId)) {
                this.contextId = 0;
            }
        }
        this.contextId = parseInt(this.contextId);
        let val = (this.contextId + 1)
        if (!this._storageUtilsWrapper.saveToLocalStorage(this._contextIdKey, val)) {
            Log.error(`Failed saving contextId ${this.contextId} to local storage.`);
        }

        // Set the sid cookie. We use the cookie expiration configuration to prevent expiration at end of session
        if (!this._storageUtilsWrapper.setCookie(this._contextIdKey, val.toString())) {
            Log.error(`Failed saving contextId ${this.contextId} to cookie.`);
        }

        this.contextHash = this._toInt32Hash(this.contextId);
    }

    // Helper function to create a 32-bit integer hash
    _toInt32Hash(val) {
        // Incorporate the random value into the hash computation
        val ^= this.randomValue; // XOR with the random value

        // Simple hash function example (bitwise operations)
        let hash = val;
        hash = ((hash >>> 16) ^ hash) * 0x45d9f3b;
        hash = ((hash >>> 16) ^ hash) * 0x45d9f3b;
        hash = (hash >>> 16) ^ hash;
        return hash & 0xFFFFFFFF; // Ensure it's a 32-bit integer
    }

    _publishContext() {
        // Need to change this to a specific message relevant for context change and remove the update Params...
        const msgToWorker = { contextName: this.contextName };
        // when the context manager is loaded in slave this message will be sent to parent and ignored (no one listens)
        this._workerComm.sendAsync(WorkerCommand.changeContextCommand, msgToWorker);
        this.onContextChange.publish(this.contextData());
    }

    initContextHandling() {
        this._contextSiteMapper.initTracking();
    }

    clearContextHandling() {
        this._contextSiteMapper.stopTracking();
    }

    onConfigUpdate(configurationRepository) {
        this._contextSiteMapper.onConfigUpdate(configurationRepository);
    }

    onSessionReset() {
        this._publishContext();
    }
}
