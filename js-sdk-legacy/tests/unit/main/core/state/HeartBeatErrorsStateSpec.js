import { assert } from 'chai';
import HeartBeatEvent, { statusTypes } from '../../../../../src/main/events/HeartBeatEvent';
import { WorkerStatusCategoryType } from '../../../../../src/worker/WorkerStatusCategoryType';
import HeartBeatErrorsState from '../../../../../src/main/core/state/HeartBeatErrorsState';

describe('HeartBeatErrorsState tests', function () {
    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
        this.workerSystemStatusEventHandler = new HeartBeatErrorsState();
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    it('should not send new HeartBeatEvent on updateState call with error status twice', function () {
        this.workerSystemStatusEventHandler.updateState(new HeartBeatEvent(WorkerStatusCategoryType.ConfigurationReceived, statusTypes.Error));
        this.workerSystemStatusEventHandler.updateState(new HeartBeatEvent(WorkerStatusCategoryType.ConfigurationReceived, statusTypes.Error));
        assert.isTrue(this.workerSystemStatusEventHandler.errors[WorkerStatusCategoryType.ConfigurationReceived] === WorkerStatusCategoryType.ConfigurationReceived);
    });

    it('should send new HeartBeatEvent on updateState recovery for category', function () {
        this.workerSystemStatusEventHandler.updateState(new HeartBeatEvent(WorkerStatusCategoryType.ConfigurationReceived, statusTypes.Error));
        assert.isTrue(this.workerSystemStatusEventHandler.errors[WorkerStatusCategoryType.ConfigurationReceived] === WorkerStatusCategoryType.ConfigurationReceived);
        this.workerSystemStatusEventHandler.updateState(new HeartBeatEvent(WorkerStatusCategoryType.ConfigurationReceived, statusTypes.Ok));
        assert.isUndefined(this.workerSystemStatusEventHandler.errors[WorkerStatusCategoryType.ConfigurationReceived]);
    });

    it('should send HeartBeat event for each updateState error with different category', function () {
        this.workerSystemStatusEventHandler.updateState(new HeartBeatEvent(WorkerStatusCategoryType.ConfigurationReceived, statusTypes.Error));
        this.workerSystemStatusEventHandler.updateState(new HeartBeatEvent(WorkerStatusCategoryType.WupServerResponse, statusTypes.Error));
        assert.isTrue(this.workerSystemStatusEventHandler.errors[WorkerStatusCategoryType.ConfigurationReceived] === WorkerStatusCategoryType.ConfigurationReceived);
        assert.isTrue(this.workerSystemStatusEventHandler.errors[WorkerStatusCategoryType.WupServerResponse] === WorkerStatusCategoryType.WupServerResponse);
    });

    it('should recognize new error', function () {
        assert.isTrue(this.workerSystemStatusEventHandler._isNewError(WorkerStatusCategoryType.ConfigurationReceived, statusTypes.Error));
        assert.isFalse(this.workerSystemStatusEventHandler._isNewError(WorkerStatusCategoryType.ConfigurationReceived, statusTypes.Ok));
    });

    it('should return false for exist error', function () {
        this.workerSystemStatusEventHandler.updateState(new HeartBeatEvent(WorkerStatusCategoryType.ConfigurationReceived, statusTypes.Error));
        assert.isTrue(this.workerSystemStatusEventHandler.errors[WorkerStatusCategoryType.ConfigurationReceived] === WorkerStatusCategoryType.ConfigurationReceived);
        assert.isFalse(this.workerSystemStatusEventHandler._isNewError(WorkerStatusCategoryType.ConfigurationReceived, statusTypes.Error));
    });

    it('should recognize error recovery', function () {
        this.workerSystemStatusEventHandler.updateState(new HeartBeatEvent(WorkerStatusCategoryType.ConfigurationReceived, statusTypes.Error));
        assert.isTrue(this.workerSystemStatusEventHandler.errors[WorkerStatusCategoryType.ConfigurationReceived] === WorkerStatusCategoryType.ConfigurationReceived);
        assert.isTrue(this.workerSystemStatusEventHandler._isErrorRecovery(WorkerStatusCategoryType.ConfigurationReceived, statusTypes.Ok));
        assert.isFalse(this.workerSystemStatusEventHandler._isErrorRecovery(WorkerStatusCategoryType.ConfigurationReceived, statusTypes.Error));
    });

    it('should return empty list on getErrors call', function () {
        assert.deepEqual(this.workerSystemStatusEventHandler.getErrors(), []);
    });

    it('should return errors object keys on getErrors call', function () {
        this.workerSystemStatusEventHandler.updateState(new HeartBeatEvent(WorkerStatusCategoryType.ConfigurationReceived, statusTypes.Error));
        this.workerSystemStatusEventHandler.updateState(new HeartBeatEvent(WorkerStatusCategoryType.WupServerResponse, statusTypes.Error));
        assert.deepEqual(this.workerSystemStatusEventHandler.getErrors(), [`ERROR(${WorkerStatusCategoryType.ConfigurationReceived})`, `ERROR(${WorkerStatusCategoryType.WupServerResponse})`]);
    });

    it('should return false on hasErrors call', function () {
        assert.isFalse(this.workerSystemStatusEventHandler.hasErrors());
    });

    it('should return true on hasErrors call', function () {
        this.workerSystemStatusEventHandler.updateState(new HeartBeatEvent(WorkerStatusCategoryType.ConfigurationReceived, statusTypes.Error));
        this.workerSystemStatusEventHandler.updateState(new HeartBeatEvent(WorkerStatusCategoryType.WupServerResponse, statusTypes.Error));
        assert.isTrue(this.workerSystemStatusEventHandler.hasErrors());
    });
});
