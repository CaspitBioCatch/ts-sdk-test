import StaticContract from "../StaticContract";
import Log from "../../../technicalServices/log/Logger";


export default class DeviceMemoryBrowserPropsContract extends StaticContract{
    /**
     * @param  {float} memory, A floating point number; one of 0.25, 0.5, 1, 2, 4, 8,|| 0 if the browser is not supporting the method
     */
    constructor(memory){
        super();
        this.validateParams(memory);
        this.memory = memory;
    }

    validateParams(memory ){
        let isValid =  (
            typeof memory === 'number' &&
            ( memory === 0.25 ||
                memory === 0.5 ||
                memory === 1 ||
                memory === 2 ||
                memory === 4 ||
                memory ===8 ||
                memory === 0)
        )
        if (!isValid){
            Log.warn(`wrong type in DeviceMemoryBrowser, BrowserProps parameters. memory : {expected: number in {0.25, 0.5, 1, 2, 4, 8, 0} received: type:${ typeof memory} value:${memory}}`)
        }
    }

    /**
     * @return  {[string,float]} for example : ['device_memory', 0.25]
     */
    buildQueueMessage(){
        let name = this.getName();
        let message =  [name, this.memory];
        this.validateMessage(message);
        return message;
    }

    validateMessage(message){
        let isValid =  (
            typeof message[0] === 'string' &&
            typeof message[1] === 'number')
        if (!isValid){
            Log.warn('device_memory, BrowserPropsContract - Contract verification failed')
        }
    }

    getName() {
        return 'device_memory';
    }


}
