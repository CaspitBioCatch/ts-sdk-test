import {assert} from "chai";
import sinon from "sinon";
import CoordinatesMaskingConfigurationUpdater from "../../../../src/main/api/CoordinatesMaskingConfigurationUpdater";
import Log from "../../../../src/main/technicalServices/log/Logger";
import {TestUtils} from "../../../TestUtils";
import ConfigurationRepository from "../../../../src/main/core/configuration/ConfigurationRepository";
import CDUtils from "../../../../src/main/technicalServices/CDUtils";
import {ConfigurationFields} from "../../../../src/main/core/configuration/ConfigurationFields";

describe('CoordinatesMaskingConfigurationUpdater class', function(){

    let configurationRepository = null;
    let sandbox = null;
    let coordinatesMaskingConfigurationUpdater = null

    beforeEach(function(){
        sandbox = sinon.createSandbox();
        configurationRepository = new ConfigurationRepository();
        coordinatesMaskingConfigurationUpdater = new CoordinatesMaskingConfigurationUpdater(configurationRepository);
    });

    afterEach(function(){
        sandbox.restore();
        configurationRepository = null;
        coordinatesMaskingConfigurationUpdater= null;
    });


    it('should update configurationRepository upon server configuration update', async function(){
        const serverConfiguration = new ConfigurationRepository();
        const isEnabled = serverConfiguration.get(ConfigurationFields.enableCoordinatesMasking);
        coordinatesMaskingConfigurationUpdater._configurationRepository.set= sandbox.spy();

        coordinatesMaskingConfigurationUpdater._setConfigurationKey(isEnabled);

        const confSetArgs = coordinatesMaskingConfigurationUpdater._configurationRepository.set.firstCall.args;

        assert.equal(confSetArgs[0],ConfigurationFields.enableCoordinatesMasking, 'was not equal to false');
        assert.equal(confSetArgs[1],false, 'was not equal to false');
        assert.isTrue(coordinatesMaskingConfigurationUpdater._configurationRepository.set.calledOnce, 'called more than once');

        });

    it('should call _handleConfigurationUpdate',  function(){
        coordinatesMaskingConfigurationUpdater._handleConfigurationUpdate = sandbox.spy();
        coordinatesMaskingConfigurationUpdater.updateConfig(true);

            const handleUpdate = coordinatesMaskingConfigurationUpdater._handleConfigurationUpdate.firstCall.args;
            assert.isTrue(handleUpdate[0], 'was not true');

    });

    it('should update configurationRepository + dispatch info log',  function(){
        coordinatesMaskingConfigurationUpdater._configurationRepository.set = sandbox.spy();
        const logSpy = sandbox.spy(Log,'info');
        const utilsSpy = sandbox.spy(CDUtils,'isBoolean');

        coordinatesMaskingConfigurationUpdater._handleConfigurationUpdate(true);

        const confRepoArgs = coordinatesMaskingConfigurationUpdater._configurationRepository.set.firstCall.args;
        const logArgs = logSpy.getCall(0).args[0];
        const utilsArgs = utilsSpy.getCall(0).args[0];

        assert.equal(confRepoArgs[0], ConfigurationFields.enableCoordinatesMasking,'was not equal to enableCoordinatesMasking');
        assert.equal(confRepoArgs[1], true,'was not true');
        assert.equal(logArgs ,'Set coordinates masking API was called, is enabled: true', 'Log message was not equal');
        assert.isTrue(utilsArgs, 'was not true');
        assert.isTrue(utilsSpy.calledOnce, 'called more than once');
        assert.isTrue(logSpy.calledOnce, 'called more than once');

    });

    it('should update configuration repository', async function(){
         const defaultVal = coordinatesMaskingConfigurationUpdater._configurationRepository.get(ConfigurationFields.enableCoordinatesMasking);

         coordinatesMaskingConfigurationUpdater._setConfigurationKey(true);

         await TestUtils.waitForNoAssertion(()=>{
             const confNewVal = coordinatesMaskingConfigurationUpdater._configurationRepository.get(ConfigurationFields.enableCoordinatesMasking);
             assert.notEqual(confNewVal,defaultVal, 'configuration key value has not been changed');
         });
    });

    it("should update configurationRepository", function(){
        const confRepoStub= sandbox.stub(configurationRepository, 'get');
        coordinatesMaskingConfigurationUpdater._setConfigurationKey = sandbox.spy();
        confRepoStub.returns(true);

        coordinatesMaskingConfigurationUpdater.onConfigUpdate(configurationRepository);

        const args = coordinatesMaskingConfigurationUpdater._setConfigurationKey.firstCall.args;

        assert.isTrue(args[0], 'was not true');
        assert.isTrue(coordinatesMaskingConfigurationUpdater._setConfigurationKey.calledOnce, 'was called more than once');
    });

    it('should dispatch a warning log', function(){
        const logWarnSpy = sandbox.spy(Log,'warn');
        const logInfoSpy = sandbox.spy(Log,'info');
        coordinatesMaskingConfigurationUpdater._setConfigurationKey = sandbox.spy();
        coordinatesMaskingConfigurationUpdater._handleConfigurationUpdate('test');

        const logWarnArgs = logWarnSpy.getCall(0).args[0];

        assert.equal(logWarnArgs,'Invalid argument type: test', 'was not equal');
        assert.isTrue(logWarnSpy.calledOnce, 'called more than once');
        assert.isFalse(logInfoSpy.called, 'Log info was called');
        assert.isFalse(coordinatesMaskingConfigurationUpdater._setConfigurationKey.called, 'was called');
    })
});