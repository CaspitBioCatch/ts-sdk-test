import CDUtils from '../../../../src/main/technicalServices/CDUtils';
import {TestUtils} from "../../../TestUtils";

const assert = chai.assert;

describe('CDUtils tests:', function () {
    describe('clearTextFromNumbers', function () {
        it('should replace any more than one sequence to *', function () {
            const url = 'http://www.test.com/12/bbb?bob=1234&sabag=4/';
            const docUrl = CDUtils.clearTextFromNumbers(url);
            assert.equal('http://www.test.com/**/bbb?bob=****&sabag=*/', docUrl);
        });

        it('should return an empty string once input is undefined', function () {
            const text = CDUtils.clearTextFromNumbers(undefined);

            assert.equal(text, '');
        });

        it('should return an empty string once input is null', function () {
            const text = CDUtils.clearTextFromNumbers(null);

            assert.equal(text, '');
        });

        it('should return an empty string once input is empty', function () {
            const text = CDUtils.clearTextFromNumbers('');

            assert.equal(text, '');
        });
    });

    describe('getTruncatedHash', function () {
        it('should get the hash result with the value truncated', function () {
            const result = CDUtils.getTruncatedHash('hi', 2);
            assert.equal(result, '1347078', 'bad truncated hash');
        });

        it('should handle null param', function () {
            const result = CDUtils.getTruncatedHash(null, 2);
            assert.equal(result, '', 'bad truncated hash');
        });
    });

    describe('getCookie, setCookie tests:', function () {
        it('set and get cookie, no expiration', function () {
            CDUtils.StorageUtils.setCookie('test', 'shirleyTest');
            const res = CDUtils.StorageUtils.getCookie('test');
            assert.equal(res, 'shirleyTest', "cookie1 doesn't have the correct value");
        });

        it('set and get cookie, with expiration', function () {
            CDUtils.StorageUtils.setCookie('test1', 'shirleyTest1', 3600000);
            const res = CDUtils.StorageUtils.getCookie('test1');
            assert.equal(res, 'shirleyTest1', "cookie2 doesn't have the correct value");
        });

        xit('set and get cookie, check expiration works', function () {
            const clock = sinon.useFakeTimers();

            CDUtils.StorageUtils.setCookie('test2', 'shirleyTest2', 1000);
            let res = CDUtils.StorageUtils.getCookie('test2');
            assert.equal(res, 'shirleyTest2', "cookie3 doesn't have the correct value");

            clock.tick(1500);

            res = CDUtils.StorageUtils.getCookie('test2');
            assert.isNull(res);
        });

        it('get null for non existant cookie', function () {
            const res = CDUtils.StorageUtils.getCookie('test3');
            assert.equal(res, '', 'cookie was not empty');
        });

        it('set expiration cookie test', function () {
            CDUtils.StorageUtils.setCookie('test_key', 'cookieTest', 3600000);
            let res = CDUtils.StorageUtils.getCookie('test_key');
            assert.equal(res, 'cookieTest', "cookie doesn't have the correct value");
            //set new expiration
            CDUtils.StorageUtils.setExpirationInCookie('test_key', 200000);
            res = CDUtils.StorageUtils.getCookie('test_key');
            assert.equal(res, 'cookieTest', "cookie doesn't have the correct value");

        });
    });

    describe('local storage:', function () {
        const testKey = 'testKey';

        describe('getFromLocalStorage:', function () {
            it('should get value from local storage', function () {
                CDUtils.StorageUtils.saveToLocalStorage(testKey, 'testValue3232');
                const res = CDUtils.StorageUtils.getFromLocalStorage(testKey);
                assert.equal(res, 'testValue3232', `local storage doesn't have the correct value. Actual value ${res}`);
            });

            it('should get value in legacy format from local storage', function () {
                CDUtils.StorageUtils.saveToLocalStorage(testKey, 'legacytestValue');
                const res = CDUtils.StorageUtils.getFromLocalStorage(testKey);
                assert.equal(res, 'legacytestValue', `local storage doesn't have the correct value. Actual value ${res}`);
            });

            it('should get null if value expiration has expired', function () {
                this.dateNowStub = sinon.stub(CDUtils, 'dateNow');
                this.dateNowStub.returns(1);
                CDUtils.StorageUtils.saveToLocalStorage(testKey, 'testValue', 12345);
                this.dateNowStub.returns(123456);
                const res = CDUtils.StorageUtils.getFromLocalStorage(testKey);
                assert.isNull(res);
                this.dateNowStub.restore();
            });
        });

        describe('saveToLocalStorage:', function () {
            it('should save to local storage', function () {
                CDUtils.StorageUtils.saveToLocalStorage(testKey, 'testValue');
                const res = CDUtils.StorageUtils.getFromLocalStorage(testKey);
                assert.equal(res, 'testValue', `local storage doesn't have the correct value. Actual value ${res}`);
            });

            it('should update value in local storage', function () {
                CDUtils.StorageUtils.saveToLocalStorage(testKey, 'testValue');
                let res = CDUtils.StorageUtils.getFromLocalStorage(testKey);
                assert.equal(res, 'testValue', `local storage doesn't have the correct value. Actual value ${res}`);

                // Do the update
                CDUtils.StorageUtils.saveToLocalStorage(testKey, 'updated testValue');
                res = CDUtils.StorageUtils.getFromLocalStorage(testKey);
                assert.equal(res, 'updated testValue', `local storage doesn't have the correct value. Actual value ${res}`);
            });

            it('should save value with expiration to local storage', function () {
                this.dateNowStub = sinon.stub(CDUtils, 'dateNow');
                this.dateNowStub.returns(1);
                CDUtils.StorageUtils.saveToLocalStorage(testKey, 'testValue', 12345);
                this.dateNowStub.returns(1236);
                const res = CDUtils.StorageUtils.getFromLocalStorage(testKey);
                assert.equal(res, 'testValue', `local storage doesn't have the correct value. Actual value ${res}`);
                this.dateNowStub.restore();
            });

            it('set expiration to local storage test', function () {
                this.dateNowStub = sinon.stub(CDUtils, 'dateNow');
                this.dateNowStub.returns(1);
                //set expiration
                CDUtils.StorageUtils.saveToLocalStorage(testKey, 'testValue', 234567);
                this.dateNowStub.returns(1236);
                //get value
                let res = CDUtils.StorageUtils.getFromLocalStorage(testKey);
                assert.equal(res, 'testValue', `local storage doesn't have the correct value. Actual value ${res}`);

                //set new expiration
                this.dateNowStub.returns(1);
                let retVal = CDUtils.StorageUtils.setExpirationInLocalStorage(testKey,  12345);
                assert.equal(retVal, 0, 'setExpirationInLocalStorage should return 0')

                //get value
                res = CDUtils.StorageUtils.getFromLocalStorage(testKey);
                assert.equal(res, 'testValue', `local storage doesn't have the correct value. Actual value ${res}`);
                //make sure that there is no value when time expired
                this.dateNowStub.returns(123456);
                res = CDUtils.StorageUtils.getFromLocalStorage(testKey);
                assert.isNull(res);

                 CDUtils.StorageUtils.setExpirationInLocalStorage(testKey, 12345);
                this.dateNowStub.restore();
            });

            it('set expiration to local storage when key did not exist', function () {
                this.dateNowStub = sinon.stub(CDUtils, 'dateNow');
                this.dateNowStub.returns(1);
                //set expiration when key did not exist
                this.dateNowStub.returns(1);
                let res = CDUtils.StorageUtils.setExpirationInLocalStorage(testKey,  12345);
                assert.equal(res, 1, 'setExpirationInLocalStorage should return 1')

                //set expiration when key exist
                CDUtils.StorageUtils.saveToLocalStorage(testKey, 'testValue', 12345);
                res = CDUtils.StorageUtils.setExpirationInLocalStorage(testKey,  23456);
                assert.equal(res, 0, 'setExpirationInLocalStorage should return 0')
                this.dateNowStub.restore();

             });

            it('set expiration to cookie when key did not exist', function () {
                this.dateNowStub = sinon.stub(CDUtils, 'dateNow');
                this.dateNowStub.returns(1);

                //set expiration when key did not exist
                this.dateNowStub.returns(1);
                let res = CDUtils.StorageUtils.setExpirationInCookie(testKey,  12345);
                assert.equal(res, 1, 'setExpirationInLocalStorage should return 1')

                //set expiration when key exist
                CDUtils.StorageUtils.setCookie(testKey, 'testValue', 12345);
                res = CDUtils.StorageUtils.setExpirationInCookie(testKey,  23456);
                assert.equal(res, 0, 'setExpirationInLocalStorage should return 0')

                this.dateNowStub.restore();

            });
        });

        describe('removeFromLocalStorage:', function () {
            it('should remove value from local storage', function () {
                CDUtils.StorageUtils.saveToLocalStorage(testKey, 'testValue');
                let res = CDUtils.StorageUtils.getFromLocalStorage(testKey);
                assert.equal(res, 'testValue', `local storage doesn't have the correct value. Actual value ${res}`);

                CDUtils.StorageUtils.removeFromLocalStorage(testKey);
                res = CDUtils.StorageUtils.getFromLocalStorage(testKey);
                assert.isNull(res);
            });
        });
    });

    describe('session storage:', function () {
        const testKey = 'sessionTestKey';

        describe('getFromSessionStorage:', function () {
            it('should get value from session storage', function () {
                CDUtils.StorageUtils.saveToSessionStorage(testKey, 'testValue3232');
                const res = CDUtils.StorageUtils.getFromSessionStorage(testKey);
                assert.equal(res, 'testValue3232', `session storage doesn't have the correct value. Actual value ${res}`);
            });

            it('should get value in legacy format from session storage', function () {
                CDUtils.StorageUtils.saveToSessionStorage(testKey, 'legacytestValue');
                const res = CDUtils.StorageUtils.getFromSessionStorage(testKey);
                assert.equal(res, 'legacytestValue', `session storage doesn't have the correct value. Actual value ${res}`);
            });
        });

        describe('saveToSessionStorage:', function () {
            it('should save to session storage', function () {
                CDUtils.StorageUtils.saveToSessionStorage(testKey, 'testValue');
                const res = CDUtils.StorageUtils.getFromSessionStorage(testKey);
                assert.equal(res, 'testValue', `session storage doesn't have the correct value. Actual value ${res}`);
            });

            it('should update value in session storage', function () {
                CDUtils.StorageUtils.saveToSessionStorage(testKey, 'testValue');
                let res = CDUtils.StorageUtils.getFromSessionStorage(testKey);
                assert.equal(res, 'testValue', `session storage doesn't have the correct value. Actual value ${res}`);

                // Do the update
                CDUtils.StorageUtils.saveToSessionStorage(testKey, 'updated testValue');
                res = CDUtils.StorageUtils.getFromSessionStorage(testKey);
                assert.equal(res, 'updated testValue', `session storage doesn't have the correct value. Actual value ${res}`);
            });
        });

        describe('removeFromSessionStorage:', function () {
            it('should remove value from session storage', function () {
                CDUtils.StorageUtils.saveToSessionStorage(testKey, 'testValue');
                let res = CDUtils.StorageUtils.getFromSessionStorage(testKey);
                assert.equal(res, 'testValue', `session storage doesn't have the correct value. Actual value ${res}`);

                CDUtils.StorageUtils.removeFromSessionStorage(testKey);
                res = CDUtils.StorageUtils.getFromSessionStorage(testKey);
                assert.isNull(res);
            });
        });
    });

    describe('isBoolean tests:', function(){
        it('should return true', function (){
           const returnedValue = CDUtils.isBoolean(true);
            assert.isTrue(returnedValue,'was not true');
        });

        it('should return false', function(){
            const returnedValue1 = CDUtils.isBoolean('test');
            const returnedValue2 = CDUtils.isBoolean(undefined);
            const returnedValue3 = CDUtils.isBoolean(null);

            assert.isFalse(returnedValue1, 'was not false');
            assert.isFalse(returnedValue2, 'was not false');
            assert.isFalse(returnedValue3, 'was not false');
        })
    });

    describe('getNativeWindowFn', function () {
        it('should get the same native Date.now function', function (done) {
            const originalDateNow = Date.now;

            CDUtils.getNativeWindowFn('Date.now', Date.now, function (dateNowReturned) {
                assert.equal(originalDateNow, dateNowReturned, "The Date.now object retrieved from Iframe although it hasn't changed.");
                Date.now = originalDateNow; // Just in case
                done();
            });
        });
    });

    describe('cutDecimalPointDigits', function () {
        it('should return zero on zero', function () {
            const num = 0;

            const res = CDUtils.cutDecimalPointDigits(num, 3);
            assert.equal(res, 0, 'The cutDecimalPointDigits result should be 0');
        });

        it('should return floor on number', function () {
            let num = 5.123456;
            let res = CDUtils.cutDecimalPointDigits(num, 3);
            assert.equal(res, 5.123, 'The cutDecimalPointDigits result should be 5.123');

            num = 5.123999;
            res = CDUtils.cutDecimalPointDigits(num, 3);
            assert.equal(res, 5.124, 'The cutDecimalPointDigits result should be 5.123');

            num = 0.123999;
            res = CDUtils.cutDecimalPointDigits(num, 2);
            assert.equal(res, 0.12, 'The cutDecimalPointDigits result should be 5.12');

            num = 12;
            res = CDUtils.cutDecimalPointDigits(num, 3);
            assert.equal(res, 12, 'The cutDecimalPointDigits result should be 5.12');
        });
    });

    describe('getHash', function () {
        it('get hash', function () {
            const input = 'tadadada123124124';
            const hashed = CDUtils.getHash(input);

            assert.notEqual(input, hashed);
        });
    });

    describe('murmurhash3', function () {
        it('get murmurhash3', function () {
            const input = 'tadadada123124124';
            const hashed = CDUtils.murmurhash3(input);

            assert.notEqual(input, hashed.toString());
        });
    });

    describe( 'digest_256', function() {
        describe( 'with window.crypto available', function () {
            beforeEach( function () {
                function SubtleCrypto() {
                    return { digest: function() {} }
                }

                if (!window.crypto.subtle) {
                    window.crypto.subtle = SubtleCrypto();
                }
                this.digest_sha256 = sinon.stub(window.crypto.subtle, 'digest').callsFake(async function() {
                    return new ArrayBuffer(32);
                });
            });

            afterEach( function () {
                this.digest_sha256.restore();
                delete window.crypto.subtle;
            });

            it('get digest_256', async function () {
                const input = 'tadadada123124124';

                const hashed = await CDUtils.digest_sha256(input);

                await TestUtils.waitForNoAssertion(() => {
                    assert.notEqual(input, hashed.toString());
                });

            });
        });
        describe( 'with window.crypto not available', function () {
            beforeEach(function () {
                this.getDigestMethod = sinon.stub(CDUtils, 'getDigestMethod').returns(null);
            });

            afterEach( function () {
                this.getDigestMethod.restore();
            });
            it('returns an empty string due to unavailability of crypto.subtle.digest', async function () {
                // "window.crypto.subtle" is not available in the test environment as
                const input = 'tadadada123124124';
                const hashed = await CDUtils.digest_sha256(input);

                await TestUtils.waitForNoAssertion(() => {
                    assert.isEmpty(hashed.toString());
                });
            });
        });
        describe('with window.crypto available but digest throws an error', function () {
            beforeEach( function () {
                function SubtleCrypto() {
                    return { digest: function() {} }
                }

                if (!window.crypto.subtle) {
                    window.crypto.subtle = SubtleCrypto();
                }
                this.digest_sha256 = sinon.stub(window.crypto.subtle, 'digest').callsFake(async function() {
                    throw new Error('digest_sha256 failed');
                });
            });

            afterEach( function () {
                this.digest_sha256.restore();
                delete window.crypto.subtle;
            });

            it('get digest_256', async function () {
                const input = 'tadadada123124124';

                const hashed = await CDUtils.digest_sha256(input);

                await TestUtils.waitForNoAssertion(() => {
                    assert.isEmpty(hashed.toString());
                });

            });
        });
    });

    describe('getTruncatedHash', function () {
        it('get truncated hash', function () {
            const input = 'tadadada123124124';
            const fullHashed = CDUtils.murmurhash3(input);

            const truncatedHash = CDUtils.getTruncatedHash(input, 2);

            assert.include(fullHashed.toString(), truncatedHash);
        });
    });

    describe('hasProtocol', function () {
        it('url has https protocol', function () {
            assert.isTrue(CDUtils.hasProtocol('https://'));
        });

        it('url has http protocol', function () {
            assert.isTrue(CDUtils.hasProtocol('http://'));
        });

        it('url has https protocol when upper case', function () {
            assert.isTrue(CDUtils.hasProtocol('hTTpS://'));
        });

        it('url has http protocol when upper case', function () {
            assert.isTrue(CDUtils.hasProtocol('HtTp://'));
        });

        it('url has no protocol', function () {
            assert.isFalse(CDUtils.hasProtocol('bobURL_http://'));
        });
    });
});
