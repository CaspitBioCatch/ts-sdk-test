import StaticContract from "../StaticContract";
import Log from "../../../technicalServices/log/Logger";


export default class InputMechBrowserPropsContract extends StaticContract{
    /**
     * @param  {number} pointer, , for example: 1
     * @param  {number} hover , for example: 2
     */
    constructor(pointer, hover){
        super();
        this.validateParams(pointer, hover);
        this.pointer = pointer;
        this.hover = hover;
    }

    validateParams(pointer, hover ){
        let isValid =  (
            typeof pointer === 'number'  &&
            (pointer === 1 || pointer === 2 ||pointer === 3 ||pointer === 4 ||pointer === 5) &&
            typeof hover === 'number' &&
            (hover === 1 || hover === 2 ||hover === 3 ||hover === 4 ||hover === 5)
        )
        if (!isValid){
            Log.warn(` wrong type in InputMech, BrowserProps parameters. pointer : {expected: number, received: ${ typeof pointer}}, hover : {expected: number, received: ${ typeof hover}}`)
        }
    }

    /**
     * @return  {[string,[...number]]} for example:['input_mech', [1,2]]
     */
    buildQueueMessage(){
        let name = this.getName();
        let message =  [
            name,
            [this.pointer,
            this.hover]
        ];
        this.validateMessage(message);
        return message;
    }

    validateMessage(message){
        let isValid =  (
            typeof message[0] === 'string' &&
            Array.isArray(message[1]) &&
            message[1].length === 2
        )
        if (!isValid){
            Log.warn('input_mech, BrowserPropsContract - Contract verification failed')
        }
    }

    getName() {
        return 'input_mech';
    }


}
