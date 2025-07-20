//  This class is responsible for the logic in case of failure to send message
export default class RetryMessage {
    constructor(reMessageSettings) {
        this.currentMessageNumberOfSendFailures = 0;
        this.reMessageSettings = reMessageSettings;
        this.currentInterval = this.getMessageRetryInterval();
    }
    //set to initial value
    restartMessageSettings() {
        this.currentMessageNumberOfSendFailures = 0
        this.currentInterval = this.getMessageRetryInterval()
    }
    //set to initial value of the settings
    updateSettings(reMessageSettings) {
        this.reMessageSettings = reMessageSettings;
    }
    //check the values under the min/max constrains
    updateAllSettings(reMessageSettings) {
       reMessageSettings.init();
       this.reMessageSettings = reMessageSettings;
    }
    //getters
    getNumberOfSendFailures(){
        return this.currentMessageNumberOfSendFailures;
    }
    getNextInterval() {
        return this.currentInterval;
    }

    //getters for the initial configuration. needed for testing conditions
    getMessageNumToRetry(){
        return this.reMessageSettings.getMessageNumToRetry();
    }
    getMessageRetryInterval(){
        return this.reMessageSettings.getMessageRetryInterval();
    }
    getMaxIntervalBetweenFailures(){
        return this.reMessageSettings.getMaxIntervalBetweenFailures();
    }
    getIncrementalGrowthBetweenFailures(){
        return this.reMessageSettings.getIncrementalGrowthBetweenFailures();
    }
    /**
     * @param currentMessageNumberOfSendFailures
     * @private
     */
      _incrementNumberOfSendFailures(){
        this.currentMessageNumberOfSendFailures++;
    }

    shouldReMessage(isMandatory){
        return  (isMandatory || this.getNumberOfSendFailures() < this.getMessageNumToRetry());
    }

    //calculate the next interval before remessage
    updateRetryInterval() {
        let nextInterval = this.currentInterval + (this.currentMessageNumberOfSendFailures * this.getIncrementalGrowthBetweenFailures())
        if (nextInterval > this.getMaxIntervalBetweenFailures()){
            this.currentInterval = this.getMaxIntervalBetweenFailures()
        }
        else{
            this.currentInterval = nextInterval
        }
        this._incrementNumberOfSendFailures();
        }
}
