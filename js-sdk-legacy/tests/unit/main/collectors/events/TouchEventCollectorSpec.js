import { assert } from 'chai';
import TouchEventCollector, { TouchEventType } from '../../../../../src/main/collectors/events/TouchEventCollector';
import CDUtils from '../../../../../src/main/technicalServices/CDUtils';
import { EventStructure as TouchEventStructure } from '../../../../../src/main/collectors/events/TouchEventCollector';
import MessageBus from '../../../../../src/main/technicalServices/MessageBus';
import DataQ from '../../../../../src/main/technicalServices/DataQ';
import ElementsCollector from '../../../../../src/main/collectors/events/ElementsCollector';
import BrowserContext from '../../../../../src/main/core/browsercontexts/BrowserContext';
import sinon from "sinon";
import StartupConfigurations from "../../../../../src/main/api/StartupConfigurations";

describe('TouchEvents tests:', function () {
    let maskingServiceStub;

    beforeEach(function () {
        maskingServiceStub = {
            maskAbsoluteIfRequired: sinon.stub().returnsArg(0),
            maskText: sinon.stub().returns('maskingServiceStub.maskText.mock'),
            _shouldMask: sinon.stub().returnsArg(0),
            shouldMaskCoordinates: sinon.stub().returns(false)
        };

        this.sandbox = sinon.createSandbox();
        this._browserContext = new BrowserContext(self);

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
        it('initialize TouchEventCollector events module', function () {
            const touchEvents = new TouchEventCollector(CDUtils, this.elementsStub, this.dataQStub, this.messageBusStub, maskingServiceStub, this.startupConfigurations);
            touchEvents.startFeature(this._browserContext);

            assert.isTrue(this.dataQStub.addToQueue.notCalled, 'addToQueue was called although it should not');

            assert.isTrue(typeof touchEvents !== 'undefined' && touchEvents != null, 'TouchEvents object was not created');
            touchEvents.stopFeature(this._browserContext);
        });

        it('stop TouchEvents events module without starting', function () {
            const touchEvents = new TouchEventCollector(CDUtils, this.elementsStub, this.dataQStub, this.messageBusStub, maskingServiceStub, this.startupConfigurations);

            touchEvents.stopFeature(this._browserContext);
        });
    });

    describe('Should execute events:', function () {
        it('should call onTouchEvents for touch events ', function () {
            maskingServiceStub.shouldMaskCoordinates = sinon.stub().returns(false);
            const touchEvents = new TouchEventCollector(CDUtils, this.elementsStub, this.dataQStub, this.messageBusStub, maskingServiceStub, this.startupConfigurations);
            touchEvents.startFeature(this._browserContext);

            const point = { x: 10, y: 10 };
            const TouchList = [{
                target: 1234,
                identifier: Date.now() + 1,
                pageX: point.x,
                pageY: point.y,
                screenX: point.x,
                screenY: point.y,
                clientX: point.x,
                clientY: point.y,
                force: 0.8,
            }];
            const eventObj = {
                altKey: false,
                bubbles: true,
                cancelBubble: false,
                cancelable: true,
                changedTouches: TouchList,
                ctrlKey: false,
                currentTarget: document,
                defaultPrevented: false,
                detail: 0,
                eventPhase: 2,
                isTrusted: false,
                metaKey: false,
                returnValue: true,
                shiftKey: false,
                sourceCapabilities: null,
                srcElement: document,
                target: document,
                targetTouches: TouchList,
                timeStamp: 18.2003,
                touches: TouchList,
                type: 'touchstart',
                view: null,
                which: 0,
            };

            touchEvents._onAllBrowsersTouchEvent(eventObj);

            assert.equal(this.dataQStub.addToQueue.callCount, 1, 'addToQueue was not called on touchstart');
            let lastCall = this.dataQStub.addToQueue.getCall(0);
            let data = lastCall.args[1];
            assert.equal(lastCall.args[0], 'touch_events', 'expected to dispatch touch_events');
            assert.equal(data.length, TouchEventStructure.length + 1, 'is touch event ok?');
            assert.equal(data[TouchEventStructure.indexOf('eventType') + 1], TouchEventType.touchstart, 'event type is not touchstart');
            assert.equal(data[TouchEventStructure.indexOf('isTrusted') + 1], false, 'is trusted is not right');
            assert.equal(data[TouchEventStructure.indexOf('clientX') + 1], 10, 'x is not right');
            assert.equal(data[TouchEventStructure.indexOf('clientY') + 1], 10, 'y is not right');
            assert.equal(data[TouchEventStructure.indexOf('touchPressure') + 1], 0.8, 'force is not right');
            const ts = CDUtils.cutDecimalPointDigits(eventObj.timeStamp, 3);
            assert.equal(data[TouchEventStructure.indexOf('relativeTime') + 1], ts, 'relativeTime is not right');

            eventObj.type = 'touchmove';
            touchEvents._onAllBrowsersTouchEvent(eventObj);
            assert.equal(this.dataQStub.addToQueue.callCount, 2, 'addToQueue was not called on touchmove');
            lastCall = this.dataQStub.addToQueue.getCall(1);
            data = lastCall.args[1];
            assert.equal(lastCall.args[0], 'touch_events', 'expected to dispatch touch_events');
            assert.equal(data[TouchEventStructure.indexOf('eventType') + 1], TouchEventType.touchmove, 'event type is not touchmove');
            assert.equal(data[TouchEventStructure.indexOf('isTrusted') + 1], false, 'is trusted is not right');
            assert.equal(data[TouchEventStructure.indexOf('clientX') + 1], 10, 'x is not right');
            assert.equal(data[TouchEventStructure.indexOf('clientY') + 1], 10, 'y is not right');
            assert.equal(data[TouchEventStructure.indexOf('relativeTime') + 1], ts, 'relativeTime is not right');

            eventObj.type = 'touchend';
            touchEvents._onAllBrowsersTouchEvent(eventObj);
            assert.equal(this.dataQStub.addToQueue.callCount, 3, 'addToQueue was not called on touchend');
            lastCall = this.dataQStub.addToQueue.getCall(2);
            data = lastCall.args[1];
            assert.equal(lastCall.args[0], 'touch_events', 'expected to dispatch touch_events');
            assert.equal(data[TouchEventStructure.indexOf('eventType') + 1], TouchEventType.touchend, 'event type is not touchend');
            assert.equal(data[TouchEventStructure.indexOf('isTrusted') + 1], false, 'is trusted is not right');
            assert.equal(data[TouchEventStructure.indexOf('clientX') + 1], 10, 'x is not right');
            assert.equal(data[TouchEventStructure.indexOf('clientY') + 1], 10, 'y is not right');
            assert.equal(data[TouchEventStructure.indexOf('relativeTime') + 1], ts, 'relativeTime is not right');

            eventObj.type = 'touchcancel';
            touchEvents._onAllBrowsersTouchEvent(eventObj);
            assert.equal(this.dataQStub.addToQueue.callCount, 4, 'addToQueue was not called on touchcancel');
            lastCall = this.dataQStub.addToQueue.getCall(3);
            data = lastCall.args[1];
            assert.equal(lastCall.args[0], 'touch_events', 'expected to dispatch touch_events');
            assert.equal(data[TouchEventStructure.indexOf('eventType') + 1], TouchEventType.touchcancel, 'event type is not touchcancel');
            assert.equal(data[TouchEventStructure.indexOf('isTrusted') + 1], false, 'is trusted is not right');
            assert.equal(data[TouchEventStructure.indexOf('clientX') + 1], 10, 'x is not right');
            assert.equal(data[TouchEventStructure.indexOf('clientY') + 1], 10, 'y is not right');
            assert.equal(data[TouchEventStructure.indexOf('relativeTime') + 1], ts, 'relativeTime is not right');
            touchEvents.stopFeature(this._browserContext);
        });


        it('should mask touch events when coordinatesMasking enabled ', function () {
            maskingServiceStub.shouldMaskCoordinates = sinon.stub().returns(true);
            const touchEvents = new TouchEventCollector(CDUtils, this.elementsStub, this.dataQStub, this.messageBusStub, maskingServiceStub, this.startupConfigurations);
            touchEvents.startFeature(this._browserContext);

            const point = { x: 10, y: 10 };
            const TouchList = [{
                target: 1234,
                identifier: Date.now() + 1,
                pageX: point.x,
                pageY: point.y,
                screenX: point.x,
                screenY: point.y,
                clientX: point.x,
                clientY: point.y,
                force: 0.8,
            }];
            const eventObj = {
                altKey: false,
                bubbles: true,
                cancelBubble: false,
                cancelable: true,
                changedTouches: TouchList,
                ctrlKey: false,
                currentTarget: document,
                defaultPrevented: false,
                detail: 0,
                eventPhase: 2,
                isTrusted: false,
                metaKey: false,
                returnValue: true,
                shiftKey: false,
                sourceCapabilities: null,
                srcElement: document,
                target: document,
                targetTouches: TouchList,
                timeStamp: 18.2003,
                touches: TouchList,
                type: 'touchstart',
                view: null,
                which: 0,
            };

            touchEvents._onAllBrowsersTouchEvent(eventObj);

            assert.equal(this.dataQStub.addToQueue.callCount, 1, 'addToQueue was not called on touchstart');
            let lastCall = this.dataQStub.addToQueue.getCall(0);
            let data = lastCall.args[1];
            assert.equal(lastCall.args[0], 'touch_events', 'expected to dispatch touch_events');
            assert.equal(data.length, TouchEventStructure.length + 1, 'is touch event ok?');
            assert.equal(data[TouchEventStructure.indexOf('clientX') + 1], -1000, 'clientX was not masked');
            assert.equal(data[TouchEventStructure.indexOf('clientY') + 1], -1000, 'clientY was not masked');
            assert.equal(data[TouchEventStructure.indexOf('pageX') + 1], -1000, 'pageX was not masked');
            assert.equal(data[TouchEventStructure.indexOf('pageY') + 1], -1000, 'pageY was not masked');
            assert.equal(data[TouchEventStructure.indexOf('screenX') + 1], -1000, 'screenX was not masked');
            assert.equal(data[TouchEventStructure.indexOf('screenY') + 1], -1000, 'screenY was not masked');

            touchEvents.stopFeature(this._browserContext);
        });
    });
});
