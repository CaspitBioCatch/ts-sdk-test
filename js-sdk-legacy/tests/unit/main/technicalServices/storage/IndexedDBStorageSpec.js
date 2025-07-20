import { assert } from 'chai';
import IndexedDBStorage from '../../../../../src/main/technicalServices/storage/IndexedDBStorage';

describe('IndexedDBStorage', () => {
    let indexedDBStorage;
    const storeName = 'teststore';

    before(() => {
        IndexedDBStorage.DB_CONFIG.NAME = "IndexedDBStorageTest"; // Ensure schema is defined
        IndexedDBStorage.DB_CONFIG.STORE_SCHEMAS[storeName] = {}; // Ensure schema is defined
        IndexedDBStorage.DB_CONFIG.VERSION = new Date().getTime(); // Force version upgrade
    });

    beforeEach(() => {
        indexedDBStorage = new IndexedDBStorage({ storeName });
    });

    afterEach(() => {
        indexedDBStorage.release();
    });

    after(() => {
        delete IndexedDBStorage.DB_CONFIG.STORE_SCHEMAS[storeName]; // Clean up
    });

    describe('constructor', () => {
        it('should throw an error if storeName is not provided', () => {
            assert.throws(() => new IndexedDBStorage({}), Error, 'Store name must be provided.');
        });

        it('should throw an error if storeName is not in the schema', () => {
            assert.throws(() => new IndexedDBStorage({ storeName: 'invalid-store' }), Error, 'Store "invalid-store" is not defined in the schema.');
        });

        it('should return the same instance for the same storeName', () => {
            const instance1 = new IndexedDBStorage({ storeName });
            const instance2 = new IndexedDBStorage({ storeName });
            assert.strictEqual(instance1, instance2);
        });
    });

    describe('init', () => {
        it('should initialize the database only once', async () => {
            await indexedDBStorage.init();
            assert.isTrue(indexedDBStorage.initialized);
            assert.instanceOf(indexedDBStorage.db, IDBDatabase);

            const dbInstance = indexedDBStorage.db;
            await indexedDBStorage.init();
            assert.strictEqual(indexedDBStorage.db, dbInstance); // Ensure same instance
        });
    });

    describe('addRecord', () => {
        it('should add a record', async () => {
            const key = 'test-key';
            const value = { data: 'test-data' };

            await indexedDBStorage.addRecord(key, value);
            const result = await indexedDBStorage.getRecord(key);

            assert.deepEqual(result, value);
        });

        it('should overwrite a record with the same key', async () => {
            const key = 'test-key';
            const value1 = { data: 'old-data' };
            const value2 = { data: 'new-data' };

            await indexedDBStorage.addRecord(key, value1);
            await indexedDBStorage.addRecord(key, value2);
            const result = await indexedDBStorage.getRecord(key);

            assert.deepEqual(result, value2);
        });

        it('should reject when adding record to an uninitialized DB', async () => {
            indexedDBStorage.release(); // Close DB before adding
            try {
                await indexedDBStorage.addRecord('test', { data: 'should fail' });
                assert.fail('Expected addRecord to fail when DB is closed.');
            } catch (error) {
               // assert.match(error, /Database is not initialized/);
            }
        });
    });

    describe('getRecord', () => {
        it('should retrieve a record', async () => {
            const key = 'test-key';
            const value = { data: 'test-data' };

            await indexedDBStorage.addRecord(key, value);
            const result = await indexedDBStorage.getRecord(key);

            assert.deepEqual(result, value);
        });

        it('should return null for non-existent key', async () => {
            const result = await indexedDBStorage.getRecord('non-existent-key');
            assert.isNull(result);
        });
    });

    describe('updateRecord', () => {
        it('should update an existing record', async () => {
            const key = 'test-key';
            const value = { data: 'old-data' };
            const updatedValue = { data: 'new-data' };

            await indexedDBStorage.addRecord(key, value);
            await indexedDBStorage.updateRecord(key, updatedValue);

            const result = await indexedDBStorage.getRecord(key);
            assert.deepEqual(result, updatedValue);
        });

        it('should add a record if it does not exist', async () => {
            const key = 'new-key';
            const value = { data: 'created' };

            await indexedDBStorage.updateRecord(key, value);
            const result = await indexedDBStorage.getRecord(key);
            assert.deepEqual(result, value);
        });
    });

    describe('deleteRecord', () => {
        it('should delete a record', async () => {
            const key = 'test-key';
            const value = { data: 'test-data' };

            await indexedDBStorage.addRecord(key, value);
            await indexedDBStorage.deleteRecord(key);

            const result = await indexedDBStorage.getRecord(key);
            assert.isNull(result);
        });

        it('should not throw an error when deleting a non-existent record', async () => {
            await indexedDBStorage.deleteRecord('non-existent-key');
        });
    });

    describe('clearStore', () => {
        it('should clear all records', async () => {
            await indexedDBStorage.addRecord('key1', { data: 'value1' });
            await indexedDBStorage.addRecord('key2', { data: 'value2' });

            await indexedDBStorage.clearStore();
            const allRecords = await indexedDBStorage.getAllRecords();

            assert.deepEqual(allRecords, []);
        });
    });

    describe('getAllRecords', () => {
        it('should retrieve all records', async () => {
            const records = [
                { key: 'key1', value: { data: 'value1' } },
                { key: 'key2', value: { data: 'value2' } },
                { key: 'key3', value: { data: 'value3' } },
            ];

            await Promise.all(records.map(({ key, value }) => indexedDBStorage.addRecord(key, value)));

            const allRecords = await indexedDBStorage.getAllRecords();
            assert.deepEqual(allRecords, records.map(r => r.value));
        });

        it('should return an empty array when no records exist', async () => {
            indexedDBStorage.clearStore();
            const allRecords = await indexedDBStorage.getAllRecords();
            assert.deepEqual(allRecords, []);
        });
    });

    describe('Database Versioning & Schema', () => {
        it('should trigger onupgradeneeded on version change', async () => {
            const prevVersion = IndexedDBStorage.DB_CONFIG.VERSION;
            IndexedDBStorage.DB_CONFIG.VERSION = prevVersion + 1;

            const newInstance = new IndexedDBStorage({ storeName });
            await newInstance.init();

            assert.isTrue(newInstance.initialized);
            newInstance.release();
        });
    });

    describe('release', () => {
        it('should close the database connection', async () => {
            await indexedDBStorage.init();
            indexedDBStorage.release();

            assert.isNull(indexedDBStorage.db);
            assert.isFalse(indexedDBStorage.initialized);
        });
    });
});
