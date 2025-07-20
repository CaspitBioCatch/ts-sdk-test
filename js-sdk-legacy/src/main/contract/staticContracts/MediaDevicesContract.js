import StaticContract from "./StaticContract";
import Log from "../../technicalServices/log/Logger";


export default class MediaDevicesContract extends StaticContract{
    /**
     * @param  {[[...string]]} mediaDevices, Array of Arrays of strings : [['kind':string, 'label':string, 'deviceId':string, 'groupId':string],...]
     */
    constructor(mediaDevices){
        super();
        this.validateParams(mediaDevices);
        this.mediaDevices = mediaDevices;
    }

    validateParams(mediaDevices ){
        let isValid =  (
            Array.isArray(mediaDevices)  &&
            this._eachDeviceIsValid(mediaDevices)
        )
        if (!isValid){
            Log.warn(` wrong type in MediaDevicesContract parameters. mediaDevices : {expected: [[...string]], received: ${mediaDevices}}`)
        }
    }
    _eachDeviceIsValid(mediaDevices){
        let validArrays = true;
        let validStrings = true;
        let validLengths = true;

        for (let i of mediaDevices){
            if(!(Array.isArray(i))){
                validArrays = false;
            }
            else {
                if(i.length !== 4) {
                    validLengths = false;
                }
                    for (let j of i) {
                        if (typeof j !== 'string') {
                            validStrings = false;
                        }
                    }
            }
        }
        return (validArrays && validLengths && validStrings );
    }

    /**
     * @return  {[string,[[...string]]]} for example : ['media_devices',[['kind1', 'label1', 'deviceId1', 'groupId1'], ['kind2', 'label2', 'deviceId2', 'groupId2']]]
     */
    buildQueueMessage(){
        let name = this.getName();
        let message =  [name, this.mediaDevices];
        this.validateMessage(message);
        return message;
    }

    validateMessage(message){
        let isValid =  (
            typeof message[0] === 'string' &&
            Array.isArray(message[1]));
        if (!isValid){
            Log.warn('MediaDevices - Contract verification failed')
        }
    }

    getName() {
        return 'media_devices';
    }


}
