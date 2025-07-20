import DataCollector from '../DataCollector';
import { x64hash128 } from "../../technicalServices/Hash";
import Log from '../../technicalServices/log/Logger';

class WebRTCDataCollector extends DataCollector {
  static getDefaultSettings() {
    return {
      configKey: 'isWebRTCFeature',
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
  }

  constructor(dataQ) {
    super();
    this._dataQ = dataQ;
    this.peer = null;
    this.timeoutId = null;
  }

  async startFeature() {
    Log.info("Starting WebRTCDataCollector");
    
    try {
      const candidates = await this.gatherIceCandidates();
      this.sendData(candidates);
    } catch (error) {
      Log.error("WebRTCDataCollector failed:", error);
      this.sendData([]);
    } finally {
      this.cleanup();
    }
  }

  async gatherIceCandidates() {
    return new Promise((resolve) => {
      const candidates = [];
      let isGatheringComplete = false;
      
      this.peer = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stunserver.stunprotocol.org" },
          { urls: "stun:stun.l.google.com:19302" },
        ],
      });

      // ICE candidate event handler
      this.peer.onicecandidate = (event) => {
        if (event.candidate) {
          const x = event.candidate;
          candidates.push({
            address: String(x.address),
            port: String(x.port),
            tcpType: String(x.tcpType),
            type: String(x.type),
            protocol: String(x.protocol),
            url: String(x.url),
            relatedAddress: String(x.relatedAddress),
            relatedPort: String(x.relatedPort),
            candidate: String(x.candidate),
            sdpMid: String(x.sdpMid),
            sdpMLineIndex: String(x.sdpMLineIndex),
          });
          Log.debug(`ICE candidate found: ${x.type} ${x.protocol} ${x.address}:${x.port}`);
        } else {
          Log.debug("ICE candidate gathering complete - no more candidates");
          isGatheringComplete = true;
          resolve(candidates);
        }
      };

      // ICE candidate error
      this.peer.onicecandidateerror = (ev) => {
        Log.warn("ICE candidate error:", ev.errorText, ev.errorCode);
        // Continue gathering despite errors
      };

      // ICE gathering state changes
      this.peer.onicegatheringstatechange = () => {
        Log.debug("ICE gathering state changed:", this.peer?.iceGatheringState);
        if (this.peer?.iceGatheringState === "complete") {
          isGatheringComplete = true;
          resolve(candidates);
        }
      };

      // Fallback timeout
      this.timeoutId = setTimeout(() => {
        if (!isGatheringComplete) {
          Log.warn("ICE candidate gathering timed out after 900ms");
          resolve(candidates);
        }
      }, 900);

      // Create a data channel and offer to trigger ICE gathering
      this.peer.createDataChannel("data");
      this.peer.createOffer()
        .then(offer => this.peer.setLocalDescription(offer))
        .catch(error => {
          Log.error("Error creating offer:", error);
          resolve(candidates); // Resolve with whatever candidates we have
        });
    });
  }

  cleanup() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    if (this.peer) {
      try {
        this.peer.close();
        Log.debug("WebRTC peer connection closed");
      } catch (error) {
        Log.warn("Error closing peer connection:", error);
      }
      this.peer = null;
    }
  }

  sendData(candidates) {
    Log.info(`Sending ${candidates.length} ICE candidates`);
    this._dataQ.addToQueue('static_fields', ['webrtc', candidates], false);
  }
}

export default WebRTCDataCollector;
