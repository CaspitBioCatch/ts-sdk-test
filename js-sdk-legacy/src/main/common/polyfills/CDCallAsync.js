import CDUtils from '../../technicalServices/CDUtils';

export default function apply() {
    // pay attention: the setZeroTimeout is the function returned from this function
    const setZeroTimeout = (function () {
        // this is inside the returned function closure
        const timeouts = [];
        const windowId = 'Window_' + CDUtils.generateUUID();

        // this is inside the returned function closure
        function receiveMessage(e) {
            if (e.data === windowId) {
                e.stopPropagation && e.stopPropagation();
                e.returnValue && (e.returnValue = false); // IE8
                e.cancelBubble && (e.cancelBubble = true); // IE8
                (timeouts.shift())(); // executes the function stored in first element of timeouts array.
            }
        }

        CDUtils.addEventListener(window, 'message', receiveMessage, true);

        // this is the function that will be called when setZeroTimeout is called
        return function (func) {
            timeouts.push(func);
            // We are using postMessage and not setTimeout with 0 since in FF there is a minimum time of 4ms
            window.postMessage(windowId, self.location.href);
        };
    }());

    /* eslint-disable no-extend-native */
    /**
     * This function is used to call a function in an async manner
     * @param thisParam
     */
    Function.prototype.cdCallAsync = function (thisParam, ...args) {
        const me = this;

        setZeroTimeout(function () {
            me.apply(thisParam || window, args);
        });
    };

    /**
     * This function is used to call a function in an async manner
     * @param thisParam
     */
    Function.prototype.cdCallAsyncWithErrorHandling = function (thisParam, onError, ...args) {
        const me = this;

        setZeroTimeout(function () {
            try {
                me.apply(thisParam || window, args);
            } catch (ex) {
                if (onError) {
                    onError(ex);
                }
            }
        });
    };
    /* eslint-enable no-extend-native */
}
