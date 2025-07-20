import BrandService from '../../../../../src/main/core/branding/BrandService';
import WorkerCommunicator from '../../../../../src/main/technicalServices/WorkerCommunicator';
import Log from '../../../../../src/main/technicalServices/log/Logger';
import { WorkerCommand } from '../../../../../src/main/events/WorkerCommand';
import BrandRepository from '../../../../../src/main/core/branding/BrandRepository';

describe('BrandService tests:', function () {
    const assert = chai.assert;

    describe('set tests:', function() {
       beforeEach(function() {
           this.sandbox = sinon.createSandbox();

           this.workerCommunicatorStub = this.sandbox.createStubInstance(WorkerCommunicator);
           this.brandRepositoryStub = this.sandbox.createStubInstance(BrandRepository);
           this.brandRepositoryStub.get.withArgs().returns('testBrand');
           this.brandService = new BrandService(this.workerCommunicatorStub, this.brandRepositoryStub);
       });

        afterEach(function () {
            this.sandbox.restore();
        });

        it('should set brand successfully', function () {
            this.brandService = new BrandService(this.workerCommunicatorStub, this.brandRepositoryStub);

            const expectedBrand = 'MyBrand123';
            this.brandService.set(expectedBrand);

            assert.isTrue(this.brandRepositoryStub.set.calledWith(expectedBrand), 'brandRepository set was not called');

            assert.isTrue(this.workerCommunicatorStub.sendAsync.calledOnce, 'workerCommunicator sendAsync was not called once');
            assert.equal(this.workerCommunicatorStub.sendAsync.firstCall.args[0], WorkerCommand.updateBrandCommand, 'worker command value is not as expected');
            assert.deepEqual(this.workerCommunicatorStub.sendAsync.firstCall.args[1], { brand: expectedBrand }, 'update brand message value is not as expected');
        });

        it('should set brand successfully with . in brand name', function () {
            this.brandService = new BrandService(this.workerCommunicatorStub, this.brandRepositoryStub);

            const expectedBrand = 'brand.Name';
            this.brandService.set(expectedBrand);

            assert.isTrue(this.brandRepositoryStub.set.calledWith(expectedBrand), 'brandRepository set was not called');

            assert.isTrue(this.workerCommunicatorStub.sendAsync.calledOnce, 'workerCommunicator sendAsync was not called once');
            assert.equal(this.workerCommunicatorStub.sendAsync.firstCall.args[0], WorkerCommand.updateBrandCommand, 'worker command value is not as expected');
            assert.deepEqual(this.workerCommunicatorStub.sendAsync.firstCall.args[1], { brand: expectedBrand }, 'update brand message value is not as expected');
        });

        it('should set brand successfully with - in brand name', function () {
            this.brandService = new BrandService(this.workerCommunicatorStub, this.brandRepositoryStub);

            const expectedBrand = 'brand-Name';
            this.brandService.set(expectedBrand);

            assert.isTrue(this.brandRepositoryStub.set.calledWith(expectedBrand), 'brandRepository set was not called');

            assert.isTrue(this.workerCommunicatorStub.sendAsync.calledOnce, 'workerCommunicator sendAsync was not called once');
            assert.equal(this.workerCommunicatorStub.sendAsync.firstCall.args[0], WorkerCommand.updateBrandCommand, 'worker command value is not as expected');
            assert.deepEqual(this.workerCommunicatorStub.sendAsync.firstCall.args[1], { brand: expectedBrand }, 'update brand message value is not as expected');
        });

        it('should set brand successfully with ,_ and space in brand name', function () {
            this.brandService = new BrandService(this.workerCommunicatorStub, this.brandRepositoryStub);

            const expectedBrand = 'brand Name_very,long';
            this.brandService.set(expectedBrand);

            assert.isTrue(this.brandRepositoryStub.set.calledWith(expectedBrand), 'brandRepository set was not called');

            assert.isTrue(this.workerCommunicatorStub.sendAsync.calledOnce, 'workerCommunicator sendAsync was not called once');
            assert.equal(this.workerCommunicatorStub.sendAsync.firstCall.args[0], WorkerCommand.updateBrandCommand, 'worker command value is not as expected');
            assert.deepEqual(this.workerCommunicatorStub.sendAsync.firstCall.args[1], { brand: expectedBrand }, 'update brand message value is not as expected');
        });

        it('should not set brand if brand length is more than 200 characters', function() {
            this.brandService = new BrandService(this.workerCommunicatorStub, this.brandRepositoryStub);
            const logWarningStub = this.sandbox.spy(Log, 'warn');

            const expectedBrand = 'MyBrandIsVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVery' +
                'VeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVery' +
                'VeryVeryVeryVeryVeryVeryVeryVeryVeryVeryLong';
            this.brandService.set(expectedBrand);

            assert.isTrue(logWarningStub.calledOnce);
            assert.equal(logWarningStub.firstCall.args[0], 'The received brand name length is greater than 200. It is illegal. Ignoring the API call');
        });

        it('should not set brand if brand name contain @ - an illegal characters', function() {
            this.brandService = new BrandService(this.workerCommunicatorStub, this.brandRepositoryStub);
            const logWarningStub = this.sandbox.spy(Log, 'warn');

            const expectedBrand = 'Illegal@Brand';
            this.brandService.set(expectedBrand);

            assert.isTrue(logWarningStub.calledOnce);
            assert.equal(logWarningStub.firstCall.args[0], 'The received brand contains illegal characters. The legal characters are: A-Za-z0-9.-,_ and space. Ignoring the API call');
        });

        it('should not set brand if brand name contain * - an illegal characters', function() {
            this.brandService = new BrandService(this.workerCommunicatorStub, this.brandRepositoryStub);
            const logWarningStub = this.sandbox.spy(Log, 'warn');

            const expectedBrand = 'Illegal*Brand';
            this.brandService.set(expectedBrand);

            assert.isTrue(logWarningStub.calledOnce);
            assert.equal(logWarningStub.firstCall.args[0], 'The received brand contains illegal characters. The legal characters are: A-Za-z0-9.-,_ and space. Ignoring the API call');
        });

        it('should update brand if it exists in storage', function () {
            this.brandService = new BrandService(this.workerCommunicatorStub, this.brandRepositoryStub);
            this.brandService.update();

            assert.isTrue(this.brandRepositoryStub.set.called, 'brandRepository set was not called');
        });

        it('should successfully update the brand in response to subsequent update calls', function() {
            this.brandService = new BrandService(this.workerCommunicatorStub, this.brandRepositoryStub);
            const expectedBrand1 = 'Brand1';
            const expectedBrand2 = 'Brand2';
            const expectedBrand3 = 'Brand3';

            this.brandService.set(expectedBrand1);

            assert.isTrue(this.brandRepositoryStub.set.calledWith(expectedBrand1), 'brandRepository set was not called');
            assert.deepEqual(this.workerCommunicatorStub.sendAsync.firstCall.args[1], { brand: expectedBrand1 }, 'update brand message value is not as expected');

            this.brandService.set(expectedBrand2);
            assert.isTrue(this.brandRepositoryStub.set.calledWith(expectedBrand2), 'brandRepository set was not called');
            assert.deepEqual(this.workerCommunicatorStub.sendAsync.secondCall.args[1], { brand: expectedBrand2 }, 'update brand message value is not as expected');

            this.brandService.set(expectedBrand3);
            assert.isTrue(this.brandRepositoryStub.set.calledWith(expectedBrand3), 'brandRepository set was not called');
            assert.deepEqual(this.workerCommunicatorStub.sendAsync.thirdCall.args[1], { brand: expectedBrand3 }, 'update brand message value is not as expected');
        });
    });
});
