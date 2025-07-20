import sinon from "sinon";
import ConfigurationRepository from "../../../../../src/main/core/configuration/ConfigurationRepository";
import ConfigurationWrapperWupMessage from "../../../../../src/main/core/configuration/ConfigurationWrapperWupMessage";
import ConfigurationWrapperLogMessage from "../../../../../src/main/core/configuration/ConfigurationWrapperLogMessage";

describe('ConfigurationMessage tests:', function () {
    let configurationRepositoryStub = null;
    let sandbox = null;

    beforeEach(function () {
        sandbox = sinon.createSandbox();
        configurationRepositoryStub = sandbox.createStubInstance(ConfigurationRepository);

    });

    afterEach(function () {
        sandbox.restore();
    });

    it('readWupMessageSetting', function () {
        configurationRepositoryStub.get.returns(100)

        let configurationWrapperWupMessage= new ConfigurationWrapperWupMessage(configurationRepositoryStub);
        let reMessageSettings = configurationWrapperWupMessage.createReMessageSettings();

        assert.equal(reMessageSettings.getMaxIntervalBetweenFailures(), 100);
        assert.equal(reMessageSettings.getIncrementalGrowthBetweenFailures(), 100);
        assert.equal(reMessageSettings.getMessageNumToRetry(), 100);
        assert.equal(reMessageSettings.getMessageRetryInterval(), 100);

    });
    it('readLogMessageSettings', function () {
        configurationRepositoryStub.get.returns(100)
        let configurationWrapperLogMessage = new ConfigurationWrapperLogMessage(configurationRepositoryStub);
        let reMessageSettings = configurationWrapperLogMessage.createReMessageSettings();

        assert.equal(reMessageSettings.getMaxIntervalBetweenFailures(), 100);
        assert.equal(reMessageSettings.getIncrementalGrowthBetweenFailures(), 100);
        assert.equal(reMessageSettings.getMessageNumToRetry(), 100);
        assert.equal(reMessageSettings.getMessageRetryInterval(), 100);

    });



});


