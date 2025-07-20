import { btoa } from '../utils/Btoa';

const msgpack = require('../libs/msgpack.min');
const pako = require('../libs/pako.min');

export default class DataPacker {
    constructor() {
        this._compressData = function (data) {
            let compressed = msgpack.encode(data);
            compressed = pako.deflateRaw(compressed, { to: 'string' });
            // exports.btoa is the browser one if exist or the one we bring with us (Btoa.js) if not
            return btoa(compressed);
        };
    }

    pack(data) {
        return this._getCompressedData(data);
    }

    _getCompressedData(data) {
        return this._compressData(data);
    }
}
