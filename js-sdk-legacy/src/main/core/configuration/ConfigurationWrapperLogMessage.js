import {ConfigurationFields} from "./ConfigurationFields";
import ReMessageSettings from "../../../worker/communication/ReMessageSettings";

export default class ConfigurationWrapperLogMessage{
    constructor(configurationRepository) {
        this.logMessageNumToRetry = configurationRepository.get(ConfigurationFields.logMessageNumToRetry);
        this.logMessageRetryInterval = configurationRepository.get(ConfigurationFields.logMessageRetryInterval);
        this.logIncrementalGrowthBetweenFailures = configurationRepository.get(ConfigurationFields.logIncrementalGrowthBetweenFailures);
        this.logMaxIntervalBetweenFailures = configurationRepository.get(ConfigurationFields.logMaxIntervalBetweenFailures);

    }
    createReMessageSettings(){
        return new ReMessageSettings(this.logMessageNumToRetry, this.logMessageRetryInterval,
            this.logIncrementalGrowthBetweenFailures, this.logMaxIntervalBetweenFailures);

    }
}
