import Log from "../../technicalServices/log/Logger";
import StaticContract from "./StaticContract";

export default class AudioDetectContract extends StaticContract {
    /**
     * @param  {string} acoustic
     */
    constructor(acoustic) {
        super();
        this.validateParams(acoustic);
        this.acoustic = acoustic;
    }

    validateParams(acoustic) {
        let isValid = (typeof acoustic === 'string')

        if (!isValid) {
            Log.warn(`wrong type in AudioDetect parameters. renderer: {expected: string, received: ${typeof acoustic}}`)
        }
    }

    /**
     * @return  {[string, string]} for example: ['audio_detect', 'acoustic']
     */
    buildQueueMessage() {
        let name = this.getName();
        let message = [name, this.acoustic];
        this.validateMessage(message);
        return message;
    }

    validateMessage(message) {
        let isValid = (typeof message[0] === 'string' && typeof message[1] === 'string')
        if (!isValid) {
            Log.warn('AudioDetect - Contract verification failed')
        }
    }

    getName() {
        return 'audio_detect';
    }
}
