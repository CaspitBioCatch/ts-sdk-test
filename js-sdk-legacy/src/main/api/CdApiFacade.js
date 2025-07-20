/**
 * The cdApi facade exposes the various apis available for the SDK to use.
 * This API should be used for querying configurations external to the SDK if available.
 */
import { ApiContractName } from './ApiContractName';
import StartupConfigurations from './StartupConfigurations';
import Log from '../technicalServices/log/Logger';
import URLFieldsExtractor from '../technicalServices/URLFieldsExtractor';
import URLBuilder from '../technicalServices/URLBuilder';
import { APIConfigurationKey } from '../contract/APIConfigurationKey';
import CDAPIException from '../core/exceptions/CDAPIException';
import { ClientSettingsKey } from '../contract/ClientSettingsKey';
import { ConfigMapper } from '../core/ConfigMapper';

export default class CdApiFacade {
    constructor(utils, cdApi) {
        this._cdApi = cdApi;
        this._utils = utils;
    }

    /**
     * Helper function to always get the relevant cdApi
     * When coming from Npm flow -> this._cdApi
     * When coming from legacy flow -> window.cdApi
     */
    cdApi() {
        // this._cdApi != undefined only on NPM.
        return this._cdApi || window.cdApi;
    }

    /**
     * Get the customer session ID if available by callback
     * @param callback
     */
    getCustomerSessionID(callback) {
        this._getFromApiOrEmpty('getCustomerSessionID', (csnum) => {
            callback(csnum);
        });
    }

    /**
     * Get the log server url if available by callback. This function should not be used since its deprecated. Use getConfigurations instead.
     * @param callback
     */
    getLogServerAddress(callback) {
        this._getFromApiOrEmpty('getLogServerAddress', (url) => {
            callback(url);
        });
    }

    /**
     * Get the server url if available by callback. This function should not be used since its deprecated. Use getConfigurations instead.
     * @param callback
     */
    getServerAddress(callback) {
        this._getFromApiOrEmpty('getCustomerConfigLocation', (url) => {
            callback(url);
        });
    }

    /**
     * Get all configurations in a single api which receives a dictionary of configurations on initialization
     * @param callback
     */
    getConfigurations(callback) {
        let wupServerURL = null;
        // If we have the getConfigurations API
        if (this.isApiAvailable(ApiContractName.GetConfigurations)) {
            this._getFromApiOrEmpty(ApiContractName.GetConfigurations, (configurations) => {
                let startupConfigurations = null;
                // If we have configuration keys and configurations we try to extract the configurations
                if (configurations) {
                    if (configurations.isWupServerURLProxy) {
                        wupServerURL = configurations.wupServerURL;
                    }
                    else if (configurations[APIConfigurationKey.wupServerURL]) {
                        wupServerURL = URLBuilder.buildCustomServerUrl(configurations[APIConfigurationKey.wupServerURL]);
                    } else if (configurations[APIConfigurationKey.customerID] && configurations[APIConfigurationKey.serverURL]) {
                        wupServerURL = URLBuilder.build(configurations[APIConfigurationKey.serverURL], configurations[APIConfigurationKey.customerID]);
                    } else {
                        throw new Error('Invalid serverURL or cid. Parameter is empty');
                    }

                    const configurationMapper = new ConfigMapper();

                    startupConfigurations = configurationMapper.mapStartupConfigurations(wupServerURL, configurations);
                }

                callback(startupConfigurations);
            });
        }
        else {
            this.getLogServerAddress((defaultLogAddress) => {
                // get server url
                this.getServerAddress((configUrl) => {
                    const extractedFields = URLFieldsExtractor.extract(configUrl);
                    wupServerURL = URLBuilder.build(extractedFields.serverURL, extractedFields.cid);
                    callback(new StartupConfigurations(wupServerURL,
                        defaultLogAddress,
                        null,
                        false,
                        '',
                        null));
                });
            });
        }
    }

    createClientInterface(client, clientSettings) {
        if (!this.isCDAPIAvailable()) {
            Log.error('Failed setting client facade. cdApi is unavailable.');
            throw new CDAPIException('Failed setting client facade. cdApi is unavailable.');
        }

        const clientObject = {};

        clientObject.setCoordinatesMasking = (mouseMasking) => {
            client.setCoordinatesMasking(mouseMasking);
        }

        if (clientSettings && clientSettings[ClientSettingsKey.enableRestart]) {
            clientObject.restart = () => {
                client.restart();
            };
        }

        if (clientSettings && clientSettings[ClientSettingsKey.enableFlush]) {
            clientObject.flush = () => {
                client.flush();
            };
        }
        if (clientSettings && clientSettings[ClientSettingsKey.enableCustomElements]) {
            clientObject.submitCustomElement = (customElement) => {
                client.submitCustomElement(customElement);
            };
        }

        // This object will be set on the cdApi object
        this.cdApi()[ApiContractName.ClientFacade] = clientObject;
    }

    isCDAPIAvailable() {
        // If there is no cdApi at all
        if (!this.cdApi()) {
            return false;
        }

        return true;
    }

    isApiAvailable(api) {
        // If there is no cdApi at all
        if (!this.cdApi()) {
            return false;
        }

        // If the client didn't implement the specific api...
        if (!this.cdApi()[api]) {
            return false;
        }

        return true;
    }

    _getFromApiOrEmpty(api, callback, retryCount = 0) {
        // If the client didn't implement the cdApi or it wasn't loaded yet...
        if (!this.cdApi()) {
            if (retryCount >= 20) {
                Log.error('Failed getting cdApi after all retries.');
                return;
            }

            // Log the warning only on the first attempt so we don't flood ourselves with logs
            if (retryCount === 0) {
                Log.warn(`cdApi not found in retry ${retryCount}`);
            }

            retryCount++;
            setTimeout(this._getFromApiOrEmpty.bind(this, api, callback, retryCount), 100); // the bind is for the callback to pass
            return;
        }

        // If the client didn't implement the specific api...
        if (!this.cdApi()[api]) {
            Log.warn(`User did not implement cdApi method: ${api}`);
            callback('');
            return;
        }

        try {
            this.cdApi()[api](callback);
        } catch (ex) {
            Log.error(`An error has occurred while calling cdApi ${api} function. Exception was thrown from client implementation.`, ex);
            // After we logged the error from cdApi implementation we rethrow the exception so that caller can handle it.
            throw ex;
        }
    }
}
