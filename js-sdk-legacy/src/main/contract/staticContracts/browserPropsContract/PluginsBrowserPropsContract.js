import StaticContract from "../StaticContract";
import Log from "../../../technicalServices/log/Logger";


export default class PluginsBrowserPropsContract extends StaticContract{
    /**
     * @param  {[[...string]]} plugins, Array of Arrays of strings : [['name':string, 'filename':string, 'description':string, 'version':string],...]
     */
    constructor(plugins){
        super();
        this.validateParams(plugins);
        this.plugins = plugins;
    }

    validateParams(plugins ){
        let isValid =  (
            Array.isArray(plugins)  &&
            this._eachPluginIsValid(plugins)
        )
        if (!isValid){
            Log.warn(` wrong type in plugins, BrowserProps parameters. plugins : {expected: [[...string]], received: ${ typeof plugins}}`)
        }
    }

    _eachPluginIsValid(plugins){
        let validArrays = true;
        let validStrings = true;
        let validLengths = true;

        for (let i of plugins){
            if(!(Array.isArray(i)))  {
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
     * @return  {[string,[[...string]]]} for example : ['plugins',[['PDF Viewer', 'internal-pdf-viewer', 'Portable Document Format', ''], ['name2', 'filename2', 'description2', 'version2']]]
     */
    buildQueueMessage(){
        let name = this.getName();
        let message =  [name, this.plugins];
        this.validateMessage(message);
        return message;
    }

    validateMessage(message){
        let isValid =  (
            typeof message[0] === 'string' &&
           Array.isArray(message[1]))
        if (!isValid){
            Log.warn('plugins, BrowserPropsContract - Contract verification failed')
        }
    }

    getName() {
        return 'plugins';
    }


}
