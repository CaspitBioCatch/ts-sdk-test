export default class URLFieldsExtractor {
    static extract(wupServerURL) {
        if (!wupServerURL) {
            throw new Error('Invalid wupServerURL. Parameter is empty');
        }

        const urlFields = {};
        urlFields.cid = this.getCID(wupServerURL);
        urlFields.serverURL = this.getServerURL(wupServerURL);

        if (!urlFields.serverURL) {
            throw new Error(`Invalid field. Failed extracting the address parameter: ${wupServerURL}`);
        }
        if (!urlFields.cid) {
            throw new Error(`Invalid field. Failed extracting the cid parameter: ${wupServerURL}`);
        }

        return urlFields;
    }

    static getCID(wupServerURL) { // Check and extract CID parameter
        const cid = URLFieldsExtractor.extractCid(wupServerURL);
        if (!cid) {
            return null;
        }

        return cid;
    }

    static extractCid(url) {
        let cidIndex = url.indexOf('cid=');
        if (cidIndex === -1) {
            return null;
        }
        cidIndex += 4;
        let nextParamIndex = url.indexOf('&', cidIndex);
        nextParamIndex = nextParamIndex === -1 ? undefined : nextParamIndex;
        const cid = url.substring(cidIndex, nextParamIndex);
        return cid;
    }

    static getServerURL(url) {
        let routeIndex = url.indexOf('/client/v', url);
        routeIndex = routeIndex === -1 ? null : routeIndex;
        if (!routeIndex) {
            return null;
        }
        const serverURL = url.substring(0, routeIndex);

        return serverURL;
    }
}
