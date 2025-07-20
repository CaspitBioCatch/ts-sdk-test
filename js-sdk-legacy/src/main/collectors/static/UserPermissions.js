/**
 * Collect the user permissions granted to the domain. The permissions are per domain and
 * different from browser to browser. There are 3 possible values: granted, prompt, denied
 *  Supported in: Chrome, FF, Opera
 */
import DataCollector from '../DataCollector';
import Log from '../../technicalServices/log/Logger';
import PerUserPermissionContract from "../../contract/staticContracts/UserPermissionsContracts/PerUserPermissionContract";
import PerStorageUserPermissionContract from "../../contract/staticContracts/UserPermissionsContracts/PerStorageUserPermissionContract";
import PerKindUserPermissionContract from "../../contract/staticContracts/UserPermissionsContracts/PerKindUserPermissionContract";

const featureSettings = {
    configKey: 'isUserPermissions',
    isDefault: false,
    shouldRunPerContext: false,
    shouldRunPerSession: true,
    shouldRun: true,
    isFrameRelated: false,
    runInUns: false,
    runInSlave: false,
    runInLean: false,
    isRunning: false,
    instance: null,
};

export default class UserPermissions extends DataCollector {
    static getDefaultSettings() {
        return featureSettings;
    }

    constructor(dataQ, navig = window.navigator) {
        super();
        this._permDefs = {
            granted: 1,
            prompt: 2,
            denied: 3,
            true: 1,
            false: 3,
        };
        this._permissions = ['geolocation', 'midi', 'notifications', 'push'];
        this._dataQ = dataQ;
        this._navigator = navig;
        // 'camera', 'microphone' also appear in docs but are not working on any browser yet. Will be in the future.
        // So currently we check them by using navigator.mediaDevices.enumerateDevices.
        // 'persistent-storage' is working in FF but not in chrome and there is another way to check it
        // so we use the other way
    }

    startFeature() {
        this._reportQueryPermissions();
        this._reportStoragePermission();
        this._reportMicCameraPermissions();
    }

    /**
     * All the query permissions are on of the 3 values: granted, prompt, denied
     * @private
     */
    _reportQueryPermissions() {
        if (this._navigator.permissions && this._navigator.permissions.query) {
            const logger = Log;

            for (let i = 0; i < this._permissions.length; i++) {
                const per = this._permissions[i];
                this._navigator.permissions.query({ name: per })
                    .then((result) => {
                        const state = this._permDefs[result.state] || -1;
                        let perContract = new PerUserPermissionContract (per, state);
                        let perData = perContract.buildQueueMessage();
                        this._dataQ.addToQueue('static_fields', perData, false);
                    })
                    .catch((ex) => {
                        // Log these errors in debug. There are various errors from different browsers since the API is not fully supported...
                        logger.debug(`Failed querying for ${per} permissions ${ex.message}`);
                    });
            }
        }
    }

    /**
     * The persisted callback return true or false and we translate it to granted (1) and denied (3)
     * @private
     */
    _reportStoragePermission() {
        // check for persistent storage permissions separately
        if (this._navigator.storage && this._navigator.storage.persisted) {
            this._navigator.storage.persisted()
                .then((persistent) => {
                    let perStorageContract = new PerStorageUserPermissionContract (this._permDefs[persistent] || -1);
                    let perStorageData = perStorageContract.buildQueueMessage();
                    this._dataQ.addToQueue('static_fields', perStorageData, false);
                })
                .catch((ex) => {
                    Log.debug(`Failed to check storage persisted: ${ex.message}`);
                });
        }
    }

    /**
     * We know whether there is a permission for the audio/video by checking the 'label' of the device.
     * If the label != "" then the user gave permissions, otherwise he did not.
     * @private
     */
    _reportMicCameraPermissions() {
        const alreadyReported = {
            audio: false,
            video: false,
        };

        function updateReported(deviceKind) {
            if (deviceKind.includes('audio')) {
                alreadyReported.audio = true;
                return 'audio';
            }

            if (deviceKind.includes('video')) {
                alreadyReported.video = true;
                return 'video';
            }
        }

        function isAlreadyReported(deviceKind) {
            return (deviceKind.includes('audio') && alreadyReported.audio)
                || (deviceKind.includes('video') && alreadyReported.video);
        }

        // check for camera and mic permissions
        this._navigator.mediaDevices && this._navigator.mediaDevices.enumerateDevices
        && this._navigator.mediaDevices.enumerateDevices()
            .then((devices) => {
                devices.forEach((device) => {
                    // if the label is not "" then the user gave permissions
                    if (!isAlreadyReported(device.kind)) {
                        const kind = updateReported(device.kind);
                        const perm = device.label !== '' ? this._permDefs.granted : this._permDefs.denied;
                        let perKingContract = new PerKindUserPermissionContract (kind, perm);
                        let perKindData = perKingContract.buildQueueMessage();
                        this._dataQ.addToQueue('static_fields', perKindData, false);
                    }
                });
            })
            .catch(function (err) {
                Log.debug(`UserPermissions:startFeature failed to enumerateDevices: ${err.message}`);
            });
    }
}
