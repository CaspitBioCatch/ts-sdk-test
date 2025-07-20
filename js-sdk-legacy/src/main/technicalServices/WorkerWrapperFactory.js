import InlineWorker from 'worker-loader?inline=no-fallback&filename=worker.js!../../worker/worker.js';

/**
 * Factory for creating a worker port. Factory create which wraps a dedicated inlined worker or a worker from url according to useUrlWorker configuration.
 */
import WorkerWrapper from './WorkerWrapper';
import Log from './log/Logger';

export default class WorkerWrapperFactory {
    constructor(useUrlWorker, workerUrl) {
        this._useUrlWorker = useUrlWorker;
        this._workerUrl = workerUrl;
    }

    create() {
        return this._useUrlWorker
            ? this._createWorkerFromUrl() : this._createInlineWorker();
    }

    _createInlineWorker() {
        const nativeWorker = new InlineWorker();
        Log.info('Created a dedicated worker.');
        return new WorkerWrapper(nativeWorker);
    }

    _createWorkerFromUrl() {
        try {
            const nativeWorker = new Worker(this._workerUrl);
            Log.info(`Created worker from url - ${this._workerUrl}`);
            return new WorkerWrapper(nativeWorker);
        } catch (e) {
            Log.error('Failed to construct worker from url.');
            throw e;
        }
    }
}
