import Log from '../technicalServices/log/Logger';
import EncryptedIndexedDBStorage from "../technicalServices/storage/EncryptedIndexedDBStorage";

/**
 * A service for managing the Machine/User ID (MUID), which is encrypted and stored
 * securely in IndexedDB. The service handles MUID generation, validation, retrieval,
 * and queuing for server-side processing.
 */
export default class EncryptedMuidService {

    constructor({
        domUtils,
        utils,
        configurationRepository,
        keys = { indexedDBKey: "emuid" },
        encryptedIndexedDB = new EncryptedIndexedDBStorage({ storeName: "emuid" }),
    }) {
        this._domUtils = domUtils;
        this._utils = utils;
        this._configurationRepository = configurationRepository;
        this._encryptedStorage = encryptedIndexedDB;
        this._keys = keys;
    }

    /**
     * Initializes the encrypted MUID. If a valid MUID exists, it is retrieved
     * from storage; otherwise, a new MUID is generated.
     *
     * @return {!Promise<string>} A promise that resolves to the initialized MUID.
     * @throws {Error} If the MUID initialization fails.
     */
    async getEncryptedMuid() {
        try {
            Log.debug("Fetching existing Encrypted MUID from storage...");
            let muid = await this._fetchMuidFromStorage();

            if (!this._isValidMuid(muid)) {
                Log.warn("No valid Encrypted MUID found. Generating a new one...");
                muid = await this._generateNewMuid();
                await this._saveMuidToStorage(muid);
            }

            return muid;
        } catch (error) {
            Log.error("Failed to initialize MUID:", error);
            return null;
        }
    }

    /**
     * Fetches the encrypted MUID from storage.
     *
     * @return {!Promise<string|null>} A promise that resolves to the stored MUID,
     *     or null if no MUID exists.
     */
    async _fetchMuidFromStorage() {
        try {
            const data = await this._encryptedStorage.getRecord(this._keys.indexedDBKey);
            Log.debug("Fetched Encrypted MUID from storage.");
            return data?.emuid || null;
        } catch (error) {
            Log.error("Error retrieving Encrypted MUID from storage:", error);
            return null;
        }
    }

    /**
     * Saves the encrypted MUID to storage.
     *
     * @param {string} newEmuid The MUID to save.
     * @return {!Promise<void>} A promise that resolves when the MUID is saved.
     */
    async _saveMuidToStorage(newEmuid) {
        try {
            await this._encryptedStorage.updateRecord(this._keys.indexedDBKey, { emuid: newEmuid });
            Log.debug("Encrypted MUID saved to storage.");
        } catch (error) {
            Log.error("Error saving Encrypted MUID to storage:", error);
        }
    }

    _generateNewMuid() {
        return this._utils.dateNow() + '-' + this._utils.generateUUID().toUpperCase();
    }

    /**
     * Checks if the provided MUID is valid.
     *
     * @param {string} muid The MUID to validate.
     * @return {boolean} True if the MUID is valid; otherwise, false.
     */
    _isValidMuid(muid) {
        if (!muid) return false;
        return /^([0-9]{13,}-)?[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(muid);
    }
}
