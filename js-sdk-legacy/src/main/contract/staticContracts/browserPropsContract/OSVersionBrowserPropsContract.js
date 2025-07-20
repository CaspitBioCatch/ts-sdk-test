import StaticContract from "../StaticContract";
import Log from "../../../technicalServices/log/Logger";


export default class OSVersionBrowserPropsContract extends StaticContract{
    /**
     * @param  {number} version, for example: 10.157 or null
     */
    constructor(version){
        super();
        this.validateParams(version);
        this.version = version;
    }

    validateParams(version){
        let isValid =  (typeof version === 'number'  || version === null)
        if (!isValid){
            Log.warn(` wrong type in OSVersion, BrowserProps parameters. version : {expected: number, received: ${ typeof version}}`)
        }
    }

    /**
     * @return  {[string,number]} for example: ['os_version', 10.157]
     */
    buildQueueMessage(){
        let name = this.getName();
        let message =  [name, this.version];
        this.validateMessage(message);
        return message;
    }

    validateMessage(message){
        let isValid =  (
            typeof message[0] === 'string' &&
            (typeof message[1] === 'number'||
                message[1] === null
            ))
        if (!isValid){
            Log.warn('os_version, BrowserPropsContract - Contract verification failed')
        }
    }

    getName() {
        return 'os_version';
    }


}
