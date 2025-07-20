import { ConfigurationFields } from '../core/configuration/ConfigurationFields';

export default class ElementSettings {
    constructor(elementSettings) {
        this._customElementAttribute = elementSettings
            ? elementSettings[ConfigurationFields.customElementAttribute]
            : null;
        this._attributesToMask = elementSettings ? elementSettings[ConfigurationFields.maskElementsAttributes] : null;
        this._keyEventsMaskSpecialChars = elementSettings
            ? elementSettings[ConfigurationFields.keyEventsMaskSpecialChars]
            : null;
    }

    getCustomElementAttribute() {
        return this._customElementAttribute;
    }

    getAttributesToMask() {
        return this._attributesToMask;
    }
    getKeyEventsMaskSpecialChars() {
        return this._keyEventsMaskSpecialChars;
    }
}
