import { assert } from 'chai';
import MessageBus from '../../../../../src/main/technicalServices/MessageBus';
import WindowEventCollector, { WindowEventType } from '../../../../../src/main/collectors/events/WindowEventCollector';
import FocusEventEmitter from '../../../../../src/main/emitters/FocusEventEmitter';
import BlurEventEmitter from '../../../../../src/main/emitters/BlurEventEmitter';
import ResizeEventEmitter from '../../../../../src/main/emitters/ResizeEventEmitter';
import DOMContentLoadedEventEmitter from '../../../../../src/main/emitters/DOMContentLoadedEventEmitter';
import VisibilityChangeEventEmitter from '../../../../../src/main/emitters/VisibilityChangeEventEmitter';
import ScrollEventEmitter from '../../../../../src/main/emitters/ScrollEventEmitter';
import ConfigurationRepository from '../../../../../src/main/core/configuration/ConfigurationRepository';
import DataQ from '../../../../../src/main/technicalServices/DataQ';
import { MockObjects } from '../../../mocks/mockObjects';
import { EventStructure as WindowEventStructure } from '../../../../../src/main/collectors/events/WindowEventCollector';
import CDUtils from '../../../../../src/main/technicalServices/CDUtils';
import TestDomUtils from '../../../../TestDomUtils';
import { MessageBusEventType } from '../../../../../src/main/events/MessageBusEventType';
import TestBrowserUtils from '../../../../TestBrowserUtils';
import { ConfigurationFields } from '../../../../../src/main/core/configuration/ConfigurationFields';
import BrowserContext from '../../../../../src/main/core/browsercontexts/BrowserContext';

