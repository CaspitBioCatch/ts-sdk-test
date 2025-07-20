import { ConfigurationFields } from '../core/configuration/ConfigurationFields';

export default class CustomInputElementSettings {
    constructor(customInputElementSettings) {
        this._parentElementSelector = customInputElementSettings
            ? customInputElementSettings[ConfigurationFields.parentElementSelector]
            : null;
        this._childElementWithCustomAttribute = customInputElementSettings
            ? customInputElementSettings[ConfigurationFields.childElementWithCustomAttribute]
            : null;
        this._elementDataAttribute = customInputElementSettings
            ? customInputElementSettings[ConfigurationFields.elementDataAttribute]
            : null;
        this._customButtons = customInputElementSettings
            ? customInputElementSettings[ConfigurationFields.customButtons]
            : null;
    }

    getParentElementSelector() {
        return this._parentElementSelector;
    }

    getChildElementWithCustomAttribute() {
        return this._childElementWithCustomAttribute;
    }

    getElementDataAttribute() {
        return this._elementDataAttribute;
    }

    getCustomButtons() {
        return this._customButtons;
    }
}
