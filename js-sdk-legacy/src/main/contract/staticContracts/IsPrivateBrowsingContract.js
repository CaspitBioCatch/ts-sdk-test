import StaticContract from "./StaticContract";
import Log from "../../technicalServices/log/Logger";


export default class IsPrivateBrowsingContract extends StaticContract{
    /**
     * @param  {boolean} isPrivate,
     */
    constructor(isPrivate){
        super();
        this.validateParams(isPrivate);
        this.isPrivate = isPrivate;
    }

    validateParams(isPrivate ){
        let isValid =  (
            typeof isPrivate === 'boolean'

        )
        if (!isValid){
            Log.warn(`wrong type in IsPrivateBrowsingContract parameters. isPrivate : {expected: boolean, received: ${ typeof isPrivate}}`)
        }
    }

    /**
     * @return  {[string,boolean]} for example: ['is_private_browsing', true]
     */
    buildQueueMessage(){
        let name = this.getName();
        let message =  [name, this.isPrivate];
        this.validateMessage(message);
        return message;
    }

    validateMessage(message){
        let isValid =  (
            typeof message[0] === 'string' &&
            typeof message[1] === 'boolean')
        if (!isValid){
            Log.warn('IsPrivateBrowsing - Contract verification failed')
        }
    }

    getName() {
        return 'is_private_browsing';
    }


}
