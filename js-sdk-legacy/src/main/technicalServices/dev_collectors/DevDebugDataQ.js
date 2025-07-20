import Log from '../log/Logger';

/**
 *
 * A DataQ wrapper designed to seamlessly encapsulate `client_debug_info` static collectors.
 *
 * This class allows debug-level features to queue their data for deferred, aggregated reporting,
 * while still supporting production-level static fields that should be sent immediately.
 *
 * Aggregation ensures that multiple debug-level features can report together,
 * without flooding the queue. The aggregation is flushed once per WUP cycle,
 * as registered via `_onPreSendToWorker`.
 *
 * ### Usage for debug-level features:
 * 1. Use this wrapper in place of the regular DataQ.
 * 2. Ensure the feature is defined in the `debugInfoCollectionLevels` configuration as `"debug"`.
 * 3. When the feature collects data, it should call `addToQueue` with:
 *    - name: `"static_fields"`
 *    - data: `[featureName, ...dataValues]`
 *    - addCtxId: typically `false`
 *    - isImmediateWup: as appropriate
 *
 * ### To promote a feature from 'debug' to 'prod':
 * - Change its collection level in `debugInfoCollectionLevels` from `"debug"` to `"prod"`.
 * - Move the feature to use the regular DataQ directly.
 * - Remove it from the debug-level config list (`debugInfoCollectionLevels`) in codebase JSON.
 *
 *
 * ### Important Note:
 * - Each feature is also controlled by its own independent feature-enablement (kill-switch) configuration.
 *   - For example, even if a feature is defined as `"debug"` in `debugInfoCollectionLevels`,
 *     it will only collect data if its `enableXFeature` flag is also turned on.
 * - This class **only** acts on the result of collectors that already decided to run.
 *   It does not control whether features are enabled or not.
 */
export class DevDebugDataQ {

  constructor(configurationRepository, dataQ) {
    this._configurationRepository = configurationRepository;
    this._dataQ = dataQ;
    this._aggregatedDebugInfoData = {};

    // Convenient states used for tracking if new data added to aggregatedDebugInfoData object since the last time DataQ was sent to server.
    // This prevents duplication of client_debug_info fields on the same wup.
    this._changeId = -1;
    this._flushId = -1;
    this._dataQ.registerOnPreSendToWorker(this._onPreSendToWorker.bind(this));

    this.defaultCollectionLevels = {
      emuid: 'debug',
      
      // TODO: add here every new static_feature should be reported as client_debug_info field.
      storage_directory: 'debug',
      screen_high_res: 'debug',

      adblock_lists: 'debug',
      webgl: 'debug',
      drm: 'debug',
      speech_voices: 'debug',
      
      font_emoji_info: 'debug',
      font_math_info: 'debug',
      font_width_info: 'debug',

      navigator_pdfViewerEnabled: 'debug',
      navigator_webdriver: 'debug',
      navigator_userAgentData: 'debug',
      navigator_appVersion: 'debug',
      navigator_platform: 'debug',
      navigator_vendor: 'debug',
      navigator_productSub: 'debug',
      navigator_vendorSub: 'debug',
      navigator_onLine: 'debug',
      navigator_getHighEntropyValues: 'debug',
      navigator_prototype: 'debug',
    };

    /**
     * A set static_fields features should never be promoted to production.
     * features appears on this list - will be considered as collectionLevel debug, regardless
     * any configuration specified at debugInfoCollectionLevels configuration.
     */
    this._fixedDebugFeatures = [
      /**
       * Once emuid will mature - it will replace entirely the existing muid.
       * muid used in several places besides static_field collection.
       * Therefore, Emuid cannot be promoted to production as standalone static field.
       */
      'emuid'
    ];
  }

  addToQueue(name, data, addCtxId, isImmediateWup) {
    let devDebugCollectionLevels = this._resolveDebugInfoCollectionLevels();

    const feature = data[0];

    const collectionLevel =
      this._fixedDebugFeatures.includes(feature) ? 'debug' : devDebugCollectionLevels[feature];

    if (collectionLevel === 'debug') {
      // Aggregate debug data by feature
      this._aggregatedDebugInfoData[feature] = data.slice(1); // omit feature name from data array
      this._changeId++;
    } else if (collectionLevel === 'prod') {
      // Forward directly to the queue for production-level features
      this._dataQ.addToQueue(name, data, addCtxId, isImmediateWup);
    } else {
      // If collectionLevel is 'none' or unrecognized, the feature is ignored
      Log.warn(`Received collectionLevel = ${collectionLevel} for ${feature}`);
    }
  }

  _onPreSendToWorker() {
    if (this._changeId === this._flushId)  {
      // No change since last time client_debug_info sent to the DataQ.
      return;
    }

    // Don't add to queue and empty client_debug_info object when there is no data.
    if (Object.keys(this._aggregatedDebugInfoData).length === 0) return;

    this._appendAggregatedDebugInfoDataToQueue();

    this._flushId = this._changeId;
  }

  /**
   * Sends all aggregated `client_debug_info` fields to the queue at once.
   *
   * This is triggered before the DataQ flushes, but only if new debug fields were added.
   *
   * IMPORTANT:
   * - All aggregated data is kept in memory and re-sent in *every* future WUP where a new feature is added.
   * - This is required because the server-side logic *overwrites* existing static fields rather than merging them.
   * - Therefore, we must always send the full `client_debug_info` object (including previously-sent values)
   *   to preserve the complete state.
   *
   * It ensures that:
   * - A single 'client_debug_info' static_field entry is sent per WUP.
   * - Features are not sent partially (which would be lost on the server).
   */
  _appendAggregatedDebugInfoDataToQueue() {

    // Pass a clone, to prevent usage of the same instance list within the dataQ
    const aggregatedDataClone = JSON.parse(JSON.stringify(this._aggregatedDebugInfoData));
    this._dataQ.appendData('static_fields', ['client_debug_info', aggregatedDataClone]);
  }

  /**
   * Returns a debugInfoCollectionLevels json from remote configuration or local fallback.
   *
   * The result object will be in same structure as this.defaultCollectionLevels:
   * Each key is feature name,
   * Each value - 'prod' / 'debug' / 'none'
   *
   * For example:
   * {
   *   featureX: 'debug',
   *   featureY: 'none',
   *   featureZ : 'prod',
   * }
   */
  _resolveDebugInfoCollectionLevels() {
    let remoteConfigValue = this._configurationRepository.get('debugInfoCollectionLevels');
    if (remoteConfigValue) {
      try {
        /**
         * The server returns the configuration as string, so it needs to be parsed to object.
         */
        return JSON.parse(remoteConfigValue);
      } catch (e) {
        Log.error('Invalid debugInfoCollectionLevels config, falling back to defaults', e);
        return this.defaultCollectionLevels;
      }
    } else {
      return this.defaultCollectionLevels;
    }
  }
}