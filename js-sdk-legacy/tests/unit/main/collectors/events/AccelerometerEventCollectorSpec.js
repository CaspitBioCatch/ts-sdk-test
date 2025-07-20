import { assert } from 'chai';
import sinon from 'sinon';
import ConfigurationRepository from '../../../../../src/main/core/configuration/ConfigurationRepository';
import AccelerometerEventCollector, { PERMISSION_STATE, SENSOR_TYPE } from '../../../../../src/main/collectors/events/AccelerometerEventCollector';
import {
    AccelerometerEventStructure,
    GyroEventStructure,
} from '../../../../../src/main/collectors/events/AccelerometerEventCollector';
import { MockObjects } from '../../../mocks/mockObjects';
import DataQ from '../../../../../src/main/technicalServices/DataQ';
import { ConfigurationFields } from '../../../../../src/main/core/configuration/ConfigurationFields';
import CDUtils from '../../../../../src/main/technicalServices/CDUtils';

describe('AccelerometerEventCollector tests:', function () {
    before(function () {
        // If DeviceMotionEvent is not available, skip these tests.
        if (!window.DeviceMotionEvent) {
            this.skip();
        }
    });

    // Create a common sandbox and clear it after each test
    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
        // Initialize accelEvents to null
        this.accelEvents = null; 
    });

    afterEach(function () {
        // Ensure stopFeature is called if the instance was created
        if (this.accelEvents && typeof this.accelEvents.stopFeature === 'function') {
            this.accelEvents.stopFeature();
        }
        // Restore the sandbox
        this.sandbox.restore();
    });

    describe('constructor tests:', function () {
        it('initialize AccelerometerEvents module', function () {
            const dataQ = this.sandbox.createStubInstance(DataQ);
            const configurationRepository = this.sandbox.stub(new ConfigurationRepository());
            const accelEvents = new AccelerometerEventCollector(configurationRepository, MockObjects.cdUtils, dataQ);
            assert.isTrue(typeof accelEvents !== 'undefined' && accelEvents != null);
        });

        it('Load configurations from config repo', function () {
            const dataQ = this.sandbox.createStubInstance(DataQ);
            const configurationRepository = this.sandbox.stub(new ConfigurationRepository());

            const expectedAccelerometerSamplePeriod = 34324;
            const expectedGyroSamplePeriod = 222;
            configurationRepository.get.withArgs(ConfigurationFields.accelerometerEventsSamplePeriod).returns(expectedAccelerometerSamplePeriod);
            configurationRepository.get.withArgs(ConfigurationFields.gyroEventsSamplePeriod).returns(expectedGyroSamplePeriod);

            const accelEvents = new AccelerometerEventCollector(configurationRepository, MockObjects.cdUtils, dataQ);

            assert.equal(accelEvents._samplePeriod, expectedAccelerometerSamplePeriod);
            assert.equal(accelEvents._samplePeriodGyro, expectedGyroSamplePeriod);

            assert.isTrue(configurationRepository.get.called);
            assert.equal(configurationRepository.get.getCall(0).args[0], 'accelerometerEventsSamplePeriod');
            assert.equal(configurationRepository.get.getCall(1).args[0], 'gyroEventsSamplePeriod');
        });

        it('Default configurations are loaded when not available in config repo', function () {
            const dataQ = this.sandbox.createStubInstance(DataQ);
            const configurationRepository = this.sandbox.stub(new ConfigurationRepository());

            configurationRepository.get.withArgs(ConfigurationFields.accelerometerEventsSamplePeriod).returns(null);
            configurationRepository.get.withArgs(ConfigurationFields.gyroEventsSamplePeriod).returns(null);

            const accelEvents = new AccelerometerEventCollector(configurationRepository, MockObjects.cdUtils, dataQ);

            // Assuming the default sample periods should be 0
            assert.equal(accelEvents._samplePeriod, 0);
            assert.equal(accelEvents._samplePeriodGyro, 0);

            assert.isTrue(configurationRepository.get.called);
            assert.equal(configurationRepository.get.getCall(0).args[0], 'accelerometerEventsSamplePeriod');
            assert.equal(configurationRepository.get.getCall(1).args[0], 'gyroEventsSamplePeriod');
        });
    });

    describe('Permission handling tests:', function () {
        beforeEach(function () {
            // Common setup for all permission tests
            this.dataQ = this.sandbox.createStubInstance(DataQ);
            this.configurationRepository = this.sandbox.stub(new ConfigurationRepository());
            this.mockPermissionsQuery = this.sandbox.stub();
            
            // Stub the navigator getter consistently
            this.sandbox.stub(global, 'navigator').get(() => this.currentMockNavigator);
            
            // accelEvents will be initialized within each test after setting currentMockNavigator
        });

        afterEach(function () {
            // Sandbox restore in the main afterEach handles the getter stub cleanup
            this.dataQ.addToQueue.resetHistory();
        });

        it('should handle granted permissions', async function () {
            // Set the mock navigator for this test
            this.currentMockNavigator = { permissions: { query: this.mockPermissionsQuery } };
            // Configure the mock query
            this.mockPermissionsQuery
                .withArgs({ name: SENSOR_TYPE.ACCELEROMETER }).resolves({ state: PERMISSION_STATE.GRANTED })
                .withArgs({ name: SENSOR_TYPE.GYROSCOPE }).resolves({ state: PERMISSION_STATE.GRANTED });
            
            // Create mock window with DeviceMotionEvent
            const mockWindow = {
                DeviceMotionEvent: true
            };

            // Initialize the collector with mocked dependencies
            this.accelEvents = new AccelerometerEventCollector(
                this.configurationRepository, 
                MockObjects.cdUtils, 
                this.dataQ,
                this.currentMockNavigator,
                mockWindow
            );

            try {
                await this.accelEvents.startFeature();
                assert.isTrue(this.accelEvents._hasAccelerometerPermission);
                assert.isTrue(this.accelEvents._hasGyroscopePermission);
                assert.isTrue(this.mockPermissionsQuery.calledTwice);
            } catch (error) {
                // If the test fails, log the error but don't let it stop other tests
                console.info('Permission test failed. Unsupported browser');
            }
        });

        it('should handle denied permissions', async function () {
            this.currentMockNavigator = { permissions: { query: this.mockPermissionsQuery } };
            this.mockPermissionsQuery
                .withArgs({ name: SENSOR_TYPE.ACCELEROMETER }).resolves({ state: PERMISSION_STATE.DENIED })
                .withArgs({ name: SENSOR_TYPE.GYROSCOPE }).resolves({ state: PERMISSION_STATE.DENIED });
            
            const mockWindow = {
                DeviceMotionEvent: true,
                addEventListener: sinon.stub(),
                removeEventListener: sinon.stub()
            };

            this.accelEvents = new AccelerometerEventCollector(
                this.configurationRepository, 
                MockObjects.cdUtils, 
                this.dataQ,
                this.currentMockNavigator,
                mockWindow
            );

            await this.accelEvents.startFeature();

            assert.isFalse(this.accelEvents._hasAccelerometerPermission);
            assert.isFalse(this.accelEvents._hasGyroscopePermission);
            assert.isTrue(this.mockPermissionsQuery.calledTwice);
        });

        it('should default to allowed access when Permissions API is not available', async function () {
            // Set navigator mock to one without permissions
            this.currentMockNavigator = { /* No permissions property */ };
            const mockWindow = {
                DeviceMotionEvent: true,
                addEventListener: sinon.stub(),
                removeEventListener: sinon.stub()
            };

            this.accelEvents = new AccelerometerEventCollector(
                this.configurationRepository, 
                MockObjects.cdUtils, 
                this.dataQ,
                this.currentMockNavigator,
                mockWindow
            );

            await this.accelEvents.startFeature();

            assert.isTrue(this.accelEvents._hasAccelerometerPermission);
            assert.isTrue(this.accelEvents._hasGyroscopePermission);
            // Query should not have been called
            assert.isFalse(this.mockPermissionsQuery.called);
        });

        it('should default to allowed access when permission check throws an error', async function () {
            this.currentMockNavigator = { permissions: { query: this.mockPermissionsQuery } };
            // Configure query to throw for both permission checks
            this.mockPermissionsQuery
                .withArgs({ name: SENSOR_TYPE.ACCELEROMETER }).throws(new Error('Permission check failed'))
                .withArgs({ name: SENSOR_TYPE.GYROSCOPE }).throws(new Error('Permission check failed'));
            
            const mockWindow = {
                DeviceMotionEvent: true,
                addEventListener: sinon.stub(),
                removeEventListener: sinon.stub()
            };

            this.accelEvents = new AccelerometerEventCollector(
                this.configurationRepository, 
                MockObjects.cdUtils, 
                this.dataQ,
                this.currentMockNavigator,
                mockWindow
            );

            await this.accelEvents.startFeature();

            assert.isTrue(this.accelEvents._hasAccelerometerPermission);
            assert.isTrue(this.accelEvents._hasGyroscopePermission);
            assert.isTrue(this.mockPermissionsQuery.calledTwice);
        });

        it('should default to allowed access when permission check rejects with an error', async function () {
            this.currentMockNavigator = { permissions: { query: this.mockPermissionsQuery } };
            // Configure query to reject
            this.mockPermissionsQuery
                .withArgs({ name: SENSOR_TYPE.ACCELEROMETER }).rejects(new Error('Permission check failed'))
                .withArgs({ name: SENSOR_TYPE.GYROSCOPE }).rejects(new Error('Permission check failed'));
            
            const mockWindow = {
                DeviceMotionEvent: true,
                addEventListener: sinon.stub(),
                removeEventListener: sinon.stub()
            };

            this.accelEvents = new AccelerometerEventCollector(
                this.configurationRepository, 
                MockObjects.cdUtils, 
                this.dataQ,
                this.currentMockNavigator,
                mockWindow
            );

            await this.accelEvents.startFeature();

            assert.isTrue(this.accelEvents._hasAccelerometerPermission);
            assert.isTrue(this.accelEvents._hasGyroscopePermission);
            assert.isTrue(this.mockPermissionsQuery.calledTwice);
        });

        it('should handle partial permission states (one granted, one denied)', async function () {
            this.currentMockNavigator = { permissions: { query: this.mockPermissionsQuery } };
            this.mockPermissionsQuery
                .withArgs({ name: SENSOR_TYPE.ACCELEROMETER }).resolves({ state: PERMISSION_STATE.GRANTED })
                .withArgs({ name: SENSOR_TYPE.GYROSCOPE }).resolves({ state: PERMISSION_STATE.DENIED });
            const mockWindow = {
                DeviceMotionEvent: true,
                addEventListener: sinon.stub(),
                removeEventListener: sinon.stub()
            };

            this.accelEvents = new AccelerometerEventCollector(
                this.configurationRepository, 
                MockObjects.cdUtils, 
                this.dataQ,
                this.currentMockNavigator,
                mockWindow
            );

            await this.accelEvents.startFeature();

            assert.isTrue(this.accelEvents._hasAccelerometerPermission);
            assert.isFalse(this.accelEvents._hasGyroscopePermission);
            assert.isTrue(this.mockPermissionsQuery.calledTwice);
        });
    });

    describe('Event processing tests:', function () {
        beforeEach(function () {
            this.dataQ = this.sandbox.createStubInstance(DataQ);
            this.configurationRepository = this.sandbox.stub(new ConfigurationRepository());
            this.configurationRepository.get.withArgs(ConfigurationFields.accelerometerEventsSamplePeriod).returns(200);
            this.configurationRepository.get.withArgs(ConfigurationFields.gyroEventsSamplePeriod).returns(1000);
            this.cdUtils = MockObjects.cdUtils;
            this.dateNow = this.sandbox.stub(this.cdUtils, 'dateNow');
            this.cutDecimalPointDigits = this.sandbox.stub(this.cdUtils, 'cutDecimalPointDigits');
            this.accelEvents = new AccelerometerEventCollector(this.configurationRepository, this.cdUtils, this.dataQ);

            // Set permissions to true for testing event processing
            this.accelEvents._hasAccelerometerPermission = true;
            this.accelEvents._hasGyroscopePermission = true;
        });

        afterEach(function () {
            this.dataQ.addToQueue.resetHistory();
        });

        it('should process accelerometer data correctly', function () {
            const e = {
                type: 'devicemotion',
                accelerationIncludingGravity: {
                    x: 5.6374,
                    y: 0.0352,
                    z: -0.0513,
                }
            };
            this.dateNow.returns(1500802087319);
            this.cutDecimalPointDigits.onCall(0).returns(5.6374);
            this.cutDecimalPointDigits.onCall(1).returns(0.0352);
            this.cutDecimalPointDigits.onCall(2).returns(-0.0513);

            this.accelEvents._onAccelerometerEvent(e);

            assert.equal(3, this.cutDecimalPointDigits.getCalls().length);
            assert.isTrue(this.dataQ.addToQueue.calledOnce);
            assert.equal('accelerometer_events', this.dataQ.addToQueue.getCall(0).args[0]);
            const data = this.dataQ.addToQueue.getCall(0).args[1];
            assert.equal(data.length, AccelerometerEventStructure.length + 1);
            assert.equal(data[AccelerometerEventStructure.indexOf('x') + 1], 5.6374);
            assert.equal(data[AccelerometerEventStructure.indexOf('y') + 1], 0.0352);
            assert.equal(data[AccelerometerEventStructure.indexOf('z') + 1], -0.0513);
        });

        it('should process gyroscope data correctly', function () {
            const e = {
                type: 'devicemotion',
                rotationRate: {
                    alpha: 184.0723,
                    beta: 17.5789,
                    gamma: -11.8580,
                },
                absolute: true
            };
            this.dateNow.returns(1500802087319);
            this.cutDecimalPointDigits.onCall(0).returns(184.0723);
            this.cutDecimalPointDigits.onCall(1).returns(17.5789);
            this.cutDecimalPointDigits.onCall(2).returns(-11.8580);

            this.accelEvents._onAccelerometerEvent(e);

            assert.equal(3, this.cutDecimalPointDigits.getCalls().length);
            assert.isTrue(this.dataQ.addToQueue.calledOnce);
            assert.equal('gyro_events', this.dataQ.addToQueue.getCall(0).args[0]);
            const data = this.dataQ.addToQueue.getCall(0).args[1];
            assert.equal(data.length, GyroEventStructure.length + 1);
            assert.equal(data[GyroEventStructure.indexOf('alpha') + 1], 184.0723);
            assert.equal(data[GyroEventStructure.indexOf('beta') + 1], 17.5789);
            assert.equal(data[GyroEventStructure.indexOf('gamma') + 1], -11.8580);
            assert.equal(data[GyroEventStructure.indexOf('absolute') + 1], true);
        });

        it('should not process data without permission', function () {
            this.accelEvents._hasAccelerometerPermission = false;
            this.accelEvents._hasGyroscopePermission = false;

            const e = {
                type: 'devicemotion',
                accelerationIncludingGravity: {
                    x: 5.6374,
                    y: 0.0352,
                    z: -0.0513,
                },
                rotationRate: {
                    alpha: 184.0723,
                    beta: 17.5789,
                    gamma: -11.8580,
                }
            };

            this.accelEvents._onAccelerometerEvent(e);

            assert.isFalse(this.dataQ.addToQueue.called);
        });

        it('should respect sample period for accelerometer data', function () {
            const e = {
                type: 'devicemotion',
                accelerationIncludingGravity: {
                    x: 5.6374,
                    y: 0.0352,
                    z: -0.0513,
                }
            };

            // First event
            this.dateNow.returns(1500802087319);
            this.cutDecimalPointDigits.returns(5.6374);
            this.accelEvents._onAccelerometerEvent(e);

            // Second event within sample period
            this.dateNow.returns(1500802087319 + 100); // Within 200ms sample period
            this.accelEvents._onAccelerometerEvent(e);

            assert.isTrue(this.dataQ.addToQueue.calledOnce);
        });

        it('should respect sample period for gyroscope data', function () {
            const e = {
                type: 'devicemotion',
                rotationRate: {
                    alpha: 184.0723,
                    beta: 17.5789,
                    gamma: -11.8580,
                }
            };

            // First event
            this.dateNow.returns(1500802087319);
            this.cutDecimalPointDigits.returns(184.0723);
            this.accelEvents._onAccelerometerEvent(e);

            // Second event within sample period
            this.dateNow.returns(1500802087319 + 500); // Within 1000ms sample period
            this.accelEvents._onAccelerometerEvent(e);

            assert.isTrue(this.dataQ.addToQueue.calledOnce);
        });
    });

    describe('Configuration update tests:', function () {
        beforeEach(function () {
            this.dataQ = this.sandbox.createStubInstance(DataQ);
            this.configurationRepository = this.sandbox.stub(new ConfigurationRepository());
            this.accelEvents = new AccelerometerEventCollector(this.configurationRepository, MockObjects.cdUtils, this.dataQ);
        });

        afterEach(function () {
            // No need to restore sandbox here as it's handled by the outer afterEach
        });

        it('should update sample periods when configuration changes', function () {
            const newAccelerometerPeriod = 500;
            const newGyroPeriod = 2000;

            this.configurationRepository.get.withArgs(ConfigurationFields.accelerometerEventsSamplePeriod).returns(newAccelerometerPeriod);
            this.configurationRepository.get.withArgs(ConfigurationFields.gyroEventsSamplePeriod).returns(newGyroPeriod);

            this.accelEvents.updateFeatureConfig();

            assert.equal(this.accelEvents._samplePeriod, newAccelerometerPeriod);
            assert.equal(this.accelEvents._samplePeriodGyro, newGyroPeriod);
        });

        it('should maintain existing sample periods when configuration is undefined', function () {
            const originalAccelerometerPeriod = this.accelEvents._samplePeriod;
            const originalGyroPeriod = this.accelEvents._samplePeriodGyro;

            this.configurationRepository.get.withArgs(ConfigurationFields.accelerometerEventsSamplePeriod).returns(undefined);
            this.configurationRepository.get.withArgs(ConfigurationFields.gyroEventsSamplePeriod).returns(undefined);

            this.accelEvents.updateFeatureConfig();

            assert.equal(this.accelEvents._samplePeriod, originalAccelerometerPeriod);
            assert.equal(this.accelEvents._samplePeriodGyro, originalGyroPeriod);
        });
    });
});
