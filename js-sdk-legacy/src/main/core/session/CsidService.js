/**
 * Class is responsible for getting the csid
 */
import { WorkerCommand } from '../../events/WorkerCommand';
import Log from '../../technicalServices/log/Logger';

export default class CsidService {
    constructor(customerApi, csidCache, workerCommunicator) {
        this._customerApi = customerApi;
        this._csidCache = csidCache;
        this._workerCommunicator = workerCommunicator;
    }

    /**
     * store the csid in the csid cache and send an update message to the server
     * @param csid - The new csid
     */
    set(csid) {
        if (csid === undefined) {
            throw new Error('Invalid csid value of undefined');
        }

        this._csidCache.set(csid);

        this._workerCommunicator.sendAsync(WorkerCommand.updateCsidCommand, { csid });
    }

    /**
     * Get the csid from the customer api. If fails it will retry several times.
     * This is the legacy way of getting the csid and should not be used
     * method is deprecated and is left until migrations to the new method are complete
     */
    get(callback) {
        if (!this._customerApi.isApiAvailable('getCustomerSessionID')) {
            Log.debug('getCustomerSessionID API is unavailable. Hopefully this is because the setCustomerSessionId API is being used');
            return;
        }

        this._getCsidWithRetries(0, callback);
    }

    /**
     * The function is responsible for getting the customer session id from the cdApi.
     * If there was a failure in getting it in the first time, it will keep trying until the retryCount
     * @param retryCount
     * @param callback
     */
    _getCsidWithRetries(retryCount, callback) {
        if (retryCount > 20) {
            Log.error('Failed to get csid after all retries.');
            return;
        }
        // get customer session from the customer api
        try {
            this._customerApi.getCustomerSessionID((csid) => {
                if (!csid) {
                    // the bind is for the callback to pass
                    setTimeout(this._getCsidWithRetries.bind(this, retryCount + 1, callback), 200);
                    return;
                }
                // we have csid
                Log.debug(`Got csid after ${retryCount} retries. csid: ${csid}`);
                this._csidCache.set(csid);
                callback();
            });
        } catch (ex) {
            // the bind is for the callback to pass
            setTimeout(this._getCsidWithRetries.bind(this, retryCount + 1, callback), 200);
        }
    }
}
