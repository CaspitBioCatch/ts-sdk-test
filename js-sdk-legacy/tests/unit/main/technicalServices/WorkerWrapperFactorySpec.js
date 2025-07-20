import WorkerWrapperFactory from '../../../../src/main/technicalServices/WorkerWrapperFactory';
import TestFeatureSupport from '../../../TestFeatureSupport';
import { assert } from 'chai';

describe('WorkerWrapperFactory tests:', function () {
    describe('create tests:', function () {
        before(function () {
            if (!TestFeatureSupport.isWorkerSupported()) {
                this.skip();
                return;
            }
            this.sandbox = sinon.createSandbox();
        });

        afterEach(function () {
            if (this.cdWorker) {
                this.cdWorker.close();
                this.cdWorker = null;
            }

            this.sandbox.restore();
        });

        it('should create a dedicated worker if supported', function () {
            const workerWrapperFactory = new WorkerWrapperFactory(false, '');
            this.cdWorker = workerWrapperFactory.create();

            assert.isTrue(this.cdWorker._nativeWorker instanceof window.Worker);
        });

        it('should create worker from url with useWorkerUrl configuration true', function () {
            const originalWorkerConstructor = window.Worker;
            // Null the Worker so a shared worker will be created
            window.Worker = this.sandbox.stub().returns({
                terminate: this.sandbox.stub(),
            });
            const workerWrapperFactory = new WorkerWrapperFactory(true, '');
            this.cdWorker = workerWrapperFactory.create();

            window.Worker = originalWorkerConstructor;
        });

        it('should throw an error if dedicated worker is not supported', function () {
            const originalWorkerConstructor = window.Worker;
            // Null the Worker so a shared worker will be created
            window.Worker = null;

            const workerWrapperFactory = new WorkerWrapperFactory(false, '');

            assert.throws(() => {
                this.cdWorker = workerWrapperFactory.create();
            }, 'Inline worker is not supported');

            assert.isNull(this.cdWorker);

            window.Worker = originalWorkerConstructor;
        });
    });
});
