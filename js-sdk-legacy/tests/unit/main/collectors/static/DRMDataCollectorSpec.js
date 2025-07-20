import { assert } from 'chai';
import sinon from 'sinon';
import DRMDataCollector from '../../../../../src/main/collectors/static/DRMDataCollector';

describe('DRMDataCollector', () => {
    let sandbox;
    let dataQ;
    let drmDataCollector;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        // Mock dataQ
        dataQ = { addToQueue: sandbox.stub() };

        // Create DRMDataCollector instance
        drmDataCollector = new DRMDataCollector(dataQ);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('getDefaultSettings', () => {
        it('should return the default settings', () => {
            const settings = DRMDataCollector.getDefaultSettings();
            assert.isObject(settings, 'Expected settings to be an object');
            assert.equal(settings.configKey, 'isDRMFeature', 'Expected configKey to be "isDRMFeature"');
        });
    });

    describe('startFeature', () => {
        let requestStub;

        beforeEach(() => {
            requestStub = sandbox.stub(navigator, 'requestMediaKeySystemAccess');
        });

        afterEach(() => {
            requestStub.restore();
        });

        it('should detect supported DRM systems and queue data', async () => {
            // Simulate successful DRM detection
            requestStub.resolves({
                getConfiguration: () => ({
                    sessionTypes: ['temporary'],
                    videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.42E01E"' }],
                    audioCapabilities: [{ contentType: 'audio/mp4; codecs="mp4a.40.2"' }],
                }),
            });

            await drmDataCollector.startFeature();

            // Ensure requestMediaKeySystemAccess was called for each DRM
            sinon.assert.calledWith(requestStub, "com.widevine.alpha", sinon.match.array);
            sinon.assert.calledWith(requestStub, "com.microsoft.playready", sinon.match.array);
            sinon.assert.calledWith(requestStub, "com.apple.fairplay", sinon.match.array);
            sinon.assert.calledWith(requestStub, "org.w3.clearkey", sinon.match.array);

            // Ensure dataQ.addToQueue was called with the correct arguments
            sinon.assert.calledOnce(dataQ.addToQueue);
            sinon.assert.calledWith(dataQ.addToQueue, 'static_fields', ['drm', sinon.match.object]);
        });

        it('should handle unsupported DRM systems gracefully', async () => {
            // Simulate rejection for unsupported DRM
            requestStub.rejects(new Error('Unsupported DRM'));

            await drmDataCollector.startFeature();

            // Ensure dataQ.addToQueue is still called (even if no DRM is supported)
            sinon.assert.calledOnce(dataQ.addToQueue);
            
            // Check that unsupported DRMs are correctly marked
            const queuedData = dataQ.addToQueue.getCall(0).args[1][1];
            assert.property(queuedData, 'widevine');
            assert.property(queuedData, 'playready');
            assert.property(queuedData, 'fairplay');
            assert.property(queuedData, 'clearkey');
            
            assert.equal(queuedData.widevine.supported, false);
            assert.equal(queuedData.playready.supported, false);
            assert.equal(queuedData.fairplay.supported, false);
            assert.equal(queuedData.clearkey.supported, false);
        });

        it('should hash the DRM data correctly', async () => {
            // Stub the hashing function so we can check its usage
            const hashStub = sandbox.stub(drmDataCollector, 'hashDRMData').returns('mocked_hash');

            requestStub.resolves({
                getConfiguration: () => ({
                    sessionTypes: ['temporary'],
                    videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.42E01E"' }],
                    audioCapabilities: [{ contentType: 'audio/mp4; codecs="mp4a.40.2"' }],
                }),
            });

            await drmDataCollector.startFeature();

            // Verify that hashDRMData was called with the drmData object
            sinon.assert.calledOnce(hashStub);
            sinon.assert.calledWith(hashStub, sinon.match.object);
        });
    });
});
