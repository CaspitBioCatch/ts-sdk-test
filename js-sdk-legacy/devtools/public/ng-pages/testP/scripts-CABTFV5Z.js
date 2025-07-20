(function(n,e){typeof exports=="object"&&typeof module=="object"?module.exports=e():typeof define=="function"&&define.amd?define([],e):typeof exports=="object"?exports.bioCatchClient=e():n.bioCatchClient=e()})(self,()=>(()=>{var __webpack_modules__={"./src/Backend/Communication/retransmitHandler.js":module=>{eval(`class RetransmitHandler {
    constructor(maxRetries, retryInterval, worker, message, messageId) {
        this.maxRetries = maxRetries;
        this.retryInterval = retryInterval;
        this.worker = worker;
        this.message = message;
        this.messageId = messageId;
        this.currentRetry = 0;
        // Bind the method to ensure it has the correct context when called
        // this.handleWorkerResponse = this.handleWorkerResponse.bind(this);
    }

    postMessageToWorker() {
        return new Promise((resolve, reject) => {
            // Listen for a response specifically for this messageId
            this.responseListener = event => {
                const { messageId, status, data, error } = event.data;
                if (messageId === this.messageId) {
                    this.worker.removeEventListener('message', this.responseListener);
                    if (status === 'success') {
                        resolve(data);
                    } else {
                        reject(new Error(error || 'Unknown error'));
                    }
                }
            };
            this.worker.addEventListener('message', this.responseListener);

            this.worker.postMessage({
                action: 'send',
                message: this.message,
                messageId: this.messageId,
                configUrl: 'http://localhost:3000/message'
            });
        });
    }

    attemptSend() {
        if (window.self !== window.top) {
            return new Promise((resolve, reject) => {
                try {
                    window.parent.postMessage(this.message, '*'); // Adjust target origin as needed
                    resolve('Message sent via postMessage');
                } catch (error) {
                    reject(error);
                }
            });
        }

        return new Promise((resolve, reject) => {
            this.postMessageToWorker().then(resolve).catch(error => {
                if (this.currentRetry < this.maxRetries) {
                    setTimeout(() => {
                        console.log(\`Retrying message: Attempt \${this.currentRetry + 1} of \${this.maxRetries}\`);
                        this.currentRetry++;
                        this.attemptSend().then(resolve).catch(reject);
                    }, this.retryInterval);
                } else {
                    reject(new Error(\`Failed to send message after \${this.maxRetries} attempts\`));
                }
            });
        });
    }

    // Method to clean up listener, if necessary
    cleanup() {
        if (this.responseListener) {
            this.worker.removeEventListener('message', this.responseListener);
        }
    }
}

module.exports = RetransmitHandler;



//# sourceURL=webpack://bioCatchClient/./src/Backend/Communication/retransmitHandler.js?`)},"./src/Backend/Communication/transmitter.js":(module,__unused_webpack_exports,__webpack_require__)=>{eval(`const RetransmitHandler = __webpack_require__(/*! ./retransmitHandler */ "./src/Backend/Communication/retransmitHandler.js");

class Transmitter {
    constructor(config) {
        this.config = config;
        this.worker = null;
        this.isRunning = false;
    }

    start() {
        if (this.isRunning) {
            console.log('Transmitter is already running.');
            return;
        }

        this.isRunning = true;
        // Assuming \`config.workerUrl\` is the URL to the worker script
        this.worker = new Worker(this.config.workerUrl);
        console.log('Transmitter started.');
    }

    stop() {
        if (!this.isRunning) {
            console.log('Transmitter is not running.');
            return;
        }

        this.worker.terminate();
        this.worker = null;
        this.isRunning = false;
        console.log('Transmitter stopped and worker terminated.');
    }

    send(message) {
        // Ensure the transmitter has been started
        if (!this.isRunning) {
            console.log('Transmitter is not running. Please start the transmitter first.');
            return;
        }

        const messageId = Date.now() + "-" + Math.random().toString(36).substr(2, 9); // Unique ID for each message
        // Creating an instance of RetransmitHandler for each message to be sent
        const retransmitHandler = new RetransmitHandler(3, 1000, this.worker, message, messageId);

        // The \`send\` method no longer returns a Promise since the calling context may not require an immediate response,
        // but if needed, you can still structure it to return a promise that resolves or rejects based on the transmission outcome.
        retransmitHandler.attemptSend()
            .then(() => console.log(\`Message \${messageId} sent successfully\`))
            .catch(error => console.error(\`Failed to send message \${messageId}:\`, error))
            .finally(() => retransmitHandler.cleanup()); // Ensures cleanup is called to remove event listeners
    }
}

module.exports = Transmitter;


//# sourceURL=webpack://bioCatchClient/./src/Backend/Communication/transmitter.js?`)},"./src/Collection/Collectors/DOMEventService.js":module=>{eval(`
class DOMEventService {
    constructor(eventHandlerFunction, eventMap) {
        // Mapping your enum to actual event names
        this.eventMap = eventMap;
        this.boundEventHandler = eventHandlerFunction
    }

    start() {
        // Attach the event listeners
        this.eventMap.forEach(type => {
            // Using capture phase to catch the event as it propagates down
            window.addEventListener(type, this.boundEventHandler, true);
        });
        console.log('Event tracking started.');
    }

    stop() {
        this.eventMap.forEach(type => {
            // Using capture phase to catch the event as it propagates down
            window.removeEventListener(type, this.boundEventHandler, true);
        });
        console.log('Event tracking stopped.');
    }
}

module.exports = DOMEventService;

//# sourceURL=webpack://bioCatchClient/./src/Collection/Collectors/DOMEventService.js?`)},"./src/Collection/Collectors/IframeManager.js":module=>{eval(`// IframeManager.js
class IframeManager {
    constructor(iframeElement) {
        this.messageHandler = this.handleMessage.bind(this); // Ensure 'this' context
        this.iframe = iframeElement; // Accepts an existing iframe element
        this.targetOrigin = new URL(iframeElement.src).origin
    }

    start() {
        // Setup the message listener
        window.addEventListener('message', this.messageHandler, false);
        this.sendMessage({ message: 'Hello, iframe!', action: 'start' });
    }

    sendMessage(message) {
        if (this.iframe && this.iframe.contentWindow) {
            this.iframe.contentWindow.postMessage(message, this.targetOrigin);
        } else {
            console.error('Iframe is not initialized or does not have a contentWindow.');
        }
    }

    handleMessage(event) {
        // Perform origin check for security
        // Example: if (event.origin !== "https://expected-iframe-origin.com") return;
        console.log('Message from iframe:', event.data);

        // Handle the message based on its content
        // This method needs to be implemented according to specific needs
    }

    stop() {
        this.sendMessage({ message: 'Hello, iframe!', action: 'stop' });
    }
}

module.exports = IframeManager;


//# sourceURL=webpack://bioCatchClient/./src/Collection/Collectors/IframeManager.js?`)},"./src/Collection/Collectors/accelerometer/accelerometerCollector.js":(module,__unused_webpack_exports,__webpack_require__)=>{eval(`const Collector = __webpack_require__(/*! ../collector */ "./src/Collection/Collectors/collector.js");
const DOMEventService = __webpack_require__(/*! ../DOMEventService */ "./src/Collection/Collectors/DOMEventService.js");
const AccelerometerModel = __webpack_require__(/*! ./accelerometerModel */ "./src/Collection/Collectors/accelerometer/accelerometerModel.js");

class AccelerometerCollector extends Collector {
    constructor(collectorID) {
        super(collectorID)
        this.isStarted = false;
        this.processEvent = this.processEvent.bind(this);
        this.domEventService = new DOMEventService(this.processEvent, [
            'devicemotion',
        ]);
    }

    processEvent(event) {
        const targetElement = event.target; // The element that triggered the event

        // Implement the event processing logic here
        const elementEventsModel = new AccelerometerModel(
            12345, // contextID
            67890, // eventID
            Date.now(), // timestamp
            event.acceleration.x,
            event.acceleration.y,
            event.acceleration.z,
        );
        this.dataQueue.enqueue(elementEventsModel)
    }

    start() {
        if (this.isStarted) {
            console.error(this.collectorID + ' collector is already started. Aborting the start operation.');
            return; // Simple error handling for demo
        }

        if ('DeviceMotionEvent' in window) {
            this.domEventService.start();
        }

        this.isStarted = true;
    }

    stop() {
        if (!this.isStarted) {
            return;
        }

        this.domEventService.stop();

        this.isStarted = false;
    }
}

module.exports = AccelerometerCollector;

//# sourceURL=webpack://bioCatchClient/./src/Collection/Collectors/accelerometer/accelerometerCollector.js?`)},"./src/Collection/Collectors/accelerometer/accelerometerModel.js":module=>{eval(`class AccelerometerModel {
    constructor(contextID, eventID, timestamp, xValue, yValue, zValue) {
        this.contextID = contextID;
        this.eventID = eventID;
        this.timestamp = timestamp;
        this.xValue = xValue;
        this.yValue = yValue;
        this.zValue = zValue;
    }
}

// Export the class
module.exports = AccelerometerModel;

//# sourceURL=webpack://bioCatchClient/./src/Collection/Collectors/accelerometer/accelerometerModel.js?`)},"./src/Collection/Collectors/collector.js":(module,__unused_webpack_exports,__webpack_require__)=>{eval(`const DataQueue = __webpack_require__(/*! ./../dataQueue */ "./src/Collection/dataQueue.js");

class Collector {
    constructor(collectorID) {
        if (new.target === Collector) {
            throw new TypeError("Cannot construct Collector instances directly");
        }

        this.collectorID = collectorID;
        this.dataQueue = new DataQueue();
        this.isStarted = false;
    }

    //LifecycleCollector
    start() {

    }

    stop() {

    }

    restart() {

    }

    startIfNotStarted() {
        if (!this.isStarted) {
            this.start();
        } else {
            console.error(this.collectorID + ' collector is already started. Aborting the start operation.');
        }

    }

    collect() {
        return this.dataQueue.dequeueAll()
    }
}

module.exports = Collector;


//# sourceURL=webpack://bioCatchClient/./src/Collection/Collectors/collector.js?`)},"./src/Collection/Collectors/elementEvents/elementEventsCollector.js":(module,__unused_webpack_exports,__webpack_require__)=>{eval(`const Collector = __webpack_require__(/*! ../collector */ "./src/Collection/Collectors/collector.js");
const DOMEventService = __webpack_require__(/*! ../DOMEventService */ "./src/Collection/Collectors/DOMEventService.js");
const ElementEventsModel = __webpack_require__(/*! ./elementEventsModel */ "./src/Collection/Collectors/elementEvents/elementEventsModel.js");

class ElementEventsCollector extends Collector {
    constructor(collectorID) {
        super(collectorID)
        this.isStarted = false;
        this.processEvent = this.processEvent.bind(this);
        this.domEventService = new DOMEventService(this.processEvent, [
            'click',
            'dblclick',
            'input',
            // 'focus',
            'change',
            'submit',
            // 'blur',
            'load'
        ]);
    }

    processEvent(event) {
        const targetElement = event.composedPath()[0]; // The element that triggered the event

        if (!targetElement.bcID) {
            // \`bcID\` is falsy (which includes null, undefined, and more)
            console.error('targetElement.bcID is not define for element ' + targetElement)
        }



        // Implement the event processing logic here
        const elementEventsModel = new ElementEventsModel(
            12345, // contextID
            67890, // eventID
            Date.now(), // timestamp
            event.type, // type
            targetElement.bcID, // hash
            true, // isTrusted
            4, // length (for example, length of the input value or number of clicks)
            targetElement.value // elementValue (value of the button or input element)
        );
        this.dataQueue.enqueue(elementEventsModel)
    }

    start() {
        if (this.isStarted) {
            console.error(this.collectorID + ' collector is already started. Aborting the start operation.');
            return; // Simple error handling for demo
        }

        this.domEventService.start();

        this.isStarted = true;
    }

    stop() {
        if (!this.isStarted) {
            return;
        }

        this.domEventService.stop();

        this.isStarted = false;
    }


}

module.exports = ElementEventsCollector;

//# sourceURL=webpack://bioCatchClient/./src/Collection/Collectors/elementEvents/elementEventsCollector.js?`)},"./src/Collection/Collectors/elementEvents/elementEventsModel.js":module=>{eval(`class ElementEventModel {
    constructor(contextID, eventID, timestamp, type, hash, isTrusted, length, elementValue) {
        this.contextID = contextID;
        this.eventID = eventID;
        this.timestamp = timestamp;
        this.type = type; // This might need to be an enum or simple string
        this.hash = hash;
        this.isTrusted = isTrusted; // Assuming IsTrusted is an enum or boolean
        this.length = length;
        this.elementValue = elementValue;
    }
}

// Export the class
module.exports = ElementEventModel;

//# sourceURL=webpack://bioCatchClient/./src/Collection/Collectors/elementEvents/elementEventsModel.js?`)},"./src/Collection/Collectors/elements/elementsCollector.js":(module,__unused_webpack_exports,__webpack_require__)=>{eval(`const Collector = __webpack_require__(/*! ../collector.js */ "./src/Collection/Collectors/collector.js"); // Adjust the path as necessary
const ElementsService = __webpack_require__(/*! ./elementsService */ "./src/Collection/Collectors/elements/elementsService.js"); // Adjust the path as necessary
const ElementsModel = __webpack_require__(/*! ./elementsModel */ "./src/Collection/Collectors/elements/elementsModel.js"); // Adjust the path as necessary
const { generateUniqueIdForElement, simpleHash } = __webpack_require__(/*! ../../../Core/Hash/hashFunctions */ "./src/Core/Hash/hashFunctions.js");

class ElementsCollector extends Collector {
    constructor(collectorID) {
        super(collectorID)
        this.isStarted = false;
        this.processEvent = this.processEvent.bind(this);
        this.elementsService = new ElementsService(this.processEvent);
        this.uniqueIdCounter = 0;
    }


    generateUniqueId() {
        const timestamp = Date.now();
        const randomValue = Math.floor(Math.random() * 1000);
        this.uniqueIdCounter++;
        return \`\${document.title}-\${timestamp}-\${randomValue}-\${this.uniqueIdCounter}\`;
    }

    processEvent(element) {
        if (element.bcID) {
            console.error("element already have bcid " + element.bcID);
            return;
        }
        const rect = element.getBoundingClientRect(); // Extracting the rectangle
        const uniqueElementId = generateUniqueIdForElement(element);
        element.bcID = simpleHash(uniqueElementId);


        const elementsModel = new ElementsModel(
            1234, // contextID, as a big integer
            element.bcID,       // hash, as an integer
            element.tagName,    // tagName, as a string
            element.id, // id, as a string
            element.className, // elementName, as a string
            element.type, // type, as a string
            rect.left,       // left, as a double/float
            rect.top,       // top, as a double/float
            rect.width,       // width, as a double/float
            rect.height,        // height, as a double/float
            this.getAccessibilityAttributes(element),    // accessibility, as a string
            element.value,    // elementValue, as a string
            Date.now(), // timestamp, as a big integer
            uniqueElementId // uniqueElementId, as a string
        )
        console.log(elementsModel);
        this.dataQueue.enqueue(elementsModel)
    }

    getAccessibilityAttributes(element) {
        const attrs = {};
        const attributeNames = element.getAttributeNames();

        attributeNames.forEach(attrName => {
            if (attrName.startsWith('aria-') || attrName === 'role' || attrName === 'tabindex') {
                attrs[attrName] = element.getAttribute(attrName);
            }
        });

        return attrs;
    }

    start() {
        if (this.isStarted) {
            console.error(this.collectorID + ' collector is already started. Aborting the start operation.');
            return; // Simple error handling for demo
        }

        this.elementsService.start();

        this.isStarted = true;
    }

    stop() {
        if (!this.isStarted) {
            return;
        }

        this.elementsService.stop();

        this.isStarted = false;
    }

}

module.exports = ElementsCollector;

//# sourceURL=webpack://bioCatchClient/./src/Collection/Collectors/elements/elementsCollector.js?`)},"./src/Collection/Collectors/elements/elementsModel.js":module=>{eval(`// Assuming MessagePackValue is defined elsewhere and imported here
// const MessagePackValue = require('path-to-messagepack').MessagePackValue;

function ElementModel(contextID, hash, tagName, id, elementName, type, left, top, width, height, accessibility, elementValue, timestamp, uniqueElementId) {
    this.contextID = contextID;
    this.hash = hash;
    this.tagName = tagName;
    this.id = id;
    this.elementName = elementName;
    this.type = type;
    this.left = left;
    this.top = top;
    this.width = width;
    this.height = height;
    this.accessibility = accessibility;
    this.elementValue = elementValue;
    this.timestamp = timestamp;
    this.uniqueElementId = uniqueElementId;
}

// ElementModel.prototype.toContractArray = function() {
//     // You need to define MessagePackValue or include a library that provides it
//     return [
//         new MessagePackValue(this.contextID),
//         new MessagePackValue(this.hash),
//         new MessagePackValue(this.tagName),
//         new MessagePackValue(this.id), // element ID
//         new MessagePackValue(this.elementName), // name
//         new MessagePackValue(this.type),
//         new MessagePackValue(this.left),
//         new MessagePackValue(this.top),
//         new MessagePackValue(this.width),
//         new MessagePackValue(this.height),
//         new MessagePackValue(""), // link
//         new MessagePackValue(""), // style
//         new MessagePackValue(""), // hint - tooltip
//         new MessagePackValue(this.accessibility), // accessibility
//         new MessagePackValue(""), // selected values
//         new MessagePackValue(this.elementValue),
//         new MessagePackValue(-1),
//         new MessagePackValue(this.timestamp),
//         new MessagePackValue(""), // customElementAttribute
//         new MessagePackValue(""), // unmaskedElementValue
//         new MessagePackValue(this.uniqueElementId)
//     ];
// };

// Exporting the ElementModel class
module.exports = ElementModel;


//# sourceURL=webpack://bioCatchClient/./src/Collection/Collectors/elements/elementsModel.js?`)},"./src/Collection/Collectors/elements/elementsService.js":(module,__unused_webpack_exports,__webpack_require__)=>{eval(`const IframeManager = __webpack_require__(/*! ../IframeManager */ "./src/Collection/Collectors/IframeManager.js")
class ElementsService {

    // Function to handle mutations
    // handleMutations(mutations) {
    //     mutations.forEach(mutation => {
    //         const element = mutation.target;
    //         if (element.nodeType === 1) {
    //             this.boundEventHandler(element); // Correct 'this' is used here
    //         } else {
    //             console.log('element.nodeType != 1 ' + element)
    //         }
    //     });
    // }
    handleMutations(mutations) {
        console.info(mutations);
        mutations.forEach(mutation => {
            // Check if the mutation type is 'childList' (insertion/removal of child elements)
            if (mutation.type === 'childList') {
                // Iterate over added nodes to find any input elements
                mutation.addedNodes.forEach(node => {
                    this.traverseDOM(node);
                });
            }
        });
    }

    constructor(eventHandlerFunction) {
        this.boundEventHandler = eventHandlerFunction
        this.handleMutations = this.handleMutations.bind(this);
        this.traverseDOM = this.traverseDOM.bind(this);

        this.observer = new MutationObserver(this.handleMutations);
        this.shadowObservers = []; // Initialize an array to keep track of shadow DOM observers
        this.iframeManagers = []; // Initialize an array to keep track of shadow DOM observers

        // Specify what you want to observe (configurations)
        this.config = {
            childList: true, // Set to true if additions or removals of the target node's child elements (including text nodes) are to be observed.
            // attributes: true, // Set to true if mutations to target's attributes are to be observed.
            // characterData: true, // Set to true if mutations to target's data are to be observed.
            subtree: true, // Set to true if mutations to not just the target, but also target's descendants are to be observed.
            // attributeOldValue: true, // Set to true if attributes is set to true and target's attribute value before the mutation needs to be recorded.
            // characterDataOldValue: true, // Set to true if characterData is set to true and target's data before the mutation needs to be recorded.
            // attributeFilter: ['class', 'style'] // An array of specific attribute names to be observed. Remove or adjust this line to fit your needs.
        };
    }

    start() {
        this.getAllCurrentElements()
        // Now, let's observe the entire document.
        // You can replace 'document' with any specific element you wish to observe.
        this.observer.observe(document, this.config);

    }

    stop() {
        // Later, you can stop observing by calling:
        this.observer.disconnect();

        // Disconnect all shadow DOM observers
        this.shadowObservers.forEach(observer => observer.disconnect());

        // Clear the list of shadow observers
        this.shadowObservers = [];

        // stop all iFrame managers
        this.iframeManagers.forEach(manager => manager.stop());

        // Clear the list of iframe Managers
        this.iframeManagers = [];

    }

    traverseDOM(node) {
        if (!node) return;
        if (node.bcID) {
            console.warn("node created before " + node);
            return;
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            this.boundEventHandler(node); // Existing functionality
            // Handle <iframe> elements by attempting to access their contentDocument
            if (node.tagName === 'IFRAME') {
                try {
                    // Attempt to access the contentDocument of the iframe
                    const iframeDocument = node.contentDocument;
                    if (iframeDocument) {
                        // If access was successful, traverse the iframe's DOM
                        console.log('Traversing iframe content for', element.src);
                        traverseDOM(iframeDocument.body);
                    } else {
                        const manager = new IframeManager(node);
                        manager.start();
                        this.iframeManagers.push(manager); // Add the new iframeManagers to the list
                    }
                } catch (error) {
                    console.error('Error accessing iframe content:', error);
                }
            }
            if (node.shadowRoot && !node.shadowRoot.isObserved) {
                console.log('Observing shadow DOM of', node.tagName);
                const shadowObserver = new MutationObserver(this.handleMutations);
                shadowObserver.observe(node.shadowRoot, this.config);
                this.shadowObservers.push(shadowObserver); // Add the new observer to the list

                node.shadowRoot.isObserved = true; // Mark the shadowRoot as observed

                // Traverse shadow DOM if it exists
                Array.from(node.shadowRoot.children).forEach(this.traverseDOM);
            }

            // Traverse light DOM children
            Array.from(node.children).forEach(this.traverseDOM);
        } else {
            console.log('element.nodeType != 1 ' + node);
        }


        // // Check if the current node is an element node (nodeType === 1)
        // if (node.nodeType === Node.ELEMENT_NODE) {
        //     this.boundEventHandler(node);
        //
        //     // Recursively traverse the children of the current node
        //     Array.from(node.children).forEach(this.traverseDOM);
        // }
    }

    getAllCurrentElements() {
        // Use an arrow function to preserve the 'this' context
        // const traverseDOM = (element) => {
        //     if (!element) return;
        //
        //     if (element.nodeType === 1) {
        //         this.boundEventHandler(element); // Existing functionality
        //         // Handle <iframe> elements by attempting to access their contentDocument
        //         if (element.tagName === 'IFRAME') {
        //             try {
        //                 // Attempt to access the contentDocument of the iframe
        //                 const iframeDocument = element.contentDocument;
        //                 if (iframeDocument) {
        //                     // If access was successful, traverse the iframe's DOM
        //                     console.log('Traversing iframe content for', element.src);
        //                     traverseDOM(iframeDocument.body);
        //                 } else {
        //                     const manager = new IframeManager(element);
        //                     manager.start();
        //                     this.iframeManagers.push(manager); // Add the new iframeManagers to the list
        //                 }
        //             } catch (error) {
        //                 console.error('Error accessing iframe content:', error);
        //             }
        //         }
        //     } else {
        //         console.log('element.nodeType != 1 ' + element);
        //     }
        //
        //     if (element.shadowRoot && !element.shadowRoot.isObserved) {
        //         console.log('Observing shadow DOM of', element.tagName);
        //         const shadowObserver = new MutationObserver(this.handleMutations);
        //         shadowObserver.observe(element.shadowRoot, this.config);
        //         this.shadowObservers.push(shadowObserver); // Add the new observer to the list
        //
        //         element.shadowRoot.isObserved = true; // Mark the shadowRoot as observed
        //
        //         // Traverse shadow DOM if it exists
        //         Array.from(element.shadowRoot.children).forEach(traverseDOM);
        //     }
        //
        //     // Traverse light DOM children
        //     Array.from(element.children).forEach(traverseDOM);
        // };

        this.traverseDOM(document.body); // Start traversing from the body
    }
}

module.exports = ElementsService;


//# sourceURL=webpack://bioCatchClient/./src/Collection/Collectors/elements/elementsService.js?`)},"./src/Collection/Collectors/keyEvents/KeyEventsModel.js":module=>{eval(`class KeyEventModel {
    constructor(contextID, eventID, timestamp, type, charCode, character, hash, isTrusted, location) {
        this.contextID = contextID;
        this.eventID = eventID;
        this.timestamp = timestamp;
        this.type = type; // Assuming KeyEventType has been defined or converted appropriately
        this.charCode = charCode;
        this.character = character;
        this.hash = hash;
        this.isTrusted = isTrusted; // Assuming IsTrusted is a boolean or has been converted appropriately
        this.location = location; // Assuming KeyLocationType has been defined or converted appropriately
    }
}

module.exports = KeyEventModel;


//# sourceURL=webpack://bioCatchClient/./src/Collection/Collectors/keyEvents/KeyEventsModel.js?`)},"./src/Collection/Collectors/keyEvents/keyEventsCollector.js":(module,__unused_webpack_exports,__webpack_require__)=>{eval(`const Collector = __webpack_require__(/*! ../collector */ "./src/Collection/Collectors/collector.js");
const DOMEventService = __webpack_require__(/*! ../DOMEventService */ "./src/Collection/Collectors/DOMEventService.js");
const KeyEventsModel = __webpack_require__(/*! ./KeyEventsModel */ "./src/Collection/Collectors/keyEvents/KeyEventsModel.js");

class KeyEventsCollector extends Collector {
    constructor(collectorID) {
        super(collectorID)
        this.isStarted = false;
        this.processEvent = this.processEvent.bind(this);
        this.domEventService = new DOMEventService(this.processEvent, [
            'keyup',
            'keydown',
            'keypress',
        ]);
    }

    processEvent(event) {
        const keyEventsModel = new KeyEventsModel(
            1234, // contextID: BigInt for demonstration, assuming large integer values
            98765, // eventID: BigInt
            event.timeStamp, // timestamp: Using current timestamp for simplicity
            event.type, // type: Assuming this is a string representing the type of key event
            event.keyCode, // charCode: Example charCode for the 'A' key
            event.key, // character: The actual character generated by the event
            123456, // hash: Some arbitrary hash value for the event
            event.isTrusted, // isTrusted: Indicates whether the event is trusted
            event.location // location: Assuming this is a string representing the location of the key event
        );
        this.dataQueue.enqueue(keyEventsModel)
    }

    start() {
        if (this.isStarted) {
            console.error(this.collectorID + ' collector is already started. Aborting the start operation.');
            return; // Simple error handling for demo
        }

        this.domEventService.start();

        this.isStarted = true;
    }

    stop() {
        if (!this.isStarted) {
            return;
        }

        this.domEventService.stop();

        this.isStarted = false;
    }

}

module.exports = KeyEventsCollector;

//# sourceURL=webpack://bioCatchClient/./src/Collection/Collectors/keyEvents/keyEventsCollector.js?`)},"./src/Collection/collectorID.js":module=>{eval(`
const CollectorID = Object.freeze({
    elements: 'elements',
    elementEvents: 'elementEvents',
    keyEvents: 'keyEvents',
    accelerometerEvents: 'accelerometerEvents'
});

module.exports = CollectorID;

//# sourceURL=webpack://bioCatchClient/./src/Collection/collectorID.js?`)},"./src/Collection/collectorRepository.js":module=>{eval(`class CollectorRepository {
    constructor() {
        this.collectors = {};
    }

    add(collector) {
        this.collectors[collector.collectorID] = collector;
    }

    remove(collector) {
        delete this.collectors[collector.collectorID];
    }

    removeByIds(collectorsIds) {
        collectorsIds.forEach(collectorId => {
            delete this.collectors[collectorId];
        });
    }

    getAll() {
        return Object.values(this.collectors);
    }

    get(collectorID) {
        const collector = this.collectors[collectorID];
        if (!collector) {
            throw new Error(\`Collector \${collectorID} not found\`);
        }
        return collector;
    }

    has(collectorID) {
        return this.collectors.hasOwnProperty(collectorID);
    }
}

// Possible usage of CollectionError could be replaced with Error or a custom error class if needed.
class CollectionError extends Error {
    constructor(message) {
        super(message);
        this.name = "CollectionError";
    }
}

// Example of a custom error class for handling not found collectors, if necessary.
class CollectorNotFoundError extends Error {
    constructor(collectorID) {
        super(\`Collector \${collectorID} not found\`);
        this.name = "CollectorNotFoundError";
    }
}

module.exports = CollectorRepository;


//# sourceURL=webpack://bioCatchClient/./src/Collection/collectorRepository.js?`)},"./src/Collection/collectorService.js":(module,__unused_webpack_exports,__webpack_require__)=>{eval(`const CollectorID = __webpack_require__(/*! ./collectorID */ "./src/Collection/collectorID.js");

class CollectorService {
    constructor(collectorRepository) {
        this.collectorRepository = collectorRepository;
        // Try loading each collector. If the module doesn't exist, the require call will throw, and the collector won't be added.
        try {
            const ElementCollector = __webpack_require__(/*! ../Collection/Collectors/elements/elementsCollector */ "./src/Collection/Collectors/elements/elementsCollector.js");
            this.addCollectors([new ElementCollector(CollectorID.elements)]);
        } catch (error) {
            console.error('ElementCollector could not be loaded');
        }

        try {
            const ElementEventsCollector = __webpack_require__(/*! ../Collection/Collectors/elementEvents/elementEventsCollector */ "./src/Collection/Collectors/elementEvents/elementEventsCollector.js");
            this.addCollectors([new ElementEventsCollector(CollectorID.elementEvents)]);
        } catch (error) {
            console.error('ElementEventsCollector could not be loaded');
        }

        try {
            const KeyEventsCollector = __webpack_require__(/*! ../Collection/Collectors/keyEvents/keyEventsCollector */ "./src/Collection/Collectors/keyEvents/keyEventsCollector.js");
            this.addCollectors([new KeyEventsCollector(CollectorID.keyEvents)]);
        } catch (error) {
            console.error('KeyEventsCollector could not be loaded');
        }

        try {
            const AccelerometerCollector = __webpack_require__(/*! ../Collection/Collectors/accelerometer/accelerometerCollector */ "./src/Collection/Collectors/accelerometer/accelerometerCollector.js");
            this.addCollectors([new AccelerometerCollector(CollectorID.accelerometerEvents)]);
        } catch (error) {
            console.error('AccelerometerCollector could not be loaded');
        }
    }


    removeCollectors(collectorsIds) {
        this.collectorRepository.removeByIds(collectorsIds);
    }

    addCollectors(collectors) {
        collectors.forEach(collector => {
            // this.logger.log(\`adding feature: \${collector.collectorID.friendlyName} group: \${collector.collectorID.groupName}\`, 'debug');
            this.collectorRepository.add(collector);
        });
    }

    replaceCollectors(collectors) {
        collectors.forEach(collector => {
            // this.logger.log(\`adding feature: \${collector.collectorID.friendlyName} group: \${collector.collectorID.groupName}\`, 'debug');
            this.collectorRepository.remove(collector);
            this.collectorRepository.add(collector);
        });
    }

    startAllCollectors() {
        this.collectorRepository.getAll().forEach(collector => {
           this.startCollector(collector);
        });
    }

    stopAllCollectors() {
        this.collectorRepository.getAll().forEach(collector => {
            this.stopCollector(collector);
        });
    }

    startCollector(collector) {
        try {
            collector.startIfNotStarted();
            return true;
        } catch (error) {
            // this.logger.log(\`An error has occurred while starting the \${collector.collectorID.friendlyName} collector: \${error.message}\`, 'error');
        }
        return false;
    }

    stopCollector(collector) {
        collector.stop();
    }

    isCollectorEnabled(collector) {
        if (collector instanceof CollectorEx) {
            this.logger.log(\`Ignoring an attempt to disable an external collector: \${collector.collectorID} from remote configuration\`, 'warning');
            return true;
        }
        return this.configurationRepository.isCollectorEnabled(collector);
    }
}

// Export the class if using modules
module.exports = CollectorService;


//# sourceURL=webpack://bioCatchClient/./src/Collection/collectorService.js?`)},"./src/Collection/dataHarvester.js":(module,__unused_webpack_exports,__webpack_require__)=>{eval(`__webpack_require__(/*! ../Collection/collectorID */ "./src/Collection/collectorID.js");
__webpack_require__(/*! ../Collection/collectorRepository */ "./src/Collection/collectorRepository.js");
class DataHarvester {
    constructor(collectorRepository, interval, transmitter) {
        this.collectorRepository = collectorRepository; // An array of collector instances
        this.interval = interval; // The time period between collections in milliseconds
        this.harvestIntervalId = null; // To store the interval ID
        this.transmitter = transmitter;
    }

    startHarvesting() {
        if (this.harvestIntervalId !== null) {
            console.log("Harvesting already started.");
            return;
        }

        console.log("Starting data harvesting...");
        this.harvestIntervalId = setInterval(() => {
            this.harvest();
        }, this.interval);
    }

    stopHarvesting() {
        if (this.harvestIntervalId === null) {
            console.log("Harvesting not started or already stopped.");
            return;
        }

        console.log("Stopping data harvesting...");
        clearInterval(this.harvestIntervalId);
        this.harvestIntervalId = null;
    }

    harvest() {
        const startTime = Date.now();
        const dataPackages = [];


        this.collectorRepository.getAll().forEach(collector => {
            const dataTypeStartTime = Date.now();
            // console.log('Harvesting the ' + collector.collectorID + ' data queue');

            const data = collector.collect();
            if (!data.length) {
                return;
            }

            const dataPackage = { data: data, group: collector.collectorID };
            dataPackages.push(dataPackage);

            const duration = Date.now() - dataTypeStartTime;
            // console.log('Harvested ' + data.length + ' records of ' + collector.collectorID + ' data type. Operation took ' + duration + ' milliseconds.');
        });

        const totalDuration = Date.now() - startTime;
        console.log(\`Harvesting operation took \${totalDuration} milliseconds. for \${dataPackages.length} data\`);
        if (dataPackages.length === 0) {
            return; // No data to send
        }

        // console.log(JSON.stringify(dataPackages, null, 2));
        // this.transmitter.enqueue(dataPackages);
        this.transmitter.send(dataPackages);

        // const sendData = isFlush ? this.backendService.sendFlushData(dataPackages, flushDataSourceMessageType)
        //     : this.backendService.sendData(dataPackages);
        //
        // sendData.then(() => {
        //     this.logger.log('Data successfully sent to backend.', 'info');
        // }).catch(error => {
        //     this.logger.log(\`Failed harvesting data from collectors. Forwarding data to backend failed. \${error}\`, 'error');
        // }).finally(() => {
        //     if (this.isStarted) {
        //         this.scheduleNextHarvest(); // Assuming this is a method that sets up the next harvest
        //     }
        // });
    }

}

// Export the DataHarvester class
module.exports = DataHarvester;


//# sourceURL=webpack://bioCatchClient/./src/Collection/dataHarvester.js?`)},"./src/Collection/dataQueue.js":module=>{eval(`class DataQueue {
    constructor(maxSize = 0) {
        this.internalList = [];
        this.maxSize = maxSize;
    }

    get size() {
        return this.internalList.length;
    }

    getMaxSize() {
        return this.maxSize;
    }

    setMaxSize(maxSize) {
        this.maxSize = maxSize;
        this.trimToSize();
    }

    enqueue(collectionItem) {
        this.internalList.push(collectionItem);
        this.trimToSize();
    }

    enqueueMany(collectionItems) {
        this.internalList.push(...collectionItems);
        this.trimToSize();
    }

    isEmpty() {
        return this.internalList.length === 0;
    }

    dequeueAll() {
        const data = [...this.internalList]; // Creating a shallow copy of the array
        this.clear();
        return data;
    }

    clear() {
        this.internalList = [];
    }

    trimToSize() {
        while (this.maxSize !== 0 && this.internalList.length > this.maxSize) {
            this.internalList.shift(); // Removes the first element from an array and returns that removed element
        }
    }
}

module.exports = DataQueue;

//# sourceURL=webpack://bioCatchClient/./src/Collection/dataQueue.js?`)},"./src/Core/Hash/hashFunctions.js":module=>{eval(`// hashFunctions.js
let domPathCallCounter = 0; // Counter to track the number of times getDomPath is called

function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to a 32bit integer
    }
    return hash.toString();
}

function generateUniqueIdForElement(element) {
    // Use the element's complete path in the DOM structure for uniqueness
    const domPath = domPathCallCounter + "-" + getDomPath(element);

    // Increment the counter each time getDomPath is called within this function
    domPathCallCounter++;

    const elementString = [
        domPath, // Adds specificity based on the element's unique path in the DOM
        element.tagName,
        element.className,
        element.parentNode.childElementCount,
        element.innerHTML.length,
        element.src || '', // Include 'src' if applicable
        element.textContent.slice(0, 100), // Include a portion of text content
        Array.from(element.attributes).map(attr => \`\${attr.name}:\${attr.value}\`).join(';'), // Attributes
        element.clientWidth + 'x' + element.clientHeight, // Element dimensions
        // Additional properties as needed
    ].join('|');

    return elementString;
}

// Helper function to generate a unique DOM path for an element
function getDomPath(element) {
    let path = [];
    while (element.parentNode !== null) {
        let name = element.tagName;
        let siblingCount = 0;
        let siblingIndex = 0;

        // Count siblings and find the element's index among them
        for (let sibling = element.parentNode.firstChild; sibling; sibling = sibling.nextSibling) {
            if (sibling.nodeType === Node.ELEMENT_NODE) {
                siblingCount++;
                if (sibling === element) {
                    siblingIndex = siblingCount;
                }
            }
        }

        if (element.id) {
            name += "#" + element.id + \`:sibling(\${siblingCount})\`;
            path.unshift(name);
            break; // If an ID is found, it's assumed to be unique, so we can stop.
        } else {
            let index = siblingIndex;
            name += \`:nth-of-type(\${index})\` + \`:sibling(\${siblingCount})\`;
        }
        path.unshift(name);
        element = element.parentNode;
    }
    return path.join(" > ");
}

module.exports = {
    simpleHash,
    generateUniqueIdForElement
};


//# sourceURL=webpack://bioCatchClient/./src/Core/Hash/hashFunctions.js?`)},"./src/Core/Lifecycle/stateService.js":module=>{eval(`// Import dependencies
// Assuming LoggerType, EventBusService, CollectionOrchestrator, BackendService are imported or required above

class StateService {
    constructor() {
        // this.logger = logger;
        // this.eventBusService = eventBusService;
        // this.collectionOrchestrator = collectionOrchestrator;
        // this.backendService = backendService;

        this.state = 'stopped'; // SDKState.stopped
    }

    getState() {
        return this.state;
    }

    pause() {
        return new Promise((resolve, reject) => {
            console.log("Pausing the library", "info");

            if (this.state !== 'started') { // SDKState.started
                const errorMessage = \`Unable to pause. State is \${this.state}.\`;
                this.logger.log(errorMessage, "error");
                reject(new Error(errorMessage));
                return;
            }

            // Assuming pauseLogDispatcher() returns a promise
            // this.backendService.pauseLogDispatcher()
            //     .then(() => {
            //         this.collectionOrchestrator.pause();
            //         this.updateState('paused'); // SDKState.paused
            //         resolve();
            //     })
            //     .catch(reject);
        });
    }

    resume() {
        return new Promise((resolve, reject) => {
            console.log("Resuming the library", "info");

            if (this.state !== 'paused') { // SDKState.paused
                const errorMessage = \`Unable to resume. State is \${this.state}.\`;
                this.logger.log(errorMessage, "error");
                reject(new Error(errorMessage));
                return;
            }

            // this.collectionOrchestrator.resume();
            //
            // // Assuming resumeLogDispatcher() returns a promise
            // this.backendService.resumeLogDispatcher()
            //     .then(() => {
            //         this.updateState('started'); // SDKState.started
            //         resolve();
            //     })
            //     .catch(reject);
        });
    }

    updateState(newState) {
        this.state = newState;

        // Assuming StateChangedEvent is an object that's instantiated as needed
        // this.eventBusService.publish(new StateChangedEvent(this.state));
    }
}

// Depending on the environment, you could export the class as a module
module.exports = StateService; // For CommonJS
// OR
// export default StateService; // For ES6 Modules


//# sourceURL=webpack://bioCatchClient/./src/Core/Lifecycle/stateService.js?`)},"./src/Core/systemBootstrapper.js":(module,__unused_webpack_exports,__webpack_require__)=>{eval(`const CollectorID = __webpack_require__(/*! ../Collection/collectorID */ "./src/Collection/collectorID.js");
const CollectorService = __webpack_require__(/*! ../Collection/collectorService */ "./src/Collection/collectorService.js");
const DataHarvester = __webpack_require__(/*! ../Collection/dataHarvester */ "./src/Collection/dataHarvester.js");
const Transmitter = __webpack_require__(/*! ../Backend/Communication/transmitter */ "./src/Backend/Communication/transmitter.js");
const CollectorRepository = __webpack_require__(/*! ../Collection/collectorRepository */ "./src/Collection/collectorRepository.js");


class SystemBootstrapper {
    constructor() {
        this.collectorRepository = new CollectorRepository()
        this.collectorService = new CollectorService(this.collectorRepository)
        this.transmitter = new Transmitter({
            workerUrl: '../src/Backend/Communication/worker.js',
        });
        this.dataHarvester = new DataHarvester(this.collectorRepository,10000, this.transmitter);
    }

    start(wupServerURL, logAddressURL, cid, csid, extendedOptions, externalCollectors) {
        console.log('start in SystemBootstrapper()')
        this.collectorService.startAllCollectors();
        this.dataHarvester.startHarvesting();
        this.transmitter.start();
    }

    stop() {
        this.collectorService.stopAllCollectors();
        this.dataHarvester.stopHarvesting();
        this.transmitter.stop();
    }
}

// Export SystemBootstrapper if using modules
module.exports = SystemBootstrapper;


//# sourceURL=webpack://bioCatchClient/./src/Core/systemBootstrapper.js?`)},"./src/bioCatchClient.js":(module,__unused_webpack_exports,__webpack_require__)=>{eval(`
// Import the module
const  Client  = __webpack_require__(/*! ./client */ "./src/client.js");

// Create an instance of the Client class
const client = new Client();

// Define the functions within an object
const bioCatchClient = {

    start: function(serverURL, customerSessionID, extendedOptions, externalCollectors) {

        // Example method to start the client, adjust parameters as needed
        client.startWithParam(serverURL, customerSessionID, extendedOptions, externalCollectors)
            .then(() => console.log('Client started successfully'))
            .catch(error => console.error('Failed to start the client:', error));
    },
    stop: function () {
        client.stop()
            .then(() => console.log('Client stop successfully'))
            .catch(error => console.error('Failed to stop the client:', error));
    },
    resume: function () {
        client.resume()
            .then(() => console.log('Client resume successfully'))
            .catch(error => console.error('Failed to resume the client:', error));
    },
    pause: function () {
        client.pause()
            .then(() => console.log('Client pause successfully'))
            .catch(error => console.error('Failed to pause the client:', error));
    },
    setCustomerSessionID: function (customerSessionID) {
        client.setCustomerSessionID(customerSessionID)
            .then(() => console.log('Client setCustomerSessionID successfully'))
            .catch(error => console.error('Failed to setCustomerSessionID the client:', error));
    }
};

// Export the object
module.exports = bioCatchClient;


//# sourceURL=webpack://bioCatchClient/./src/bioCatchClient.js?`)},"./src/client.js":(module,__unused_webpack_exports,__webpack_require__)=>{eval(`// // Assuming each service has been similarly translated into JavaScript modules
// import Logger from './Logger';
// import DependencyInjectionService from './DependencyInjectionService';
// import SystemBootstrapper from './SystemBootstrapper';
// import ClientEventService from './ClientEventService';
// // Import other services similarly...
const { getVersion } = __webpack_require__(/*! ./getVersionModule */ "./src/getVersionModule.js");
const StateService = __webpack_require__(/*! ./Core/Lifecycle/stateService */ "./src/Core/Lifecycle/stateService.js");
const SystemBootstrapper = __webpack_require__(/*! ./Core/systemBootstrapper */ "./src/Core/systemBootstrapper.js");

class Client {
    constructor() {
        // this.logger = new Logger();
        // DependencyInjectionService.add(this.logger);
        //
        // this.clientEventService = new ClientEventService();
        // // Initialize other services based on the SystemBootstrapper
        // // For simplicity, let's assume SystemBootstrapper initializes and exposes these services
        // this.stateService = this.systemBootstrapper.stateService;
        // this.sessionService = this.systemBootstrapper.sessionService;
        // // Continue for other services...
        this.stateService = new StateService()
        this.systemBootstrapper = new SystemBootstrapper();
        // this.isDisposed = false;
    }

    async startWithParam(serverURL, customerSessionID, extendedOptions, externalCollectors = []) {
        // if (this.isDisposed) {
        //     throw new Error('The client has already been disposed and cannot be started.');
        // }
        //
        if (this.stateService.getState() !== 'stopped') {
            throw new Error('The client is already started.');
        }
        //
        // if (!serverURL || !cid) {
        //     throw new Error('The serverURL and cid cannot be empty.');
        // }
        //
        // // Validate and process the serverURL, customerSessionID, etc...
        // // For simplicity, assuming you have the necessary utilities to do so
        //
        try {
            await this.systemBootstrapper.start({
                serverURL,
                customerSessionID,
                extendedOptions: extendedOptions,
                externalCollectors
            });
        } catch (error) {
            // Clean up if necessary
            throw new Error(\`Failed to start the client: \${error.message}\`);
        }
    }


    async stop() {
        try {
            await this.systemBootstrapper.stop();
        } catch (error) {
            // Clean up if necessary
            throw new Error(\`Failed to stop the client: \${error.message}\`);
        }
    }

    async pause() {
        if (this.stateService.getState() === 'paused') {
            return; // Silently return if already paused
        }

        if (this.stateService.getState() !== 'started') {
            throw new Error('The client is not in a started state and cannot be paused.');
        }

        await this.stateService.pause();
    }

    async resume() {
        if (this.stateService.getState() === 'started') {
            return; // Silently return if already started
        }

        if (this.stateService.getState() !== 'paused') {
            throw new Error('The client is not in a paused state and cannot be resumed.');
        }

        await this.stateService.resume();
    }

    async startNewSession(customerSessionID) {
        await this.sessionService.startNewSession(customerSessionID);
    }

    async setCustomerSessionID(customerSessionID) {
        // if (!customerSessionID) {
        //     throw new Error('Customer session ID cannot be empty.');
        // }
        //
        console.log("customerSessionID: " + customerSessionID);

        // await this.csidService.set(customerSessionID);
    }


    _getVersion() {
        return getVersion()
    }

    // Other methods (e.g., startWithParams, stop, pause, resume) would be translated similarly
    // Note: JavaScript does not support method overloading like Swift, so you may need to adjust method signatures or merge methods

    // Static methods can be included directly in the class, using the 'static' keyword
    static verifyMainThread() {
        // JavaScript does not have a direct way to enforce running on the main thread
        // This function might be adapted based on the environment (e.g., Node.js, browser)
        if (typeof window === 'undefined') {
            throw new Error('NotOnMainThread');
        }
    }

    // Dispose, verifySystemIsOperational, and other utility methods are translated similarly
}

// Export the Client class as a module
module.exports = Client;


//# sourceURL=webpack://bioCatchClient/./src/client.js?`)},"./src/getVersionModule.js":module=>{eval(`// src/getVersionModule.js

function getVersion() {
    try {
        return "Client.getVersion() Asaf";
    } catch (error) {
        console.error('An error occurred:', error);
        throw error;
    }
}

module.exports = {
    getVersion,
};


//# sourceURL=webpack://bioCatchClient/./src/getVersionModule.js?`)}},__webpack_module_cache__={};function __webpack_require__(t){var n=__webpack_module_cache__[t];if(n!==void 0)return n.exports;var e=__webpack_module_cache__[t]={exports:{}};return __webpack_modules__[t](e,e.exports,__webpack_require__),e.exports}var __webpack_exports__=__webpack_require__("./src/bioCatchClient.js");return __webpack_exports__})());
