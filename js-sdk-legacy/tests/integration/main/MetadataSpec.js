import { assert } from 'chai';
import ConfigurationChanger from './ConfigurationChanger';
import { TestUtils } from '../../TestUtils';

describe('Metadata tests:', function () {
    beforeEach(function () {
        sessionStorage.removeItem('metadataConfig');
        const metaCollector = this.systemBootstrapper.getFeatureBuilder()._features.list.MetadataCollector.instance;
        metaCollector._metaDataSiteMapper._siteMap = null; // in order he will take a new one

        if (this._updateFeatureConfigSpy) {
            this._updateFeatureConfigSpy.restore();
        }

        this._updateFeatureConfigSpy = sinon.spy(metaCollector, 'updateFeatureConfig');
    });

    after(function () {
        sessionStorage.removeItem('metadataConfig');
        const metaCollector = this.systemBootstrapper.getFeatureBuilder()._features.list.MetadataCollector.instance;
        metaCollector._metaDataSiteMapper._siteMap = null; // in order he will take a new one

        // Modify the configuration before the scenario
        ConfigurationChanger.change(this.systemBootstrapper, {
            'metadataConfig': JSON.stringify({
                'triggers': [],
                'mappings': [],
            }),
        });

        if (this._updateFeatureConfigSpy) {
            this._updateFeatureConfigSpy.restore();
        }
    });

    it('metadata is sent to server by configuration', async function () {
        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

        this._updateFeatureConfigSpy.resetHistory();

        // Modify the configuration before the scenario
        ConfigurationChanger.change(this.systemBootstrapper, {
            'metadataConfig': JSON.stringify({
                'triggers': [
                    {
                        'selector': 'body',
                    },
                ],
                'mappings': [
                    {
                        'selector': 'input[value=metadataCollectorTestTrigger]',
                        'metaVal': 'BOB',
                    },
                ],
            }),
        });

        // Wait for the configuration update to apply on the feature
        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this._updateFeatureConfigSpy.called, 'Metadata Collector updateFeatureConfig function was not called');
        });

        serverWorkerSendAsync.resetHistory();
        const i = document.createElement('input'); // input element, text
        i.setAttribute('id', 'neverMind');
        i.setAttribute('type', 'text');
        i.setAttribute('value', 'metadataCollectorTestTrigger');
        document.body.appendChild(i);

        await TestUtils.waitForNoAssertion(() => {
            TestUtils.verifyCallHappened(serverWorkerSendAsync, 'metadata_map', 'metadata BOB', function (data) {
                assert.equal('BOB', data[1], 'meta data is not as expected');
            });
        });
    });
});
