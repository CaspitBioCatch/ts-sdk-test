import {ConfigurationFields} from "./ConfigurationFields";
import ReMessageSettings from "../../../worker/communication/ReMessageSettings";

export default class ConfigurationWrapperWupMessage{
    constructor(configurationRepository) {
        this.wupMessageNumToRetry = configurationRepository.get(ConfigurationFields.wupMessageNumToRetry);
        this.wupMessageRetryInterval = configurationRepository.get(ConfigurationFields.wupMessageRetryInterval);
        this.wupIncrementalGrowthBetweenFailures = configurationRepository.get(ConfigurationFields.wupIncrementalGrowthBetweenFailures);
        this.wupMaxIntervalBetweenFailures = configurationRepository.get(ConfigurationFields.wupMaxIntervalBetweenFailures);

    }
    createReMessageSettings(){
        return new ReMessageSettings(this.wupMessageNumToRetry, this.wupMessageRetryInterval,
                                    this.wupIncrementalGrowthBetweenFailures, this.wupMaxIntervalBetweenFailures);
    }
}