import Log from '../log/Logger';

/**
 * Singleton IndexedDBStorage with centralized schema management and fixed database name.
 */
export default class IndexedDBStorage {
    // Singleton instance per store
    static instances = new Map();

    // Unified database configuration
    static DB_CONFIG = {
        NAME: "bio",
        VERSION: 1,
        STORE_SCHEMAS: {
            emuid: {},
            keystore: {},
        },
    };

    constructor({ storeName }) {
        if (!storeName) {
            throw new Error("Store name must be provided.");
        }

        if (IndexedDBStorage.instances.has(storeName)) {
            return IndexedDBStorage.instances.get(storeName);
        }

        if (!IndexedDBStorage.DB_CONFIG.STORE_SCHEMAS[storeName]) {
            throw new Error(`Store "${storeName}" is not defined in the schema.`);
        }

        this.storeName = storeName;
        this.db = null;
        this.initialized = false;

        IndexedDBStorage.instances.set(storeName, this);
    }

    /**
     * Initializes the database and ensures schema consistency.
     *
     * @returns {Promise<void>} Resolves when the database is initialized.
     */
    async init() {
        if (this.initialized) return;

        this.db = await this._openDB();
        this.initialized = true;
    }

    /**
     * Opens the database and manages schema creation/updates.
     *
     * @private
     * @returns {Promise<IDBDatabase>} Resolves with the database instance.
     */
    _openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(IndexedDBStorage.DB_CONFIG.NAME, IndexedDBStorage.DB_CONFIG.VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                Log.debug(`Database upgrade: Version ${event.oldVersion} -> ${event.newVersion}`);

                // Create or update object stores
                for (const [storeName] of Object.entries(IndexedDBStorage.DB_CONFIG.STORE_SCHEMAS)) {
                    if (!db.objectStoreNames.contains(storeName)) {
                        Log.debug(`Creating object store: ${storeName}`);
                        db.createObjectStore(storeName);
                    } else {
                        Log.debug(`Object store exists: ${storeName}`);
                    }
                }
            };

            request.onsuccess = (event) => {
                Log.debug(`Database "${IndexedDBStorage.DB_CONFIG.NAME}" opened successfully.`);
                resolve(event.target.result);
            };

            request.onerror = (event) => {
                Log.error(`Error opening database "${IndexedDBStorage.DB_CONFIG.NAME}":`, event.target.error);
                reject(event.target.error);
            };
        });
    }

    /**
     * Opens a transaction and accesses the specified object store.
     *
     * @param {string} mode - The transaction mode, e.g., "readwrite" or "readonly".
     * @returns {IDBObjectStore} The object store instance.
     */
    _openObjectStore(mode) {
        if (!this.db) {
            throw new Error("Database is not initialized. Call init() first.");
        }

        const transaction = this.db.transaction([this.storeName], mode);
        return transaction.objectStore(this.storeName);
    }

    /**
     * Adds a record to the specified object store.
     *
     * @param {Object} record - The record to add.
     * @returns {Promise<string>} Resolves when the record is added.
     */
    async addRecord(key, value) {
        await this.init();

        return new Promise((resolve, reject) => {
            const store = this._openObjectStore("readwrite");
            const request = store.put(value, key);

            request.onsuccess = () => { return resolve("Record added successfully.") };
            request.onerror = (event) => { return reject(`Add record error: ${event.target.error}`) };
        });
    }

    /**
     * Retrieves a record from the specified object store.
     *
     * @param {string|number} key - The key of the record to retrieve.
     * @returns {Promise<Object|null>} Resolves with the retrieved record or null if not found.
     */
    async getRecord(key) {
        await this.init();

        return new Promise((resolve, reject) => {
            const store = this._openObjectStore("readonly");
            const request = store.get(key);

            request.onsuccess = (event) => { return resolve(event.target.result || null) };
            request.onerror = (event) => { return reject(`Get record error: ${event.target.error}`) };
        });
    }

    /**
     * Updates a record in the specified object store.
     *
     * @param {Object} record - The record to update.
     * @returns {Promise<string>} Resolves when the record is updated.
     */
    async updateRecord(key, value) {
        await this.init();

        return new Promise((resolve, reject) => {
            const store = this._openObjectStore("readwrite");
            const request = store.put(value, key);

            request.onsuccess = () => { return resolve("Record updated successfully.") };
            request.onerror = (event) => { return reject(`Update record error: ${event.target.error}`) };
        });
    }

    /**
     * Deletes a record from the specified object store.
     *
     * @param {string|number} key - The key of the record to delete.
     * @returns {Promise<string>} Resolves when the record is deleted.
     */
    async deleteRecord(key) {
        await this.init();

        return new Promise((resolve, reject) => {
            const store = this._openObjectStore("readwrite");
            const request = store.delete(key);

            request.onsuccess = () => { return resolve("Record deleted successfully.") };
            request.onerror = (event) => { return reject(`Delete record error: ${event.target.error}`) };
        });
    }

    /**
     * Retrieves all records from the specified object store.
     *
     * @returns {Promise<Object[]>} Resolves with an array of all records.
     */
    async getAllRecords() {
        await this.init();

        return new Promise((resolve, reject) => {
            const store = this._openObjectStore("readonly");
            const request = store.getAll();

            request.onsuccess = (event) => { return resolve(event.target.result) };
            request.onerror = (event) => { return reject(`Get all records error: ${event.target.error}`) };
        });
    }

    /**
     * Clears all records from the specified object store.
     *
     * @returns {Promise<string>} Resolves when all records are cleared.
     */
    async clearStore() {
        await this.init();

        return new Promise((resolve, reject) => {
            const store = this._openObjectStore("readwrite");
            const request = store.clear();

            request.onsuccess = () => { return resolve("All records cleared successfully.") };
            request.onerror = (event) => { return reject(`Clear store error: ${event.target.error}`) };
        });
    }

    /**
     * Releases the database connection.
     */
    release() {
        if (this.db) {
            this.db.close();
            this.db = null;
            this.initialized = false;
            IndexedDBStorage.instances.delete(this.storeName);
            Log.debug(`Database "${IndexedDBStorage.DB_CONFIG.NAME}" connection for store "${this.storeName}" closed.`);
        }
    }
}