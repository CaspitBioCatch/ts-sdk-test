import { ConfigMapper } from '../../../../src/main/core/ConfigMapper';
import CollectionSettings from '../../../../src/main/api/CollectionSettings';
import { APIConfigurationKey } from '../../../../src/main/contract/APIConfigurationKey';
import { ConfigurationFields } from '../../../../src/main/core/configuration/ConfigurationFields';
import StartupConfigurations from '../../../../src/main/api/StartupConfigurations';


describe('ConfigMapper tests:', () => {
  let configMapper;

  beforeEach(() => {
    configMapper = new ConfigMapper();
  });

  it('should map startup configurations correctly with all fields', () => {
    const wupServerUrl = 'https://example.com';
    const configurations = {
      [APIConfigurationKey.logServerURL]: 'https://log.example.com',
      [APIConfigurationKey.enableFramesProcessing]: true,
      [APIConfigurationKey.enableCustomElementsProcessing]: true,
      [APIConfigurationKey.enableSameSiteNoneAndSecureCookies]: true,
      [APIConfigurationKey.useUrlWorker]: true,
      [APIConfigurationKey.workerUrl]: 'https://worker.example.com',
      [APIConfigurationKey.isWupServerURLProxy]: true,
      [APIConfigurationKey.clientSettings]: { enableFlush: true },
      [APIConfigurationKey.collectionSettings]: {},
      [APIConfigurationKey.enableStartupCustomerSessionId]: true,
      [APIConfigurationKey.mutationMaxChunkSize]: 500,
      [APIConfigurationKey.mutationChunkDelayMs]: 200,
      [ConfigurationFields.passwordIdMaskingList]: ['1234', '5678'],
      [ConfigurationFields.enableUnmaskedValues] : true,
      [ConfigurationFields.allowedUnmaskedValuesList] : [],
      [ConfigurationFields.enableCoordinatesMasking] : true,
      [APIConfigurationKey.isFlutterApp] : true,
      [APIConfigurationKey.enableMinifiedWupUri] : false,
      [APIConfigurationKey.enableMinifiedLogUri] : true,
      [APIConfigurationKey.maxShadowDepth] : 5,
      [APIConfigurationKey.enableGraphCard] : true,
      [APIConfigurationKey.enableBrowserDisplayDetect] : true,
      [APIConfigurationKey.enableMathDetect] : true,
    };

    const result = configMapper.mapStartupConfigurations(wupServerUrl, configurations);

    expect(result).to.be.instanceOf(StartupConfigurations);
    expect(result.getWupServerURL()).to.equal(wupServerUrl);
    expect(result.getLogServerURL()).to.equal(configurations[APIConfigurationKey.logServerURL]);
    expect(result.getEnableFramesProcessing()).to.equal(true);
    expect(result.getEnableCustomElementsProcessing()).to.equal(true);
    expect(result.getEnableSameSiteNoneAndSecureCookies()).to.equal(true);
    expect(result.getUseUrlWorker()).to.equal(true);
    expect(result.getWorkerUrl()).to.equal('https://worker.example.com');
    expect(result.getIsWupServerURLProxy()).to.equal(true);
    expect(result.getClientSettings()).to.deep.equal({ enableFlush: true });
    expect(result.getCollectionSettings()).to.be.instanceOf(CollectionSettings);
    expect(result.getEnableStartupCustomerSessionId()).to.equal(true);
    expect(result.getMutationMaxChunkSize()).to.equal(500);
    expect(result.getMutationChunkDelayMs()).to.equal(200);
    expect(result.getPasswordIdMaskingList()).to.deep.equal(['1234', '5678']);
    expect(result.isUnmaskedValuesEnabled()).to.equal(true);
    expect(result.getAllowedUnmaskedValuesList()).to.deep.equal([]);
    expect(result.isCoordinatesMaskingEnabled()).to.equal(true);
    expect(result.isFlutterApp()).to.equal(true);
    expect(result.isMinifiedWupUriEnabled()).to.equal(false);
    expect(result.isMinifiedLogUriEnabled()).to.equal(true);
    expect(result.getMaxShadowDepth()).to.equal(5);
    expect(result.isGraphCardEnabled()).to.equal(true);
    expect(result.isBrowserDisplayDetectEnabled()).to.equal(true);
    expect(result.isMathDetectEnabled()).to.equal(true);
  });

  it('should map startup configurations with default values for optional fields', () => {
    const wupServerUrl = 'https://example.com';
    const configurations = {
      [APIConfigurationKey.logServerURL]: 'https://log.example.com'
    };

    const result = configMapper.mapStartupConfigurations(wupServerUrl, configurations);

    expect(result).to.be.instanceOf(StartupConfigurations);
    expect(result.getUseUrlWorker()).to.equal(false);
    expect(result.getWorkerUrl()).to.equal('');
    expect(result.getIsWupServerURLProxy()).to.equal(false);
    expect(result.getMutationMaxChunkSize()).to.equal(0);
    expect(result.getMutationChunkDelayMs()).to.equal(100);
    expect(result.getPasswordIdMaskingList()).to.be.undefined;
    expect(result.isUnmaskedValuesEnabled()).to.equal(false);
    expect(result.getAllowedUnmaskedValuesList()).to.deep.equal([]);
    expect(result.isCoordinatesMaskingEnabled()).to.equal(false);
    expect(result.isFlutterApp()).to.equal(false);
    expect(result.isMinifiedWupUriEnabled()).to.equal(true);
    expect(result.isMinifiedLogUriEnabled()).to.equal(false);
    expect(result.getMaxShadowDepth()).to.equal(0);
    expect(result.isGraphCardEnabled()).to.equal(false);
    expect(result.isBrowserDisplayDetectEnabled()).to.equal(false);
    expect(result.isMathDetectEnabled()).to.equal(false);
  });

  it('should map startup configurations with missing collection settings', () => {
    const wupServerUrl = 'https://example.com';
    const configurations = {
      [APIConfigurationKey.logServerURL]: 'https://log.example.com',
      [APIConfigurationKey.clientSettings]: { enableFlush: true }
    };

    const result = configMapper.mapStartupConfigurations(wupServerUrl, configurations);

    expect(result.getCollectionSettings()).to.be.instanceOf(CollectionSettings);
  });
});
