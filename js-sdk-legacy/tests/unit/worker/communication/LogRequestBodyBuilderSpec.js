import { assert } from 'chai';
import LogRequestBodyBuilder from '../../../../src/worker/communication/LogRequestBodyBuilder';
import LogMessage from '../../../../src/worker/communication/LogMessage';

describe('LogRequestBodyBuilder tests:', function () {
    describe('build tests:\n', function () {
        it('Body is built successfully', function () {
            const logRequestBodyBuilder = new LogRequestBodyBuilder();

            const logMessage = new LogMessage();
            logMessage.setData('logoooooogogogog');
            const logRequestBody = logRequestBodyBuilder.build(logMessage);

            assert.exists(logRequestBody, 'logoooooogogogog');
        });
    });
});
