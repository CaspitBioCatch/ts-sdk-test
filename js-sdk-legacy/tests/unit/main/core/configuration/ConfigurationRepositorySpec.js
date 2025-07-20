import { assert } from 'chai';
import ConfigurationRepository from '../../../../../src/main/core/configuration/ConfigurationRepository';
import { ConfigurationFields } from '../../../../../src/main/core/configuration/ConfigurationFields';
import sinon from 'sinon';

describe('ConfigurationRepository tests:', function () {
    describe('get tests:', function () {
        it('get value successfully', function () {
            const configurationRepository = new ConfigurationRepository();

            const firstKey = 'BLAbla';
            const firstValue = 5;
            const secondKey = 'gogo';
            const secondValue = 'lala';

            configurationRepository.set(firstKey, firstValue);
            configurationRepository.set(secondKey, secondValue);

            assert.equal(firstValue, configurationRepository.get(firstKey));
            assert.equal(secondValue, configurationRepository.get(secondKey));
        });

        it('get non existing value', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.notExists(configurationRepository.get('noVal'));
        });
    });

    describe('loadConfigurations tests:', function () {
        it('load configurations successfully', function () {
            const configurationRepository = new ConfigurationRepository();
            configurationRepository.loadConfigurations({ a: 'b', b: 'cc', c: 'ddd' });

            assert.equal(configurationRepository.get('a'), 'b');
            assert.isUndefined(configurationRepository.get('aa'), 'trying non existent param');
        });

        it('load empty configurations leaves default ones', function () {
            const configurationRepository = new ConfigurationRepository();
            configurationRepository.loadConfigurations({});

            assert.equal(configurationRepository.get(ConfigurationFields.resetSessionApiThreshold), 20000);
        });

        it('loading configurations overrides default ones', function () {
            const configurationRepository = new ConfigurationRepository();
            configurationRepository.loadConfigurations({ 'resetSessionApiThreshold': 1234 });

            assert.equal(configurationRepository.get(ConfigurationFields.resetSessionApiThreshold), 1234);
        });

        it('parse configurations successfully ', function () {
            const response = {
                'abcToInitiate': 0,
                'action': 1,
                'allowedAbcTypes': [
                    0,
                ],
                'configuration': {
                    'dataWupDispatchRateSettings': '{"type": "incremental", "initialRateValueMs": 500,"incrementStepMs": 500,"incrementStopMs": 5000,"incrementStartWupSendCount": 20}',
                    'logWupDispatchRateSettings': '{"type": "constant", "initialRateValueMs": 2500}',
                    'serverCommunicationSettings': '{"queueLoadThreshold": 100}',
                    'wupStatisticsLogIntervalMs': 1000,
                },
                'debugLevel': 0,
                'nextState': 1,
                'startAbcAutonomously': false,
                'success': true,
                'timeToWait': 0,
            };

            const configurationRepository = new ConfigurationRepository();

            const configParseSpy = sinon.spy(configurationRepository, '_tryParseConfigurationValue');

            configurationRepository.loadConfigurations(response.configuration);

            const configuration = configurationRepository.get(ConfigurationFields.dataWupDispatchRateSettings);

            assert.notEqual(typeof configuration, 'string');

            assert.equal(configParseSpy.callCount, 3);

            assert.equal(configuration.type, 'incremental');
            assert.equal(configuration.initialRateValueMs, 500);
            assert.equal(configuration.incrementStepMs, 500);
            assert.equal(configuration.incrementStopMs, 5000);
            assert.equal(configuration.incrementStartWupSendCount, 20);
        });
    });

    describe('isConfigurationUpdatedFromServer tests:', function () {
        it('returns true when configuration was loaded', function () {
            const configurationRepository = new ConfigurationRepository();
            configurationRepository.loadConfigurations({ 'resetSessionApiThreshold': 1234 });

            assert.isTrue(configurationRepository.isConfigurationUpdatedFromServer());
        });

        it('returns false when configuration was NOT loaded', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.isFalse(configurationRepository.isConfigurationUpdatedFromServer());
        });
    });

    describe('set tests:', function () {
        it('set a single configuration successfully', function () {
            const configurationRepository = new ConfigurationRepository();

            configurationRepository.set('myName', 'myValue');

            assert.equal(configurationRepository.get('myName'), 'myValue');
            assert.isUndefined(configurationRepository.get('aa'), 'trying non existent param');
        });

        it('override existing configuration', function () {
            const configurationRepository = new ConfigurationRepository();

            // try configuration that exists by default
            configurationRepository.set('logLevel', 'shirley');

            assert.equal(configurationRepository.get('logLevel'), 'shirley');
            assert.isUndefined(configurationRepository.get('aa'), 'trying non existent param');
        });
    });

    describe('getAll tests:', function () {
        it('get all configurations successfully', function () {
            const configurationRepository = new ConfigurationRepository();

            configurationRepository.loadConfigurations({ a: 'b', b: 'cc', c: 'ddd' });

            assert.notDeepEqual(configurationRepository.getAll(), configurationRepository.configDefault);
        });

        it('get default configurations if non is loaded', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.deepEqual(configurationRepository.getAll(), configurationRepository.configDefault);
        });
    });

    describe('default configuration tests:', function () {
        it('isMotionAroundTouchEnabled is true by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.isTrue(configurationRepository.get(ConfigurationFields.isMotionAroundTouchEnabled));
        });

        it('isMotionOnSessionStart is true by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.isTrue(configurationRepository.get(ConfigurationFields.isMotionOnSessionStart));
        });

        it('collectCustomElementAttribute is true by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.isTrue(configurationRepository.get(ConfigurationFields.collectCustomElementAttribute));
        });

        it('isMutationObserver is true by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.isTrue(configurationRepository.get(ConfigurationFields.isMutationObserver));
        });

        it('forceDynamicDataWupDispatchSettings is true by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.isTrue(configurationRepository.get(ConfigurationFields.forceDynamicDataWupDispatchSettings));
        });

        it('isVMDetection is true by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.isTrue(configurationRepository.get(ConfigurationFields.isVMDetection));
        });

        it('isScrollCollect is true by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.isTrue(configurationRepository.get(ConfigurationFields.isScrollCollect));
        });

        it('isEnabled is true by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.isTrue(configurationRepository.get(ConfigurationFields.isEnabled));
        });

        it('isContextPropsFeature is true by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.isTrue(configurationRepository.get(ConfigurationFields.isContextPropsFeature));
        });

        it('isCrossDomain is false by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.isFalse(configurationRepository.get(ConfigurationFields.isCrossDomain));
        });

        it('collectSelectElementBlurAndFocusEvents is false by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.isFalse(configurationRepository.get(ConfigurationFields.collectSelectElementBlurAndFocusEvents));
        });

        it('motionPaddingAroundTouchMSec is true by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.equal(configurationRepository.get(ConfigurationFields.motionPaddingAroundTouchMSec), 3000);
        });

        it('motionPaddingOnSessionStartMSec is true by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.equal(configurationRepository.get(ConfigurationFields.motionPaddingOnSessionStartMSec), 20000);
        });

        it('locationEventsTimeoutMsec is true by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.equal(configurationRepository.get(ConfigurationFields.locationEventsTimeoutMsec), 10000);
        });

        it('serverCommunicationSettings is true by default', function () {
            const configurationRepository = new ConfigurationRepository();
            assert.equal(configurationRepository.get(ConfigurationFields.serverCommunicationSettings).queueLoadThreshold, 100);
        });

        it('logWupDispatchRateSettings is true by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.equal(configurationRepository.get(ConfigurationFields.logWupDispatchRateSettings).initialRateValueMs, 2500);
            assert.equal(configurationRepository.get(ConfigurationFields.logWupDispatchRateSettings).type, 'constant');
        });

        it('logMessageRequestTimeout is true by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.equal(configurationRepository.get(ConfigurationFields.logMessageRequestTimeout), 5000);
        });

        it('slaveChannelHandshakeTimeout is true by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.equal(configurationRepository.get(ConfigurationFields.slaveChannelHandshakeTimeout), 60000);
        });

        it('slaveAliveMessageInterval is 100 by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.equal(configurationRepository.get(ConfigurationFields.slaveAliveMessageInterval), 100);
        });

        it('wupMessageRequestTimeout is 5000 by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.equal(configurationRepository.get(ConfigurationFields.wupMessageRequestTimeout), 5000);
        });

        it('resetSessionApiThreshold is 20000 by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.equal(configurationRepository.get(ConfigurationFields.resetSessionApiThreshold), 20000);
        });

        it('heartBeatMessageInterval is 5000 by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.equal(configurationRepository.get(ConfigurationFields.heartBeatMessageInterval), 5000);
        });

        it('wupStatisticsLogIntervalMs is 30000 by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.equal(configurationRepository.get(ConfigurationFields.wupStatisticsLogIntervalMs), 30000);
        });

        it('gyroEventsThreshold is 0.3 by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.equal(configurationRepository.get(ConfigurationFields.gyroEventsThreshold), 0.3);
        });

        it('gyroEventsSamplePeriod is 0 by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.equal(configurationRepository.get(ConfigurationFields.gyroEventsSamplePeriod), 0);
        });

        it('dataQPassWorkerInterval is 500 by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.equal(configurationRepository.get(ConfigurationFields.dataQPassWorkerInterval), 500);
        });

        it('accelerometerEventsSamplePeriod is 0 by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.equal(configurationRepository.get(ConfigurationFields.accelerometerEventsSamplePeriod), 0);
        });

        it('orientationEventsThreshold is 1 by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.equal(configurationRepository.get(ConfigurationFields.orientationEventsThreshold), 1);
        });

        it('orientationEventsSamplePeriod is 300 by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.equal(configurationRepository.get(ConfigurationFields.orientationEventsSamplePeriod), 300);
        });

        it('crossDomainsTimeout is 5000 by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.equal(configurationRepository.get(ConfigurationFields.crossDomainsTimeout), 5000);
        });

        it('isCaptureKeyEvents is false by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.isFalse(configurationRepository.get(ConfigurationFields.isCaptureKeyEvents));
        });

        it('collectKeyRegionValue is false by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.isFalse(configurationRepository.get(ConfigurationFields.collectKeyRegionValue));
        });

        it('isAudioDetection is false by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.isFalse(configurationRepository.get(ConfigurationFields.isAudioDetection));
        });

        it('stateChangeEnabled is false by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.isFalse(configurationRepository.get(ConfigurationFields.stateChangeEnabled));
        });

        it('crossDomainsList is not empty by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.equal(configurationRepository.get(ConfigurationFields.crossDomainsList).length, 0);
        });

        it('logLevel is 20 by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.equal(configurationRepository.get(ConfigurationFields.logLevel), 20);
        });

        it('wupMessageNumToRetry is 5 by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.equal(configurationRepository.get(ConfigurationFields.wupMessageNumToRetry), 5);
        });

        it('logMessageNumToRetry is 5 by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.equal(configurationRepository.get(ConfigurationFields.logMessageNumToRetry), 5);
        });
        it('wupMessageRetryInterval is 1000 by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.equal(configurationRepository.get(ConfigurationFields.wupMessageRetryInterval), 1000);
        });

        it('logMessageRetryInterval is 1000 by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.equal(configurationRepository.get(ConfigurationFields.logMessageRetryInterval), 1000);
        });
        it('wupIncrementalGrowthBetweenFailures is 3500 by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.equal(configurationRepository.get(ConfigurationFields.wupIncrementalGrowthBetweenFailures), 3500);
        });
        it('logIncrementalGrowthBetweenFailures is 3500 by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.equal(configurationRepository.get(ConfigurationFields.logIncrementalGrowthBetweenFailures), 3500);
        });
        it('wupMaxIntervalBetweenFailures is 16000 by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.equal(configurationRepository.get(ConfigurationFields.wupMaxIntervalBetweenFailures), 16000);
        });

        it('logMaxIntervalBetweenFailures is 16000 by default', function () {
            const configurationRepository = new ConfigurationRepository();

            assert.equal(configurationRepository.get(ConfigurationFields.logMaxIntervalBetweenFailures), 16000);
        });

        it('ConfigurationRepository default configuration should not include maskElementsAttributes conf',function(){
            const configurationRepository = new ConfigurationRepository();
            assert.isUndefined(configurationRepository.get(ConfigurationFields.maskElementsAttributes),'expected configuration to not exist');
        });

    });
});

