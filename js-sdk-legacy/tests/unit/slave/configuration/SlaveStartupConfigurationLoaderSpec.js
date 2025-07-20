import { assert } from "chai";
import ConfigurationRepository from "../../../../src/main/core/configuration/ConfigurationRepository";
import SlaveStartupConfigurationLoader from "../../../../src/slave/configuration/SlaveStartupConfigurationLoader";
import SlaveConfigurations from "../../../../src/slave/api/SlaveConfigurations";
import { ConfigurationFields } from "../../../../src/main/core/configuration/ConfigurationFields";

describe('StartupConfigurationLoader tests:', function () {

    let sandbox = null;
    let configurationRepository = null;
    let slaveStartupConfigurationLoader = null
    let slaveConfigurations = null;

    beforeEach(function () {
        sandbox = sinon.createSandbox();
        configurationRepository = sandbox.createStubInstance(ConfigurationRepository);
        slaveConfigurations = sandbox.createStubInstance(SlaveConfigurations);
        slaveStartupConfigurationLoader = new SlaveStartupConfigurationLoader(configurationRepository, slaveConfigurations);

    });

    afterEach(function () {
        sandbox.restore();
        configurationRepository = null;
        slaveStartupConfigurationLoader = null;
        slaveConfigurations = null;
    });

    it("should load startup configuration and update configuration repository", function () {
        slaveStartupConfigurationLoader._startUpConfigurations.getEnableBufferAckMessage = sandbox.stub();
        slaveStartupConfigurationLoader._startUpConfigurations.getEnableBufferAckMessage.returns(true);

        slaveStartupConfigurationLoader._setBooleanConfigurationOrDefault = sandbox.spy();
        slaveStartupConfigurationLoader.loadStartUpConfigurations();

        const args = slaveStartupConfigurationLoader._setBooleanConfigurationOrDefault.firstCall.args;

        assert.equal(ConfigurationFields.enableAcknowledgeMessageEvents, args[0], 'first argument is not equal to enableAcknowledgeMessageEvents');
        assert.isTrue(args[1], 'configuration is not true');
        assert.isFalse(args[2], 'default value is not false');
    });

    it("should load startup configuration and update configuration repository - mutation configs", function () {
        slaveStartupConfigurationLoader._startUpConfigurations.getMutationMaxChunkSize = sandbox.stub();
        slaveStartupConfigurationLoader._startUpConfigurations.getMutationMaxChunkSize.returns(0);
        slaveStartupConfigurationLoader._startUpConfigurations.getMutationChunkDelayMs = sandbox.stub();
        slaveStartupConfigurationLoader._startUpConfigurations.getMutationChunkDelayMs.returns(100);

        slaveStartupConfigurationLoader._setNumberConfigurationOrDefault = sandbox.spy();
        slaveStartupConfigurationLoader.loadStartUpConfigurations();

        let args = slaveStartupConfigurationLoader._setNumberConfigurationOrDefault.firstCall.args;

        assert.equal(ConfigurationFields.mutationMaxChunkSize, args[0], 'first argument is not equal to mutationMaxChunkSize');
        assert.isTrue(args[1] === 0, 'configuration is not 0');
        assert.isTrue(args[2] === 0, 'default value is not 0');

        args = slaveStartupConfigurationLoader._setNumberConfigurationOrDefault.secondCall.args;

        assert.equal(ConfigurationFields.mutationChunkDelayMs, args[0], 'first argument is not equal to mutationMaxChunkSize');
        assert.isTrue(args[1] === 100, 'configuration is not 100');
        assert.isTrue(args[2] === 100, 'default value is not 100');
    });

    it("should update configuration if was configured", function () {
        const configuredValue = true;
        slaveStartupConfigurationLoader._configurationRepository.set = sandbox.spy();
        slaveStartupConfigurationLoader._setBooleanConfigurationOrDefault(ConfigurationFields.enableAcknowledgeMessageEvents, configuredValue, false);

        const args = slaveStartupConfigurationLoader._configurationRepository.set.firstCall.args;

        assert.equal(ConfigurationFields.enableAcknowledgeMessageEvents, args[0], 'was not equal to enableAcknowledgeMessageEvents');
        assert.isTrue(args[1], "configured value was not true");
    });

    it("should update configuration if was configured - mutation configs", function () {
        let configuredValue = 40;
        slaveStartupConfigurationLoader._configurationRepository.set = sandbox.spy();
        slaveStartupConfigurationLoader._setNumberConfigurationOrDefault(ConfigurationFields.mutationMaxChunkSize, configuredValue, 0);

        let args = slaveStartupConfigurationLoader._configurationRepository.set.firstCall.args;

        assert.equal(ConfigurationFields.mutationMaxChunkSize, args[0], 'was not equal to mutationMaxChunkSize');
        assert.isTrue(args[1] === configuredValue, `configured value was set to ${configuredValue}`);

        configuredValue = 1000;
        slaveStartupConfigurationLoader._setNumberConfigurationOrDefault(ConfigurationFields.mutationChunkDelayMs, configuredValue, 100);

        args = slaveStartupConfigurationLoader._configurationRepository.set.secondCall.args;

        assert.equal(ConfigurationFields.mutationChunkDelayMs, args[0], 'was not equal to mutationChunkDelayMs');
        assert.isTrue(args[1] === configuredValue, `configured value was set to ${configuredValue}`);
    });
    //isUndefinedNull
    it("should use default value if undefined or null", function () {
        const configuredValue = null;
        slaveStartupConfigurationLoader._configurationRepository.set = sandbox.spy();
        slaveStartupConfigurationLoader._setBooleanConfigurationOrDefault(ConfigurationFields.enableAcknowledgeMessageEvents, configuredValue, false);

        const args = slaveStartupConfigurationLoader._configurationRepository.set.firstCall.args;

        assert.equal(ConfigurationFields.enableAcknowledgeMessageEvents, args[0], 'was not equal to enableAcknowledgeMessageEvents');
        assert.isFalse(args[1], "configured value was not false");
    });

    it("should use default value if not number", function () {
        const configuredValue = '50';
        slaveStartupConfigurationLoader._configurationRepository.set = sandbox.spy();
        slaveStartupConfigurationLoader._setNumberConfigurationOrDefault(ConfigurationFields.mutationMaxChunkSize, configuredValue, 0);
        slaveStartupConfigurationLoader._setNumberConfigurationOrDefault(ConfigurationFields.mutationChunkDelayMs, configuredValue, 100);

        let args = slaveStartupConfigurationLoader._configurationRepository.set.firstCall.args;

        assert.equal(ConfigurationFields.mutationMaxChunkSize, args[0], 'was not equal to mutationMaxChunkSize');
        assert.isTrue(args[1] === 0, "configured value was set to 0");

        args = slaveStartupConfigurationLoader._configurationRepository.set.secondCall.args;

        assert.equal(ConfigurationFields.mutationChunkDelayMs, args[0], 'was not equal to mutationChunkDelayMs');
        assert.isTrue(args[1] === 100, "configured value was set to 100");
    });

});