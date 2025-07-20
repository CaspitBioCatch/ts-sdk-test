/*
 * A polyfill for unsupported mode. This polyfill has O(n) on all methods so its a big piece of junk but will due for our needs
 * @constructor
 */
class CDMap {
    constructor() {
        this._pairs = [];
        this.size = 0;
    }

    has(key) {
        return this._indexOf(key) > -1;
    }

    get(key) {
        const index = this._indexOf(key);
        if (index > -1) {
            return this._pairs[index][1];
        }

        return undefined;
    }

    set(key, value) {
        const index = this._indexOf(key);

        if (index > -1) {
            this._pairs[index][1] = value;
        } else {
            this._pairs.push([key, value]);
            this.size++;
        }
    }

    delete(key) {
        const index = this._indexOf(key);

        if (index > -1) {
            this._pairs.splice(index, 1);
            this.size--;
            return true;
        }

        return false;
    }

    forEach(cb) {
        for (let i = 0; i < this._pairs.length; i++) {
            cb(this._pairs[i][1], this._pairs[i][0]);
        }
    }

    clear() {
        this._pairs = [];
    }

    _indexOf(key) {
        for (let i = 0; i < this._pairs.length; i++) {
            if (this._pairs[i][0] === key) {
                return i;
            }
        }

        return -1;
    }
}

export const create = () => {
    const Ctor = self.Map || CDMap;
    return new Ctor();
};

export const createLocal = () => {
    return new CDMap();
}
