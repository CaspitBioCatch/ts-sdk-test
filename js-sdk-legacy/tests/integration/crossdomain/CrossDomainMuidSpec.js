import ConfigurationChanger from "../main/ConfigurationChanger";
import {TestUtils} from "../../TestUtils";
import {assert} from "chai";
import TestFeatureSupport from "../../TestFeatureSupport";


describe.skip('Deprecated CrossDomainMuid tests:', function () {
    let updateFeatureConfigSpy = null;
    let sensorDataQueueOnConfigUpdateSpy = null;

    before(async function () {
        if (!TestFeatureSupport.isMutationObserverSupported()) {
            this.skip();
            return;
        }

        this.sandbox = sinon.createSandbox();
        const crossDomainEvents = this.systemBootstrapper.getFeatureBuilder()._features.list.CrossDomain.instance;
        const sensorDataQueue = this.systemBootstrapper._sensorDataQ;
        this.messageHandler = (e) => {
            if ((e.data.found && e.data.found.muid) || (e.data.new && e.data.new.muid)) {
                this.muidSuccess = true;
                this.muidSuccessCounter++;
            }
        };

        updateFeatureConfigSpy = this.sandbox.spy(crossDomainEvents, 'updateFeatureConfig');
        sensorDataQueueOnConfigUpdateSpy = this.sandbox.spy(sensorDataQueue, 'onConfigUpdate');
    });


    beforeEach(async function () {
        this.muidSuccess = false;
        this.muidSuccessCounter = 0;
    });

    after(async function () {
        await changeConfiguration(this.systemBootstrapper, {
            isCrossdomain: false,
            crossDomainsList: [],
        });

        this.sandbox.restore();
    });

    async function changeConfiguration(systemBootstrapper, configuration) {
        ConfigurationChanger.change(systemBootstrapper, configuration);

        // Wait for the configuration update to apply on the feature
        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(updateFeatureConfigSpy.called, 'CrossDomain events updateFeatureConfig function was not called');
            assert.isTrue(sensorDataQueueOnConfigUpdateSpy.called, 'Sensor Data Queue onConfigUpdate function was not called');
        });
    }

    it('Muid from domainList is received', async function () {
        window.addEventListener('message', this.messageHandler);

        await changeConfiguration(this.systemBootstrapper, {
            isCrossdomain: true,
            crossDomainsTimeout: 20000,
            crossDomainsList: ['http://crossdomain1.local:9000/crossdomain/indexintegration.html',],
        });

        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.muidSuccess);
            assert.equal(1, this.muidSuccessCounter);
            window.removeEventListener('message', this.messageHandler);
        });
    });

    it('Muid from multiple domainList is received', async function () {
        window.addEventListener('message', this.messageHandler);

        await changeConfiguration(this.systemBootstrapper, {
            isCrossdomain: true,
            crossDomainsTimeout: 20000,
            crossDomainsList: [
                'http://crossdomain2.local:9000/crossdomain/indexintegration.html',
                'http://crossdomain3.local:9000/crossdomain/indexintegration.html',
            ],
        });

        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.muidSuccess, "multiple muids were not received");
            assert.equal(2, this.muidSuccessCounter, "2 muid were not received");
            window.removeEventListener('message', this.messageHandler);
        });
    });
});
