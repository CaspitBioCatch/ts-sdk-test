import PsidCache from '../../../../../src/main/core/session/PsidCache';
import PsidService from '../../../../../src/main/core/session/PsidService';
import { WorkerCommand } from '../../../../../src/main/events/WorkerCommand';
import WorkerCommunicator from '../../../../../src/main/technicalServices/WorkerCommunicator';

describe('PsidService tests:', function () {
    const assert = chai.assert;

    describe('set tests', function () {
        beforeEach(function () {
            this.sandbox = sinon.createSandbox();

            this.workerCommunicatorStub = this.sandbox.createStubInstance(WorkerCommunicator);
            this.psidCacheStub = this.sandbox.createStubInstance(PsidCache);
        });

        afterEach(function () {
            this.sandbox.restore();
        });

        it('should set psid successfully', function () {
            const psidService = new PsidService(this.psidCacheStub, this.workerCommunicatorStub);

            const expectedPsid = 'pspspppsid';

            psidService.set(expectedPsid);

            assert.isTrue(this.psidCacheStub.set.calledOnce, 'psidCache set method was not called once');
            assert.equal(this.psidCacheStub.set.firstCall.args[0], expectedPsid, 'psid value is not as expected');

            assert.isTrue(this.workerCommunicatorStub.sendAsync.calledOnce, 'workerCommunicator sendAsync method was not called once');
            assert.equal(this.workerCommunicatorStub.sendAsync.firstCall.args[0], WorkerCommand.updatePsidCommand, 'worker command value is not as expected');
            assert.deepEqual(this.workerCommunicatorStub.sendAsync.firstCall.args[1], { psid: expectedPsid }, 'update psid message value is not as expected');
        });
    });
});
