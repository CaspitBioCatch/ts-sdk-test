import StaticContract from "../StaticContract";
import Log from "../../../technicalServices/log/Logger";


export default class LanguagesListBrowserPropsContract extends StaticContract{
    /**
     * @param  {[...string]} languagesList for example: ['en-US', 'en']
     */
    constructor(languagesList){
        super();
        this.validateParams(languagesList);
        this.languagesList = languagesList;
    }

    validateParams(languagesList){
        let isValid =  (Array.isArray(languagesList)  &&
           this._eachLangIsValid(languagesList))
        if (!isValid){
            Log.warn(` wrong type in LanguagesList, BrowserProps parameters. languagesList : {expected: [...string], received: ${ typeof languagesList}}`)
        }
    }

    _eachLangIsValid(languagesList){
        let validStrings = true;

        for (let i of languagesList){
            if(typeof i !== 'string')  {
                validStrings = false;
            }
        }
        return (validStrings);
    }

    /**
     * @return  {[string,string]} for example: ['main_lang', ['en-US', 'en']]
     */
    buildQueueMessage(){
        let name = this.getName();
        let message =  [name, this.languagesList];
        this.validateMessage(message);
        return message;
    }

    validateMessage(message){
        let isValid =  (
            typeof message[0] === 'string' &&
            Array.isArray (message[1]))
        if (!isValid){
            Log.warn('languages, BrowserPropsContract - Contract verification failed')
        }
    }

    getName() {
        return 'languages';
    }


}
