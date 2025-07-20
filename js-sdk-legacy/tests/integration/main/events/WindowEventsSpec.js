import { assert } from 'chai';
import ConfigurationChanger from '../ConfigurationChanger';
import {
    EventStructure as WindowEventStructure,
    WindowEventType,
} from '../../../../src/main/collectors/events/WindowEventCollector';
import { TestUtils } from '../../../TestUtils';
import TestBrowserUtils from '../../../TestBrowserUtils';

describe('WindowEvents tests:', function () {
    this.retries(3);

    beforeEach(async function () {
        this.sandbox = sinon.createSandbox();
        const windowEvents = this.systemBootstrapper.getFeatureBuilder()._features.list.WindowEvents.instance;

        this._updateFeatureConfigSpy = this.sandbox.spy(windowEvents, 'updateFeatureConfig');

        ConfigurationChanger.change(this.systemBootstrapper, {
            isWindowEvents: true,
        });

        // Wait for the configuration update to apply on the feature
        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this._updateFeatureConfigSpy.called, 'Window events updateFeatureConfig function was not called');
        });
    });

    afterEach(function () {
        if (this.sandbox) {
            this.sandbox.restore();
        }
    });

    it('Focus event is sent to worker', async function () {
        // Window events are not supported in ie10
        if (TestBrowserUtils.isIE11(window.navigator.userAgent)) {
            this.skip();
            return;
        }

        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
        serverWorkerSendAsync.resetHistory();

        const e = document.createEvent('Event');
        e.initEvent('focus', true, true);
        window.dispatchEvent(e);
        TestUtils.verifyCallHappened(serverWorkerSendAsync, 'window_events', 'focus window event', function (data) {
            assert.equal(data[WindowEventStructure.indexOf('eventType') + 1],
                WindowEventType.focus, 'event type is not window focus');
            assert.exists(data[WindowEventStructure.indexOf('isTrusted') + 1], 'event type is not window isTrusted');
            assert.equal(data[WindowEventStructure.indexOf('screenWidth') + 1],
                screen.width ? Math.round(screen.width) : -1, 'event type is not window screenWidth');
            assert.equal(data[WindowEventStructure.indexOf('screenHeight') + 1],
                screen.width ? Math.round(screen.height) : -1, 'event type is not window screenHeight');
            assert.equal(data[WindowEventStructure.indexOf('clientWidth') + 1],
                window.innerWidth ? Math.round(window.innerWidth) : -1, 'event type is not window clientWidth');
            assert.equal(data[WindowEventStructure.indexOf('clientHeight') + 1],
                window.innerHeight ? Math.round(window.innerHeight) : -1, 'event type is not window clientHeight');
            assert.equal(data[WindowEventStructure.indexOf('scrollTop') + 1],
                document.body && document.body.scrollTop ? Math.round(document.body.scrollTop) : 0, 'event type is not window scrollTop');
            assert.equal(data[WindowEventStructure.indexOf('scrollLeft') + 1],
                document.body && document.body.scrollLeft ? Math.round(document.body.scrollLeft) : 0, 'event type is not window scrollLeft');
            assert.equal(data[WindowEventStructure.indexOf('windowInnerWidth') + 1],
                window.innerWidth ? Math.round(window.innerWidth) : -1, 'event type is not window windowInnerWidth');
            assert.equal(data[WindowEventStructure.indexOf('windowInnerHeight') + 1],
                window.innerHeight ? Math.round(window.innerHeight) : -1, 'event type is not window windowInnerHeight');
            assert.equal(data[WindowEventStructure.indexOf('windowOuterWidth') + 1],
                window.outerWidth ? Math.round(window.outerWidth) : -1, 'event type is not window windowOuterWidth');
            assert.equal(data[WindowEventStructure.indexOf('windowOuterHeight') + 1],
                window.outerHeight ? Math.round(window.outerHeight) : -1, 'event type is not window windowOuterHeight');
        });
    });

    it('Blur event is sent to worker', async function () {
        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
        serverWorkerSendAsync.resetHistory();

        const e = document.createEvent('Event');
        e.initEvent('blur', true, true);
        window.dispatchEvent(e);
        TestUtils.verifyCallHappened(serverWorkerSendAsync, 'window_events', 'blur window event', function (data) {
            assert.equal(data[WindowEventStructure.indexOf('eventType') + 1],
                WindowEventType.blur, 'event type is not window blur');
            assert.exists(data[WindowEventStructure.indexOf('isTrusted') + 1], 'event type is not window isTrusted');
            assert.equal(data[WindowEventStructure.indexOf('screenWidth') + 1],
                screen.width ? Math.round(screen.width) : -1, 'event type is not window screenWidth');
            assert.equal(data[WindowEventStructure.indexOf('screenHeight') + 1],
                screen.width ? Math.round(screen.height) : -1, 'event type is not window screenHeight');
            assert.equal(data[WindowEventStructure.indexOf('clientWidth') + 1],
                window.innerWidth ? Math.round(window.innerWidth) : -1, 'event type is not window clientWidth');
            assert.equal(data[WindowEventStructure.indexOf('clientHeight') + 1],
                window.innerHeight ? Math.round(window.innerHeight) : -1, 'event type is not window clientHeight');
            assert.equal(data[WindowEventStructure.indexOf('scrollTop') + 1],
                document.body && document.body.scrollTop ? Math.round(document.body.scrollTop) : 0, 'event type is not window scrollTop');
            assert.equal(data[WindowEventStructure.indexOf('scrollLeft') + 1],
                document.body && document.body.scrollLeft ? Math.round(document.body.scrollLeft) : 0, 'event type is not window scrollLeft');
            assert.equal(data[WindowEventStructure.indexOf('windowInnerWidth') + 1],
                window.innerWidth ? Math.round(window.innerWidth) : -1, 'event type is not window windowInnerWidth');
            assert.equal(data[WindowEventStructure.indexOf('windowInnerHeight') + 1],
                window.innerHeight ? Math.round(window.innerHeight) : -1, 'event type is not window windowInnerHeight');
            assert.equal(data[WindowEventStructure.indexOf('windowOuterWidth') + 1],
                window.outerWidth ? Math.round(window.outerWidth) : -1, 'event type is not window windowOuterWidth');
            assert.equal(data[WindowEventStructure.indexOf('windowOuterHeight') + 1],
                window.outerHeight ? Math.round(window.outerHeight) : -1, 'event type is not window windowOuterHeight');
        });
    });

    it('Resize event is sent to worker', async function () {
        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
        serverWorkerSendAsync.resetHistory();
        const e = document.createEvent('Event');
        e.initEvent('resize', true, true);
        window.dispatchEvent(e);

        TestUtils.verifyCallHappened(serverWorkerSendAsync, 'window_events', 'resize window event', function (data) {
            assert.equal(data[WindowEventStructure.indexOf('eventType') + 1],
                WindowEventType.resize, 'event type is not window resize');
            assert.exists(data[WindowEventStructure.indexOf('isTrusted') + 1], 'event type is not window isTrusted');
            assert.equal(data[WindowEventStructure.indexOf('screenWidth') + 1],
                screen.width ? Math.round(screen.width) : -1, 'event type is not window screenWidth');
            assert.equal(data[WindowEventStructure.indexOf('screenHeight') + 1],
                screen.width ? Math.round(screen.height) : -1, 'event type is not window screenHeight');
            assert.equal(data[WindowEventStructure.indexOf('clientWidth') + 1],
                window.innerWidth ? Math.round(window.innerWidth) : -1, 'event type is not window clientWidth');
            assert.equal(data[WindowEventStructure.indexOf('clientHeight') + 1],
                window.innerHeight ? Math.round(window.innerHeight) : -1, 'event type is not window clientHeight');
            assert.equal(data[WindowEventStructure.indexOf('scrollTop') + 1],
                document.body && document.body.scrollTop ? Math.round(document.body.scrollTop) : 0, 'event type is not window scrollTop');
            assert.equal(data[WindowEventStructure.indexOf('scrollLeft') + 1],
                document.body && document.body.scrollLeft ? Math.round(document.body.scrollLeft) : 0, 'event type is not window scrollLeft');
            assert.equal(data[WindowEventStructure.indexOf('windowInnerWidth') + 1],
                window.innerWidth ? Math.round(window.innerWidth) : -1, 'event type is not window windowInnerWidth');
            assert.equal(data[WindowEventStructure.indexOf('windowInnerHeight') + 1],
                window.innerHeight ? Math.round(window.innerHeight) : -1, 'event type is not window windowInnerHeight');
            assert.equal(data[WindowEventStructure.indexOf('windowOuterWidth') + 1],
                window.outerWidth ? Math.round(window.outerWidth) : -1, 'event type is not window windowOuterWidth');
            assert.equal(data[WindowEventStructure.indexOf('windowOuterHeight') + 1],
                window.outerHeight ? Math.round(window.outerHeight) : -1, 'event type is not window windowOuterHeight');
        });
    });

    it('Visibility Change event is sent to worker', async function () {
        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
        serverWorkerSendAsync.resetHistory();
        const e = document.createEvent('Event');
        e.initEvent('visibilitychange', true, true);
        document.dispatchEvent(e);
        TestUtils.verifyCallHappened(serverWorkerSendAsync, 'window_events', 'visibilitychange window event', function (data) {
            assert.oneOf(data[WindowEventStructure.indexOf('eventType') + 1],
                [WindowEventType.tabFocus, WindowEventType.tabBlur], 'event type is not window visibilitychange');
            assert.exists(data[WindowEventStructure.indexOf('isTrusted') + 1], 'event type is not window isTrusted');
            assert.equal(data[WindowEventStructure.indexOf('screenWidth') + 1],
                screen.width ? Math.round(screen.width) : -1, 'event type is not window screenWidth');
            assert.equal(data[WindowEventStructure.indexOf('screenHeight') + 1],
                screen.width ? Math.round(screen.height) : -1, 'event type is not window screenHeight');
            assert.equal(data[WindowEventStructure.indexOf('clientWidth') + 1],
                window.innerWidth ? Math.round(window.innerWidth) : -1, 'event type is not window clientWidth');
            assert.equal(data[WindowEventStructure.indexOf('clientHeight') + 1],
                window.innerHeight ? Math.round(window.innerHeight) : -1, 'event type is not window clientHeight');
            assert.equal(data[WindowEventStructure.indexOf('scrollTop') + 1],
                document.body && document.body.scrollTop ? Math.round(document.body.scrollTop) : 0, 'event type is not window scrollTop');
            assert.equal(data[WindowEventStructure.indexOf('scrollLeft') + 1],
                document.body && document.body.scrollLeft ? Math.round(document.body.scrollLeft) : 0, 'event type is not window scrollLeft');
            assert.equal(data[WindowEventStructure.indexOf('windowInnerWidth') + 1],
                window.innerWidth ? Math.round(window.innerWidth) : -1, 'event type is not window windowInnerWidth');
            assert.equal(data[WindowEventStructure.indexOf('windowInnerHeight') + 1],
                window.innerHeight ? Math.round(window.innerHeight) : -1, 'event type is not window windowInnerHeight');
            assert.equal(data[WindowEventStructure.indexOf('windowOuterWidth') + 1],
                window.outerWidth ? Math.round(window.outerWidth) : -1, 'event type is not window windowOuterWidth');
            assert.equal(data[WindowEventStructure.indexOf('windowOuterHeight') + 1],
                window.outerHeight ? Math.round(window.outerHeight) : -1, 'event type is not window windowOuterHeight');
        });
    });

    it('Scroll event is sent to worker', async function () {
        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
        serverWorkerSendAsync.resetHistory();

        const e = document.createEvent('Event');
        e.initEvent('scroll', true, true);
        window.dispatchEvent(e);
        TestUtils.verifyCallHappened(serverWorkerSendAsync, 'window_events', 'scroll window event', function (data) {
            assert.equal(data[WindowEventStructure.indexOf('eventType') + 1],
                WindowEventType.scroll, 'event type is not window scroll');
            assert.exists(data[WindowEventStructure.indexOf('isTrusted') + 1], 'event type is not window isTrusted');
            assert.equal(data[WindowEventStructure.indexOf('screenWidth') + 1],
                screen.width ? Math.round(screen.width) : -1, 'event type is not window screenWidth');
            assert.equal(data[WindowEventStructure.indexOf('screenHeight') + 1],
                screen.width ? Math.round(screen.height) : -1, 'event type is not window screenHeight');
            assert.equal(data[WindowEventStructure.indexOf('clientWidth') + 1],
                window.innerWidth ? Math.round(window.innerWidth) : -1, 'event type is not window clientWidth');
            assert.equal(data[WindowEventStructure.indexOf('clientHeight') + 1],
                window.innerHeight ? Math.round(window.innerHeight) : -1, 'event type is not window clientHeight');
            assert.equal(data[WindowEventStructure.indexOf('scrollTop') + 1],
                document.body && document.body.scrollTop ? Math.round(document.body.scrollTop) : 0, 'event type is not window scrollTop');
            assert.equal(data[WindowEventStructure.indexOf('scrollLeft') + 1],
                document.body && document.body.scrollLeft ? Math.round(document.body.scrollLeft) : 0, 'event type is not window scrollLeft');
            assert.equal(data[WindowEventStructure.indexOf('windowInnerWidth') + 1],
                window.innerWidth ? Math.round(window.innerWidth) : -1, 'event type is not window windowInnerWidth');
            assert.equal(data[WindowEventStructure.indexOf('windowInnerHeight') + 1],
                window.innerHeight ? Math.round(window.innerHeight) : -1, 'event type is not window windowInnerHeight');
            assert.equal(data[WindowEventStructure.indexOf('windowOuterWidth') + 1],
                window.outerWidth ? Math.round(window.outerWidth) : -1, 'event type is not window windowOuterWidth');
            assert.equal(data[WindowEventStructure.indexOf('windowOuterHeight') + 1],
                window.outerHeight ? Math.round(window.outerHeight) : -1, 'event type is not window windowOuterHeight');
        });
    });

    it('Multiple window events are sent to worker', async function () {
        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

        serverWorkerSendAsync.resetHistory();
        const e = document.createEvent('Event');
        e.initEvent('resize', true, true);
        window.dispatchEvent(e);

        TestUtils.verifyCallHappened(serverWorkerSendAsync, 'window_events', 'resize window event', function (data) {
            assert.equal(data[WindowEventStructure.indexOf('eventType') + 1],
                WindowEventType.resize, 'event type is not window resize');
        });

        serverWorkerSendAsync.resetHistory();
        const e2 = document.createEvent('Event');
        e2.initEvent('focus', true, true);
        window.dispatchEvent(e2);
        TestUtils.verifyCallHappened(serverWorkerSendAsync, 'window_events', 'focus window event', function (data) {
            assert.equal(data[WindowEventStructure.indexOf('eventType') + 1],
                WindowEventType.focus, 'event type is not window focus');
        });

        serverWorkerSendAsync.resetHistory();
        const e3 = document.createEvent('Event');
        e3.initEvent('scroll', true, true);
        window.dispatchEvent(e3);
        TestUtils.verifyCallHappened(serverWorkerSendAsync, 'window_events', 'scroll window event', function (data) {
            assert.equal(data[WindowEventStructure.indexOf('eventType') + 1],
                WindowEventType.scroll, 'event type is not window scroll');
        });

        serverWorkerSendAsync.resetHistory();
        const e4 = document.createEvent('Event');
        e4.initEvent('visibilitychange', true, true);
        document.dispatchEvent(e4);
        TestUtils.verifyCallHappened(serverWorkerSendAsync, 'window_events', 'visibilitychange window event', function (data) {
            assert.oneOf(data[WindowEventStructure.indexOf('eventType') + 1],
                [WindowEventType.tabFocus, WindowEventType.tabBlur], 'event type is not window visibilitychange');
        });

        serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
    });
});
