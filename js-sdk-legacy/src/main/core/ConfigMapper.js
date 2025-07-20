import StartupConfigurations from '../api/StartupConfigurations';
import { APIConfigurationKey } from '../contract/APIConfigurationKey';
import CollectionSettings from '../api/CollectionSettings';
import { ConfigurationFields } from './configuration/ConfigurationFields';

export class ConfigMapper {
  mapStartupConfigurations(wupServerUrl, configurations) {
    return new StartupConfigurations(
      wupServerUrl,
      configurations[APIConfigurationKey.logServerURL],
      configurations[APIConfigurationKey.enableFramesProcessing],
      configurations[APIConfigurationKey.enableCustomElementsProcessing],
      configurations[APIConfigurationKey.enableSameSiteNoneAndSecureCookies],
      configurations[APIConfigurationKey.useUrlWorker] || false,
      configurations[APIConfigurationKey.workerUrl] || '',
      configurations[APIConfigurationKey.isWupServerURLProxy] || false,
      configurations[APIConfigurationKey.clientSettings],
      new CollectionSettings(configurations[APIConfigurationKey.collectionSettings]),
      configurations[APIConfigurationKey.enableStartupCustomerSessionId],
      configurations[APIConfigurationKey.mutationMaxChunkSize] || 0,
      configurations[APIConfigurationKey.mutationChunkDelayMs] || 100,
      configurations[ConfigurationFields.passwordIdMaskingList],
      configurations[ConfigurationFields.enableUnmaskedValues] || false,
      configurations[ConfigurationFields.allowedUnmaskedValuesList] || [],
      configurations[ConfigurationFields.enableCoordinatesMasking] || false,
      configurations[APIConfigurationKey.isFlutterApp] || false,
      configurations[APIConfigurationKey.enableMinifiedWupUri] !== undefined ? configurations[APIConfigurationKey.enableMinifiedWupUri] : true,
      configurations[APIConfigurationKey.enableMinifiedLogUri] !== undefined ? configurations[APIConfigurationKey.enableMinifiedLogUri] : false,
      configurations[APIConfigurationKey.maxShadowDepth] || 0,
      configurations[APIConfigurationKey.iframeLoadingTimeout] || 5000,
        configurations[APIConfigurationKey.elementCategories],
        configurations[APIConfigurationKey.elementAttributes],
      configurations[APIConfigurationKey.enableMathDetect] !== undefined ? configurations[APIConfigurationKey.enableMathDetect] : false,
      configurations[APIConfigurationKey.enableBrowserDisplayDetect] !== undefined ? configurations[APIConfigurationKey.enableBrowserDisplayDetect] : false,
      configurations[APIConfigurationKey.enableGraphCard] !== undefined ? configurations[APIConfigurationKey.enableGraphCard] : false,
        configurations[APIConfigurationKey.useLegacyZeroTimeout] !== undefined ? configurations[APIConfigurationKey.useLegacyZeroTimeout] : true,
    );
  }
}
