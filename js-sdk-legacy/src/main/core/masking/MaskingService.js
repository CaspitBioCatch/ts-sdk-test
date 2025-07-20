import {ControlsKeyTable} from "../../collectors/events/ControlsKeyTable";
import {ConfigurationFields} from "../configuration/ConfigurationFields";
import Log from "../../technicalServices/log/Logger";

export const defaultMaskedCoordinates = -1000;

export default class MaskingService {
    constructor(configurationRepository) {
        this._configurationRepository = configurationRepository;
        this._attributesToMask = this._configurationRepository.get(ConfigurationFields.maskElementsAttributes)

        this.maskedCodeMapping = {
            original: (code, charCode, key) => {
                return {code, charCode, key};
            },
            numpadKey: (key) => {
                return {code: 'Numpad', charCode: 96, key};
            },
            letter: () => {
                return {code: 'Key', charCode: 65, key: 'A'};
            },
            digit: () => {
                return {code: 'Digit', charCode: 49, key: '1'};
            },
            specialChar: () => {
                return {code: 'SpecialChar', charCode: 42, key: '*'};
            },
            other: () => {
                return {code: 'Other', charCode: 66, key: 'B'};
            },
            masked: () => {
                return {code: 'Masked', charCode: 'a'.charCodeAt(0), key: 'a'};
            },
        };

        this.digitMaskValue = "1";
        this.letterMaskValueLowerCase = "a";
        this.unicodeMaskValue = "B";
        this.specialCharMaskValue = "*";
        this.customPasswordMaskValue = "a";

        // Sets for faster lookup
        this.specialConfigurationChars = new Set([",", ".", " ", "@", ";", ":", "-", "+", "$"]);
        this.specialChars = new Set(["_", "!", "%", "^", "&", "*", "#", "(", ")", "=", "{", "}", "[", "]", "’", "\\", "|", "/", "?", ">", "<", "~", "\"", "±", "§", "'"]);

        this.lettersSet = new Set([...Array(26)].map((_, i) => String.fromCharCode(65 + i)) // A-Z
            .concat([...Array(26)].map((_, i) => String.fromCharCode(97 + i))) // a-z
            .concat([...Array(27)].map((_, i) => String.fromCharCode(0x05D0 + i))) // Hebrew (א-ת)
        );

        this.digitsSet = new Set([...Array(10)].map((_, i) => String(i))); // "0-9"
        this.cjkNumbersSet = new Set([
            "〇", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "百", "千", "万", "零",
            "壹", "貳", "贰", "參", "叁", "肆", "伍", "陸", "陆", "柒", "捌", "玖", "拾", "佰", "仟", "萬",
            "〡", "〢", "〣", "〤", "〥", "〦", "〧", "〨", "〩", "〸", "〹", "〺"
        ]);

        this.allowedUnmaskedChars = new Set([",", ".", "@", ";", ":", "-", "+", "$", " "]);
        this.allowedMaskedChars = new Set(["a", "1", "*"]); // Allowed after masking

    }

    maskKey(key, code, elementID) {

        if (this._isPasswordMaskedElementId(elementID)) {
            return this.maskedCodeMapping.masked()
        }

        if (ControlsKeyTable[key]) {
            const controlsCode = ControlsKeyTable[key];
            return this.maskedCodeMapping.original(code, controlsCode, key);
        }
        if (this._isANumberOrDigit(key)) {
            return (code.includes('Numpad')) ? this.maskedCodeMapping.numpadKey('1') : this.maskedCodeMapping.digit();
        }
        if (this._isALetter(key)) {
            return this.maskedCodeMapping.letter();
        }
        if (!(this._configurationRepository.get(ConfigurationFields.keyEventsMaskSpecialChars)) && this.specialConfigurationChars.has(key)) {
            return this.maskedCodeMapping.original(code, key.charCodeAt(0), key);
        }

        if (this.specialChars.has(key) || this.specialConfigurationChars.has(key)) {
            return (code.includes('Numpad')) ? this.maskedCodeMapping.numpadKey('*') : this.maskedCodeMapping.specialChar();
        }

        return this.maskedCodeMapping.other();
    }

    /**
     * If the browser is not supporting e.key we will fallback to Legacy Properties(keycode and which)
     * Convert legacy to key value String
     * Pay attention that this will cause difference between keyDown/Up to Press
     * @returns String
     */
    getKeyFromLegacyProperties(e) {
        const key = e.keyCode || e.which;
        if (key === 0 || key === undefined) {
            return '';
        }
        return String.fromCharCode(key);
    }

