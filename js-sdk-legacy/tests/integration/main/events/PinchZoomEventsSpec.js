import { assert } from 'chai';
import { WorkerCommand } from '../../../../src/main/events/WorkerCommand';
import ConfigurationChanger from '../ConfigurationChanger';
import { TestUtils } from '../../../TestUtils';
import TestBrowserUtils from '../../../TestBrowserUtils';

describe('PinchZoomEvents tests:', function () {
    beforeEach(async function () {
        const isIE = !!document.documentMode;

        if (TestBrowserUtils.isIE11(window.navigator.userAgent) || typeof PointerEvent === 'undefined' || isIE) {
            this.skip();
            return;
        }

        const pinchZoomEvents = this.systemBootstrapper.getFeatureBuilder()._features.list.PinchZoomEvents.instance;

        this._updateFeatureConfigSpy = sinon.spy(pinchZoomEvents, 'updateFeatureConfig');

        ConfigurationChanger.change(this.systemBootstrapper, {
            isTouchEvents: false,
            isPinchZoomEvents: true,
        });

        // Wait for the configuration update to apply on the feature
        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this._updateFeatureConfigSpy.called, 'Pinch Zoom events updateFeatureConfig function was not called');
        });
    });

    afterEach(async function () {
        ConfigurationChanger.change(this.systemBootstrapper, {
            isPinchZoomEvents: false,
        });

        if (this._updateFeatureConfigSpy) {
            // Wait for the configuration update to apply on the feature
            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this._updateFeatureConfigSpy.called, 'Pinch Zoom events updateFeatureConfig function was not called');
            });

            this._updateFeatureConfigSpy.restore();
        }
    });

    it('PinchZoomEvents are sent to the worker', async function () {
        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

        const pointsStart = [
            {
                pointerId: 19,
                x: 149,
                y: 421,
                offsetX: 141,
                offsetY: 204,
                screenX: 149,
                screenY: 501,
                pressure: 0.14,
                timestamp: 429095.00000000000,
            },
            {
                pointerId: 20,
                x: 221,
                y: 337,
                offsetX: 214,
                offsetY: 120,
                screenX: 221,
                screenY: 417,
                pressure: 0.14,
                timestamp: 429126.00000000000,
            },
        ];
        const pointerDowns = [
            {
                altKey: false,
                button: 0,
                buttons: 1,
                cancelBubble: false,
                clientX: pointsStart[0].x,
                clientY: pointsStart[0].y,
                ctrlKey: false,
                fromElement: null,
                height: 0,
                isPrimary: true,
                metaKey: false,
                movementX: 0,
                movementY: 0,
                offsetX: pointsStart[0].offsetX,
                offsetY: pointsStart[0].offsetY,
                pointerId: 19,
                pointerType: 'touch',
                pressure: pointsStart[0].pressure,
                relatedTarget: null,
                returnValue: true,
                screenX: pointsStart[0].screenX,
                screenY: pointsStart[0].screenY,
                shiftKey: false,
                tangentialPressure: 0,
                tiltX: 0,
                tiltY: 0,
                toElement: document,
                twist: 0,
                width: 0,
                x: pointsStart[0].x,
                y: pointsStart[0].y,
            },
            {
                altKey: false,
                button: 0,
                buttons: 1,
                cancelBubble: false,
                clientX: pointsStart[1].x,
                clientY: pointsStart[1].y,
                ctrlKey: false,
                fromElement: null,
                height: 0,
                isPrimary: true,
                metaKey: false,
                movementX: 0,
                movementY: 0,
                offsetX: pointsStart[1].offsetX,
                offsetY: pointsStart[1].offsetY,
                pointerId: 20,
                pointerType: 'touch',
                pressure: pointsStart[1].pressure,
                relatedTarget: null,
                returnValue: true,
                screenX: pointsStart[1].screenX,
                screenY: pointsStart[1].screenY,
                shiftKey: false,
                tangentialPressure: 0,
                tiltX: 0,
                tiltY: 0,
                toElement: document,
                twist: 0,
                width: 0,
                x: pointsStart[1].x,
                y: pointsStart[1].y,
            },
        ];
        const pointerMoves = [
            {
                altKey: false,
                button: -1,
                buttons: 1,
                cancelBubble: false,
                clientX: pointsStart[0].x + 1,
                clientY: pointsStart[0].y - 1,
                ctrlKey: false,
                fromElement: null,
                height: 1,
                isPrimary: true,
                metaKey: false,
                movementX: 0,
                movementY: 0,
                offsetX: pointsStart[0].offsetX + 1,
                offsetY: pointsStart[0].offsetY - 1,
                pointerId: 1,
                pointerType: 'touch',
                pressure: pointsStart[0].pressure + parseFloat(0.01),
                relatedTarget: null,
                returnValue: true,
                screenX: pointsStart[0].screenX + 1,
                screenY: pointsStart[0].screenY - 1,
                shiftKey: false,
                tangentialPressure: 0,
                tiltX: 0,
                tiltY: 0,
                toElement: document,
                twist: 0,
                width: 1,
                x: pointsStart[0].x + 1,
                y: pointsStart[0].y - 1,
            },
            {
                altKey: false,
                button: -1,
                buttons: 1,
                cancelBubble: false,
                clientX: pointsStart[1].x - 1,
                clientY: pointsStart[1].y - 1,
                ctrlKey: false,
                fromElement: null,
                height: 1,
                isPrimary: true,
                metaKey: false,
                movementX: 0,
                movementY: 0,
                offsetX: pointsStart[1].offsetX,
                offsetY: pointsStart[1].offsetY,
                pointerId: 1,
                pointerType: 'touch',
                pressure: pointsStart[1].pressure,
                relatedTarget: null,
                returnValue: true,
                screenX: pointsStart[1].screenX,
                screenY: pointsStart[1].screenY,
                shiftKey: false,
                tangentialPressure: 0,
                tiltX: 0,
                tiltY: 0,
                toElement: document,
                twist: 0,
                width: 1,
                x: pointsStart[1].x,
                y: pointsStart[1].y,
            },
        ];

        // Send a pointer down event to start the pinch simulation
        const evt1 = new UIEvent('pointerdown', pointerDowns[0]);
        Object.assign(evt1, pointerDowns[0]);
        document.dispatchEvent(evt1);

        // Second touch is down
        const evt2 = new UIEvent('pointerdown', pointerDowns[1]);
        Object.assign(evt2, pointerDowns[1]);
        document.dispatchEvent(evt2);

        const evt3 = new UIEvent('pointermove', pointerMoves[0]);
        Object.assign(evt3, pointerMoves[0]);
        document.dispatchEvent(evt3);

        const evt4 = new UIEvent('pointermove', pointerMoves[1]);
        Object.assign(evt4, pointerMoves[1]);
        document.dispatchEvent(evt4);

        // Find the pinch event
        const pinchEvent = serverWorkerSendAsync.getCalls().find((item) => {
            return item.args[0] === WorkerCommand.sendDataCommand && item.args[1].eventName === 'pinch_events';
        });

        const pinchEventsList = serverWorkerSendAsync.getCalls().filter((item) => {
            return item.args[0] === WorkerCommand.sendDataCommand && item.args[1].eventName === 'pinch_events';
        });

        assert.isDefined(pinchEvent, 'Unable to find pinch events');
        assert.isNotNull(pinchEvent, 'Unable to find pinch events');
        assert.equal(pinchEventsList.length, 1); // Make sure we had only one pinch event.

        serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
    });
});
