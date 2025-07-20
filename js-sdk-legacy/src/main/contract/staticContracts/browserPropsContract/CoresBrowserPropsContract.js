import StaticContract from "../StaticContract";
import Log from "../../../technicalServices/log/Logger";


export default class CoresBrowserPropsContract extends StaticContract{
    /**
     * @param  {number} hardwareConcurrency, A number between 1 and the number of logical processors potentially available to the user agent || 0 if not supported in the browser.
     */
    constructor(hardwareConcurrency){
        super();
        this.validateParams(hardwareConcurrency);
        this.hardwareConcurrency = hardwareConcurrency;
    }

    validateParams(hardwareConcurrency ){
        let isValid =  (typeof hardwareConcurrency === 'number')
        if (!isValid){
            Log.warn( `wrong type in cores, BrowserProps parameters. hardwareConcurrency : {expected: number, received: ${ typeof hardwareConcurrency}}`)
        }
    }

    /**
     * @return  {[string,number]} for example: ['cores',12]
     */
    buildQueueMessage(){
        let name = this.getName();
        let message =  [name, this.hardwareConcurrency];
        this.validateMessage(message);
        return message;
    }

    validateMessage(message){
        let isValid =  (
            typeof message[0] === 'string' &&
            typeof message[1] === 'number')
        if (!isValid){
            Log.warn('cores,BrowserPropsContract - Contract verification failed')
        }
    }

    getName() {
        return 'cores';
    }


}
