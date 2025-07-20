import { assert } from 'chai';
import ConfigurationRepository from '../../../../../src/main/core/configuration/ConfigurationRepository';
import SensorsDataQueue from '../../../../../src/main/collectors/events/SensorsDataQueue';
import CDUtils from '../../../../../src/main/technicalServices/CDUtils';
import { KeyEventType } from '../../../../../src/main/collectors/events/KeyEventCollector';
import { TouchEventType } from '../../../../../src/main/collectors/events/TouchEventCollector';
import MessageBus from '../../../../../src/main/technicalServices/MessageBus';
import DataQ from '../../../../../src/main/technicalServices/DataQ';
import { ConfigurationFields } from '../../../../../src/main/core/configuration/ConfigurationFields';
import SensorGateKeeper from '../../../../../src/main/collectors/SensorGateKeeper';

describe('SensorsDataQ tests:', function () {
    describe('addToQueue tests: ', function () {
        beforeEach(function () {
            this._dataQ = sinon.createStubInstance(DataQ);
            this._msgBus = sinon.createStubInstance(MessageBus);
            this._configurationRepository = sinon.stub(new ConfigurationRepository());
            this._configurationRepository.get.withArgs(ConfigurationFields.isMotionAroundTouchEnabled).returns(true);
            this._configurationRepository.get.withArgs(ConfigurationFields.motionPaddingAroundTouchMSec).returns(3000);
            this._configurationRepository.get.withArgs(ConfigurationFields.isMotionOnSessionStart).returns(false);
            this._sensorGateKeeper = sinon.createStubInstance(SensorGateKeeper);
        });
        it('should add msg to history buffer', function () {
            const sensDataQ = new SensorsDataQueue(this._configurationRepository, this._dataQ, this._msgBus, CDUtils, this._sensorGateKeeper);
            sensDataQ.addToQueue('eventXXX', [null, 1, 2, 3]);
            sensDataQ.addToQueue('eventYYY', [null, 4, 5, 6]);

            assert.equal(sensDataQ._historyBuffer.length, 2, 'no msg in history buffer');
            assert.equal(sensDataQ._historyBuffer[0].name, 'eventXXX', 'wrong name in history buffer');
            assert.equal(sensDataQ._historyBuffer[1].name, 'eventYYY', 'wrong name in history buffer');
            assert.equal(sensDataQ._historyBuffer[0].data[1], 1, 'wrong data in history buffer');
            assert.equal(sensDataQ._historyBuffer[1].data[3], 6, 'wrong data in history buffer');
        });

        it('should delete msg from history buffer after interval 3 sec', function () {
            const dateNow = sinon.stub(CDUtils, 'dateNow');
            const sensDataQ = new SensorsDataQueue(this._configurationRepository, this._dataQ, this._msgBus, CDUtils, this._sensorGateKeeper);
            const time = Date.now();
            dateNow.returns(time);

            sensDataQ.addToQueue('eventXXX', [null, 1, 2, 3]);
            dateNow.returns(time + 3000);
            sensDataQ.addToQueue('eventYYY', [null, 4, 5, 6]);
            dateNow.returns(time + 3020);
            sensDataQ.addToQueue('eventZZZ', [null, 7, 8, 9]);

            assert.equal(sensDataQ._historyBuffer.length, 2, 'wrong length in history');
            assert.equal(sensDataQ._historyBuffer[0].name, 'eventYYY', 'wrong name in history buffer');
            assert.equal(sensDataQ._historyBuffer[1].name, 'eventZZZ', 'wrong name in history buffer');
            assert.equal(sensDataQ._historyBuffer[0].data[1], 4, 'wrong data in history buffer');
            assert.equal(sensDataQ._historyBuffer[1].data[3], 9, 'wrong data in history buffer');

            dateNow.restore();
        });

        it('should get touch down event and send history buffer', function () {
            const sensDataQ = new SensorsDataQueue(this._configurationRepository, this._dataQ, this._msgBus, CDUtils, this._sensorGateKeeper);
            sensDataQ.addToQueue('eventXXX', [null, 1, 2, 3]);
            sensDataQ.addToQueue('eventYYY', [null, 4, 5, 6]);
            sensDataQ.addToQueue('eventZZZ', [null, 7, 8, 9]);
            sensDataQ._onTouch({ action: TouchEventType.touchstart });
            assert.equal(sensDataQ._historyBuffer.length, 0, 'wrong length in history');
            let addQArgs = this._dataQ.addToQueue.getCall(0).args;
            assert.equal(addQArgs[0], 'eventXXX', 'wrong name in history buffer');
            assert.equal(addQArgs[1].length, 4, 'wrong name in args');
            addQArgs = this._dataQ.addToQueue.getCall(1).args;
            assert.equal(addQArgs[0], 'eventYYY', 'wrong name in args');
            addQArgs = this._dataQ.addToQueue.getCall(2).args;
            assert.equal(addQArgs[0], 'eventZZZ', 'wrong name in args');
        });

        it('should get key down event and send history buffer', function () {
            const sensDataQ = new SensorsDataQueue(this._configurationRepository, this._dataQ, this._msgBus, CDUtils, this._sensorGateKeeper);

            sensDataQ.addToQueue('eventXXX', [null, 1, 2, 3]);
            sensDataQ.addToQueue('eventYYY', [null, 4, 5, 6]);
            sensDataQ.addToQueue('eventZZZ', [null, 7, 8, 9]);

            sensDataQ._onTouch({ action: KeyEventType.keydown });
            assert.equal(sensDataQ._historyBuffer.length, 0, 'wrong length in history');
            let addQArgs = this._dataQ.addToQueue.getCall(0).args;
            assert.equal(addQArgs[0], 'eventXXX', 'wrong name in history buffer');
            assert.equal(addQArgs[1].length, 4, 'wrong name in args');
            addQArgs = this._dataQ.addToQueue.getCall(1).args;
            assert.equal(addQArgs[0], 'eventYYY', 'wrong name in args');
            addQArgs = this._dataQ.addToQueue.getCall(2).args;
            assert.equal(addQArgs[0], 'eventZZZ', 'wrong name in args');
        });

        it('should send messages immediately during touch', function () {
            const sensDataQ = new SensorsDataQueue(this._configurationRepository, this._dataQ, this._msgBus, CDUtils, this._sensorGateKeeper);

            sensDataQ._onTouch({ action: TouchEventType.touchstart });
            sensDataQ.addToQueue('eventXXX', [null, 1, 2, 3]);
            sensDataQ.addToQueue('eventYYY', [null, 4, 5, 6]);
            sensDataQ.addToQueue('eventZZZ', [null, 7, 8, 9]);
            assert.equal(sensDataQ._historyBuffer.length, 0, 'wrong length in history');
            let addQArgs = this._dataQ.addToQueue.getCall(0).args;
            assert.equal(addQArgs[0], 'eventXXX', 'wrong name in args');
            assert.equal(addQArgs[1].length, 4, 'wrong name in args');
            addQArgs = this._dataQ.addToQueue.getCall(1).args;
            assert.equal(addQArgs[0], 'eventYYY', 'wrong name y in args');
            addQArgs = this._dataQ.addToQueue.getCall(2).args;
            assert.equal(addQArgs[0], 'eventZZZ', 'wrong name z in args');
        });

        it('should send messages immediately during key event', function () {
            const sensDataQ = new SensorsDataQueue(this._configurationRepository, this._dataQ, this._msgBus, CDUtils, this._sensorGateKeeper);

            sensDataQ._onTouch({ action: KeyEventType.keydown });
            sensDataQ.addToQueue('eventXXX', [null, 1, 2, 3]);
            sensDataQ.addToQueue('eventYYY', [null, 4, 5, 6]);
            sensDataQ.addToQueue('eventZZZ', [null, 7, 8, 9]);
            assert.equal(sensDataQ._historyBuffer.length, 0, 'wrong length in history');
            let addQArgs = this._dataQ.addToQueue.getCall(0).args;
            assert.equal(addQArgs[0], 'eventXXX', 'wrong name in args');
            assert.equal(addQArgs[1].length, 4, 'wrong name in args');
            addQArgs = this._dataQ.addToQueue.getCall(1).args;
            assert.equal(addQArgs[0], 'eventYYY', 'wrong name y in args');
            addQArgs = this._dataQ.addToQueue.getCall(2).args;
            assert.equal(addQArgs[0], 'eventZZZ', 'wrong name z in args');
        });

        it('should get touch up and send 3 sec post events', function () {
            const sensDataQ = new SensorsDataQueue(this._configurationRepository, this._dataQ, this._msgBus, CDUtils, this._sensorGateKeeper);

            sensDataQ._onTouch({ action: TouchEventType.touchstart });
            sensDataQ._onTouch({ action: TouchEventType.touchend });

            sensDataQ.addToQueue('eventXXX', [null, 1, 2, 3]);
            sensDataQ.addToQueue('eventYYY', [null, 4, 5, 6], true);
            sensDataQ.addToQueue('eventZZZ', [null, 7, 8, 9], true, true);
            assert.equal(sensDataQ._historyBuffer.length, 0, 'wrong length in history');
            const calls = this._dataQ.addToQueue.getCalls();
            assert.equal(calls.length, 3, 'wrong addToQ size');
            assert.equal(calls[0].args[0], 'eventXXX', 'wrong name in args');
            assert.equal(calls[0].args[1].length, 4, 'wrong data in args');
            let addQArgs = this._dataQ.addToQueue.getCall(1).args;
            assert.equal(addQArgs[0], 'eventYYY', 'wrong name in args');
            assert.isTrue(addQArgs[2], 'wrong value in queue');
            addQArgs = this._dataQ.addToQueue.getCall(2).args;
            assert.equal(addQArgs[0], 'eventZZZ', 'wrong name in args');
            assert.isTrue(addQArgs[2], 'wrong value args');
        });

        it('should get touch up after key down and send 3 sec post events', function () {
            const sensDataQ = new SensorsDataQueue(this._configurationRepository, this._dataQ, this._msgBus, CDUtils, this._sensorGateKeeper);

            sensDataQ._onTouch({ action: KeyEventType.keydown });
            sensDataQ._onTouch({ action: KeyEventType.keyup });

            sensDataQ.addToQueue('eventXXX', [null, 1, 2, 3]);
            sensDataQ.addToQueue('eventYYY', [null, 4, 5, 6], true);
            sensDataQ.addToQueue('eventZZZ', [null, 7, 8, 9], true, true);
            assert.equal(sensDataQ._historyBuffer.length, 0, 'wrong length in history');
            const calls = this._dataQ.addToQueue.getCalls();
            assert.equal(calls.length, 3, 'wrong addToQ size');
            assert.equal(calls[0].args[0], 'eventXXX', 'wrong name in args');
            assert.equal(calls[0].args[1].length, 4, 'wrong data in args');
            let addQArgs = this._dataQ.addToQueue.getCall(1).args;
            assert.equal(addQArgs[0], 'eventYYY', 'wrong name in args');
            assert.isTrue(addQArgs[2], 'wrong value in queue');
            addQArgs = this._dataQ.addToQueue.getCall(2).args;
            assert.equal(addQArgs[0], 'eventZZZ', 'wrong name in args');
            assert.isTrue(addQArgs[2], 'wrong value args');
        });

        it('should get touch up and stop sending after 3 sec', function () {
            const dateNow = sinon.stub(CDUtils, 'dateNow');
            const sensDataQ = new SensorsDataQueue(this._configurationRepository, this._dataQ, this._msgBus, CDUtils, this._sensorGateKeeper);
            const time = Date.now();
            dateNow.returns(time);

            sensDataQ._onTouch({ action: TouchEventType.touchstart });
            sensDataQ._onTouch({ action: TouchEventType.touchend });

            dateNow.returns(time + 3005);

            sensDataQ.addToQueue('eventXXX', [null, 1, 2, 3]);
            assert.equal(sensDataQ._historyBuffer.length, 1, 'wrong length in history');
            assert.isTrue(this._dataQ.addToQueue.notCalled, 'data q was called and shouldnt');
            dateNow.restore();
        });

        it('should get 2 touch events and stop after the second 3 sec', function () {
            const dateNow = sinon.stub(CDUtils, 'dateNow');
            const sensDataQ = new SensorsDataQueue(this._configurationRepository, this._dataQ, this._msgBus, CDUtils, this._sensorGateKeeper);
            const time = Date.now();
            dateNow.returns(time);

            sensDataQ._onTouch({ action: TouchEventType.touchstart });
            sensDataQ._onTouch({ action: TouchEventType.touchstart });
            dateNow.returns(time + 5);
            sensDataQ._onTouch({ action: TouchEventType.touchend });
            dateNow.returns(time + 200);
            sensDataQ._onTouch({ action: TouchEventType.touchend });
            dateNow.returns(time + 3010);
            sensDataQ.addToQueue('eventXXX', [null, 1, 2, 3]);
            dateNow.returns(time + 3210);
            sensDataQ.addToQueue('eventYYY', [null, 1, 2, 3]);
            assert.isTrue(this._dataQ.addToQueue.calledOnce, 'data q wasnt called once');
            assert.equal(sensDataQ._historyBuffer.length, 1, 'wrong length in history');
            dateNow.restore();
        });

        it('should return false if isMotionAroundTouchEnabled is false', function () {
            this._configurationRepository.get.withArgs(ConfigurationFields.isMotionAroundTouchEnabled).returns(true);
            const sensDataQ = new SensorsDataQueue(this._configurationRepository, this._dataQ, this._msgBus, CDUtils, this._sensorGateKeeper);
            const onTouchEvent = sensDataQ._onTouch({ action: TouchEventType.touchstart });

            assert.isNotTrue(onTouchEvent, 'onTouch didnt sent false');
        });

        it('should change configuration onConfigUpdate', function () {
            const configurationRepository = sinon.stub(new ConfigurationRepository());
            configurationRepository.get.withArgs(ConfigurationFields.isMotionAroundTouchEnabled).returns(true);
            const sensDataQ = new SensorsDataQueue(configurationRepository, this._dataQ, this._msgBus, CDUtils, this._sensorGateKeeper);
            sensDataQ.addToQueue('eventXXX', [null, 1, 2, 3]);

            configurationRepository.get.withArgs(ConfigurationFields.isMotionAroundTouchEnabled).returns(false);
            sensDataQ.onConfigUpdate();

            sensDataQ.addToQueue('eventYYY', [null, 5, 5, 6]);
            assert.equal(sensDataQ._historyBuffer.length, 1, 'events was added in history');
            assert.equal(sensDataQ._historyBuffer[0].name, 'eventXXX', 'wrong name in history buffer');
            assert.equal(sensDataQ._historyBuffer[0].data[1], 1, 'wrong data in history buffer');
            assert.isTrue(this._dataQ.addToQueue.calledOnce, 'data q was not called once');
        });

        it('should send buffer to queue', function () {
            this._configurationRepository.get.withArgs(ConfigurationFields.isMotionAroundTouchEnabled).returns(true);
            const sensDataQ = new SensorsDataQueue(this._configurationRepository, this._dataQ, this._msgBus, CDUtils, this._sensorGateKeeper);
            sensDataQ.addToQueue('eventXXX', [null, 1, 2, 3]);
            sensDataQ._sendBuffer();

            assert.isTrue(this._dataQ.addToQueue.calledOnce, 'data q was not called once');
        });

        it('should send to queue if isMotionAroundTouchEnabled is false', function () {
            this._configurationRepository.get.withArgs(ConfigurationFields.isMotionAroundTouchEnabled).returns(false);
            const sensDataQ = new SensorsDataQueue(this._configurationRepository, this._dataQ, this._msgBus, CDUtils, this._sensorGateKeeper);
            sensDataQ.addToQueue('eventXXX', [null, 1, 2, 3]);

            assert.isTrue(this._dataQ.addToQueue.calledOnce, 'data q was not called once');
        });

        it('should use default configuration on configUpdate', function () {
            const configurationRepository = sinon.stub(new ConfigurationRepository());
            configurationRepository.get.withArgs(ConfigurationFields.isMotionAroundTouchEnabled).returns(true);
            configurationRepository.get.withArgs(ConfigurationFields.motionPaddingAroundTouchMSec).returns(1000);

            const sensDataQ = new SensorsDataQueue(configurationRepository, this._dataQ, this._msgBus, CDUtils, this._sensorGateKeeper);
            sensDataQ.addToQueue('eventXXX', [null, 1, 2, 3]);
            sensDataQ._sendBuffer();

            configurationRepository.get.withArgs(ConfigurationFields.isMotionAroundTouchEnabled).returns(undefined);
            sensDataQ.onConfigUpdate();
            sensDataQ.addToQueue('eventXXX', [null, 1, 2, 3]);
            assert.isTrue(this._dataQ.addToQueue.calledOnce, 'data q was called and shouldnt');
        });

        it('should get 2 touch events and stop after the second 3 sec on KeyDown and up', function () {
            const dateNow = sinon.stub(CDUtils, 'dateNow');
            const sensDataQ = new SensorsDataQueue(this._configurationRepository, this._dataQ, this._msgBus, CDUtils, this._sensorGateKeeper);
            const time = Date.now();
            dateNow.returns(time);

            sensDataQ._onTouch({ action: KeyEventType.keydown });
            sensDataQ._onTouch({ action: KeyEventType.keydown });
            dateNow.returns(time + 5);
            sensDataQ._onTouch({ action: KeyEventType.keyup });
            dateNow.returns(time + 200);
            sensDataQ._onTouch({ action: KeyEventType.keyup });
            dateNow.returns(time + 3010);
            sensDataQ.addToQueue('eventXXX', [null, 1, 2, 3]);
            dateNow.returns(time + 3210);
            sensDataQ.addToQueue('eventYYY', [null, 1, 2, 3]);
            assert.isTrue(this._dataQ.addToQueue.calledOnce, 'data q wasnt called once');
            assert.equal(sensDataQ._historyBuffer.length, 1, 'wrong length in history');
            dateNow.restore();
        });
    });
});
