/**
 * This Class handles working with the the script list obtained from the dom, save the collected scripts and helps
 * to check if a specific script was already collected
 */
export default class ScriptsRepository {
    constructor(utils) {
        this._utils = utils;
        this._scriptList = [];
    }

    count() {
        return this._scriptList.length;
    }

    /**
     *
     * @param script - an object with {src, text}
     * @returns {boolean}
     */
    exists(script) {
        // make sure to remove long numbers which might be ID's
        if (/\d\d\d/.test(script.src)) {
            script.src = this._utils.clearTextFromNumbers(script.src);
        }
        const textHash = this._utils.getHash(script.text);
        for (let j = 0; j < this._scriptList.length; j++) {
            // the field has to contain a value, or source, or hash != 0
            if ((script.src && script.src === this._scriptList[j].src)
                || (textHash && textHash === this._scriptList[j].textHash)) {
                return true;
            }
        }
        return false;
    }

    /**
     * add to list
     * @param scriptReference - an object with {src, text}
     */
    add(scriptReference) {
        scriptReference.textHash = this._utils.getHash(scriptReference.text);
        if (/\d\d\d/.test(scriptReference.src)) {
            scriptReference.src = this._utils.clearTextFromNumbers(scriptReference.src);
        }
        this._scriptList.push({ src: scriptReference.src, textHash: scriptReference.textHash });
    }
}
