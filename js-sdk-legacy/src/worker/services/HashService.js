import Log from "../../main/technicalServices/log/Logger";
import {sha256Hash} from "../../main/const/hashing";
import DOMUtils from "../../main/technicalServices/DOMUtils";
import CryptoJS from 'crypto-js';

export default class HashService{

    static hashSha256(data, callback) {
        if(!DOMUtils.isSubtleCryptoSupported()) {
            Log.info('HashService: SubtleCrypto is not supported using fallback hashing');
            callback(null, CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex));
            return;
        }
        const encoder = new TextEncoder();
        const dataEncoded = encoder.encode(data);
        crypto.subtle.digest(sha256Hash, dataEncoded).then((hashBuffer) => {
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map((b) => {return b.toString(16).padStart(2, '0')}).join('');
            callback(null, hashHex);
        }).catch((error) => {
            callback(error);
        });
    }
}