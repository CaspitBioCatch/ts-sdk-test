export class BioCatchSDK {
  static _instance = null;

  constructor(clientApi) {
    this._client = clientApi;
  }

  static getInstance(clientApi) {
    if (!BioCatchSDK._instance) {
      if (!clientApi) {
        throw new Error('clientApi is required for first initialization');
      }
      BioCatchSDK._instance = new BioCatchSDK(clientApi);
    }
    return BioCatchSDK._instance;
  }

  start(wupServerUrl, customerID, customerSessionID, configurations, protocolType) {
    this._client.start(wupServerUrl, customerID, customerSessionID, configurations, protocolType);
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

  setCoordinatesMasking(isEnable) {
    this._client.setCoordinatesMasking(isEnable);
  }

  setCustomerBrand(brand) {
    this._client.setCustomerBrand(brand);
  }
}