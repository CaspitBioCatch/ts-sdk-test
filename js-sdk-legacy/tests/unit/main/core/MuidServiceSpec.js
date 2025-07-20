import CDUtils from '../../../../src/main/technicalServices/CDUtils';
import MuidService from '../../../../src/main/core/MuidService';
import DataQ from '../../../../src/main/technicalServices/DataQ';
import StorageUtilsWrapper from "../../../../src/main/technicalServices/StorageUtilsWrapper";
import ConfigurationRepository from "../../../../src/main/core/configuration/ConfigurationRepository";
import sinon from "sinon";
import Log from "../../../../src/main/technicalServices/log/Logger";
import {TestUtils} from "../../../TestUtils";

describe('MuidService tests:', function () {
    const assert = chai.assert;
    let sandbox;
    let configurationRepository;

    describe('init muid tests:', function () {
        beforeEach(function () {
            sandbox = sinon.createSandbox();
            configurationRepository = sandbox.createStubInstance(ConfigurationRepository);
            this.dataQ = sandbox.createStubInstance(DataQ);
            this.storageUtilsWrapper = sandbox.createStubInstance(StorageUtilsWrapper);
            this.guid1 = CDUtils.generateUUID().toUpperCase();
            this.guid2 = CDUtils.generateUUID().toUpperCase();
        });

        afterEach(function () {
            sandbox.restore();
            if(this.storageUtilsWrapper.saveToLocalStorage?.restore){
                this.storageUtilsWrapper.saveToLocalStorage.restore();
                this.storageUtilsWrapper.getFromLocalStorage.restore();
                this.storageUtilsWrapper.setCookie.restore();
                this.storageUtilsWrapper.getCookie.restore();
            }
            configurationRepository = null;
        });

        it('muid should already exists', function () {
            const muidService = new MuidService(CDUtils, this.dataQ, this.storageUtilsWrapper, configurationRepository);
            this.storageUtilsWrapper.getCookie.returns(this.guid1);
            this.storageUtilsWrapper.getFromLocalStorage.returns(this.guid1);
            const dateNow = sinon.stub(CDUtils, 'dateNow');
            dateNow.returns(1500802087319);

            muidService.initMuid();

            assert.isTrue(this.dataQ.addToQueue.calledOnce, 'add to was not Called');
            assert.isTrue(this.dataQ.addToQueue.getCall(0).args[1][1].indexOf('1500802087319') === -1, 'muid contains time');
            assert.isTrue(this.storageUtilsWrapper.setCookie.calledOnce, 'setCookie was not called');
            assert.isTrue(this.storageUtilsWrapper.saveToLocalStorage.calledOnce, 'saveToLocalStorage was not called');

            assert.isTrue(this.storageUtilsWrapper.saveToLocalStorage.getCall(0).args[0] === 'bmuid', 'muid key to storage not as expected');
            assert.isTrue(this.storageUtilsWrapper.setCookie.getCall(0).args[0] === 'bmuid', 'muid key to cookie not as expected');
            assert.isTrue(this.storageUtilsWrapper.saveToLocalStorage.getCall(0).args[1] === this.guid1, 'muid data to storage not as expected');
            assert.isTrue(this.storageUtilsWrapper.setCookie.getCall(0).args[1] === this.guid1, 'muid data to cookie not as expected');
            assert.isTrue(this.storageUtilsWrapper.setCookie.getCall(0).args[2] === 31536000000, 'muid expiration to cookie not as expected');

            dateNow.restore();
        });

        it('muid only storage exists', function () {
            const muidService = new MuidService(CDUtils, this.dataQ, this.storageUtilsWrapper, configurationRepository);
            this.storageUtilsWrapper.getCookie.returns('');
            this.storageUtilsWrapper.getFromLocalStorage.returns(this.guid2);
            const dateNow = sinon.stub(CDUtils, 'dateNow');
            dateNow.returns(1500802087319);

            muidService.initMuid();

            assert.isTrue(this.dataQ.addToQueue.calledOnce, 'add to was not Called');
            assert.equal(this.dataQ.addToQueue.getCall(0).args[1][0], 'muid', 'addToQueue bad param');
            assert.isTrue(this.dataQ.addToQueue.getCall(0).args[1][1].indexOf('1500802087319') === -1, 'muid contains time');

            assert.isTrue(this.storageUtilsWrapper.saveToLocalStorage.calledOnce, 'setStorage was not called');
            assert.isTrue(this.storageUtilsWrapper.setCookie.calledOnce, 'setCookie was not called');

            assert.isTrue(this.storageUtilsWrapper.saveToLocalStorage.getCall(0).args[0] === 'bmuid', 'muid key to storage not as expected');
            assert.isTrue(this.storageUtilsWrapper.setCookie.getCall(0).args[0] === 'bmuid', 'muid key to cookie not as expected');
            assert.isTrue(this.storageUtilsWrapper.saveToLocalStorage.getCall(0).args[1] === this.guid2, 'muid data to storage not as expected');
            assert.isTrue(this.storageUtilsWrapper.setCookie.getCall(0).args[1] === this.guid2, 'muid data to cookie not as expected');
            assert.isTrue(this.storageUtilsWrapper.setCookie.getCall(0).args[2] === 31536000000, 'muid expiration to cookie not as expected');

            dateNow.restore();
        });

        it('muid should be new', function () {
            const muidService = new MuidService(CDUtils, this.dataQ, this.storageUtilsWrapper, configurationRepository);
            this.storageUtilsWrapper.getCookie.returns('');
            this.storageUtilsWrapper.getFromLocalStorage.returns('');

            const dateNow = sinon.stub(CDUtils, 'dateNow');
            dateNow.returns(1500802087319);

            muidService.initMuid();

            assert.isTrue(this.dataQ.addToQueue.calledOnce, 'add to was not Called');
            assert.equal(this.dataQ.addToQueue.getCall(0).args[1][0], 'muid', 'addToQueue bad param');
            assert.isTrue(this.dataQ.addToQueue.getCall(0).args[1][1].indexOf('1500802087319') > -1, 'dateNow bad param');

            assert.isTrue(this.storageUtilsWrapper.saveToLocalStorage.calledOnce, 'setStorage was not called');
            assert.isTrue(this.storageUtilsWrapper.setCookie.calledOnce, 'setCookie was not called');

            assert.isTrue(this.storageUtilsWrapper.saveToLocalStorage.getCall(0).args[0] === 'bmuid', 'muid data to storage not as expected');
            assert.isTrue(this.storageUtilsWrapper.setCookie.getCall(0).args[0] === 'bmuid', 'muid data to cookie not as expected');
            assert.isFalse(this.storageUtilsWrapper.saveToLocalStorage.getCall(0).args[1] === this.guid1, 'muid data to storage not as expected');
            assert.isFalse(this.storageUtilsWrapper.setCookie.getCall(0).args[1] === this.guid1, 'muid data to cookie not as expected');
            assert.isTrue(this.storageUtilsWrapper.setCookie.getCall(0).args[2] === 31536000000, 'muid expiration to cookie not as expected');

            dateNow.restore();
        });
    });

    describe("updateMuid", function () {

        beforeEach(function () {
            this.dataQ = sinon.createStubInstance(DataQ);
            this.storageUtilsWrapper = sinon.createStubInstance(StorageUtilsWrapper);
            this.guid1 = CDUtils.generateUUID().toUpperCase();
            this.guid2 = CDUtils.generateUUID().toUpperCase();
        });

        afterEach(function () {
            this.storageUtilsWrapper.saveToLocalStorage.restore();
            this.storageUtilsWrapper.getFromLocalStorage.restore();
            this.storageUtilsWrapper.setCookie.restore();
            this.storageUtilsWrapper.getCookie.restore();
        });

        it('should update existing muid with the one restored from the server when muid with a valid format', async function () {
            const logSpy = sinon.spy(Log, 'info');
            const muidService = new MuidService(CDUtils, this.dataQ, this.storageUtilsWrapper, configurationRepository);
            muidService.initMuid();
            const getCookieArgs1 = muidService._storageUtilsWrapper.setCookie.getCall(0).args[1];

            // restored muid returns from server
            const restoredMuid = muidService._utils.dateNow() + '-' + muidService._utils.generateUUID().toUpperCase();

            //update muid
            muidService.updateMuid(restoredMuid);
            const getCookieArgs2 = muidService._storageUtilsWrapper.setCookie.getCall(1).args[1];
            logSpy.restore();
            //get DataQ calls
            const dataQArgs0 = muidService._dataQ.addToQueue.getCall(0).args;
            const dataQArgs = muidService._dataQ.addToQueue.getCall(1).args;

            //get localSorage calls
            const localArgs1 = muidService._storageUtilsWrapper.saveToLocalStorage.getCall(0).args[1];
            const localArgs2 = muidService._storageUtilsWrapper.saveToLocalStorage.getCall(1).args[1];
            const cookie1 = muidService._storageUtilsWrapper.setCookie.getCall(0).args[1];
            const cookie2 = muidService._storageUtilsWrapper.setCookie.getCall(1).args[1];
            const logArgs = logSpy.getCall(2).args;

            assert.deepEqual(logArgs[0], `Restored MUID is: ${cookie2}`);
            assert.equal(muidService.muid, restoredMuid, `expected muid value to be ${restoredMuid}`);
            assert.notEqual(getCookieArgs2, getCookieArgs1, "expected restored muid to be different than the original one");
            assert.equal(dataQArgs[0], 'static_fields', 'expected to static_fields');
            assert.equal(dataQArgs[1][0], 'muid', 'expected muid');
            assert.equal(dataQArgs[2], false, 'expected false');
            assert.notEqual(localArgs1, localArgs2, "expected localStorage muid keys to be different");
            assert.equal(getCookieArgs2, localArgs2, 'expected both values to be equaled');
            assert.notEqual(cookie1, cookie2, 'cookies are equal');
            assert.equal(cookie1, dataQArgs0[1][1], 'session cookie and data queue cookie not equal');
            assert.equal(cookie2, dataQArgs[1][1], 'session cookie and data queue cookie not equal');
            assert.equal(localArgs1, cookie1, 'localStorage and cookie bmuid value is different');
            assert.equal(localArgs2, cookie2, 'localStorage and cookie bmuid value is different');


        });

        it("should fire a warning log when MUID is not in a valid format", function () {
            const logSpy = sinon.spy(Log, 'warn');
            const muidService = new MuidService(CDUtils, this.dataQ, this.storageUtilsWrapper, configurationRepository);
            muidService.initMuid();

            muidService.updateMuid('sfsdfs');
            logSpy.restore();

            const logArgs = logSpy.getCall(0).args[0];

            assert.isTrue(logSpy.calledOnce, 'expected to be called once');
            assert.equal(logArgs, 'Invalid format of restored MUID', 'expected messages to be equal');

        });

        describe("addMuidToQueue", function () {
            let muidService = null;
            const sandbox = sinon.createSandbox();

            beforeEach(function(){
                muidService = new MuidService(CDUtils, this.dataQ, this.storageUtilsWrapper, configurationRepository);
            });


            it('should add muid to queue when muid gets updated', function () {
                muidService._dataQ.addToQueue = sandbox.spy();

                const restoredMuid = muidService._utils.dateNow() + '-' + muidService._utils.generateUUID().toUpperCase();
                muidService.muid = restoredMuid;

                muidService._addMuidToQueue();

                const getArgs = muidService._dataQ.addToQueue.getCall(0).args;
                sandbox.restore();
                assert.equal(getArgs[0], 'static_fields', 'expected for static_fields');
                assert.equal(getArgs[1][1], restoredMuid, 'expected the restored muid to be added to the queue');

            });

            it('should set cookie and storage key in the browser when calling setStorageAndCookieKey', function () {
                const restoredMuid = muidService._utils.dateNow() + '-' + muidService._utils.generateUUID().toUpperCase();
                muidService.muid = restoredMuid;

                muidService._setStorageAndCookieKey()

                const setCookieArgs = muidService._storageUtilsWrapper.setCookie.getCall(0).args;
                const saveToStorageArgs = muidService._storageUtilsWrapper.saveToLocalStorage.getCall(0).args;

                assert.equal(setCookieArgs[1], saveToStorageArgs[1], 'expected the same muid value');
                assert.equal(setCookieArgs[0], saveToStorageArgs[0], 'expected key to be bmuid');
            });

            it('should send a warning log when restored muid is undefined', function () {
                const logSpy = sandbox.spy(Log, 'warn');

                muidService.updateMuid('');
                sandbox.restore();

                const logArgs = logSpy.getCall(0).args;

                assert.equal(logArgs[0], 'MUID is not defined', 'expected for MUID is not defined message to be fired');

            });

            it("should call sendAndSaveMuid function with the restored muid", async function(){
                const restoredMuid = muidService._utils.dateNow() + '-' + muidService._utils.generateUUID().toUpperCase();
                const sendAndSaveSpy = sandbox.spy(muidService, '_saveAndSendMuid');
                const setStorageAndCookieKeySpy = sandbox.spy(muidService, '_setStorageAndCookieKey');
                const addMuidToQueueSpy = sandbox.spy(muidService, '_addMuidToQueue');
                muidService.updateMuid(restoredMuid);

                await TestUtils.waitForNoAssertion(()=>{
                    assert.isTrue(setStorageAndCookieKeySpy.calledOnce,'called more than once');
                    assert.isTrue(addMuidToQueueSpy.calledOnce,'called more than once');
                    assert.isTrue(sendAndSaveSpy.calledOnce,'called more than once');

                });
                sandbox.restore();
            });

        });
    });
});
