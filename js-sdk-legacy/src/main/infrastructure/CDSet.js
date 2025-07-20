/*
 * A polyfill for unsupported mode. It is not a full polyfill since it does not support Object as a value and more,
 * but enough for our needs...
 * @constructor
 */
class CDSet {
    constructor() {
        this._set = [];
        this.size = 0;
    }

    add(val) {
        this._set.push(val);
        this.size++;
        return this; // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/add
    }

    has(val) {
        return this._set.indexOf(val) > -1;
    }

    delete(val) {
        for (let i = 0; i < this._set.length; i++) {
            if (this._set[i] === val) {
                this._set.splice(i, 1);
                this.size--;
                return true; // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/delete
            }
        }
        return false;
    }

    forEach(cb) {
        for (let i = 0; i < this._set.length; i++) {
            cb(this._set[i]);
        }
    }

    clear() {
        this._set = [];
    }
}

export const create = (initial_values=[]) => {
    const Ctor = self.Set || CDSet;
    const set = new Ctor();
    for(let i=0; i<initial_values.length; i++) {
        set.add(initial_values[i]);
    }
    return set;
};

export const createLocal = (initial_values=[]) => {
    const set = new CDSet();
    for(let i=0; i<initial_values.length; i++) {
        set.add(initial_values[i]);
    }
    return set;
};
