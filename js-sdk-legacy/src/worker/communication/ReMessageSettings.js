import {ConfigurationDefaultValues} from "./ConfigurationDefaultValues";
import Log from "../../main/technicalServices/log/Logger";


export default class ReMessageSettings {
    constructor(messageNumToRetry,
                messageRetryInterval,
                incrementalGrowthBetweenFailures,
                maxIntervalBetweenFailures)
    {
        this.messageNumToRetry = messageNumToRetry;
        this.messageRetryInterval = messageRetryInterval;
        this.incrementalGrowthBetweenFailures = incrementalGrowthBetweenFailures;
        this.maxIntervalBetweenFailures = maxIntervalBetweenFailures;
        this.init();

    }
    init(){
        this._validateReMessageSettings();
    }

    getMessageNumToRetry(){
        return this.messageNumToRetry;
    }
    getMessageRetryInterval(){
        return this.messageRetryInterval;

    }
    getMaxIntervalBetweenFailures(){
        return this.maxIntervalBetweenFailures;

    }
    getIncrementalGrowthBetweenFailures(){
        return this.incrementalGrowthBetweenFailures;

    }

    _validateReMessageSettings() {
        const logMessage = "The provided configuration is invalid, it must be  "
        if (!(isNaN(this.messageNumToRetry))) {
            let messageNumToRetryToInt = parseInt(this.messageNumToRetry)
            this.messageNumToRetry = messageNumToRetryToInt;
        }
        else{
            Log.warn(`${logMessage} a number. setting to default: ${ConfigurationDefaultValues.DEFAULT_RETRY_NUM}`);
            this.messageNumToRetry = ConfigurationDefaultValues.DEFAULT_RETRY_NUM;
        }

        if (this.messageNumToRetry < ConfigurationDefaultValues.MIN_RETRY_NUM || this.messageNumToRetry > ConfigurationDefaultValues.MAX_RETRY_NUM) {
            Log.warn(`messageNumToRetry - ${logMessage} in the following range: 
            ${ConfigurationDefaultValues.MIN_RETRY_NUM} - ${ConfigurationDefaultValues.MAX_RETRY_NUM} setting to default: ${ConfigurationDefaultValues.DEFAULT_RETRY_NUM}`);
            this.messageNumToRetry = ConfigurationDefaultValues.DEFAULT_RETRY_NUM
        }

        if (this.messageRetryInterval < ConfigurationDefaultValues.MIN_RETRY_INTERVAL || this.messageRetryInterval > ConfigurationDefaultValues.MAX_RETRY_INTERVAL) {
            Log.warn(`messageRetryInterval - ${logMessage} in the following range: 
            [${ConfigurationDefaultValues.MIN_RETRY_INTERVAL} - ${ConfigurationDefaultValues.MAX_RETRY_INTERVAL}], 
            setting to default: ${ConfigurationDefaultValues.DEFAULT_RETRY_INTERVAL}`);
            this.messageRetryInterval = ConfigurationDefaultValues.DEFAULT_RETRY_INTERVAL;
        }

        if (this.incrementalGrowthBetweenFailures < ConfigurationDefaultValues.MIN_GROWTH_PER_FAILURE ||
            this.incrementalGrowthBetweenFailures > ConfigurationDefaultValues.MAX_GROWTH_PER_FAILURE) {
            Log.warn(`incrementalGrowthBetweenFailures - ${logMessage} in the following range: 
            [${ConfigurationDefaultValues.MIN_GROWTH_PER_FAILURE} - ${ConfigurationDefaultValues.MAX_GROWTH_PER_FAILURE}],
                setting to default: ${ConfigurationDefaultValues.DEFAULT_GROWTH_PER_FAILURE}`);
            this.incrementalGrowthBetweenFailures = ConfigurationDefaultValues.DEFAULT_GROWTH_PER_FAILURE;
        }

        if (this.maxIntervalBetweenFailures < ConfigurationDefaultValues.MIN_INTERVAL_LIMIT ||
            this.maxIntervalBetweenFailures > ConfigurationDefaultValues.MAX_INTERVAL_LIMIT) {
            Log.warn(`maxIntervalBetweenFailures - ${logMessage} in the following range: 
            [${ConfigurationDefaultValues.MIN_INTERVAL_LIMIT} - ${ConfigurationDefaultValues.MAX_INTERVAL_LIMIT}]
                setting to default: ${ConfigurationDefaultValues.DEFAULT_INTERVAL_LIMIT}`);
            this.maxIntervalBetweenFailures = ConfigurationDefaultValues.DEFAULT_INTERVAL_LIMIT;
        }

        if (this.maxIntervalBetweenFailures < this.messageRetryInterval) {
            Log.warn(` maxIntervalBetweenFailures - ${logMessage} greater than minimum interval: 
            [${ConfigurationDefaultValues.MIN_INTERVAL_LIMIT}], setting to defaults:
                ${ConfigurationDefaultValues.DEFAULT_INTERVAL_LIMIT}`);
            this.maxIntervalBetweenFailures = ConfigurationDefaultValues.DEFAULT_INTERVAL_LIMIT;
            this.messageRetryInterval = ConfigurationDefaultValues.DEFAULT_RETRY_INTERVAL;
        }
    }


}




