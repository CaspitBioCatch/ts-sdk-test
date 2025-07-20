import StaticContract from "../StaticContract";
import Log from "../../../technicalServices/log/Logger";


export default class PerStorageUserPermissionContract extends StaticContract{
    /**
     * @param {number} persistent
     */
    constructor(persistent){
        super();
        this.validateParams( persistent);
        this.persistent = persistent;
    }

    validateParams(persistent){
        let isValid =  (
            typeof persistent === 'number'
        )
        if (!isValid){
            Log.warn(`wrong type in PerStorage , UserPermissionContract, parameters. persistent : {expected: number, received: ${ typeof persistent}}`)
        }
    }

    /**
     * @return  {[string,number]} for example: ['per_storage', -1]
     */
    buildQueueMessage(){
        let name = this.getName();
        let message =  [name, this.persistent];
        this.validateMessage(message);
        return message;
    }

    validateMessage(message){
        let isValid =  (
            typeof message[0] === 'string' &&
            typeof message[1] === 'number')
        if (!isValid){
            Log.warn('per_storage, UserPermissionContract - Contract verification failed')
        }
    }

    getName() {
        return `per_storage`;
    }


}
