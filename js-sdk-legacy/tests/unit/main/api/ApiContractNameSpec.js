import { assert } from 'chai';
import { ApiContractName } from '../../../../src/main/api/ApiContractName';

describe('ApiContractName tests:', function () {
    it('GetConfigurations contract name is as expected', function () {
        assert.equal(ApiContractName.GetConfigurations, 'getConfigurations');
    });

    it('ConfigurationKeys contract name is as expected', function () {
        assert.equal(ApiContractName.ConfigurationKeys, 'configurationKeys');
    });
});
