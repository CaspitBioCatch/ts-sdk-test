import AudioDetectFeature from '../../../../../src/main/collectors/static/AudioDetectFeature';
import DataQ from "../../../../../src/main/technicalServices/DataQ";
import Log from "../../../../../src/main/technicalServices/log/Logger";
import sinon from "sinon";
import {assert} from "chai";
import AudioDetectContract from "../../../../../src/main/contract/staticContracts/AudioDetectContract";

describe('AudioDetectFeature additional tests:', function () {

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
        this.dataQ = this.sandbox.createStubInstance(DataQ);
        this.logErrorStub = this.sandbox.stub(Log, 'error');
        this.logInfoStub = this.sandbox.stub(Log, 'info');
        this.utils = {digest_sha256: this.sandbox.stub().resolves('hashedAudioData')};
        this.audioDetectFeature = new AudioDetectFeature(this.dataQ, this.utils);
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    it('should log info when _collectAudioFingerprintInfo starts', async function () {
        const audioData = "mockAudioData";
        this.sandbox.stub(this.audioDetectFeature, '_getAudioFingerprint').resolves(audioData);

        await this.audioDetectFeature._collectAudioFingerprintInfo();

        assert.isTrue(this.logInfoStub.calledWith("Collecting audio properties"));
    });

    it('should call digest_sha256 with audio data in _collectAudioFingerprintInfo', async function () {
        const audioData = "mockAudioData";
        this.sandbox.stub(this.audioDetectFeature, '_getAudioFingerprint').resolves(audioData);

        await this.audioDetectFeature._collectAudioFingerprintInfo();

        assert.isTrue(this.utils.digest_sha256.calledWith(audioData));
    });

    it('should throw an error if AudioContext is not supported in _getAudioFingerprint', async function () {
        this.sandbox.stub(window, 'OfflineAudioContext').value(undefined);

        try {
            await this.audioDetectFeature._getAudioFingerprint();
        } catch (error) {
            assert.instanceOf(error, Error);
            assert.equal(error.message, "AudioContext is not supported");
            assert.isTrue(this.logErrorStub.calledWithMatch("Error initializing audio fingerprint"));
        }
    });

    it('should add to data queue only if _getAudioFingerprint resolves with data', async function () {
        const audioData = "mockAudioData";
        const contractData = "contractAudioData";

        this.sandbox.stub(this.audioDetectFeature, '_getAudioFingerprint').resolves(audioData);
        this.utils.digest_sha256.resolves("hashedAudioData");
        this.sandbox.stub(AudioDetectContract.prototype, 'buildQueueMessage').returns(contractData);

        await this.audioDetectFeature._collectAudioFingerprintInfo();

        assert.isFalse(this.dataQ.addToQueue.calledOnceWith('static_fields', contractData, false));
    });

    it('should resolve with a string from _getAudioFingerprint', async function () {
        const mockFingerprint = "audioFingerprintString";
        this.sandbox.stub(this.audioDetectFeature, '_renderAudio').resolves({
            getChannelData: () => {
                return {
                    subarray: () => {
                        return mockFingerprint
                    }
                }
            }
        });

        const result = await this.audioDetectFeature._getAudioFingerprint();

        assert.equal(result, mockFingerprint);
    });

    it('should not add to data queue if hashing fails in _collectAudioFingerprintInfo', async function () {
        this.sandbox.stub(this.audioDetectFeature, '_getAudioFingerprint').resolves("audioData");
        this.utils.digest_sha256.rejects(new Error("Hashing failed"));

        await this.audioDetectFeature._collectAudioFingerprintInfo();

        assert.isFalse(this.dataQ.addToQueue.called);
    });

    it('should handle unexpected error during startFeature gracefully', function () {
        const errorMessage = "Unexpected error";
        this.sandbox.stub(this.audioDetectFeature, '_collectAudioFingerprintInfo').throws(new Error(errorMessage));

        this.audioDetectFeature.startFeature();
        assert.isTrue(this.logErrorStub.calledWithMatch(`Error`));
    });

    describe('_renderAudio', function () {
        let contextMock;

        beforeEach(function () {
            contextMock = {
                startRendering: this.sandbox.stub(),
                state: 'running',
            };
        });

        it('should resolve successfully when context.state is "running"', async function () {
            contextMock.startRendering.resolves('mockAudioBuffer');
            const result = await this.audioDetectFeature._renderAudio(contextMock);
            assert.equal(result, 'mockAudioBuffer');
        });

        it('should retry and resolve if context.state is "suspended" initially', async function () {
            contextMock.state = 'suspended';
            let callCount = 0;

            contextMock.startRendering.callsFake(() => {
                if (++callCount === 3) {
                    contextMock.state = 'running';
                    return Promise.resolve('mockAudioBuffer');
                }
                return Promise.resolve();
            });

            const result = await this.audioDetectFeature._renderAudio(contextMock);
            assert.equal(result, 'mockAudioBuffer');
            assert.equal(callCount, 3);
        });

        it('should retry and reject if context.state remains "suspended" after retries', async function () {
            contextMock.state = 'suspended';

            try {
                await this.audioDetectFeature._renderAudio(contextMock);
                assert.fail('Expected promise to be rejected');
            } catch (error) {
                assert.instanceOf(error, Error);
                assert.equal(error.message, 'Audio context suspended');
            }
        });


        it('should reject on error during rendering', async function () {
            const mockError = new Error('Rendering failed');
            contextMock.startRendering.rejects(mockError);

            try {
                await this.audioDetectFeature._renderAudio(contextMock);
                assert.fail('Expected promise to be rejected');
            } catch (error) {
                assert.equal(error.message, 'Rendering failed');
            }
        });
    });

});
