import HttpRequestFactory from '../infrastructure/HttpRequestFactory';
import { ConfigurationDefaultValues } from "../../worker/communication/ConfigurationDefaultValues";


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

/**
 * This function brings the original implementation of a function. Used for cases
 * that the website is overriding one of the window functions such as Date.now (PurePoint).
 * The function is only good for functions and objects on the window and not on the document since
 * it is not waiting for the iframe document to be in readyState == 4. If we will wait we will have to
 * make this function async and it breaks the flow of the code.
 */
const getNativeWindowFn = (function () {
    let iFrame = null;

    return function (objectName, objectImplementation, callback) {
        const getNativeCode = function () {
            return objectImplementation;
        };
        const testNativeCode = function () {
            return objectImplementation.toString().indexOf('[native code]') > -1;
        };

        if (!testNativeCode()) {
            let timerInterval = 0;

            // a timer function to check if the contentWindow's readyState is complete
            const timerFunction = function () {
                if (iFrame.contentWindow) {
                    const contentWindow = iFrame.contentWindow;
                    const objPropsArray = objectName.split('.');
                    let returnedObject = contentWindow;
                    for (let objPropIndex = 0; objPropIndex < objPropsArray.length; objPropIndex++) {
                        returnedObject = returnedObject[objPropsArray[objPropIndex]];
                    }
                    // document.documentElement.removeChild(iFrame);
                    callback(returnedObject);
                } else if (timerInterval < 45) { // This part should never happen, since the iFrame.contentWindow should always exist, but...
                    setTimeout(timerFunction, timerInterval);
                    timerInterval++;
                } else {
                    // The iFrame is not loaded
                    callback(getNativeCode()); // return the current obj
                }
            };
            if (!iFrame) {
                iFrame = document.createElement('IFRAME');
                //use sandbox to allow the minimum level of capability necessary for the content of the iframe
                //to do it's job
                iFrame.setAttribute('sandbox', 'allow-same-origin');

                iFrame.style.display = 'none';
                document.documentElement.appendChild(iFrame);
            }
            timerFunction();
        } else {
            callback(getNativeCode());
        }
    };
}());


export default class CDUtils {
    static scriptVersion = "@@scriptVersion";

    static isPassiveSupported = isPassiveSupported();

    static dateNow = Date.now;

    static setZeroTimeout = (function () {
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
    }())

    static asyncCall = function (thisParam, ...args) {
        const me = this;
        CDUtils.setZeroTimeout(function () {
            me.apply(thisParam || window, args);
        });
    }

    static asyncTimeoutCall = function (thisParam, ...args) {
        const me = this;
        setTimeout(function () {
            me.apply(thisParam || window, args);
        }, 0);
    }

    static isUndefinedNull(x) {
        return (x === null || x === undefined || typeof (x) === 'undefined');
    }

    static isBoolean(x) {
        return typeof x === 'boolean';
    }

    static isNumber(x) {
        return typeof x === 'number';
    }

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

    static hasProtocol(serverURL) {
        return serverURL.toLowerCase().startsWith('http://') || serverURL.toLowerCase().startsWith('https://');
    }

    static clearTextFromNumbers(text) {
        if (text) {
            return text.replace(/(\d)/g, '*');
        }
        return '';
    }

     

    static getDropDownListValues(selectElem, maskingService) {
        const options = [];
        for (let i = 0; i < selectElem.length; i++) {
            const optionTxt = selectElem.options[i].text || selectElem.options[i].value || '';
            options.push(maskingService.maskText(optionTxt, selectElem.id));
        }

        return options;
    }

    static getDocUrl() {
        const winLocation = window.location;
        // we do not take the 'search' part since it may contain private data
        return winLocation.protocol + '//'
            + winLocation.hostname
            + (winLocation.port ? ':' + winLocation.port : '')
            // in case the pathname contains a series of numbers we fear that it may contain private data and we replace it
            + CDUtils.clearTextFromNumbers(winLocation.pathname);
    }

     
    static getHash(e) {
        // https://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
        let r = 0;
        for (let i = 0, len = e.length; i < len; i++) {
            r = (r << 5) - r + e.charCodeAt(i);
            r &= r;
        }
        return r;
    }

     

