import { assert } from 'chai';
import { MouseEventType } from '../../../../src/main/collectors/events/MouseEventCollector';
import { WorkerCommand } from '../../../../src/main/events/WorkerCommand';
import { EventStructure as MouseEventStructure } from '../../../../src/main/collectors/events/MouseEventCollector';
import ConfigurationChanger from '../ConfigurationChanger';
import { TestUtils } from '../../../TestUtils';
import TestEvents from '../../../TestEvents';
import TestBrowserUtils from '../../../TestBrowserUtils';

describe('MouseEvents tests:', function () {
    beforeEach(function () {
        const mouseEvents = this.systemBootstrapper.getFeatureBuilder()._features.list.MouseEvents.instance;

        this._updateFeatureConfigSpy = sinon.spy(mouseEvents, 'updateFeatureConfig');
    });

    afterEach(function () {
        if (this._updateFeatureConfigSpy) {
            this._updateFeatureConfigSpy.restore();
        }
    });

    it('MouseEvents are sent to the worker', async function () {
        // Modify the configuration before the scenario
        ConfigurationChanger.change(this.systemBootstrapper, {
            isMouseEvents: true,
        });

        // Wait for the configuration update to apply on the feature
        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this._updateFeatureConfigSpy.called, 'Mouse events updateFeatureConfig function was not called');
        });

        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

        const input = document.getElementById('txt1');
        input.click();
        assert.equal(WorkerCommand.sendDataCommand, serverWorkerSendAsync.lastCall.args[0], 'msg is data from main failed');
        assert.equal('mouse_events', serverWorkerSendAsync.lastCall.args[1].eventName, 'eventName is not mouse_events');
        let lastCallDataArr = serverWorkerSendAsync.lastCall.args[1].data;
        assert.equal(lastCallDataArr[MouseEventStructure.indexOf('eventType') + 1],
            MouseEventType.click, 'check event type failed');

        const isIE = !!document.documentMode;
        if (!isIE) {
            TestEvents.publishMouseEvent('mousemove', 0, 0, 3, 3, 3, 3);

            assert.equal(WorkerCommand.sendDataCommand, serverWorkerSendAsync.lastCall.args[0], 'msg is data from main failed');
            assert.equal('mouse_events', serverWorkerSendAsync.lastCall.args[1].eventName, 'eventName is not mouse_events');
            lastCallDataArr = serverWorkerSendAsync.lastCall.args[1].data;
            assert.equal(lastCallDataArr[MouseEventStructure.indexOf('eventType') + 1],
                MouseEventType.mousemove, 'event type is not mousemove');

            if (!TestBrowserUtils.isEdge(window.navigator.userAgent) && !TestBrowserUtils.isIE11(window.navigator.userAgent)) {
                TestEvents.publishMouseEvent('mouseleave', 0, 0, 55, 3, 3, 3);

                assert.equal(WorkerCommand.sendDataCommand, serverWorkerSendAsync.lastCall.args[0]);
                assert.equal('mouse_events', serverWorkerSendAsync.lastCall.args[1].eventName, 'eventName is not mouse_events');
                lastCallDataArr = serverWorkerSendAsync.lastCall.args[1].data;
                assert.equal(lastCallDataArr[MouseEventStructure.indexOf('eventType') + 1],
                    MouseEventType.mouseleave, 'event type is not mouseleave');
            }
            TestEvents.publishMouseEvent('mousedown', 1, 0, 55, 3, 3, 3, 42, 41);

            assert.equal(WorkerCommand.sendDataCommand, serverWorkerSendAsync.lastCall.args[0]);
            assert.equal('mouse_events', serverWorkerSendAsync.lastCall.args[1].eventName, 'eventName is not mouse_events');
            lastCallDataArr = serverWorkerSendAsync.lastCall.args[1].data;
            assert.equal(lastCallDataArr[MouseEventStructure.indexOf('eventType') + 1],
                MouseEventType.mousedown, 'event type is not mousedown');

            TestEvents.publishMouseEvent('mouseup', 2, 0, 55, 3, 3, 3, 42, 13);

            assert.equal(WorkerCommand.sendDataCommand, serverWorkerSendAsync.lastCall.args[0]);
            assert.equal('mouse_events', serverWorkerSendAsync.lastCall.args[1].eventName, 'eventName is not mouse_events');
            lastCallDataArr = serverWorkerSendAsync.lastCall.args[1].data;
            assert.equal(lastCallDataArr[MouseEventStructure.indexOf('eventType') + 1],
                MouseEventType.mouseup, 'event type is not mouseup');

            TestEvents.publishMouseEvent('wheel', 1, 0, 55, 3, 3, 3, 42, 13, 3, 3, 52);

            assert.equal(WorkerCommand.sendDataCommand, serverWorkerSendAsync.lastCall.args[0]);
            assert.equal('mouse_events', serverWorkerSendAsync.lastCall.args[1].eventName, 'eventName is not mouse_events');
            lastCallDataArr = serverWorkerSendAsync.lastCall.args[1].data;
            assert.equal(lastCallDataArr[MouseEventStructure.indexOf('eventType') + 1],
                MouseEventType.wheel, 'event type is not wheel');

            TestEvents.publishMouseEvent('dblclick', 0, 0, 55, 14, 3, 3, 42, 13);

            assert.equal(WorkerCommand.sendDataCommand, serverWorkerSendAsync.lastCall.args[0]);
            assert.equal('mouse_events', serverWorkerSendAsync.lastCall.args[1].eventName, 'eventName is not mouse_events');
            lastCallDataArr = serverWorkerSendAsync.lastCall.args[1].data;
            assert.equal(lastCallDataArr[MouseEventStructure.indexOf('eventType') + 1],
                MouseEventType.dblclick, 'event type is not dblclick');
            assert.equal(lastCallDataArr[0], this.systemBootstrapper.getContextMgr().contextHash, 'context id is not as expected');
            assert.equal(lastCallDataArr.length, MouseEventStructure.length + 1, 'mouse wrong data length');
        }

        serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
    });
});
