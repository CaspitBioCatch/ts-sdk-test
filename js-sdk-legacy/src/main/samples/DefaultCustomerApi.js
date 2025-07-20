// this file should be used by the customer for api handling
// to get data from customer to java script or perform actions
// basic functions to be always used - getCustomerConfigLocation, getCustomerSessionID
// It is needed for ANY integration, and the functions should be selected and adjusted for each one individually.
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

    function getCookie(key) {
        let result = new RegExp('(?:^|; )' + encodeURIComponent(key) + '=([^;]*)').exec(document.cookie);
        return (decodeURIComponent(result[1]) || '');
    };

    // Create the "cdApi" object in the browser:
    exports.cdApi = {
        //Map of events and their subscribed listeners
        _eventListeners: {},

        /**
         * Handle messages arriving from the SDK library
         * @param e
         */
        onMessage: function (e) {
            var eventListeners = cdApi._eventListeners[e.data.type];

            //If there are no listeners we abort at this point
            if (!eventListeners) {
                return;
            }

            for (var i = 0; i < eventListeners.length; i++) {
                eventListeners[i](e.data.event);
            }
        },

        listenToEvents: function () {
            window.addEventListener ?
                window.addEventListener('message', cdApi.onMessage, true) :
                window.attachEvent('onmessage', cdApi.onMessage);
        },

        //** Note below are 4 examples of setting the getCustomerSessionID
        //1. Capturing the session Id from a metatag or any other HTML element
        //2. Capturing the session Id from a script variable
        //3. Capturing the session Id with an AJAX call to the web site server
        //4. Capturing the Session Id from a cookie
        //Naturally only one should be used. The remaining code should be deleted.
        //Appendix B: Example cdApi file
        //Confidential BioCatch API Reference for JavaScript for Web Page 11
        getCustomerSessionID: function (callback) {
            /**
             * Example 1: providing the customer session id by reading it from a metatag (or other html element)
             * in the page. The getMetatagContent is defined inside the function for example simplicity but it
             * can be also outside of the file.
             */
            callback(getMetatagContent('bcsid'));

            /**
             * Example 2: providing the customer session id by reading it from JavaScript variable somewhere in the website
             * code. Assuming you have an object named BankXXX, the example read it from a variable. Can be also a function
             * or any JavaScript way to retrieve the data
             */
            // callback(BankXXX.sessionID);

            /**
             * Example 3: providing the customer session id from the server in an async manner using Ajax.
             */
            // We defined a function named getPostUrl for doing Ajax.
            // JQuery can be used instead as well.
            // var onSuccess = function (sid) {
            //         callback(sid); // call BioCatch callback
            //     };
            // var onError = function (err) {
            //     //decide what you should do. Probably retry
            // };
            // // call the server to get the session id
            // getPostUrl("/getSessionId", "GET", null, onSuccess, onError);

            /**
             * Example 4: providing the customer session id by reading it from a cookie named 'bankSID'.
             * We are using our own read cookie function. JQuery can be used instead
             */
            //callback(getCookie('bcCsid'));

        },

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
            // configurations['enableStartupCustomerSessionId'] = true;
            configurations['enableFramesProcessing'] = true;
            configurations['workerUrl'] = getMetatagContent('cdWorkerUrl') || '';
            configurations['useUrlWorker'] = false;
            configurations['enableCustomElementsProcessing'] = true;
            configurations['enableSameSiteNoneAndSecureCookies'] = false;
            configurations['isWupServerURLProxy'] = false;
            configurations['clientSettings'] = {
                enableFlush: true,
                enableCoordinatesMasking: true,
                enableWupMessagesHashing: false,
            };
            configurations['collectionSettings'] = {
                mode: {
                    // agentType: 'secondary',
                },
                elementSettings: {
                    customElementAttribute: 'data-bc',
                    maskElementsAttributes: [
                        {
                            name: 'payee_id_for_',
                            regexPattern: '^payee_id_for_',
                        }
                    ],
                    keyEventsMaskSpecialChars: false,
                },
                customInputElementSettings: {
                    parentElementSelector: 'ngx-slider',
                    childElementWithCustomAttribute: 'span.ngx-slider-span.ngx-slider-pointer.ngx-slider-pointer-min',
                    elementDataAttribute: 'ariaValueNow',
                    customButtons: [
                        'body > app-root > div > div.slider-container > button:nth-child(1)',
                        'body > app-root > div > div.slider-container > button:nth-child(3)'
                    ]
                }
            }
            configurations['mutationMaxChunkSize'] = 0;
            configurations['mutationChunkDelayMs'] = 100;
            configurations['passwordIdMaskingList'] = ["1234", "5678", "pass"];
            configurations['enableMathDetect'] = false;
            configurations['enableBrowserDisplayDetect'] = false;
            configurations['enableGraphCard'] = false;
            configurations['maxShadowDepth'] = 5;
            configurations['iframeLoadingTimeout'] = 3000;
            callback(configurations);
        },
                // in case the customer wants to be notified on reset session - session number regeneration
        registerSessionNumberChange: function (callback) {
            function onNotification(e) {
                var msg = e.data;
                if (msg.type == 'SNumNotification') {
                    callback(msg.cdSNum);
                }
            }

            window.addEventListener ?
                window.addEventListener('message', onNotification, true) :
                window.attachEvent('onmessage', onNotification);
        },

        /**
         * Add a listener for the specified event
         * @param eventType - The event to listen to
         * @param listenerFunction - The listener function
         */
        addEventListener: function (eventType, listenerFunction) {
            var listenersList = cdApi._eventListeners[eventType];

            if (!listenersList) {
                listenersList = [];
                cdApi._eventListeners[eventType] = listenersList;
            }

            listenersList.push(listenerFunction);

            // window.postMessage({
            //     type: 'AddEventListenerCommand',
            //     eventType: eventType,
            //     listenerFunction: listenerFunction
            // }, window.location.href);
        },

        /**
         * Remove a listener from the specified event
         * @param eventType - The event to remove the listener from
         * @param listenerFunction - The listener function to remove
         */
        removeEventListener: function (eventType, listenerFunction) {
            var listenersList = cdApi._eventListeners[eventType];

            //Nothing is subscribed for this event
            if (!listenersList) {
                return;
            }

            for (var i = 0; i < listenersList.length; i++) {
                if (listenersList[i] === listenerFunction) {
                    listenersList.splice(i);
                }
            }
            // window.postMessage({
            //     type: 'RemoveEventListenerCommand',
            //     eventType: eventType,
            //     listenerFunction: listenerFunction
            // }, window.location.href);
        },

        // api for customer to change context - notify the js on context change and send data
        // This is the best practice to send us the contexts information.
        // If the context is not from the "allowed contexts" list - it prompts an error in console.
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
        startNewSession: function (csid) {
            window.postMessage({ type: 'ResetSession', resetReason: 'customerApi', csid }, window.location.href);
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
            window.postMessage({ type: 'cdSetCustomerBrand', brand: brand }, window.location.href);
        },
    };

    //Register to receive events
    cdApi.listenToEvents();
})(self);
