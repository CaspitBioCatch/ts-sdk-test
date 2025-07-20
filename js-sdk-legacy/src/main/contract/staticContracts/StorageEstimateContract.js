import Log from "../../technicalServices/log/Logger";
import StaticContract from "./StaticContract";

export default class StorageEstimateContract extends StaticContract {
    /**
     * @param  {number} usage
     * @param  {number} quota
     */
    constructor(usage, quota) {
        super();
        this.validateParams(usage, quota);
        this.usage = usage;
        this.quota = quota;
    }

    validateParams(usage, quota) {
        let isValid = (
            typeof usage === 'number' &&
            typeof quota === 'number'
        )

        if (!isValid) {
            Log.warn(`wrong type in StorageEstimate parameters. usage : {expected: number, received: ${ typeof usage}}, quota : {expected: number, received: ${ typeof quota}}`)
        }
    }

    /**
     * @return  {[string, [number, number]]} for example: ['storage_estimate', [2126, 296630877388]]
     */
    buildQueueMessage() {
        let name = this.getName();
        let message =  [
            name,[
                this.usage,
                this.quota
            ]];
        this.validateMessage(message);
        return message;
    }

    validateMessage(message){
        let isValid =  (
            typeof message[0] === 'string' &&
            Array.isArray(message[1]) &&
            message[1].length === 2)
        if (!isValid){
            Log.warn('StorageEstimate - Contract verification failed')
        }
    }

    getName() {
        return 'storage_estimate';
    }
}