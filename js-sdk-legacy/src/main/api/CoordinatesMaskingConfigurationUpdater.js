import Log from "../technicalServices/log/Logger";
import {ConfigurationFields} from "../core/configuration/ConfigurationFields";
import CDUtils from "../technicalServices/CDUtils";

/**
 * this class is a bridge for handling the collection of mouse coordinates.
 * the class takes effect when:
 * 1. server configurations loaded
 * 2. setCoordinatesMasking API function was fired.
 * the class updates the configuration repository 'enableCoordinatesMasking' field which
 * is being consumed by the 'MouseEventCollector' class.
 */

export default class CoordinatesMaskingConfigurationUpdater{

    constructor(configurationRepository) {
       this._configurationRepository = configurationRepository;
    }

    onConfigUpdate(serverConfigurations){
        const isEnabled = serverConfigurations.get(ConfigurationFields.enableCoordinatesMasking);
        this._setConfigurationKey(isEnabled);
    }

    updateConfig(isEnable){
        this._handleConfigurationUpdate(isEnable);
    }

    _handleConfigurationUpdate(isEnabled){
        if(!CDUtils.isBoolean(isEnabled)){
                Log.warn(`Invalid argument type: ${isEnabled}`);
                return
            }

        Log.info(`Set coordinates masking API was called, is enabled: ${isEnabled}`);
        this._setConfigurationKey(isEnabled);
    }

    _setConfigurationKey(value){
        this._configurationRepository.set(ConfigurationFields.enableCoordinatesMasking,value);
    }

}