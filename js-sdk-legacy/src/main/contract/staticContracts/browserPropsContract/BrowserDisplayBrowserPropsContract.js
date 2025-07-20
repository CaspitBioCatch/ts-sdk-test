import StaticContract from "../StaticContract";
import Log from "../../../technicalServices/log/Logger";

export class BrowserDisplayBrowserPropsContract extends StaticContract {
    /**
     * @param  {string} browserDisplay,
     */
    constructor(browserDisplay) {
        super();
        this.validateParams(browserDisplay);
        this.browserDisplay = browserDisplay;
    }

    validateParams(browserDisplay) {
        let isValid = (typeof browserDisplay === 'string')
        if (!isValid) {
            Log.warn(`wrong type in BrowserDisplay, BrowserProps parameters. BrowserDisplay : {expected: string, received: ${typeof browserDisplay}}`)
        }
    }

    /**
     * @return  {[string,string]} for example: ['browser_display', '']
     */
    buildQueueMessage() {
        let name = this.getName();
        let message = [name, this.browserDisplay];
        this.validateMessage(message);
        return message;
    }

    validateMessage(message) {
        let isValid = (
            typeof message[0] === 'string' &&
            typeof message[1] === 'string')
        if (!isValid) {
            Log.warn('TransparencyReduced, BrowserPropsContract - Contract verification failed')
        }
    }

    getName() {
        return 'browser_display_detect';
    }
}
