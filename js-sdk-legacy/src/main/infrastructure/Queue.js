export default class Queue {
    constructor() {
        this._buffer = [];
    }

    hasItems() {
        return this.length() > 0;
    }

    length() {
        return this._buffer.length;
    }

    enqueue(item) {
        this._buffer.push(item);
    }

    enqueueToHead(item) {
        this._buffer.unshift(item);
    }

    dequeue() {
        return this._buffer.shift();
    }

    getItem(index) {
        return this._buffer[index];
    }
}
