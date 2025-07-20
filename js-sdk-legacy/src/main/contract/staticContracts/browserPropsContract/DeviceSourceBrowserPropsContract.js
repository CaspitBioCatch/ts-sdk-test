import StaticContract from "../StaticContract";
import Log from "../../../technicalServices/log/Logger";


export default class DeviceSourceBrowserPropsContract extends StaticContract{
    /**
     * @param  {string} source, for example:'js'
     */
    constructor(source){
        super();
        this.validateParams(source);
        this.source = source;
    }

    validateParams(source){
        let isValid =  (typeof source === 'string' )
        if (!isValid){
            Log.warn(` wrong type in DeviceSource, BrowserProps parameters. source : {expected: string, received: ${ typeof source}}`)
        }
    }

    /**
     * @return  {[string,string]} for example: ['device_source', 'js']
     */
    buildQueueMessage(){
        let name = this.getName();
        let message =  [name, this.source];
        this.validateMessage(message);
        return message;
    }

    validateMessage(message){
        let isValid =  (
            typeof message[0] === 'string' &&
            typeof message[1] === 'string')
        if (!isValid){
            Log.warn('device_source, BrowserPropsContract - Contract verification failed')
        }
    }

    getName() {
        return 'device_source';
    }


}