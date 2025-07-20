import StaticContract from "../StaticContract";
import Log from "../../../technicalServices/log/Logger";


export default class PerKindUserPermissionContract extends StaticContract{
    /**
     * @param  {string} kind
     * @param {number} perm
     */
    constructor(kind, perm){
        super();
        this.validateParams(kind, perm);
        this.kind = kind;
        this.perm = perm;
    }

    validateParams(kind , perm){
        let isValid =  (
            typeof kind === 'string' &&
            typeof perm === 'number'
        )
        if (!isValid){
            Log.warn(`wrong type in PerKind , UserPermissionContract, parameters. kind : {expected: string, received: ${ typeof kind}}, perm : {expected: number, received: ${ typeof perm}}`)
        }
    }

    /**
     * @return  {[string,number]} for example: ['per_kind', -1]
     */
    buildQueueMessage(){
        let name = this.getName();
        let message =  [name, this.perm];
        this.validateMessage(message);
        return message;
    }

    validateMessage(message){
        let isValid =  (
            typeof message[0] === 'string' &&
            typeof message[1] === 'number')
        if (!isValid){
            Log.warn( 'PerKind, UserPermissionContract - Contract verification failed')
        }
    }

    getName() {
        return `per_${this.kind}`;
    }


}
