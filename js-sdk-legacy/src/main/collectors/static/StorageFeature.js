import DataCollector from "../DataCollector";
import Log from "../../technicalServices/log/Logger";
import StorageEstimateContract from "../../contract/staticContracts/StorageEstimateContract";
import StorageDirectoryContract from "../../contract/staticContracts/StorageDirectoryContract";

/**
 * Feature settings for the StorageFeature
 * @type {Object}
 */
const featureSettings = {
    configKey: 'isStorageFeature',
    isDefault: false,
    shouldRunPerContext: false,
    shouldRunPerSession: true,
    shouldRun: false,
    isFrameRelated: false,
    runInUns: false,
    runInSlave: true,
    runInLean: true,
    isRunning: false,
    instance: null,
};

/**
 * StorageFeature collects information about browser storage capabilities
 * including storage estimates and directory information.
 * 
 * @extends DataCollector
 */
export default class StorageFeature extends DataCollector {
    /**
     * Returns the default settings for this feature
     * @returns {Object} The default feature settings
     */
    static getDefaultSettings() {
        return featureSettings;
    }

    /**
     * Creates a new StorageFeature instance
     * @param {DataQueue} dataQ - The data queue to add collected data to
     * @param {DevDebugDataQ} devDebugDataQueue - The DevDebug data queue to add collected data to
     */
    constructor(dataQ, devDebugDataQueue) {
        super();
        this._dataQ = dataQ;
        this._devDebugDataQueue = devDebugDataQueue;
        this._storageManager = null;
    }

    /**
     * Starts the storage feature by collecting both storage estimate and directory information
     */
    async startFeature() {
        Log.info("Starting Storage Feature");
        this._initializeStorageManager();
        
        try {
            await this._collectStorageEstimateInfo();
            await this._collectStorageDirectoryInfo();
        } catch (error) {
            Log.error(`Error in Storage Feature: ${error.message || error}`);
        }
    }

    /**
     * Initializes the storage manager if not already initialized
     * @private
     */
    _initializeStorageManager() {
        if (!this._storageManager) {
            this._storageManager = this.getStorageManager();
        }
    }

    /**
     * Gets the browser's storage manager
     * @returns {StorageManager} The browser's storage manager
     */
    getStorageManager() {
        return typeof navigator !== 'undefined' && navigator.storage ? navigator.storage : null;
    }

    /**
     * Collects storage estimate information and adds it to the data queue
     * @private
     */
    async _collectStorageEstimateInfo() {
        Log.info('Collecting storage estimate properties');
        
        try {
            const storageEstimate = await this._getStorageEstimateInfo();
            
            if (this._isValidStorageEstimate(storageEstimate)) {
                const storageEstimateContract = new StorageEstimateContract(storageEstimate.usage, storageEstimate.quota);
                const contractData = storageEstimateContract.buildQueueMessage();
                this._dataQ.addToQueue('static_fields', contractData, false);
            } else {
                Log.warn('Invalid storage estimate data received');
            }
        } catch (error) {
            Log.error(`Error collecting storage estimate information: ${error.message || error}`);
            throw error;
        }
    }

    /**
     * Validates storage estimate data
     * @param {Object} storageEstimate - The storage estimate data to validate
     * @returns {boolean} True if the data is valid, false otherwise
     * @private
     */
    _isValidStorageEstimate(storageEstimate) {
        return storageEstimate && 
               typeof storageEstimate.usage === 'number' && 
               typeof storageEstimate.quota === 'number' &&
               storageEstimate.usage >= 0 &&
               storageEstimate.quota >= 0;
    }

    /**
     * Gets storage estimate information from the browser
     * @private
     * @returns {Promise<{quota: number, usage: number}>} Storage estimate information
     */
    async _getStorageEstimateInfo() {
        try {
            if (!this._storageManager) {
                Log.error('StorageManager is not initialized or unavailable.');
                throw new Error('StorageManager is not initialized or unavailable.');
            }
            const storageEstimate = await this._storageManager.estimate();
            return { 
                quota: storageEstimate.quota,
                usage: storageEstimate.usage
            };
        } catch (error) {
            Log.error(`Failed to get storage estimate: ${error.message || error}`);
            throw error;
        }
    }

    /**
     * Collects storage directory information and adds it to the data queue
     * @private
     */
    async _collectStorageDirectoryInfo() {
        Log.info('Collecting storage directory properties');
        
        try {
            const directoryName = await this._getStorageDirectoryInfo();
            
            if (this._isValidDirectoryName(directoryName)) {
                const storageDirectoryContract = new StorageDirectoryContract(directoryName);
                const contractData = storageDirectoryContract.buildQueueMessage();
                this._devDebugDataQueue.addToQueue('static_fields', contractData, false);
            } else {
                Log.warn('Invalid storage directory data received');
            }
        } catch (error) {
            Log.error(`Error collecting storage directory information: ${error.message || error}`);
            throw error;
        }
    }

    /**
     * Validates directory name
     * @param {string} directoryName - The directory name to validate
     * @returns {boolean} True if the directory name is valid, false otherwise
     * @private
     */
    _isValidDirectoryName(directoryName) {
        return directoryName !== undefined &&
               typeof directoryName === 'string';
    }

    /**
     * Gets storage directory information from the browser
     * @private
     * @returns {Promise<string>} Storage directory name
     */
    async _getStorageDirectoryInfo() {
        try {
            if (!this._storageManager) {
                Log.error('StorageManager is not initialized or unavailable.');
                throw new Error('StorageManager is not initialized or unavailable.');
            }
            const fileSystemDirectoryHandle = await this._storageManager.getDirectory();
            return fileSystemDirectoryHandle.name;
        } catch (error) {
            Log.error(`Failed to get storage directory: ${error.message || error}`);
            throw error;
        }
    }
} 