
export default class NodesRemovedMutationEvent {
    constructor(browserContext, removedNodes) {
        this.browserContext = browserContext;
        this.removedNodes = removedNodes;
    }
}