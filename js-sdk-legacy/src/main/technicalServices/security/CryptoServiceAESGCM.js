import Log from "../log/Logger";
import KeyStore from "./KeyStore";

/**
 * CryptoServiceAESGCM is responsible for handling encryption and decryption
 * using the AES-GCM algorithm. It relies on KeyStore for secure key management.
 */
export default class CryptoServiceAESGCM {
    /**
     * Constructs the CryptoServiceAESGCM instance with KeyStore.
     *
     * @param {KeyStore} keyStore - An instance of KeyStore for managing cryptographic keys.
     */
    constructor(encryptionKeyName, keyStore = null) {
        if (!encryptionKeyName) {
            throw new Error("encryptionKeyName is required.");
        }

        this.encryptionKeyName = encryptionKeyName; // Default key identifier

        this.keyStore = keyStore ?? new KeyStore();
        this.isInitialized = false; // Track initialization state
    }

    /**
     * Initializes the KeyStore instance.
     *
     * @returns {Promise<void>} Resolves when the KeyStore is successfully initialized.
     */
    async init() {
        if (!this.isInitialized) {
            await this.keyStore.init();
            this.isInitialized = true;
        }
    }

    /**
     * Encrypts the provided data using AES-GCM encryption.
     *
     * @param {string} data - The plaintext data to encrypt.
     * @returns {Promise<{ encryptedData: number[], iv: number[] }>} An object containing the encrypted data and the initialization vector (IV).
     * @throws {Error} If encryption fails.
     */
    async encrypt(data) {
        await this.init(); // Ensure initialization
        
        try {
            const key = await this.keyStore.getKey(this.encryptionKeyName);

            // Generate a random 12-byte IV for AES-GCM (recommended size)
            const iv = window.crypto.getRandomValues(new Uint8Array(12));

            // Encode the plaintext data as UTF-8
            const encodedData = new TextEncoder().encode(data);

            // Perform the encryption
            const encryptedBuffer = await window.crypto.subtle.encrypt(
                {
                    name: "AES-GCM",
                    iv: iv,
                },
                key,
                encodedData
            );

            // Convert ArrayBuffer to Uint8Array for easier handling
            const encryptedData = new Uint8Array(encryptedBuffer);

            return {
                encryptedData: Array.from(encryptedData),
                iv: Array.from(iv),
            };
        } catch (error) {
            Log.error("Encryption failed:", error);
            throw new Error("Encryption error occurred.");
        }
    }

    /**
     * Decrypts the provided encrypted data using AES-GCM decryption.
     *
     * @param {number[]} encryptedDataArray - The encrypted data as an array of numbers.
     * @param {number[]} ivArray - The initialization vector (IV) as an array of numbers.
     * @returns {Promise<string>} The decrypted plaintext data.
     * @throws {Error} If decryption fails.
     */
    async decrypt(encryptedDataArray, ivArray) {
        await this.init(); // Ensure initialization

        try {
            const key = await this.keyStore.getKey(this.encryptionKeyName);

            // Convert arrays back to Uint8Array
            const encryptedData = new Uint8Array(encryptedDataArray).buffer;
            const iv = new Uint8Array(ivArray);

            // Perform the decryption
            const decryptedBuffer = await window.crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv: iv,
                },
                key,
                encryptedData
            );

            // Decode the decrypted data from UTF-8
            const decryptedData = new TextDecoder().decode(decryptedBuffer);
            return decryptedData;
        } catch (error) {
            Log.error("Decryption failed:", error);
            throw new Error("Decryption error occurred.");
        }
    }
}
