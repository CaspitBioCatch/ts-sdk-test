import TestBrowserUtils from './TestBrowserUtils';
import TestFeatureSupport from './TestFeatureSupport';

/* eslint-disable no-new */
export default class TestEvents {
    static publishStorageEvent(key, newValue) {
        if (!TestBrowserUtils.isIE()) {
            window.dispatchEvent(new StorageEvent('storage', {
                key,
                newValue,
            }));
        } else {
            const se = document.createEvent('StorageEvent');
            se.initStorageEvent('storage', false, false, key, null, newValue, '/', null);
            window.dispatchEvent(se);
        }
    }

    static publishKeyboardEvent(eventType, char, key, keyCode, location, shiftKey, ctrlKey, metaKey, code, charCode) {
        let keyboardEvent = null;
        let supportsKeyboardEvent = false;
        try {
            new KeyboardEvent(eventType, {});
            supportsKeyboardEvent = true;
        } catch (e) {
            // Swallow exception
        }

        if (supportsKeyboardEvent) {
            keyboardEvent = new KeyboardEvent(eventType, {
                char,
                key,
                keyCode,
                location,
                shiftKey,
                ctrlKey,
                metaKey,
                code,
                charCode,
            });

            try {
                // Solve older browser issues in which key was not initialized in constructor.
                // Fail silently since in newer browsers the key property is readonly
                keyboardEvent.key = key;
            } catch (e) {
                // Swallow exception
            }

            window.document.dispatchEvent(keyboardEvent);
        } else {
            keyboardEvent = document.createEvent('KeyboardEvent');
            const modifiersList = shiftKey ? 'Shift' : '' + ctrlKey ? 'Control' : '' + metaKey ? 'Meta' : '';

            keyboardEvent.initKeyboardEvent(eventType, true, true, window, key, location, modifiersList, false, null);
            try {
                keyboardEvent.code = code;
            } catch (e) {
                // Swallow exception
            }

            window.document.dispatchEvent(keyboardEvent);
        }

        return keyboardEvent;
    }

    static publishMouseEvent(eventType, button, code, screenX, screenY, clientX, clientY, pageX, pageY) {
        let mouseEvent = null;
        let supportsMouseEvent = false;
        try {
            new MouseEvent(eventType, {});
            supportsMouseEvent = true;
        } catch (e) {
            // Swallow Exception
        }

        if (supportsMouseEvent) {
            mouseEvent = new MouseEvent(eventType, {
                button,
                code,
                screenX,
                screenY,
                clientX,
                clientY,
                pageX,
                pageY,
            });

            window.document.dispatchEvent(mouseEvent);
        } else {
            mouseEvent = document.createEvent('MouseEvent');
            mouseEvent.initMouseEvent(eventType, true, true, window, 0, screenX, screenY, clientX, clientY, false, false, false, false, button, null);

            window.document.dispatchEvent(mouseEvent);
        }

        return mouseEvent;
    }
    // This function work on every browser (old versions as well)
    // the function above ("publishKeyboardEvent") dont work on the old versions
    static publishKeyboardLegacyEvent(eventType, char, key, keyCode, location, shiftKey, ctrlKey, metaKey, code, charCode, which) {
        let keyboardEvent = null;
        let supportsKeyboardEvent = false;
        try {
            new Event(eventType, {});
            supportsKeyboardEvent = true;
        } catch (e) {
            // Swallow exception
        }

        if (supportsKeyboardEvent) {
            keyboardEvent = new Event(eventType);
            keyboardEvent.char = char;
            keyboardEvent.key = key;
            keyboardEvent.keyCode = keyCode;
            keyboardEvent.location = location;
            keyboardEvent.shiftKey = shiftKey;
            keyboardEvent.ctrlKey = ctrlKey;
            keyboardEvent.metaKey = metaKey;
            keyboardEvent.code = code;
            keyboardEvent.charCode = charCode;
            keyboardEvent.which = which;
            try {
                // Solve older browser issues in which key was not initialized in constructor.
                // Fail silently since in newer browsers the key property is readonly
                keyboardEvent.key = key;
            } catch (e) {
                // Swallow exception
            }

            window.document.dispatchEvent(keyboardEvent);
        } else {
            keyboardEvent = document.createEvent('KeyboardEvent');
            const modifiersList = shiftKey ? 'Shift' : '' + ctrlKey ? 'Control' : '' + metaKey ? 'Meta' : '';

            keyboardEvent.initKeyboardEvent(eventType, true, true, window, key, location, modifiersList, false, null);
            try {
                keyboardEvent.code = code;
            } catch (e) {
                // Swallow exception
            }

            window.document.dispatchEvent(keyboardEvent);
        }

        return keyboardEvent;
    }

    static publishTouchEvent(touchEvent) {
        if (!TestFeatureSupport.isTouchEventsSupported() && TestFeatureSupport.isPointerEventsSupported()) {
            touchEvent.pointerId = 1; // Field is for supporting browsers which receive PointerEvents and not TouchEvents
            touchEvent.pointerType = 'touch'; // Field is for supporting browsers which receive PointerEvents and not TouchEvents
        }

        document.dispatchEvent(touchEvent);
    }

    static publishMotionEvent(x, y, z, absolute, alpha, beta, gamma) {
        const motionEvent = new Event('devicemotion', {});
        motionEvent.accelerationIncludingGravity = { x, y, z };
        motionEvent.absolute = absolute;
        motionEvent.rotationRate = { alpha, beta, gamma };

        window.dispatchEvent(motionEvent);
    }

    static publishDeviceOrientationEvent(alpha, beta, gamma, absolute) {
        const e = new Event('deviceorientation', {});

        e.alpha = alpha;
        e.beta = beta;
        e.gamma = gamma;
        e.absolute = absolute;

        window.dispatchEvent(e);
    }
}
/* eslint-enable no-new */
