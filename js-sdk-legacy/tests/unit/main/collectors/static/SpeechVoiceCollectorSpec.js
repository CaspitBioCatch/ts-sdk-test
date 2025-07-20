import { assert } from 'chai';
import sinon from 'sinon';
import SpeechVoiceCollector from '../../../../../src/main/collectors/static/SpeechVoiceCollector';

describe('SpeechVoiceCollector', () => {
    let sandbox;
    let dataQ;
    let speechVoiceCollector;
    let originalSpeechSynthesis;

    before(() => {
        originalSpeechSynthesis = global.speechSynthesis;
        
        Object.defineProperty(global, 'speechSynthesis', {
            configurable: true,
            writable: true,
            value: {
                addEventListener: sinon.stub(),
                getVoices: sinon.stub(),
                pending: false,
            }
        });
    });
    
    after(() => {
        Object.defineProperty(global, 'speechSynthesis', {
            configurable: true,
            writable: true,
            value: originalSpeechSynthesis
        });
    });

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        dataQ = { addToQueue: sandbox.stub() };
        speechVoiceCollector = new SpeechVoiceCollector(dataQ);
    });

    afterEach(() => {
        sandbox.restore();
        global.speechSynthesis.getVoices.reset();
        global.speechSynthesis.addEventListener.reset();
        global.speechSynthesis.pending = false;
    });

    describe('getDefaultSettings', () => {
        it('should return the default settings', () => {
            const settings = SpeechVoiceCollector.getDefaultSettings();
            assert.isObject(settings, 'Expected settings to be an object');
            assert.equal(settings.configKey, 'isSpeechVoicesFeature', 'Expected configKey to be "isSpeechVoicesFeature"');
        });
    });

    describe('startFeature', () => {
        it('should register voiceschanged event and process voices immediately when pending is false and voices are available', () => {
            const fakeVoices = [{
                default: true,
                lang: 'en-US',
                localService: false,
                name: 'Test Voice',
                voiceURI: 'test_voice'
            }];
            global.speechSynthesis.getVoices.returns(fakeVoices);
            global.speechSynthesis.pending = false;

            speechVoiceCollector.startFeature();

            sinon.assert.calledWith(global.speechSynthesis.addEventListener, 'voiceschanged', sinon.match.func);
            sinon.assert.calledOnce(dataQ.addToQueue);
            sinon.assert.calledWith(dataQ.addToQueue, 'static_fields', ['speech_voices', sinon.match.string]);
        });

        it('should register voiceschanged event and not queue data when no voices are available', () => {
            global.speechSynthesis.getVoices.returns([]);
            global.speechSynthesis.pending = false;

            speechVoiceCollector.startFeature();

            sinon.assert.calledWith(global.speechSynthesis.addEventListener, 'voiceschanged', sinon.match.func);
            sinon.assert.notCalled(dataQ.addToQueue);
        });
    });

    describe('processVoices', () => {
        it('should process available voices and add to queue', () => {
            const fakeVoices = [{
                default: false,
                lang: 'en-GB',
                localService: true,
                name: 'Fake Voice',
                voiceURI: 'fake_voice'
            }];
            global.speechSynthesis.getVoices.returns(fakeVoices);

            speechVoiceCollector.processVoices();

            sinon.assert.calledWith(dataQ.addToQueue, 'static_fields', ['speech_voices', sinon.match.string]);
        });

        it('should not add to queue if no voices are available', () => {
            global.speechSynthesis.getVoices.returns([]);

            speechVoiceCollector.processVoices();

            sinon.assert.notCalled(dataQ.addToQueue);
        });
    });
});
