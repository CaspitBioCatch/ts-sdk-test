export default class CDPort {
    constructor(nativeWorker) {
        this._portNativeWorker = nativeWorker;
    }

    /* eslint-disable prefer-rest-params */

    postMessage() {
        this._portNativeWorker.postMessage.apply(this._portNativeWorker, arguments);
    }

    /* eslint-enable prefer-rest-params */

    close() {
        this._portNativeWorker.terminate();
    }

    // in the original is was set onmessage using a setter but since IE8 does not support setters I changed
    setonmessage(cb) {
        this._portNativeWorker.onmessage = cb;
    }
}
