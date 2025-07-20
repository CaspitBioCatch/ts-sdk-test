export default class ServerUrlCache {

  constructor(configuredUrl) {
    // Strip the base url and protocolType, because SessionService expect them to be standalone parameters
    let url = new URL(configuredUrl)
    this._baseServerAddress = url.protocol + '//' + url.host;
  }

  get() {
    return this._baseServerAddress;
  }
}