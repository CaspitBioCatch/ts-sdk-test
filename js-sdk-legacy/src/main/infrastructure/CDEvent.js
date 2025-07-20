export default class CDEvent {
    constructor() {
        this._listeners = [];
    }

    subscribe(listener) {
        this._listeners.push(listener);
    }

    publish(args) {
        for (let i = 0, len = this._listeners.length; i < len; i++) {
            this._listeners[i](args);
        }
    }

    unsubscribe(callback) {
        for (let i = 0, len = this._listeners.length; i < len; i++) {
            if (callback === this._listeners[i]) {
                this._listeners.splice(i, 1);
                break;
            }
        }
    }
}
