export default class CsidCache {
    constructor() {
        this._csid = null;
    }

    /**
     * Get the csid from the cache.
     * @returns The cached csid or null if not available
     */
    get() {
        return this._csid;
    }

    /**
     * store the csid in the cache
     * @param csid - The new csid
     */
    set(csid) {
        if (csid === undefined) {
            throw new Error('Invalid csid value of undefined');
        }
        this._csid = csid;
    }
}
