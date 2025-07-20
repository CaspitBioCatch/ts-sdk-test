import {assert} from "chai";
import sinon from "sinon";
import HashService from "../../../../src/worker/services/HashService";
import Log from "../../../../src/main/technicalServices/log/Logger";
import DOMUtils from "../../../../src/main/technicalServices/DOMUtils";

describe('HashService', () => {
    let logInfoStub, sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        logInfoStub = sandbox.stub(Log, 'info');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should use fallback hashing when SubtleCrypto is not supported', (done) => {
        const isSupportedStub = sandbox.stub(DOMUtils, 'isSubtleCryptoSupported');
        isSupportedStub.returns(false);

        const testData = 'test data';
        const expectedHash = '916f0027a575074ce72a331777c3478d6513f786a591bd892da1a577bf2335f9';

        HashService.hashSha256(testData, (err, hash) => {
            const logArgs = logInfoStub.getCall(0).args[0];
            assert.isNull(err, 'Error should be null');
            assert.equal(hash, expectedHash, 'Fallback hash does not match expected value');
            assert.isTrue(logInfoStub.calledOnce, 'Log.info should be called once');
            assert.equal(logArgs, 'HashService: SubtleCrypto is not supported using fallback hashing',
                'Log.info should be called with the correct message');
            done();
        });
    });

    describe('should use SubtleCrypto hashing when supported', () => {
        let subtleDigestStub;
        before(function () {
            if (!DOMUtils.isSubtleCryptoSupported()) {
                this?.skip();
            }
        });

        beforeEach(function () {
            subtleDigestStub = sandbox.stub(crypto.subtle, 'digest');
        });
        afterEach(function () {
            sandbox.restore();
        });

        it('should hash data correctly when SubtleCrypto is supported', (done) => {
            const testData = 'test data';
            const expectedHash = '916f0027a575074ce72a331777c3478d6513f786a591bd892da1a577bf2335f9';

            // Convert the expected hash to a byte array
            const byteArrayForExpectedHash = [];
            for (let i = 0; i < expectedHash.length; i += 2) {
                byteArrayForExpectedHash.push(parseInt(expectedHash.substring(i, i + 2), 16));
            }

            subtleDigestStub.resolves(new Uint8Array(byteArrayForExpectedHash));

            HashService.hashSha256(testData, (err, hash) => {
                assert.isNull(err, 'Error should be null');
                assert.equal(hash, expectedHash, 'Hash does not match expected value');
                done();
            });
        });

        it('should handle errors in SubtleCrypto hashing', (done) => {
            const testData = 'test data';
            const testError = new Error('Test error');
            subtleDigestStub.rejects(testError);

            HashService.hashSha256(testData, (err) => {
                assert.equal(err, testError, 'Error should match the test error');
                done();
            });
        });
    });
});