    static getTruncatedHash(e, index) {
        if (!e) {
            return '';
        }
        const hash = this.murmurhash3(e);
        return hash.toString().substring(index);
    }

    /**
     * Provide a digest method for the given algorithm.
     * @param algorithm
     * @returns {null|digestMethod} - the digest method for the given algorithm or null if not supported
     */
    static getDigestMethod(algorithm) {
        if (algorithm === 'SHA-256') {
            // window.crypto.subtle.digest is available in secure mode only
            if( window.crypto.subtle && window.crypto.subtle.digest ) {
                const digestMethod = window.crypto.subtle.digest.bind(crypto.subtle);
                return digestMethod;
            }
        }
        return null;

    }

    /**
     * This function is used to hash the given key using SHA-256 algorithm.
     * @param key
     * @returns {Promise|Promise<string>|*}
     */
    static digest_sha256(key) {

        const digestMethod = CDUtils.getDigestMethod('SHA-256');

        const msgUint8 = new TextEncoder().encode(key);

        if( digestMethod ) {
            return digestMethod("SHA-256", msgUint8)
                .then(function (hashBuffer) {
                    const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
                    const hashHex = hashArray
                        .map((b) => {return b.toString(16).padStart(2, "0")})
                        .join("");
                    return hashHex;
                })
                .catch( () => {
                    return "";
                });
        } else {
            // The window.crypto.subtly.digest method IS NOT AVAILABLE in non-secure modes
            return new Promise(function(resolve) {
                resolve("");
            });
        }
    }

