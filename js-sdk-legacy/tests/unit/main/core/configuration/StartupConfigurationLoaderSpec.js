import ConfigurationRepository from '../../../../../src/main/core/configuration/ConfigurationRepository';
import { assert } from 'chai';
import { ConfigurationFields } from '../../../../../src/main/core/configuration/ConfigurationFields';
import StartupConfigurationLoader from '../../../../../src/main/core/configuration/StartupConfigurationLoader';
import { APIConfigurationKey } from '../../../../../src/main/contract/APIConfigurationKey';
import { ConfigMapper } from '../../../../../src/main/core/ConfigMapper';

describe('StartupConfigurationLoader tests:', function() {

  const configMapper = new ConfigMapper();

  it('should load default configurations into configurationRepository', function() {

    // Force defaults
    const configurations = {};

    const startupConfigurations = configMapper.mapStartupConfigurations('http://www.wup.url.com', configurations);
    const configurationRepository = new ConfigurationRepository(configurations);

    const startupConfigurationLoader = new StartupConfigurationLoader(configurationRepository, startupConfigurations);
    startupConfigurationLoader.loadStartUpConfigurations();

    assert.equal(configurationRepository.get(ConfigurationFields.logAddress), null);
    assert.isTrue(configurationRepository.get(ConfigurationFields.enableMinifiedLogUri) === false);
    assert.isTrue(configurationRepository.get(ConfigurationFields.enableFramesProcessing) === true);
    assert.isTrue(configurationRepository.get(ConfigurationFields.enableCustomElementsProcessing) === false);
    assert.equal(configurationRepository.get(ConfigurationFields.customElementAttribute), 'data-automation-id');
    assert.isTrue(configurationRepository.get(ConfigurationFields.enableSameSiteNoneAndSecureCookies) === true);
    assert.deepEqual(configurationRepository.get(ConfigurationFields.maskElementsAttributes), []);
    assert.equal(configurationRepository.get(ConfigurationFields.parentElementSelector), '');
    assert.equal(configurationRepository.get(ConfigurationFields.childElementWithCustomAttribute), '');
    assert.equal(configurationRepository.get(ConfigurationFields.elementDataAttribute), '');
    assert.deepEqual(configurationRepository.get(ConfigurationFields.customButtons), []);
    assert.equal(configurationRepository.get(ConfigurationFields.agentType), 'primary');
    assert.equal(configurationRepository.get(ConfigurationFields.collectionMode), 'full');
    assert.isTrue(configurationRepository.get(ConfigurationFields.enableWupMessagesHashing) === false);
    assert.isTrue(configurationRepository.get(ConfigurationFields.enableStartupCustomerSessionId) === false);
    assert.isTrue(configurationRepository.get(ConfigurationFields.mutationMaxChunkSize) === 0);
    assert.isTrue(configurationRepository.get(ConfigurationFields.mutationChunkDelayMs) === 100);
    assert.deepEqual(configurationRepository.get(ConfigurationFields.passwordIdMaskingList), []);
    assert.isTrue(configurationRepository.get(ConfigurationFields.enableUnmaskedValues) === false);
    assert.deepEqual(configurationRepository.get(ConfigurationFields.allowedUnmaskedValuesList), []);
    assert.isTrue(configurationRepository.get(ConfigurationFields.enableCoordinatesMasking) === false);
  });

  it('should load all local configurations into configurationRepository', function() {

    // Set of none-default configurations
    const configurations = {
      [APIConfigurationKey.logServerURL]: 'https://log.example.com',
      [APIConfigurationKey.enableMinifiedLogUri]: true,
      [APIConfigurationKey.enableFramesProcessing]: false,
      [APIConfigurationKey.enableCustomElementsProcessing]: true,
      [APIConfigurationKey.enableSameSiteNoneAndSecureCookies]: false,
      [APIConfigurationKey.maskElementsAttributes]: true,
      [APIConfigurationKey.clientSettings]: {
        enableWupMessagesHashing: true,
        [ConfigurationFields.enableCoordinatesMasking]: true,
      },
      [APIConfigurationKey.collectionSettings]: {
        [APIConfigurationKey.mode]: {
          agentType: 'secondary',
          collectionMode: 'lean'
        },
        elementSettings: {
          customElementAttribute: 'data-bc',
          maskElementsAttributes: [
            {
              name: 'payee_id_for_',
              regexPattern: '^payee_id_for_'
            }
          ],
          keyEventsMaskSpecialChars: false
        },
        customInputElementSettings: {
          parentElementSelector: 'ngx-slider',
          childElementWithCustomAttribute: 'span.ngx-slider-span.ngx-slider-pointer.ngx-slider-pointer-min',
          elementDataAttribute: 'ariaValueNow',
          customButtons: [
            'body > app-root > div > div.slider-container > button:nth-child(1)',
            'body > app-root > div > div.slider-container > button:nth-child(3)'
          ]
        }
      },
      [APIConfigurationKey.enableStartupCustomerSessionId]: true,
      [APIConfigurationKey.mutationMaxChunkSize]: 500,
      [APIConfigurationKey.mutationChunkDelayMs]: 200,
      [ConfigurationFields.passwordIdMaskingList]: ['1234', '5678'],
      [ConfigurationFields.enableUnmaskedValues]: true,
      [ConfigurationFields.allowedUnmaskedValuesList]: ['value1', 'value2'],
      [APIConfigurationKey.isFlutterApp]: true,
      [APIConfigurationKey.enableMinifiedWupUri]: false
    };

    const startupConfigurations = configMapper.mapStartupConfigurations('http://www.wup.url.com', configurations);
    const configurationRepository = new ConfigurationRepository(configurations);

    const startupConfigurationLoader = new StartupConfigurationLoader(configurationRepository, startupConfigurations);
    startupConfigurationLoader.loadStartUpConfigurations();

    assert.equal(configurationRepository.get(ConfigurationFields.logAddress), 'https://log.example.com');
    assert.isTrue(configurationRepository.get(ConfigurationFields.enableMinifiedLogUri) === true);
    assert.isTrue(configurationRepository.get(ConfigurationFields.enableFramesProcessing) === false);
    assert.isTrue(configurationRepository.get(ConfigurationFields.enableCustomElementsProcessing) === true);
    assert.equal(configurationRepository.get(ConfigurationFields.customElementAttribute), 'data-bc');
    assert.isTrue(configurationRepository.get(ConfigurationFields.enableSameSiteNoneAndSecureCookies) === false);
    assert.deepEqual(configurationRepository.get(ConfigurationFields.maskElementsAttributes), [
      {
        name: 'payee_id_for_',
        regexPattern: '^payee_id_for_'
      }
    ]);
    assert.equal(configurationRepository.get(ConfigurationFields.parentElementSelector), 'ngx-slider');
    assert.equal(configurationRepository.get(ConfigurationFields.childElementWithCustomAttribute), 'span.ngx-slider-span.ngx-slider-pointer.ngx-slider-pointer-min');
    assert.equal(configurationRepository.get(ConfigurationFields.elementDataAttribute), 'ariaValueNow');
    assert.deepEqual(configurationRepository.get(ConfigurationFields.customButtons), [
      'body > app-root > div > div.slider-container > button:nth-child(1)',
      'body > app-root > div > div.slider-container > button:nth-child(3)'
    ]);
    assert.equal(configurationRepository.get(ConfigurationFields.agentType), 'secondary');
    assert.equal(configurationRepository.get(ConfigurationFields.collectionMode), 'lean');
    assert.isTrue(configurationRepository.get(ConfigurationFields.enableWupMessagesHashing) === true);
    assert.isTrue(configurationRepository.get(ConfigurationFields.enableStartupCustomerSessionId) === true);
    assert.isTrue(configurationRepository.get(ConfigurationFields.mutationMaxChunkSize) === 500);
    assert.isTrue(configurationRepository.get(ConfigurationFields.mutationChunkDelayMs) === 200);
    assert.deepEqual(configurationRepository.get(ConfigurationFields.passwordIdMaskingList), ['1234', '5678']);
    assert.isTrue(configurationRepository.get(ConfigurationFields.enableUnmaskedValues) === true);
    assert.deepEqual(configurationRepository.get(ConfigurationFields.allowedUnmaskedValuesList), ['value1', 'value2']);
    assert.isTrue(configurationRepository.get(ConfigurationFields.enableCoordinatesMasking) === true);
  });
});



