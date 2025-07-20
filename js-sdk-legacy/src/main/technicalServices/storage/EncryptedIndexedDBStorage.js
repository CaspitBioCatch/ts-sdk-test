import IndexedDBStorage from "./IndexedDBStorage";
import AESGCM_CryptoService from "../security/CryptoServiceAESGCM";

/**
 * EncryptedIndexedDBStorage handles encrypted storage and retrieval of data in IndexedDB.
 * It uses IndexedDBStorage for database operations and CryptoService for encryption/decryption.
 */
export default class EncryptedIndexedDBStorage {
    /**
     * Constructs the EncryptedIndexedDBStorage instance.
     *
     * @param {Object} config - Configuration for IndexedDBStorage.
     * @param {string} config.storeName - The store name for IndexedDBStorage.
     * @param {string} config.primaryKey - The primary key for the IndexedDBStorage.
     * @param {number} config.version - The version of the IndexedDB database.
     * @param {AESGCM_CryptoService} cryptoService - An instance of CryptoService for encryption/decryption operations.
     */
    constructor({ storeName }, cryptoService = null) {

        this.indexedDBStorage = new IndexedDBStorage({
            storeName,
        });

        this.cryptoService = cryptoService ?? new AESGCM_CryptoService(storeName);
        this.initialized = false;
    }

    /**
     * Initializes the IndexedDB storage and ensures the encryption key exists.
     *
     * @returns {Promise<void>}
     */
    async init() {
        if (this.initialized) return;

        await this.indexedDBStorage.init();
        await this.cryptoService.init();

        this.initialized = true;
    }

    /**
     * Releases database resources.
     */
    release() {
        this.indexedDBStorage.release();
        this.encryptionKeyStorage.release();
        this.initialized = false;
    }

    /**
     * Adds a record to the database after encrypting it.
     *
     * @param {string} key - The key to associate with the record.
     * @param {Object} value - The record to be encrypted and stored.
     * @returns {Promise<string>} A success message upon successful encryption and storage.
     */
    async addRecord(key, value) {
        await this.init();
        const encryptedValue = await this._encryptRecord(value);
        return this.indexedDBStorage.addRecord(key, encryptedValue);
    }

    /**
     * Retrieves a record from the database and decrypts it.
     *
     * @param {string} key - The key of the record to retrieve.
     * @returns {Promise<Object|null>} The decrypted record, or null if not found.
     */
    async getRecord(key) {
        await this.init();
        const encryptedValue = await this.indexedDBStorage.getRecord(key);
        if (!encryptedValue) {
            return null;
        }
        return this._decryptRecord(encryptedValue);
    }

    /**
     * Updates a record in the database after encrypting it.
     *
     * @param {string} key - The key of the record to update.
     * @param {Object} value - The record to be encrypted and updated.
     * @returns {Promise<string>} A success message upon successful encryption and update.
     */
    async updateRecord(key, value) {
        await this.init();
        const encryptedValue = await this._encryptRecord(value);
        return this.indexedDBStorage.updateRecord(key, encryptedValue);
    }

    /**
     * Deletes a record from the database.
     *
     * @param {string} key - The key of the record to delete.
     * @returns {Promise<string>} A success message upon successful deletion.
     */
    async deleteRecord(key) {
        await this.init();
        return this.indexedDBStorage.deleteRecord(key);
    }

    /**
     * Retrieves all records from the database and decrypts them.
     *
     * @returns {Promise<Object[]>} An array of decrypted records.
     */
    async getAllRecords() {
        await this.init();
        const encryptedRecords = await this.indexedDBStorage.getAllRecords();
        return Promise.all(encryptedRecords.map((record) => { return this._decryptRecord(record) }));
    }

    /**
     * Clears all records from the database.
     *
     * @returns {Promise<string>} A success message upon successful clearance.
     */
    async clearStore() {
        await this.init();
        return this.indexedDBStorage.clearStore();
    }

    /**
     * Encrypts a record using the CryptoService.
     *
     * @private
     * @param {Object} record - The record to be encrypted.
     * @returns {Promise<Object>} The encrypted record.
     */
    async _encryptRecord(record) {
        const { encryptedData, iv } = await this.cryptoService.encrypt(JSON.stringify(record));
        return { encryptedData, iv };
    }

    /**
     * Decrypts a record using the CryptoService.
     *
     * @private
     * @param {Object} encryptedRecord - The record to be decrypted.
     * @returns {Promise<Object>} The decrypted record.
     */
    async _decryptRecord(encryptedRecord) {
        const { encryptedData, iv } = encryptedRecord;
        const decryptedData = await this.cryptoService.decrypt(encryptedData, iv);
        return JSON.parse(decryptedData);
    }
}
