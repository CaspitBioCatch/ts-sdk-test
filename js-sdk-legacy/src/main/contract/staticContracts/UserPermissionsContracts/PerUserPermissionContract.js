import StaticContract from "../StaticContract";
import Log from "../../../technicalServices/log/Logger";


export default class PerUserPermissionContract extends StaticContract{
    /**
     * @param  {string} per
     * @param {number} state
     */
    constructor(per, state){
        super();
        this.validateParams(per, state);
        this.per = per;
        this.state = state;
    }

    validateParams(per , state){
        let isValid =  (
            typeof per === 'string' &&
            typeof state === 'number'
        )
        if (!isValid){
            Log.warn(`wrong type in Per, UserPermissionContract, parameters. per : {expected: string, received: ${ typeof per}}, state : {expected: number, received: ${ typeof state}}`)
        }
    }

    /**
     * @return  {[string,number]} for example: ['per_per', -1]
     */
    buildQueueMessage(){
        let name = this.getName();
        let message =  [name, this.state];
        this.validateMessage(message);
        return message;
    }

    validateMessage(message){
        let isValid =  (
            typeof message[0] === 'string' &&
            typeof message[1] === 'number')
        if (!isValid){
            Log.warn('per, UserPermissionContract - Contract verification failed')
        }
    }

    getName() {
        return `per_${this.per}`;
    }


}
