import { assert } from 'chai';
import SlaveSystemLoader from '../../../src/slave/SlaveSystemLoader';
import { MockObjects } from '../mocks/mockObjects';
import SlaveCdApiFacade from "../../../src/slave/api/SlaveCdApiFacade";

describe('SlaveSystemLoader tests:', function () {
    describe('loadSystem tests:', function () {
        it('components are loaded successfully', function () {
            const slaveSystemLoader = new SlaveSystemLoader();
            const configurations = new SlaveCdApiFacade().getConfigurations();

            slaveSystemLoader.loadSystem(MockObjects.featureList,configurations);

            assert.exists(slaveSystemLoader.getFeatureService());
            assert.exists(slaveSystemLoader.getConfigurationRepository());
            assert.exists(slaveSystemLoader.getContextMgr());
            assert.exists(slaveSystemLoader.getFeatureBuilder());
            assert.exists(slaveSystemLoader.getParentCommunicator());
            assert.exists(slaveSystemLoader.getSlaveBrowserProps());

        });
    });
});
