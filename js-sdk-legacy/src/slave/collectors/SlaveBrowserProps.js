import VersionClientBrowserPropsContract
    from "../../main/contract/staticContracts/browserPropsContract/VersionClientBrowserPropsContract";
import DeviceSourceBrowserPropsContract
    from "../../main/contract/staticContracts/browserPropsContract/DeviceSourceBrowserPropsContract";
import Log from "../../main/technicalServices/log/Logger";


export default class SlaveBrowserProps{
    constructor(dataQ,utils) {
        this._dataQ= dataQ;
        this._utils = utils;
    }

    startFeature(){
        const prefix = 'slave_';
        let versionClientBrowserPropsContract = new VersionClientBrowserPropsContract(this._utils.scriptVersion);
        let versionClientData = versionClientBrowserPropsContract.buildQueueMessage();
        //in order to differentiate between the main and the slave version a prefix of slave_ was added
        versionClientData[0] = prefix.concat(versionClientData[0]);
        this._dataQ.addToQueue('static_fields', versionClientData, false);

        let deviceSourceBrowserPropsContract = new DeviceSourceBrowserPropsContract('js');
        let deviceSourceData = deviceSourceBrowserPropsContract.buildQueueMessage();
        this._dataQ.addToQueue('static_fields', deviceSourceData, false);

        Log.info(`Slave version is ${this._utils.scriptVersion}`);
    }


}