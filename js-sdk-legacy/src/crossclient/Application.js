export default class Application {
    /**
     * Test if localStorage is available
     */
    static localStorageAvailable() {
        try {
            const item = '__cd_ls_test__';
            window.localStorage.setItem(item, item);
            window.localStorage.removeItem(item);
            return true;
        } catch (e) {
            return e;
        }
    }

    constructor() {
        this.handleMessage = this.handleMessage.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
        this.initialize();
    }

    initialize() {
        window.addEventListener('message', this.handleMessage, false);
    }

    handleMessage(event) {
        try {
            const dataObject = JSON.parse(event.data);
            const storageResponse = this.getOrSetLocalStorageItem(dataObject);
            if (storageResponse) {
                this.sendMessage(storageResponse, event.origin);
            }
        } catch (e) {
            this.sendMessage({
                'error_message': 'Could not parse message data',
                'error_code': 0,
            });
        }
    }

    sendMessage(message, origin) {
        window.parent.postMessage(message, origin);
    }

    /**
     * Determine if local item exists and report accordingly
     * @param data {}
     */
    getOrSetLocalStorageItem(data) {
        const lstest = Application.localStorageAvailable();
        if (lstest === true) {
            const foundItems = {}; // Items found in cross client local storage
            const newItems = {}; // Items that have just been created on cross client local storage
            Object.keys(data).forEach((key) => {
                if (data.hasOwnProperty(key)) {
                    const _localItem = window.localStorage.getItem(key);
                    if (_localItem !== null) {
                        foundItems[key] = _localItem;
                    } else {
                        newItems[key] = data[key] + '__' + Date.now();
                        window.localStorage.setItem(key, newItems[key]);
                    }
                }
            });
            return {
                'found': foundItems,
                'new': newItems,
            };
        }
        this.sendMessage({
            'error_message': 'Unable to access storage',
            'error_code': lstest.code,
        });
        return false;
    }
}
