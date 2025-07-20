
export default class StaticContract {

    //the message should insert to queue regardless of the param validation.
    //upon receiving invalid values- a log should be send
    validateParams(){
        throw new Error( '_validateParams should be overridden');
    }
    buildQueueMessage(){
        throw new Error('buildQueueMessage should be overridden');
    }
    //the message should insert to queue regardless of the message validation.
    //upon receiving invalid value- a log should be send
    validateMessage(){
        throw new Error('_validateMessage should be overridden');
    }

    getName(){
        throw new Error('_getName should be overridden');
    }

}
