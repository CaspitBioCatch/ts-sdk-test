import { assert } from 'chai';
import TestFeatureSupport from '../../../../TestFeatureSupport';
import DataQ from '../../../../../src/main/technicalServices/DataQ';
import LocationCollector from '../../../../../src/main/collectors/events/LocationCollector';
import CDUtils from '../../../../../src/main/technicalServices/CDUtils';
import { TestUtils } from '../../../../TestUtils';
import { EventStructure as LocationEventsStructure } from '../../../../../src/main/collectors/events/LocationCollector';
import ConfigurationRepository from '../../../../../src/main/core/configuration/ConfigurationRepository';
import { ConfigurationFields } from '../../../../../src/main/core/configuration/ConfigurationFields';

describe('LocationCollector tests:', function () {
    beforeEach(function () {
        if (!TestFeatureSupport.isUserPermissionsSupported()) {
            this.skip();
        }

        this.sandbox = sinon.createSandbox();
        this.configurationRepository = this.sandbox.stub(new ConfigurationRepository());
        this.configurationRepository.get.withArgs(ConfigurationFields.locationEventsTimeoutMsec).returns(10000);
        this._dataQ = this.sandbox.createStubInstance(DataQ);
        this._navigatorStub = {
            permissions: {
                query: this.sandbox.stub(),
            },
            geolocation: {
                latitude: 50,
                longitude: 10,
                accuracy: 5,
                timestamp: 3000,
                id: 0,
                watchPosition: this.sandbox.stub(),
                clearWatch: this.sandbox.stub(),
            },
        };
    });

    afterEach(function () {
        if (this.sandbox) {
            this.sandbox.restore();
        }
    });

    it('start subscribes for location events when granted', async function () {
        this._navigatorStub.permissions.query.withArgs({ name: 'geolocation' }).resolves({ state: 'granted' });
        const locationEvent = new LocationCollector(this._dataQ, CDUtils, this.configurationRepository, this._navigatorStub);
        locationEvent.startFeature();

        assert.isTrue(this._navigatorStub.permissions.query.calledOnce);
        assert.deepEqual(this._navigatorStub.permissions.query.firstCall.args[0], { name: 'geolocation' });

        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this._navigatorStub.geolocation.watchPosition.calledOnce,
                `watchPosition was not called once. It was called ${this._navigatorStub.geolocation.watchPosition.callCount} times.`);
        });
    });

    it('start does not subscribe for location events when not granted', async function () {
        this._navigatorStub.permissions.query.withArgs({ name: 'geolocation' }).resolves({ state: 'prompt' });
        const locationEvent = new LocationCollector(this._dataQ, CDUtils, this.configurationRepository, this._navigatorStub);
        locationEvent.startFeature();

        assert.isTrue(this._navigatorStub.permissions.query.calledOnce);
        assert.deepEqual(this._navigatorStub.permissions.query.firstCall.args[0], { name: 'geolocation' });

        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this._navigatorStub.geolocation.watchPosition.notCalled,
                `watchPosition was called. It was called ${this._navigatorStub.geolocation.watchPosition.callCount} times.`);
        });
    });

    it('start does not subscribe for location events when permission query fails', async function () {
        this._navigatorStub.permissions.query.withArgs({ name: 'geolocation' }).rejects();
        const locationEvent = new LocationCollector(this._dataQ, CDUtils, this.configurationRepository, this._navigatorStub);
        locationEvent.startFeature();

        assert.isTrue(this._navigatorStub.permissions.query.calledOnce);
        assert.deepEqual(this._navigatorStub.permissions.query.firstCall.args[0], { name: 'geolocation' });

        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this._navigatorStub.geolocation.watchPosition.notCalled,
                `watchPosition was called. It was called ${this._navigatorStub.geolocation.watchPosition.callCount} times.`);
        });
    });

    it('collect location events when location watch success callback is triggered', async function () {
        this._navigatorStub.permissions.query.withArgs({ name: 'geolocation' }).resolves({ state: 'granted' });
        const locationEvent = new LocationCollector(this._dataQ, CDUtils, this.configurationRepository, this._navigatorStub);
        locationEvent.startFeature();

        assert.isTrue(this._navigatorStub.permissions.query.calledOnce);
        assert.deepEqual(this._navigatorStub.permissions.query.firstCall.args[0], { name: 'geolocation' });

        // Wait for the watchPosition to occur
        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this._navigatorStub.geolocation.watchPosition.calledOnce,
                `watchPosition was not called once. It was called ${this._navigatorStub.geolocation.watchPosition.callCount} times.`);
        });

        const pos = {
            coords: {
                latitude: 50,
                longitude: 10,
                accuracy: 5,
                timestamp: 3000,
            },
        };

        // Trigger the position callback
        const positionSuccessCallback = this._navigatorStub.geolocation.watchPosition.firstCall.args[0];
        positionSuccessCallback(pos);

        await TestUtils.waitForNoAssertion(() => {
            const lastCallArg = this._dataQ.addToQueue.getCall(0);
            assert.equal(lastCallArg.args[0], 'location_events', 'expected to dispatch location_events');
        });
    });

    it('Does not collect location events when location watch error callback is triggered', async function () {
        this._navigatorStub.permissions.query.withArgs({ name: 'geolocation' }).resolves({ state: 'granted' });
        const locationEvent = new LocationCollector(this._dataQ, CDUtils, this.configurationRepository, this._navigatorStub);
        locationEvent.startFeature();

        assert.isTrue(this._navigatorStub.permissions.query.calledOnce);
        assert.deepEqual(this._navigatorStub.permissions.query.firstCall.args[0], { name: 'geolocation' });

        // Wait for the watchPosition to occur
        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this._navigatorStub.geolocation.watchPosition.calledOnce,
                `watchPosition was not called once. It was called ${this._navigatorStub.geolocation.watchPosition.callCount} times.`);
        });

        const pos = {
            coords: {
                latitude: 50,
                longitude: 10,
                accuracy: 5,
                timestamp: 3000,
            },
        };

        // Trigger the position error callback
        const positionErrorCallback = this._navigatorStub.geolocation.watchPosition.firstCall.args[1];
        positionErrorCallback(pos);

        assert.isTrue(this._dataQ.addToQueue.notCalled);
    });

    it('stop unsubscribes from location events', async function () {
        this._navigatorStub.permissions.query.withArgs({ name: 'geolocation' }).resolves({ state: 'granted' });
        const locationEvent = new LocationCollector(this._dataQ, CDUtils, this.configurationRepository, this._navigatorStub);

        const watcherID = 1234;
        this._navigatorStub.geolocation.watchPosition.returns(watcherID);

        locationEvent.startFeature();

        assert.isTrue(this._navigatorStub.permissions.query.calledOnce);
        assert.deepEqual(this._navigatorStub.permissions.query.firstCall.args[0], { name: 'geolocation' });

        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this._navigatorStub.geolocation.watchPosition.calledOnce,
                `watchPosition was not called once. It was called ${this._navigatorStub.geolocation.watchPosition.callCount} times.`);
        });

        locationEvent.stopFeature();

        assert.isTrue(this._navigatorStub.geolocation.clearWatch.calledOnce);
        assert.equal(this._navigatorStub.geolocation.clearWatch.firstCall.args[0], watcherID);
        assert.isNull(locationEvent._watcherID);
        assert.isNull(locationEvent._locationEventsTimeoutID);
    });

    it('stop does not unsubscribe from location events when not subscribed', async function () {
        this._navigatorStub.permissions.query.withArgs({ name: 'geolocation' }).resolves({ state: 'granted' });
        const locationEvent = new LocationCollector(this._dataQ, CDUtils, this.configurationRepository, this._navigatorStub);

        locationEvent.stopFeature();

        assert.isTrue(this._navigatorStub.geolocation.clearWatch.notCalled);
        assert.isNull(locationEvent._watcherID);
        assert.isNull(locationEvent._locationEventsTimeoutID);
    });

    it('usubscribe for location events after timeout', async function () {
        this.configurationRepository.get.withArgs(ConfigurationFields.locationEventsTimeoutMsec).returns(1000);

        const watcherID = 1234;
        this._navigatorStub.geolocation.watchPosition.returns(watcherID);

        this._navigatorStub.permissions.query.withArgs({ name: 'geolocation' }).resolves({ state: 'granted' });
        const locationEvent = new LocationCollector(this._dataQ, CDUtils, this.configurationRepository, this._navigatorStub);
        locationEvent.startFeature();

        assert.isTrue(this._navigatorStub.permissions.query.calledOnce);
        assert.deepEqual(this._navigatorStub.permissions.query.firstCall.args[0], { name: 'geolocation' });

        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this._navigatorStub.geolocation.watchPosition.calledOnce,
                `watchPosition was not called once. It was called ${this._navigatorStub.geolocation.watchPosition.callCount} times.`);
        });

        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this._navigatorStub.geolocation.clearWatch.calledOnce,
                `clearWatch was not called once. It was called ${this._navigatorStub.geolocation.clearWatch.callCount} times.`);
        });

        assert.equal(locationEvent._locationEventsTimeoutMsec, 1000);
    });

    it('configuration update changes location collection timeout', async function () {
        const watcherID = 1234;
        this._navigatorStub.geolocation.watchPosition.returns(watcherID);

        this.configurationRepository.get.withArgs(ConfigurationFields.locationEventsTimeoutMsec).returns(800);

        this._navigatorStub.permissions.query.withArgs({ name: 'geolocation' }).resolves({ state: 'granted' });
        const locationEvent = new LocationCollector(this._dataQ, CDUtils, this.configurationRepository, this._navigatorStub);

        locationEvent.updateFeatureConfig();

        locationEvent.startFeature();

        assert.isTrue(this._navigatorStub.permissions.query.calledOnce);
        assert.deepEqual(this._navigatorStub.permissions.query.firstCall.args[0], { name: 'geolocation' });

        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this._navigatorStub.geolocation.watchPosition.calledOnce,
                `watchPosition was not called once. It was called ${this._navigatorStub.geolocation.watchPosition.callCount} times.`);
        });

        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this._navigatorStub.geolocation.clearWatch.calledOnce,
                `clearWatch was not called once. It was called ${this._navigatorStub.geolocation.clearWatch.callCount} times.`);
        });

        assert.equal(locationEvent._locationEventsTimeoutMsec, 800);
    });

    it('should not execute location_events configuration update when stop ', async function () {
        this._navigatorLocal = {
            permissions: {
                query: this.sandbox.stub(),
            },
            geolocation: {
                watchPosition: (success) => {
                    const pos = {
                        coords: {
                            latitude: 20,
                            longitude: 10,
                            accuracy: 5,
                            timestamp: 3000,
                        },
                    };
                    success(pos);
                    this.id = 112;
                    return this.id;
                },
                clearWatch: (id) => {
                    if (this.id === id) {
                        this.id = id;
                    }
                },
            },
        };

        this._navigatorLocal.permissions.query.withArgs({ name: 'geolocation' }).resolves({ state: 'granted' });
        const locationEvent = new LocationCollector(this._dataQ, CDUtils, this.configurationRepository, this._navigatorLocal);
        locationEvent.startFeature();
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(this._dataQ.addToQueue.callCount, 1, 'addToQueue was not called 1');
            const lastCall = this._dataQ.addToQueue.getCall(0);
            const data = lastCall.args[1];
            assert.equal(data[LocationEventsStructure.indexOf('latitude') + 1], 20);
        });
        this.configurationRepository.get.withArgs(ConfigurationFields.locationEventsTimeoutMsec).returns(15000);
        locationEvent.stopFeature();
        // Notify feature on configuration update
        locationEvent.updateFeatureConfig();
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(this._dataQ.addToQueue.callCount, 1, 'addToQueue was called more then once');
        });
    });

    it('should collect location_events', async function () {
        this._navigatorStub.permissions.query.withArgs({ name: 'geolocation' }).resolves({ state: 'granted' });
        const locationEvent = new LocationCollector(this._dataQ, CDUtils, this.configurationRepository, this._navigatorStub);
        locationEvent.startFeature();

        // Wait for the watchPosition to occur
        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this._navigatorStub.geolocation.watchPosition.calledOnce,
                `watchPosition was not called once. It was called ${this._navigatorStub.geolocation.watchPosition.callCount} times.`);
        });

        const pos = {
            coords: {
                latitude: 50,
                longitude: 10,
                accuracy: 5,
                timestamp: 3000,
            },
        };

        // Trigger the position callback
        const positionSuccessCallback = this._navigatorStub.geolocation.watchPosition.firstCall.args[0];
        positionSuccessCallback(pos);

        await TestUtils.waitForNoAssertion(() => {
            const lastCallArg = this._dataQ.addToQueue.getCall(0);
            assert.equal(lastCallArg.args[0], 'location_events', 'expected to dispatch location_events');
            const data = lastCallArg.args[1];
            assert.equal(data[LocationEventsStructure.indexOf('longitude') + 1], 10);
            assert.equal(data[LocationEventsStructure.indexOf('latitude') + 1], 50);
            assert.equal(data[LocationEventsStructure.indexOf('accuracy') + 1], 5);
        });
    });
});
