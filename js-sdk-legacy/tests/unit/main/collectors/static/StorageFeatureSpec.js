import StorageFeature from '../../../../../src/main/collectors/static/StorageFeature';
import DataQ from "../../../../../src/main/technicalServices/DataQ";
import Log from "../../../../../src/main/technicalServices/log/Logger";
import sinon from "sinon";
import {assert} from "chai";
import StorageEstimateContract from "../../../../../src/main/contract/staticContracts/StorageEstimateContract";
import StorageDirectoryContract from "../../../../../src/main/contract/staticContracts/StorageDirectoryContract";
import {DevDebugDataQ} from "../../../../../src/main/technicalServices/dev_collectors/DevDebugDataQ";

describe('StorageFeature', function () {
    // Test variables
    let sandbox;
    let dataQ;
    let devDebugDataQ;
    let logErrorStub;
    let logInfoStub;
    let logWarnStub;
    let storageFeature;
    let mockStorageManager;

    // Setup before each test
    beforeEach(function () {
        // Create sandbox for stubbing
        sandbox = sinon.createSandbox();
        
        // Create stubs for dependencies
        dataQ = sandbox.createStubInstance(DataQ);
        devDebugDataQ = sandbox.createStubInstance(DevDebugDataQ);
        logErrorStub = sandbox.stub(Log, 'error');
        logInfoStub = sandbox.stub(Log, 'info');
        logWarnStub = sandbox.stub(Log, 'warn');
        
        // Create mock storage manager
        mockStorageManager = {
            estimate: sandbox.stub().resolves({ quota: 1000000000, usage: 500000000 }),
            getDirectory: sandbox.stub().resolves({ name: "root" })
        };
        
        // Create feature instance
        storageFeature = new StorageFeature(dataQ, devDebugDataQ);
        
        // Stub the getStorageManager method to return our mock
        sandbox.stub(storageFeature, 'getStorageManager').returns(mockStorageManager);
    });

    // Cleanup after each test
    afterEach(function () {
        sandbox.restore();
    });

    describe('constructor', function() {
        it('should initialize with a DataQueue instance', function() {
            assert.instanceOf(storageFeature, StorageFeature);
            assert.property(storageFeature, '_dataQ');
            assert.strictEqual(storageFeature._dataQ, dataQ);
            assert.property(storageFeature, '_storageManager');
            assert.isNull(storageFeature._storageManager);
        });
    });

    describe('getDefaultSettings', function() {
        it('should return a copy of the feature settings', function() {
            const settings = StorageFeature.getDefaultSettings();
            
            // Verify properties
            assert.property(settings, 'configKey');
            assert.equal(settings.configKey, 'isStorageFeature');
            assert.property(settings, 'shouldRunPerSession');
            assert.isTrue(settings.shouldRunPerSession);
            assert.property(settings, 'runInSlave');
            assert.isTrue(settings.runInSlave);
            assert.property(settings, 'runInLean');
            assert.isTrue(settings.runInLean);
        });
    });

    describe('getStorageManager', function() {
        it('should return navigator.storage', function() {
            if( typeof navigator.storage === 'undefined' ) {
                return;
            }
            // Create a new instance without stubbing getStorageManager
            const feature = new StorageFeature(dataQ);
            const storageManager = feature.getStorageManager();
            assert.strictEqual(storageManager, navigator.storage);
        });
    });

    describe('_initializeStorageManager', function() {
        it('should initialize storage manager if not already initialized', function() {
            storageFeature._initializeStorageManager();
            assert.strictEqual(storageFeature._storageManager, mockStorageManager);
        });

        it('should not reinitialize storage manager if already initialized', function() {
            // Initialize first time
            storageFeature._initializeStorageManager();
            const firstManager = storageFeature._storageManager;
            
            // Create a new mock for the second call
            const secondMock = { different: 'mock' };
            storageFeature.getStorageManager.returns(secondMock);
            
            // Initialize second time
            storageFeature._initializeStorageManager();
            
            // Should still have the first manager
            assert.strictEqual(storageFeature._storageManager, firstManager);
            assert.notStrictEqual(storageFeature._storageManager, secondMock);
        });
    });

    describe('startFeature', function() {
        it('should initialize storage manager and call both collection methods', async function() {
            const initializeStub = sandbox.stub(storageFeature, '_initializeStorageManager');
            const collectStorageEstimateInfoStub = sandbox.stub(storageFeature, '_collectStorageEstimateInfo').resolves();
            const collectStorageDirectoryInfoStub = sandbox.stub(storageFeature, '_collectStorageDirectoryInfo').resolves();
            
            await storageFeature.startFeature();
            
            assert.isTrue(initializeStub.calledOnce);
            assert.isTrue(collectStorageEstimateInfoStub.calledOnce);
            assert.isTrue(collectStorageDirectoryInfoStub.calledOnce);
            assert.isTrue(logInfoStub.calledWith("Starting Storage Feature"));
        });

        it('should handle errors from collection methods', async function() {
            const error = new Error('Test error');
            sandbox.stub(storageFeature, '_collectStorageEstimateInfo').rejects(error);
            sandbox.stub(storageFeature, '_collectStorageDirectoryInfo').resolves();
            
            await storageFeature.startFeature();
            
            assert.isTrue(logErrorStub.calledWith(`Error in Storage Feature: ${error.message}`));
        });
    });

    describe('Storage Estimate functionality', function() {
        describe('_isValidStorageEstimate', function() {
            it('should return true for valid storage estimate data', function() {
                const validData = {
                    quota: 1000000000,
                    usage: 500000000
                };
                
                assert.isTrue(storageFeature._isValidStorageEstimate(validData));
            });
            
            it('should return false for null or undefined data', function() {
                assert.isFalse(!!storageFeature._isValidStorageEstimate(null));
                assert.isFalse(!!storageFeature._isValidStorageEstimate(undefined));
            });
            
            it('should return false for data with invalid types', function() {
                const invalidData = {
                    quota: '1000000000',
                    usage: 500000000
                };
                
                assert.isFalse(storageFeature._isValidStorageEstimate(invalidData));
            });
            
            it('should return false for data with negative values', function() {
                const invalidData = {
                    quota: -1000000000,
                    usage: 500000000
                };
                
                assert.isFalse(storageFeature._isValidStorageEstimate(invalidData));
            });
        });

        describe('_collectStorageEstimateInfo', function() {
            it('should log info when starting', async function () {
                const storageEstimateData = {
                    quota: 500000000,
                    usage: 250000000,
                };
                sandbox.stub(storageFeature, '_getStorageEstimateInfo').resolves(storageEstimateData);

                await storageFeature._collectStorageEstimateInfo();
                assert.isTrue(logInfoStub.calledWith("Collecting storage estimate properties"));
            });

            it('should add to data queue when valid data is received', async function () {
                const storageEstimateData = {
                    quota: 500000000,
                    usage: 250000000,
                };
                sandbox.stub(storageFeature, '_getStorageEstimateInfo').resolves(storageEstimateData);

                const contractData = "contractStorageEstimateData";
                sandbox.stub(StorageEstimateContract.prototype, 'buildQueueMessage').returns(contractData);

                await storageFeature._collectStorageEstimateInfo();

                assert.isTrue(dataQ.addToQueue.calledOnceWith('static_fields', contractData, false));
            });

            it('should log warning when invalid data is received', async function () {
                const invalidData = {
                    quota: 'invalid',
                    usage: 250000000,
                };
                sandbox.stub(storageFeature, '_getStorageEstimateInfo').resolves(invalidData);

                await storageFeature._collectStorageEstimateInfo();

                assert.isTrue(logWarnStub.calledWith('Invalid storage estimate data received'));
                assert.isFalse(dataQ.addToQueue.called);
            });

            it('should log error and rethrow when _getStorageEstimateInfo fails', async function () {
                const error = new Error('Storage estimation failed');
                sandbox.stub(storageFeature, '_getStorageEstimateInfo').rejects(error);

                try {
                    await storageFeature._collectStorageEstimateInfo();
                    assert.fail('Expected error to be thrown');
                } catch (e) {
                    assert.equal(e, error);
                    assert.isTrue(logErrorStub.calledWith(`Error collecting storage estimate information: ${error.message}`));
                }
            });
        });

        describe('_getStorageEstimateInfo', function() {
            it('should initialize storage manager before calling estimate', async function () {
                storageFeature._initializeStorageManager();
                
                await storageFeature._getStorageEstimateInfo();
                
                assert.isTrue(mockStorageManager.estimate.calledOnce);
            });
            
            it('should return quota and usage values with precision', async function () {
                storageFeature._initializeStorageManager();
                mockStorageManager.estimate.resolves({
                    quota: 1000000000.123,
                    usage: 500000000.456,
                });

                const result = await storageFeature._getStorageEstimateInfo();

                assert.equal(result.quota, 1000000000.123);
                assert.equal(result.usage, 500000000.456);
            });

            it('should log error and rethrow when estimate fails', async function () {
                storageFeature._initializeStorageManager();
                const error = new Error('Storage estimation failed');
                mockStorageManager.estimate.rejects(error);

                try {
                    await storageFeature._getStorageEstimateInfo();
                    assert.fail('Expected error to be thrown');
                } catch (e) {
                    assert.equal(e, error);
                    assert.isTrue(logErrorStub.calledWith(`Failed to get storage estimate: ${error.message}`));
                }
            });
        });
    });

    describe('Storage Directory functionality', function() {
        describe('_isValidDirectoryName', function() {
            it('should return true for valid directory name', function() {
                assert.isTrue(storageFeature._isValidDirectoryName('root'));
                assert.isTrue(storageFeature._isValidDirectoryName('my-directory'));
                assert.isTrue(storageFeature._isValidDirectoryName(''));
            });
            
            it('should return false for null or undefined', function() {
                assert.isFalse(!!storageFeature._isValidDirectoryName(null));
                assert.isFalse(!!storageFeature._isValidDirectoryName(undefined));
            });
            
            it('should return false for non-string values', function() {
                assert.isFalse(storageFeature._isValidDirectoryName(123));
                assert.isFalse(storageFeature._isValidDirectoryName({}));
                assert.isFalse(storageFeature._isValidDirectoryName([]));
            });
        });

        describe('_collectStorageDirectoryInfo', function() {
            it('should log info when starting', async function () {
                const storageDirectoryData = "root";
                sandbox.stub(storageFeature, '_getStorageDirectoryInfo').resolves(storageDirectoryData);

                await storageFeature._collectStorageDirectoryInfo();
                assert.isTrue(logInfoStub.calledWith("Collecting storage directory properties"));
            });

            it('should add to data queue when valid data is received', async function () {
                const storageDirectoryData = "root";
                sandbox.stub(storageFeature, '_getStorageDirectoryInfo').resolves(storageDirectoryData);

                const contractData = "contractStorageDirectoryData";
                sandbox.stub(StorageDirectoryContract.prototype, 'buildQueueMessage').returns(contractData);

                await storageFeature._collectStorageDirectoryInfo();

                assert.isTrue(devDebugDataQ.addToQueue.calledOnceWith('static_fields', contractData, false));
            });

            it('should log warning when invalid data is received', async function () {
                const invalidData = 123; // Not a string
                sandbox.stub(storageFeature, '_getStorageDirectoryInfo').resolves(invalidData);

                await storageFeature._collectStorageDirectoryInfo();

                assert.isTrue(logWarnStub.calledWith('Invalid storage directory data received'));
                assert.isFalse(devDebugDataQ.addToQueue.called);
            });

            it('should log error and rethrow when _getStorageDirectoryInfo fails', async function () {
                const error = new Error('Storage directory failed');
                sandbox.stub(storageFeature, '_getStorageDirectoryInfo').rejects(error);

                try {
                    await storageFeature._collectStorageDirectoryInfo();
                    assert.fail('Expected error to be thrown');
                } catch (e) {
                    assert.equal(e, error);
                    assert.isTrue(logErrorStub.calledWith(`Error collecting storage directory information: ${error.message}`));
                }
            });
        });

        describe('_getStorageDirectoryInfo', function() {
            it('should initialize storage manager before calling getDirectory', async function () {
                storageFeature._initializeStorageManager();
                
                await storageFeature._getStorageDirectoryInfo();
                
                assert.isTrue(mockStorageManager.getDirectory.calledOnce);
            });
            
            it('should return the directory name', async function () {
                storageFeature._initializeStorageManager();
                mockStorageManager.getDirectory.resolves({
                    name: "root",
                });

                const result = await storageFeature._getStorageDirectoryInfo();

                assert.equal(result, "root");
            });

            it('should log error and rethrow when getDirectory fails', async function () {
                storageFeature._initializeStorageManager();
                const error = new Error('Storage directory failed');
                mockStorageManager.getDirectory.rejects(error);

                try {
                    await storageFeature._getStorageDirectoryInfo();
                    assert.fail('Expected error to be thrown');
                } catch (e) {
                    assert.equal(e, error);
                    assert.isTrue(logErrorStub.calledWith(`Failed to get storage directory: ${error.message}`));
                }
            });
        });
    });
}); 