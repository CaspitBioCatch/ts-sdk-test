import { assert } from 'chai';
import DeviceOrientationCollector, { DeviceOrientationType } from '../../../../../src/main/collectors/events/DeviceOrientationCollector';
import CDUtils from '../../../../../src/main/technicalServices/CDUtils';
import { EventStructure as DeviceOrientationEventStructure } from '../../../../../src/main/collectors/events/DeviceOrientationCollector';
import TestBrowserUtils from '../../../../TestBrowserUtils';
import SupportedBrowserVersions from '../../../../SupportedBrowserVersions';
import DataQ from '../../../../../src/main/technicalServices/DataQ';

describe('DeviceOrientationCollector tests:', function () {
    describe('Should execute DeviceOrientationCollector events on:', function () {
        beforeEach(function () {
            if (TestBrowserUtils.isEdge(window.navigator.userAgent.toLowerCase())
                || TestBrowserUtils.isIE11(window.navigator.userAgent.toLowerCase())
                || TestBrowserUtils.isFirefox(window.navigator.userAgent.toLowerCase(), SupportedBrowserVersions.FirefoxOldestSupportedVersion)
                || TestBrowserUtils.isChrome(window.navigator.userAgent.toLowerCase(), SupportedBrowserVersions.ChromeOldestSupportedVersion)) {
                this.skip();
                return;
            }

            this.sandbox = sinon.createSandbox();

            // Save the original screen object so we can get back to it incase it is changed in one of the tests
            this.originalScreen = window.screen;

            this.dataQ = this.sandbox.createStubInstance(DataQ);

            this.deviceOrientationCollector = new DeviceOrientationCollector(CDUtils, this.dataQ);

            // So we can control the timestamp
            this.datenow = this.sandbox.stub(this.deviceOrientationCollector, 'getEventTimestamp');
        });

        afterEach(function () {
            if (this.sandbox) {
                this.sandbox.restore();
            }

            if (this.originalScreen) {
                // noinspection JSAnnotator
                window.screen = this.originalScreen;
            }
        });

        [
            { initialType: 'landscape-secondary', type: 'portrait-primary' },
            { initialType: 'portrait-secondary', type: 'landscape-primary' },
            { initialType: 'landscape-primary', type: 'portrait-secondary' },
            { initialType: 'portrait-primary', type: 'landscape-secondary' },
        ].forEach(function (orientation) {
            it('orientation change should add event screen_orientation to Q', function () {
                // Assign a dummy orientation value so that the call toe the event trigger will actually send the event to the queue
                // noinspection JSAnnotator
                window.screen = { orientation: { type: orientation.initialType } };

                const timestamp = 1500802088519;
                this.datenow.returns(timestamp);

                this.deviceOrientationCollector.startFeature(self);

                // Make sure addToQueue is called once on start of feature
                assert.isTrue(this.dataQ.addToQueue.calledOnce, `addToQueue was not called once. It was called ${this.dataQ.addToQueue.callCount} times`);
                assert.equal('screen_orientation', this.dataQ.addToQueue.getCall(0).args[0], 'event is not screen_orientation');
                let data = this.dataQ.addToQueue.getCall(0).args[1];

                assert.notEqual(data[DeviceOrientationEventStructure.indexOf('eventSequence') + 1], -1,
                    'no eventSequence');
                assert.equal(data[DeviceOrientationEventStructure.indexOf('timestamp') + 1], timestamp);
                assert.equal(data[DeviceOrientationEventStructure.indexOf('orientation') + 1],
                    DeviceOrientationType[orientation.initialType]);

                // Change the orientation so we can make sure the value is changed and sent to the queue
                // noinspection JSAnnotator
                window.screen = { orientation: { type: orientation.type } };

                const e = { target: window };

                // "Trigger" the orientation change event
                this.deviceOrientationCollector._onDeviceOrientationEvent(e);

                // Make sure addToQueue is called twice (on start of feature and on orientation change)
                assert.isTrue(this.dataQ.addToQueue.calledTwice, 'addToQueue called more than twice');
                assert.equal('screen_orientation', this.dataQ.addToQueue.getCall(1).args[0], 'event is not screen_orientation');
                data = this.dataQ.addToQueue.getCall(1).args[1];

                assert.notEqual(data[DeviceOrientationEventStructure.indexOf('eventSequence') + 1], -1,
                    'no eventSequence');
                assert.equal(data[DeviceOrientationEventStructure.indexOf('timestamp') + 1], timestamp);
                assert.equal(data[DeviceOrientationEventStructure.indexOf('orientation') + 1],
                    DeviceOrientationType[orientation.type]);

                this.deviceOrientationCollector.stopFeature(self);
            });
        });

        it('feature start should add event screen_orientation to Q', function () {
            // noinspection JSAnnotator
            window.screen = { orientation: { type: 'landscape-secondary' } };

            const timestamp = 1500802088519;
            this.datenow.returns(timestamp);

            this.deviceOrientationCollector.startFeature(self);

            // Make sure addToQueue is called twice (on start of feature and on orientation change)
            assert.isTrue(this.dataQ.addToQueue.calledOnce, 'addToQueue called more than once');
            assert.equal('screen_orientation', this.dataQ.addToQueue.getCall(0).args[0], 'event is not screen_orientation');
            const data = this.dataQ.addToQueue.getCall(0).args[1];

            assert.notEqual(data[DeviceOrientationEventStructure.indexOf('eventSequence') + 1], -1,
                'no eventSequence');
            assert.equal(data[DeviceOrientationEventStructure.indexOf('timestamp') + 1], timestamp);
            assert.equal(data[DeviceOrientationEventStructure.indexOf('orientation') + 1],
                DeviceOrientationType['landscape-secondary']);

            this.deviceOrientationCollector.stopFeature(self);
        });

        [
            undefined,
            null,
            { target: undefined },
            { target: null },
        ].forEach(function (eventArgs) {
            it('orientation change event should handle invalid event args', function () {
                // Assign a dummy orientation value so that the call toe the event trigger will actually send the event to the queue
                // noinspection JSAnnotator
                window.screen = { orientation: { type: 'portrait-primary' } };

                const timestamp = 1500802088519;
                this.datenow.returns(timestamp);

                this.deviceOrientationCollector.startFeature(self);

                // Change the orientation so we can make sure the value is changed and sent to the queue
                // noinspection JSAnnotator
                window.screen = { orientation: { type: 'portrait-secondary' } };

                // "Trigger" the orientation change event
                this.deviceOrientationCollector._onDeviceOrientationEvent(eventArgs);

                // Make sure addToQueue is called twice (on start of feature and on orientation change)
                assert.isTrue(this.dataQ.addToQueue.calledTwice, 'addToQueue called more than twice');
                assert.equal('screen_orientation', this.dataQ.addToQueue.getCall(1).args[0], 'event is not screen_orientation');
                const data = this.dataQ.addToQueue.getCall(1).args[1];

                assert.notEqual(data[DeviceOrientationEventStructure.indexOf('eventSequence') + 1], -1,
                    'no eventSequence');
                assert.equal(data[DeviceOrientationEventStructure.indexOf('timestamp') + 1], timestamp);
                assert.equal(data[DeviceOrientationEventStructure.indexOf('orientation') + 1],
                    DeviceOrientationType['portrait-secondary']);

                this.deviceOrientationCollector.stopFeature(self);
            });
        });

        [
            { target: { screen: undefined, orientation: 'portrait-primary' } },
            { target: { screen: null, orientation: 'portrait-primary' } },
        ].forEach(function (eventArgs) {
            it('orientation change event should handle a screen target', function () {
                eventArgs.target.orientation = 'portrait-secondary';

                const timestamp = 1500802088519;
                this.datenow.returns(timestamp);

                // "Trigger" the orientation change event
                this.deviceOrientationCollector._onDeviceOrientationEvent(eventArgs);

                // Make sure addToQueue is called twice (on start of feature and on orientation change)
                assert.isTrue(this.dataQ.addToQueue.calledOnce, 'addToQueue called more than twice');
                assert.equal('screen_orientation', this.dataQ.addToQueue.getCall(0).args[0], 'event is not screen_orientation');
                const data = this.dataQ.addToQueue.getCall(0).args[1];

                assert.notEqual(data[DeviceOrientationEventStructure.indexOf('eventSequence') + 1], -1,
                    'no eventSequence');
                assert.equal(data[DeviceOrientationEventStructure.indexOf('timestamp') + 1], timestamp);
                assert.equal(data[DeviceOrientationEventStructure.indexOf('orientation') + 1],
                    DeviceOrientationType['portrait-secondary']);

                this.deviceOrientationCollector.stopFeature(self);
            });
        });

        [
            { target: { screen: undefined } },
            { target: { screen: null } },
        ].forEach(function (eventArgs) {
            it('orientation change handling should abort when orientation is unavailable', function () {
                // "Trigger" the orientation change event
                this.deviceOrientationCollector._onDeviceOrientationEvent(eventArgs);

                // Make sure addToQueue is called twice (on start of feature and on orientation change)
                assert.isTrue(this.dataQ.addToQueue.notCalled, 'addToQueue called but should not');

                this.deviceOrientationCollector.stopFeature(self);
            });
        });

        [
            { target: { screen: undefined, orientation: 'bob' } },
            { target: { screen: null, orientation: 'bob' } },
        ].forEach(function (eventArgs) {
            it('orientation change handling should abort when orientation type is unknown', function () {
                // "Trigger" the orientation change event
                this.deviceOrientationCollector._onDeviceOrientationEvent(eventArgs);

                // Make sure addToQueue is called twice (on start of feature and on orientation change)
                assert.isTrue(this.dataQ.addToQueue.notCalled, 'addToQueue called');

                this.deviceOrientationCollector.stopFeature(self);
            });
        });

        it('orientation change event should handle event args target which is a window object', function () {
            // Assign a dummy orientation value so that the call toe the event trigger will actually send the event to the queue
            // noinspection JSAnnotator
            window.screen = { orientation: { type: 'portrait-primary' } };

            const timestamp = 1500802088519;
            this.datenow.returns(timestamp);

            this.deviceOrientationCollector.startFeature(self);

            // Change the orientation so we can make sure the value is changed and sent to the queue
            // noinspection JSAnnotator
            window.screen = { orientation: { type: 'landscape-secondary' } };

            const eventArgs = { target: window };
            // "Trigger" the orientation change event
            this.deviceOrientationCollector._onDeviceOrientationEvent(eventArgs);

            // Make sure addToQueue is called twice (on start of feature and on orientation change)
            assert.isTrue(this.dataQ.addToQueue.calledTwice, 'addToQueue called more than twice');
            assert.equal('screen_orientation', this.dataQ.addToQueue.getCall(1).args[0], 'event is not screen_orientation');
            const data = this.dataQ.addToQueue.getCall(1).args[1];

            assert.notEqual(data[DeviceOrientationEventStructure.indexOf('eventSequence') + 1], -1,
                'no eventSequence');
            assert.equal(data[DeviceOrientationEventStructure.indexOf('timestamp') + 1], timestamp);
            assert.equal(data[DeviceOrientationEventStructure.indexOf('orientation') + 1],
                DeviceOrientationType['landscape-secondary']);

            this.deviceOrientationCollector.stopFeature(self);
        });

        it('orientation change event should handle event args target which is a screen object', function () {
            // Assign a dummy orientation value so that the call toe the event trigger will actually send the event to the queue
            // noinspection JSAnnotator
            window.screen = { orientation: { type: 'portrait-primary' } };

            const timestamp = 1500802088519;
            this.datenow.returns(timestamp);

            this.deviceOrientationCollector.startFeature(self);

            // Change the orientation so we can make sure the value is changed and sent to the queue
            // noinspection JSAnnotator
            window.screen = { orientation: { type: 'landscape-secondary' } };

            const eventArgs = { target: window.screen };
            // "Trigger" the orientation change event
            this.deviceOrientationCollector._onDeviceOrientationEvent(eventArgs);

            // Make sure addToQueue is called twice (on start of feature and on orientation change)
            assert.isTrue(this.dataQ.addToQueue.calledTwice, 'addToQueue called more than twice');
            assert.equal('screen_orientation', this.dataQ.addToQueue.getCall(1).args[0], 'event is not screen_orientation');
            const data = this.dataQ.addToQueue.getCall(1).args[1];

            assert.notEqual(data[DeviceOrientationEventStructure.indexOf('eventSequence') + 1], -1,
                'no eventSequence');
            assert.equal(data[DeviceOrientationEventStructure.indexOf('timestamp') + 1], timestamp);
            assert.equal(data[DeviceOrientationEventStructure.indexOf('orientation') + 1],
                DeviceOrientationType['landscape-secondary']);

            this.deviceOrientationCollector.stopFeature(self);
        });

        it('should not add second screen_orientation with same orientation value Q', function () {
            // Assign a dummy orientation value so that the call toe the event trigger will actually send the event to the queue
            // noinspection JSAnnotator
            window.screen = { orientation: { type: 'portrait-primary' } };

            this.deviceOrientationCollector.startFeature(self);

            // noinspection JSAnnotator
            window.screen = { orientation: { type: 'portrait-secondary' } };

            const timestamp = 1500804078519;
            this.datenow.returns(timestamp);
            this.deviceOrientationCollector._onDeviceOrientationEvent();
            this.deviceOrientationCollector._onDeviceOrientationEvent();

            assert.isTrue(this.dataQ.addToQueue.calledTwice, 'addToQueue called more than twice');
            assert.equal('screen_orientation', this.dataQ.addToQueue.getCall(1).args[0], 'event is not screen_orientation');
            const data = this.dataQ.addToQueue.getCall(1).args[1];

            assert.notEqual(data[DeviceOrientationEventStructure.indexOf('eventSequence') + 1], -1,
                'no eventSequence');
            assert.equal(data[DeviceOrientationEventStructure.indexOf('timestamp') + 1], timestamp);
            assert.equal(data[DeviceOrientationEventStructure.indexOf('orientation') + 1], 3);

            this.deviceOrientationCollector.stopFeature(self);
        });
    });
});
