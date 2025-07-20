import { assert } from 'chai';
import ConfigurationRepository from '../../../../../src/main/core/configuration/ConfigurationRepository';
import TapEventCollector from '../../../../../src/main/collectors/events/TapEventCollector';
import CDUtils from '../../../../../src/main/technicalServices/CDUtils';
import { TapEventStructure, LongPressEventStructure } from '../../../../../src/main/collectors/events/TapEventCollector';
import DataQ from '../../../../../src/main/technicalServices/DataQ';
import ElementsCollector from '../../../../../src/main/collectors/events/ElementsCollector';
import BrowserContext from '../../../../../src/main/core/browsercontexts/BrowserContext';
import sinon from "sinon";
import StartupConfigurations from "../../../../../src/main/api/StartupConfigurations";

describe('TapEventCollector tests:', function () {
    let sandbox = null;
    let maskingServiceStub;

    beforeEach(function () {
        sandbox = sinon.createSandbox();

        maskingServiceStub = {
            maskAbsoluteIfRequired: sinon.stub().returnsArg(0),
            maskText: sinon.stub().returns('maskingServiceStub.maskText.mock'),
            _shouldMask: sinon.stub().returnsArg(0),
            shouldMaskCoordinates: sinon.stub().returns(false)
        };

        this.configurationRepository = sinon.stub(new ConfigurationRepository());
        this.dataQ = sinon.createStubInstance(DataQ);
        this.elementsStub = sinon.createStubInstance(ElementsCollector);
        this.elementsStub.getElementHashFromEvent.returns(32);
        this.elementsStub.isListed.returns(false);
        this.elementsStub._maskingService = maskingServiceStub;
        this._browserContext = new BrowserContext(self);
        this.startupConfigurations = sandbox.createStubInstance(StartupConfigurations);

        this.tapEvents = new TapEventCollector(
            this.configurationRepository,
            CDUtils,
            this.elementsStub,
            this.dataQ,
            maskingServiceStub,
            this.startupConfigurations);

        // So we can control the timestamp
        this.datenow = sinon.stub(this.tapEvents, 'getEventTimestamp');
        this.datenow.returns(Date.now());
    });

    afterEach(function () {
        sandbox.restore();
        this.dataQ.addToQueue.resetHistory();
        this.datenow.restore();
    });

    function createDefaultTouchEventArgs(eventType, touchList) {
        return {
            altKey: false,
            bubbles: true,
            cancelBubble: false,
            cancelable: true,
            changedTouches: touchList,
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
            targetTouches: touchList,
            timeStamp: 18.2003,
            touches: touchList,
            type: eventType,
            view: null,
            which: 0,
        };
    }

    it('Should send tap event', function () {
        this.tapEvents.startFeature(this._browserContext);

        const point = { x: 10, y: 10 };
        const touchList = [{
            target: 9876,
            identifier: Date.now() + 1,
            pageX: point.x,
            pageY: point.y,
            screenX: point.x,
            screenY: point.y,
            clientX: point.x,
            clientY: point.y,
        }];

        const eventObj = createDefaultTouchEventArgs('touchstart', touchList);

        this.datenow.returns(12345678987654321);

        this.tapEvents._handleStartEvent(eventObj);

        eventObj.type = 'touchend';
        this.tapEvents._handleEndEvent(eventObj);

        assert.equal(this.dataQ.addToQueue.callCount, 1, 'addToQueue was not called on touchend');
        const lastCall = this.dataQ.addToQueue.getCall(0);
        const data = lastCall.args[1];
        assert.equal(lastCall.args[0], 'tap_events', 'expected to dispatch touch_events');
        assert.equal(data[TapEventStructure.indexOf('timestamp') + 1], 12345678987654321, 'timestamp is not right');
        assert.equal(data[TapEventStructure.indexOf('isTrusted') + 1], false, 'is trusted is not right');
        assert.equal(data[TapEventStructure.indexOf('elementHash') + 1], 32, 'elementHash is not right');
        assert.equal(data[TapEventStructure.indexOf('clientX') + 1], point.x, 'clientX is not right');
        assert.equal(data[TapEventStructure.indexOf('clientY') + 1], point.y, 'clientY is not right');
        assert.equal(data[TapEventStructure.indexOf('touchIndex') + 1], touchList[0].identifier % 10000, 'touchIndex is not right');
        assert.equal(data[TapEventStructure.indexOf('touchSizeMajor') + 1], 0, 'touchSizeMajor is not right');
        assert.equal(data[TapEventStructure.indexOf('touchSizeMinor') + 1], 0, 'touchSizeMinor is not right');
        assert.equal(data[TapEventStructure.indexOf('pageX') + 1], point.y, 'pageX is not right');
        assert.equal(data[TapEventStructure.indexOf('pageY') + 1], point.y, 'pageY is not right');
        assert.equal(data[TapEventStructure.indexOf('screenX') + 1], point.y, 'screenX is not right');
        assert.equal(data[TapEventStructure.indexOf('screenY') + 1], point.y, 'screenY is not right');

        this.tapEvents.stopFeature(this._browserContext);
    });

    it('Should send tap event with masking', function () {
        maskingServiceStub.shouldMaskCoordinates = sinon.stub().returns(true);

        this.tapEvents.startFeature(this._browserContext);

        const point = { x: 10, y: 10 };
        const touchList = [{
            target: 9876,
            identifier: Date.now() + 1,
            pageX: point.x,
            pageY: point.y,
            screenX: point.x,
            screenY: point.y,
            clientX: point.x,
            clientY: point.y,
        }];

        const eventObj = createDefaultTouchEventArgs('touchstart', touchList);

        this.datenow.returns(12345678987654321);

        this.tapEvents._handleStartEvent(eventObj);

        eventObj.type = 'touchend';
        this.tapEvents._handleEndEvent(eventObj);

        assert.equal(this.dataQ.addToQueue.callCount, 1, 'addToQueue was not called on touchend');
        const lastCall = this.dataQ.addToQueue.getCall(0);
        const data = lastCall.args[1];
        assert.equal(data[TapEventStructure.indexOf('clientX') + 1], -1000, 'clientX was not masked');
        assert.equal(data[TapEventStructure.indexOf('clientY') + 1], -1000, 'clientY was not masked');
        assert.equal(data[TapEventStructure.indexOf('pageX') + 1], -1000, 'pageX was not masked');
        assert.equal(data[TapEventStructure.indexOf('pageY') + 1], -1000, 'pageY was not masked');
        assert.equal(data[TapEventStructure.indexOf('screenX') + 1], -1000, 'screenX was not masked');
        assert.equal(data[TapEventStructure.indexOf('screenY') + 1], -1000, 'screenY was not masked');

        this.tapEvents.stopFeature(this._browserContext);
    });

    it('Should send tap event if slop is under the max allowed', function () {
        this.tapEvents.startFeature(this._browserContext);

        let point = { x: 99, y: 88 };
        let touchList = [{
            target: 9876,
            identifier: Date.now() + 1,
            pageX: point.x,
            pageY: point.y,
            screenX: point.x,
            screenY: point.y,
            clientX: point.x,
            clientY: point.y,
        }];

        const eventObj = createDefaultTouchEventArgs('touchstart', touchList);

        this.tapEvents._handleStartEvent(eventObj);

        eventObj.type = 'touchmove';
        point = { x: 118, y: 69 };
        touchList = [{
            target: 9876,
            identifier: touchList[0].identifier,
            pageX: point.x,
            pageY: point.y,
            screenX: point.x,
            screenY: point.y,
            clientX: point.x,
            clientY: point.y,
        }];
        eventObj.changedTouches = touchList;

        this.tapEvents._handleMoveEvent(eventObj);

        eventObj.type = 'touchend';
        this.tapEvents._handleEndEvent(eventObj);

        assert.equal(this.dataQ.addToQueue.callCount, 1, 'addToQueue was not called on touchend');
        const lastCall = this.dataQ.addToQueue.getCall(0);
        const data = lastCall.args[1];
        assert.equal(lastCall.args[0], 'tap_events', 'expected to dispatch touch_events');
        assert.equal(data[TapEventStructure.indexOf('isTrusted') + 1], false, 'is trusted is not right');
        assert.equal(data[TapEventStructure.indexOf('clientX') + 1], point.x, 'x is not right');
        assert.equal(data[TapEventStructure.indexOf('clientY') + 1], point.y, 'y is not right');

        this.tapEvents.stopFeature(this._browserContext);
    });

    it('Should not send a tap event if touch slop exceeded the max on the x axis', function () {
        this.tapEvents.startFeature(this._browserContext);

        let point = { x: 150, y: 200 };
        let touchList = [{
            target: 9876,
            identifier: Date.now() + 1,
            pageX: point.x,
            pageY: point.y,
            screenX: point.x,
            screenY: point.y,
            clientX: point.x,
            clientY: point.y,
        }];

        const eventObj = createDefaultTouchEventArgs('touchstart', touchList);

        this.tapEvents._handleStartEvent(eventObj);

        eventObj.type = 'touchmove';
        point = { x: 170, y: 181 };
        touchList = [{
            target: 9876,
            identifier: touchList[0].identifier,
            pageX: point.x,
            pageY: point.y,
            screenX: point.x,
            screenY: point.y,
            clientX: point.x,
            clientY: point.y,
        }];
        eventObj.changedTouches = touchList;

        this.tapEvents._handleMoveEvent(eventObj);

        eventObj.type = 'touchend';
        this.tapEvents._handleEndEvent(eventObj);

        assert.equal(this.dataQ.addToQueue.callCount, 0, 'addToQueue was called on touchend');

        this.tapEvents.stopFeature(this._browserContext);
    });

    it('Should not send a tap event if touch slop exceeded the max on the y axis', function () {
        this.tapEvents.startFeature(this._browserContext);

        let point = { x: 150, y: 200 };
        let touchList = [{
            target: 9876,
            identifier: Date.now() + 1,
            pageX: point.x,
            pageY: point.y,
            screenX: point.x,
            screenY: point.y,
            clientX: point.x,
            clientY: point.y,
        }];

        const eventObj = createDefaultTouchEventArgs('touchstart', touchList);

        this.tapEvents._handleStartEvent(eventObj);

        eventObj.type = 'touchmove';
        point = { x: 169, y: 180 };
        touchList = [{
            target: 9876,
            identifier: touchList[0].identifier,
            pageX: point.x,
            pageY: point.y,
            screenX: point.x,
            screenY: point.y,
            clientX: point.x,
            clientY: point.y,
        }];
        eventObj.changedTouches = touchList;

        this.tapEvents._handleMoveEvent(eventObj);

        eventObj.type = 'touchend';
        this.tapEvents._handleEndEvent(eventObj);

        assert.equal(this.dataQ.addToQueue.callCount, 0, 'addToQueue was called on touchend');

        this.tapEvents.stopFeature(this._browserContext);
    });

    it('Should ignore touch move event if touch start was not received', function () {
        this.tapEvents.startFeature(this._browserContext);

        const point = { x: 10, y: 10 };
        const touchList = [{
            target: 9876,
            identifier: Date.now() + 1,
            pageX: point.x,
            pageY: point.y,
            screenX: point.x,
            screenY: point.y,
            clientX: point.x,
            clientY: point.y,
        }];

        const eventObj = createDefaultTouchEventArgs('touchmove', touchList);

        this.datenow.returns(12345678987654321);

        eventObj.type = 'touchmove';
        this.tapEvents._handleMoveEvent(eventObj);
        this.tapEvents.stopFeature(this._browserContext);
    });

    it('Should ignore touch end event if touch start was not received', function () {
        this.tapEvents.startFeature(this._browserContext);

        const point = { x: 10, y: 10 };
        const touchList = [{
            target: 9876,
            identifier: Date.now() + 1,
            pageX: point.x,
            pageY: point.y,
            screenX: point.x,
            screenY: point.y,
            clientX: point.x,
            clientY: point.y,
        }];

        const eventObj = createDefaultTouchEventArgs('touchend', touchList);

        this.datenow.returns(12345678987654321);

        eventObj.type = 'touchend';
        this.tapEvents._handleEndEvent(eventObj);
        this.tapEvents.stopFeature(this._browserContext);
    });

    it('Should send a long press event if tap exceeded the max timeout', function () {
        this.tapEvents.startFeature(this._browserContext);

        const point = { x: 150, y: 200 };
        const touchList = [{
            target: 9876,
            identifier: Date.now() + 1,
            pageX: point.x,
            pageY: point.y,
            screenX: point.x,
            screenY: point.y,
            clientX: point.x,
            clientY: point.y,
        }];

        const eventObj = createDefaultTouchEventArgs('touchstart', touchList);

        this.datenow.returns(1500802088519);

        this.tapEvents._handleStartEvent(eventObj);

        eventObj.type = 'touchmove';
        this.tapEvents._handleMoveEvent(eventObj);

        eventObj.type = 'touchend';
        this.datenow.returns(1500802089019);

        this.tapEvents._handleEndEvent(eventObj);

        assert.equal(this.dataQ.addToQueue.callCount, 1, 'addToQueue was not called on touchend');
        const lastCall = this.dataQ.addToQueue.getCall(0);
        const data = lastCall.args[1];
        assert.equal(lastCall.args[0], 'longpress_events', 'expected to dispatch touch_events');
        assert.equal(data[LongPressEventStructure.indexOf('isTrusted') + 1], false, 'is trusted is not right');
        assert.equal(data[LongPressEventStructure.indexOf('clientX') + 1], point.x, 'x is not right');
        assert.equal(data[LongPressEventStructure.indexOf('clientY') + 1], point.y, 'y is not right');

        this.tapEvents.stopFeature(this._browserContext);
    });

    it('Should send tap event according to slop configuration change', function () {
        this.configurationRepository.get.withArgs('tapEventsTapMaxSlop').returns(100);

        // Notify feature on configuration update
        this.tapEvents.updateFeatureConfig();

        this.tapEvents.startFeature(this._browserContext);

        let point = { x: 150, y: 90 };
        let touchList = [{
            target: 1516,
            identifier: Date.now() + 1,
            pageX: point.x,
            pageY: point.y,
            screenX: point.x,
            screenY: point.y,
            clientX: point.x,
            clientY: point.y,
        }];

        const eventObj = createDefaultTouchEventArgs('touchstart', touchList);

        this.tapEvents._handleStartEvent(eventObj);

        eventObj.type = 'touchmove';
        point = { x: 249, y: 189 };
        touchList = [{
            target: 9876,
            identifier: touchList[0].identifier,
            pageX: point.x,
            pageY: point.y,
            screenX: point.x,
            screenY: point.y,
            clientX: point.x,
            clientY: point.y,
        }];
        eventObj.changedTouches = touchList;

        this.tapEvents._handleMoveEvent(eventObj);

        eventObj.type = 'touchend';
        this.tapEvents._handleEndEvent(eventObj);

        assert.equal(this.dataQ.addToQueue.callCount, 1, 'addToQueue was not called on touchend');
        const lastCall = this.dataQ.addToQueue.getCall(0);
        const data = lastCall.args[1];
        assert.equal(lastCall.args[0], 'tap_events', 'expected to dispatch touch_events');
        assert.equal(data[TapEventStructure.indexOf('isTrusted') + 1], false, 'is trusted is not right');
        assert.equal(data[TapEventStructure.indexOf('clientX') + 1], point.x, 'x is not right');
        assert.equal(data[TapEventStructure.indexOf('clientY') + 1], point.y, 'y is not right');

        this.tapEvents.stopFeature(this._browserContext);
    });

    it('Should send long press event according to timeout configuration change', function () {
        this.configurationRepository.get.withArgs('tapEventsLongPressTimeout').returns(47);

        // Notify feature on configuration update
        this.tapEvents.updateFeatureConfig();

        this.tapEvents.startFeature(this._browserContext);

        const point = { x: 150, y: 90 };
        const touchList = [{
            target: 1516,
            identifier: Date.now() + 1,
            pageX: point.x,
            pageY: point.y,
            screenX: point.x,
            screenY: point.y,
            clientX: point.x,
            clientY: point.y,
        }];

        const eventObj = createDefaultTouchEventArgs('touchstart', touchList);

        this.datenow.returns(1500802088519);

        this.tapEvents._handleStartEvent(eventObj);

        eventObj.type = 'touchmove';
        this.tapEvents._handleMoveEvent(eventObj);

        eventObj.type = 'touchend';
        this.datenow.returns(1500802088566);

        this.tapEvents._handleEndEvent(eventObj);

        assert.equal(this.dataQ.addToQueue.callCount, 1, 'addToQueue was not called on touchend');
        const lastCall = this.dataQ.addToQueue.getCall(0);
        const data = lastCall.args[1];
        assert.equal(lastCall.args[0], 'longpress_events', 'expected to dispatch longpress_events');
        assert.equal(data[LongPressEventStructure.indexOf('isTrusted') + 1], false, 'is trusted is not right');
        assert.equal(data[LongPressEventStructure.indexOf('clientX') + 1], point.x, 'x is not right');
        assert.equal(data[LongPressEventStructure.indexOf('clientY') + 1], point.y, 'y is not right');

        this.tapEvents.stopFeature(this._browserContext);
    });

    it('Should ignore tap max slop configuration change if it contains undefined value', function () {
        this.configurationRepository.get.withArgs('tapEventsTapMaxSlop').returns(undefined);

        // Notify feature on configuration update
        this.tapEvents.updateFeatureConfig();

        this.tapEvents.startFeature(this._browserContext);

        let point = { x: 150, y: 90 };
        let touchList = [{
            target: 1516,
            identifier: Date.now() + 1,
            pageX: point.x,
            pageY: point.y,
            screenX: point.x,
            screenY: point.y,
            clientX: point.x,
            clientY: point.y,
        }];

        const eventObj = createDefaultTouchEventArgs('touchstart', touchList);

        this.tapEvents._handleStartEvent(eventObj);

        // Since the configuration change is invalid we are using the default slop value of 20px
        eventObj.type = 'touchmove';
        point = { x: 170, y: 70 };
        touchList = [{
            target: 9876,
            identifier: touchList[0].identifier,
            pageX: point.x,
            pageY: point.y,
            screenX: point.x,
            screenY: point.y,
            clientX: point.x,
            clientY: point.y,
        }];
        eventObj.changedTouches = touchList;

        this.tapEvents._handleMoveEvent(eventObj);

        eventObj.type = 'touchend';
        this.tapEvents._handleEndEvent(eventObj);

        assert.equal(this.dataQ.addToQueue.callCount, 0, 'addToQueue was not called on touchend');

        this.tapEvents.stopFeature(this._browserContext);
    });

    it('Should ignore long press timeout configuration change if it contains undefined value', function () {
        this.configurationRepository.get.withArgs('tapEventsLongPressTimeout').returns(undefined);

        // Notify feature on configuration update
        this.tapEvents.updateFeatureConfig();

        this.tapEvents.startFeature(this._browserContext);

        const point = { x: 150, y: 90 };
        const touchList = [{
            target: 1516,
            identifier: Date.now() + 1,
            pageX: point.x,
            pageY: point.y,
            screenX: point.x,
            screenY: point.y,
            clientX: point.x,
            clientY: point.y,
        }];

        const eventObj = createDefaultTouchEventArgs('touchstart', touchList);

        this.datenow.returns(1500802088519);

        this.tapEvents._handleStartEvent(eventObj);

        eventObj.type = 'touchmove';
        this.tapEvents._handleMoveEvent(eventObj);

        eventObj.type = 'touchend';
        this.datenow.returns(1500802088766);

        this.tapEvents._handleEndEvent(eventObj);

        // Since the longpress timeout is 500 by default we should be getting a tap event since only 247 ms have passed
        assert.equal(this.dataQ.addToQueue.callCount, 1, 'addToQueue was not called on touchend');
        const lastCall = this.dataQ.addToQueue.getCall(0);
        const data = lastCall.args[1];
        assert.equal(lastCall.args[0], 'tap_events', 'expected to dispatch tap_events');
        assert.equal(data[TapEventStructure.indexOf('isTrusted') + 1], false, 'is trusted is not right');
        assert.equal(data[TapEventStructure.indexOf('clientX') + 1], point.x, 'x is not right');
        assert.equal(data[TapEventStructure.indexOf('clientY') + 1], point.y, 'y is not right');

        this.tapEvents.stopFeature(this._browserContext);
    });
});
