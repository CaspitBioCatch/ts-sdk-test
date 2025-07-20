import { assert } from 'chai';
import BatteryStatusCollector from '../../../../../src/main/collectors/events/BatteryStatusCollector';
import {
    BatteryStatusStructure
} from '../../../../../src/main/collectors/events/BatteryStatusCollector';
import { MockObjects } from '../../../mocks/mockObjects';
import DataQ from '../../../../../src/main/technicalServices/DataQ';
import sinon from "sinon";
import Log from "../../../../../src/main/technicalServices/log/Logger";

describe('BatteryStatusCollector tests:', function () {
    let sandbox;
    let dataQ;
    let validUtils;
    let mockBattery;
    let mockNavigator;
    let batteryStatusCollector;

    beforeEach(function() {
        // Create a new sandbox for each test
        sandbox = sinon.createSandbox();
        
        // Setup common test dependencies
        dataQ = sandbox.createStubInstance(DataQ);
        validUtils = {
            StorageUtils: {
                getAndUpdateEventSequenceNumber: sandbox.stub().returns(1)
            },
            dateNow: sandbox.stub().returns(1234567890),
            convertToArrayByMap: function(structure, data) {
                const result = [null]; // First element is null as per original implementation
                structure.forEach((key, index) => {
                    result[index + 1] = data[key];
                });
                return result;
            }
        };
        mockBattery = {
            level: 0.85,
            charging: true,
            addEventListener: sandbox.stub(),
            removeEventListener: sandbox.stub()
        };
        mockNavigator = {
            getBattery: sandbox.stub().resolves(mockBattery)
        };
    });

    afterEach(function() {
        // Restore the sandbox after each test
        sandbox.restore();
    });

    describe('constructor', function() {
        it('should initialize with default navigator when none provided', function() {
            batteryStatusCollector = new BatteryStatusCollector(dataQ, validUtils);
            assert.exists(batteryStatusCollector);
            assert.strictEqual(batteryStatusCollector._navigator, window.navigator);
        });

        it('should initialize with custom navigator when provided', function() {
            batteryStatusCollector = new BatteryStatusCollector(dataQ, validUtils, mockNavigator);
            assert.exists(batteryStatusCollector);
            assert.strictEqual(batteryStatusCollector._navigator, mockNavigator);
        });

        it('should properly bind event handlers', function() {
            batteryStatusCollector = new BatteryStatusCollector(dataQ, validUtils, mockNavigator);
            assert.isFunction(batteryStatusCollector._onLevelChangeEventFunc);
            assert.isFunction(batteryStatusCollector._onChargingChangeEventFunc);
        });
    });

    describe('startFeature', function() {
        beforeEach(function() {
            batteryStatusCollector = new BatteryStatusCollector(dataQ, validUtils, mockNavigator);
        });

        it('should handle error when battery API is not supported', async function() {
            mockNavigator.getBattery = sandbox.stub().rejects(new Error('Battery API not supported'));
            const logErrorSpy = sandbox.spy(Log, 'error');
            
            await batteryStatusCollector.startFeature();
            
            assert.isFalse(dataQ.addToQueue.called, 'addToQueue should not be called when battery API is not supported');
            assert.isTrue(logErrorSpy.calledOnce, 'Error should be logged');
            assert.isNull(batteryStatusCollector._battery, 'Battery should be null after error');
        });

        it('should send initial data when starting feature successfully', async function() {
            await batteryStatusCollector.startFeature();
            
            assert.isTrue(dataQ.addToQueue.calledOnce, 'addToQueue should be called once on start');
            const data = dataQ.addToQueue.getCall(0).args[1];
            assert.equal(data[BatteryStatusStructure.indexOf('chargeLevel') + 1], 0.85, 'chargeLevel should be 0.85');
            assert.equal(data[BatteryStatusStructure.indexOf('isCharging') + 1], true, 'isCharging should be true');
            assert.equal(data[BatteryStatusStructure.indexOf('powerSource') + 1], 0, 'powerSource should be 0');
        });

        it('should set up event listeners when starting feature', async function() {
            await batteryStatusCollector.startFeature();
            
            assert.isTrue(mockBattery.addEventListener.calledTwice, 'Event listeners should be set up');
            assert.isTrue(mockBattery.addEventListener.calledWith('levelchange', sinon.match.func), 'levelchange listener should be set up');
            assert.isTrue(mockBattery.addEventListener.calledWith('chargingchange', sinon.match.func), 'chargingchange listener should be set up');
        });
    });

    describe('event handling', function() {
        beforeEach(async function() {
            batteryStatusCollector = new BatteryStatusCollector(dataQ, validUtils, mockNavigator);
            await batteryStatusCollector.startFeature();
            dataQ.addToQueue.reset(); // Reset call count for event tests
        });

        it('should handle levelchange events correctly', function() {
            const event = {
                type: 'levelchange',
                timeStamp: 5164.325,
                currentTarget: {
                    charging: true,
                    level: 0.94
                }
            };
            batteryStatusCollector._onLevelChangeEventFunc(event);

            assert.isTrue(dataQ.addToQueue.calledOnce, 'addToQueue should be called for levelchange event');
            const data = dataQ.addToQueue.getCall(0).args[1];
            assert.equal(data[BatteryStatusStructure.indexOf('chargeLevel') + 1], 0.94, 'chargeLevel should be updated');
            assert.equal(data[BatteryStatusStructure.indexOf('isCharging') + 1], true, 'isCharging should be preserved');
        });

        it('should handle chargingchange events correctly', function() {
            const event = {
                type: 'chargingchange',
                timeStamp: 5164.325,
                currentTarget: {
                    charging: false,
                    level: 0.85
                }
            };
            batteryStatusCollector._onChargingChangeEventFunc(event);

            assert.isTrue(dataQ.addToQueue.calledOnce, 'addToQueue should be called for chargingchange event');
            const data = dataQ.addToQueue.getCall(0).args[1];
            assert.equal(data[BatteryStatusStructure.indexOf('isCharging') + 1], false, 'isCharging should be updated');
            assert.equal(data[BatteryStatusStructure.indexOf('chargeLevel') + 1], 0.85, 'chargeLevel should be preserved');
        });

        it('should not send data when battery is null', function() {
            batteryStatusCollector._sendData(null);
            assert.isFalse(dataQ.addToQueue.called, 'addToQueue should not be called when battery is null');
        });
    });

    describe('stopFeature', function() {
        beforeEach(async function() {
            batteryStatusCollector = new BatteryStatusCollector(dataQ, validUtils, mockNavigator);
            await batteryStatusCollector.startFeature();
        });

        it('should clean up event listeners', function() {
            batteryStatusCollector.stopFeature();

            assert.isTrue(mockBattery.removeEventListener.calledTwice, 'removeEventListener should be called twice');
            assert.isTrue(mockBattery.removeEventListener.calledWith('levelchange', sinon.match.func), 'levelchange listener should be removed');
            assert.isTrue(mockBattery.removeEventListener.calledWith('chargingchange', sinon.match.func), 'chargingchange listener should be removed');
        });

        it('should set battery to null', function() {
            batteryStatusCollector.stopFeature();
            assert.isNull(batteryStatusCollector._battery, 'Battery should be null after stopFeature');
        });
    });
});
