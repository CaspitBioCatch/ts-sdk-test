import { assert } from 'chai';
import sinon from 'sinon';
import KeyStore from '../../../../../src/main/technicalServices/security/KeyStore';
import IndexedDBStorage from '../../../../../src/main/technicalServices/storage/IndexedDBStorage';
import TestBrowserUtils from "../../../../TestBrowserUtils";

describe('KeyStore', () => {
    let sandbox;
    let mockIndexedDBStorage;
    let keyStore;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        // Mock IndexedDBStorage dependency
        mockIndexedDBStorage = sandbox.createStubInstance(IndexedDBStorage);
        keyStore = new KeyStore(mockIndexedDBStorage);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('init', () => {
        it('should initialize the IndexedDBStorage instance', async () => {
            await keyStore.init();
            sinon.assert.calledOnce(mockIndexedDBStorage.init);
        });
    });

    describe('getKey', () => {
        it('should retrieve an existing key from storage', async () => {
            const keyId = 'test-key';
            const storedKey = { type: 'mockCryptoKey' }; // Simulate a stored CryptoKey
            mockIndexedDBStorage.getRecord.resolves(storedKey);

            const result = await keyStore.getKey(keyId);

            sinon.assert.calledOnceWithExactly(mockIndexedDBStorage.getRecord, keyId);
            assert.equal(result, storedKey, 'Expected retrieved key to match stored key');
        });

        it('should generate, save, and return a new key if none exists', async () => {
            const keyId = 'new-key';
            mockIndexedDBStorage.getRecord.resolves(null);
            const generatedKey = { type: 'generatedCryptoKey' }; // Simulate a generated CryptoKey

            sandbox.stub(keyStore, '_generateKey').resolves(generatedKey);
            sandbox.stub(keyStore, '_saveKey').resolves();

            const result = await keyStore.getKey(keyId);

            sinon.assert.calledOnceWithExactly(mockIndexedDBStorage.getRecord, keyId);
            sinon.assert.calledOnce(keyStore._generateKey);
            sinon.assert.calledOnceWithExactly(keyStore._saveKey, keyId, generatedKey);
            assert.equal(result, generatedKey, 'Expected generated key to be returned');
        });

        it('should throw an error if key retrieval fails', async () => {
            const keyId = 'failing-key';
            const errorMessage = 'Key retrieval failed.';
            mockIndexedDBStorage.getRecord.rejects(new Error(errorMessage));

            try {
                await keyStore.getKey(keyId);
                assert.fail('Expected getKey to throw an error');
            } catch (error) {
                assert.equal(error.message, errorMessage, 'Expected error message to match');
            }
        });
    });

    describe('deleteKey', () => {
        it('should delete a key from storage', async () => {
            const keyId = 'key-to-delete';

            await keyStore.deleteKey(keyId);

            sinon.assert.calledOnceWithExactly(mockIndexedDBStorage.deleteRecord, keyId);
        });
    });

    describe('_generateKey', () => {
        it('should generate a new AES-GCM encryption key', async () => {
            if (typeof window.crypto.subtle === 'undefined') {
                return;
            }
            const mockCryptoKey = { type: 'mockGeneratedKey' }; // Simulate a generated CryptoKey
            sandbox.stub(window.crypto.subtle, 'generateKey').resolves(mockCryptoKey);

            const result = await keyStore._generateKey();

            sinon.assert.calledOnceWithExactly(window.crypto.subtle.generateKey, 
                { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
            );
            assert.equal(result, mockCryptoKey, 'Expected generated key to match mock key');
        });

        it('should throw an error if key generation fails', async () => {
            if (typeof window.crypto.subtle === 'undefined') {
                return;
            }
            const errorMessage = 'Key generation failed.';
            sandbox.stub(window.crypto.subtle, 'generateKey').rejects(new Error(errorMessage));

            try {
                await keyStore._generateKey();
                assert.fail('Expected _generateKey to throw an error');
            } catch (error) {
                assert.equal(error.message, errorMessage, 'Expected error message to match');
            }
        });
    });

    describe('_saveKey', () => {
        it('should save a key to storage', async () => {
            const keyId = 'key-to-save';
            const mockCryptoKey = { type: 'mockCryptoKey' };

            await keyStore._saveKey(keyId, mockCryptoKey);

            sinon.assert.calledOnceWithExactly(mockIndexedDBStorage.addRecord, keyId, mockCryptoKey);
        });

        it('should throw an error if saving fails', async () => {
            const keyId = 'key-to-fail';
            const mockCryptoKey = { type: 'mockCryptoKey' };
            const errorMessage = 'Key saving failed.';
            mockIndexedDBStorage.addRecord.rejects(new Error(errorMessage));

            try {
                await keyStore._saveKey(keyId, mockCryptoKey);
                assert.fail('Expected _saveKey to throw an error');
            } catch (error) {
                assert.equal(error.message, errorMessage, 'Expected error message to match');
            }
        });
    });

    describe('_clearKeys', () => {
        it('should clear all keys from storage', async () => {
            await keyStore._clearKeys();

            sinon.assert.calledOnce(mockIndexedDBStorage.clearStore);
        });
    });

    describe('release', () => {
        it('should release the storage resources', () => {
            keyStore.release();

            sinon.assert.calledOnce(mockIndexedDBStorage.release);
        });
    });
});
