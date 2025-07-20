import Log from "../log/Logger";
import IndexedDBStorage from "../storage/IndexedDBStorage";

/**
 * KeyStore manages cryptographic keys securely using IndexedDB.
 * This class provides methods to retrieve and delete cryptographic keys, with private utilities for key management.
 */
export default class KeyStore {
    /**
     * Constructs the KeyStore instance with IndexedDBStorage as a dependency.
     *
     * @param {IndexedDBStorage} indexedDBStorage - An instance of IndexedDBStorage.
     */
    constructor(indexedDBStorage) {

        this.storage = indexedDBStorage ?? new IndexedDBStorage({
            storeName: "keystore",
        });
    }

    /**
     * Initializes the IndexedDBStorage instance.
     *
     * @returns {Promise<void>} Resolves when the storage is successfully initialized.
     */
    async init() {
        await this.storage.init();
    }


    /**
     * Retrieves a cryptographic key from the IndexedDB. If the key is not found, it generates a new key, saves it, and returns it.
     *
     * IndexedDB is a browser-managed, secure storage mechanism. By design, it ensures that data stored in it is isolated to the origin
     * and accessible only to scripts from the same domain. This provides a secure environment for storing cryptographic keys.
     * 
     * IndexedDB also supports the Web Crypto API's `CryptoKey` objects. This allows the keys to remain non-exportable, meaning they
     * cannot be extracted from the browser's secure environment. Instead, the keys are securely handled by the Web Crypto API
     * within the browser's context, ensuring confidentiality and mitigating the risk of unauthorized access. For more details, see
     * the [MDN documentation on CryptoKey](https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey).
     * 
     * See the [MDN documentation on IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API).
     *
     * @param {string} keyId - The unique identifier for the key.
     * @returns {Promise<CryptoKey>} Resolves with the CryptoKey.
     */
    async getKey(keyId) {
        try {
            const record = await this.storage.getRecord(keyId);
            if (!record) {
                const newKey = await this._generateKey();
                await this._saveKey(keyId, newKey);
                return newKey;
            }

            return record;
        } catch (error) {
            Log.error("Failed to import key:", error);
            throw new Error("Key retrieval failed.");
        }
    }

    /**
     * Deletes a cryptographic key from the IndexedDB.
     *
     * @param {string} keyId - The unique identifier for the key.
     * @returns {Promise<void>} Resolves when the key is successfully deleted.
     */
    async deleteKey(keyId) {
        await this.storage.deleteRecord(keyId);
    }

    /**
     * Generates a new AES-GCM encryption key and stores it in the instance.
     * This method ensures that a secure, random key is used for encryption.
     *
     * Setting `exportable` to `false` ensures that the key cannot be extracted
     * or exported from the Web Crypto API. This prevents unauthorized access
     * to the raw key material, even if an attacker gains access to the IndexedDB
     * storage or the application's code. By making the key non-exportable, the
     * encryption key remains secure and can only be used within the context of
     * the browser's cryptographic environment.
     *
     * @private
     * @returns {Promise<CryptoKey>} The generated cryptographic key.
     * @throws {Error} If key generation fails.
     */
    async _generateKey() {
        try {
            return await window.crypto.subtle.generateKey(
                {
                    name: "AES-GCM",
                    length: 256, // 256-bit key for strong encryption
                },
                false, // Non-exportable for added security
                ["encrypt", "decrypt"]
            );
        } catch (error) {
            Log.error("Failed to generate key:", error);
            throw new Error("Key generation failed.");
        }
    }

    /**
     * Saves a cryptographic cryptoKey in the IndexedDB.
     *
     * @private
     * @param {string} keyId - The unique identifier for the key.
     * @param {CryptoKey} cryptoKey - The cryptographic key to store.
     * @returns {Promise<void>} Resolves when the key is successfully saved.
     */
    async _saveKey(keyId, cryptoKey) {
        try {
            await this.storage.addRecord(keyId, cryptoKey);
        } catch (error) {
            Log.error("Failed to save key:", error);
            throw new Error("Key saving failed.");
        }
    }

    /**
     * Clears all keys from the IndexedDB.
     *
     * @private
     * @returns {Promise<void>} Resolves when all keys are successfully cleared.
     */
    async _clearKeys() {
        await this.storage.clearStore();
    }

    /**
     * Releases the IndexedDBStorage resources by closing the connection.
     */
    release() {
        this.storage.release();
    }
}
