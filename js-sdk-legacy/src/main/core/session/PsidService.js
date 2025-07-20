import { WorkerCommand } from '../../events/WorkerCommand';

export default class PsidService {
    constructor(psidCache, workerCommunicator) {
        this._psidCache = psidCache;
        this._workerCommunicator = workerCommunicator;
    }

    /**
     * store the psid in the psid cache and send an update message to the server
     * @param psid - The new psid
     */
    set(psid) {
        if (psid === undefined) {
            throw new Error('Invalid psid value of undefined');
        }

        this._psidCache.set(psid);

        this._workerCommunicator.sendAsync(WorkerCommand.updatePsidCommand, { psid });
    }
}
