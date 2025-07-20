import CDEvent from '../../infrastructure/CDEvent';
import * as CDSet from '../../infrastructure/CDSet';
import NodesRemovedMutationEvent from '../../events/NodesRemovedMutationEvent';
import NodesAddedMutationEvent from '../../events/NodesAddedMutationEvent';
import { ConfigurationFields } from '../configuration/ConfigurationFields';

export default class ElementsMutationObserver {
    ignoreNodeTypes = CDSet.create([Node.COMMENT_NODE, Node.TEXT_NODE, Node.ATTRIBUTE_NODE, Node.CDATA_SECTION_NODE]);

    constructor(context, mutationObserver, configurationRepository) {
        this._mutationObserver = new mutationObserver(this._mutationObserved.bind(this, context));
        this.nodesAdded = new CDEvent();
        this.nodesRemoved = new CDEvent();
        this.nodeAdded = new CDEvent();
        this.nodeRemoved = new CDEvent();
        this._configurationRepository = configurationRepository;

        // Mutation queue to process in idle time
        this.mutationQueue = [];
        this.processingQueue = false;
    }

    observe(document) {
        this._mutationObserver.observe(document, {
            childList: true,
            subtree: true,
        });
    }

    disconnect() {
        this._mutationObserver.disconnect();
    }

    /**
     * Callback once a mutation\s is observed
     */
    _mutationObserved(context, mutations) {
        const chunkSize = this._configurationRepository?.get(ConfigurationFields.mutationMaxChunkSize) || 0;
        const chunkDelayMs = this._configurationRepository?.get(ConfigurationFields.mutationChunkDelayMs) || 100;
        // Filter only element node mutations
        const filteredMutations = mutations.filter(mutation => {
            if (mutation.type === 'childList') {
                // Ensure added/removed nodes are ELEMENT_NODEs
                return [...mutation.addedNodes, ...mutation.removedNodes].some(node => this._isValidNodeType(node));
            }
            return false;
        });

        if (chunkSize && filteredMutations.length > chunkSize) {
            // split it to chunks and defer each
            for (let i = 0; i < filteredMutations.length; i += chunkSize) {
                const chunkOfMutations = filteredMutations.slice(i, i + Math.min(chunkSize, filteredMutations.length - i));
                setTimeout(() => {
                    chunkOfMutations.forEach((mutation) => {
                        this._processMutation(context, mutation);
                    });
                }, chunkDelayMs);
            }
        } else {
            //Now we store mutations in a queue and process them using `requestIdleCallbackSafe`
            this.mutationQueue.push(...filteredMutations);
            if (!this.processingQueue) {
                this.processingQueue = true;
                this.requestIdleCallbackSafe(() => this._processMutationQueue(context));
            }
        }
    }

    /**
     * Processes mutations in small batches when the browser is idle.
     */
    _processMutationQueue(context) {
        const chunkSize = this._configurationRepository?.get(ConfigurationFields.mutationMaxChunkSize) || 50;

        while (this.mutationQueue.length > 0) {
            const chunk = this.mutationQueue.splice(0, chunkSize);
            chunk.forEach(mutation => this._processMutation(context, mutation));
        }

        this.processingQueue = false;
    }

    /**
     * Process a mutation (a change) we are listening to
     */
    _processMutation(context, mutation) {
        const addedNodes = this._processNodes(mutation.addedNodes, this.nodeAdded);
        const removedNodes = this._processNodes(mutation.removedNodes, this.nodeRemoved);
        this._publishNodesMutationEvents(context, addedNodes, removedNodes);
    }

    _publishNodesMutationEvents(context, addedNodes, removedNodes) {
        if (addedNodes.length > 0) {
            this.requestIdleCallbackSafe(() => this.nodesAdded.publish(new NodesAddedMutationEvent(context, addedNodes)));
        }
        if (removedNodes.length > 0) {
            this.requestIdleCallbackSafe(() => this.nodesRemoved.publish(new NodesRemovedMutationEvent(context, removedNodes)));
        }
    }

    /**
     * Process the added nodes of a single mutation record
     */
    _processNodes(nodes, nodeEvent) {
        const validNodes = [];
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if (this._isValidNodeType(node)) {
                validNodes.push(node);
                nodeEvent.publish(node);
            }
        }
        return validNodes;
    }

    /**
     * Verify the node has a valid nodeType and should be processed.
     */
    _isValidNodeType(node) {
        return !this.ignoreNodeTypes.has(node.nodeType);
    }

    /**
     * Fallback implementation for browsers that don't support requestIdleCallback
     */
    requestIdleCallbackSafe(cb) {
        return (window.requestIdleCallback || function(cb) {
            return setTimeout(() => {
                cb({ timeRemaining: () => 0, didTimeout: true });
            }, 1);
        })(cb);
    }
}
