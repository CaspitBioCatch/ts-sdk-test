import { assert } from 'chai';
import sinon from 'sinon';
import { FontsDetectionContract, FontDataType } from '../../../../../../src/main/contract/staticContracts/FontsDetectionContract';
import Log from '../../../../../../src/main/technicalServices/log/Logger';

describe('FontsDetectionContract Tests', function () {
    let logWarnStub;

    beforeEach(() => {
        // Stub logging methods
        logWarnStub = sinon.stub(Log, 'warn');
    });

    afterEach(() => {
        // Restore all stubs
        sinon.restore();
    });

    describe('Constructor Tests', function () {
        it('should initialize with valid parameters', function () {
            const contract = new FontsDetectionContract(FontDataType.V1_AND_V2, [['Arial'], ['Roboto']]);
            assert.equal(contract.dataType, FontDataType.V1_AND_V2);
            assert.deepEqual(contract.fontList, [['Arial'], ['Roboto']]);
        });

        it('should throw an error and log warning for invalid dataType', function () {
            assert.throws(() => {
                new FontsDetectionContract('INVALID_TYPE', [['Arial'], ['Roboto']]);
            }, /Invalid parameters provided to FontsDetectionContract/);

            assert.isTrue(logWarnStub.calledOnce);
        });

        it('should throw an error and log warning for invalid fontList', function () {
            assert.throws(() => {
                new FontsDetectionContract(FontDataType.V1_AND_V2, null);
            }, /Invalid parameters provided to FontsDetectionContract/);

            assert.isTrue(logWarnStub.calledOnce);
        });
    });

    describe('buildQueueMessage Method Tests', function () {
        it('should return valid message for V1_ONLY', function () {
            const contract = new FontsDetectionContract(FontDataType.V1_ONLY, [['Arial, Verdana'], []]);
            const message = contract.buildQueueMessage();
            assert.deepEqual(message, ['fonts', ['v1', 'Arial, Verdana']]);
        });

        it('should return valid message for V2_ONLY', function () {
            const contract = new FontsDetectionContract(FontDataType.V2_ONLY, [[], ['Roboto', 'Open Sans']]);
            const message = contract.buildQueueMessage();
            assert.deepEqual(message, ['fonts', ['v2', ['Roboto', 'Open Sans']]]);
        });

        it('should return valid message for V1_AND_V2', function () {
            const contract = new FontsDetectionContract(FontDataType.V1_AND_V2, [['Arial, Verdana'], ['Roboto']]);
            const message = contract.buildQueueMessage();
            assert.deepEqual(message, ['fonts', ['v1+v2', ['Arial, Verdana', ['Roboto']]]]);
        });

        it('should validate the generated message', function () {
            const contract = new FontsDetectionContract(FontDataType.V1_AND_V2, [['Arial, Verdana'], ['Roboto']]);
            const validateMessageSpy = sinon.spy(contract, 'validateMessage');
            contract.buildQueueMessage();
            assert.isTrue(validateMessageSpy.calledOnce);
        });
    });

    describe('validateMessage Method Tests', function () {
        it('should validate correct message for V1_ONLY', function () {
            const contract = new FontsDetectionContract(FontDataType.V1_ONLY, [['Arial, Verdana'], []]);
            const message = ['fonts', ['v1', 'Arial, Verdana']];
            contract.validateMessage(message);
            assert.isTrue(logWarnStub.notCalled);
        });

        it('should validate correct message for V2_ONLY', function () {
            const contract = new FontsDetectionContract(FontDataType.V2_ONLY, [[], ['Roboto', 'Open Sans']]);
            const message = ['fonts', ['v2', ['Roboto', 'Open Sans']]];
            contract.validateMessage(message);
            assert.isTrue(logWarnStub.notCalled);
        });

        it('should validate correct message for V1_AND_V2', function () {
            const contract = new FontsDetectionContract(FontDataType.V1_AND_V2, [['Arial, Verdana'], ['Roboto']]);
            const message = ['fonts', ['v1+v2', ['Arial, Verdana', ['Roboto']]]];
            contract.validateMessage(message);
            assert.isTrue(logWarnStub.notCalled);
        });

        it('should log warning for invalid message key', function () {
            const contract = new FontsDetectionContract(FontDataType.V1_ONLY, [['Arial'], []]);
            const message = [null, ['v1', 'Arial']];
            assert.throws(() => {
                contract.validateMessage(message);
            }, /Invalid message structure/);

            assert.isTrue(logWarnStub.calledOnce);
        });

        it('should log warning for invalid payload structure', function () {
            const contract = new FontsDetectionContract(FontDataType.V1_ONLY, [['Arial'], []]);
            const message = ['fonts', ['v1', null]];
            assert.throws(() => {
                contract.validateMessage(message);
            }, /Invalid message structure/);

            assert.isTrue(logWarnStub.calledOnce);
        });
    });

    describe('getName Method Tests', function () {
        it('should return "fonts" for any dataType', function () {
            const contract = new FontsDetectionContract(FontDataType.V1_ONLY, [['Arial'], []]);
            assert.equal(contract.getName(), 'fonts');
        });
    });
});