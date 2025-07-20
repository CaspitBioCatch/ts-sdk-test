import { assert } from 'chai';
import sinon from 'sinon';
import ConfigurationRepository from '../../../../../src/main/core/configuration/ConfigurationRepository';
import { LightSensorEventCollector } from '../../../../../src/main/collectors/events';
import CDUtils from '../../../../../src/main/technicalServices/CDUtils';
import { EventStructure as LightEventStructure } from '../../../../../src/main/collectors/events/LightSensorEventCollector';
import DataQ from '../../../../../src/main/technicalServices/DataQ';
import Log from '../../../../../src/main/technicalServices/log/Logger';

describe('LightSensorEventCollector tests:', function () {
    let mockSensor;

    beforeEach(function () {
        this.dataQ = sinon.createStubInstance(DataQ);
        this.configurationRepository = sinon.stub(new ConfigurationRepository());
        this.configurationRepository.get.returns(500);
        this.lightEve = new LightSensorEventCollector(this.dataQ, CDUtils, this.configurationRepository);

        this.dateNow = sinon.stub(this.lightEve, 'getEventTimestamp');
        this.dateNow.returns(Date.now());

        // Mock AmbientLightSensor
        mockSensor = {
            start: sinon.spy(),
            stop: sinon.spy(),
            addEventListener: sinon.spy(),
            removeEventListener: sinon.spy(),
            illuminance: 5.5
        };
        global.AmbientLightSensor = function () { return mockSensor; };

        // Spy on Log methods
        sinon.spy(Log, 'debug');
        sinon.spy(Log, 'info');
    });

    afterEach(function () {
        // Restore the Log methods
        Log.debug.restore();
        Log.info.restore();

        // Clean up global AmbientLightSensor
        delete global.AmbientLightSensor;
    });

    describe('no sensor tests', function () {
        it('handle not having a sensor', function () {
            delete global.AmbientLightSensor; // Simulate no sensor
            this.lightEve.startFeature();
            assert.isTrue(this.dataQ.addToQueue.getCalls().length === 0, 'did LightSensor feature work?');
        });
    });

    describe('sensor tests', function () {
        it('should add event listeners on startFeature', function () {
            this.lightEve.startFeature();

            assert.isTrue(Log.info.calledWith('AmbientLightSensor exists and collected'));
            assert.isTrue(mockSensor.addEventListener.calledWith('reading', this.lightEve.onReadingSensorBoundble));
            assert.isTrue(mockSensor.start.calledOnce);
        });

        it('should remove event listeners on stopFeature', function () {
            this.lightEve.startFeature();
            this.lightEve.stopFeature();

            assert.isTrue(mockSensor.removeEventListener.calledWith('reading', this.lightEve.onReadingSensorBoundble));
            assert.isTrue(mockSensor.stop.calledOnce);
        });

        it('should report light level', function () {
            this.lightEve.startFeature();
            this.lightEve._onReadingSensor();

            assert.isTrue(this.dataQ.addToQueue.getCalls().length > 0, 'did LightSensor feature work?');
            assert.equal(this.dataQ.addToQueue.getCall(0).args[0], 'ambient_light_level', 'did LightSensor feature work?');
            assert.equal(this.dataQ.addToQueue.getCall(0).args[1][LightEventStructure.indexOf('illuminance') + 1], 5.5, 'did LightSensor feature work?');
        });

        it('should report light level according to threshold configured', function () {
            this.lightEve.startFeature();
            const time = Date.now();
            this.dateNow.returns(time);
            this.lightEve._onReadingSensor();
            assert.isTrue(this.dataQ.addToQueue.calledOnce, 'did LightSensor feature work?');

            this.dateNow.returns(time + 800);
            this.lightEve._onReadingSensor();

            assert.isTrue(this.dataQ.addToQueue.calledTwice, 'did LightSensor feature work?');

            this.dateNow.returns(time + 850);
            this.lightEve._onReadingSensor();

            assert.isTrue(this.dataQ.addToQueue.calledTwice, 'did LightSensor feature work?');

            assert.equal(this.dataQ.addToQueue.getCall(0).args[0], 'ambient_light_level', 'did LightSensor feature work?');
            assert.equal(this.dataQ.addToQueue.getCall(1).args[0], 'ambient_light_level', 'did LightSensor feature work?');
            assert.equal(this.dataQ.addToQueue.getCall(0).args[1][LightEventStructure.indexOf('illuminance') + 1], 5.5, 'did LightSensor feature work?');
        });

        it('should report light level according to threshold configured from server', function () {
            this.lightEve.startFeature();
            const time = Date.now();
            this.dateNow.returns(time);
            this.lightEve._onReadingSensor();
            assert.isTrue(this.dataQ.addToQueue.calledOnce, 'did LightSensor feature work?');

            this.configurationRepository.get.withArgs('lightSensorEventThreshold').returns(100);
            // Notify feature on configuration update
            this.lightEve.updateFeatureConfig();
            this.dataQ.addToQueue.reset();
            this.dateNow.returns(time + 50);
            this.lightEve._onReadingSensor();

            assert.isTrue(this.dataQ.addToQueue.notCalled, 'did LightSensor feature work?');
        });
    });
});
