import Log from '../../technicalServices/log/Logger';

/**
 * This class is based on https://gist.github.com/cou929/7973956
 * In Edge the results are not correct. In others it seems good
 */

export default class PrivateBrowsingDetector {
    detectPrivateMode(callback) {
        if (this._isWebkitBrowser()) {
            this._detectPrivateBrowsingOnWebkit(callback);
        } else if (this._isMozillaBrowser()) {
            this._detectPrivateBrowsingOnMozilla(callback);
        } else if (this._isIE10OrLater(window.navigator.userAgent)) {
            this._detectPrivateBrowsingOnIESinceVersion10(callback);
        } else if (window.localStorage && /Safari/.test(window.navigator.userAgent)) {
            this._detectPrivateBrowsingOnSafari(callback);
        } else {
            // Undetermined result
            callback(null);
        }
    }
    
    _isWebkitBrowser() {
        return !!window.webkitRequestFileSystem;
    }

    _isMozillaBrowser() {
        return 'MozAppearance' in document.documentElement.style;
    }

    _isIE10OrLater(userAgent) {
        const ua = userAgent.toLowerCase();
        if (ua.indexOf('msie') === 0 && ua.indexOf('trident') === 0) {
            return false;
        }
        let match = /(?:msie|rv:)\s?([\d\.]+)/.exec(ua);
        if (match && parseInt(match[1], 10) >= 10) {
            return true;
        }
        // IE 10-11
        match = ('documentElement' in document && ('filters' in document.documentElement || 'documentMode' in document));
        if (match && document.documentMode) {
            const ver = parseFloat((ua.match(/.+(?:ie|rv)[\/: ]([\d.]+)/) || [])[1]);
            if (ver >= 10) {
                return true;
            }
        }
        // IE edge and compatibility
        match = /edge/.test(ua);
        const comp = !!ua.match(/trident\/7\./);
        if (match || comp) { // msieMaxVersion
            const ver = parseFloat((ua.match(/.+(?:edge|rv)[\/: ]([\d.]+)/) || [])[1]);
            if (ver >= 10) {
                return true;
            }
        }
        return false;
    }

    _detectPrivateBrowsingOnWebkit(callback) {
        if (navigator.storage !== undefined && typeof navigator.storage.estimate === 'function') {
            this._storageEstimateDetectionOnWebkit(callback);
        } else {
            this._fileSystemDetectionOnWebkit(callback);
        }
    }

    _fileSystemDetectionOnWebkit(callback) {
        window.webkitRequestFileSystem(
            window.TEMPORARY, 1,
            () => {
                callback(false);
            },
            () => {
                callback(true);
            },
        );
    }

    _storageEstimateDetectionOnWebkit(callback) {
        navigator.storage.estimate().then(({ quota }) => {
            callback(quota < 120000000);
        }).catch((error) => {
            Log.error('failed to detect private browsing', error);
        });
    }

    _detectPrivateBrowsingOnMozilla(callback) {
        try {
            const indDB = indexedDB || window.indexedDB;
            const db = indDB.open('test');
            db.onerror = () => {
                // catch on firefox
                callback(true);
            };
            db.onsuccess = () => {
                callback(false);
            };
        } catch (e) {
            callback(true);
        }
    }

    _detectPrivateBrowsingOnIESinceVersion10(callback) {
        let isPrivate = false;
        try {
            if (!window.indexedDB) {
                isPrivate = true;
            }
        } catch (e) {
            isPrivate = true;
        }

        callback(isPrivate);
    }

    _detectPrivateBrowsingOnSafari(callback) {
        let isPrivateBrowsing;
        // iOS 11 and newer Safari versions
        // Origin: https://gist.github.com/cou929/7973956#gistcomment-2272103
        try {
            window.openDatabase(null, null, null, null);
        } catch (e) {
            isPrivateBrowsing = true;
        }

        // Older Safari
        try {
            window.localStorage.setItem('test', 1);
        } catch (e) {
            isPrivateBrowsing = true;
        }

        if (!isPrivateBrowsing) {
            isPrivateBrowsing = false;
            window.localStorage.removeItem('test');
        }

        callback(isPrivateBrowsing);
    }
}
