import { assert } from 'chai';
import sinon from 'sinon';
import WebRTCDataCollector from '../../../../../src/main/collectors/static/WebRTCDataCollector';

describe('WebRTCDataCollector', () => {
  let sandbox;
  let dataQ;
  let webRTCDataCollector;
  let originalRTCPeerConnection;
  let fakePeer;
  let originalSetTimeout;
  let originalClearTimeout;

  before(() => {
    originalRTCPeerConnection = global.RTCPeerConnection;
    originalSetTimeout = global.setTimeout;
    originalClearTimeout = global.clearTimeout;
  });

  after(() => {
    global.RTCPeerConnection = originalRTCPeerConnection;
    global.setTimeout = originalSetTimeout;
    global.clearTimeout = originalClearTimeout;
  });

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    dataQ = { addToQueue: sandbox.stub() };

    // Create a fake peer connection with stubbed methods and event handler placeholders.
    fakePeer = {
      createDataChannel: sandbox.stub(),
      createOffer: sandbox.stub().resolves({ type: 'offer', sdp: 'fake_offer' }),
      setLocalDescription: sandbox.stub().resolves(),
      onicecandidate: null,
      onicecandidateerror: null,
      onicegatheringstatechange: null,
      iceGatheringState: 'gathering',
      close: sandbox.stub(),
    };

    // Override the global RTCPeerConnection with our fake implementation.
    global.RTCPeerConnection = function(config) {
      fakePeer.config = config;
      return fakePeer;
    };

    webRTCDataCollector = new WebRTCDataCollector(dataQ);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('getDefaultSettings', () => {
    it('should return default settings with correct configKey', () => {
      const settings = WebRTCDataCollector.getDefaultSettings();
      assert.isObject(settings, 'Expected settings to be an object');
      assert.equal(settings.configKey, 'isWebRTCFeature', 'Expected configKey to be "isWebRTCFeature"');
    });
  });

  describe('startFeature', () => {
    it('should initialize RTCPeerConnection, collect ICE candidates, and send data when gathering completes', async () => {
      // Prepare two candidates
      const candidate1 = {
        address: '1.2.3.4',
        port: 1234,
        tcpType: 'tcp',
        type: 'host',
        protocol: 'udp',
        url: 'stun:example.com',
        relatedAddress: '0.0.0.0',
        relatedPort: 0,
        candidate: 'candidate:1234567890 1 udp 2122260223 1.2.3.4 1234 typ host',
        sdpMid: '0',
        sdpMLineIndex: 0,
      };

      const candidate2 = {
        address: '5.6.7.8',
        port: 5678,
        tcpType: 'udp',
        type: 'srflx',
        protocol: 'udp',
        url: 'stun:another.com',
        relatedAddress: '0.0.0.0',
        relatedPort: 0,
        candidate: 'candidate:1234567890 1 udp 1686052607 5.6.7.8 5678 typ srflx',
        sdpMid: '0',
        sdpMLineIndex: 0,
      };

      const startPromise = webRTCDataCollector.startFeature();

      // Simulate ICE candidate events.
      if (fakePeer.onicecandidate) {
        fakePeer.onicecandidate({ candidate: candidate1 });
        fakePeer.onicecandidate({ candidate: candidate2 });
        // Simulate gathering complete with null candidate
        fakePeer.onicecandidate({ candidate: null });
      }

      await startPromise;

      // Verify that RTCPeerConnection methods were called.
      sinon.assert.calledOnce(fakePeer.createDataChannel);
      sinon.assert.calledOnce(fakePeer.createOffer);
      sinon.assert.calledOnce(fakePeer.setLocalDescription);

      // Verify that addToQueue is called once with the candidates.
      sinon.assert.calledOnce(dataQ.addToQueue);
      sinon.assert.calledWith(dataQ.addToQueue, 'static_fields', ['webrtc', sinon.match.array]);
      
      // Verify that the candidates were added to the queue.
      const queuedCandidates = dataQ.addToQueue.getCall(0).args[1][1];
      assert.isArray(queuedCandidates, 'Candidates should be sent as an array');
      assert.lengthOf(queuedCandidates, 2, 'Array should contain 2 candidates');
      
      // Verify that the correct candidate addresses are present.
      const addresses = queuedCandidates.map(c => c.address);
      assert.include(addresses, candidate1.address);
      assert.include(addresses, candidate2.address);
      
      // Verify that cleanup was called
      assert.isNull(webRTCDataCollector.peer, 'Peer should be null after cleanup');
      assert.isNull(webRTCDataCollector.timeoutId, 'Timeout ID should be null after cleanup');
    });

    it('should handle ICE candidate error event and continue gathering', async () => {
      // Prepare a candidate
      const candidate = {
        address: '1.2.3.4',
        port: 1234,
        tcpType: 'tcp',
        type: 'host',
        protocol: 'udp',
        url: 'stun:example.com',
        relatedAddress: '0.0.0.0',
        relatedPort: 0,
        candidate: 'candidate:1234567890 1 udp 2122260223 1.2.3.4 1234 typ host',
        sdpMid: '0',
        sdpMLineIndex: 0,
      };

      const startPromise = webRTCDataCollector.startFeature();

      // Simulate an ICE candidate error event.
      const errorEvent = { errorText: 'Test ICE error', errorCode: 701 };
      if (fakePeer.onicecandidateerror) {
        fakePeer.onicecandidateerror(errorEvent);
      }

      // Simulate ICE candidate event.
      if (fakePeer.onicecandidate) {
        fakePeer.onicecandidate({ candidate: candidate });
        // Simulate gathering complete with null candidate
        fakePeer.onicecandidate({ candidate: null });
      }

      await startPromise;

      // Verify that addToQueue is called with the candidate.
      sinon.assert.calledOnce(dataQ.addToQueue);
      const queuedCandidates = dataQ.addToQueue.getCall(0).args[1][1];
      assert.isArray(queuedCandidates, 'Candidates should be sent as an array');
      assert.lengthOf(queuedCandidates, 1, 'Array should contain 1 candidate');
      assert.equal(queuedCandidates[0].address, candidate.address);
    });

    it('should handle error during WebRTC initialization and send empty array', async () => {
      // Force createOffer to reject to simulate an initialization error.
      const errorMsg = 'Fake createOffer error';
      fakePeer.createOffer.rejects(new Error(errorMsg));

      await webRTCDataCollector.startFeature();

      // In case of error, an empty array should be queued.
      sinon.assert.calledOnce(dataQ.addToQueue);
      sinon.assert.calledWith(dataQ.addToQueue, 'static_fields', ['webrtc', []]);
    });
    
    it('should handle timeout and send whatever candidates were gathered', async () => {
      // Prepare a candidate
      const candidate = {
        address: '1.2.3.4',
        port: 1234,
        tcpType: 'tcp',
        type: 'host',
        protocol: 'udp',
        url: 'stun:example.com',
        relatedAddress: '0.0.0.0',
        relatedPort: 0,
        candidate: 'candidate:1234567890 1 udp 2122260223 1.2.3.4 1234 typ host',
        sdpMid: '0',
        sdpMLineIndex: 0,
      };

      // Mock setTimeout to immediately call the callback
      const timeoutCallbacks = [];
      global.setTimeout = (callback, delay) => {
        timeoutCallbacks.push(callback);
        return 123; // Return a fake timeout ID
      };
      
      global.clearTimeout = sandbox.stub();

      const startPromise = webRTCDataCollector.startFeature();

      // Simulate ICE candidate event.
      if (fakePeer.onicecandidate) {
        fakePeer.onicecandidate({ candidate: candidate });
      }

      // Manually trigger the timeout callback
      if (timeoutCallbacks.length > 0) {
        timeoutCallbacks[0]();
      }

      await startPromise;

      // Verify that addToQueue is called with the candidate.
      sinon.assert.calledOnce(dataQ.addToQueue);
      const queuedCandidates = dataQ.addToQueue.getCall(0).args[1][1];
      assert.isArray(queuedCandidates, 'Candidates should be sent as an array');
      assert.lengthOf(queuedCandidates, 1, 'Array should contain 1 candidate');
      assert.equal(queuedCandidates[0].address, candidate.address);
    });
  });
});
