import { MessageBusEventType } from '../../events/MessageBusEventType';
import { TouchEventType } from './TouchEventCollector';
import { KeyEventType } from './KeyEventCollector';
import Log from '../../technicalServices/log/Logger';
import { ConfigurationFields } from '../../core/configuration/ConfigurationFields';

export default class SensorsDataQueue {
    constructor(configurationRepository, dataQueue, msgBus, utils, sensorGateKeeper) {
        this._historyBuffer = [];
        this._isTouchInProgress = false;
        this._touchStartCount = 0;
        this._isPostTouch = false;
        this._touchEndTime = 0;
        this._sensorGateKeeper = sensorGateKeeper;
        this._dataQueue = dataQueue;
        this._configurationRepository = configurationRepository;
        this._msgBus = msgBus;
        this._utils = utils;
        this._msgBus.subscribe(MessageBusEventType.TouchEvent, this._onTouch.bind(this));
        this._msgBus.subscribe(MessageBusEventType.KeyEvent, this._onTouch.bind(this));
        this._isMotionAroundTouchEnabled = this._configurationRepository.get(ConfigurationFields.isMotionAroundTouchEnabled);
        this._aroundTouchInterval = this._configurationRepository.get(ConfigurationFields.motionPaddingAroundTouchMSec);
    }

    /**
     * Called be the sensor event handlers, according to state, handle the event, if during touch, send directly to queue,
     * if post then also send upto to interval time, else, keep a history buffer for pre touch events, for interval
     * length of time
     * @param name
     * @param data
     * @param addCtxId
     * @param isImmediateWup
     */
    addToQueue(name, data, addCtxId, isImmediateWup) {
        const currTime = this._utils.dateNow();
        if (this._isPostTouch) {
            const postTouchTimeRemaining = currTime - this._touchEndTime;
            if (postTouchTimeRemaining > this._aroundTouchInterval) {
                Log.debug(`SensorsDataQueue: stopped post touch events, time has passed (${this._aroundTouchInterval} millisec)`);
                this._isPostTouch = false;
            }
        }

        if (!this._isMotionAroundTouchEnabled || this._isTouchInProgress || this._isPostTouch || this._sensorGateKeeper.isOpen()) {
            this._dataQueue.addToQueue(name, data, addCtxId, isImmediateWup);
        } else {
            this._historyBuffer.push({
                name,
                data,
                addCtxId,
                isImmediateWup,
                timestamp: currTime,
            });
            // check buffer to 3 sec
            for (let i = 0, len = this._historyBuffer.length; i < len; i++) {
                // we keep getting out the first item so we stay at location 0
                const preTouchTime = currTime - this._historyBuffer[0].timestamp;
                if (preTouchTime > this._aroundTouchInterval) {
                    this._historyBuffer.shift();
                } else {
                    break;
                }
            }
        }
    }

    onConfigUpdate() {
        this._aroundTouchInterval = this._configurationRepository.get(ConfigurationFields.motionPaddingAroundTouchMSec) !== undefined
            ? this._configurationRepository.get(ConfigurationFields.motionPaddingAroundTouchMSec) : this._aroundTouchInterval;
        this._isMotionAroundTouchEnabled = this._configurationRepository.get(ConfigurationFields.isMotionAroundTouchEnabled) !== undefined
            ? this._configurationRepository.get(ConfigurationFields.isMotionAroundTouchEnabled) : this._isMotionAroundTouchEnabled;
    }

    /**
     * Upon start of touch event send the history buffer of pre-touch sensor events according to
     * interval (1 sec by default)
     * @private
     */
    _sendBuffer() {
        const startTime = this._utils.dateNow();
        Log.debug(`sending history sensors buffer ts=${startTime}`);
        // send all buffer to queue
        for (let i = 0, len = this._historyBuffer.length; i < len; i++) {
            if ((startTime - this._historyBuffer[i].timestamp) <= this._aroundTouchInterval) {
                this._dataQueue.addToQueue(this._historyBuffer[i].name, this._historyBuffer[i].data,
                    this._historyBuffer[i].addCtxId, this._historyBuffer[i].isImmediateWup);
            }
        }
        this._historyBuffer = [];
    }

    /**
     * on touch event manage current status of touch - is during or after touch event, in order to manage
     * sensor events interval
     *
     * on mobile - touching the keyboard is sent as keyevent and not touch event
     * @param event
     * @returns {boolean}
     * @private
     */
    _onTouch(event) {
        if (this._isMotionAroundTouchEnabled) {
            if (!this._isTouchInProgress && (event.action === TouchEventType.touchstart
                || event.action === KeyEventType.keydown)) {
                // isTouchInProgress protects against multiple touch downs in a row
                Log.debug(`Started touch event in sensors data q ts=${this._utils.dateNow()}`);
                this._isTouchInProgress = true;
                this._touchStartCount = 1;
                this._sendBuffer();
            } else if (event.action === TouchEventType.touchend
                || event.action === KeyEventType.keyup) {
                this._touchStartCount--;
                if (this._touchStartCount <= 0) {
                    this._isTouchInProgress = false;
                    this._isPostTouch = true;
                    this._touchEndTime = this._utils.dateNow();
                    Log.debug(`stopped touch event in sensors data q ts=${this._utils.dateNow()}`);
                }
            } else if (event.action === TouchEventType.touchstart
                || event.action === KeyEventType.keydown) {
                // on mobile - touching the keyboard is sent as keyevent and not touch event
                // for cases when there's another touch start after touch start, so wait until all
                // the touches end
                this._touchStartCount++;
            }
        }
        return false;
    }
}
