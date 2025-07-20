import StaticContract from "../StaticContract";
import Log from "../../../technicalServices/log/Logger";


export default class OSBrowserPropsContract extends StaticContract{
    /**
     * @param  {string} platform string of type DOMString. for example: 'MacIntel'
     */
    constructor(platform){
        super();
        this.validateParams(platform);
        this.platform = platform;
    }

    validateParams(platform){
        let isValid =  (typeof platform === 'string' )
        if (!isValid){
            Log.warn(` wrong type in OS, BrowserProps parameters. platform : {expected: string, received: ${ typeof platform}}`)
        }
    }

    /**
     * @return  {[string,string]} for example: ['os', 'Win32']
     */
    buildQueueMessage(){
        let name = this.getName();
        let message =  [name, this.platform];
        this.validateMessage(message);
        return message;
    }

    validateMessage(message){
        let isValid =  (
            typeof message[0] === 'string' &&
            typeof message[1] === 'string')
        if (!isValid){
            Log.warn('os, BrowserPropsContract - Contract verification failed')
        }
    }

    getName() {
        return 'os';
    }


}
