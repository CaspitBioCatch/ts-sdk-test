import Log from '../technicalServices/log/Logger';
import { ConfigurationFields } from '../core/configuration/ConfigurationFields';
import CDUtils from '../technicalServices/CDUtils';

export default class SensorGateKeeper {
    constructor(sessionInfoService, configurationRepository) {
        this.configurationRepository = configurationRepository;
        this.sessionInfoService = sessionInfoService;
        this.isMotionOnSessionStart = this.configurationRepository.get(ConfigurationFields.isMotionOnSessionStart);
        this.motionPaddingOnSessionStartMSec = this.configurationRepository.get(ConfigurationFields.motionPaddingOnSessionStartMSec);
    }

    configure() {
        this.isMotionOnSessionStart = this.configurationRepository.get(ConfigurationFields.isMotionOnSessionStart);
        this.motionPaddingOnSessionStartMSec = this.configurationRepository.get(ConfigurationFields.motionPaddingOnSessionStartMSec);
        if (this.isMotionOnSessionStart) {
            Log.info(`Motion on session start is enabled, collecting motion events for ${this.motionPaddingOnSessionStartMSec / 1000} seconds.`);
        }
    }

    isOpen() {
        return this.isMotionOnSessionStart && (CDUtils.dateNow() - this.motionPaddingOnSessionStartMSec < this.sessionInfoService.getStartTime());
    }
}
