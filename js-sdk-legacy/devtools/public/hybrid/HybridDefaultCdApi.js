(function (exports) {
    "use strict";

    // generic function to be used for calling metatags for data like csid or confLocation
    // should be deleted if not used
    function getMetatagContent(name) {
        var elem = document.getElementsByName(name)[0];
        if (elem) {
            return elem.getAttribute('content');
        }
        return "";
    }

    // Create the "cdApi" object in the browser:
    exports.cdApi = {
        //Map of events and their subscribed listeners
        _eventListeners: {},

        /**
         * Provides the library its startup configurations.
         * @param callback
         */
        getConfigurations: function (callback) {
            const configurations = {}

            configurations['wupServerURL'] = getMetatagContent('cdConfLocation');
            //'https://wup-4ff4f23f.eu.v2.we-stats.com/client/v3.1/web/wup?cid=dummy';
            configurations['logServerURL'] = getMetatagContent('cdLogAddress');
            //'https://logs-4ff4f23f.eu.v2.we-stats.com/api/v1/sendLogs';
            configurations['enableFramesProcessing'] = true;
            configurations['workerUrl'] = getMetatagContent('cdWorkerUrl') || '';
            configurations['useUrlWorker'] = false;
            configurations['enableCustomElementsProcessing'] = true;
            configurations['enableSameSiteNoneAndSecureCookies'] = false;
            configurations['isWupServerURLProxy'] = false;
            configurations['clientSettings'] = {
                enableFlush:true,
                enableCoordinatesMasking:true,
            };
            configurations['collectionSettings'] = {
                mode: {
                    agentType: getMetatagContent('cdAgentType'),
                    collectionMode: getMetatagContent('cdCollectionMode'),
                },
            }
            callback(configurations);
        },

        /**
         * Change the current context value. This value is saved with the rest of the user data.
         * @param contextName - A string value describing the current context
         */
        changeContext: function (contextName) {
            window.postMessage({ type: 'ContextChange', context: contextName }, window.location.href);
        },

        /**
         * Starts a new session
         */
        startNewSession: function () {
            window.postMessage({ type: 'ResetSession', resetReason: 'customerApi' }, window.location.href);
        },

        // customer api for stopping the js from collecting data
        // May be used by the customer (e.g. in case of "heavey" page loads etc.)
        pauseCollection: function () {
            window.postMessage({ type: 'cdChangeState', toState: 'pause' }, window.location.href);
        },

        resumeCollection: function () {
            window.postMessage({ type: 'cdChangeState', toState: 'run' }, window.location.href);
        },

        sendMetadata: function (data) {
            window.postMessage({ type: 'cdCustomerMetadata', data: data }, window.location.href);
        },

        setCustomerSessionId: function (csid) {
            window.postMessage({ type: 'cdSetCsid', csid: csid }, window.location.href);
        },

        setCustomerBrand: function (brand) {
            window.postMessage({type: 'cdSetCustomerBrand', brand: brand}, window.location.href);
        },
    };

})(self);
