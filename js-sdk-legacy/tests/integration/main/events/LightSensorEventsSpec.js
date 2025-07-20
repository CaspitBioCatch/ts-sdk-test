import { assert } from 'chai';
import { EventStructure as LightEventStructure } from '../../../../src/main/collectors/events/LightSensorEventCollector';
import { TestUtils } from '../../../TestUtils';
import ConfigurationChanger from '../ConfigurationChanger';

describe('LightSensor events tests:', function () {
    beforeEach(function () {
        if (!window.AmbientLightSensor) {
            this.skip();
        }

        const lightSensorEvents = this.systemBootstrapper.getFeatureBuilder()._features.list.LightSensorEvents.instance;

        this._updateFeatureConfigSpy = sinon.spy(lightSensorEvents, 'updateFeatureConfig');
    });

    afterEach(function () {
        if (this._updateFeatureConfigSpy) {
            this._updateFeatureConfigSpy.restore();
        }
    });

    it('should report light level', async function () {
        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

        // Modify the configuration before the scenario
        ConfigurationChanger.change(this.systemBootstrapper, {
            isLightSensor: true,
        });

        // Wait for the configuration update to apply on the feature
        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this._updateFeatureConfigSpy.called, 'Light Sensor events updateFeatureConfig function was not called');
        });

        TestUtils.verifyCallHappened(serverWorkerSendAsync, 'ambient_light_level', 'ambient_light_level', (data) => {
            assert.isTrue(data[LightEventStructure.indexOf('illuminance') + 1] > -1, 'light level not as expected');
        });
    });
});
