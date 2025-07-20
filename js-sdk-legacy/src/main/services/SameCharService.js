// import Log from '../technicalServices/log/Logger';
// import { MessageBusEventType } from '../events/MessageBusEventType';
/**
 * saves currently used elements and their data.
 */
export const SameCharType = {
    true: 1,
    false: 0,
    undefined: -1,
};

export default class SameCharService {
    constructor() {
        this._elementList = new WeakMap();
    }

    update(key, value) {
        this._elementList.set(key, value);
    }

    compare(key, newValue) {
        return SameCharType[newValue === this._elementList.get(key)];
    }
}
