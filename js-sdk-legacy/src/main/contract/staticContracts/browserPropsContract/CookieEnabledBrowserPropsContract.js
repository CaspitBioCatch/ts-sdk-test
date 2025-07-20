import StaticContract from "../StaticContract";
import Log from "../../../technicalServices/log/Logger";


export default class CookieEnabledBrowserPropsContract extends StaticContract{
    /**
     * @param  {boolean} isCookie,
     */
    constructor(isCookie){
        super();
        this.validateParams(isCookie);
        this.isCookie = isCookie;
    }

    validateParams(isCookie ){
        let isValid =  (typeof isCookie === 'boolean')
        if (!isValid){
            Log.warn(`wrong type in CookieEnabled, BrowserProps parameters. isCookie : {expected: boolean, received: ${ typeof isCookie}}`)
        }
    }

    /**
     * @return  {[string,boolean]} for example: ['cookie_enabled', true]
     */
    buildQueueMessage(){
        let name = this.getName();
        let message =  [name, this.isCookie];
        this.validateMessage(message);
        return message;
    }

    validateMessage(message){
        let isValid =  (
            typeof message[0] === 'string' &&
            typeof message[1] === 'boolean')
        if (!isValid){
            Log.warn('CookieEnabled,BrowserPropsContract - Contract verification failed')
        }
    }

    getName() {
        return 'cookie_enabled';
    }


}
