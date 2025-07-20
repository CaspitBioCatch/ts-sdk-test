import SupportedBrowserChecker from './technicalServices/SupportedBrowserChecker';
import applyPolyfills from './common/polyfills/PolyfillsApplier';
import { BCProtocolType } from './contract/BCProtocolType';

export class BioCatchClient {
  constructor(client, dynamicCdApiLoader, configMapper, serverUrlResolver, remoteConfigurationLoadedCallback) {
    applyPolyfills();

    // Unsupported browsers are aborted.
    if (!SupportedBrowserChecker.isSupported()) {
      return;
    }

    if ('cdApi' in window) {
      client.autoStart(remoteConfigurationLoadedCallback);
    } else {
      window.bcClient = this._createProxyInterface(client, serverUrlResolver, configMapper, dynamicCdApiLoader, remoteConfigurationLoadedCallback);
    }
  }

  /**
   * Creates an interface that disconnected from the actual BioCatchClient instance, so that
   * It will be less easy to inspect or debug BioCatchClient members and see it runtime values.
   */
  _createProxyInterface(client, serverUrlResolver, configMapper, dynamicCdApiLoader, remoteConfigurationLoadedCallback) {
    return {
      start: function(wupServerUrl, customerID, customerSessionID, configurations, protocolType = BCProtocolType.V3) {
        // Prioritize the extended options and cid provided by the start params over the raw url.
        const resolvedServerUrl = serverUrlResolver.resolve(
          wupServerUrl,
          customerID,
          protocolType
        );

        // Translate the configurations json to StartupConfigurations object the JavaScript knows to work with.
        const startupConfigurations = configMapper.mapStartupConfigurations(
          resolvedServerUrl,
          configurations
        );

        // Attach to the window the cdApi so the sdk could work as it used to.
        dynamicCdApiLoader.attachCdApi(window, customerSessionID);

        client.manualStart(startupConfigurations, resolvedServerUrl, remoteConfigurationLoadedCallback);
      },
      stop: function() {
        client.stop();
      },
      pause: function() {
        client.pause();
      },
      resume: function() {
        client.resume();
      },
      updateCustomerSessionID: function(customerID) {
        client.updateCustomerSessionID(customerID);
      },
      changeContext: function(contextName) {
        client.changeContext(contextName);
      },
      startNewSession: function(customerSessionID) {
        client.startNewSession(customerSessionID);
      },
      setCoordinatesMasking: function(isEnable) {
        client.setCoordinatesMasking(isEnable);
      },
      setCustomerBrand: function(brand) {
        client.setCustomerBrand(brand);
      }
    };
  }
}
