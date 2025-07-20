import { assert } from 'chai';
import HeartBeatErrorsState from '../../../../src/main/core/state/HeartBeatErrorsState';
import HeartBeatService from '../../../../src/main/services/HeartBeatService';
import ConfigurationRepository from '../../../../src/main/core/configuration/ConfigurationRepository';
import WorkerCommunicator from '../../../../src/main/technicalServices/WorkerCommunicator';
import { ApiEventType } from '../../../../src/main/api/ApiEventType';
import { TestUtils } from '../../../TestUtils';
import TestBrowserUtils from '../../../TestBrowserUtils';

describe('HeartBeatService tests', function () {
    beforeEach(function () {
        // Safari 9 doesn't support spy om window.parent so tests fail
        if (TestBrowserUtils.isSafari(navigator.userAgent, 9)
            || TestBrowserUtils.isIE11(window.navigator.userAgent)) {
            this.skip();
            return;
        }

        this.sandbox = sinon.createSandbox();

        this.postMessageSpy = this.sandbox.spy(window, 'postMessage');
        this._heartBeatErrorsStateStub = this.sandbox.createStubInstance(HeartBeatErrorsState);
        this._workerCommunicator = this.sandbox.createStubInstance(WorkerCommunicator);
        this.clock = this.sandbox.useFakeTimers();
        this._heartBeatPostMessageInterval = 2000;
        this.heartBeatPostMessageService = new HeartBeatService(this._workerCommunicator, this._heartBeatErrorsStateStub, this._heartBeatPostMessageInterval);
    });

    afterEach(function () {
        if (this.heartBeatPostMessageService) {
            this.heartBeatPostMessageService.stop();
        }

        if (this.sandbox) {
            this.sandbox.restore();
        }
    });

    it('should listen to heartBeatStatus worker event', function () {
        assert.isTrue(this._workerCommunicator.addMessageListener.called, 'addMessageListener was not called');
    });

    it('should clear postMesssage interval on stop', function () {
        this.heartBeatPostMessageService.stop();
        this.clock.tick(this._heartBeatPostMessageInterval + 10);
        assert.isTrue(this.postMessageSpy.notCalled, 'postMessage was called');
    });

    it('should call post message ok periodic post message', async function () {
        this.heartBeatPostMessageService.start();
        this.clock.tick(this._heartBeatPostMessageInterval + 10);

        await TestUtils.waitForNoAssertion(() => {
            const args = this.postMessageSpy.getCall(0).args;
            assert.isTrue(this._heartBeatErrorsStateStub.hasErrors.called, 'hasErrors was not called');
            assert.isTrue(this.postMessageSpy.called, 'postMessage was not called');
            assert.equal(args[0].origin,'BC', 'was not sent with origin BC');
            assert.isTrue(this.postMessageSpy.calledWith(sinon.match({
                type: ApiEventType.HeartBeatEvent,
                data: 'Ok',
            }, window.location.href)), 'postMessage was not called');
        });
    });

    it('should call post message with errors periodic post message', async function () {
        this._heartBeatErrorsStateStub.hasErrors.returns(true);
        this._heartBeatErrorsStateStub.getErrors.returns(['ERROR(705)', 'ERROR(706)']);

        this.heartBeatPostMessageService.start();
        this.clock.tick(this._heartBeatPostMessageInterval + 10);

        await TestUtils.waitForNoAssertion(() => {
            const args = this.postMessageSpy.getCall(0).args;
            assert.isTrue(this._heartBeatErrorsStateStub.hasErrors.called, 'hasErrors was not called');
            assert.isTrue(this.postMessageSpy.called, 'postMessage was not called');
            assert.equal(args[0].origin,'BC', 'was not sent with origin BC');
            assert.isTrue(this.postMessageSpy.calledWith(sinon.match({
                type: ApiEventType.HeartBeatEvent,
                data: ['ERROR(705)', 'ERROR(706)'],
            }, window.location.href)), 'postMessage was not called');
        });
    });

    it('should not call post message before timeout', function () {
        this.heartBeatPostMessageService.start();
        assert.isTrue(this._heartBeatErrorsStateStub.hasErrors.notCalled, 'hasErrors was called');
        assert.isTrue(this.postMessageSpy.notCalled, 'postMessage was called');
    });

    it('should clear and setInterval with new configuration value', async function () {
        const newHeartBeatPostMessageInterval = 1000;
        const configurationRepositoryStub = sinon.createStubInstance(ConfigurationRepository);
        configurationRepositoryStub.get.returns(newHeartBeatPostMessageInterval);
        this.heartBeatPostMessageService.start();

        const firstPeriodicPostMessageIntervalId = this.heartBeatPostMessageService._periodicPostMessageIntervalId;
        this.heartBeatPostMessageService.updateConfig(configurationRepositoryStub);
        assert.notEqual(firstPeriodicPostMessageIntervalId, this.heartBeatPostMessageService._periodicPostMessageIntervalId, 'PeriodicPostMessageIntervalId was not changed');
        assert.equal(this.heartBeatPostMessageService._heartBeatPostMessageInterval, newHeartBeatPostMessageInterval, '_heartBeatPostMessageInterval was not changed');

        this.clock.tick(newHeartBeatPostMessageInterval + 10);

        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this._heartBeatErrorsStateStub.hasErrors.called, 'hasErrors was not called');
            assert.isTrue(this.postMessageSpy.called, 'postMessage was not called');
            assert.isTrue(this.postMessageSpy.calledWith(sinon.match({
                type: ApiEventType.HeartBeatEvent,
                data: 'Ok',
            }, window.location.href)), 'postMessage was not called');
        });
    });
});