describe('WindowEventCollector Tests:', function () {
    beforeEach(function () {
        this._messageBus = new MessageBus();

        this.sandbox = sinon.createSandbox();
        this._browserContext = new BrowserContext(self);

        this.configurationRepositoryStub = this.sandbox.stub(new ConfigurationRepository());
        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.isScrollCollect).returns(true);

        this.cdUtilsStub = this.sandbox.stub(MockObjects.cdUtils);
        this.dataQueue = this.sandbox.createStubInstance(DataQ);
        this.focusEventEmitterStub = this.sandbox.stub(new FocusEventEmitter());
        this.blurEventEmitterStub = this.sandbox.stub(new BlurEventEmitter());
        this.resizeEventEmitterStub = this.sandbox.stub(new ResizeEventEmitter());
        this.domContentLoadedEventEmitterStub = this.sandbox.stub(new DOMContentLoadedEventEmitter());
        this.visibilityChangeEventEmitterStub = this.sandbox.stub(new VisibilityChangeEventEmitter());
        this.scrollEventEmitterStub = this.sandbox.stub(new ScrollEventEmitter());

        const windowEventCollectorBuilder = new WindowEventCollector.Builder(
            this.configurationRepositoryStub,
            CDUtils,
            this.dataQueue,
        );

        windowEventCollectorBuilder.withMessageBus(this._messageBus);
        windowEventCollectorBuilder.withFocusEventEmitter(this.focusEventEmitterStub);
        windowEventCollectorBuilder.withBlurEventEmitter(this.blurEventEmitterStub);
        windowEventCollectorBuilder.withResizeEventEmitter(this.resizeEventEmitterStub);
        windowEventCollectorBuilder.withDOMContentLoadedEventEmitter(this.domContentLoadedEventEmitterStub);
        windowEventCollectorBuilder.withVisibilityChangeEventEmitter(this.visibilityChangeEventEmitterStub);
        windowEventCollectorBuilder.withScrollEventEmitter(this.scrollEventEmitterStub);
        this.windowEventCollector = windowEventCollectorBuilder.build();
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    describe('event collection tests:', function () {
        beforeEach(function () {
            // Required for some window params to have values
            const input = document.createElement('input');
            input.setAttribute('id', 'inputTadada');
            input.setAttribute('type', 'text');
            document.body.appendChild(input);

            // Required for some window params to have values
            const input2 = document.createElement('input');
            input2.setAttribute('id', 'inputTadada2');
            input2.setAttribute('type', 'text');
            document.body.appendChild(input2);

            // Required for some window params to have values
            const input3 = document.createElement('input');
            input3.setAttribute('id', 'inputTadada3');
            input3.setAttribute('type', 'text');
            document.body.appendChild(input3);

            // Required for some window params to have values
            const button = document.createElement('button');
            button.setAttribute('id', 'superButton');
            document.body.appendChild(button);
        });

        afterEach(function () {
            TestDomUtils.clearChildElements(document.body);
        });

        it('should collect a focus event', function () {
            this.windowEventCollector.startFeature(this._browserContext);

            // Create a focus event and publish using hte message bus
            const e = document.createEvent('Event');
            e.initEvent('focus', true, true);

            this._messageBus.publish(MessageBusEventType.FocusEvent, e);

            assert.isTrue(this.dataQueue.addToQueue.calledOnce, 'addToQueue called more than once');
            const data = this.dataQueue.addToQueue.getCall(0).args[1];

            assert.isTrue(data[WindowEventStructure.indexOf('isTrusted') + 1] === 0
                || data[WindowEventStructure.indexOf('isTrusted') + 1] === 2, // safari mobile
                'the isTrusted is expected to be false');// since the event is generated from code
            assert.equal(data[WindowEventStructure.indexOf('eventType') + 1], WindowEventType.focus,
                'event type is not focus');

            const screenWidth = data[WindowEventStructure.indexOf('screenWidth') + 1];
            assert.notEqual(screenWidth, -1, `expected screenWidth to be != -1 but actually equals ${screenWidth}`);
            const screenHeight = data[WindowEventStructure.indexOf('screenHeight') + 1];
            assert.notEqual(screenHeight, -1, `expected screenHeight to be != -1 but actually equals ${screenHeight}`);
            const clientWidth = data[WindowEventStructure.indexOf('clientWidth') + 1];
            assert.notEqual(clientWidth, -1, `expected clientWidth to be != -1 but actually equals ${clientWidth}`);
            const clientHeight = data[WindowEventStructure.indexOf('clientHeight') + 1];
            assert.notEqual(clientHeight, -1, `expected clientHeight to be != -1 but actually equals ${clientHeight}`);
            const documentWidth = data[WindowEventStructure.indexOf('documentWidth') + 1];
            assert.notEqual(documentWidth, -1, `expected documentWidth to be != -1 but actually equals ${documentWidth}`);

            // Mobile Safari value is 0 which results in -1 sent to server. Looks like a bug in Mobile Safari so for now let it slide
            if (!TestBrowserUtils.isMobileSafari(window.navigator.userAgent)) {
                const documentHeight = data[WindowEventStructure.indexOf('documentHeight') + 1];
                assert.notEqual(documentHeight, -1, `expected documentHeight to be != -1 but actually equals ${documentHeight}`);
            }

            const scrollTop = data[WindowEventStructure.indexOf('scrollTop') + 1];
            assert.notEqual(scrollTop, -1, `expected scrollTop to be != -1 but actually equals ${scrollTop}`);
            const scrollLeft = data[WindowEventStructure.indexOf('scrollLeft') + 1];
            assert.notEqual(scrollLeft, -1, `expected scrollLeft to be != -1 but actually equals ${scrollLeft}`);
            const windowInnerWidth = data[WindowEventStructure.indexOf('windowInnerWidth') + 1];
            assert.notEqual(windowInnerWidth, -1, `expected windowInnerWidth to be != -1 but actually equals ${windowInnerWidth}`);
            const windowInnerHeight = data[WindowEventStructure.indexOf('windowInnerHeight') + 1];
            assert.notEqual(windowInnerHeight, -1, `expected windowInnerHeight to be != -1 but actually equals ${windowInnerHeight}`);

            // Mobile Safari value is 0 which results in -1 sent to server. Looks like a bug in Mobile Safari so for now let it slide
            if (!TestBrowserUtils.isMobileSafari(window.navigator.userAgent)) {
                const windowOuterWidth = data[WindowEventStructure.indexOf('windowOuterWidth') + 1];
                assert.notEqual(windowOuterWidth, -1, `expected windowOuterWidth to be != -1 but actually equals ${windowOuterWidth}`);
                const windowOuterHeight = data[WindowEventStructure.indexOf('windowOuterHeight') + 1];
                assert.notEqual(windowOuterHeight, -1, `expected windowOuterHeight to be != -1 but actually equals ${windowOuterHeight}`);
            }

            this.windowEventCollector.stopFeature(this._browserContext);
        });

        it('should collect a resize event', function () {
            this.windowEventCollector.startFeature(this._browserContext);

            // Create a focus event and publish using hte message bus
            const e = document.createEvent('Event');
            e.initEvent('resize', true, true);

            this._messageBus.publish(MessageBusEventType.ResizeEvent, e);

            assert.isTrue(this.dataQueue.addToQueue.calledOnce, 'addToQueue called more than once');
            const data = this.dataQueue.addToQueue.getCall(0).args[1];

            assert.isTrue(data[WindowEventStructure.indexOf('isTrusted') + 1] === 0
                || data[WindowEventStructure.indexOf('isTrusted') + 1] === 2, // safari mobile
                'the isTrusted is expected to be false');// since the event is generated from code
            assert.equal(data[WindowEventStructure.indexOf('eventType') + 1], WindowEventType.resize,
                'event type is not resize');

            const screenWidth = data[WindowEventStructure.indexOf('screenWidth') + 1];
            assert.notEqual(screenWidth, -1, `expected screenWidth to be != -1 but actually equals ${screenWidth}`);
            const screenHeight = data[WindowEventStructure.indexOf('screenHeight') + 1];
            assert.notEqual(screenHeight, -1, `expected screenHeight to be != -1 but actually equals ${screenHeight}`);
            const clientWidth = data[WindowEventStructure.indexOf('clientWidth') + 1];
            assert.notEqual(clientWidth, -1, `expected clientWidth to be != -1 but actually equals ${clientWidth}`);
            const clientHeight = data[WindowEventStructure.indexOf('clientHeight') + 1];
            assert.notEqual(clientHeight, -1, `expected clientHeight to be != -1 but actually equals ${clientHeight}`);
            const documentWidth = data[WindowEventStructure.indexOf('documentWidth') + 1];
            assert.notEqual(documentWidth, -1, `expected documentWidth to be != -1 but actually equals ${documentWidth}`);

            // Mobile Safari value is 0 which results in -1 sent to server. Looks like a bug in Mobile Safari so for now let it slide
            if (!TestBrowserUtils.isMobileSafari(window.navigator.userAgent)) {
                const documentHeight = data[WindowEventStructure.indexOf('documentHeight') + 1];
                assert.notEqual(documentHeight, -1, `expected documentHeight to be != -1 but actually equals ${documentHeight}`);
            }

            const scrollTop = data[WindowEventStructure.indexOf('scrollTop') + 1];
            assert.notEqual(scrollTop, -1, `expected scrollTop to be != -1 but actually equals ${scrollTop}`);
            const scrollLeft = data[WindowEventStructure.indexOf('scrollLeft') + 1];
            assert.notEqual(scrollLeft, -1, `expected scrollLeft to be != -1 but actually equals ${scrollLeft}`);
            const windowInnerWidth = data[WindowEventStructure.indexOf('windowInnerWidth') + 1];
            assert.notEqual(windowInnerWidth, -1, `expected windowInnerWidth to be != -1 but actually equals ${windowInnerWidth}`);
            const windowInnerHeight = data[WindowEventStructure.indexOf('windowInnerHeight') + 1];
            assert.notEqual(windowInnerHeight, -1, `expected windowInnerHeight to be != -1 but actually equals ${windowInnerHeight}`);

            // Mobile Safari value is 0 which results in -1 sent to server. Looks like a bug in Mobile Safari so for now let it slide
            if (!TestBrowserUtils.isMobileSafari(window.navigator.userAgent)) {
                const windowOuterWidth = data[WindowEventStructure.indexOf('windowOuterWidth') + 1];
                assert.notEqual(windowOuterWidth, -1, `expected windowOuterWidth to be != -1 but actually equals ${windowOuterWidth}`);
                const windowOuterHeight = data[WindowEventStructure.indexOf('windowOuterHeight') + 1];
                assert.notEqual(windowOuterHeight, -1, `expected windowOuterHeight to be != -1 but actually equals ${windowOuterHeight}`);
            }

            this.windowEventCollector.stopFeature(this._browserContext);
        });

        it('should collect a blur event', function () {
            this.windowEventCollector.startFeature(this._browserContext);

            // Create a focus event and publish using hte message bus
            const e = document.createEvent('Event');
            e.initEvent('blur', true, true);

            this._messageBus.publish(MessageBusEventType.BlurEvent, e);

            assert.isTrue(this.dataQueue.addToQueue.calledOnce, 'addToQueue called more than once');
            const data = this.dataQueue.addToQueue.getCall(0).args[1];

            assert.isTrue(data[WindowEventStructure.indexOf('isTrusted') + 1] === 0
                || data[WindowEventStructure.indexOf('isTrusted') + 1] === 2, // safari mobile
                'the isTrusted is expected to be false');// since the event is generated from code
            assert.equal(data[WindowEventStructure.indexOf('eventType') + 1], WindowEventType.blur,
                'event type is not blur');

            const screenWidth = data[WindowEventStructure.indexOf('screenWidth') + 1];
            assert.notEqual(screenWidth, -1, `expected screenWidth to be != -1 but actually equals ${screenWidth}`);
            const screenHeight = data[WindowEventStructure.indexOf('screenHeight') + 1];
            assert.notEqual(screenHeight, -1, `expected screenHeight to be != -1 but actually equals ${screenHeight}`);
            const clientWidth = data[WindowEventStructure.indexOf('clientWidth') + 1];
            assert.notEqual(clientWidth, -1, `expected clientWidth to be != -1 but actually equals ${clientWidth}`);
            const clientHeight = data[WindowEventStructure.indexOf('clientHeight') + 1];
            assert.notEqual(clientHeight, -1, `expected clientHeight to be != -1 but actually equals ${clientHeight}`);
            const documentWidth = data[WindowEventStructure.indexOf('documentWidth') + 1];
            assert.notEqual(documentWidth, -1, `expected documentWidth to be != -1 but actually equals ${documentWidth}`);

            // Mobile Safari value is 0 which results in -1 sent to server. Looks like a bug in Mobile Safari so for now let it slide
            if (!TestBrowserUtils.isMobileSafari(window.navigator.userAgent)) {
                const documentHeight = data[WindowEventStructure.indexOf('documentHeight') + 1];
                assert.notEqual(documentHeight, -1, `expected documentHeight to be != -1 but actually equals ${documentHeight}`);
            }

            const scrollTop = data[WindowEventStructure.indexOf('scrollTop') + 1];
            assert.notEqual(scrollTop, -1, `expected scrollTop to be != -1 but actually equals ${scrollTop}`);
            const scrollLeft = data[WindowEventStructure.indexOf('scrollLeft') + 1];
            assert.notEqual(scrollLeft, -1, `expected scrollLeft to be != -1 but actually equals ${scrollLeft}`);
            const windowInnerWidth = data[WindowEventStructure.indexOf('windowInnerWidth') + 1];
            assert.notEqual(windowInnerWidth, -1, `expected windowInnerWidth to be != -1 but actually equals ${windowInnerWidth}`);
            const windowInnerHeight = data[WindowEventStructure.indexOf('windowInnerHeight') + 1];
            assert.notEqual(windowInnerHeight, -1, `expected windowInnerHeight to be != -1 but actually equals ${windowInnerHeight}`);

            // Mobile Safari value is 0 which results in -1 sent to server. Looks like a bug in Mobile Safari so for now let it slide
            if (!TestBrowserUtils.isMobileSafari(window.navigator.userAgent)) {
                const windowOuterWidth = data[WindowEventStructure.indexOf('windowOuterWidth') + 1];
                assert.notEqual(windowOuterWidth, -1, `expected windowOuterWidth to be != -1 but actually equals ${windowOuterWidth}`);
                const windowOuterHeight = data[WindowEventStructure.indexOf('windowOuterHeight') + 1];
                assert.notEqual(windowOuterHeight, -1, `expected windowOuterHeight to be != -1 but actually equals ${windowOuterHeight}`);
            }

            this.windowEventCollector.stopFeature(this._browserContext);
        });

        it('should collect visibilitychange events', function () {
            this.windowEventCollector.startFeature(this._browserContext);

            // Create a focus event and publish using hte message bus
            const e = document.createEvent('Event');
            e.initEvent('visibilitychange', true, true);

            this._messageBus.publish(MessageBusEventType.VisibilityChangeEvent, e);

            assert.isTrue(this.dataQueue.addToQueue.calledOnce, 'addToQueue called more than once');
            const data = this.dataQueue.addToQueue.getCall(0).args[1];

            assert.isTrue(data[WindowEventStructure.indexOf('isTrusted') + 1] === 0
                || data[WindowEventStructure.indexOf('isTrusted') + 1] === 2, // safari mobile
                'the isTrusted is expected to be false');// since the event is generated from code
            assert.oneOf(data[WindowEventStructure.indexOf('eventType') + 1], [WindowEventType.tabFocus, WindowEventType.tabBlur],
                'event type is not tabFocus or tabBlur');

            const screenWidth = data[WindowEventStructure.indexOf('screenWidth') + 1];
            assert.notEqual(screenWidth, -1, `expected screenWidth to be != -1 but actually equals ${screenWidth}`);
            const screenHeight = data[WindowEventStructure.indexOf('screenHeight') + 1];
            assert.notEqual(screenHeight, -1, `expected screenHeight to be != -1 but actually equals ${screenHeight}`);
            const clientWidth = data[WindowEventStructure.indexOf('clientWidth') + 1];
            assert.notEqual(clientWidth, -1, `expected clientWidth to be != -1 but actually equals ${clientWidth}`);
            const clientHeight = data[WindowEventStructure.indexOf('clientHeight') + 1];
            assert.notEqual(clientHeight, -1, `expected clientHeight to be != -1 but actually equals ${clientHeight}`);
            const documentWidth = data[WindowEventStructure.indexOf('documentWidth') + 1];
            assert.notEqual(documentWidth, -1, `expected documentWidth to be != -1 but actually equals ${documentWidth}`);

            // Mobile Safari value is 0 which results in -1 sent to server. Looks like a bug in Mobile Safari so for now let it slide
            if (!TestBrowserUtils.isMobileSafari(window.navigator.userAgent)) {
                const documentHeight = data[WindowEventStructure.indexOf('documentHeight') + 1];
                assert.notEqual(documentHeight, -1, `expected documentHeight to be != -1 but actually equals ${documentHeight}`);
            }

            const scrollTop = data[WindowEventStructure.indexOf('scrollTop') + 1];
            assert.notEqual(scrollTop, -1, `expected scrollTop to be != -1 but actually equals ${scrollTop}`);
            const scrollLeft = data[WindowEventStructure.indexOf('scrollLeft') + 1];
            assert.notEqual(scrollLeft, -1, `expected scrollLeft to be != -1 but actually equals ${scrollLeft}`);
            const windowInnerWidth = data[WindowEventStructure.indexOf('windowInnerWidth') + 1];
            assert.notEqual(windowInnerWidth, -1, `expected windowInnerWidth to be != -1 but actually equals ${windowInnerWidth}`);
            const windowInnerHeight = data[WindowEventStructure.indexOf('windowInnerHeight') + 1];
            assert.notEqual(windowInnerHeight, -1, `expected windowInnerHeight to be != -1 but actually equals ${windowInnerHeight}`);

            // Mobile Safari value is 0 which results in -1 sent to server. Looks like a bug in Mobile Safari so for now let it slide
            if (!TestBrowserUtils.isMobileSafari(window.navigator.userAgent)) {
                const windowOuterWidth = data[WindowEventStructure.indexOf('windowOuterWidth') + 1];
                assert.notEqual(windowOuterWidth, -1, `expected windowOuterWidth to be != -1 but actually equals ${windowOuterWidth}`);
                const windowOuterHeight = data[WindowEventStructure.indexOf('windowOuterHeight') + 1];
                assert.notEqual(windowOuterHeight, -1, `expected windowOuterHeight to be != -1 but actually equals ${windowOuterHeight}`);
            }

            this.windowEventCollector.stopFeature(this._browserContext);
        });

        it('should collect a scroll event', function () {
            this.windowEventCollector.startFeature(this._browserContext);

            document.body.style.overflow = 'scroll';

            // Create a focus event and publish using hte message bus
            const e = document.createEvent('Event');
            e.initEvent('scroll', true, true);

            this._messageBus.publish(MessageBusEventType.ScrollEvent, e);

            assert.isTrue(this.dataQueue.addToQueue.calledOnce, 'addToQueue called more than once');
            const data = this.dataQueue.addToQueue.getCall(0).args[1];

            assert.isTrue(data[WindowEventStructure.indexOf('isTrusted') + 1] === 0
                || data[WindowEventStructure.indexOf('isTrusted') + 1] === 2, // safari mobile
                'the isTrusted is expected to be false');// since the event is generated from code
            assert.equal(data[WindowEventStructure.indexOf('eventType') + 1], WindowEventType.scroll,
                'event type is not scroll');

            const screenWidth = data[WindowEventStructure.indexOf('screenWidth') + 1];
            assert.notEqual(screenWidth, -1, `expected screenWidth to be != -1 but actually equals ${screenWidth}`);
            const screenHeight = data[WindowEventStructure.indexOf('screenHeight') + 1];
            assert.notEqual(screenHeight, -1, `expected screenHeight to be != -1 but actually equals ${screenHeight}`);
            const clientWidth = data[WindowEventStructure.indexOf('clientWidth') + 1];
            assert.notEqual(clientWidth, -1, `expected clientWidth to be != -1 but actually equals ${clientWidth}`);
            const clientHeight = data[WindowEventStructure.indexOf('clientHeight') + 1];
            assert.notEqual(clientHeight, -1, `expected clientHeight to be != -1 but actually equals ${clientHeight}`);
            const documentWidth = data[WindowEventStructure.indexOf('documentWidth') + 1];
            assert.notEqual(documentWidth, -1, `expected documentWidth to be != -1 but actually equals ${documentWidth}`);

            // Mobile Safari value is 0 which results in -1 sent to server. Looks like a bug in Mobile Safari so for now let it slide
            if (!TestBrowserUtils.isMobileSafari(window.navigator.userAgent)) {
                const documentHeight = data[WindowEventStructure.indexOf('documentHeight') + 1];
                assert.notEqual(documentHeight, -1, `expected documentHeight to be != -1 but actually equals ${documentHeight}`);
            }

            const scrollTop = data[WindowEventStructure.indexOf('scrollTop') + 1];
            assert.notEqual(scrollTop, -1, `expected scrollTop to be != -1 but actually equals ${scrollTop}`);
            const scrollLeft = data[WindowEventStructure.indexOf('scrollLeft') + 1];
            assert.notEqual(scrollLeft, -1, `expected scrollLeft to be != -1 but actually equals ${scrollLeft}`);
            const windowInnerWidth = data[WindowEventStructure.indexOf('windowInnerWidth') + 1];
            assert.notEqual(windowInnerWidth, -1, `expected windowInnerWidth to be != -1 but actually equals ${windowInnerWidth}`);
            const windowInnerHeight = data[WindowEventStructure.indexOf('windowInnerHeight') + 1];
            assert.notEqual(windowInnerHeight, -1, `expected windowInnerHeight to be != -1 but actually equals ${windowInnerHeight}`);

            // Mobile Safari value is 0 which results in -1 sent to server. Looks like a bug in Mobile Safari so for now let it slide
            if (!TestBrowserUtils.isMobileSafari(window.navigator.userAgent)) {
                const windowOuterWidth = data[WindowEventStructure.indexOf('windowOuterWidth') + 1];
                assert.notEqual(windowOuterWidth, -1, `expected windowOuterWidth to be != -1 but actually equals ${windowOuterWidth}`);
                const windowOuterHeight = data[WindowEventStructure.indexOf('windowOuterHeight') + 1];
                assert.notEqual(windowOuterHeight, -1, `expected windowOuterHeight to be != -1 but actually equals ${windowOuterHeight}`);
            }

            this.windowEventCollector.stopFeature(this._browserContext);
        });

        it('should collect a DOMContentLoaded event', function () {
            this.windowEventCollector.startFeature(this._browserContext);

            // Create a focus event and publish using hte message bus
            const e = document.createEvent('Event');
            e.initEvent('DOMContentLoaded', true, true);

            this._messageBus.publish(MessageBusEventType.DOMContentLoadedEvent, e);

            assert.isTrue(this.dataQueue.addToQueue.calledOnce, 'addToQueue called more than once');
            const data = this.dataQueue.addToQueue.getCall(0).args[1];

            assert.isTrue(data[WindowEventStructure.indexOf('isTrusted') + 1] === 0
                || data[WindowEventStructure.indexOf('isTrusted') + 1] === 2, // safari mobile
                'the isTrusted is expected to be false');// since the event is generated from code
            assert.equal(data[WindowEventStructure.indexOf('eventType') + 1], WindowEventType.DOMContentLoaded,
                'event type is not DOMContentLoaded');

            const screenWidth = data[WindowEventStructure.indexOf('screenWidth') + 1];
            assert.notEqual(screenWidth, -1, `expected screenWidth to be != -1 but actually equals ${screenWidth}`);
            const screenHeight = data[WindowEventStructure.indexOf('screenHeight') + 1];
            assert.notEqual(screenHeight, -1, `expected screenHeight to be != -1 but actually equals ${screenHeight}`);
            const clientWidth = data[WindowEventStructure.indexOf('clientWidth') + 1];
            assert.notEqual(clientWidth, -1, `expected clientWidth to be != -1 but actually equals ${clientWidth}`);
            const clientHeight = data[WindowEventStructure.indexOf('clientHeight') + 1];
            assert.notEqual(clientHeight, -1, `expected clientHeight to be != -1 but actually equals ${clientHeight}`);
            const documentWidth = data[WindowEventStructure.indexOf('documentWidth') + 1];
            assert.notEqual(documentWidth, -1, `expected documentWidth to be != -1 but actually equals ${documentWidth}`);

            // Mobile Safari value is 0 which results in -1 sent to server. Looks like a bug in Mobile Safari so for now let it slide
            if (!TestBrowserUtils.isMobileSafari(window.navigator.userAgent)) {
                const documentHeight = data[WindowEventStructure.indexOf('documentHeight') + 1];
                assert.notEqual(documentHeight, -1, `expected documentHeight to be != -1 but actually equals ${documentHeight}`);
            }

            const scrollTop = data[WindowEventStructure.indexOf('scrollTop') + 1];
            assert.notEqual(scrollTop, -1, `expected scrollTop to be != -1 but actually equals ${scrollTop}`);
            const scrollLeft = data[WindowEventStructure.indexOf('scrollLeft') + 1];
            assert.notEqual(scrollLeft, -1, `expected scrollLeft to be != -1 but actually equals ${scrollLeft}`);
            const windowInnerWidth = data[WindowEventStructure.indexOf('windowInnerWidth') + 1];
            assert.notEqual(windowInnerWidth, -1, `expected windowInnerWidth to be != -1 but actually equals ${windowInnerWidth}`);
            const windowInnerHeight = data[WindowEventStructure.indexOf('windowInnerHeight') + 1];
            assert.notEqual(windowInnerHeight, -1, `expected windowInnerHeight to be != -1 but actually equals ${windowInnerHeight}`);

            // Mobile Safari value is 0 which results in -1 sent to server. Looks like a bug in Mobile Safari so for now let it slide
            if (!TestBrowserUtils.isMobileSafari(window.navigator.userAgent)) {
                const windowOuterWidth = data[WindowEventStructure.indexOf('windowOuterWidth') + 1];
                assert.notEqual(windowOuterWidth, -1, `expected windowOuterWidth to be != -1 but actually equals ${windowOuterWidth}`);
                const windowOuterHeight = data[WindowEventStructure.indexOf('windowOuterHeight') + 1];
                assert.notEqual(windowOuterHeight, -1, `expected windowOuterHeight to be != -1 but actually equals ${windowOuterHeight}`);
            }

            this.windowEventCollector.stopFeature(this._browserContext);
        });

        it('should not collect scroll events when isScrollCollect configuration is disabled', function () {
            this.configurationRepositoryStub.get.withArgs(ConfigurationFields.isScrollCollect).returns(false);

            this.windowEventCollector.startFeature(this._browserContext);

            document.body.style.overflow = 'scroll';

            // Create a focus event and publish using hte message bus
            const e = document.createEvent('Event');
            e.initEvent('scroll', true, true);

            this._messageBus.publish(MessageBusEventType.ScrollEvent, e);

            assert.isTrue(this.dataQueue.addToQueue.notCalled, 'addToQueue should not have been called');
            this.windowEventCollector.stopFeature(this._browserContext);
        });

        it('should handle errors while sending events', function () {
            this.windowEventCollector.startFeature(this._browserContext);

            // Send an invalid event...
            this._messageBus.publish(MessageBusEventType.FocusEvent, null);

            assert.isTrue(this.dataQueue.addToQueue.notCalled, 'addToQueue called but should not');

            this.windowEventCollector.stopFeature(this._browserContext);
        });
    });

    describe('start tests:', function () {
        it('start registers the listeners for the window events', function () {
            const messageBusSubscribeSpy = this.sandbox.spy(this._messageBus, 'subscribe');

            this.windowEventCollector.startFeature(this._browserContext);

            assert.isTrue(this.resizeEventEmitterStub.start.calledOnce);
            assert.isTrue(this.resizeEventEmitterStub.start.firstCall.args[0] === window);
            assert.isTrue(this.focusEventEmitterStub.start.calledOnce);
            assert.isTrue(this.focusEventEmitterStub.start.firstCall.args[0] === window);
            assert.isTrue(this.blurEventEmitterStub.start.calledOnce);
            assert.isTrue(this.blurEventEmitterStub.start.firstCall.args[0] === window);
            assert.isTrue(this.domContentLoadedEventEmitterStub.start.calledOnce);
            assert.isTrue(this.domContentLoadedEventEmitterStub.start.firstCall.args[0] === window.document);
            assert.isTrue(this.visibilityChangeEventEmitterStub.start.calledOnce);
            assert.isTrue(this.visibilityChangeEventEmitterStub.start.firstCall.args[0] === window.document);
            assert.isTrue(this.scrollEventEmitterStub.start.calledOnce);
            assert.isTrue(this.scrollEventEmitterStub.start.firstCall.args[0] === window);

            assert.equal(messageBusSubscribeSpy.callCount, 6);
            assert.equal(messageBusSubscribeSpy.firstCall.args[0], MessageBusEventType.ResizeEvent);
            assert.equal(messageBusSubscribeSpy.firstCall.args[1], this.windowEventCollector._onWindowEvent);
            assert.equal(messageBusSubscribeSpy.secondCall.args[0], MessageBusEventType.FocusEvent);
            assert.equal(messageBusSubscribeSpy.secondCall.args[1], this.windowEventCollector._onWindowEvent);
            assert.equal(messageBusSubscribeSpy.thirdCall.args[0], MessageBusEventType.BlurEvent);
            assert.equal(messageBusSubscribeSpy.thirdCall.args[1], this.windowEventCollector._onWindowEvent);
            assert.equal(messageBusSubscribeSpy.getCall(3).args[0], MessageBusEventType.DOMContentLoadedEvent);
            assert.equal(messageBusSubscribeSpy.getCall(3).args[1], this.windowEventCollector._onWindowEvent);
            assert.equal(messageBusSubscribeSpy.getCall(4).args[0], MessageBusEventType.VisibilityChangeEvent);
            assert.equal(messageBusSubscribeSpy.getCall(4).args[1], this.windowEventCollector._onWindowEvent);
            assert.equal(messageBusSubscribeSpy.getCall(5).args[0], MessageBusEventType.ScrollEvent);
            assert.equal(messageBusSubscribeSpy.getCall(5).args[1], this.windowEventCollector._onWindowEvent);
        });

        it('uses window.self as window object if parameter is null', function () {
            const messageBusSubscribeSpy = this.sandbox.spy(this._messageBus, 'subscribe');

            this.windowEventCollector.startFeature(new BrowserContext(null));

            assert.isTrue(this.resizeEventEmitterStub.start.calledOnce);
            assert.isTrue(this.resizeEventEmitterStub.start.firstCall.args[0] === window.self);
            assert.isTrue(this.focusEventEmitterStub.start.calledOnce);
            assert.isTrue(this.focusEventEmitterStub.start.firstCall.args[0] === window.self);
            assert.isTrue(this.blurEventEmitterStub.start.calledOnce);
            assert.isTrue(this.blurEventEmitterStub.start.firstCall.args[0] === window.self);
            assert.isTrue(this.domContentLoadedEventEmitterStub.start.calledOnce);
            assert.isTrue(this.domContentLoadedEventEmitterStub.start.firstCall.args[0] === window.self.document);
            assert.isTrue(this.visibilityChangeEventEmitterStub.start.calledOnce);
            assert.isTrue(this.visibilityChangeEventEmitterStub.start.firstCall.args[0] === window.self.document);
            assert.isTrue(this.scrollEventEmitterStub.start.calledOnce);
            assert.isTrue(this.scrollEventEmitterStub.start.firstCall.args[0] === window.self);

            assert.equal(messageBusSubscribeSpy.callCount, 6);
            assert.equal(messageBusSubscribeSpy.firstCall.args[0], MessageBusEventType.ResizeEvent);
            assert.equal(messageBusSubscribeSpy.firstCall.args[1], this.windowEventCollector._onWindowEvent);
            assert.equal(messageBusSubscribeSpy.secondCall.args[0], MessageBusEventType.FocusEvent);
            assert.equal(messageBusSubscribeSpy.secondCall.args[1], this.windowEventCollector._onWindowEvent);
            assert.equal(messageBusSubscribeSpy.thirdCall.args[0], MessageBusEventType.BlurEvent);
            assert.equal(messageBusSubscribeSpy.thirdCall.args[1], this.windowEventCollector._onWindowEvent);
            assert.equal(messageBusSubscribeSpy.getCall(3).args[0], MessageBusEventType.DOMContentLoadedEvent);
            assert.equal(messageBusSubscribeSpy.getCall(3).args[1], this.windowEventCollector._onWindowEvent);
            assert.equal(messageBusSubscribeSpy.getCall(4).args[0], MessageBusEventType.VisibilityChangeEvent);
            assert.equal(messageBusSubscribeSpy.getCall(4).args[1], this.windowEventCollector._onWindowEvent);
            assert.equal(messageBusSubscribeSpy.getCall(5).args[0], MessageBusEventType.ScrollEvent);
            assert.equal(messageBusSubscribeSpy.getCall(5).args[1], this.windowEventCollector._onWindowEvent);
        });

        it('uses window.self as window object if parameter is undefined', function () {
            const messageBusSubscribeSpy = this.sandbox.spy(this._messageBus, 'subscribe');

            this.windowEventCollector.startFeature(new BrowserContext(null));

            assert.isTrue(this.resizeEventEmitterStub.start.calledOnce);
            assert.isTrue(this.resizeEventEmitterStub.start.firstCall.args[0] === window.self);
            assert.isTrue(this.focusEventEmitterStub.start.calledOnce);
            assert.isTrue(this.focusEventEmitterStub.start.firstCall.args[0] === window.self);
            assert.isTrue(this.blurEventEmitterStub.start.calledOnce);
            assert.isTrue(this.blurEventEmitterStub.start.firstCall.args[0] === window.self);
            assert.isTrue(this.domContentLoadedEventEmitterStub.start.calledOnce);
            assert.isTrue(this.domContentLoadedEventEmitterStub.start.firstCall.args[0] === window.self.document);
            assert.isTrue(this.visibilityChangeEventEmitterStub.start.calledOnce);
            assert.isTrue(this.visibilityChangeEventEmitterStub.start.firstCall.args[0] === window.self.document);
            assert.isTrue(this.scrollEventEmitterStub.start.calledOnce);
            assert.isTrue(this.scrollEventEmitterStub.start.firstCall.args[0] === window.self);

            assert.equal(messageBusSubscribeSpy.callCount, 6);
            assert.equal(messageBusSubscribeSpy.firstCall.args[0], MessageBusEventType.ResizeEvent);
            assert.equal(messageBusSubscribeSpy.firstCall.args[1], this.windowEventCollector._onWindowEvent);
            assert.equal(messageBusSubscribeSpy.secondCall.args[0], MessageBusEventType.FocusEvent);
            assert.equal(messageBusSubscribeSpy.secondCall.args[1], this.windowEventCollector._onWindowEvent);
            assert.equal(messageBusSubscribeSpy.thirdCall.args[0], MessageBusEventType.BlurEvent);
            assert.equal(messageBusSubscribeSpy.thirdCall.args[1], this.windowEventCollector._onWindowEvent);
            assert.equal(messageBusSubscribeSpy.getCall(3).args[0], MessageBusEventType.DOMContentLoadedEvent);
            assert.equal(messageBusSubscribeSpy.getCall(3).args[1], this.windowEventCollector._onWindowEvent);
            assert.equal(messageBusSubscribeSpy.getCall(4).args[0], MessageBusEventType.VisibilityChangeEvent);
            assert.equal(messageBusSubscribeSpy.getCall(4).args[1], this.windowEventCollector._onWindowEvent);
            assert.equal(messageBusSubscribeSpy.getCall(5).args[0], MessageBusEventType.ScrollEvent);
            assert.equal(messageBusSubscribeSpy.getCall(5).args[1], this.windowEventCollector._onWindowEvent);
        });

        it('does not register for scroll events when isScrollCollect configuration is false', function () {
            const messageBusSubscribeSpy = this.sandbox.spy(this._messageBus, 'subscribe');

            this.configurationRepositoryStub.get.withArgs(ConfigurationFields.isScrollCollect).returns(false);

            this.windowEventCollector.startFeature(this._browserContext);

            assert.isTrue(this.resizeEventEmitterStub.start.calledOnce);
            assert.isTrue(this.resizeEventEmitterStub.start.firstCall.args[0] === window.self);
            assert.isTrue(this.focusEventEmitterStub.start.calledOnce);
            assert.isTrue(this.focusEventEmitterStub.start.firstCall.args[0] === window.self);
            assert.isTrue(this.blurEventEmitterStub.start.calledOnce);
            assert.isTrue(this.blurEventEmitterStub.start.firstCall.args[0] === window.self);
            assert.isTrue(this.domContentLoadedEventEmitterStub.start.calledOnce);
            assert.isTrue(this.domContentLoadedEventEmitterStub.start.firstCall.args[0] === window.self.document);
            assert.isTrue(this.visibilityChangeEventEmitterStub.start.calledOnce);
            assert.isTrue(this.visibilityChangeEventEmitterStub.start.firstCall.args[0] === window.self.document);

            // Scroll emitter is not started because configuration is disabled
            assert.isTrue(this.scrollEventEmitterStub.start.notCalled);

            assert.equal(messageBusSubscribeSpy.callCount, 5);
            assert.equal(messageBusSubscribeSpy.firstCall.args[0], MessageBusEventType.ResizeEvent);
            assert.equal(messageBusSubscribeSpy.firstCall.args[1], this.windowEventCollector._onWindowEvent);
            assert.equal(messageBusSubscribeSpy.secondCall.args[0], MessageBusEventType.FocusEvent);
            assert.equal(messageBusSubscribeSpy.secondCall.args[1], this.windowEventCollector._onWindowEvent);
            assert.equal(messageBusSubscribeSpy.thirdCall.args[0], MessageBusEventType.BlurEvent);
            assert.equal(messageBusSubscribeSpy.thirdCall.args[1], this.windowEventCollector._onWindowEvent);
            assert.equal(messageBusSubscribeSpy.getCall(3).args[0], MessageBusEventType.DOMContentLoadedEvent);
            assert.equal(messageBusSubscribeSpy.getCall(3).args[1], this.windowEventCollector._onWindowEvent);
            assert.equal(messageBusSubscribeSpy.getCall(4).args[0], MessageBusEventType.VisibilityChangeEvent);
            assert.equal(messageBusSubscribeSpy.getCall(4).args[1], this.windowEventCollector._onWindowEvent);
        });
    });

    describe('stop tests:', function () {
        it('stop unregisters the listeners for the window events', function () {
            const messageBusUnsubscribeSpy = this.sandbox.spy(this._messageBus, 'unsubscribe');

            this.windowEventCollector.stopFeature(this._browserContext);

            assert.isTrue(this.resizeEventEmitterStub.stop.calledOnce);
            assert.isTrue(this.resizeEventEmitterStub.stop.firstCall.args[0] === window);
            assert.isTrue(this.focusEventEmitterStub.stop.calledOnce);
            assert.isTrue(this.focusEventEmitterStub.stop.firstCall.args[0] === window);
            assert.isTrue(this.blurEventEmitterStub.stop.calledOnce);
            assert.isTrue(this.blurEventEmitterStub.stop.firstCall.args[0] === window);
            assert.isTrue(this.domContentLoadedEventEmitterStub.stop.calledOnce);
            assert.isTrue(this.domContentLoadedEventEmitterStub.stop.firstCall.args[0] === window.document);
            assert.isTrue(this.visibilityChangeEventEmitterStub.stop.calledOnce);
            assert.isTrue(this.visibilityChangeEventEmitterStub.stop.firstCall.args[0] === window.document);
            assert.isTrue(this.scrollEventEmitterStub.stop.calledOnce);
            assert.isTrue(this.scrollEventEmitterStub.stop.firstCall.args[0] === window);

            assert.equal(messageBusUnsubscribeSpy.callCount, 6);
            assert.equal(messageBusUnsubscribeSpy.firstCall.args[0], MessageBusEventType.ResizeEvent);
            assert.equal(messageBusUnsubscribeSpy.firstCall.args[1], this.windowEventCollector._onWindowEvent);
            assert.equal(messageBusUnsubscribeSpy.secondCall.args[0], MessageBusEventType.FocusEvent);
            assert.equal(messageBusUnsubscribeSpy.secondCall.args[1], this.windowEventCollector._onWindowEvent);
            assert.equal(messageBusUnsubscribeSpy.thirdCall.args[0], MessageBusEventType.BlurEvent);
            assert.equal(messageBusUnsubscribeSpy.thirdCall.args[1], this.windowEventCollector._onWindowEvent);
            assert.equal(messageBusUnsubscribeSpy.getCall(3).args[0], MessageBusEventType.DOMContentLoadedEvent);
            assert.equal(messageBusUnsubscribeSpy.getCall(3).args[1], this.windowEventCollector._onWindowEvent);
            assert.equal(messageBusUnsubscribeSpy.getCall(4).args[0], MessageBusEventType.VisibilityChangeEvent);
            assert.equal(messageBusUnsubscribeSpy.getCall(4).args[1], this.windowEventCollector._onWindowEvent);
            assert.equal(messageBusUnsubscribeSpy.getCall(5).args[0], MessageBusEventType.ScrollEvent);
            assert.equal(messageBusUnsubscribeSpy.getCall(5).args[1], this.windowEventCollector._onWindowEvent);
        });

        it('uses window.self as window object if parameter is null', function () {
            const messageBusUnsubscribeSpy = this.sandbox.spy(this._messageBus, 'unsubscribe');

            this.windowEventCollector.stopFeature(new BrowserContext(null));

            assert.isTrue(this.resizeEventEmitterStub.stop.calledOnce);
            assert.isTrue(this.resizeEventEmitterStub.stop.firstCall.args[0] === window.self);
            assert.isTrue(this.focusEventEmitterStub.stop.calledOnce);
            assert.isTrue(this.focusEventEmitterStub.stop.firstCall.args[0] === window.self);
            assert.isTrue(this.blurEventEmitterStub.stop.calledOnce);
            assert.isTrue(this.blurEventEmitterStub.stop.firstCall.args[0] === window.self);
            assert.isTrue(this.domContentLoadedEventEmitterStub.stop.calledOnce);
            assert.isTrue(this.domContentLoadedEventEmitterStub.stop.firstCall.args[0] === window.self.document);
            assert.isTrue(this.visibilityChangeEventEmitterStub.stop.calledOnce);
            assert.isTrue(this.visibilityChangeEventEmitterStub.stop.firstCall.args[0] === window.self.document);
            assert.isTrue(this.scrollEventEmitterStub.stop.calledOnce);
            assert.isTrue(this.scrollEventEmitterStub.stop.firstCall.args[0] === window.self);

            assert.equal(messageBusUnsubscribeSpy.callCount, 6);
            assert.equal(messageBusUnsubscribeSpy.firstCall.args[0], MessageBusEventType.ResizeEvent);
            assert.equal(messageBusUnsubscribeSpy.firstCall.args[1], this.windowEventCollector._onWindowEvent);
            assert.equal(messageBusUnsubscribeSpy.secondCall.args[0], MessageBusEventType.FocusEvent);
            assert.equal(messageBusUnsubscribeSpy.secondCall.args[1], this.windowEventCollector._onWindowEvent);
            assert.equal(messageBusUnsubscribeSpy.thirdCall.args[0], MessageBusEventType.BlurEvent);
            assert.equal(messageBusUnsubscribeSpy.thirdCall.args[1], this.windowEventCollector._onWindowEvent);
            assert.equal(messageBusUnsubscribeSpy.getCall(3).args[0], MessageBusEventType.DOMContentLoadedEvent);
            assert.equal(messageBusUnsubscribeSpy.getCall(3).args[1], this.windowEventCollector._onWindowEvent);
            assert.equal(messageBusUnsubscribeSpy.getCall(4).args[0], MessageBusEventType.VisibilityChangeEvent);
            assert.equal(messageBusUnsubscribeSpy.getCall(4).args[1], this.windowEventCollector._onWindowEvent);
            assert.equal(messageBusUnsubscribeSpy.getCall(5).args[0], MessageBusEventType.ScrollEvent);
            assert.equal(messageBusUnsubscribeSpy.getCall(5).args[1], this.windowEventCollector._onWindowEvent);
        });

        it('uses window.self as window object if parameter is undefined', function () {
            const messageBusUnsubscribeSpy = this.sandbox.spy(this._messageBus, 'unsubscribe');

            this.windowEventCollector.stopFeature(new BrowserContext(null));

            assert.isTrue(this.resizeEventEmitterStub.stop.calledOnce);
            assert.isTrue(this.resizeEventEmitterStub.stop.firstCall.args[0] === window.self);
            assert.isTrue(this.focusEventEmitterStub.stop.calledOnce);
            assert.isTrue(this.focusEventEmitterStub.stop.firstCall.args[0] === window.self);
            assert.isTrue(this.blurEventEmitterStub.stop.calledOnce);
            assert.isTrue(this.blurEventEmitterStub.stop.firstCall.args[0] === window.self);
            assert.isTrue(this.domContentLoadedEventEmitterStub.stop.calledOnce);
            assert.isTrue(this.domContentLoadedEventEmitterStub.stop.firstCall.args[0] === window.self.document);
            assert.isTrue(this.visibilityChangeEventEmitterStub.stop.calledOnce);
            assert.isTrue(this.visibilityChangeEventEmitterStub.stop.firstCall.args[0] === window.self.document);
            assert.isTrue(this.scrollEventEmitterStub.stop.calledOnce);
            assert.isTrue(this.scrollEventEmitterStub.stop.firstCall.args[0] === window.self);

            assert.equal(messageBusUnsubscribeSpy.callCount, 6);
            assert.equal(messageBusUnsubscribeSpy.firstCall.args[0], MessageBusEventType.ResizeEvent);
            assert.equal(messageBusUnsubscribeSpy.firstCall.args[1], this.windowEventCollector._onWindowEvent);
            assert.equal(messageBusUnsubscribeSpy.secondCall.args[0], MessageBusEventType.FocusEvent);
            assert.equal(messageBusUnsubscribeSpy.secondCall.args[1], this.windowEventCollector._onWindowEvent);
            assert.equal(messageBusUnsubscribeSpy.thirdCall.args[0], MessageBusEventType.BlurEvent);
            assert.equal(messageBusUnsubscribeSpy.thirdCall.args[1], this.windowEventCollector._onWindowEvent);
            assert.equal(messageBusUnsubscribeSpy.getCall(3).args[0], MessageBusEventType.DOMContentLoadedEvent);
            assert.equal(messageBusUnsubscribeSpy.getCall(3).args[1], this.windowEventCollector._onWindowEvent);
            assert.equal(messageBusUnsubscribeSpy.getCall(4).args[0], MessageBusEventType.VisibilityChangeEvent);
            assert.equal(messageBusUnsubscribeSpy.getCall(4).args[1], this.windowEventCollector._onWindowEvent);
            assert.equal(messageBusUnsubscribeSpy.getCall(5).args[0], MessageBusEventType.ScrollEvent);
            assert.equal(messageBusUnsubscribeSpy.getCall(5).args[1], this.windowEventCollector._onWindowEvent);
        });

        it('does not unregister from scroll events when isScrollCollect configuration is false', function () {
            const messageBusUnsubscribeSpy = this.sandbox.spy(this._messageBus, 'unsubscribe');

            this.configurationRepositoryStub.get.withArgs(ConfigurationFields.isScrollCollect).returns(false);

            this.windowEventCollector.stopFeature(this._browserContext);

            assert.isTrue(this.resizeEventEmitterStub.stop.calledOnce);
            assert.isTrue(this.resizeEventEmitterStub.stop.firstCall.args[0] === window.self);
            assert.isTrue(this.focusEventEmitterStub.stop.calledOnce);
            assert.isTrue(this.focusEventEmitterStub.stop.firstCall.args[0] === window.self);
            assert.isTrue(this.blurEventEmitterStub.stop.calledOnce);
            assert.isTrue(this.blurEventEmitterStub.stop.firstCall.args[0] === window.self);
            assert.isTrue(this.domContentLoadedEventEmitterStub.stop.calledOnce);
            assert.isTrue(this.domContentLoadedEventEmitterStub.stop.firstCall.args[0] === window.self.document);
            assert.isTrue(this.visibilityChangeEventEmitterStub.stop.calledOnce);
            assert.isTrue(this.visibilityChangeEventEmitterStub.stop.firstCall.args[0] === window.self.document);

            // Scroll emitter is not started because configuration is disabled
            assert.isTrue(this.scrollEventEmitterStub.stop.notCalled);

            assert.equal(messageBusUnsubscribeSpy.callCount, 5);
            assert.equal(messageBusUnsubscribeSpy.firstCall.args[0], MessageBusEventType.ResizeEvent);
            assert.equal(messageBusUnsubscribeSpy.firstCall.args[1], this.windowEventCollector._onWindowEvent);
            assert.equal(messageBusUnsubscribeSpy.secondCall.args[0], MessageBusEventType.FocusEvent);
            assert.equal(messageBusUnsubscribeSpy.secondCall.args[1], this.windowEventCollector._onWindowEvent);
            assert.equal(messageBusUnsubscribeSpy.thirdCall.args[0], MessageBusEventType.BlurEvent);
            assert.equal(messageBusUnsubscribeSpy.thirdCall.args[1], this.windowEventCollector._onWindowEvent);
            assert.equal(messageBusUnsubscribeSpy.getCall(3).args[0], MessageBusEventType.DOMContentLoadedEvent);
            assert.equal(messageBusUnsubscribeSpy.getCall(3).args[1], this.windowEventCollector._onWindowEvent);
            assert.equal(messageBusUnsubscribeSpy.getCall(4).args[0], MessageBusEventType.VisibilityChangeEvent);
            assert.equal(messageBusUnsubscribeSpy.getCall(4).args[1], this.windowEventCollector._onWindowEvent);
        });
    });

    describe('updateFeatureConfig tests:', function () {
        it('updating the isScrollCollect configuration to false will stop scroll events collection', function () {
            const messageBusUnsubscribeSpy = this.sandbox.spy(this._messageBus, 'unsubscribe');

            this.configurationRepositoryStub.get.withArgs(ConfigurationFields.isScrollCollect).returns(false);

            this.windowEventCollector.updateFeatureConfig(this._browserContext);

            assert.isTrue(this.scrollEventEmitterStub.stop.calledOnce);
            assert.isTrue(this.scrollEventEmitterStub.stop.firstCall.args[0] === window.self);

            assert.equal(messageBusUnsubscribeSpy.firstCall.args[0], MessageBusEventType.ScrollEvent);
            assert.equal(messageBusUnsubscribeSpy.firstCall.args[1], this.windowEventCollector._onWindowEvent);
        });

        it('updating the isScrollCollect configuration to true will start scroll events collection', function () {
            const messageBusSubscribeSpy = this.sandbox.spy(this._messageBus, 'subscribe');

            this.configurationRepositoryStub.get.withArgs(ConfigurationFields.isScrollCollect).returns(true);

            this.windowEventCollector.updateFeatureConfig(this._browserContext);

            assert.isTrue(this.scrollEventEmitterStub.start.calledOnce);
            assert.isTrue(this.scrollEventEmitterStub.start.firstCall.args[0] === window.self);

            assert.equal(messageBusSubscribeSpy.firstCall.args[0], MessageBusEventType.ScrollEvent);
            assert.equal(messageBusSubscribeSpy.firstCall.args[1], this.windowEventCollector._onWindowEvent);
        });

        it('updating the isScrollCollect configuration to false with a null window parameter will stop scroll events collection', function () {
            const messageBusUnsubscribeSpy = this.sandbox.spy(this._messageBus, 'unsubscribe');

            this.configurationRepositoryStub.get.withArgs(ConfigurationFields.isScrollCollect).returns(false);

            this.windowEventCollector.updateFeatureConfig(new BrowserContext(null));

            assert.isTrue(this.scrollEventEmitterStub.stop.calledOnce);
            assert.isTrue(this.scrollEventEmitterStub.stop.firstCall.args[0] === window.self);

            assert.equal(messageBusUnsubscribeSpy.firstCall.args[0], MessageBusEventType.ScrollEvent);
            assert.equal(messageBusUnsubscribeSpy.firstCall.args[1], this.windowEventCollector._onWindowEvent);
        });

        it('updating the isScrollCollect configuration to true with a null window parameter will start scroll events collection', function () {
            const messageBusSubscribeSpy = this.sandbox.spy(this._messageBus, 'subscribe');

            this.configurationRepositoryStub.get.withArgs(ConfigurationFields.isScrollCollect).returns(true);

            this.windowEventCollector.updateFeatureConfig(new BrowserContext(null));

            assert.isTrue(this.scrollEventEmitterStub.start.calledOnce);
            assert.isTrue(this.scrollEventEmitterStub.start.firstCall.args[0] === window.self);

            assert.equal(messageBusSubscribeSpy.firstCall.args[0], MessageBusEventType.ScrollEvent);
            assert.equal(messageBusSubscribeSpy.firstCall.args[1], this.windowEventCollector._onWindowEvent);
        });

        it('updating the isScrollCollect configuration to false with an undefined window parameter will stop scroll events collection', function () {
            const messageBusUnsubscribeSpy = this.sandbox.spy(this._messageBus, 'unsubscribe');

            this.configurationRepositoryStub.get.withArgs(ConfigurationFields.isScrollCollect).returns(false);

            this.windowEventCollector.updateFeatureConfig(new BrowserContext(null));

            assert.isTrue(this.scrollEventEmitterStub.stop.calledOnce);
            assert.isTrue(this.scrollEventEmitterStub.stop.firstCall.args[0] === window.self);

            assert.equal(messageBusUnsubscribeSpy.firstCall.args[0], MessageBusEventType.ScrollEvent);
            assert.equal(messageBusUnsubscribeSpy.firstCall.args[1], this.windowEventCollector._onWindowEvent);
        });

        it('updating the isScrollCollect configuration to true with an undefined window parameter will start scroll events collection', function () {
            const messageBusSubscribeSpy = this.sandbox.spy(this._messageBus, 'subscribe');

            this.configurationRepositoryStub.get.withArgs(ConfigurationFields.isScrollCollect).returns(true);

            this.windowEventCollector.updateFeatureConfig(new BrowserContext(null));

            assert.isTrue(this.scrollEventEmitterStub.start.calledOnce);
            assert.isTrue(this.scrollEventEmitterStub.start.firstCall.args[0] === window.self);

            assert.equal(messageBusSubscribeSpy.firstCall.args[0], MessageBusEventType.ScrollEvent);
            assert.equal(messageBusSubscribeSpy.firstCall.args[1], this.windowEventCollector._onWindowEvent);
        });
    });
});
