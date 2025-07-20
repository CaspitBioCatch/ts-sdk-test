import { assert } from 'chai';
import PinchZoomEventCollector from '../../../../../src/main/collectors/events/PinchZoomEventCollector';
import CDUtils from '../../../../../src/main/technicalServices/CDUtils';
import MessageBus from '../../../../../src/main/technicalServices/MessageBus';
import DataQ from '../../../../../src/main/technicalServices/DataQ';
import ElementsCollector from '../../../../../src/main/collectors/events/ElementsCollector';
import BrowserContext from '../../../../../src/main/core/browsercontexts/BrowserContext';
import sinon from "sinon";
import StartupConfigurations from "../../../../../src/main/api/StartupConfigurations";

describe('PinchZoomEventCollector tests:', function () {
    let maskingServiceStub;

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
        this._browserContext = new BrowserContext(self);
        maskingServiceStub = {
            maskAbsoluteIfRequired: sinon.stub().returnsArg(0),
            maskText: sinon.stub().returns('maskingServiceStub.maskText.mock'),
            _shouldMask: sinon.stub().returnsArg(0)
        };


        this.dataQStub = this.sandbox.createStubInstance(DataQ);
        this.messageBusStub = this.sandbox.createStubInstance(MessageBus);
        this.elementsStub = this.sandbox.createStubInstance(ElementsCollector);
        this.elementsStub.getElement.returns(32);
        this.elementsStub.isListed.returns(false);
        this.elementsStub._maskingService = maskingServiceStub
        this.startupConfigurations = this.sandbox.createStubInstance(StartupConfigurations);
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    describe('constructor tests:', function () {
        it('initialize PinchZoomEvents events module', function () {
            const pinchZoomEvents = new PinchZoomEventCollector(CDUtils, this.elementsStub, this.dataQStub, this.messageBusStub, this.startupConfigurations);
            pinchZoomEvents.startFeature(this._browserContext);

            assert.isTrue(this.dataQStub.addToQueue.notCalled, 'addToQueue was called although it should not');

            assert.isTrue(typeof pinchZoomEvents !== 'undefined' && pinchZoomEvents != null, 'PinchZoomEvents object was not created');
            pinchZoomEvents.stopFeature(this._browserContext);
        });

        it('stop PinchZoomEvents events module without starting', function () {
            const pinchZoomEvents = new PinchZoomEventCollector(CDUtils, this.elementsStub, this.dataQStub, this.messageBusStub, this.startupConfigurations);

            pinchZoomEvents.stopFeature(this._browserContext);
        });
    });

    describe('Should execute events:', function () {
        it('should call onPinchZoomEvents for pinch/zoom events ', function () {
            const pinchZoomEvents = new PinchZoomEventCollector(CDUtils, this.elementsStub, this.dataQStub, this.messageBusStub, this.startupConfigurations);
            pinchZoomEvents.startFeature(this._browserContext);

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
                    bubbles: true,
                    button: 0,
                    buttons: 1,
                    cancelBubble: false,
                    cancelable: true,
                    clientX: pointsStart[0].x,
                    clientY: pointsStart[0].y,
                    composed: true,
                    ctrlKey: false,
                    currentTarget: null,
                    defaultPrevented: false,
                    detail: 0,
                    eventPhase: 0,
                    fromElement: null,
                    height: 0,
                    isPrimary: true,
                    isTrusted: true,
                    layerX: pointsStart[0].x,
                    layerY: pointsStart[0].y,
                    metaKey: false,
                    movementX: 0,
                    movementY: 0,
                    offsetX: pointsStart[0].offsetX,
                    offsetY: pointsStart[0].offsetY,
                    pageX: pointsStart[0].x,
                    pageY: pointsStart[0].y,
                    path: null,
                    pointerId: 19,
                    pointerType: 'touch',
                    pressure: pointsStart[0].pressure,
                    relatedTarget: null,
                    returnValue: true,
                    screenX: pointsStart[0].screenX,
                    screenY: pointsStart[0].screenY,
                    shiftKey: false,
                    sourceCapabilities: null,
                    srcElement: document,
                    tangentialPressure: 0,
                    target: document,
                    tiltX: 0,
                    tiltY: 0,
                    timeStamp: pointsStart[0].timestamp,
                    toElement: document,
                    twist: 0,
                    type: 'pointerdown',
                    view: null,
                    which: 1,
                    width: 0,
                    x: pointsStart[0].x,
                    y: pointsStart[0].y,
                },
                {
                    altKey: false,
                    bubbles: true,
                    button: 0,
                    buttons: 1,
                    cancelBubble: false,
                    cancelable: true,
                    clientX: pointsStart[1].x,
                    clientY: pointsStart[1].y,
                    composed: true,
                    ctrlKey: false,
                    currentTarget: null,
                    defaultPrevented: false,
                    detail: 0,
                    eventPhase: 0,
                    fromElement: null,
                    height: 0,
                    isPrimary: true,
                    isTrusted: true,
                    layerX: pointsStart[1].x,
                    layerY: pointsStart[1].y,
                    metaKey: false,
                    movementX: 0,
                    movementY: 0,
                    offsetX: pointsStart[1].offsetX,
                    offsetY: pointsStart[1].offsetY,
                    pageX: pointsStart[1].x,
                    pageY: pointsStart[1].y,
                    path: null,
                    pointerId: 20,
                    pointerType: 'touch',
                    pressure: pointsStart[1].pressure,
                    relatedTarget: null,
                    returnValue: true,
                    screenX: pointsStart[1].screenX,
                    screenY: pointsStart[1].screenY,
                    shiftKey: false,
                    sourceCapabilities: null,
                    srcElement: document,
                    tangentialPressure: 0,
                    target: document,
                    tiltX: 0,
                    tiltY: 0,
                    timeStamp: pointsStart[1].timestamp,
                    toElement: document,
                    twist: 0,
                    type: 'pointerdown',
                    view: null,
                    which: 1,
                    width: 0,
                    x: pointsStart[1].x,
                    y: pointsStart[1].y,
                },
            ];
            const pointerMoves = [
                {
                    altKey: false,
                    bubbles: true,
                    button: -1,
                    buttons: 1,
                    cancelBubble: false,
                    cancelable: true,
                    clientX: pointsStart[0].x + 1,
                    clientY: pointsStart[0].y - 1,
                    composed: true,
                    ctrlKey: false,
                    currentTarget: null,
                    defaultPrevented: false,
                    detail: 0,
                    eventPhase: 0,
                    fromElement: null,
                    height: 1,
                    isPrimary: true,
                    isTrusted: true,
                    layerX: pointsStart[0].x + 1,
                    layerY: pointsStart[0].y - 1,
                    metaKey: false,
                    movementX: 0,
                    movementY: 0,
                    offsetX: pointsStart[0].offsetX + 1,
                    offsetY: pointsStart[0].offsetY - 1,
                    pageX: pointsStart[0].x + 1,
                    pageY: pointsStart[0].y - 1,
                    path: null,
                    pointerId: 1,
                    pointerType: 'touch',
                    pressure: pointsStart[0].pressure + parseFloat(0.01),
                    relatedTarget: null,
                    returnValue: true,
                    screenX: pointsStart[0].screenX + 1,
                    screenY: pointsStart[0].screenY - 1,
                    shiftKey: false,
                    sourceCapabilities: null,
                    srcElement: document,
                    tangentialPressure: 0,
                    target: document,
                    tiltX: 0,
                    tiltY: 0,
                    timeStamp: pointsStart[0].timestamp + 100,
                    toElement: document,
                    twist: 0,
                    type: 'pointermove',
                    view: null,
                    which: 1,
                    width: 1,
                    x: pointsStart[0].x + 1,
                    y: pointsStart[0].y - 1,
                },
                {
                    altKey: false,
                    bubbles: true,
                    button: -1,
                    buttons: 1,
                    cancelBubble: false,
                    cancelable: true,
                    clientX: pointsStart[1].x - 1,
                    clientY: pointsStart[1].y - 1,
                    composed: true,
                    ctrlKey: false,
                    currentTarget: null,
                    defaultPrevented: false,
                    detail: 0,
                    eventPhase: 0,
                    fromElement: null,
                    height: 1,
                    isPrimary: true,
                    isTrusted: true,
                    layerX: pointsStart[1].layerX,
                    layerY: pointsStart[1].layerY,
                    metaKey: false,
                    movementX: 0,
                    movementY: 0,
                    offsetX: pointsStart[1].offsetX,
                    offsetY: pointsStart[1].offsetY,
                    pageX: pointsStart[1].x - 1,
                    pageY: pointsStart[1].y - 1,
                    path: null,
                    pointerId: 1,
                    pointerType: 'touch',
                    pressure: pointsStart[1].pressure,
                    relatedTarget: null,
                    returnValue: true,
                    screenX: pointsStart[1].screenX,
                    screenY: pointsStart[1].screenY,
                    shiftKey: false,
                    sourceCapabilities: null,
                    srcElement: document,
                    tangentialPressure: 0,
                    target: document,
                    tiltX: 0,
                    tiltY: 0,
                    timeStamp: pointsStart[1].timestamp + 100,
                    toElement: document,
                    twist: 0,
                    type: 'pointermove',
                    view: null,
                    which: 1,
                    width: 1,
                    x: pointsStart[1].x,
                    y: pointsStart[1].y,
                },
            ];

            pinchZoomEvents._onAllBrowsersPinchZoomEvent(pointerDowns[0]);
            pinchZoomEvents._onAllBrowsersPinchZoomEvent(pointerDowns[1]);
            pinchZoomEvents._onAllBrowsersPinchZoomEvent(pointerMoves[0]);
            pinchZoomEvents._onAllBrowsersPinchZoomEvent(pointerMoves[1]);

            assert.equal(this.dataQStub.addToQueue.callCount, 1, 'addToQueue was not called on pointermove');
            const lastCall = this.dataQStub.addToQueue.getCall(0);
            assert.equal(lastCall.args[0], 'pinch_events', 'expected to dispatch pinch_events');

            pinchZoomEvents.stopFeature(this._browserContext);
        });
    });
});
