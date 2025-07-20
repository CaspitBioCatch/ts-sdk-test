import { ConfigurationFields } from './ConfigurationFields';
import { LogLevel } from '../../technicalServices/log/LogLevel';
import * as CDMap from '../../infrastructure/CDMap';
import FontMigrationStage from '../../collectors/static/font/collection/v2/types/FontMigrationStage';

export const ConfigurationDefaultTemplates = {
    defaultDynamicWupDispatchRateConfiguration: { type: 'dynamic' },
    defaultIncrementalWupDispatchRateConfiguration: {
        type: 'incremental', // (incremental, constant)
        initialRateValueMs: 500, // The initial rate
        incrementStepMs: 500, // The rate increment rate
        incrementStopMs: 5000, // At what rate value do we stop incrementing
        incrementStartWupSendCount: 20, // After how many wups do we start increasing
    },
};

/**
 * List of config keys allowed to be modified only via local configuration.
 *
 * @type {string[]}
 */
const configOverrideBlackList = [
    /**
     * This keys should be modified only from local configuration, to prevent security treat
     * in which sensitive inputs masking could be disabled remotely.
     * For example, by man-in-the middle attack.
     */
    ConfigurationFields.keyEventsMaskSpecialChars,
    ConfigurationFields.passwordIdMaskingList,
    ConfigurationFields.maskElementsAttributes,
    ConfigurationFields.allowedUnmaskedValuesList,
    ConfigurationFields.enableUnmaskedValues,
    ConfigurationFields.enableCoordinatesMasking
];

