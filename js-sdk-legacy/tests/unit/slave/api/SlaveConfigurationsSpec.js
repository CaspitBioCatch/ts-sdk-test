import SlaveConfigurations from "../../../../src/slave/api/SlaveConfigurations";

describe('SlaveConfigurations tests', function () {
    it('should return true', function () {
        const slaveConfiguration = new SlaveConfigurations(true)
        assert.isTrue(slaveConfiguration.getEnableCustomElementDetector());
    });

    it('should return false', function () {
        const slaveConfiguration = new SlaveConfigurations(false)
        assert.isFalse(slaveConfiguration.getEnableCustomElementDetector());
    });

    it('should return true', function () {
        const slaveConfiguration = new SlaveConfigurations(true,true)
        assert.isTrue(slaveConfiguration.getEnableBufferAckMessage());
    });

    it('should return false', function () {
        const slaveConfiguration = new SlaveConfigurations(false,false)
        assert.isFalse(slaveConfiguration.getEnableBufferAckMessage());
    });
})