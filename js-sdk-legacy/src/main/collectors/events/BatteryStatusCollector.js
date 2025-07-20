/**
 * Collects battery status information from the device.
 *
 * Features:
 * - Tracks battery level changes
 * - Monitors charging status
 * - Handles secure context requirements
 * - Graceful error handling
 * - Clean event listener management
 *
 * Security and Permissions:
 * - The Battery Status API is only available in secure contexts (HTTPS)
 * - Starting from Chrome 103, the API requires a secure context to prevent potential privacy concerns
 * - While not currently listed in the Permissions-Policy specification, the API follows similar security principles
 * - The API is considered a sensitive feature that could potentially be used for fingerprinting
 * - Access to battery information is restricted to the same origin by default
 *
 * Browser Support:
 * - Chrome (since version 103 with secure context requirement)
 * - Edge (based on Chromium)
 * - Opera (based on Chromium)
 *
 * Note: This API should be used with consideration for user privacy and battery impact.
 * Frequent polling of battery status can affect device performance and battery life.
 */
import DataCollector from '../DataCollector';
import Log from "../../technicalServices/log/Logger";

const featureSettings = {
    configKey: 'isBatteryStatusFeature',
    isDefault: false,
    shouldRunPerContext: false,
    shouldRunPerSession: false,
    shouldRun: false,
    isFrameRelated: false,
    runInSlave: false,
    runInLean: false,
    runInUns: false,
    isRunning: false,
    instance: null
};

export const BatteryStatusStructure = ['eventSequence', 'timestamp', 'chargeLevel', 'isCharging', 'powerSource'];

export default class BatteryStatusCollector extends DataCollector {
    static getDefaultSettings() {
        return featureSettings;
    }

    /**
     * @param {Object} dataQueue - Queue for storing collected data
     * @param {Object} utils - Utility functions
     * @param {Object} [navigator=window.navigator] - Navigator object for battery API access
     */
    constructor(dataQueue, utils, navigator = window.navigator) {
        super();

        this._dataQueue = dataQueue;
        this._utils = utils;
        this._storageUtils = utils.StorageUtils;
        this._navigator = navigator;
        this._battery = null;

        // Bind event handlers to maintain proper 'this' context
        this._onLevelChangeEventFunc = this._onLevelChangeEventFunc.bind(this);
        this._onChargingChangeEventFunc = this._onChargingChangeEventFunc.bind(this);
    }

    /**
     * Starts collecting battery status data
     * @returns {Promise<void>}
     */
    async startFeature() {
        try {
            this._battery = await this.getBatteryManager();
            this._setupEventListeners();
            await this._sendData();
        } catch (error) {
            Log.error(`Failed to start battery status collector: ${error.message || error}`);
        }
    }

    /**
     * Stops collecting battery status data
     */
    stopFeature() {
        this._cleanupEventListeners();
        this._battery = null;
    }

    /**
     * Sets up event listeners for battery status changes
     * @private
     */
    _setupEventListeners() {
        if (!this._battery) return;

        this._battery.addEventListener('levelchange', this._onLevelChangeEventFunc);
        this._battery.addEventListener('chargingchange', this._onChargingChangeEventFunc);
    }

    /**
     * Removes event listeners
     * @private
     */
    _cleanupEventListeners() {
        if (!this._battery) return;

        this._battery.removeEventListener('levelchange', this._onLevelChangeEventFunc);
        this._battery.removeEventListener('chargingchange', this._onChargingChangeEventFunc);
    }

    /**
     * Gets the battery manager instance
     * @returns {Promise<BatteryManager>}
     * @throws {Error}
     */
    async getBatteryManager() {
        try {
            return await this._navigator.getBattery();
        } catch (error) {
            throw new Error(`Failed to get battery manager: ${error.message || error}`);
        }
    }

    /**
     * Handles battery level change events
     * @private
     */
    _onLevelChangeEventFunc(e) {
        this._sendData(e.currentTarget);
    }

    /**
     * Handles battery charging status change events
     * @private
     */
    _onChargingChangeEventFunc(e) {
        this._sendData(e.currentTarget);
    }

    /**
     * Sends battery status data to the queue
     * @private
     * @param {BatteryManager} battery - Battery manager instance
     */
    _sendData(battery = this._battery) {
        if (!battery) return;

        const eventSeq = this._storageUtils.getAndUpdateEventSequenceNumber();
        const time = this._utils.dateNow();

        this._dataQueue.addToQueue('battery_status',
            this._utils.convertToArrayByMap(BatteryStatusStructure,
                {
                    eventSequence: eventSeq,
                    timestamp: time,
                    chargeLevel: battery.level,
                    isCharging: battery.charging,
                    powerSource: 0
                }));
    }
}