    static murmurhash3(key, seed) {
        let h1;
        let h1b;
        let k1;
        let i;

        const remainder = key.length & 3; // key.length % 4
        const bytes = key.length - remainder;
        h1 = seed;
        const c1 = 0xcc9e2d51;
        const c2 = 0x1b873593;
        i = 0;

        while (i < bytes) {
            k1 = ((key.charCodeAt(i) & 0xff))
                | ((key.charCodeAt(++i) & 0xff) << 8)
                | ((key.charCodeAt(++i) & 0xff) << 16)
                | ((key.charCodeAt(++i) & 0xff) << 24);
            ++i;

            k1 = ((((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16))) & 0xffffffff;
            k1 = (k1 << 15) | (k1 >>> 17);
            k1 = ((((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16))) & 0xffffffff;

            h1 ^= k1;
            h1 = (h1 << 13) | (h1 >>> 19);
            h1b = ((((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16))) & 0xffffffff;
            h1 = (((h1b & 0xffff) + 0x6b64) + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16));
        }

        k1 = 0;

        switch (remainder) {
            case 3:
                k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
                break;
            case 2:
                k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
                break;
            case 1:
                k1 ^= (key.charCodeAt(i) & 0xff);

                k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
                k1 = (k1 << 15) | (k1 >>> 17);
                k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
                h1 ^= k1;
                break;
            default:
            // Well this shouldn't happen!!!
        }

        h1 ^= key.length;

        h1 ^= h1 >>> 16;
        h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
        h1 ^= h1 >>> 13;
        h1 = ((((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16))) & 0xffffffff;
        h1 ^= h1 >>> 16;

        return h1 >>> 0;
    }

    static generateUUID() {
        let d = CDUtils.dateNow();
        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });

        return uuid;
    }

     

    /**
     * Converts a json with event data to an array according to the order given in the arrMap.
     * Returns a new array
     * @param arrMap - the array with the prop names with the order
     * @param jsonData - the data to convert to array
     */
    static convertToArrayByMap(arrMap, jsonData) {
        const converted = [null];
        for (let i = 0, len = arrMap.length; i < len; i++) {
            converted[i + 1] = jsonData[arrMap[i]];
        }

        return converted;
    }

    static getPostUrl(url, method, data, onSuccess, onError, withCredentials, timeout) {
        const httpRequest = HttpRequestFactory.create();

        if (httpRequest instanceof self.XMLHttpRequest) {
            httpRequest.open(method, url, true);
            if (timeout !== undefined) {
                httpRequest.timeout = timeout;
            }
            httpRequest.withCredentials = withCredentials !== false;
            if (method === 'POST') {
                // get messages should not have content type, this causes options message
                httpRequest.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
            }
            httpRequest.onreadystatechange = function () {
                if (httpRequest.readyState === 4) {
                    // 204 is no response, only relevant for non wups
                    if (httpRequest.status === 204) {
                        return;
                    }
                    if (httpRequest.status === 200) {
                        onSuccess && onSuccess(httpRequest.responseText);
                    } else {
                        onError && onError(httpRequest.responseText);
                    }
                }
            };
            httpRequest.ontimeout = function () {
                onError && onError('timeout', data);
            };
            httpRequest.send(data);
        } else {
            httpRequest.onload = function () {
                onSuccess && onSuccess(httpRequest.responseText);
            };
            httpRequest.onerror = function () {
                onError && onError();
            };
            httpRequest.onprogress = function () {
            };
            httpRequest.ontimeout = function () {
            };
            httpRequest.open(method, url, true);
            // This is a workaround in IE<10 bug that aborts Cross-Domain XHR sometimes. See Commit a2ccf977b75cabce7582b4cbb45a06caa5d08f86
            setTimeout(function () {
                httpRequest.send(data);
            }, 0);
        }
    }

    static minutesToMilliseconds(minutes) {
        return minutes * 60 * 1000;
    }

    static cutDecimalPointDigits(number, lenOfDigits) {
        const prod = 10 ** lenOfDigits;
        return Math.round(number * prod) / prod;
    }

    static StorageUtils = { // TODO: temp until StorageUtils will be refactored
        counter: 0,
        // safari outputs console error for security error on trying to reach storage when disabled
        getAndUpdateEventSequenceNumber() {
            return this.counter++;
        },
        deserialize(value) {
            if (typeof value !== 'string') {
                return null;
            }
            try {
                return JSON.parse(value);
            } catch (e) {
                return value || null;
            }
        },
        getFromLocalStorage(key, useVal = undefined) {
            try {
                const data = this.deserialize(window.localStorage.getItem(key));
                if (!data) {
                    return null;
                }
                // If time has expired we abort at this point with a null result
                const isExpired = data.exp && ((CDUtils.dateNow() - data.time) > data.exp);
                if (isExpired) {
                    this.removeFromLocalStorage(key)
                    return null;
                }

                if (useVal === undefined || useVal) {
                    return data.val;
                }

                return data;
            } catch (e) {
                return null;
            }
        },
        saveToLocalStorage(key, value, expiration) {
            const dataObj = { val: value };
            if (expiration) {
                dataObj.exp = expiration;
                dataObj.time = CDUtils.dateNow();
            }
            try { // fails on safari private browsing
                window.localStorage.setItem(key, JSON.stringify(dataObj));
            } catch (e) {
                return null;
            }
            return dataObj;
        },
        removeFromLocalStorage(key) {
            try {
                window.localStorage.removeItem(key);
            } catch (e) {
                return null;
            }
        },
        setExpirationInLocalStorage(key, expirationTime) {
            let val = this.getFromLocalStorage(key);
            if (val === '' || val === null) {
                return ConfigurationDefaultValues.VALUE_DID_NOT_EXIST;
            }
            return this.saveToLocalStorage(key, val, expirationTime) ? ConfigurationDefaultValues.SUCCESS_IN_CHANGED_EXPIRATION : ConfigurationDefaultValues.FAILURE_IN_CHANGED_EXPIRATION;
        },
        getFromSessionStorage(key) {
            try {
                const data = this.deserialize(window.sessionStorage.getItem(key));
                if (!data) {
                    return null;
                }
                return data;
            } catch (e) {
                return null;
            }
        },
        saveToSessionStorage(key, value) {
            try {
                if (!value) {
                    return window.sessionStorage.removeItem(key);
                }
                // fails on safari private browsing
                window.sessionStorage.setItem(key, JSON.stringify(value));
                return value;
            } catch (e) {
                return null;
            }
        },
        removeFromSessionStorage(key) {
            try {
                window.sessionStorage.removeItem(key);
            } catch (e) {
                return null;
            }
        },
        getCookie(key) {
            const result = new RegExp('(?:^|; )' + encodeURIComponent(key) + '=([^;]*)').exec(document.cookie);
            return (result ? decodeURIComponent(result[1]) : '');
        },
        setCookie(key, value, miliSec, isSecureSameSite) {
            // we are trying to set the cookie on the domain that will include also sub-domains.
            // But if the upper domain is a top level domain (e.g co.il) we will fail so we set on the current
            // host. See https://developers.livechatinc.com/blog/setting-cookies-to-subdomains-in-javascript/

            // Prepare the expires attribute of the cookie string
            let expiresAttribute = '';
            if (miliSec) {
                const d = new Date();
                d.setTime(d.getTime() + miliSec);
                expiresAttribute = '; expires=' + d.toUTCString();
            }

            let i = 0;
            let domainName = location.hostname;
            const domainParts = domainName.split('.');
            let domainAttribute = '';
            let isCookieSetSuccessfully = false;

            // Go over the domain sub labels until we either reach the end of the parts list or are able to get the cookie which means it was set successfully
            while (i <= domainParts.length - 1 && !isCookieSetSuccessfully) {
                // Get domain parts starting from end
                domainName = domainParts.slice(-1 - (++i)).join('.');

                // If its localhost we don't define a domain attribute because it doesn't work and is not needed
                if (domainName === 'localhost') {
                    domainAttribute = '';
                } else if (domainName !== '') {
                    domainAttribute = '; domain=.' + domainName;
                }

                isCookieSetSuccessfully = this.setCookieWithAttributes(key, value, expiresAttribute, domainAttribute, isSecureSameSite);
            }

            // In case we failed setting the cookie until now we remove the domain attribute
            // so that the default host of the current document be used
            if (!isCookieSetSuccessfully) {
                domainAttribute = '';
                isCookieSetSuccessfully = this.setCookieWithAttributes(key, value, expiresAttribute, domainAttribute, isSecureSameSite);
            }

            return isCookieSetSuccessfully;
        },
        setCookieWithAttributes(key, value, expiresAttribute, domainAttribute, isSecureSameSite) {
            const sameSite = 'SameSite=None;'
            const secure = 'Secure'
            const cookieString = encodeURIComponent(key) + '=' + encodeURIComponent(value) + expiresAttribute + domainAttribute + '; path=/;';
            document.cookie = isSecureSameSite ? cookieString + ` ${sameSite} ${secure}` : cookieString;

            return this.getCookie(key) === value;
        },
        setExpirationInCookie(key, expirationTime) {
            let val = this.getCookie(key);
            if (val === '' || val === null) {
                return ConfigurationDefaultValues.VALUE_DID_NOT_EXIST;
            }
            return this.setCookie(key, val, expirationTime) ? ConfigurationDefaultValues.SUCCESS_IN_CHANGED_EXPIRATION : ConfigurationDefaultValues.FAILURE_IN_CHANGED_EXPIRATION;

        },
        removeCookie(key) {
            try {
                document.cookie = key + '=; Max-Age=0';
            } catch (e) {
                return null;
            }
        },
        validateBcId(bcId) {
            // first part - optional timestamp and then the structure for GUID
            if (/^([0-9]{13,}-)?[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bcId)) {
                return bcId;
            }
            return null;
        },
    }

    static getNativeWindowFn = getNativeWindowFn

    static JQueryUtils = {
        /**
         * Check if JQuery scripts are loaded
         * @returns {boolean}
         */
        isJQueryAvailable() {
            return window.jQuery !== undefined;
        },

        /**
         * Add an event listener using jQuery
         * @param element
         * @param type
         * @param handler
         */
        addEventListener(element, type, handler) {
            jQuery(element).on(type, handler);
        },

        /**
         * Remove an event listener using jQuery
         * @param element
         * @param type
         * @param handler
         */
        removeEventListener(element, type, handler) {
            jQuery(element).off(type, handler);
        },
    }
}

(function dateNowFixer() {
    if (!Date.now) {
        CDUtils.dateNow = function now() {
            return new Date().getTime();
        };
    } else {
        getNativeWindowFn('Date.now', Date.now, function (dateNow) {
            CDUtils.dateNow = dateNow;
        });
    }
}());
