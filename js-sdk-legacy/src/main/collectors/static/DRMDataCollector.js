import DataCollector from '../DataCollector';
import { x64hash128 } from "../../technicalServices/Hash";
import Log from '../../technicalServices/log/Logger';

class DRMDataCollector extends DataCollector {
  static getDefaultSettings() {
    return {
      configKey: 'isDRMFeature',
      isDefault: false,
      shouldRunPerContext: false,
      shouldRunPerSession: true,
      shouldRun: false,
      isFrameRelated: false,
      runInUns: false,
      runInSlave: false,
      runInLean: false,
      isRunning: false,
      instance: null,
    };
  }

  constructor(dataQ) {
    super();
    this._dataQ = dataQ;
    this.drmData = {};
  }

  // Added helper method so that tests can stub it
  hashDRMData(drmData) {
    return x64hash128(JSON.stringify(drmData));
  }

  async startFeature() {
    const drmSystems = {
      widevine: "com.widevine.alpha",
      playready: "com.microsoft.playready",
      fairplay: "com.apple.fairplay",
      clearkey: "org.w3.clearkey",
    };

    const config = [{
      initDataTypes: ["cenc"],
      videoCapabilities: [
        { contentType: 'video/mp4; codecs="avc1.42E01E"' },
        { contentType: 'video/webm; codecs="vp8"' },
      ],
      audioCapabilities: [
        { contentType: 'audio/mp4; codecs="mp4a.40.2"' }
      ]
    }];

    // Iterate over DRM systems and try to request access.
    for (const [name, keySystem] of Object.entries(drmSystems)) {
      try {
        const access = await navigator.requestMediaKeySystemAccess(keySystem, config);
        this.drmData[name] = {
          supported: true,
          keySystem: keySystem,
          sessionTypes: access.getConfiguration().sessionTypes,
          videoCapabilities: access.getConfiguration().videoCapabilities,
          audioCapabilities: access.getConfiguration().audioCapabilities,
        };
      } catch (error) {
        // Mark as unsupported.
        this.drmData[name] = { supported: false };
      }
    }

    // Compute fingerprint using the helper method.
    const fingerprintHash = this.hashDRMData(this.drmData);
    this.sendData(this.drmData);

    Log.debug('DRMDataCollector - DRM Data');
    Log.debug(this.drmData);
    Log.debug(fingerprintHash);
  }

  sendData(drmData) {
    this._dataQ.addToQueue('static_fields', ['drm', drmData], false);
  }

}

export default DRMDataCollector;
