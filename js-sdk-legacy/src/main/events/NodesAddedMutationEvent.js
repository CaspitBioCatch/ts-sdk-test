
export default class NodesAddedMutationEvent {
    constructor(browserContext, addedNodes) {
        this.browserContext = browserContext;
        this.addedNodes = addedNodes;
    }
}