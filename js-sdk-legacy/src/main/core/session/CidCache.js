export default class CidCache {

    /**
     *
     *
     * @param url full server url containing the cid.
     * example input: https://wup-dtrackers.bc2.customers.biocatch.com/client/v3.1/web/wup?cid=dtrackers
     *
     * By contract, the sdk receives full url containing the protocol path and cid.
     * In practice - the cid provided on the url is used as standalone param.
     * for example - it is attached in certain cases to the log url.
     *
     * Pay Attention:  the serverUrl provided by the public SDK interface/cdApi will not necessarily be used at his exact form for the actual requests:
     * Instead, it will be recontacted by the WupServerClient based on certain API/cdApi configurations.
     *
     */
    constructor(url) {
        const parsedUrl = new URL(url);
        this._cid = parsedUrl.searchParams.get('cid');

        if (!this._cid) {
            throw new Error('cid was not found on provided url.');
        }
    }

    /**
     * Get the cid from the cache.
     * @returns The cached cid or null if not available
     */
    get() {
        return this._cid;
    }
}
