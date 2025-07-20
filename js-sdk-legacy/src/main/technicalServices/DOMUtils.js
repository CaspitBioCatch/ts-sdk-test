
function isPassiveSupported() {
    let isPassive = false;
    try {
        // Test via a getter in the options object to see if the passive property is accessed
        // browsers throw exception if addEventListener gets an object and not boolean for third param
        const opts = Object.defineProperty({}, 'passive', {
            get() {
                isPassive = true;
            },
        });
        window.addEventListener('test', null, opts);
    } catch (e) {
        // no support for passive
    }

    return isPassive;
}

export default class DOMUtils {
    static isPassiveSupported = isPassiveSupported();

    static addEventListener(target, type, handler, isCapture = false,
        isPassive = true, isOnce = false) {
        if (this.isPassiveSupported) {
            target.addEventListener(type, handler, { capture: isCapture, passive: isPassive, once: isOnce });
        } else if (target.addEventListener) {
            target.addEventListener(type, handler, isCapture);
        } else {
            target.attachEvent('on' + type, handler);// isCapture not supported in attachEvent
        }
    }

    static removeEventListener(target, type, handler, isCapture = false) {
        target.removeEventListener ? target.removeEventListener(type, handler, isCapture)
            : target.detachEvent('on' + type, handler);
    }

    // getting the HTML so that it will also work on FF
    static outerHTML(node) {
        return node.outerHTML || new XMLSerializer().serializeToString(node);
    }

    static onDocumentBody(frame, callback) {
        if (frame.document.body) {
            callback();
        } else {
            window.addEventListener
                ? window.addEventListener('DOMContentLoaded', callback, true)
                : window.attachEvent('onload', callback); // Old IE does not support DOMContentLoaded
        }
    }

    static onPageLoad(frame, callback) {
        DOMUtils.addEventListener(frame, 'load', callback, true);
        if ((frame.contentWindow && frame.contentWindow.document.readyState === 'complete')
            || (frame.document && frame.document.readyState === 'complete')) {
            // since we still want to listen every time a frame is loaded
            callback();
        }
    }

    static awaitWindowDocumentReady(contentWindow) {
        return new Promise((resolve, reject) => {
            try {
                this.onWindowDocumentReady(contentWindow, () => {
                    resolve();
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    static onWindowDocumentReady(contentWindow, callback) {
        const eventType = window.addEventListener ? 'DOMContentLoaded' : 'load';

        // We consider both states good since they both mean the dom was already loaded and we can work on the document
        if (contentWindow.document.readyState === 'complete' || contentWindow.document.readyState === 'interactive') {
            callback();
        } else {
            const onLoaded = function onLoadedWindowEvent() {
                DOMUtils.removeEventListener(contentWindow, eventType, onLoaded, true);
                callback();
            };
            DOMUtils.addEventListener(contentWindow, eventType, onLoaded, true);
        }
    }

    static isWindowDocumentReady(contentWindow) {
        return contentWindow && contentWindow.document.readyState === 'complete';
    }

    static canAccessIFrame(iframe) {
        let
            html = null;
        try {
            // deal with older browsers
            const doc = iframe.contentDocument || iframe.contentWindow.document;
            html = doc.body.innerHTML;
        } catch
        (err) {
            // do nothing
        }

        return (html !== null);
    }

    // Some browsers (for example IE11) have prefixed implementation of matches function but a pollyfill is not good enough
    // since in some cases the matches function is still missing (for example, removed nodes received from mutation observer)
    // so we use this function instead...
    static matches(element, selector) {
        const matchesFunc = element.matches
            || element.matchesSelector
            || element.mozMatchesSelector
            || element.msMatchesSelector
            || element.oMatchesSelector
            || element.webkitMatchesSelector
            || function (s) {
                // Get the document from the element
                const currentDocument = this.document || this.ownerDocument;

                // If we don't have a document we can't match...
                if (!currentDocument) {
                    return false;
                }

                const matches = currentDocument.querySelectorAll(s);

                let i = matches.length;
                while (--i >= 0) {
                    // Get the current item and check if it equals the element
                    // If item property is not available we use the index access (some old browsers have issues sometimes)
                    const currentItem = matches.item ? matches.item(i) : matches[i];
                    if (currentItem === this) {
                        break;
                    }
                }

                return i > -1;
            };

        return matchesFunc.call(element, selector);
    }

    //Check if the WebWorker supports fetch API: return true || false
    static isWebWorkerFetchSupported() {
        const request = "Request" in self;
        const fetchInSelf = "fetch" in self;
        //IE does not support the "Request" object at all, so the if statement is for IE browsers
        if (!request)
            return false;
        const keepAliveInRequestPrototype = "keepalive" in Request.prototype;
        return (fetchInSelf && keepAliveInRequestPrototype);
    }

    static isSubtleCryptoSupported() {
        const subtleCrypto = 'SubtleCrypto';
        return subtleCrypto in self;
    }
}