describe('ConfigurationRepository additional tests', () => {
    let repository;

    beforeEach(() => {
        repository = new ConfigurationRepository();
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('loadConfigurations', () => {
        it('should not override blacklisted configurations when forceOverride is false and not using default configuration', () => {
            const newConfig = {
                [ConfigurationFields.keyEventsMaskSpecialChars]: true,
                [ConfigurationFields.passwordIdMaskingList]: ['newPassword'],
                someOtherConfig: 'newValue',
            };

            repository.loadConfigurations(newConfig, false);

            expect(repository.get(ConfigurationFields.keyEventsMaskSpecialChars)).to.equal(false); // Default value
            expect(repository.get(ConfigurationFields.passwordIdMaskingList)).to.deep.equal([]); // Default value
            expect(repository.get('someOtherConfig')).to.equal('newValue');
        });

        it('should override blacklisted configurations when forceOverride is true', () => {
            const newConfig = {
                [ConfigurationFields.keyEventsMaskSpecialChars]: true,
                [ConfigurationFields.passwordIdMaskingList]: ['newPassword'],
            };

            repository.loadConfigurations(newConfig, true);

            expect(repository.get(ConfigurationFields.keyEventsMaskSpecialChars)).to.equal(true);
            expect(repository.get(ConfigurationFields.passwordIdMaskingList)).to.deep.equal(['newPassword']);
        });

        it('should parse values for fields in _requireParseFields', () => {
            const newConfig = {
                [ConfigurationFields.dataWupDispatchRateSettings]: '{"type": "parsed"}',
            };

            repository.loadConfigurations(newConfig, false);

            expect(repository.get(ConfigurationFields.dataWupDispatchRateSettings)).to.deep.equal({ type: 'parsed' });
        });

        it('should leave non-blacklisted configurations unaffected', () => {
            const newConfig = {
                someOtherConfig: 'newValue',
            };

            repository.loadConfigurations(newConfig, false);

            expect(repository.get('someOtherConfig')).to.equal('newValue');
        });
    });
});

