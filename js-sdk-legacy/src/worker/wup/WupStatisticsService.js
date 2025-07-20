import Log from '../../main/technicalServices/log/Logger';

export default class WupStatisticsService {
    constructor(statisticsLogIntervalMs) {
        this._statisticsLogIntervalMs = statisticsLogIntervalMs;
        this.resetCounters();

        this._setPeriodicStatisticsLog();
    }

    getSentWupsCount() {
        return this._sentWupsCount;
    }

    incrementSentWupCount() {
        this._sentWupsCount++;
        this._sentWupsInCurrentIntervalCount++;
    }

    updateSettings(statisticsLogInterval) {
        this._statisticsLogIntervalMs = statisticsLogInterval;

        this._setPeriodicStatisticsLog();
    }

    resetCounters() {
        this._sentWupsCount = 0;
        this._sentWupsInCurrentIntervalCount = 0;
    }

    /**
     * Stop the wup statistics service. This will stop the periodic statistics log
     */
    stop() {
        this._stopPeriodicStatisticsLog();
    }

    _writeStatisticsLog() {
        // If no wups were sent we don't want to log the statistics
        if (this._sentWupsInCurrentIntervalCount === 0) {
            return;
        }

        Log.debug(`Sent ${this._sentWupsInCurrentIntervalCount} wup in the last ${this._statisticsLogIntervalMs} ms. Sent a total of ${this._sentWupsCount} in the session`);
        this._sentWupsInCurrentIntervalCount = 0;
    }

    _stopPeriodicStatisticsLog() {
        if (this._periodicLogIntervalId) {
            clearInterval(this._periodicLogIntervalId);
        }
    }

    _setPeriodicStatisticsLog() {
        this._stopPeriodicStatisticsLog();

        this._periodicLogIntervalId = setInterval(this._writeStatisticsLog.bind(this), this._statisticsLogIntervalMs);
    }
}
