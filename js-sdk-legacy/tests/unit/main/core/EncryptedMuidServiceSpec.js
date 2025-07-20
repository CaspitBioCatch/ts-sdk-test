import { assert } from 'chai';
import sinon from 'sinon';

import EncryptedMuidService from '../../../../src/main/core/EncryptedMuidService';
import EncryptedIndexedDBStorage from '../../../../src/main/technicalServices/storage/EncryptedIndexedDBStorage';
import CDUtils from '../../../../src/main/technicalServices/CDUtils';

describe('EncryptedMuidService', () => {
    let sandbox;
    let encryptedMuidService;
    let mockDependencies;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        // Mock dependencies
        mockDependencies = {
            domUtils: {},
            utils: CDUtils,
            configurationRepository: {},
            keys: { indexedDBKey: 'emuid' },
            encryptedIndexedDB: sandbox.createStubInstance(EncryptedIndexedDBStorage),
        };

        encryptedMuidService = new EncryptedMuidService(mockDependencies);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('_fetchMuidFromStorage', () => {

        it('should generate a new MUID if none exists', async () => {
            sandbox.stub(encryptedMuidService, '_fetchMuidFromStorage').resolves(null);
            sandbox.stub(encryptedMuidService, '_isValidMuid').returns(false);
            sandbox.spy(encryptedMuidService, '_saveMuidToStorage');
            sandbox.stub(encryptedMuidService, '_generateNewMuid').resolves('new-generated-muid');

            let muid = await encryptedMuidService.getEncryptedMuid();

            assert.equal(muid, 'new-generated-muid', 'Expected MUID to match the generated value');
            sinon.assert.calledOnce(encryptedMuidService._saveMuidToStorage);
        });

        it('should return null if getEncryptedMuid fails', async () => {
            sandbox.stub(encryptedMuidService, '_fetchMuidFromStorage').throws(new Error('Storage error'));

            let muid = await encryptedMuidService.getEncryptedMuid();
            assert.equal(muid, undefined, 'Expected muid to be undefined when failed')
        });

        it('should fetch and return a valid MUID from storage', async () => {
            const storedMuid = '1735130065607-B853AA15-D26D-45C9-A89A-A5B805FB961D';
            mockDependencies.encryptedIndexedDB.getRecord.resolves({ emuid: storedMuid });

            const result = await encryptedMuidService._fetchMuidFromStorage();

            assert.equal(result, storedMuid, 'Expected fetched MUID to match the stored value');
        });

        it('should return null when storage retrieval fails', async () => {
            mockDependencies.encryptedIndexedDB.getRecord.throws(new Error('Storage error'));

            const result = await encryptedMuidService._fetchMuidFromStorage();

            assert.isNull(result, 'Expected result to be null on error');
        });
    });

    describe('_saveMuidToStorage', () => {
        it('should save the MUID to storage', async () => {
            const newEmuid = '1735130065607-B853AA15-D26D-45C9-A89A-A5B805FB961D';

            await encryptedMuidService._saveMuidToStorage(newEmuid);

            sinon.assert.calledWith(mockDependencies.encryptedIndexedDB.updateRecord, 'emuid', { emuid: newEmuid });
        });

        it('should handle errors when saving to storage', async () => {
            const newEmuid = '1735130065607-B853AA15-D26D-45C9-A89A-A5B805FB961D';
            mockDependencies.encryptedIndexedDB.updateRecord.throws(new Error('Storage error'));

            await encryptedMuidService._saveMuidToStorage(newEmuid);
        });
    });

    describe('_isValidMuid', () => {
        it('should validate a correct MUID format', () => {
            const validMuid = '1735130065607-B853AA15-D26D-45C9-A89A-A5B805FB961D';
            const result = encryptedMuidService._isValidMuid(validMuid);

            assert.isTrue(result, 'Expected MUID to be valid');
        });

        it('should invalidate an incorrect MUID format', () => {
            const invalidMuid = 'invalid-muid';
            const result = encryptedMuidService._isValidMuid(invalidMuid);

            assert.isFalse(result, 'Expected MUID to be invalid');
        });

        it('should invalidate an empty or null MUID', () => {
            assert.isFalse(encryptedMuidService._isValidMuid(null), 'Expected null MUID to be invalid');
            assert.isFalse(encryptedMuidService._isValidMuid(''), 'Expected empty MUID to be invalid');
        });
    });
});