    _isALetter(key) {
        return /^[a-zA-Z]$/.test(key) || this._isJapaneseOrChineseLetter(key) || this._isHebrewLetter(key);
    }

    _isANumberOrDigit(key) {
        return /[0-9]/.test(key) ||
            this.cjkNumbersSet.has(key)
    }

    _isJapaneseOrChineseLetter(key) {
        return this._isCJKUnifiedIdeographs(key) ||
            this._isCJKUnifiedIdeographsExtenA(key) ||
            this._isCJKUnifiedIdeographsExtenB(key) ||
            this._isSmallKatakanaLetter(key);
    }

    _isCJKUnifiedIdeographsExtenB(key) {
        return (/[\u3041-\u309F]/.test(key));
    }

    _isSmallKatakanaLetter(key) {
        return (/[\u30A1-\u30FF]/.test(key));
    }

    _isCJKUnifiedIdeographsExtenA(key) {
        return (/[\u3400-\u4DB5]/.test(key));
    }

    _isCJKUnifiedIdeographs(key) {
        return (/[\u4E00-\u9FCC]/.test(key));
    }

    _isHebrewLetter(key) {
        return (/[\u05D0-\u05EA]/.test(key));
    }

    _isPasswordMaskedElementId(elementID) {
        const passwordIdMaskingList = this._configurationRepository.get(ConfigurationFields.passwordIdMaskingList);
        return (typeof elementID !== 'undefined' && Array.isArray(passwordIdMaskingList) && passwordIdMaskingList.includes(elementID));
    }

    getDropDownListValues(selectElem) {
        const options = [];
        for (let i = 0; i < selectElem.length; i++) {
            const optionTxt = selectElem.options[i].text || selectElem.options[i].value || '';
            options.push(this.maskText(optionTxt, selectElem.id));
        }

        return options;
    }


    /**
     * maskText
     * letters shall be masked as “ a “
     * numbers / Numpads should be masked as  “ 1 “
     * special characters shall be masked as ” * ”
     * if keyEventsMaskSpecialChars is "true" Special Configuration characters will masked as “ * ” else they will not be masked original
     * all other characters 'B';
     * @param text - text to be masked
     * @returns string
     */
    maskText(text, elementID) {
        if (!text) return "";

        if (this._isPasswordMaskedElementId(elementID)) {
            return text.replace(/./g, this.customPasswordMaskValue);
        }

        let result = [...text].map(char => {
            if (this.digitsSet.has(char)) return this.digitMaskValue;  // Numbers → "1"
            if (this.lettersSet.has(char)) return this.letterMaskValueLowerCase; // Letters → "a"
            if (this.cjkNumbersSet.has(char)) return this.digitMaskValue; // CJK Numbers → "1"
            if (this.specialChars.has(char)) return this.specialCharMaskValue; // Special Chars → "*"
            if (this.allowedUnmaskedChars.has(char)) return char; // Exception Chars → Keep as is
            return this.unicodeMaskValue; // All other Unicode → "B"
        }).join("");

        // Handling masking configuration
        if (this._configurationRepository.get(ConfigurationFields.keyEventsMaskSpecialChars)) {
            // If keyEventsMaskSpecialChars is enabled, mask exception characters and apply strict masking
            result = [...result]
                .map(char => this.allowedUnmaskedChars.has(char) ? this.specialCharMaskValue : char)
                .map(char => !this.allowedMaskedChars.has(char) ? this.unicodeMaskValue : char)
                .join("");

            return result;
        }

        return result
    }

    maskAbsoluteIfRequired(elementValue, elemID) {
        if (elementValue !== '' && this._shouldMask(elementValue)) {
            return this.maskText(elementValue, elemID)
        }
        return elementValue;
    }

    shouldMaskCoordinates() {
        return this._configurationRepository.get(ConfigurationFields.enableCoordinatesMasking);
    }

    _shouldMask(elementValue) {
        if (typeof this._attributesToMask === 'undefined') {
            return false
        }
        return this._attributesToMask.some((element) => {
                return this._isConformsRegex(element.regexPattern, elementValue) ||
                    element.name.toLowerCase() === elementValue?.toLowerCase();
            }
        );
    }

    _isConformsRegex(regexPattern, stringToCheck) {
        try {
            if (new RegExp(regexPattern).test(stringToCheck)) {
                Log.debug(`The string ${stringToCheck} matches the pattern ${regexPattern}.`);
                return true
            }
        } catch (error) {
            Log.error(`Invalid regex pattern: ${error}`)
        }
        Log.debug(`The string ${stringToCheck} does not match the pattern. ${regexPattern}.`);
        return false
    }
}
