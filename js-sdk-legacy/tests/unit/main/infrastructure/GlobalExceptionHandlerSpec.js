import { assert } from 'chai';
import GlobalExceptionHandler from '../../../../src/main/infrastructure/GlobalExceptionHandler';
import CDUtils from '../../../../src/main/technicalServices/CDUtils';
import Log from '../../../../src/main/technicalServices/log/Logger';

describe('GlobalExceptionHandler test:', function () {
    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    it('should log error', function () {
        const sendLog = this.sandbox.stub(Log, 'error');
        const handler = new GlobalExceptionHandler(CDUtils, 'myFile.js');

        const err = new Error('testing error handler');
        err.filename = 'myFile.js';
        handler._handleException(err);

        assert.isTrue(sendLog.calledOnce, 'logger was not called');
        assert.equal(sendLog.firstCall.args[0], 'caught unhandled exception. testing error handler', 'wrong message');
        sendLog.restore();
    });

    it('should log error with error property', function () {
        const sendLog = this.sandbox.stub(Log, 'error');
        const handler = new GlobalExceptionHandler(CDUtils, 'myFile.js');

        const err = new Error('testing error handler');

        const errorEvent = {
            filename: 'myFile.js',
            error: err,
        };

        handler._handleException(errorEvent);

        assert.isTrue(sendLog.calledOnce, 'logger was not called');
        assert.isTrue(sendLog.firstCall.args[0].startsWith('caught unhandled exception. Error: testing error handler, Line: '), 'wrong message');
        sendLog.restore();
    });

    it('should not send error from another script', function () {
        const sendLog = this.sandbox.stub(Log, 'error');
        const handler = new GlobalExceptionHandler(CDUtils, 'myFile.js');

        const err = new Error('testing error handler');
        err.filename = 'noMyFile.js';
        handler._handleException(err);

        assert.isTrue(sendLog.notCalled, 'logger was called');
        sendLog.restore();
    });

    it('should not send error if script name was not specified', function () {
        const sendLog = this.sandbox.stub(Log, 'error');
        const handler = new GlobalExceptionHandler(CDUtils);

        const err = new Error('testing error handler');
        err.filename = 'someFile.js';
        handler._handleException(err);

        assert.isTrue(sendLog.notCalled, 'logger was called');
        sendLog.restore();
    });
});
