import { assert } from 'chai';
import sinon from 'sinon';
import IndexedDBStorage from '../../../../../src/main/technicalServices/storage/IndexedDBStorage';
import CryptoServiceAESGCM from '../../../../../src/main/technicalServices/security/CryptoServiceAESGCM';
import EncryptedIndexedDBStorage from '../../../../../src/main/technicalServices/storage/EncryptedIndexedDBStorage';

describe('EncryptedIndexedDBStorage', () => {
    let sandbox;
    let mockIndexedDBStorage;
    let mockCryptoService;
    let encryptedStorage;


    before(() => {
        IndexedDBStorage.DB_CONFIG.NAME = "EncryptedIndexedDBStorageTest"; // Ensure schema is defined
        IndexedDBStorage.DB_CONFIG.STORE_SCHEMAS['teststore'] = {}; // Ensure schema is defined
        IndexedDBStorage.DB_CONFIG.VERSION = new Date().getTime(); // Use a timestamp for the version
    });

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        // Mock dependencies
        mockIndexedDBStorage = sandbox.createStubInstance(IndexedDBStorage);
        mockCryptoService = sandbox.createStubInstance(CryptoServiceAESGCM);

        encryptedStorage = new EncryptedIndexedDBStorage({ storeName: 'teststore' }, mockCryptoService);
        encryptedStorage.indexedDBStorage = mockIndexedDBStorage; // Replace with mock
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('init', () => {
        it('should initialize IndexedDB and CryptoService', async () => {
            await encryptedStorage.init();

            sinon.assert.calledOnce(mockIndexedDBStorage.init);
            sinon.assert.calledOnce(mockCryptoService.init);
        });

        it('should not reinitialize if already initialized', async () => {
            encryptedStorage.initialized = true;

            await encryptedStorage.init();

            sinon.assert.notCalled(mockIndexedDBStorage.init);
            sinon.assert.notCalled(mockCryptoService.init);
        });
    });

    describe('addRecord', () => {
        it('should encrypt the record and add it to the database', async () => {
            const key = 'test-key';
            const value = { data: 'test-data' };
            const encryptedValue = { encryptedData: [1, 2, 3], iv: [4, 5, 6] };

            sandbox.stub(encryptedStorage, '_encryptRecord').resolves(encryptedValue);
            mockIndexedDBStorage.addRecord.resolves('Success');

            const result = await encryptedStorage.addRecord(key, value);

            sinon.assert.calledOnceWithExactly(encryptedStorage._encryptRecord, value);
            sinon.assert.calledOnceWithExactly(mockIndexedDBStorage.addRecord, key, encryptedValue);
            assert.equal(result, 'Success');
        });
    });

    describe('getRecord', () => {
        it('should retrieve and decrypt a record from the database', async () => {
            const key = 'test-key';
            const encryptedValue = { encryptedData: [1, 2, 3], iv: [4, 5, 6] };
            const decryptedValue = { data: 'test-data' };

            mockIndexedDBStorage.getRecord.resolves(encryptedValue);
            sandbox.stub(encryptedStorage, '_decryptRecord').resolves(decryptedValue);

            const result = await encryptedStorage.getRecord(key);

            sinon.assert.calledOnceWithExactly(mockIndexedDBStorage.getRecord, key);
            sinon.assert.calledOnceWithExactly(encryptedStorage._decryptRecord, encryptedValue);
            assert.deepEqual(result, decryptedValue);
        });

        it('should return null if no record is found', async () => {
            mockIndexedDBStorage.getRecord.resolves(null);

            const result = await encryptedStorage.getRecord('non-existent-key');

            assert.isNull(result);
        });
    });

    describe('updateRecord', () => {
        it('should encrypt the record and update it in the database', async () => {
            const key = 'test-key';
            const value = { data: 'updated-data' };
            const encryptedValue = { encryptedData: [7, 8, 9], iv: [10, 11, 12] };

            sandbox.stub(encryptedStorage, '_encryptRecord').resolves(encryptedValue);
            mockIndexedDBStorage.updateRecord.resolves('Updated');

            const result = await encryptedStorage.updateRecord(key, value);

            sinon.assert.calledOnceWithExactly(encryptedStorage._encryptRecord, value);
            sinon.assert.calledOnceWithExactly(mockIndexedDBStorage.updateRecord, key, encryptedValue);
            assert.equal(result, 'Updated');
        });
    });

    describe('deleteRecord', () => {
        it('should delete a record from the database', async () => {
            mockIndexedDBStorage.deleteRecord.resolves('Deleted');

            const result = await encryptedStorage.deleteRecord('test-key');

            sinon.assert.calledOnceWithExactly(mockIndexedDBStorage.deleteRecord, 'test-key');
            assert.equal(result, 'Deleted');
        });
    });

    describe('getAllRecords', () => {
        it('should retrieve and decrypt all records from the database', async () => {
            const encryptedRecords = [
                { encryptedData: [1, 2, 3], iv: [4, 5, 6] },
                { encryptedData: [7, 8, 9], iv: [10, 11, 12] }
            ];
            const decryptedRecords = [
                { data: 'record1' },
                { data: 'record2' }
            ];

            mockIndexedDBStorage.getAllRecords.resolves(encryptedRecords);
            sandbox.stub(encryptedStorage, '_decryptRecord').onCall(0).resolves(decryptedRecords[0]).onCall(1).resolves(decryptedRecords[1]);

            const result = await encryptedStorage.getAllRecords();

            sinon.assert.calledOnce(mockIndexedDBStorage.getAllRecords);
            sinon.assert.calledTwice(encryptedStorage._decryptRecord);
            assert.deepEqual(result, decryptedRecords);
        });
    });

    describe('clearStore', () => {
        it('should clear all records from the database', async () => {
            mockIndexedDBStorage.clearStore.resolves('Cleared');

            const result = await encryptedStorage.clearStore();

            sinon.assert.calledOnce(mockIndexedDBStorage.clearStore);
            assert.equal(result, 'Cleared');
        });
    });

    describe('_encryptRecord', () => {
        it('should encrypt a record using the CryptoService', async () => {
            const record = { data: 'to-encrypt' };
            const encryptedValue = { encryptedData: [1, 2, 3], iv: [4, 5, 6] };

            mockCryptoService.encrypt.resolves(encryptedValue);

            const result = await encryptedStorage._encryptRecord(record);

            sinon.assert.calledOnceWithExactly(mockCryptoService.encrypt, JSON.stringify(record));
            assert.deepEqual(result, encryptedValue);
        });
    });

    describe('_decryptRecord', () => {
        it('should decrypt a record using the CryptoService', async () => {
            const encryptedRecord = { encryptedData: [1, 2, 3], iv: [4, 5, 6] };
            const decryptedData = { data: 'decrypted-data' };

            mockCryptoService.decrypt.resolves(JSON.stringify(decryptedData));

            const result = await encryptedStorage._decryptRecord(encryptedRecord);

            sinon.assert.calledOnceWithExactly(mockCryptoService.decrypt, encryptedRecord.encryptedData, encryptedRecord.iv);
            assert.deepEqual(result, decryptedData);
        });
    });
});
