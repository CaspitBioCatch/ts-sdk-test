import HttpRequestFactory from '../../main/infrastructure/HttpRequestFactory';
import {sha256HeaderName} from "../../main/const/hashing";

export default class WorkerUtils {
    static isUndefinedNull(x) {
        return (x === null || x === undefined || typeof (x) === 'undefined');
    }

    static getPostUrl(url, method, data, onSuccess, onError, acceptNoResponse, timeout, hashedBody) {
        const httpRequest = HttpRequestFactory.create();
        try {
            if (httpRequest instanceof self.XMLHttpRequest) {
                httpRequest.open(method, url, true);
                httpRequest.timeout = timeout || 12000;
                if(hashedBody){
                    // custom header must be set after request opened and before it has sent
                    httpRequest.setRequestHeader(sha256HeaderName, hashedBody);
                }

                httpRequest.onload = function () {
                    if (httpRequest.status === 200 || (httpRequest.status === 204 && acceptNoResponse)) {
                        onSuccess && onSuccess(httpRequest.responseText);
                    } else {
                        onError && onError(httpRequest.responseText, httpRequest.status, httpRequest.statusText);
                    }
                };
                httpRequest.onerror = function () {
                    onError && onError(httpRequest.responseText, httpRequest.status, httpRequest.statusText);
                };
                httpRequest.ontimeout = function () {
                    onError && onError('timeout');
                };
                httpRequest.onabort = function () {
                    onError && onError('abort');
                };
                httpRequest.send(data);
            } else {
                httpRequest.onload = function () {
                    onSuccess && httpRequest.responseText && onSuccess(httpRequest.responseText);
                };
                httpRequest.onerror = function () {
                    onError && onError(httpRequest.responseText, httpRequest.status, httpRequest.statusText);
                };
                httpRequest.onprogress = function () {
                };
                httpRequest.ontimeout = function () {
                    onError && onError('timeout');
                };
                httpRequest.open(method, url, true);
                if(hashedBody){
                    httpRequest.setRequestHeader(sha256HeaderName, hashedBody);
                }
                httpRequest.timeout = timeout || 12000;

                // This is a workaround in IE<10 bug that aborts Cross-Domain XHR sometimes. See Commit a2ccf977b75cabce7582b4cbb45a06caa5d08f86
                setTimeout(function () {
                    httpRequest.send(data);
                }, 0);
            }
        } catch (e) {
            /* eslint-disable */
            console.log(`ERROR ERROR ERROR. URL: ${url}. ${e}.`);
            throw e;
            /* eslint-enable */
        }
    }
}
