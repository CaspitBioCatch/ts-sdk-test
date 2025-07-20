import { assert } from 'chai';
import MessageBus from '../../../../../src/main/technicalServices/MessageBus';
import OrientationEventsCollector from '../../../../../src/main/collectors/events/OrientationEventCollector';
import ConfigurationRepository from '../../../../../src/main/core/configuration/ConfigurationRepository';
import { MockObjects } from '../../../mocks/mockObjects';
import { EventStructure as OrientationEventStructure } from '../../../../../src/main/collectors/events/OrientationEventCollector';
import { MessageBusEventType } from '../../../../../src/main/events/MessageBusEventType';
import TestBrowserUtils from '../../../../TestBrowserUtils';
import DeviceOrientationEventEmitter from '../../../../../src/main/emitters/DeviceOrientationEventEmitter';
import DataQ from '../../../../../src/main/technicalServices/DataQ';
import { ConfigurationFields } from '../../../../../src/main/core/configuration/ConfigurationFields';

describe('OrientationEventCollector Tests:', function () {
    beforeEach(function () {
        if (TestBrowserUtils.isDesktopSafari(window.navigator.userAgent)) {
            this.skip();
            return;
        }

        this._messageBus = new MessageBus();

        this.sandbox = sinon.createSandbox();

        this._deviceOrientationEventEmitterStub = this.sandbox.createStubInstance(DeviceOrientationEventEmitter);

        this.dataQ = this.sandbox.createStubInstance(DataQ);
        this.configurationRepository = this.sandbox.stub(new ConfigurationRepository());
        this.configurationRepository.get.withArgs(ConfigurationFields.orientationEventsThreshold).returns(0.5);
        this.configurationRepository.get.withArgs(ConfigurationFields.orientationEventsSamplePeriod).returns(1000);
        this.cdUtils = this.sandbox.stub(MockObjects.cdUtils);

        this._orientationEvents = new OrientationEventsCollector(
            this.configurationRepository,
            this.cdUtils,
            this.dataQ,
            this._messageBus,
            this._deviceOrientationEventEmitterStub,
        );
    });

    afterEach(function () {
        if (this.sandbox) {
            this.sandbox.restore();
        }
    });

    it('Should send an orientation event', function () {
        this._orientationEvents.startFeature(self);
        const e = {
            type: 'deviceorientation',
            absolute: true,
            alpha: 184.0723,
            beta: 17.5789,
            gamma: -11.8580,
        };

        this.cdUtils.dateNow.returns(1500802087319);
        this.cdUtils.cutDecimalPointDigits.onCall(0).returns(184.0723);
        this.cdUtils.cutDecimalPointDigits.onCall(1).returns(17.5789);
        this.cdUtils.cutDecimalPointDigits.onCall(2).returns(-11.8580);
        this.cdUtils.cutDecimalPointDigits.returns(100);
        this._messageBus.publish(MessageBusEventType.DeviceOrientationEvent, e);

        assert.equal(3, this.cdUtils.cutDecimalPointDigits.getCalls().length, 'cutDecimalPointDigits was not called as expected');
        assert.isTrue(this.dataQ.addToQueue.calledOnce, 'addToQueue called more than once');
        assert.equal('orientation_events', this.dataQ.addToQueue.getCall(0).args[0], 'event is not orientation_events');
        const data = this.dataQ.addToQueue.getCall(0).args[1];

        assert.notEqual(data[OrientationEventStructure.indexOf('eventSequence') + 1], -1,
            'no eventSequence');
        assert.equal(data[OrientationEventStructure.indexOf('absolute') + 1], true, 'expected to be != 0');
        assert.equal(data[OrientationEventStructure.indexOf('alpha') + 1], 184.0723, 'expected to be != 0');
        assert.equal(data[OrientationEventStructure.indexOf('beta') + 1], 17.5789, 'expected to be != 0');
        assert.equal(data[OrientationEventStructure.indexOf('gamma') + 1], -11.8580, 'expected to be != 0');
        this._orientationEvents.stopFeature(self);
    });

    it('should change configuration onConfigUpdate', function () {
        this.configurationRepository.get.withArgs(ConfigurationFields.orientationEventsSamplePeriod).returns(undefined);

        this._orientationEvents.updateFeatureConfig();

        this.configurationRepository.get.withArgs(ConfigurationFields.orientationEventsSamplePeriod).returns(1000);

        this._orientationEvents.updateFeatureConfig();

        this._orientationEvents.startFeature(self);
        const e = {
            type: 'deviceorientation',
            absolute: true,
            alpha: 184.0723,
            beta: 17.5789,
            gamma: -11.8580,
        };

        this.cdUtils.dateNow.returns(1500802087319);
        this.cdUtils.cutDecimalPointDigits.onCall(0).returns(184.0723);
        this.cdUtils.cutDecimalPointDigits.onCall(1).returns(17.5789);
        this.cdUtils.cutDecimalPointDigits.onCall(2).returns(-11.8580);
        this.cdUtils.cutDecimalPointDigits.returns(100);
        this._messageBus.publish(MessageBusEventType.DeviceOrientationEvent, e);

        assert.equal(3, this.cdUtils.cutDecimalPointDigits.getCalls().length, 'cutDecimalPointDigits was not called as expected');
        assert.isTrue(this.dataQ.addToQueue.calledOnce, 'addToQueue called more than once');
        assert.equal('orientation_events', this.dataQ.addToQueue.getCall(0).args[0], 'event is not orientation_events');
        const data = this.dataQ.addToQueue.getCall(0).args[1];

        assert.notEqual(data[OrientationEventStructure.indexOf('eventSequence') + 1], -1,
            'no eventSequence');
        assert.equal(data[OrientationEventStructure.indexOf('absolute') + 1], true, 'expected to be != 0');
        assert.equal(data[OrientationEventStructure.indexOf('alpha') + 1], 184.0723, 'expected to be != 0');
        assert.equal(data[OrientationEventStructure.indexOf('beta') + 1], 17.5789, 'expected to be != 0');
        assert.equal(data[OrientationEventStructure.indexOf('gamma') + 1], -11.8580, 'expected to be != 0');
        this._orientationEvents.stopFeature(self);
    });

    it('should not send a second orientation event if sample period did not elapse', function () {
        this._orientationEvents.startFeature(self);
        const e = {
            type: 'deviceorientation',
            absolute: true,
            alpha: 184.0723,
            beta: 17.5789,
            gamma: -11.8580,
        };
        this.cdUtils.dateNow.returns(1471507753733);
        this.cdUtils.cutDecimalPointDigits.onCall(0).returns(184.0723);
        this.cdUtils.cutDecimalPointDigits.onCall(1).returns(17.5789);
        this.cdUtils.cutDecimalPointDigits.onCall(2).returns(-11.8580);
        this.cdUtils.cutDecimalPointDigits.returns(100);
        this._messageBus.publish(MessageBusEventType.DeviceOrientationEvent, e);
        this.cdUtils.dateNow.returns(1471507753733);
        this._messageBus.publish(MessageBusEventType.DeviceOrientationEvent, e);

        assert.equal(3, this.cdUtils.cutDecimalPointDigits.getCalls().length, 'cutDecimalPointDigits was not called as expected');
        assert.isTrue(this.dataQ.addToQueue.calledOnce, 'addToQueue called more than once');
        assert.equal('orientation_events', this.dataQ.addToQueue.getCall(0).args[0], 'event is not orientation_events');
        const data = this.dataQ.addToQueue.getCall(0).args[1];

        assert.notEqual(data[OrientationEventStructure.indexOf('eventSequence') + 1], -1,
            'no eventSequence');
        assert.equal(data[OrientationEventStructure.indexOf('absolute') + 1], true, 'expected to be != 0');
        assert.equal(data[OrientationEventStructure.indexOf('alpha') + 1], 184.0723, 'expected to be != 0');
        assert.equal(data[OrientationEventStructure.indexOf('beta') + 1], 17.5789, 'expected to be != 0');
        assert.equal(data[OrientationEventStructure.indexOf('gamma') + 1], -11.8580, 'expected to be != 0');

        this._orientationEvents.stopFeature(self);
    });

    it('should send an orientation event if sample period has elapsed', function () {
        this._orientationEvents.startFeature(self);

        const e = {
            type: 'deviceorientation',
            absolute: true,
            alpha: 184.07227567918918,
            beta: 17.578909379388982,
            gamma: -11.858026795157887,
            timeStamp: 1471507753733,
        };

        this.cdUtils.dateNow.returns(1500802087319);
        this.cdUtils.cutDecimalPointDigits.onCall(0).returns(184.0723);
        this.cdUtils.cutDecimalPointDigits.onCall(1).returns(17.5789);
        this.cdUtils.cutDecimalPointDigits.onCall(2).returns(-11.8580);
        this.cdUtils.cutDecimalPointDigits.onCall(3).returns(186.5271);
        this.cdUtils.cutDecimalPointDigits.onCall(4).returns(-1.0925);
        this.cdUtils.cutDecimalPointDigits.onCall(5).returns(1.1132);
        this._messageBus.publish(MessageBusEventType.DeviceOrientationEvent, e);

        e.alpha = 186.52711633492527;
        e.beta = -1.0925001031008132;
        e.gamma = 1.113181437681716;

        const currTime = 1500802087319 + this.configurationRepository.get(ConfigurationFields.orientationEventsSamplePeriod) + 10;
        this.cdUtils.dateNow.returns(currTime); // make the time threshold pass
        this._messageBus.publish(MessageBusEventType.DeviceOrientationEvent, e);

        assert.equal(6, this.cdUtils.cutDecimalPointDigits.getCalls().length, 'cutDecimalPointDigits was not called as expected');
        assert.isTrue(this.dataQ.addToQueue.calledTwice, 'addToQueue not called twice');
        assert.equal('orientation_events', this.dataQ.addToQueue.getCall(0).args[0], 'event is not orientation_events');
        let data = this.dataQ.addToQueue.getCall(0).args[1];
        assert.notEqual(data[OrientationEventStructure.indexOf('eventSequence') + 1], -1,
            'no eventSequence');
        assert.equal(data[OrientationEventStructure.indexOf('absolute') + 1], true, 'expected to be != 0');
        assert.equal(data[OrientationEventStructure.indexOf('alpha') + 1], 184.0723, 'expected to be != 0');
        assert.equal(data[OrientationEventStructure.indexOf('beta') + 1], 17.5789, 'expected to be != 0');
        assert.equal(data[OrientationEventStructure.indexOf('gamma') + 1], -11.8580, 'expected to be != 0');
        data = this.dataQ.addToQueue.getCall(1).args[1];

        assert.notEqual(data[OrientationEventStructure.indexOf('eventSequence') + 1], -1,
            'no eventSequence');
        assert.equal(data[OrientationEventStructure.indexOf('absolute') + 1], true, 'expected to be != 0');
        assert.equal(data[OrientationEventStructure.indexOf('alpha') + 1], 186.5271, 'expected to be != 0');
        assert.equal(data[OrientationEventStructure.indexOf('beta') + 1], -1.0925, 'expected to be != 0');
        assert.equal(data[OrientationEventStructure.indexOf('gamma') + 1], 1.1132, 'expected to be != 0');
        this._orientationEvents.stopFeature(self);
    });

    describe('start tests:', function () {
        it('Should start receiving events once start is called', function () {
            this._orientationEvents.startFeature(self);

            this.cdUtils.dateNow.returns(1500802087319);

            const e = document.createEvent('Event');
            e.initEvent('deviceorientation', true, true);
            e.alpha = 186.52711633492527;
            e.beta = -1.0925001031008132;
            e.gamma = 1.113181437681716;
            e.absolute = true;

            this.cdUtils.cutDecimalPointDigits.onCall(0).returns(184.0723);
            this.cdUtils.cutDecimalPointDigits.onCall(1).returns(17.5789);
            this.cdUtils.cutDecimalPointDigits.onCall(2).returns(-11.8580);
            this.cdUtils.cutDecimalPointDigits.returns(100);

            this._messageBus.publish(MessageBusEventType.DeviceOrientationEvent, e);

            assert.equal(this.dataQ.addToQueue.callCount, 1, 'no messages were sent to the data queue');

            this.cdUtils.dateNow.returns(1500804088319);

            this._orientationEvents.stopFeature(self);

            this._messageBus.publish(MessageBusEventType.DeviceOrientationEvent, e);
            // Still only one event sent to queue which means we are no longer receiving clipboard events once stopFeature is called
            assert.equal(this.dataQ.addToQueue.callCount, 1, 'unexpected messages were sent to data queue');

            this.cdUtils.dateNow.returns(1600809089319);

            const e2 = document.createEvent('Event');
            e2.initEvent('deviceorientation', true, true);
            e2.alpha = 185.52711633492527;
            e2.beta = -14.0925001031008132;
            e2.gamma = 11.113181437681716;
            e2.absolute = true;

            this.cdUtils.cutDecimalPointDigits.onCall(0).returns(185.0723);
            this.cdUtils.cutDecimalPointDigits.onCall(1).returns(14.5789);
            this.cdUtils.cutDecimalPointDigits.onCall(2).returns(-11111.8580);
            this.cdUtils.cutDecimalPointDigits.returns(100);

            this._orientationEvents.startFeature(self);

            this._messageBus.publish(MessageBusEventType.DeviceOrientationEvent, e2);
            assert.equal(this.dataQ.addToQueue.callCount, 2, 'invalid number of messages were sent to the data queue');
        });
    });

    describe('stop tests:', function () {
        it('Should stop receiving events once stop is called', function () {
            this._orientationEvents.startFeature(self);
            this.cdUtils.dateNow.returns(1500802087319);

            const e = document.createEvent('Event');
            e.initEvent('deviceorientation', true, true);
            e.alpha = 186.52711633492527;
            e.beta = -1.0925001031008132;
            e.gamma = 1.113181437681716;
            e.absolute = true;

            this._messageBus.publish(MessageBusEventType.DeviceOrientationEvent, e);

            assert.equal(this.dataQ.addToQueue.callCount, 1, 'no messages were sent to the data queue');

            this._orientationEvents.stopFeature(self);

            this._messageBus.publish(MessageBusEventType.DeviceOrientationEvent, e);
            // Still only one event sent to queue which means we are no longer receiving clipboard events once stopFeature is called
            assert.equal(this.dataQ.addToQueue.callCount, 1, 'unexpected messages were sent to data queue');
        });

        it('Update configuration successfully', function () {
            this._orientationEvents.updateFeatureConfig();

            assert.isTrue(this.configurationRepository.get.called);
            assert.equal(this.configurationRepository.get.getCall(0).args[0], 'orientationEventsSamplePeriod');
        });
    });
});
