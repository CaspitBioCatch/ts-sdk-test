import {assert} from "chai";
import sinon from "sinon";
import WorkerUtils from "../../../../src/worker/utils/WorkerUtils";
import HttpRequestFactory from "../../../../src/main/infrastructure/HttpRequestFactory";
import {TestUtils} from "../../../TestUtils";

describe('WorkerUtils', function () {
    let mockHttpRequest, sandbox;
    beforeEach(function () {
        sandbox = sinon.createSandbox();
        mockHttpRequest = {
            open: sandbox.spy(),
            setRequestHeader: sandbox.spy(),
            send: sandbox.spy(),
            onload: null,
            status: 200,
            responseText: 'Mock response'
        };
    });

    afterEach(function () {
        sandbox.restore();
    });

    it('should handle XMLHttpRequest instance correctly for successful response', async function () {
        sandbox.stub(HttpRequestFactory, 'create').returns(mockHttpRequest);
        const onSuccess = sandbox.spy();
        const onError = sandbox.spy();

        WorkerUtils.getPostUrl('http://www.test.com/', 'POST', {}, onSuccess,
            onError, false, 12000, null);

        // Simulate response
        mockHttpRequest.onload();

        //sinon.assert.called(onSuccess);
        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(onSuccess.called, 'onSuccess should be called');
            assert.isTrue(onError.notCalled, 'onError should not be called');
        });

    });

    it('should log an error when an exception is thrown in getPostUrl', function () {
        const url = 'http://www.test.com/';
        sandbox.stub(HttpRequestFactory, 'create').throws(new Error('Test Error'));

        let errorCaught = false;

        // Act: Call getPostUrl and catch the re-thrown exception
        try {
            WorkerUtils.getPostUrl(url, 'POST', null, null, null, false, 12000, null);
        } catch (e) {
            errorCaught = true;
        }

        // Assert: Verify that an error was caught
        assert.isTrue(errorCaught);

    });


});
