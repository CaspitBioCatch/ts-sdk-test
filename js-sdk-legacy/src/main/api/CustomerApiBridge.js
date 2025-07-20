import { ApiCommandType } from './ApiCommandType';
import { MessageBusEventType } from '../events/MessageBusEventType';
import Log from '../technicalServices/log/Logger';

export default class CustomerApiBridge {
    constructor(pauseResumeMgr, messageBus, cdApiFacade, utils) {
        this._pauseResumeMgr = pauseResumeMgr;
        this._messageBus = messageBus;
        this._cdApiFacade = cdApiFacade;
        this._utils = utils;

        this._createCommandToBusMessageMapping();
    }

    enableApi() {
        Log.info('Enabling api calls');
        this._onApiMessageBinded = this._onApiMessage.bind(this);
        this._utils.addEventListener(window, 'message', this._onApiMessageBinded, true);
    }

    disableApi() {
        Log.info('Disabling api calls');
        this._utils.removeEventListener(window, 'message', this._onApiMessageBinded, true);
    }

    getCustomerSessionID(callback) {
        this._cdApiFacade.getCustomerSessionID((customerSessionID) => {
            callback(customerSessionID);
        });
    }

    getLogServerAddress(callback) {
        this._cdApiFacade.getLogServerAddress((url) => {
            callback(url);
        });
    }

    getServerAddress(callback) {
        this._cdApiFacade.getServerAddress((url) => {
            callback(url);
        });
    }

    getConfigurations(callback) {
        this._cdApiFacade.getConfigurations((configurations) => {
            callback(configurations);
        });
    }

    /**
     * Method posts a window message once a session reset occurs. Exposes a session reset event
     * @param snum
     */
    notifySessionReset(snum) {
        if (this._pauseResumeMgr.isCustomerApiEnabled()) {
            window.postMessage({ type: 'SNumNotification', cdSNum: snum }, window.location.href);
        }
    }

    isApiAvailable(api) {
        return this._cdApiFacade.isApiAvailable(api);
    }

    _onApiMessage(e) {
        // make sure that the message posted from the same tab
        let apiMsg = e.data;
        let msgType = apiMsg.type;
        if (msgType === undefined) {
            // we may be in IE <=9 which passes only strings so the msg may be stringified
            try {
                apiMsg = JSON.parse(apiMsg);
                msgType = apiMsg.type;
            } catch (ex) {
                // Swallow exception
            }
        }

        if (msgType === ApiCommandType.ChangeStateCommand || (this._pauseResumeMgr.isCustomerApiEnabled() && this._apiCommandToBusMessageMapping[msgType])) {
            // even when api is disabled we should enable running the pause/resume api
            e.preventDefault && e.preventDefault(); // IE8 does not support
            e.stopPropagation && e.stopPropagation();
            this._messageBus.publish(this._apiCommandToBusMessageMapping[msgType], apiMsg);
        }
    }

    _createCommandToBusMessageMapping() {
        this._apiCommandToBusMessageMapping = {};
        this._apiCommandToBusMessageMapping[ApiCommandType.ContextChangeCommand] = MessageBusEventType.ApiContextChangeEvent;
        this._apiCommandToBusMessageMapping[ApiCommandType.ResetSessionCommand] = MessageBusEventType.ApiResetSessionEvent;
        this._apiCommandToBusMessageMapping[ApiCommandType.CustomerMetadataCommand] = MessageBusEventType.ApiCustomerMetadataEvent;
        this._apiCommandToBusMessageMapping[ApiCommandType.ChangeStateCommand] = MessageBusEventType.ApiChangeStateEvent;
        this._apiCommandToBusMessageMapping[ApiCommandType.SetCsidCommand] = MessageBusEventType.ApiSetCsidEvent;
        this._apiCommandToBusMessageMapping[ApiCommandType.SetPsidCommand] = MessageBusEventType.ApiSetPsidEvent;
        this._apiCommandToBusMessageMapping[ApiCommandType.SetCustomerBrand] = MessageBusEventType.ApiSetCustomerBrand;
    }
}
