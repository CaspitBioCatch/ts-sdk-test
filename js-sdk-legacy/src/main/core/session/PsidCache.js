export default class PsidCache {
    constructor() {
        this._psid = null;
    }

    /**
     * Get the psid from the cache.
     * @returns The cached psid or null if not available
     */
    get() {
        return this._psid;
    }

    /**
     * store the psid in the cache
     * @param psid - The new psid
     */
    set(psid) {
        if (psid === undefined) {
            throw new Error('Invalid psid value of undefined');
        }

        this._psid = psid;
    }
}
