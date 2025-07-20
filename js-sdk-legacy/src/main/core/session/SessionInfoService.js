import CDUtils from '../../technicalServices/CDUtils';

export default class SessionInfoService {
    constructor() {
        this.markStartTime();
    }

    markStartTime() {
        this.startTime = CDUtils.dateNow();
    }

    getStartTime() {
        return this.startTime;
    }
}
