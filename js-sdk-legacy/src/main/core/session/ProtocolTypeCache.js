import { serverProtocolV3, serverProtocolV4, wupUrlV4Path } from '../../const/communication';

/**
 * Convenient class for extracting the wupServer protocol type from the configured wupServerURL, and hold it in-memory.
 *
 * By legacy, the protocol type was given as part the configured wupServerUrl path.
 * In practice - there is a code logic in WupServerClient which behaves differently for v3 and v4.
 * This logic includes for now:
 * 1. different request and response headers handling (see WupServerClient.js)
 * 2. re-composing (with or without minification) the final wupUrl (see WupUrlBuilder.js)
 */
export default class ProtocolTypeCache {

  constructor(configuredUrl) {
    this._protocolType = configuredUrl.includes(wupUrlV4Path) ? serverProtocolV4 : serverProtocolV3
  }

  /**
   *
   * @returns
   * the number 3 for v3.1 protocol
   * and the number 4 for v4 protocol
   */
  get() {
    return this._protocolType;
  }
}