import SlaveCdApiFacade from "../../../../src/slave/api/SlaveCdApiFacade";
import sinon from "sinon";
import { ApiContractName } from "../../../../src/main/api/ApiContractName";
import { APIConfigurationKey } from "../../../../src/main/contract/APIConfigurationKey";

describe('SlaveCdApiFacade tests', function () {

    const cdApiOriginal = window.slaveCdApi;

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        this.sandbox.restore();
        window.slaveCdApi = cdApiOriginal;
    });

    describe('getConfigurations', function () {
        it('should getConfigurations return false', function () {
            const slaveCdApFacade = new SlaveCdApiFacade()
            const getConfigurations = this.sandbox.stub(window.slaveCdApi, 'getConfigurations');
            getConfigurations.callsArgWith(0, {
                enableCustomElementDetector: false,
                enableAcknowledgeMessageEvents: false,
            });
            const slaveConfiguration = slaveCdApFacade.getConfigurations();
            assert.isFalse(slaveConfiguration.getEnableCustomElementDetector());
            assert.isFalse(slaveConfiguration.getEnableBufferAckMessage());
            getConfigurations.restore();
        });

        it('should getConfigurations return true', function () {
            const slaveCdApFacade = new SlaveCdApiFacade();
            const getConfigurations = this.sandbox.stub(window.slaveCdApi, 'getConfigurations');
            getConfigurations.callsArgWith(0, {
                enableCustomElementDetector: true,
                enableAcknowledgeMessageEvents: true,
            });
            const slaveConfiguration = slaveCdApFacade.getConfigurations()
            assert.isTrue(slaveConfiguration.getEnableCustomElementDetector());
            assert.isTrue(slaveConfiguration.getEnableBufferAckMessage());
            getConfigurations.restore();
        });

        it('should getConfigurations with optimazation for mutation observer', function () {
            const slaveCdApFacade = new SlaveCdApiFacade()
            const getConfigurations = this.sandbox.stub(window.slaveCdApi, 'getConfigurations');
            getConfigurations.callsArgWith(0, {
                mutationMaxChunkSize: 0,
                mutationChunkDelayMs: 100,
            });
            const slaveConfiguration = slaveCdApFacade.getConfigurations();
            assert.isTrue(slaveConfiguration.getMutationMaxChunkSize() === 0)
            assert.isTrue(slaveConfiguration.getMutationChunkDelayMs() === 100)
            getConfigurations.restore();
        });

        it('should getConfigurations return true when EnableCustomElementDetector is not exist', function () {
            const slaveCdApFacade = new SlaveCdApiFacade();
            const getConfigurations = this.sandbox.stub(window.slaveCdApi, 'getConfigurations');
            getConfigurations.callsArgWith(0, {});
            const slaveConfiguration = slaveCdApFacade.getConfigurations()
            assert.isTrue(slaveConfiguration.getEnableCustomElementDetector())
            getConfigurations.restore();
        });

        it('should getConfigurations return true when EnableCustomElementDetector is not boolean type', function () {
            const slaveCdApFacade = new SlaveCdApiFacade();
            const getConfigurations = this.sandbox.stub(window.slaveCdApi, 'getConfigurations');
            getConfigurations.callsArgWith(0, {
                enableCustomElementDetector: "hello"
            });
            const slaveConfiguration = slaveCdApFacade.getConfigurations();
            assert.isTrue(slaveConfiguration.getEnableCustomElementDetector());
            assert.isNull(slaveConfiguration.getEnableBufferAckMessage());
            getConfigurations.restore();
        });

        it('should getConfigurations return default values for mutation observer', function () {
            const slaveCdApFacade = new SlaveCdApiFacade();
            const getConfigurations = this.sandbox.stub(window.slaveCdApi, 'getConfigurations');
            getConfigurations.callsArgWith(0, {
            });
            const slaveConfiguration = slaveCdApFacade.getConfigurations();
            assert.isTrue(slaveConfiguration.getMutationMaxChunkSize() === 0);
            assert.isTrue(slaveConfiguration.getMutationChunkDelayMs() === 100);
            getConfigurations.restore();
        });

        it('should isSlaveCdApiAvailable return true when API is exist', function () {
            const slaveCdApFacade = new SlaveCdApiFacade();
            const getConfigurations = this.sandbox.stub(window.slaveCdApi, 'getConfigurations');
            getConfigurations.callsArgWith(0, {});
            assert.isTrue(slaveCdApFacade.isSlaveCdApiAvailable())
            getConfigurations.restore();
        });

        it('should isApiAvailable return true when API is exist', function () {
            const slaveCdApFacade = new SlaveCdApiFacade();
            const getConfigurations = this.sandbox.stub(window.slaveCdApi, 'getConfigurations');
            getConfigurations.callsArgWith(0, {});
            assert.isTrue(slaveCdApFacade.isApiAvailable(ApiContractName.GetConfigurations))
            getConfigurations.restore();
        });

        it('should isApiAvailable return false when API is not exist', function () {
            window.slaveCdApi = {}
            const slaveCdApFacade = new SlaveCdApiFacade();
            assert.isFalse(slaveCdApFacade.isApiAvailable(ApiContractName.GetConfigurations))
        });

        it('should isSlaveCdApiAvailable return false when slaveCdApi is not exist', function () {
            window.slaveCdApi = undefined
            const slaveCdApFacade = new SlaveCdApiFacade();
            assert.isFalse(slaveCdApFacade.isSlaveCdApiAvailable());
        });

        it('should return true if configuration exist', function () {
            const slaveCdApFacade = new SlaveCdApiFacade()
            const configurations = {
                enableCustomElementDetector: true,
                enableAcknowledgeMessageEvents: true
            };
            const isEnableCustomElementDetector = slaveCdApFacade._isValidConfiguration(configurations[APIConfigurationKey.enableCustomElementDetector]);
            const isEnableSlavePreliminaryEventsBuffer = slaveCdApFacade._isValidConfiguration(configurations[APIConfigurationKey.enableAcknowledgeMessageEvents]);

            assert.isTrue(isEnableCustomElementDetector, 'isEnableCustomElementDetector was not true');
            assert.isTrue(isEnableSlavePreliminaryEventsBuffer, 'isEnableSlaveElementEventsBuffer was not true');
        });

        it('should return false if configuration is not valid', function () {
            const slaveCdApFacade = new SlaveCdApiFacade()
            const configurations = {
                enableCustomElementDetector: 'test',
                enableAcknowledgeMessageEvents: 'false'
            };

            const isEnableCustomElementDetector = slaveCdApFacade._isValidConfiguration(configurations[APIConfigurationKey.enableCustomElementDetector]);
            const isEnableSlavePreliminaryEventsBuffer = slaveCdApFacade._isValidConfiguration(configurations[APIConfigurationKey.enableAcknowledgeMessageEvents]);

            assert.isFalse(isEnableCustomElementDetector, 'isEnableCustomElementDetector was not undefined');
            assert.isFalse(isEnableSlavePreliminaryEventsBuffer, 'isEnableSlavePreliminaryEventsBuffer was not false');
        })

        it('should configuration is not valid number', function () {
            const slaveCdApFacade = new SlaveCdApiFacade()
            const configurations = {
                mutationMaxChunkSize: '0',
                mutationChunkDelayMs: '100',
            };

            const isMutationMaxChunkSize = slaveCdApFacade._isValidNumberConfiguration(configurations[APIConfigurationKey.mutationMaxChunkSize]);
            const isMutationChunkDelayMs = slaveCdApFacade._isValidNumberConfiguration(configurations[APIConfigurationKey.mutationChunkDelayMs]);

            assert.isFalse(isMutationMaxChunkSize, 'isMutationMaxChunkSize was not number');
            assert.isFalse(isMutationChunkDelayMs, 'isMutationChunkDelayMs was not number');
        })

        it('should getConfigurations get maxShadowDepth, iframeLoadingTimeout', function () {
            const slaveCdApFacade = new SlaveCdApiFacade()
            const getConfigurations = this.sandbox.stub(window.slaveCdApi, 'getConfigurations');
            getConfigurations.callsArgWith(0, {
                iframeLoadingTimeout: 5000,
                maxShadowDepth: 5,
            });
            const slaveConfiguration = slaveCdApFacade.getConfigurations();
            assert.isTrue(slaveConfiguration.getMaxShadowDepth() === 5)
            assert.isTrue(slaveConfiguration.getIframeLoadingTimeout() === 5000)
            getConfigurations.restore();
        });

    });
})