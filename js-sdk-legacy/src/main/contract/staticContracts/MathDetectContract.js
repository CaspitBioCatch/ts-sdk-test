import Log from "../../technicalServices/log/Logger";
import StaticContract from "./StaticContract";

export default class MathDetectContract extends StaticContract {
    /**
     * @param  {string} math
     */
    constructor(math) {
        super();
        this.validateParams(math);
        this.math = math;
    }

    validateParams(math) {
        let isValid = (typeof math === 'string')

        if (!isValid) {
            Log.warn(`wrong type in MathDetect parameters. renderer: {expected: string, received: ${typeof math}}`)
        }
    }

    /**
     * @return  {[string, string]} for example: ['math_detect', 'math']
     */
    buildQueueMessage() {
        let name = this.getName();
        let message = [name, this.math];
        this.validateMessage(message);
        return message;
    }

    validateMessage(message) {
        let isValid = (typeof message[0] === 'string' && typeof message[1] === 'string')
        if (!isValid) {
            Log.warn('MathDetect - Contract verification failed')
        }
    }

    getName() {
        return 'math_detect';
    }
}
