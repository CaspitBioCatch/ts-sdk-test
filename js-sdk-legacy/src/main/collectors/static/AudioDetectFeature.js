import DataCollector from "../DataCollector";
import Log from "../../technicalServices/log/Logger";
import AudioDetectContract from "../../contract/staticContracts/AudioDetectContract";

const featureSettings = {
    configKey: 'isAudioDetectFeature',
    isDefault: false,
    shouldRunPerContext: false,
    shouldRunPerSession: false,
    shouldRun: true,
    isFrameRelated: false,
    runInUns: false,
    runInSlave: true,
    runInLean: true,
    isRunning: false,
    instance: null,
};

const audioConfig = {
    channelCount: 1,
    length: 5000,
    sampleRate: 44100,
    oscillatorType: 'triangle',
    oscillatorFrequency: 10000,
    compressor: {
        threshold: -50,
        knee: 40,
        ratio: 12,
        attack: 0,
        release: 0.25,
    },
    renderRetryDelay: 500,
    maxRetries: 3,
    fingerprintDataOffset: 4500,
};

export default class AudioDetectFeature extends DataCollector {
    static getDefaultSettings() {
        return featureSettings;
    }

    /**
     * @param {DataQueue} dataQ
     * @param {Utils} CDUtils
     */
    constructor(dataQ, utils) {
        super();
        this._dataQ = dataQ;
        this._utils = utils;
    }

    startFeature() {
        Log.info("Starting Audio Detection Feature");
        try {
            this._collectAudioFingerprintInfo();
        } catch (error) {
            Log.error(`Failed to collect audio information: ${error}`);
        }
    }

    _collectAudioFingerprintInfo() {
        Log.info('Collecting audio properties');
        this._getAudioFingerprint()
            .then((audioData) => {
                return this._utils.digest_sha256(audioData);
            })
            .then((hash) => {
                const audioContract = new AudioDetectContract(hash);
                const contractData = audioContract.buildQueueMessage();
                this._dataQ.addToQueue('static_fields', contractData, false);
                Log.info('Audio properties collected successfully');
            }).catch((error) => {
            Log.error(`Error collecting audio information: ${error}`);
        });
    }

    /**
     * Generates a unique audio fingerprint by synthesizing audio data in an OfflineAudioContext.
     * This process does not produce any audible sound but captures unique device characteristics
     * through oscillator and compressor settings. The resulting fingerprint is a string representation
     * of channel data, offering a unique identifier based on the device's audio capabilities.
     *
     * @returns {Promise<string>} - Resolves with the audio fingerprint string.
     * @throws Error if the AudioContext initialization or rendering fails.
     */
    async _getAudioFingerprint() {
        try {
            const AudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
            if (!AudioContext) {
                throw new Error("AudioContext is not supported");
            }

            const context = new AudioContext(
                audioConfig.channelCount,
                audioConfig.length,
                audioConfig.sampleRate
            );

            const oscillator = context.createOscillator();
            const compressor = context.createDynamicsCompressor();

            oscillator.type = audioConfig.oscillatorType;
            oscillator.frequency.value = audioConfig.oscillatorFrequency;

            compressor.threshold.value = audioConfig.compressor.threshold;
            compressor.knee.value = audioConfig.compressor.knee;
            compressor.ratio.value = audioConfig.compressor.ratio;
            compressor.attack.value = audioConfig.compressor.attack;
            compressor.release.value = audioConfig.compressor.release;

            oscillator.connect(compressor);
            compressor.connect(context.destination);
            oscillator.start(0);

            return this._renderAudio(context)
                .then((buffer) => {
                    return buffer.getChannelData(0)
                        .subarray(audioConfig.fingerprintDataOffset)
                        .toString();
                });
        } catch (error) {
            Log.error(`Error initializing audio fingerprint: ${error}`);
            throw error;
        }
    }

    _renderAudio(context) {
        const { renderRetryDelay, maxRetries } = audioConfig;
        let retryCount = 0;

        return new Promise((resolve, reject) => {
            const attemptRender = () => {
                try {
                    const renderingPromise = context.startRendering();
                    if (context.state === 'running') {
                        resolve(renderingPromise);
                    } else if (context.state === 'suspended' && !document.hidden) {
                        if (++retryCount < maxRetries) {
                            setTimeout(attemptRender, renderRetryDelay);
                        } else {
                            reject(new Error('Audio context suspended'));
                        }
                    }
                } catch (error) {
                    reject(error);
                }
            };
            attemptRender();
        });
    }
}
