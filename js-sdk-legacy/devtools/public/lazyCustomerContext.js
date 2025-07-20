(function (exports) {
    "use strict";

    function getPostUrl (url, method, data, onSuccess, onError) {
        let httpRequest = exports.HttpRequestFactory.create();

        if (httpRequest instanceof self.XMLHttpRequest) {
            httpRequest.open(method, url, true);
            httpRequest.onreadystatechange = function () {
                if (httpRequest.readyState == 4) {
                    // 204 is no response
                    if (httpRequest.status == 204) {
                        return;
                    }
                    if (httpRequest.status == 200) {
                        onSuccess && onSuccess(httpRequest.responseText);
                    } else {
                        onError && onError();
                    }
                }
            };
            httpRequest.send(data);
        }
        else {
            httpRequest.onload = function () {
                onSuccess && onSuccess(httpRequest.responseText);
            };
            httpRequest.onerror = function () {
                onError && onError();
            };
            httpRequest.onprogress = function() {};
            httpRequest.ontimeout = function() {};
            httpRequest.open(method, url, true);
            // This is a workaround in IE<10 bug that aborts Cross-Domain XHR sometimes. See Commit a2ccf977b75cabce7582b4cbb45a06caa5d08f86
            setTimeout(function () {
                httpRequest.send(data);
            }, 0);
        }
    }

    var contextMapping = null;
    getPostUrl("/customerJs/contextMappings.txt","GET", null, function (result) {
        try {
            contextMapping = JSON.parse(result);
            onUrlChange(); // good for every load of the page
        }
        catch(ex) {
            // nothing to do here...
        }
    });

    function onUrlChange() {
        for (var url in contextMapping) {
            if (contextMapping.hasOwnProperty(url) && window.location.href.indexOf(url) > -1) {
                window.postMessage({type:'ContextChange', context: contextMapping[url]}, window.location.href);
                break;
            }
        }
    }

})(self);