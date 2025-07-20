import { assert } from 'chai';
import LogMessageBuilder from '../../../../src/worker/communication/LogMessageBuilder';
import DataPacker from '../../../../src/worker/wup/DataPacker';

describe('LogMessageBuilder tests:', function () {
    beforeEach(function () {
        this.sandbox = sinon.createSandbox();

        this.dataPackerStub = this.sandbox.createStubInstance(DataPacker);
    });

    afterEach(function () {
       this.sandbox.restore();
    });

    describe('build tests:\n', function () {
        it('Log Message is built successfully', function () {
            this.dataPackerStub.pack.returns('packedMessage');
            const logMessageBuilder = new LogMessageBuilder(this.dataPackerStub);

            const logMessage = logMessageBuilder.build({ message: 'logMessage' });

            assert.exists(logMessage);
        });
    });

    describe('getInternalMessage tests:\n', function () {
        it('Internal message is returned', function () {
            this.dataPackerStub.pack.returns('packedMessage');
            const logMessageBuilder = new LogMessageBuilder(this.dataPackerStub);

            const logMessage = logMessageBuilder.build({ message: 'logMessage' });

            assert.exists(logMessage);

            assert.deepEqual(logMessage.getInternalMessage(), 'packedMessage');
        });
    });
});
