/**
 * Class is responsible for calculating the wup dispatch dynamic rate.
 */
export default class WupDispatchDynamicRateCalculator {
    constructor(wupServerSessionState) {
        this._wupServerSessionState = wupServerSessionState;
    }

    /**
     * Get the next dispatch rate
     * @returns {*}
     */
    getRate() {
        return this._wupServerSessionState.getWupDispatchRate();
    }

    updateSettings() {
    }
}
