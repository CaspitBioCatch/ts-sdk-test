const AGENT_ID_STORAGE_KEY = 'cdAgentId';

/**
 * A class that caches the agentId in local storage.
 * The agentId is determined by the server and they responsible for managing and generate it.
 * agentId is unique per agent, so if a session starts on mobile and then continues on web, each session will have
 * a different agentId.
 * The agentId will be used by the server in cases where they need to restore the 'ott' (one time token) of the session
 * in a case a wup is sent with an empty 'ott'
 */

export default class AgentIdCache {
    constructor(storageUtilsWrapper) {
        this._storageUtilsWrapper = storageUtilsWrapper;
        this._agentId = null;
        this._loadAgentIdFromStorage();
    }

    /**
     * Gets the cached agentId.
     * @returns {string|null} The cached agentId or null if not set.
     */
    get() {
        return this._agentId;
    }
    /**
     * Sets and caches the agentId.
     * @param {string} agentId The agentId to set and cache.
     */
    set(agentId) {
        if (!agentId || typeof agentId !== 'string') {
            throw new Error('Invalid agentId value');
        }
        this._agentId = agentId;
        this._saveAgentIdToStorage();
    }

    /**
     * Saves the agentId to local storage.
     * @private
     */
    _saveAgentIdToStorage() {
        this._storageUtilsWrapper.saveToLocalStorage(AGENT_ID_STORAGE_KEY, this._agentId);
    }

    /**
     * Loads the agentId from local storage.
     * @private
     */
    _loadAgentIdFromStorage() {
        this._agentId = this._storageUtilsWrapper.getFromLocalStorage(AGENT_ID_STORAGE_KEY) || null;
    }

}