import StorageUtilsWrapper from '../../../../../src/main/technicalServices/StorageUtilsWrapper';
import CDUtils from '../../../../../src/main/technicalServices/CDUtils';
import BrandRepository from '../../../../../src/main/core/branding/BrandRepository';

describe('BrandRepository tests:', function () {
    const assert = chai.assert;
    const brandKey = 'brand';

    describe('get brand:', function () {
        beforeEach(function () {
            this.sandbox = sinon.createSandbox();
            this.storageUtilsWrapper = sinon.createStubInstance(StorageUtilsWrapper);
        });

        afterEach(function () {
            this.sandbox.restore();
        });

        it('should return current brand when data exists in both local storage and cookie', function() {
           const brandRepository = new BrandRepository(CDUtils, this.storageUtilsWrapper);

           const brand = 'testBrand';

           this.storageUtilsWrapper.getFromLocalStorage.withArgs(brandKey).returns(brand);
           this.storageUtilsWrapper.getCookie.withArgs(brandKey).returns(brand);

           const retrievedBrand = brandRepository.get();
           assert.equal(retrievedBrand, brand, 'retrived brand is not equal to expected value');
        });

        it('should return current brand when data exists only in local storage', function () {
            const brandRepository = new BrandRepository(CDUtils, this.storageUtilsWrapper);

            const brand = 'testBrand';

            this.storageUtilsWrapper.getFromLocalStorage.withArgs(brandKey).returns(brand);
            this.storageUtilsWrapper.getCookie.withArgs(brandKey).returns(null);

            const retrievedBrand = brandRepository.get();
            assert.equal(retrievedBrand, brand, 'retrieved brand is not equal to expected value');
        });

        it('should return current brand when data exists only in cookie', function () {
            const brandRepository = new BrandRepository(CDUtils, this.storageUtilsWrapper);

            const brand = 'testBrand';

            this.storageUtilsWrapper.getFromLocalStorage.withArgs(brandKey).returns(null);
            this.storageUtilsWrapper.getCookie.withArgs(brandKey).returns(brand);

            const retrievedBrand = brandRepository.get();
            assert.equal(retrievedBrand, brand, 'retrieved brand is not equal to expected value');
        });

        it('should return current brand when brand is valid only in local storage', function () {
            const brandRepository = new BrandRepository(CDUtils, this.storageUtilsWrapper);

            const brand = 'testBrand';
            this.storageUtilsWrapper.getFromLocalStorage.withArgs(brandKey).returns(brand);
            // Cookie will return an invalid brand
            this.storageUtilsWrapper.getCookie.withArgs(brandKey).returns(undefined);

            const retrievedBrand = brandRepository.get();
            assert.equal(retrievedBrand, brand, 'retrieved brand is not equal to expected value');
        });

        it('should return current brand when brand is valid only in cookie', function () {
            const brandRepository = new BrandRepository(CDUtils, this.storageUtilsWrapper);

            // Create an sid without the timestamp
            const brand = 'testBrand';
            // Local Storage will return an invalid sid
            this.storageUtilsWrapper.getFromLocalStorage.withArgs(brandKey).returns('test@brand');
            this.storageUtilsWrapper.getCookie.withArgs(brandKey).returns(brand);

            const retrievedBrand = brandRepository.get();
            assert.equal(retrievedBrand, brand, 'retrieved brand is not equal to expected value');
        });

        it('should return null when brand is null in both local storage and cookie', function () {
            const brandRepository = new BrandRepository(CDUtils, this.storageUtilsWrapper);

            const brand = null;
            this.storageUtilsWrapper.saveToLocalStorage.withArgs(brandKey).returns(null);
            this.storageUtilsWrapper.getCookie.withArgs(brandKey).returns(null);

            const retrievedBrand = brandRepository.get();
            assert.equal(retrievedBrand, brand, 'retrieved brand is not equal to expected value');
        });

        it('should return null when brand is undefined in both local storage and cookie', function () {
            const brandRepository = new BrandRepository(CDUtils, this.storageUtilsWrapper);

            const brand = null;
            this.storageUtilsWrapper.saveToLocalStorage.withArgs(brandKey).returns(undefined);
            this.storageUtilsWrapper.getCookie.withArgs(brandKey).returns(undefined);

            const retrievedBrand = brandRepository.get();
            assert.equal(retrievedBrand, brand, 'retrieved brand is not equal to expected value');
        });

        it('should return null when brand is invalid in both cookie and local storage', function () {
            const brandRepository = new BrandRepository(CDUtils, this.storageUtilsWrapper);

            // Create an sid without the timestamp
            const brand = null;
            this.storageUtilsWrapper.getFromLocalStorage.withArgs(brandKey).returns(brand);
            this.storageUtilsWrapper.getCookie.withArgs(brandKey).returns(brand);

            const retrievedBrand = brandRepository.get();
            assert.equal(retrievedBrand, null, 'retrieved brand is not equal to expected value');
        });
    });

    describe('set brand tests:', function() {
        beforeEach(function () {
            this.sandbox = sinon.createSandbox();
            this.storageUtilsWrapper = sinon.createStubInstance(StorageUtilsWrapper);
        });

        afterEach(function () {
            this.sandbox.restore();
        });

        it('should set brand in local storage and cookie', function () {
            const brandRepository = new BrandRepository(CDUtils, this.storageUtilsWrapper);
            const brand = 'testBrand';

            brandRepository.set(brand);

            assert.isTrue(this.storageUtilsWrapper.saveToLocalStorage.calledOnce, 'brand was not set once to local storage');
            assert.equal(this.storageUtilsWrapper.saveToLocalStorage.firstCall.args[0], brandKey, 'local storage brand key was not as expected');
            assert.equal(this.storageUtilsWrapper.saveToLocalStorage.firstCall.args[1], brand, 'brand is not equal to expected value');
            assert.isTrue(this.storageUtilsWrapper.setCookie.calledOnce, 'brand was not set once to cookie');
            assert.equal(this.storageUtilsWrapper.setCookie.firstCall.args[0], brandKey, 'cookie brnad key was not as expected');
            assert.equal(this.storageUtilsWrapper.setCookie.firstCall.args[1], brand, 'brand is not equal to expected value');
        });

        it('should not set brand if it is invalid', function () {
            const brandRepository = new BrandRepository(CDUtils, this.storageUtilsWrapper);

            brandRepository.set(0);

            assert.isTrue(this.storageUtilsWrapper.saveToLocalStorage.notCalled, 'local storage set data was called at least once');
            assert.isTrue(this.storageUtilsWrapper.setCookie.notCalled, 'cookie set data was called at least once');
            assert.isTrue(this.storageUtilsWrapper.saveToLocalStorage.notCalled, 'session storage set data was called at least once');
            assert.isTrue(this.storageUtilsWrapper.setCookie.notCalled, 'cookie set data was called at least once');
        });

        it('should set brand with custom expiration if defined in configuration', function () {
            const brandRepository = new BrandRepository(CDUtils, this.storageUtilsWrapper);
            const expectedExpirationInMilliseconds = CDUtils.minutesToMilliseconds(365 * 24 * 60);

            const brand = 'testBrand';

            brandRepository.set(brand);

            assert.isTrue(this.storageUtilsWrapper.saveToLocalStorage.calledOnce, 'brand was not set once to local storage');
            assert.equal(this.storageUtilsWrapper.saveToLocalStorage.firstCall.args[0], brandKey, 'local storage brand key was not as expected');
            assert.equal(this.storageUtilsWrapper.saveToLocalStorage.firstCall.args[1], brand, 'brand is not equal to expected value');
            assert.equal(this.storageUtilsWrapper.saveToLocalStorage.firstCall.args[2], undefined, 'expiration should have been undefined');
            assert.isTrue(this.storageUtilsWrapper.setCookie.calledOnce, 'brand was not set once to cookie');
            assert.equal(this.storageUtilsWrapper.setCookie.firstCall.args[0], brandKey, 'cookie brand key was not as expected');
            assert.equal(this.storageUtilsWrapper.setCookie.firstCall.args[1], brand, 'brand is not equal to expected value');
            assert.equal(this.storageUtilsWrapper.setCookie.firstCall.args[2], expectedExpirationInMilliseconds, 'expiration is not equal to expected value');
        });

        it('should set brand if updated', function () {
            const brandRepository = new BrandRepository(CDUtils, this.storageUtilsWrapper);
            let expectedExpirationInMilliseconds = CDUtils.minutesToMilliseconds(365 * 24 * 60);

            let brand = 'testBrand';

            brandRepository.set(brand);

            assert.isTrue(this.storageUtilsWrapper.saveToLocalStorage.calledOnce, 'brand was not set once to local storage');
            assert.equal(this.storageUtilsWrapper.saveToLocalStorage.firstCall.args[0], brandKey, 'local storage brand key was not as expected');
            assert.equal(this.storageUtilsWrapper.saveToLocalStorage.firstCall.args[1], brand, 'brand is not equal to expected value');
            assert.equal(this.storageUtilsWrapper.saveToLocalStorage.firstCall.args[2], undefined, 'expiration should have been undefined');
            assert.isTrue(this.storageUtilsWrapper.setCookie.calledOnce, 'brand was not set once to cookie');
            assert.equal(this.storageUtilsWrapper.setCookie.firstCall.args[0], brandKey, 'cookie brand key was not as expected');
            assert.equal(this.storageUtilsWrapper.setCookie.firstCall.args[1], brand, 'brand is not equal to expected value');
            assert.equal(this.storageUtilsWrapper.setCookie.firstCall.args[2], expectedExpirationInMilliseconds, 'expiration is not equal to expected value');

            expectedExpirationInMilliseconds = CDUtils.minutesToMilliseconds(365 * 24 * 60);

            brand = 'anotherTestBrand';

            brandRepository.set(brand);

            assert.isTrue(this.storageUtilsWrapper.saveToLocalStorage.calledTwice, 'brand was not set once to local storage');
            assert.equal(this.storageUtilsWrapper.saveToLocalStorage.secondCall.args[0], brandKey, 'local storage brand key was not as expected');
            assert.equal(this.storageUtilsWrapper.saveToLocalStorage.secondCall.args[1], brand, 'brand is not equal to expected value');
            assert.equal(this.storageUtilsWrapper.saveToLocalStorage.firstCall.args[2], undefined, 'expiration should have been undefined');
            assert.isTrue(this.storageUtilsWrapper.setCookie.calledTwice, 'brand was not set once to cookie');
            assert.equal(this.storageUtilsWrapper.setCookie.secondCall.args[0], brandKey, 'cookie brand key was not as expected');
            assert.equal(this.storageUtilsWrapper.setCookie.secondCall.args[1], brand, 'brand is not equal to expected value');
            assert.equal(this.storageUtilsWrapper.setCookie.secondCall.args[2], expectedExpirationInMilliseconds, 'expiration is not equal to expected value');
        });
    });
});
