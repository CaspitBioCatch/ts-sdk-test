/**
 * Class is responsible for creating a wup dispatch calculator. It support 2 rate calculator types (incremental, constant)
 */
import { WupDispatchRateType } from './WupDispatchRateType';
import WupDispatchConstantRateCalculator from './WupDispatchConstantRateCalculator';
import WupDispatchIncrementalRateCalculator from './WupDispatchIncrementalRateCalculator';
import WupDispatchDynamicRateCalculator from './WupDispatchDynamicRateCalculator';

export default class WupDispatchRateCalculatorFactory {
    constructor(wupStatisticsService,
                wupServerSessionState) {
        this._wupStatisticsService = wupStatisticsService;
        this._wupServerSessionState = wupServerSessionState;
    }

    create(settings) {
        if (settings.type === WupDispatchRateType.constant) {
            return new WupDispatchConstantRateCalculator(settings);
        }

        if (settings.type === WupDispatchRateType.incremental) {
            return new WupDispatchIncrementalRateCalculator(settings, this._wupStatisticsService);
        }

        if (settings.type === WupDispatchRateType.dynamic) {
            return new WupDispatchDynamicRateCalculator(this._wupServerSessionState);
        }

        throw new Error(`Unsupported dispatch rate type ${settings.type}`);
    }
}
