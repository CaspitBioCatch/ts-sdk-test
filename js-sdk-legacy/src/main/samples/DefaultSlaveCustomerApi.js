(function (exports) {
    "use strict";

    exports.slaveCdApi = {
        getConfigurations: function (callback) {
            const configuration = {};
            configuration['enableCustomElementDetector'] = true;
            configuration['enableAcknowledgeMessageEvents'] = false;
            configuration['mutationMaxChunkSize'] = 0;
            configuration['mutationChunkDelayMs'] = 100;
            configuration['useLegacyZeroTimeout'] = true;
            callback(configuration);
        },
    };
})(self)

