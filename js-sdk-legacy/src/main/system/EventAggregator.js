let isPassiveSupported = false;

(() => {
    try {
        // Test via a getter in the options object to see if the passive property is accessed
        // browsers throw exception if addEventListener gets an object and not boolean for third param
        const opts = Object.defineProperty({}, 'passive', {
            get() {
                isPassiveSupported = true;
            },
        });
        window.addEventListener('test', null, opts);
    } catch (e) {
        // no support for passive
    }
})();

/**
 * Static class for performing the actual binding between the element[s] and the handler
 */
export default class EventAggregator {
    static addEventListener(target, type, handler, isCapture = false,
                            isPassive = true, isOnce = false) {
        if (isPassiveSupported) {
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
}
