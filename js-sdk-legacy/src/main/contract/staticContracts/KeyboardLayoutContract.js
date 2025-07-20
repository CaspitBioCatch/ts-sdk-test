import Log from "../../technicalServices/log/Logger";
import StaticContract from "./StaticContract";

export default class KeyboardLayoutContract extends StaticContract {
    /**
     * @param  {string} keyboardLayout
     */
    constructor(keyboardLayout) {
        super();
        this.validateParams(keyboardLayout);
        this.keyboardLayout = keyboardLayout;
    }

    validateParams(keyboardLayout) {
        let isValid = typeof keyboardLayout === 'string';

        if (!isValid) {
            Log.warn(`wrong type in KeyboardLayout parameters. keyboardLayout : {expected: string, received: ${ typeof keyboardLayout}}`)
        }
    }

    /**
     * @return  {[string, string]} for example: ['keyboard_layout', 'b0e106ee1de7ce5ea7bcc1bd50542ddd']
     */
    buildQueueMessage() {
        let name = this.getName();
        let message = [name, this.keyboardLayout];
        this.validateMessage(message);
        return message;
    }

    validateMessage(message) {
        let isValid = (typeof message[0] === 'string' && typeof message[1] === 'string')
        if (!isValid) {
            Log.warn('KeyboardLayout - Contract verification failed')
        }
    }

    getName() {
        return 'keyboard_layout';
    }
}