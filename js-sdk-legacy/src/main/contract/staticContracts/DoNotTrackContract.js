import Log from "../../technicalServices/log/Logger";
import StaticContract from "./StaticContract";

export default class DoNotTrackContract extends StaticContract{
    /**
     * @param  {number} dnt
     */
    constructor(dnt){
        super();
        this.validateParams(dnt);
        this.dnt = dnt;
    }

    validateParams(dnt){
        let isValid =  (
            typeof dnt === 'number' &&
            ( dnt === 0 ||
              dnt === 1 ||
              dnt === 2 ))
        if (!isValid){
            Log.warn(`wrong type in DoNotTrackContract parameters. dnt : {expected: number in {0,1,2}, received: type: ${typeof dnt}, value: ${dnt}`)
        }
    }

    /**
     * @return  {[string,number]} for example: ['dnt', 1]
     */
    buildQueueMessage(){
        let name = this.getName();
        let message =  [name, this.dnt];
        this.validateMessage(message);
        return message;
    }

    validateMessage(message){
        let isValid =  (
            typeof message[0] === 'string' &&
            typeof message[1] === 'number')
        if (!isValid){
            Log.warn('DoNotTrack - Contract verification failed')
        }
    }

    getName() {
        return 'dnt';
    }


}
