import StaticContract from '../StaticContract';
import Log from '../../../technicalServices/log/Logger';

export default class BuildIDBrowserPropsContract extends StaticContract {
    /**
     * @param {string} buildID, indicates the representing string of the build identifier of the browser.
     * The build ID is in the form YYYYMMDDHHMMSS. in Firefox 64 onwards.
     */
    constructor(buildID) {
        super();
        this.validateParams(buildID);
        this.buildID = buildID;
    }

    validateParams(buildID) {
        const isValid = buildID !== undefined && typeof buildID === 'string';
        if(!isValid) {
            Log.warn(`The buildID is either undefined or of a wrong type. Expected string, received: ${typeof buildID}`);
        }
    }

    /**
     * @return  {[string, string]} for example: ['navigator_build_id', 20220308175500]
     */
    buildQueueMessage() {
        const name = this.getName();
        const message = [name, this.buildID];
        this.validateMessage(message);
        return message;
    }

    validateMessage(message){
        const isValid =  (
            typeof message[0] === 'string' &&
            typeof message[1] === 'string')
        if (!isValid){
            Log.warn('navigator_build_id, BrowserPropsContract - Contract verification failed')
        }
    }

    getName() {
        return 'navigator_build_id';
    }
}
