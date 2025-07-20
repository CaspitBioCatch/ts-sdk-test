import StaticContract from "../StaticContract";
import Log from "../../../technicalServices/log/Logger";


export default class VersionClientBrowserPropsContract extends StaticContract{
    /**
     * @param  {string} scriptVersion, for example:'dev-version.0.18c28ea0'
     */
    constructor(scriptVersion){
        super();
        this.validateParams(scriptVersion);
        this.scriptVersion = scriptVersion;
    }

    validateParams(scriptVersion){
        let isValid =  (typeof scriptVersion === 'string' )
        if (!isValid){
            Log.warn(` wrong type in VersionClient, BrowserProps parameters. scriptVersion : {expected: string, received: ${ typeof scriptVersion}}`);
        }
    }

    /**
     * @return  {[string,string]} for example: ['version_client', 'dev-version.0.18c28ea0']
     */
    buildQueueMessage(){
        let name = this.getName();
        let message =  [name, this.scriptVersion];
        this.validateMessage(message);
        return message;
    }

    validateMessage(message){
        let isValid =  (
            typeof message[0] === 'string' &&
            typeof message[1] === 'string')
        if (!isValid){
            Log.warn('version_client, BrowserPropsContract - Contract verification failed')
        }
    }

    getName() {
        return 'version_client';
    }


}
