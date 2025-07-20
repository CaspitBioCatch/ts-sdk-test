/**
 * Class is responsible for calculating the wup dispatch incremental rate.
 */
import { WupDispatchRateType } from './WupDispatchRateType';

export default class WupDispatchIncrementalRateCalculator {
    constructor(wupDispatchRateSettings, wupStatisticsService) {
        this._wupStatisticsService = wupStatisticsService;

        this.updateSettings(wupDispatchRateSettings);
    }

    /**
     * Get the next dispatch rate
     * @returns {*}
     */
    getRate() {
        if (this._wupStatisticsService.getSentWupsCount() < this._incrementStartWupSendCount) {
            return this._currentRate;
        }

        const nextRate = this._currentRate + this._incrementStepMs;

        if (nextRate <= this._incrementStopMs) {
            this._currentRate = nextRate;
        }

        return this._currentRate;
    }

    updateSettings(wupDispatchRateSettings) {
        if (wupDispatchRateSettings.type !== WupDispatchRateType.incremental) {
            throw new Error('Invalid settings provided to incremental calculator');
        }

        this._currentRate = wupDispatchRateSettings.initialRateValueMs;
        this._incrementStepMs = wupDispatchRateSettings.incrementStepMs;
        this._incrementStopMs = wupDispatchRateSettings.incrementStopMs;
        this._incrementStartWupSendCount = wupDispatchRateSettings.incrementStartWupSendCount;
    }
}
