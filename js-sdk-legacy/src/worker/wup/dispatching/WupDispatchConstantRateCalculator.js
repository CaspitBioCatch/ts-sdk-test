/**
 * Class is responsible for calculating the wup dispatch constant rate.
 */
import { WupDispatchRateType } from './WupDispatchRateType';

export default class WupDispatchConstantRateCalculator {
    constructor(wupDispatchRateSettings) {
        this.updateSettings(wupDispatchRateSettings);
    }

    /**
     * Get the next dispatch rate
     * @returns {*}
     */
    getRate() {
        return this._currentRate;
    }

    updateSettings(wupDispatchRateSettings) {
        if (wupDispatchRateSettings.type !== WupDispatchRateType.constant) {
            throw new Error('Invalid settings provided to constant calculator');
        }

        this._currentRate = wupDispatchRateSettings.initialRateValueMs;
    }
}
