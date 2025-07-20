import ConfigurationRepository from '../../../../src/main/core/configuration/ConfigurationRepository';
import SensorGateKeeper from '../../../../src/main/collectors/SensorGateKeeper';
import { ConfigurationFields } from '../../../../src/main/core/configuration/ConfigurationFields';
import SessionInfoService from '../../../../src/main/core/session/SessionInfoService';

describe('SensorGateKeeper tests:', function () {
    it('MotionOnStart Disabled', function () {
        const sessionInfoServiceStub = sinon.createStubInstance(SessionInfoService);
        const configurationRepositoryStub = sinon.stub(new ConfigurationRepository());
        configurationRepositoryStub.get.withArgs(ConfigurationFields.isMotionOnSessionStart).returns(false);
        const sensorGateKeeper = new SensorGateKeeper(sessionInfoServiceStub, configurationRepositoryStub);

        sensorGateKeeper.configure();

        assert.isFalse(sensorGateKeeper.isOpen());
    });

    it('MotionOnStart Enabled And Time Not Expired', function () {
        const sessionInfoServiceStub = sinon.createStubInstance(SessionInfoService);
        sessionInfoServiceStub.getStartTime.returns(Date.now());
        const configurationRepositoryStub = sinon.stub(new ConfigurationRepository());
        configurationRepositoryStub.get.withArgs(ConfigurationFields.isMotionOnSessionStart).returns(true);
        configurationRepositoryStub.get.withArgs(ConfigurationFields.motionPaddingOnSessionStartMSec).returns(200);
        const sensorGateKeeper = new SensorGateKeeper(sessionInfoServiceStub, configurationRepositoryStub);

        sensorGateKeeper.configure();

        assert.isTrue(sensorGateKeeper.isOpen());
    });

    it('MotionOnStart Enabled And Time Expired', function () {
        const sessionInfoServiceStub = sinon.createStubInstance(SessionInfoService);
        sessionInfoServiceStub.getStartTime.returns(Date.now() - 1600);
        const configurationRepositoryStub = sinon.stub(new ConfigurationRepository());
        configurationRepositoryStub.get.withArgs(ConfigurationFields.isMotionOnSessionStart).returns(true);
        configurationRepositoryStub.get.withArgs(ConfigurationFields.motionPaddingOnSessionStartMSec).returns(200);
        const sensorGateKeeper = new SensorGateKeeper(sessionInfoServiceStub, configurationRepositoryStub);

        sensorGateKeeper.configure();

        assert.isFalse(sensorGateKeeper.isOpen());
    });
});
