import Log from '../../technicalServices/log/Logger';
import { ConfigurationFields } from '../configuration/ConfigurationFields';
import {WorkerCommand} from "../../events/WorkerCommand";
import {State} from "./State";

// TODO: Remove this and use the state enum instead
export const PauseResumeState = {
    RUNNING: 0,
    PAUSED: 1,
};

/**
 * This class manages the sdk state of RUNNING or PAUSED.
 * While sdk is paused as a result of API call (cdApi.pauseCollection()) no other API can be called
 * (beside cdApi.resumeCollection()). The CustomerApiBridge will query the isCustomerApiEnabled() to
 * check it.
 * The ability to pause / resume is configurable through the 'stateChangeEnabled' configuration.
 * By default it will be false and will be enabled only to customers who need it.
 * If someone called the api and he should not (maybe fraudster?) we are reporting it to the server side.
 */
export default class PauseResumeManager {
    constructor(featureMgr, configurationRepository, dataQ, stateService, workerComm) {
        this._featureMgr = featureMgr;
        this._dataQ = dataQ;
        this._configurationRepository = configurationRepository;
        this._pauseResumeEnabled = configurationRepository.get(ConfigurationFields.stateChangeEnabled) || false;
        this._sdkState = PauseResumeState.RUNNING;
        this._stateService = stateService;
        this._workerComm = workerComm
    }

    onResume() {
        if (this._sdkState === PauseResumeState.PAUSED) {
            Log.info('Resuming JS SDK');
            // This will start all the feature based on the configuration
            this._featureMgr.updateRunByConfig(this._configurationRepository);
            this._sdkState = PauseResumeState.RUNNING;
            this._stateService.updateState(State.started)
        } else {
            Log.warn('PauseResumeManager:onResume - resume api called when SDK already running');
        }
    }

    onPause() {
        if (this._sdkState === PauseResumeState.RUNNING) {
            Log.info('Pausing JS SDK');
            this._featureMgr.stopAllFeatures();
            this._sdkState = PauseResumeState.PAUSED;
            this._stateService.updateState(State.paused)
        } else {
            Log.warn('Pause api called when SDK already paused');
        }
    }

    onStateChange(msg) {
        if (msg.toState && this._verifyApiAllowed(msg.toState)) {
            if (msg.toState === 'pause') {
                this.onPause();
                this.updateSDKStateToWorker(PauseResumeState.PAUSED)
            } else if (msg.toState === 'run') {
                this.onResume();
                this.updateSDKStateToWorker(PauseResumeState.RUNNING)
            } else {
                Log.warn('stateChange api called with non valid toState: ' + msg.toState);
            }
        }
    }

    updateSDKStateToWorker(state) {
        const message = {
            SDK_state: state,
        };
        this._workerComm.sendAsync(WorkerCommand.updateSDKStateCommand, message);
    }

    /**
     * Related to the APIs that are not pause/resume
     * @returns {boolean}
     */
    isCustomerApiEnabled() {
        return this._sdkState === PauseResumeState.RUNNING;
    }

    _verifyApiAllowed(funcName) {
        if (!this._pauseResumeEnabled) {
            this._dataQ.addToQueue('forbidden_api_call', [null, funcName]);
            return false;
        }
        return true;
    }

    onConfigUpdate() {
        this._pauseResumeEnabled = this._configurationRepository.get(ConfigurationFields.stateChangeEnabled) || false;
        if (this._configurationRepository.get('isEnabled') === false) {
            this.onPause();
        }
    }
}
