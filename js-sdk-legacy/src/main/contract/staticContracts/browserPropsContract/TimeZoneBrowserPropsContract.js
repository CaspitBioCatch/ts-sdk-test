import StaticContract from "../StaticContract";
import Log from "../../../technicalServices/log/Logger";


export default class TimeZoneBrowserPropsContract extends StaticContract{
    /**
     * @param  {number} tz, positive number, for example: 180
     */
    constructor(tz){
        super();
        this.validateParams(tz);
        this.tz = tz;
    }

    validateParams(tz ){
        let isValid =  (
            typeof tz === 'number')
        if (!isValid){
            Log.warn(`wrong type in TimeZone, BrowserProps parameters. tz : {expected: string, received: ${ typeof tz}}`)
        }
    }

    /**
     * @return  {[string,number]} for example: ['time_zone', 180]
     */
    buildQueueMessage(){
        let name = this.getName();
        let message =  [name, this.tz];
        this.validateMessage(message);
        return message;
    }

    validateMessage(message){
        let isValid =  (
            typeof message[0] === 'string' &&
            typeof message[1] === 'number')
        if (!isValid){
            Log.warn('time_zone, BrowserPropsContract - Contract verification failed')
        }
    }

    getName() {
        return 'time_zone';
    }


}
