import Log from '../main/technicalServices/log/Logger';

/**
 * This class runs in the worker side. Responsible for sending the data received
 * to the server. The class aggregates the data and sends it periodically to the server (_sendToServerInterval)
 *  @param serverCommunicator - ServerCommunicator class type
 *  @para, aggregator - responsible for aggregating the data and packing it for delivery
 *  @param wupCtor - Wup class
 *  @param sendRateConfigKey - interval configuration field name for updates
 *  @param sendToServerInterval - interval initial configuration
 */
export default class DataDispatcher {
    constructor(serverClient,
                aggregator,
                wupDispatchRateCalculatorFactory,
                wupDispatchRateSettings) {
        this._serverClient = serverClient;
        this._aggregator = aggregator;
        this._wupDispatchRateCalculatorFactory = wupDispatchRateCalculatorFactory;
        this._wupDispatchRateSettings = wupDispatchRateSettings;
        this._wupDispatchRateCalculator = this._wupDispatchRateCalculatorFactory.create(this._wupDispatchRateSettings);

        this._sendToServerInterval = this._wupDispatchRateCalculator.getRate();
        this._setDispatchInterval(this._sendToServerInterval);
    }

    add(message) {
        this._aggregator.add(message);
    }

    sendIfRequired(shouldFlush = false) {
        if (this._sendToServerInterval === 0 || shouldFlush) {
            this._sendToServer(shouldFlush);
        }
    }

    updateByConfig(wupDispatchRateSettings) {
        if (!wupDispatchRateSettings) {
            return;
        }

        if (wupDispatchRateSettings.type !== this._wupDispatchRateSettings.type) {
            this._wupDispatchRateCalculator = this._wupDispatchRateCalculatorFactory.create(wupDispatchRateSettings);
        } else {
            this._wupDispatchRateCalculator.updateSettings(wupDispatchRateSettings);
        }

        this._sendToServerInterval = this._wupDispatchRateCalculator.getRate();

        this._setDispatchInterval(this._sendToServerInterval);

        this._wupDispatchRateSettings = wupDispatchRateSettings;
    }

    scheduleNextDispatching() {
        // Get the new rate for dispatching the wups
        const newRate = this._wupDispatchRateCalculator.getRate();

        // Update the rate if it is different than the current one we are working at
        if (newRate !== this._sendToServerInterval) {
            this._sendToServerInterval = newRate;
            this._setDispatchInterval(this._sendToServerInterval);
        }
    }

    _sendToServer(shouldFlush = false) {
        Log.debug('Sending a message to the server');
        if (!this._serverClient.isReady()) {
            Log.info(`${this._serverClient.constructor.name} is not ready. Message will not be sent to server`);
            return;
        }

        // If there is no data to send we abort at this point
        if (this._aggregator.isEmpty()) {
            return;
        }

        this._serverClient.sendData(this._aggregator.take(), shouldFlush);

        this.scheduleNextDispatching();
    }

    _setDispatchInterval(interval) {
        if (this._sendIntervalId) {
            clearInterval(this._sendIntervalId);
            this._sendIntervalId = null;
        }

        if (interval !== 0) {
            this._sendIntervalId = setInterval(this._sendToServer.bind(this), interval);
        }
    }
}
