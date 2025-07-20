import { assert } from 'chai';
import sinon from 'sinon';
import KeyStore from '../../../../../src/main/technicalServices/security/KeyStore';
import CryptoServiceAESGCM from '../../../../../src/main/technicalServices/security/CryptoServiceAESGCM';
import TestBrowserUtils from "../../../../TestBrowserUtils";

describe('CryptoServiceAESGCM', () => {
    let sandbox;
    let mockKeyStore;
    let cryptoService;
    const encryptionKeyName = 'test-encryption-key';

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        // Mock KeyStore dependency
        mockKeyStore = sandbox.createStubInstance(KeyStore);
        cryptoService = new CryptoServiceAESGCM(encryptionKeyName, mockKeyStore);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('constructor', () => {
        it('should throw an error if encryptionKeyName is not provided', () => {
            assert.throws(() => {return new CryptoServiceAESGCM(null)}, Error, 'encryptionKeyName is required.');
        });

        it('should initialize with the provided encryptionKeyName and KeyStore', () => {
            assert.equal(cryptoService.encryptionKeyName, encryptionKeyName);
            assert.equal(cryptoService.keyStore, mockKeyStore);
            assert.isFalse(cryptoService.isInitialized);
        });
    });

    describe('init', () => {
        it('should initialize the KeyStore if not already initialized', async () => {
            await cryptoService.init();

            sinon.assert.calledOnce(mockKeyStore.init);
            assert.isTrue(cryptoService.isInitialized);
        });

        it('should not reinitialize if already initialized', async () => {
            cryptoService.isInitialized = true;

            await cryptoService.init();

            sinon.assert.notCalled(mockKeyStore.init);
        });
    });

    describe('encrypt', () => {
        it('should encrypt data and return the encrypted data with IV', async () => {
            if (typeof window.crypto.subtle === 'undefined') {
                return;
            }
            const plaintext = 'Hello, world!';
            const mockKey = {}; // Mock cryptographic key
            const mockIV = new Uint8Array(12);
            const mockEncryptedData = new Uint8Array([1, 2, 3, 4]);

            sandbox.stub(window.crypto, 'getRandomValues').returns(mockIV);
            mockKeyStore.getKey.resolves(mockKey);
            sandbox.stub(window.crypto.subtle, 'encrypt').resolves(mockEncryptedData.buffer);

            const result = await cryptoService.encrypt(plaintext);

            sinon.assert.calledOnceWithExactly(mockKeyStore.getKey, encryptionKeyName);
            assert.deepEqual(result.iv, Array.from(mockIV));
            assert.deepEqual(result.encryptedData, Array.from(mockEncryptedData));
        });

        it('should throw an error if encryption fails', async () => {
            if (typeof window.crypto.subtle === 'undefined') {
                return;
            }
            sandbox.stub(window.crypto.subtle, 'encrypt').rejects(new Error('Encryption error occurred.'));

            try {
                await cryptoService.encrypt('Hello');
                assert.fail('Expected encrypt to throw an error');
            } catch (error) {
                assert.equal(error.message, 'Encryption error occurred.', 'Expected error message to match');
            }
        });
    });

    describe('decrypt', () => {
        it('should decrypt encrypted data and return the plaintext', async () => {
            if (typeof window.crypto.subtle === 'undefined') {
                return;
            }
            const mockKey = {}; // Mock cryptographic key
            const encryptedDataArray = [1, 2, 3, 4];
            const ivArray = [5, 6, 7, 8];
            const decryptedData = 'Hello, world!';

            mockKeyStore.getKey.resolves(mockKey);
            sandbox.stub(window.crypto.subtle, 'decrypt').resolves(new TextEncoder().encode(decryptedData).buffer);

            const result = await cryptoService.decrypt(encryptedDataArray, ivArray);

            sinon.assert.calledOnceWithExactly(mockKeyStore.getKey, encryptionKeyName);
            assert.equal(result, decryptedData);
        });

        it('should throw an error if decryption fails', async () => {
            if (typeof window.crypto.subtle === 'undefined') {
                return;
            }
            sandbox.stub(window.crypto.subtle, 'decrypt').rejects(new Error('Decryption error occurred.'));

            try {
                await cryptoService.decrypt([1, 2, 3, 4], [5, 6, 7, 8]);
                assert.fail('Expected decrypt to throw an error');
            } catch (error) {
                assert.equal(error.message, 'Decryption error occurred.', 'Expected error message to match');
            }
        });
    });
});
