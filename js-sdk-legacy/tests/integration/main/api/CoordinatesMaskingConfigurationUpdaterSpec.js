import {assert} from "chai";
import sinon from "sinon";
import ConfigurationChanger from "../ConfigurationChanger";
import {TestUtils} from "../../../TestUtils";
import {ConfigurationFields} from "../../../../src/main/core/configuration/ConfigurationFields";

describe('CoordinatesMaskingConfigurationUpdater test', function(){

    const originalCdApi = window.cdApi;
    let sandbox = null;
    beforeEach(function(){
        sandbox = sinon.createSandbox();
    });

    afterEach(function(){
        sandbox.restore();
        window.cdApi = originalCdApi;
    })

    it('configuration should not update upon receiving server configuration since it in override black-list',async function(){
        const startConfigurationField = this.systemBootstrapper.getConfigurationRepository().get(ConfigurationFields.enableCoordinatesMasking);

        await TestUtils.waitForNoAssertion(()=>{
            ConfigurationChanger.change(this.systemBootstrapper,{
                'enableCoordinatesMasking':true
            });
            const updatedConfigurationField = this.systemBootstrapper.getConfigurationRepository().get('enableCoordinatesMasking');

            assert.isTrue(startConfigurationField, 'expected true');
            assert.isTrue(updatedConfigurationField,'expected true');
        });

    });

});