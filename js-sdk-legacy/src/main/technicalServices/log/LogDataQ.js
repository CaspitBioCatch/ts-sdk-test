import DataQ from "../DataQ";

export default class LogDataQ extends DataQ{

    add(message){
        this.addToQueue(message.eventName, message.data);
    }

    filterOutByLogLevel(logLevel){
        this.filterOut(function(value){
            return value.data.level >= logLevel;
        });
    }
}