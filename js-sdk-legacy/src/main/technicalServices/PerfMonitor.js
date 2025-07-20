import * as CDMap from '../infrastructure/CDMap';
import Log from './log/Logger';
import CDUtils from './CDUtils';

export default class PerfMonitor {
    constructor(perfDataQ) {
        this._perfDataQ = perfDataQ;
        this._now = window.performance && window.performance.now ? window.performance.now.bind(window.performance) : CDUtils.dateNow.bind(Date);
        this._monitors = CDMap.create();
    }

    startMonitor(counterName) {
        Log.debug(`PerfMonitor:startMonitor on ${counterName}`);
        this._monitors.set(counterName, this._now());
    }

    stopMonitor(counterName, origin = 'main') {
        if (this._monitors.has(counterName)) {
            const time = this._now() - this._monitors.get(counterName);
            this._perfDataQ.addToQueue('perf', { orig: origin, name: counterName, val: time });
            Log.debug(`PerfMonitor:stopMonitor on ${counterName}: time = ${time}`);
            this._monitors.delete(counterName);
        }
    }

    cancelMonitor(counterName) {
        Log.debug(`PerfMonitor:cancelMonitor on ${counterName}`);
        if (this._monitors.has(counterName)) {
            this._monitors.delete(counterName);
        }
    }

    /**
     * report a monitor directly without storing in _monitors
     */
    reportMonitor(counterName, time, origin = 'main') {
        Log.debug(`PerfMonitor:reportMonitor on ${counterName}`);
        this._perfDataQ.addToQueue('perf', { orig: origin, name: counterName, val: time });
    }
}
