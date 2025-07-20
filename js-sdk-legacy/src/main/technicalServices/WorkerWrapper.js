/**
 * Wraps a worker implementation
 */
import CDPort from '../infrastructure/CDPort';

export default class WorkerWrapper {
    constructor(nativeWorker) {
        this._nativeWorker = nativeWorker;
        this.port = new CDPort(this._nativeWorker);
    }

    close() {
        this.port.close();
    }
}
