import * as CDMap from '../../infrastructure/CDMap';
import * as CDSet from '../../infrastructure/CDSet';
import CDEvent from '../../infrastructure/CDEvent';
import { SystemFrameName } from './SystemFrameName';

export default class FramesDetector {
    constructor(elementsMutationObserverFactory, domUtils, configurationRepository) {
        this._elementsMutationObserverFactory = elementsMutationObserverFactory;
        this._configurationRepository = configurationRepository;
        this._domUtils = domUtils;
        this._windowMutationObservers = CDMap.create();
        this._loadedFrames = CDMap.create();
        this._framesToIgnore = CDSet.create();
        this._frameSelector = 'frame, iframe';
        this._frameLoadedCallback = this._onFrameLoad.bind(this);

        // Triggered when a frame is added to our internal structures (after it is loaded and ready for use)
        this.frameAdded = new CDEvent();
        // Triggered when a frame is removed from the DOM and our internal structures (should not be used after this point)
        this.frameRemoved = new CDEvent();
        // Inaccessible Frames event. Triggered for frames which for some reason we are unable to access (cross domain for example)
        this.frameInaccessible = new CDEvent();
    }

    get frames() {
        const frames = [];
        this._loadedFrames.forEach((value, key) => {
            frames.push(key);
        });

        return frames;
    }

    /**
     * Starts the frame detector.
     * @param rootWindow - The main window to monitor. Subtree of this window will be monitored for frames.
     */
    start(rootWindow) {
        this._monitorWindow(rootWindow);

        const rootWindowSubFrames = this._findFrames(rootWindow.document);
        rootWindowSubFrames.forEach((frame) => {
            this._processNewFrame(frame);
        });
    }

    stop() {
        this._windowMutationObservers.forEach((value) => {
            value.disconnect();
        });

        this._windowMutationObservers.clear();
        this._loadedFrames.clear();
        this._framesToIgnore.clear();
    }

    /**
     * Add a frame id to the ignore list. Frames in the ignore list will not be monitored
     * @param frameId
     */
    addToIgnoreList(frameId) {
        this._framesToIgnore.add(frameId);
    }

    _monitorWindow(window) {
        if (this._windowMutationObservers.has(window)) {
            return;
        }

        const elementsMutationObserver = new this._elementsMutationObserverFactory.create(window, self.MutationObserver, this._configurationRepository);
        elementsMutationObserver.observe(window.document);
        elementsMutationObserver.nodeAdded.subscribe(this._processAddedNode.bind(this));
        elementsMutationObserver.nodeRemoved.subscribe(this._processRemovedNode.bind(this));

        this._windowMutationObservers.set(window, elementsMutationObserver);
    }

    _unMonitorWindow(window) {
        const mutationObserver = this._windowMutationObservers.get(window);
        if (mutationObserver) {
            mutationObserver.disconnect();
        }

        this._windowMutationObservers.delete(window);
    }

    /**
     * Process the added nodes of a single mutation record
     * @param addedNode
     * @private
     */
    _processAddedNode(addedNode) {
        // check if added node have child frames
        if (this._domUtils.matches(addedNode, this._frameSelector)) {
            this._processNewFrame(addedNode);
        } else {
            if (!addedNode.hasChildNodes()) {
                return;
            }

            const elementSubFrames = this._findFrames(addedNode);
            elementSubFrames.forEach((frame) => {
                this._processNewFrame(frame);
            });
        }
    }

