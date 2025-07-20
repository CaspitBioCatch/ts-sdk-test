import SupportedBrowserChecker from '../main/technicalServices/SupportedBrowserChecker';
import applyPolyfills from '../main/common/polyfills/PolyfillsApplier';
import { BCProtocolType } from '../main/contract/BCProtocolType';

export class BioCatchApi {
  constructor(client, dynamicCdApiLoader, configMapper, serverUrlResolver, remoteConfigurationLoadedCallback) {
    this._client = client;
    this._dynamicCdApiLoader = dynamicCdApiLoader;
    this._configMapper = configMapper;
    this._serverUrlResolver = serverUrlResolver;
    this._remoteConfigurationLoadedCallback = remoteConfigurationLoadedCallback;

    applyPolyfills();

    // Abort if the browser is unsupported
    if (!SupportedBrowserChecker.isSupported()) {
      throw new Error('BioCatchApi: browser is not supported.');
    }
  }
  start(wupServerUrl, customerID, customerSessionID, configurations, protocolType = BCProtocolType.V4) {
    const resolvedServerUrl = this._serverUrlResolver.resolve(
        wupServerUrl,
        customerID,
        protocolType
    );
    const startupConfigurations = this._configMapper.mapStartupConfigurations(
        resolvedServerUrl,
        configurations
    );
    const cdApi = this._dynamicCdApiLoader.createCdApi(window, customerSessionID);
    this._client.manualStart(startupConfigurations, resolvedServerUrl, this._remoteConfigurationLoadedCallback, cdApi);
  }
  stop() {
    this._client.stop();
  }
  pause() {
    this._client.pause();
  }
  resume() {
    this._client.resume();
  }
  updateCustomerSessionID(customerID) {
    this._client.updateCustomerSessionID(customerID);
  }
  changeContext(contextName) {
    this._client.changeContext(contextName);
  }
  startNewSession(customerSessionID) {
    this._client.startNewSession(customerSessionID);
  }
  setCoordinatesMasking (isEnable) {
    this._client.setCoordinatesMasking(isEnable);
  }
  setCustomerBrand (brand) {
    this._client.setCustomerBrand(brand);
  }
}