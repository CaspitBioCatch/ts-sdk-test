import StaticContract from "../StaticContract";
import Log from "../../../technicalServices/log/Logger";


export default class OSFamilyBrowserPropsContract extends StaticContract{
    /**
     * @param  {string} osName, for example: 'Macintosh'
     */
    constructor(osName){
        super();
        this.validateParams(osName);
        this.osName = osName;
    }

    validateParams(osName){
        let isValid =  (typeof osName === 'string' )
        if (!isValid){
            Log.warn(` wrong type in OSFamily, BrowserProps parameters. osName : {expected: string, received: ${ typeof osName}}`)
        }
    }

    /**
     * @return  {[string,string]} for example: ['os_version', 'posix']
     */
    buildQueueMessage(){
        let name = this.getName();
        let message =  [name, this.osName];
        this.validateMessage(message);
        return message;
    }

    validateMessage(message){
        let isValid =  (
            typeof message[0] === 'string' &&
            typeof message[1] === 'string')
        if (!isValid){
            Log.warn('os_family, BrowserPropsContract - Contract verification failed')
        }
    }

    getName() {
        return 'os_family';
    }


}
