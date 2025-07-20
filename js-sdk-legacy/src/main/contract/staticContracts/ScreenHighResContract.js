import Log from "../../technicalServices/log/Logger";
import StaticContract from "./StaticContract";

export default class ScreenHighResContract extends StaticContract {
    /**
     * @param  {boolean} isHighRes
     */
    constructor(isHighRes) {
        super();
        this.validateParams(isHighRes);
        this.isHighRes = isHighRes;
    }

    validateParams(isHighRes) {
        let isValid = typeof isHighRes === 'boolean';

        if (!isValid) {
            Log.warn(`wrong type in ScreenHighRes parameters. isHighRes : {expected: boolean, received: ${ typeof isHighRes}}`)
        }
    }

    /**
     * @return  {[string, boolean]} for example: ['screen_high_res', true]
     */
    buildQueueMessage() {
        let name = this.getName();
        let message = [name, this.isHighRes];
        this.validateMessage(message);
        return message;
    }

    validateMessage(message) {
        let isValid = (typeof message[0] === 'string' && typeof message[1] === 'boolean')
        if (!isValid) {
            Log.warn('ScreenHighRes - Contract verification failed')
        }
    }

    getName() {
        return 'screen_high_res';
    }
}