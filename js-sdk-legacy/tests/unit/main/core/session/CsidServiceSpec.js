import CDUtils from '../../../../../src/main/technicalServices/CDUtils';
import CsidCache from '../../../../../src/main/core/session/CsidCache';
import CsidService from '../../../../../src/main/core/session/CsidService';
import { WorkerCommand } from '../../../../../src/main/events/WorkerCommand';
import CustomerApiBridge from '../../../../../src/main/api/CustomerApiBridge';
import WorkerCommunicator from '../../../../../src/main/technicalServices/WorkerCommunicator';

describe('CsidService tests:', function () {
    const assert = chai.assert;

    describe('get csid', function () {
        beforeEach(function () {
            this.sandbox = sinon.createSandbox();

            this.custApi = this.sandbox.createStubInstance(CustomerApiBridge);
            this.custApi.isApiAvailable.returns(true);
            this.guid1 = CDUtils.generateUUID();

            this.workerCommunicatorStub = this.sandbox.createStubInstance(WorkerCommunicator);
            this.csidCacheStub = this.sandbox.stub(new CsidCache());
        });

        afterEach(function () {
            this.sandbox.restore();
        });

        it('should return csid on first attempt when its available', function (done) {
            const csidService = new CsidService(this.custApi, this.csidCacheStub, this.workerCommunicatorStub);

            const expectedCsid = Date.now() + '-' + this.guid1;
            this.custApi.getCustomerSessionID.callsArgWith(0, expectedCsid);

            csidService.get(() => {
                assert.isTrue(this.csidCacheStub.set.calledOnce);
                assert.equal(this.csidCacheStub.set.firstCall.args[0], expectedCsid, 'csid is not equal to expected value');
                done();
            });
        });

        it('should return csid on second retry attempt', function (done) {
            const csidService = new CsidService(this.custApi, this.csidCacheStub, this.workerCommunicatorStub);

            let retryCount = 0;
            const expectedCsid = Date.now() + '-' + this.guid1;
            this.custApi.getCustomerSessionID = (callback) => {
                if (retryCount === 2) {
                    callback(expectedCsid);
                } else {
                    retryCount++;
                    callback('');
                }
            };

            csidService.get(() => {
                assert.isTrue(this.csidCacheStub.set.calledOnce);
                assert.equal(this.csidCacheStub.set.firstCall.args[0], expectedCsid, 'csid is not equal to expected value');
                done();
            });
        });

        it('should return csid on 20th retry attempt', function (done) {
            const csidService = new CsidService(this.custApi, this.csidCacheStub, this.workerCommunicatorStub);

            let retryCount = 0;
            const expectedCsid = Date.now() + '-' + this.guid1;
            this.custApi.getCustomerSessionID = (callback) => {
                if (retryCount === 20) {
                    callback(expectedCsid);
                } else {
                    retryCount++;
                    callback('');
                }
            };

            csidService.get(() => {
                assert.isTrue(this.csidCacheStub.set.calledOnce);
                assert.equal(this.csidCacheStub.set.firstCall.args[0], expectedCsid, 'csid is not equal to expected value');
                done();
            });
        });

        it('should not return csid if there are more than 20 retry attempts', function (done) {
            const csidService = new CsidService(this.custApi, this.csidCacheStub, this.workerCommunicatorStub);

            let retryCount = 0;
            const expectedCsid = Date.now() + '-' + this.guid1;
            this.custApi.getCustomerSessionID = (callback) => {
                if (retryCount === 21) {
                    callback(expectedCsid);
                } else {
                    retryCount++;
                    callback('');
                }
            };

            const callbackSpy = sinon.spy();

            csidService.get(callbackSpy);

            setTimeout(() => {
                assert.isTrue(callbackSpy.notCalled, 'csid callback was called when it shouldnt have');
                done();
            }, 4400);
        });

        it('should not return csid if getCustomerSessionID api is not implemented', function () {
            const csidService = new CsidService(this.custApi, this.csidCacheStub, this.workerCommunicatorStub);

            this.custApi.isApiAvailable.returns(false);

            const callbackSpy = sinon.spy();

            csidService.get(callbackSpy);

            assert.isTrue(this.custApi.isApiAvailable.calledOnce);
            assert.isTrue(this.custApi.getCustomerSessionID.notCalled);
        });
    });

    describe('set tests', function () {
        beforeEach(function () {
            this.sandbox = sinon.createSandbox();

            this.workerCommunicatorStub = this.sandbox.createStubInstance(WorkerCommunicator);
            this.csidCacheStub = this.sandbox.stub(new CsidCache());
            this.customerApiBridgeStub = this.sandbox.createStubInstance(CustomerApiBridge);
        });

        afterEach(function () {
            this.sandbox.restore();
        });

        it('should set csid successfully', function () {
            const csidService = new CsidService(this.customerApiBridgeStub, this.csidCacheStub, this.workerCommunicatorStub);

            const expectedCsid = 'csiddd';

            csidService.set(expectedCsid);

            assert.isTrue(this.csidCacheStub.set.calledOnce, 'csidCache set method was not called once');
            assert.equal(this.csidCacheStub.set.firstCall.args[0], expectedCsid, 'csid value is not as expected');

            assert.isTrue(this.workerCommunicatorStub.sendAsync.calledOnce, 'workerCommunicator sendAsync method was not called once');
            assert.equal(this.workerCommunicatorStub.sendAsync.firstCall.args[0], WorkerCommand.updateCsidCommand, 'worker command value is not as expected');
            assert.deepEqual(this.workerCommunicatorStub.sendAsync.firstCall.args[1], { csid: expectedCsid }, 'update psid message value is not as expected');
        });
    });
});
