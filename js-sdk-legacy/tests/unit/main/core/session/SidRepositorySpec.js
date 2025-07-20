import SidRepository from '../../../../../src/main/core/session/SidRepository';
import CDUtils from '../../../../../src/main/technicalServices/CDUtils';
import StorageUtilsWrapper from "../../../../../src/main/technicalServices/StorageUtilsWrapper";
import {ConfigurationFields} from "../../../../../src/main/core/configuration/ConfigurationFields";
import ConfigurationRepository from "../../../../../src/main/core/configuration/ConfigurationRepository";

describe('SidRepository tests:', function () {
    const assert = chai.assert;
    const sidKey = 'cdSNum';
    const defaultCSIDNum = CDUtils.minutesToMilliseconds(60);
    it('on config update, cookie and local updated successfully', function () {
        this.sandbox = sinon.createSandbox();
        this.storageUtilsWrapper = sinon.createStubInstance(StorageUtilsWrapper);
        this.guid1 = CDUtils.generateUUID();
        this.configurationRepository = sinon.stub(new ConfigurationRepository());

        const expectedExpirationTime = 20;
        this.configurationRepository.get.withArgs(ConfigurationFields.cdsNumExpirationTime).returns(expectedExpirationTime);
        const sidRepository = new SidRepository(CDUtils, this.storageUtilsWrapper,this.configurationRepository);
        let expectedExpirationInMilliseconds = CDUtils.minutesToMilliseconds(expectedExpirationTime);
        this.storageUtilsWrapper.setExpirationInCookie.withArgs(sidKey, expectedExpirationInMilliseconds).returns(1);
        this.storageUtilsWrapper.setExpirationInLocalStorage.withArgs(sidKey, expectedExpirationInMilliseconds).returns(1);



        let expectedSid = Date.now() + '-' + this.guid1;

        sidRepository.set(expectedSid);
        //check initial values
        assert.isTrue(this.storageUtilsWrapper.saveToLocalStorage.calledOnce, 'sessionId was not set once to local storage');
        assert.equal(this.storageUtilsWrapper.saveToLocalStorage.firstCall.args[0], sidKey, 'local storage sid key was not as expected');
        assert.equal(this.storageUtilsWrapper.saveToLocalStorage.firstCall.args[1], expectedSid, 'sessionId is not equal to expected value');
        assert.equal(this.storageUtilsWrapper.saveToLocalStorage.firstCall.args[2], expectedExpirationInMilliseconds, 'expiration should be 20 min');
        assert.isTrue(this.storageUtilsWrapper.setCookie.calledOnce, 'sessionId was not set once to cookie');
        assert.equal(this.storageUtilsWrapper.setCookie.firstCall.args[0], sidKey, 'cookie sid key was not as expected');
        assert.equal(this.storageUtilsWrapper.setCookie.firstCall.args[1], expectedSid, 'sessionId is not equal to expected value');
        assert.equal(this.storageUtilsWrapper.setCookie.firstCall.args[2], expectedExpirationInMilliseconds, 'expiration is not equal to expected value');

        //check values after repository update
        const newExpirationTime = 10
        const newExpectedExpirationInMilliseconds = CDUtils.minutesToMilliseconds(newExpirationTime);
        this.configurationRepository.get.withArgs(ConfigurationFields.cdsNumExpirationTime).returns(newExpirationTime);
        this.storageUtilsWrapper.setExpirationInCookie.withArgs(sidKey, newExpectedExpirationInMilliseconds).returns(0);
        this.storageUtilsWrapper.setExpirationInLocalStorage.withArgs(sidKey, newExpectedExpirationInMilliseconds).returns(0);
        sidRepository.onConfigUpdate(this.configurationRepository)

        sidRepository.set(expectedSid);
        assert.isTrue(this.storageUtilsWrapper.saveToLocalStorage.calledTwice, 'sessionId was not set once to local storage');
        assert.equal(this.storageUtilsWrapper.saveToLocalStorage.secondCall.args[0], sidKey, 'local storage sid key was not as expected');
        assert.equal(this.storageUtilsWrapper.saveToLocalStorage.secondCall.args[1], expectedSid, 'sessionId is not equal to expected value');
        assert.equal(this.storageUtilsWrapper.saveToLocalStorage.secondCall.args[2], newExpectedExpirationInMilliseconds, 'expiration should be 10 min hour');
        assert.isTrue(this.storageUtilsWrapper.setCookie.calledTwice, 'sessionId was not set once to cookie');
        assert.equal(this.storageUtilsWrapper.setCookie.secondCall.args[0], sidKey, 'cookie sid key was not as expected');
        assert.equal(this.storageUtilsWrapper.setCookie.secondCall.args[1], expectedSid, 'sessionId is not equal to expected value');
        assert.equal(this.storageUtilsWrapper.setCookie.secondCall.args[2], newExpectedExpirationInMilliseconds, 'expiration is not equal to expected value');
        this.sandbox.restore();

    });
    it('on config update, local storage didnt updated successfully', function () {
        this.sandbox = sinon.createSandbox();
        this.storageUtilsWrapper = sinon.createStubInstance(StorageUtilsWrapper);
        this.guid1 = CDUtils.generateUUID();
        this.configurationRepository = sinon.stub(new ConfigurationRepository());

        const expectedExpirationTime = 20;
        this.configurationRepository.get.withArgs(ConfigurationFields.cdsNumExpirationTime).returns(expectedExpirationTime);
        const sidRepository = new SidRepository(CDUtils, this.storageUtilsWrapper,this.configurationRepository);
        let expectedExpirationInMilliseconds = CDUtils.minutesToMilliseconds(expectedExpirationTime);
        this.storageUtilsWrapper.setExpirationInCookie.withArgs(sidKey, expectedExpirationInMilliseconds).returns(1);
        this.storageUtilsWrapper.setExpirationInLocalStorage.withArgs(sidKey, expectedExpirationInMilliseconds).returns(1);

        let expectedSid = Date.now() + '-' + this.guid1;

        sidRepository.set(expectedSid);
        //check initial values
        assert.isTrue(this.storageUtilsWrapper.saveToLocalStorage.calledOnce, 'sessionId was not set once to local storage');
        assert.equal(this.storageUtilsWrapper.saveToLocalStorage.firstCall.args[0], sidKey, 'local storage sid key was not as expected');
        assert.equal(this.storageUtilsWrapper.saveToLocalStorage.firstCall.args[1], expectedSid, 'sessionId is not equal to expected value');
        assert.equal(this.storageUtilsWrapper.saveToLocalStorage.firstCall.args[2], expectedExpirationInMilliseconds, 'expiration should be 20 min');
        assert.isTrue(this.storageUtilsWrapper.setCookie.calledOnce, 'sessionId was not set once to cookie');
        assert.equal(this.storageUtilsWrapper.setCookie.firstCall.args[0], sidKey, 'cookie sid key was not as expected');
        assert.equal(this.storageUtilsWrapper.setCookie.firstCall.args[1], expectedSid, 'sessionId is not equal to expected value');
        assert.equal(this.storageUtilsWrapper.setCookie.firstCall.args[2], expectedExpirationInMilliseconds, 'expiration is not equal to expected value');

        //check values after repository update, and ShouldUpdateExpirationBeforeGettingCDSNum flag is on
        const newExpirationTime = 10
        const newExpectedExpirationInMilliseconds = CDUtils.minutesToMilliseconds(newExpirationTime);
        this.configurationRepository.get.withArgs(ConfigurationFields.cdsNumExpirationTime).returns(newExpirationTime);
        this.storageUtilsWrapper.setExpirationInCookie.withArgs(sidKey, newExpectedExpirationInMilliseconds).returns(0);
        this.storageUtilsWrapper.setExpirationInLocalStorage.withArgs(sidKey, newExpectedExpirationInMilliseconds).returns(0);

        sidRepository.onConfigUpdate(this.configurationRepository)

        sidRepository.set(expectedSid);
        assert.isTrue(this.storageUtilsWrapper.saveToLocalStorage.calledTwice, 'sessionId was not set once to local storage');
        assert.equal(this.storageUtilsWrapper.saveToLocalStorage.secondCall.args[0], sidKey, 'local storage sid key was not as expected');
        assert.equal(this.storageUtilsWrapper.saveToLocalStorage.secondCall.args[1], expectedSid, 'sessionId is not equal to expected value');
        assert.equal(this.storageUtilsWrapper.saveToLocalStorage.secondCall.args[2], newExpectedExpirationInMilliseconds, 'expiration should be 10 min');
        assert.isTrue(this.storageUtilsWrapper.setCookie.calledTwice, 'sessionId was not set once to cookie');
        assert.equal(this.storageUtilsWrapper.setCookie.secondCall.args[0], sidKey, 'cookie sid key was not as expected');
        assert.equal(this.storageUtilsWrapper.setCookie.secondCall.args[1], expectedSid, 'sessionId is not equal to expected value');
        assert.equal(this.storageUtilsWrapper.setCookie.secondCall.args[2], newExpectedExpirationInMilliseconds, 'expiration is not equal to expected value');

        //check values after repository update, and ShouldUpdateExpirationBeforeGettingCDSNum flag is off
        const newerExpirationTime = 30
        const newerExpectedExpirationInMilliseconds = CDUtils.minutesToMilliseconds(newerExpirationTime);
        this.configurationRepository.get.withArgs(ConfigurationFields.cdsNumExpirationTime).returns(newerExpirationTime);
        this.storageUtilsWrapper.setExpirationInCookie.withArgs(sidKey, newerExpectedExpirationInMilliseconds).returns(0);
        this.storageUtilsWrapper.setExpirationInLocalStorage.withArgs(sidKey, newerExpectedExpirationInMilliseconds).returns(-1);
        sidRepository.onConfigUpdate(this.configurationRepository)

        sidRepository.set(expectedSid);
        //now expiration time shouldn't change
        assert.isTrue(this.storageUtilsWrapper.saveToLocalStorage.calledThrice, 'sessionId was not set once to local storage');
        assert.equal(this.storageUtilsWrapper.saveToLocalStorage.thirdCall.args[0], sidKey, 'local storage sid key was not as expected');
        assert.equal(this.storageUtilsWrapper.saveToLocalStorage.thirdCall.args[1], expectedSid, 'sessionId is not equal to expected value');
        assert.equal(this.storageUtilsWrapper.saveToLocalStorage.thirdCall.args[2], newExpectedExpirationInMilliseconds, 'expiration should be 20 min');
        assert.isTrue(this.storageUtilsWrapper.setCookie.calledThrice, 'sessionId was not set once to cookie');
        assert.equal(this.storageUtilsWrapper.setCookie.thirdCall.args[0], sidKey, 'cookie sid key was not as expected');
        assert.equal(this.storageUtilsWrapper.setCookie.thirdCall.args[1], expectedSid, 'sessionId is not equal to expected value');
        assert.equal(this.storageUtilsWrapper.setCookie.thirdCall.args[2], newExpectedExpirationInMilliseconds, 'expiration is not equal to expected value');
        //make sure that ShouldUpdateExpirationBeforeGettingCDSNum flag is off

        this.sandbox.restore();

    });
    it('on config update,cookie didnt updated successfully', function () {
        this.sandbox = sinon.createSandbox();
        this.storageUtilsWrapper = sinon.createStubInstance(StorageUtilsWrapper);
        this.guid1 = CDUtils.generateUUID();
        this.configurationRepository = sinon.stub(new ConfigurationRepository());

        const expectedExpirationTime = 20;
        this.configurationRepository.get.withArgs(ConfigurationFields.cdsNumExpirationTime).returns(expectedExpirationTime);
        const sidRepository = new SidRepository(CDUtils, this.storageUtilsWrapper,this.configurationRepository);
        let expectedExpirationInMilliseconds = CDUtils.minutesToMilliseconds(expectedExpirationTime);
        this.storageUtilsWrapper.setExpirationInCookie.withArgs(sidKey, expectedExpirationInMilliseconds).returns(1);
        this.storageUtilsWrapper.setExpirationInLocalStorage.withArgs(sidKey, expectedExpirationInMilliseconds).returns(1);

        let expectedSid = Date.now() + '-' + this.guid1;

        sidRepository.set(expectedSid);
        //check initial values
        assert.isTrue(this.storageUtilsWrapper.saveToLocalStorage.calledOnce, 'sessionId was not set once to local storage');
        assert.equal(this.storageUtilsWrapper.saveToLocalStorage.firstCall.args[0], sidKey, 'local storage sid key was not as expected');
        assert.equal(this.storageUtilsWrapper.saveToLocalStorage.firstCall.args[1], expectedSid, 'sessionId is not equal to expected value');
        assert.equal(this.storageUtilsWrapper.saveToLocalStorage.firstCall.args[2], expectedExpirationInMilliseconds, 'expiration should be 20 min');
        assert.isTrue(this.storageUtilsWrapper.setCookie.calledOnce, 'sessionId was not set once to cookie');
        assert.equal(this.storageUtilsWrapper.setCookie.firstCall.args[0], sidKey, 'cookie sid key was not as expected');
        assert.equal(this.storageUtilsWrapper.setCookie.firstCall.args[1], expectedSid, 'sessionId is not equal to expected value');
        assert.equal(this.storageUtilsWrapper.setCookie.firstCall.args[2], expectedExpirationInMilliseconds, 'expiration is not equal to expected value');

        //check values after repository update
        const newExpirationTime = 10
        const newExpectedExpirationInMilliseconds = CDUtils.minutesToMilliseconds(newExpirationTime);
        this.configurationRepository.get.withArgs(ConfigurationFields.cdsNumExpirationTime).returns(newExpirationTime);
        this.storageUtilsWrapper.setExpirationInCookie.withArgs(sidKey, newExpectedExpirationInMilliseconds).returns(0);
        this.storageUtilsWrapper.setExpirationInLocalStorage.withArgs(sidKey, newExpectedExpirationInMilliseconds).returns(0);

        sidRepository.onConfigUpdate(this.configurationRepository)

        sidRepository.set(expectedSid);
        assert.isTrue(this.storageUtilsWrapper.saveToLocalStorage.calledTwice, 'sessionId was not set once to local storage');
        assert.equal(this.storageUtilsWrapper.saveToLocalStorage.secondCall.args[0], sidKey, 'local storage sid key was not as expected');
        assert.equal(this.storageUtilsWrapper.saveToLocalStorage.secondCall.args[1], expectedSid, 'sessionId is not equal to expected value');
        assert.equal(this.storageUtilsWrapper.saveToLocalStorage.secondCall.args[2], newExpectedExpirationInMilliseconds, 'expiration should be 10 min');
        assert.isTrue(this.storageUtilsWrapper.setCookie.calledTwice, 'sessionId was not set once to cookie');
        assert.equal(this.storageUtilsWrapper.setCookie.secondCall.args[0], sidKey, 'cookie sid key was not as expected');
        assert.equal(this.storageUtilsWrapper.setCookie.secondCall.args[1], expectedSid, 'sessionId is not equal to expected value');
        assert.equal(this.storageUtilsWrapper.setCookie.secondCall.args[2], newExpectedExpirationInMilliseconds, 'expiration is not equal to expected value');

        //check values after repository update, and ShouldUpdateExpirationBeforeGettingCDSNum flag is off
        const newerExpirationTime = 30
        const newerExpectedExpirationInMilliseconds = CDUtils.minutesToMilliseconds(newerExpirationTime);
        this.configurationRepository.get.withArgs(ConfigurationFields.cdsNumExpirationTime).returns(newerExpirationTime);
        this.storageUtilsWrapper.setExpirationInCookie.withArgs(sidKey, newerExpectedExpirationInMilliseconds).returns(-1);
        this.storageUtilsWrapper.setExpirationInLocalStorage.withArgs(sidKey, newerExpectedExpirationInMilliseconds).returns(0);
        sidRepository.onConfigUpdate(this.configurationRepository)

        sidRepository.set(expectedSid);
        //now expiration time shouldn't change
        assert.isTrue(this.storageUtilsWrapper.saveToLocalStorage.calledThrice, 'sessionId was not set once to local storage');
        assert.equal(this.storageUtilsWrapper.saveToLocalStorage.thirdCall.args[0], sidKey, 'local storage sid key was not as expected');
        assert.equal(this.storageUtilsWrapper.saveToLocalStorage.thirdCall.args[1], expectedSid, 'sessionId is not equal to expected value');
        assert.equal(this.storageUtilsWrapper.saveToLocalStorage.thirdCall.args[2], newExpectedExpirationInMilliseconds, 'expiration should be 20 min');
        assert.isTrue(this.storageUtilsWrapper.setCookie.calledThrice, 'sessionId was not set once to cookie');
        assert.equal(this.storageUtilsWrapper.setCookie.thirdCall.args[0], sidKey, 'cookie sid key was not as expected');
        assert.equal(this.storageUtilsWrapper.setCookie.thirdCall.args[1], expectedSid, 'sessionId is not equal to expected value');
        assert.equal(this.storageUtilsWrapper.setCookie.thirdCall.args[2], newExpectedExpirationInMilliseconds, 'expiration is not equal to expected value');

        this.sandbox.restore();

    });


    describe('get sid', function () {
        beforeEach(function () {
            this.sandbox = sinon.createSandbox();
            this.storageUtilsWrapper = sinon.createStubInstance(StorageUtilsWrapper);
            this.guid1 = CDUtils.generateUUID();
            this.configurationRepository = sinon.stub(new ConfigurationRepository());

        });

        afterEach(function () {
            this.sandbox.restore();
        });
        it('should sed csid to default if less then min', function () {
            const expectedExpirationTime = 0;
            this.configurationRepository.get.withArgs(ConfigurationFields.cdsNumExpirationTime).returns(expectedExpirationTime);
            const sidRepository = new SidRepository(CDUtils, this.storageUtilsWrapper,this.configurationRepository);

            assert.equal(sidRepository.COOKIE_EXPIRATION_IN_MILLISECONDS, defaultCSIDNum, 'csid num was not set to default');
        });
        it('should sed csid to default if grater then max', function () {
            const expectedExpirationTime = 1000000;
            this.configurationRepository.get.withArgs(ConfigurationFields.cdsNumExpirationTime).returns(expectedExpirationTime);
            const sidRepository = new SidRepository(CDUtils, this.storageUtilsWrapper,this.configurationRepository);

            assert.equal(sidRepository.COOKIE_EXPIRATION_IN_MILLISECONDS, defaultCSIDNum, 'csid num was not set to default');
        });
        it('should return current sid when data exists in both local storage and cookie', function () {
            const expectedSid = Date.now() + '-' + this.guid1;
            const expectedExpirationTime = 20;
            this.configurationRepository.get.withArgs(ConfigurationFields.cdsNumExpirationTime).returns(expectedExpirationTime);
            const sidRepository = new SidRepository(CDUtils, this.storageUtilsWrapper,this.configurationRepository);


            this.storageUtilsWrapper.getFromLocalStorage.withArgs(sidKey).returns(expectedSid);
            this.storageUtilsWrapper.getCookie.withArgs(sidKey).returns(expectedSid);

            const sessionId = sidRepository.get();
            assert.equal(sessionId, expectedSid, 'sessionId is not equal to expected value');
        });

        it('should return current sid when data exists only in local storage', function () {
            const expectedSid = Date.now() + '-' + this.guid1;
            const expectedExpirationTime = 20;
            this.configurationRepository.get.withArgs(ConfigurationFields.cdsNumExpirationTime).returns(expectedExpirationTime);
            const sidRepository = new SidRepository(CDUtils, this.storageUtilsWrapper,this.configurationRepository);
            this.storageUtilsWrapper.getFromLocalStorage.withArgs(sidKey).returns(expectedSid);
            this.storageUtilsWrapper.getCookie.withArgs(sidKey).returns(null);

            const sessionId = sidRepository.get();
            assert.equal(sessionId, expectedSid, 'sessionId is not equal to expected value');
        });

        it('should return current sid when data exists only in cookie', function () {
            const expectedSid = Date.now() + '-' + this.guid1;
            const expectedExpirationTime = 20;
            this.configurationRepository.get.withArgs(ConfigurationFields.cdsNumExpirationTime).returns(expectedExpirationTime);
            const sidRepository = new SidRepository(CDUtils, this.storageUtilsWrapper,this.configurationRepository);
            this.storageUtilsWrapper.getFromLocalStorage.withArgs(sidKey).returns(null);
            this.storageUtilsWrapper.getCookie.withArgs(sidKey).returns(expectedSid);

            const sessionId = sidRepository.get();
            assert.equal(sessionId, expectedSid, 'sessionId is not equal to expected value');
        });

        it('should return current sid when sid is valid only in local storage', function () {
            const expectedSid = Date.now() + '-' + this.guid1;
            const expectedExpirationTime = 20;
            this.configurationRepository.get.withArgs(ConfigurationFields.cdsNumExpirationTime).returns(expectedExpirationTime);
            const sidRepository = new SidRepository(CDUtils, this.storageUtilsWrapper,this.configurationRepository);

            // Create an sid without the timestamp
            this.storageUtilsWrapper.getFromLocalStorage.withArgs(sidKey).returns(expectedSid);
            // Cookie will return an invalid sid
            this.storageUtilsWrapper.getCookie.withArgs(sidKey).returns(undefined);

            const sessionId = sidRepository.get();
            assert.equal(sessionId, expectedSid, 'sessionId is not equal to expected value');
        });

        it('should return current sid when sid is valid only in cookie', function () {
            // Create an sid without the timestamp
            const expectedSid = Date.now() + '-' + this.guid1;
            const expectedExpirationTime = 20;
            this.configurationRepository.get.withArgs(ConfigurationFields.cdsNumExpirationTime).returns(expectedExpirationTime);
            const sidRepository = new SidRepository(CDUtils, this.storageUtilsWrapper,this.configurationRepository);

            // Local Storage will return an invalid sid
            this.storageUtilsWrapper.getFromLocalStorage.withArgs(sidKey).returns(null);
            this.storageUtilsWrapper.getCookie.withArgs(sidKey).returns(expectedSid);

            const sessionId = sidRepository.get();
            assert.equal(sessionId, expectedSid, 'sessionId is not equal to expected value');
        });

        it('should return null when sid is null in both local storage and cookie', function () {
            const expectedSid = null;
            const expectedExpirationTime = 20;
            this.configurationRepository.get.withArgs(ConfigurationFields.cdsNumExpirationTime).returns(expectedExpirationTime);
            const sidRepository = new SidRepository(CDUtils, this.storageUtilsWrapper,this.configurationRepository);

            this.storageUtilsWrapper.saveToLocalStorage.withArgs(sidKey).returns(null);
            this.storageUtilsWrapper.getCookie.withArgs(sidKey).returns(null);

            const sessionId = sidRepository.get();
            assert.equal(sessionId, expectedSid, 'sessionId is not equal to expected value');
        });

        it('should return null when sid is undefined in both local storage and cookie', function () {
            const expectedExpirationTime = 20;
            this.configurationRepository.get.withArgs(ConfigurationFields.cdsNumExpirationTime).returns(expectedExpirationTime);
            const sidRepository = new SidRepository(CDUtils, this.storageUtilsWrapper,this.configurationRepository);
            const expectedSid = null;
            this.storageUtilsWrapper.saveToLocalStorage.withArgs(sidKey).returns(undefined);
            this.storageUtilsWrapper.getCookie.withArgs(sidKey).returns(undefined);

            const sessionId = sidRepository.get();
            assert.equal(sessionId, expectedSid, 'sessionId is not equal to expected value');
        });

        it('should return null when sid is invalid in both cookie and local storage', function () {
            const expectedExpirationTime = 20;
            this.configurationRepository.get.withArgs(ConfigurationFields.cdsNumExpirationTime).returns(expectedExpirationTime);
            const sidRepository = new SidRepository(CDUtils, this.storageUtilsWrapper,this.configurationRepository);
            // Create an sid without the timestamp
            const expectedSid = undefined;
            this.storageUtilsWrapper.getFromLocalStorage.withArgs(sidKey).returns(expectedSid);
            this.storageUtilsWrapper.getCookie.withArgs(sidKey).returns(expectedSid);

            const sessionId = sidRepository.get();
            assert.equal(sessionId, null, 'sessionId is not equal to expected value');
        });
    });

    describe('set sid:', function () {
        beforeEach(function () {
            this.sandbox = sinon.createSandbox();

            this.storageUtilsWrapper = sinon.createStubInstance(StorageUtilsWrapper);
            this.guid1 = CDUtils.generateUUID();
            this.guid2 = CDUtils.generateUUID();
            this.configurationRepository = sinon.stub(new ConfigurationRepository());

        });

        afterEach(function () {
            this.sandbox.restore();
        });

        it('should set sid in local storage and cookie', function () {
            const expectedExpirationTime = 20;
            this.configurationRepository.get.withArgs(ConfigurationFields.cdsNumExpirationTime).returns(expectedExpirationTime);
            const sidRepository = new SidRepository(CDUtils, this.storageUtilsWrapper,this.configurationRepository);
            const expectedSid = Date.now() + '-' + this.guid1;

            sidRepository.set(expectedSid);

            assert.isTrue(this.storageUtilsWrapper.saveToLocalStorage.calledOnce, 'sessionId was not set once to local storage');
            assert.equal(this.storageUtilsWrapper.saveToLocalStorage.firstCall.args[0], sidKey, 'local storage sid key was not as expected');
            assert.equal(this.storageUtilsWrapper.saveToLocalStorage.firstCall.args[1], expectedSid, 'sessionId is not equal to expected value');
            assert.isTrue(this.storageUtilsWrapper.setCookie.calledOnce, 'sessionId was not set once to cookie');
            assert.equal(this.storageUtilsWrapper.setCookie.firstCall.args[0], sidKey, 'cookie sid key was not as expected');
            assert.equal(this.storageUtilsWrapper.setCookie.firstCall.args[1], expectedSid, 'sessionId is not equal to expected value');
        });

        it('should not set sid if it is invalid', function () {
            const expectedExpirationTime = 20;
            this.configurationRepository.get.withArgs(ConfigurationFields.cdsNumExpirationTime).returns(expectedExpirationTime);
            const sidRepository = new SidRepository(CDUtils, this.storageUtilsWrapper,this.configurationRepository);

            sidRepository.set(0);

            assert.isTrue(this.storageUtilsWrapper.saveToLocalStorage.notCalled, 'local storage set data was called at least once');
            assert.isTrue(this.storageUtilsWrapper.setCookie.notCalled, 'cookie set data was called at least once');
            assert.isTrue(this.storageUtilsWrapper.saveToLocalStorage.notCalled, 'session storage set data was called at least once');
            assert.isTrue(this.storageUtilsWrapper.setCookie.notCalled, 'cookie set data was called at least once');
        });

        it('should set sid with custom expiration if defined in configuration', function () {
            const expectedExpirationTime = 20;
            this.configurationRepository.get.withArgs(ConfigurationFields.cdsNumExpirationTime).returns(expectedExpirationTime);
            const sidRepository = new SidRepository(CDUtils, this.storageUtilsWrapper,this.configurationRepository);
            const expectedExpirationInMilliseconds = CDUtils.minutesToMilliseconds(20);

            const expectedSid = Date.now() + '-' + this.guid1;

            sidRepository.set(expectedSid);

            assert.isTrue(this.storageUtilsWrapper.saveToLocalStorage.calledOnce, 'sessionId was not set once to local storage');
            assert.equal(this.storageUtilsWrapper.saveToLocalStorage.firstCall.args[0], sidKey, 'local storage sid key was not as expected');
            assert.equal(this.storageUtilsWrapper.saveToLocalStorage.firstCall.args[1], expectedSid, 'sessionId is not equal to expected value');
            assert.equal(this.storageUtilsWrapper.saveToLocalStorage.firstCall.args[2], expectedExpirationInMilliseconds, 'expiration should have been  been 1 hour');
            assert.isTrue(this.storageUtilsWrapper.setCookie.calledOnce, 'sessionId was not set once to cookie');
            assert.equal(this.storageUtilsWrapper.setCookie.firstCall.args[0], sidKey, 'cookie sid key was not as expected');
            assert.equal(this.storageUtilsWrapper.setCookie.firstCall.args[1], expectedSid, 'sessionId is not equal to expected value');
            assert.equal(this.storageUtilsWrapper.setCookie.firstCall.args[2], expectedExpirationInMilliseconds, 'expiration is not equal to expected value');
        });

        it('should set sid with default expiration if custom expiration is not defined in configuration', function () {
            const expectedExpirationTime = 20;
            this.configurationRepository.get.withArgs(ConfigurationFields.cdsNumExpirationTime).returns(expectedExpirationTime);
            const sidRepository = new SidRepository(CDUtils, this.storageUtilsWrapper,this.configurationRepository);
            const expectedExpirationInMilliseconds = CDUtils.minutesToMilliseconds(20);

            const expectedSid = Date.now() + '-' + this.guid1;

            sidRepository.set(expectedSid);

            assert.isTrue(this.storageUtilsWrapper.saveToLocalStorage.calledOnce, 'sessionId was not set once to local storage');
            assert.equal(this.storageUtilsWrapper.saveToLocalStorage.firstCall.args[0], sidKey, 'local storage sid key was not as expected');
            assert.equal(this.storageUtilsWrapper.saveToLocalStorage.firstCall.args[1], expectedSid, 'sessionId is not equal to expected value');
            assert.equal(this.storageUtilsWrapper.saveToLocalStorage.firstCall.args[2], expectedExpirationInMilliseconds, 'expiration should have been  been 1 hour');
            assert.isTrue(this.storageUtilsWrapper.setCookie.calledOnce, 'sessionId was not set once to cookie');
            assert.equal(this.storageUtilsWrapper.setCookie.firstCall.args[0], sidKey, 'cookie sid key was not as expected');
            assert.equal(this.storageUtilsWrapper.setCookie.firstCall.args[1], expectedSid, 'sessionId is not equal to expected value');
            assert.equal(this.storageUtilsWrapper.setCookie.firstCall.args[2], expectedExpirationInMilliseconds, 'expiration is not equal to expected value');
        });

        it('should set sid if updated', function () {
            const expectedExpirationTime = 20;
            this.configurationRepository.get.withArgs(ConfigurationFields.cdsNumExpirationTime).returns(expectedExpirationTime);
            const sidRepository = new SidRepository(CDUtils, this.storageUtilsWrapper,this.configurationRepository);
            let expectedExpirationInMilliseconds = CDUtils.minutesToMilliseconds(20);

            let expectedSid = Date.now() + '-' + this.guid1;

            sidRepository.set(expectedSid);

            assert.isTrue(this.storageUtilsWrapper.saveToLocalStorage.calledOnce, 'sessionId was not set once to local storage');
            assert.equal(this.storageUtilsWrapper.saveToLocalStorage.firstCall.args[0], sidKey, 'local storage sid key was not as expected');
            assert.equal(this.storageUtilsWrapper.saveToLocalStorage.firstCall.args[1], expectedSid, 'sessionId is not equal to expected value');
            assert.equal(this.storageUtilsWrapper.saveToLocalStorage.firstCall.args[2], expectedExpirationInMilliseconds, 'expiration should have been 1 hour');
            assert.isTrue(this.storageUtilsWrapper.setCookie.calledOnce, 'sessionId was not set once to cookie');
            assert.equal(this.storageUtilsWrapper.setCookie.firstCall.args[0], sidKey, 'cookie sid key was not as expected');
            assert.equal(this.storageUtilsWrapper.setCookie.firstCall.args[1], expectedSid, 'sessionId is not equal to expected value');
            assert.equal(this.storageUtilsWrapper.setCookie.firstCall.args[2], expectedExpirationInMilliseconds, 'expiration is not equal to expected value');

            expectedExpirationInMilliseconds = CDUtils.minutesToMilliseconds(20);

            expectedSid = Date.now() + '-' + this.guid2;

            sidRepository.set(expectedSid);

            assert.isTrue(this.storageUtilsWrapper.saveToLocalStorage.calledTwice, 'sessionId was not set once to local storage');
            assert.equal(this.storageUtilsWrapper.saveToLocalStorage.secondCall.args[0], sidKey, 'local storage sid key was not as expected');
            assert.equal(this.storageUtilsWrapper.saveToLocalStorage.secondCall.args[1], expectedSid, 'sessionId is not equal to expected value');
            assert.equal(this.storageUtilsWrapper.saveToLocalStorage.firstCall.args[2], expectedExpirationInMilliseconds, 'expiration should have been  been 1 hour');
            assert.isTrue(this.storageUtilsWrapper.setCookie.calledTwice, 'sessionId was not set once to cookie');
            assert.equal(this.storageUtilsWrapper.setCookie.secondCall.args[0], sidKey, 'cookie sid key was not as expected');
            assert.equal(this.storageUtilsWrapper.setCookie.secondCall.args[1], expectedSid, 'sessionId is not equal to expected value');
            assert.equal(this.storageUtilsWrapper.setCookie.secondCall.args[2], expectedExpirationInMilliseconds, 'expiration is not equal to expected value');
        });
        it('set expiration both in cookie and local storage', function () {
            const expectedExpirationTime = 20;
            this.configurationRepository.get.withArgs(ConfigurationFields.cdsNumExpirationTime).returns(expectedExpirationTime);
            const sidRepository = new SidRepository(CDUtils, this.storageUtilsWrapper,this.configurationRepository);
            const expectedExpirationInMilliseconds = CDUtils.minutesToMilliseconds(expectedExpirationTime);
            this.storageUtilsWrapper.setExpirationInCookie.withArgs(sidKey, expectedExpirationInMilliseconds).returns(0);
            this.storageUtilsWrapper.setExpirationInLocalStorage.withArgs(sidKey, expectedExpirationInMilliseconds).returns(0);

            const expectedSid = Date.now() + '-' + this.guid1;

            sidRepository.set(expectedSid);

            assert.isTrue(this.storageUtilsWrapper.saveToLocalStorage.calledOnce, 'sessionId was not set once to local storage');
            assert.equal(this.storageUtilsWrapper.saveToLocalStorage.firstCall.args[0], sidKey, 'local storage sid key was not as expected');
            assert.equal(this.storageUtilsWrapper.saveToLocalStorage.firstCall.args[1], expectedSid, 'sessionId is not equal to expected value');
            assert.equal(this.storageUtilsWrapper.saveToLocalStorage.firstCall.args[2], expectedExpirationInMilliseconds, 'expiration should have been  been 1 hour');
            assert.isTrue(this.storageUtilsWrapper.setCookie.calledOnce, 'sessionId was not set once to cookie');
            assert.equal(this.storageUtilsWrapper.setCookie.firstCall.args[0], sidKey, 'cookie sid key was not as expected');
            assert.equal(this.storageUtilsWrapper.setCookie.firstCall.args[1], expectedSid, 'sessionId is not equal to expected value');
            assert.equal(this.storageUtilsWrapper.setCookie.firstCall.args[2], expectedExpirationInMilliseconds, 'expiration is not equal to expected value');

            const newExpirationTime = 10;
            const newExpirationTimeInMilliseconds = CDUtils.minutesToMilliseconds(newExpirationTime);
            this.storageUtilsWrapper.setExpirationInCookie.withArgs(sidKey, newExpirationTimeInMilliseconds).returns(0);
            this.storageUtilsWrapper.setExpirationInLocalStorage.withArgs(sidKey, newExpirationTimeInMilliseconds).returns(0);

            sidRepository._setExpirationTime(newExpirationTimeInMilliseconds);
            assert.isTrue(this.storageUtilsWrapper.setExpirationInLocalStorage.calledOnce, 'sessionId was not set once to local storage');
            assert.equal(this.storageUtilsWrapper.setExpirationInLocalStorage.firstCall.args[0], sidKey, 'local storage sid key was not as expected');
            assert.equal(this.storageUtilsWrapper.setExpirationInLocalStorage.firstCall.args[1], newExpirationTimeInMilliseconds, 'newExpirationTimeInMilliseconds is not equal to expected value');
            assert.isTrue(this.storageUtilsWrapper.setExpirationInCookie.calledOnce, 'sessionId was not set once to cookie');
            assert.equal(this.storageUtilsWrapper.setExpirationInCookie.firstCall.args[0], sidKey, 'cookie sid key was not as expected');
            assert.equal(this.storageUtilsWrapper.setExpirationInCookie.firstCall.args[1], newExpirationTimeInMilliseconds, 'newExpirationTime is not equal to expected value');

            
        });
        it('set expiration', function () {
            const expectedExpirationTime = 60
            this.configurationRepository.get.withArgs(ConfigurationFields.cdsNumExpirationTime).returns(expectedExpirationTime);
            const storageUtilsWrapper = new StorageUtilsWrapper(CDUtils, this.configurationRepository)
            const sidRepository = new SidRepository(CDUtils, storageUtilsWrapper,this.configurationRepository);
            const defaultExpiration = CDUtils.minutesToMilliseconds(expectedExpirationTime);
            const expectedSid = Date.now() + '-' + this.guid1;

            sidRepository.set(expectedSid);
            assert.equal(sidRepository.COOKIE_EXPIRATION_IN_MILLISECONDS, defaultExpiration )

            const newExpirationTime = 10;
            const newExpirationTimeInMilliseconds = CDUtils.minutesToMilliseconds(newExpirationTime);
            this.configurationRepository.get.withArgs(ConfigurationFields.cdsNumExpirationTime).returns(newExpirationTime);


            sidRepository.onConfigUpdate(this.configurationRepository);
            assert.equal(sidRepository.COOKIE_EXPIRATION_IN_MILLISECONDS, newExpirationTimeInMilliseconds )


        });
    });
});
