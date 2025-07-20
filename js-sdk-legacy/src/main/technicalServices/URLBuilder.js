import CDUtils from './CDUtils';

export default class URLBuilder {
    static build(serverURL, cid) {
        const route = '/client/v3.1/web/wup';
        const protocol = 'https';
        if (!serverURL) {
            throw new Error('Invalid server URL. Parameter is empty');
        }
        let newURL;
        if (CDUtils.hasProtocol(serverURL)) {
            newURL = serverURL.toString().concat(route, '?cid=', cid);
        } else {
            newURL = protocol.concat('://', serverURL, route, '?cid=', cid);
        }

        return newURL;
    }

    static buildCustomServerUrl(serverURL){
        const protocol = 'https';
        let newURL;
        //if serverURL is empty we throw an error
        if(!serverURL){
            throw new Error('Invalid server URL. Parameter is empty');
        }
        if(CDUtils.hasProtocol(serverURL)){
            newURL = serverURL;
        }
        else {
            //https protocol is added when serverURL does not include one
            newURL = protocol.concat('://', serverURL);
        }
        return newURL;
    }
}
