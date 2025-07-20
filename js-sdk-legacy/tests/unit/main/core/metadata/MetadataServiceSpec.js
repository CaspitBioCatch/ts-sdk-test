import ConfigurationRepository from '../../../../../src/main/core/configuration/ConfigurationRepository';
import MetadataService from '../../../../../src/main/core/metadata/MetadataService';
import DataQ from '../../../../../src/main/technicalServices/DataQ';

describe('HandleMetadata tests:', function () {
    const assert = chai.assert;

    it('should send data with config undefined then true', function () {
        const configurationRepository = sinon.stub(new ConfigurationRepository());
        const dataQ = sinon.createStubInstance(DataQ);

        const hMetadata = new MetadataService(configurationRepository, dataQ);

        hMetadata.onCustomerMetadata({
            type: 'cdCustomerMetadata',
            data: {
                a: ['a', 'b', 55],
                b: ['c', 'd', 'meme'],
            },
        });

        //
        configurationRepository.get.withArgs('isCustMetadata').returns(true);
        hMetadata.onConfigUpdate();

        hMetadata.onCustomerMetadata({
            type: 'cdCustomerMetadata',
            data: {
                a: ['aa', 'bb', 55],
                b: ['cc', 'dd', 'meme'],
            },
        });

        assert.isTrue(dataQ.addToQueue.calledTwice, "addToQueue wasn't called once");
        const calls = dataQ.addToQueue.getCalls();
        assert.equal(calls[0].args[0], 'customer_metadata', 'param is not customer_metadata');
        assert.equal(calls[1].args[0], 'customer_metadata', 'param is not customer_metadata');
        assert.equal(calls[0].args[1][1].a[1], 'b', 'wrong data, b not found');
        assert.equal(calls[1].args[1][1].a[1], 'bb', 'wrong data, bb not found');
    });

    it('should not send data and then send', function () {
        const configurationRepository = sinon.stub(new ConfigurationRepository());
        const dataQ = sinon.createStubInstance(DataQ);
        configurationRepository.get.withArgs('isCustMetadata').returns(false);

        const hMetadata = new MetadataService(configurationRepository, dataQ);

        hMetadata.onCustomerMetadata({
            type: 'cdCustomerMetadata',
            data: {
                a: ['aa', 55],
                b: ['cc', 305, 'meme'],
            },
        });
        assert.isTrue(dataQ.addToQueue.notCalled, 'addToQueue was called');

        configurationRepository.get.withArgs('isCustMetadata').returns(true);
        hMetadata.onConfigUpdate();

        hMetadata.onCustomerMetadata({
            type: 'cdCustomerMetadata',
            data: {
                c: ['ff', 'gg', 214],
                d: ['hh', 45, 'meme'],
            },
        });

        assert.isTrue(dataQ.addToQueue.calledOnce, "addToQueue wasn't called once");
        const calls = dataQ.addToQueue.getCall(0);
        assert.equal(calls.args[0], 'customer_metadata', 'param is not customer_metadata');
        assert.equal(calls.args[1][1].c[0], 'ff', 'wrong data, ff not found');
    });
});
