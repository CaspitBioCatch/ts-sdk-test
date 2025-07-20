import { WorkerEvent } from '../../events/WorkerEvent';
import { ConfigurationFields } from './ConfigurationFields';
import { MessageBusEventType } from '../../events/MessageBusEventType';
import { WorkerCommand } from '../../events/WorkerCommand';
import Log from '../../technicalServices/log/Logger';

export default class ConfigurationService {
    constructor(utils, configurationRepository, messageBus, cidCache, workerCommunicator) {
        if (!messageBus) {
            throw new Error('messageBus param must be defined');
        }

        this._configurationLoadedCallback = null;
        this._utils = utils;
        this._configurationRepository = configurationRepository;
        this._messageBus = messageBus;
        this._cidCache = cidCache;

        // Register for the event only if we have a worker communicator. This hack should be removed and isntead the config manager, should only be used
        // by the main thread. Worker, Slave should use a configuration repository of some sort.
        if (workerCommunicator) {
            workerCommunicator.addMessageListener(WorkerEvent.ConfigurationLoadedEvent, this._onConfigurationLoadedEvent.bind(this));
        }
    }

    updateLogUrlToWorker(sid, csid, workerComm) {
        let logAddress = this._configurationRepository.get(ConfigurationFields.logAddress);
        if (this._isValidLogUrl(logAddress)) {
            const minify = this._configurationRepository.get(ConfigurationFields.enableMinifiedLogUri);
            if (minify) {
                let logAddressUrl = new URL(logAddress);
                // When minify configured - strip all path from the url.
                // The incentive for doing so is to make it less likely that Add-Blockers would block our url path pattern.
                logAddress = logAddressUrl.protocol + '//' + logAddressUrl.host;
            }

            const sessionIdentifiers = {
                cid: this._cidCache.get(),
                sid: sid,
                csid: csid,
                ds: 'js',
                sdkVer: this._utils.scriptVersion
            };

            /**
             *
             * Attach the session identifiers to the sdk main context Logger.
             *
             * By legacy - these parameters were set on the url as REST params.
             * The easiest why for AddBlockers to block network requests is by black-listing sub-path patterns contain specific args.
             *
             *  Log.attachSessionIdentifiers is insuring these params will be sent as part of the data in the request's body instead.
             */
            Log.attachSessionIdentifiers(sessionIdentifiers);

            const message = {
                logAddress: logAddress,
                // attaching the sessionIdentifiers so that the worker could use them for updating it own Logger as well.
                sessionIdentifiers: sessionIdentifiers
            };

            workerComm.sendAsync(WorkerCommand.updateLogUrlCommand, message);
        }
    }

    _isValidLogUrl(url) {
        try {
            new URL(url);
            return true;
        } catch (e) {
            // Nothing to do. received invalid log url.
            // Therefore, logging this error will also would be useless
            return false;
        }
    }

    /**
     * Another hack to comply with the current requirement for a callback to be triggered once configuration is loaded
     * @param callback
     */
    setConfigurationLoadedCallback(callback) {
        this._configurationLoadedCallback = callback;
    }

    _onConfigurationLoadedEvent(configurationsStructure) {
        // Load the configurations into the repository
        this._configurationRepository.loadConfigurations(configurationsStructure);

        // Should be removed ASAP. Ugly ugly ugly!!!!
        if (this._configurationLoadedCallback) {
            this._configurationLoadedCallback(this._configurationRepository.get(ConfigurationFields.isEnabled));
        }

        // Notify the system that configuration was loaded
        this._messageBus.publish(MessageBusEventType.ConfigurationLoadedEvent, this._configurationRepository);
    }
}
