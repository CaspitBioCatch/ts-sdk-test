import StaticContract from "../StaticContract";
import Log from "../../../technicalServices/log/Logger";


export default class LangBrowserPropsContract extends StaticContract{
    /**
     * @param  {string} language for example: 'en-US'
     */
    constructor(language){
        super();
        this.validateParams(language);
        this.language = language;
    }

    validateParams(language){
        let isValid =  (typeof language === 'string' )
        if (!isValid){
            Log.warn(` wrong type in Lang, BrowserProps parameters. language : {expected: string, received: ${ typeof language}}`)
        }
    }

    /**
     * @return  {[string,string]} for example: ['main_lang', 'en-US']
     */
    buildQueueMessage(){
        let name = this.getName();
        let message =  [name, this.language];
        this.validateMessage(message);
        return message;
    }

    validateMessage(message){
        let isValid =  (
            typeof message[0] === 'string' &&
            typeof message[1] === 'string')
        if (!isValid){
            Log.warn('main_lang, BrowserPropsContract - Contract verification failed')
        }
    }

    getName() {
        return 'main_lang';
    }


}
