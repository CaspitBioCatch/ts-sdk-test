import DataCollector from '../DataCollector';
import { x64hash128 } from "../../technicalServices/Hash";
import Log from '../../technicalServices/log/Logger';

const featureSettings = {
  configKey: 'isSpeechVoicesFeature',
  isDefault: false,
  shouldRunPerContext: false,
  shouldRunPerSession: true,
  shouldRun: false,
  isFrameRelated: false,
  runInUns: false,
  runInSlave: true,
  runInLean: false,
  isRunning: false,
  instance: null,
};

/**
 * Uses speechSynthesis to collect and hash available voices, then stores the data.
 * 
 * speechSynthesis is a Web Speech API interface that enables text-to-speech (TTS) functionality.
 * Voices represent different speech synthesis options, including language, gender, and voice provider.
 */
class SpeechVoiceCollector extends DataCollector {

  static getDefaultSettings() {
    return featureSettings;
  }

  /**
   * @constructor
   * @param {Object} dataQ - The data queue instance for storing collected data.
   */
  constructor(dataQ) {
    super();
    this._dataQ = dataQ;
  }

  /**
   * Initializes the feature by listening for voice changes and collecting data.
   */
  startFeature() {
    speechSynthesis.addEventListener("voiceschanged", this.processVoices.bind(this));
    if (!speechSynthesis.pending) this.processVoices();
  }

  /**
   * Processes available speech synthesis voices, generates a hash, and adds it to the queue.
   */
  processVoices() {
    const voices = speechSynthesis.getVoices().map(({ default: def, lang, localService, name, voiceURI }) =>
      ({ def, lang, localService, name, voiceURI })
    );
    if (voices.length === 0) return;

    const hash = x64hash128(JSON.stringify(voices));
    Log.debug('SpeechVoices - Voice hash:' + hash);
    this._dataQ.addToQueue('static_fields', ['speech_voices', hash], false);
  }

}

export default SpeechVoiceCollector;
