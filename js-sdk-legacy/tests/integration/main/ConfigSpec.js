import { assert } from 'chai';
import ConfigurationChanger from './ConfigurationChanger';
import { ConfigurationFields } from '../../../src/main/core/configuration/ConfigurationFields';

describe('Config tests:', function () {
    it('Configuration repository should get proper config from server', function () {
        const confMgr = this.systemBootstrapper.getConfigurationRepository();
        assert.isNotNull(confMgr.get('isPlugins'), 'no featureConfig.isPlugins config from server');
        assert.isNotNull(confMgr.get('isFontsFlash'), 'no featureConfig.isFontsFlash config from server');
    });

    it('Configuration repository should not allow overriding of keys mentioned by overrideBlackList', function() {

        // Change the threshold so reset will be called and not blocked...
        ConfigurationChanger.change(this.systemBootstrapper, {
            [ConfigurationFields.keyEventsMaskSpecialChars] : true,
            [ConfigurationFields.passwordIdMaskingList]: ["id1", "id2"],
            [ConfigurationFields.maskElementsAttributes]: true,
            [ConfigurationFields.allowedUnmaskedValuesList]: ["val1", "val2"],
            [ConfigurationFields.enableUnmaskedValues] : true,
            [ConfigurationFields.enableCoordinatesMasking] : true,

            [ConfigurationFields.wupStatisticsLogIntervalMs]: 5000
        });

        let repository = this.systemBootstrapper.getConfigurationRepository()

        expect(repository.get(ConfigurationFields.keyEventsMaskSpecialChars)).to.equal(false);
        // the list defined in the DefaultCustomerApi.js configuration.
        expect(repository.get(ConfigurationFields.passwordIdMaskingList)).to.deep.equal([ '1234', '5678', 'pass' ]);
        expect(repository.get(ConfigurationFields.allowedUnmaskedValuesList)).to.deep.equal([]);
        expect(repository.get(ConfigurationFields.enableUnmaskedValues)).to.equal(false);
        // the list defined in the DefaultCustomerApi.js configuration.
        expect(repository.get(ConfigurationFields.maskElementsAttributes)).to.deep.equal([
            {
                name: 'payee_id_for_',
                regexPattern: '^payee_id_for_',
            }
        ]);
        expect(repository.get(ConfigurationFields.enableCoordinatesMasking)).to.equal(true);

        // this one not in the blacklist, so should be changed
        expect(repository.get(ConfigurationFields.wupStatisticsLogIntervalMs)).to.equal(5000);
    });
});
