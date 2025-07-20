import StaticContract from "../StaticContract";
import Log from "../../../technicalServices/log/Logger";


export default class JsUaBrowserPropsContract extends StaticContract{
    /**
     * @param  {string} userAgent,
     */
    constructor(userAgent){
        super();
        this.validateParams(userAgent);
        this.userAgent = userAgent;
    }

    validateParams(userAgent ){
        let isValid =  (typeof userAgent === 'string')
        if (!isValid){
            Log.warn(`wrong type in JsUa, BrowserProps parameters. userAgent : {expected: string, received: ${ typeof userAgent}}`)
        }
    }

    /**
     * @return  {[string,string]} for example: ['js_ua', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Ap…ML, like Gecko) Chrome/97.0.4692.71 Safari/537.36']
     */
    buildQueueMessage(){
        let name = this.getName();
        let message =  [
            name, this.userAgent
        ];
        this.validateMessage(message);
        return message;
    }

    validateMessage(message){
        let isValid =  (
            typeof message[0] === 'string' &&
            typeof message[1] === 'string')
        if (!isValid){
            Log.warn( 'js_ua, BrowserPropsContract - Contract verification failed')
        }
    }

    getName() {
        return 'js_ua';
    }


}