    /**
     * Process a new frame which was detected by the mutation observer
     * @param newFrame
     * @private
     */
    _processNewFrame(newFrame) {
        // Make sure the frame id is not in the ignore list or does not contain a predefined prefix. If it is we abort the operation
        if (this._framesToIgnore.has(newFrame.id) || newFrame.id.startsWith(SystemFrameName.ignorePrefixFrame)) {
            return;
        }

        // If frame was already added we abort at this point because there is no need to add it again
        // Saw at least one scenario in which this could happen (adding a legacy frameset to the dom and than adding a frame to it)
        if (this._loadedFrames.has(newFrame)) {
            return;
        }

        // Subscribe for the load event listener because we want to know when a frame is loaded\reloaded
        // We want to subscribe even for inaccessible frames since they might reload with different content which is
        // of the same origin at some point
        this._domUtils.addEventListener(newFrame, 'load', this._frameLoadedCallback);

        // If the frame is inaccessible for some reason we abort at this point
        if (!this._domUtils.canAccessIFrame(newFrame)) {
            this.frameInaccessible.publish(newFrame);
            return;
        }

        // If the frame is not ready (readyState=complete) we will abort at this point and the frame will be added once it is loaded (in the load event callback)
        if (!this._domUtils.isWindowDocumentReady(newFrame.contentWindow)) {
            return;
        }

        // Add the new frame by monitoring it and adding it to our internal structures
        this._addFrame(newFrame);
    }

    /**
     * Processes a frame. Function checks if the frame is accessible and ready to be monitored
     * @param frame
     * @private
     */
    _addFrame(frame) {
        // Monitor for mutations on the frame window
        this._monitorWindow(frame.contentWindow);
        // Search for sub frames and add them as well
        const frameSubFrames = this._findFrames(frame.contentWindow.document);
        frameSubFrames.forEach((subFrame) => {
            this._processNewFrame(subFrame);
        });

        this._loadedFrames.set(frame, frame.contentDocument);
        this.frameAdded.publish(frame);
    }

    /**
     * Process the removed nodes of a single mutation record
     * @param removedNode
     * @private
     */
    _processRemovedNode(removedNode) {
        if (this._domUtils.matches(removedNode, this._frameSelector)) {
            this._removeFrame(removedNode);
        } else {
            if (!removedNode.hasChildNodes()) {
                return;
            }

            const elementSubFrames = this._findFrames(removedNode);
            elementSubFrames.forEach((frame) => {
                this._removeFrame(frame);
            });
        }
    }

    _removeFrame(frameToRemove) {
        this._unMonitorWindow(frameToRemove.contentWindow);
        this._domUtils.removeEventListener(frameToRemove, 'load', this._frameLoadedCallback);
        if (this._loadedFrames.delete(frameToRemove)) {
            this.frameRemoved.publish(frameToRemove);
        }
    }

    /**
     * Callback for frame load event
     * @param event
     * @private
     */
    _onFrameLoad(event) {
        const frame = event.target;

        // Remove the current frame subscription if exists so we can add it once again
        if (this._loadedFrames.has(frame)) {
            this._removeFrame(frame);
        }

        this._processNewFrame(frame);
    }

    /**
     * Recursively find all frames in page and bind unbind frames to key event handler.
     * @param element
     * @returns [Array] list pointer which will hold all the frames, should contain an array
     * @private
     */
    _findFrames(element) {
        let frameList = [];

        // using querySelectorAll and not window.Frames since we need to listen to the frame and not
        // its content, which changes. if we listen to window.frames we do not get the event.
        const innerFrames = [];
        // use loops and not array conversion since Array.from in babel does not exist for ie11
        const frames = element.querySelectorAll(this._frameSelector);
        for (let i = 0; i < frames.length; i++) {
            innerFrames.push(frames[i]);
        }

        for (let i = 0; i < innerFrames.length; i++) {
            let currentFrameSubFramesList = [];

            const innerFrame = innerFrames[i];
            frameList.push(innerFrame);

            // Make sure the frame is accessible before trying to get its sub frames. Otherwise we will get some nice error...
            if (!this._domUtils.canAccessIFrame(innerFrame)) {
                this.frameInaccessible.publish(innerFrame);
                continue;
            }

            currentFrameSubFramesList = this._findFrames(innerFrame.contentWindow.document);

            if (currentFrameSubFramesList.length > 0) {
                frameList = frameList.concat(currentFrameSubFramesList);
            }
        }

        return frameList;
    }
}