export default class ConfigurationRepository {
    constructor() {
        // Dictionary holds the config values which require parsing so we can parse them when they arrive from the server
        this._requireParseFields = CDMap.create();
        this._requireParseFields.set(ConfigurationFields.dataWupDispatchRateSettings, ConfigurationFields.dataWupDispatchRateSettings);
        this._requireParseFields.set(ConfigurationFields.logWupDispatchRateSettings, ConfigurationFields.logWupDispatchRateSettings);
        this._requireParseFields.set(ConfigurationFields.crossDomainsList, ConfigurationFields.crossDomainsList);
        this._requireParseFields.set(ConfigurationFields.allowedUnmaskedValuesList, ConfigurationFields.allowedUnmaskedValuesList);
        this._requireParseFields.set(ConfigurationFields.serverCommunicationSettings, ConfigurationFields.serverCommunicationSettings);


        this._configurationList = {};
        // For subscribing to configuration updates
        this.configDefault = {
            logLevel: LogLevel.INFO,
            isCrossdomain: false,
            isGfxRendering: false,
            isAudioDetectFeature: false,
            enableEmuidFeature: false,
            crossDomainsList: [],
            crossDomainsTimeout: 5000,
            orientationEventsSamplePeriod: 300,
            orientationEventsThreshold: 1,
            stateChangeEnabled: false,
            accelerometerEventsSamplePeriod: 0,
            dataQPassWorkerInterval: 500,
            gyroEventsSamplePeriod: 0,
            gyroEventsThreshold: 0.3,
            isContextPropsFeature: true,
            isEnabled: true,
            isResetEveryLoad: false,
            isScrollCollect: true,
            isVMDetection: true,
            isAudioDetection: false,
            wupStatisticsLogIntervalMs: 30000,
            heartBeatMessageInterval: 5000,
            resetSessionApiThreshold: 20000,
            wupMessageRequestTimeout: 5000,
            logMessageRequestTimeout: 5000,
            slaveChannelHandshakeTimeout: 60000,
            slaveAliveMessageInterval: 100,
            forceDynamicDataWupDispatchSettings: true,
            dataWupDispatchRateSettings: ConfigurationDefaultTemplates.defaultDynamicWupDispatchRateConfiguration,
            logWupDispatchRateSettings: {
                type: 'constant', // (incremental, constant)
                initialRateValueMs: 2500, // The initial rate
            },
            serverCommunicationSettings: {
                queueLoadThreshold: 100,
            },
            collectKeyRegionValue: false,
            isMutationObserver: true,
            collectCustomElementAttribute: true,
            isCaptureKeyEvents: false,
            locationEventsTimeoutMsec: 10000,
            isMotionAroundTouchEnabled: true,
            motionPaddingAroundTouchMSec: 3000,
            isMotionOnSessionStart: true,
            motionPaddingOnSessionStartMSec: 20000,
            keyEventsMaskSpecialChars: false,
            collectSelectElementBlurAndFocusEvents: false,
            enableUnmaskedValues: false,
            allowedUnmaskedValuesList: [],
            wupMessageNumToRetry: 5,
            wupMessageRetryInterval: 1000,
            wupIncrementalGrowthBetweenFailures: 3500,
            wupMaxIntervalBetweenFailures: 16000,
            logMessageNumToRetry: 5,
            logMessageRetryInterval: 1000,
            logIncrementalGrowthBetweenFailures: 3500,
            logMaxIntervalBetweenFailures: 16000,
            cdsNumExpirationTime: 60,
            enableCoordinatesMasking: false,
            acknowledgeDataDispatchingRate: 3000,
            passwordIdMaskingList : [],
            isFontWidthFeature: false,
            isFontMathFeature: false,
            isFontEmojiFeature: false,
            isStorageFeature: false,
            isKeyboardLayoutFeature: false,
            isScreenHighResFeature: false,
            isBatteryStatusFeature: false,
            isNavigatorFeature: false,
            isWebglFeature: false,
            isWebRTCFeature: false,
            isSpeechVoicesFeature: false,
            isDRMFeature: false,
            isBrowserExtensionsFeature: false,
            isAdblockerListsFeature: false,
            elementUniqueIDConfiguration: {
                componentsFormat: "{tagName}_{index}_{id}_{className}_{ariaLabel}_{containerInfo}_{hierarchyPath}",
                hierarchyFormat: "{tagName}_{index}",
                enabledTags: ["input", "textarea", "button", "select", "div", "span"]
            },
            offloadFontsCollectionEnabled: true,
            fontCollection: JSON.stringify({
                "migrationMode": FontMigrationStage.V1_ONLY,
                "v2": {
                    "batchSize": 5,
                    "timeoutGap": 0
                }
            }),
            enableElementHierarchy: false,
            enableElementCategory: true,
        };

        this.loadConfigurations(this.configDefault);
    }

    /**
     * Indicates if we are using the a configuration which was updated from the server or not
     * @returns boolean True if update configuration is used. False if default one is used
     */
    isConfigurationUpdatedFromServer() {
        return !this._isDefaultConfiguration;
    }

    /**
     * get a list of configurations and sets them all
     * @param config
     * @param forceOverride
     */
    loadConfigurations(config, forceOverride) {
        if (!config) {
            return;
        }

        this._isDefaultConfiguration = config === this.configDefault;

        Object.keys(config).forEach((key) => {
            if (forceOverride || this._isDefaultConfiguration || !configOverrideBlackList.includes(key)) {
                let configurationValue = config[key];
                if (this._requireParseFields.has(key)) {
                    const parsedValue = this._tryParseConfigurationValue(configurationValue);
                    if (parsedValue) {
                        configurationValue = parsedValue;
                    }
                }

                this._configurationList[key] = configurationValue;
            }
        });
    }

    /**
     * get specific feature value
     * @param featureName
     * @constructor
     */
    get(configurationName) {
        return this._configurationList[configurationName];
    }

    set(name, value) {
        this._configurationList[name] = value;
    }

    getAll() {
        return this._configurationList;
    }

    _tryParseConfigurationValue(configurationValue) {
        if (typeof configurationValue !== 'string') {
            return null;
        }

        try {
            return JSON.parse(configurationValue);
        } catch (ex) {
            // swallow error
        }

        return null;
    }
}
