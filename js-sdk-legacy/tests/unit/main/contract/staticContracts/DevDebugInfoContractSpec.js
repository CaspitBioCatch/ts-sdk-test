import { assert } from 'chai';
import sinon from 'sinon';
import DevDebugFeature, { DevDebugDataSource } from '../../../../../src/main/collectors/static/EncryptedMuidFeature';
import DevDebugInfoContract from "../../../../../src/main/contract/staticContracts/DevDebugInfoContract";

describe('DevDebugInfoContract', () => {
    it('should initialize correctly with valid data', () => {
        const data = { key1: "value1", key2: "value2" };
        const contract = new DevDebugInfoContract(data);
        assert.deepEqual(contract.data, data);
    });

    it('should throw an error if data is null', () => {
        assert.throws(() => new DevDebugInfoContract(null), /Invalid parameter: data should be a non-null object/);
    });

    it('should throw an error if data is an array', () => {
        assert.throws(() => new DevDebugInfoContract(["item1", "item2"]), /Invalid parameter: data should be a non-null object/);
    });

    it('should build a valid queue message', () => {
        const data = { key1: "value1", key2: "value2" };
        const contract = new DevDebugInfoContract(data);
        const message = contract.buildQueueMessage();
        assert.deepEqual(message, ["client_debug_info", data]);
    });

    it('should throw an error if message structure is invalid', () => {
        const data = { key1: "value1" };
        const contract = new DevDebugInfoContract(data);

        sinon.stub(contract, 'validateMessage').throws(new Error("Invalid message structure"));

        assert.throws(() => contract.buildQueueMessage(), /Invalid message structure/);
    });

    it('should validate parameters correctly', () => {
        assert.doesNotThrow(() => new DevDebugInfoContract({ key: "value" }));
        assert.throws(() => new DevDebugInfoContract(null), /Invalid parameter: data should be a non-null object/);
        assert.throws(() => new DevDebugInfoContract([]), /Invalid parameter: data should be a non-null object/);
    });

    it('should validate a correct message', () => {
        const data = { key1: "value1" };
        const contract = new DevDebugInfoContract(data);
        const message = ["client_debug_info", data];

        assert.doesNotThrow(() => contract.validateMessage(message));
    });

    it('should throw an error for an invalid message', () => {
        const data = { key1: "value1" };
        const contract = new DevDebugInfoContract(data);
        const invalidMessage = ["client_debug_info", null];

        assert.throws(() => contract.validateMessage(invalidMessage), /Message validation failed. Invalid message structure/);
    });

    it('should return the correct name', () => {
        const data = { key1: "value1" };
        const contract = new DevDebugInfoContract(data);
        assert.equal(contract.getName(), "client_debug_info");
    });
});