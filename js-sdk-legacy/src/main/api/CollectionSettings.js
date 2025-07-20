import ElementSettings from './ElementSettings';
import CustomInputElementSettings from './CustomInputElementSettings';
import { APIConfigurationKey } from '../contract/APIConfigurationKey';
import {AgentType} from "../contract/AgentType";
import {CollectionMode} from "../contract/CollectionMode";
import Log from "../technicalServices/log/Logger";

export default class CollectionSettings {
    constructor(collectionSettings) {
        this._elementSettings = new ElementSettings(collectionSettings?.[APIConfigurationKey.elementSettings]);
        this._customInputElementSettings = new CustomInputElementSettings(
            collectionSettings?.[APIConfigurationKey.customInputElementSettings]
        );
        this._agentType = this._validateAgentType(collectionSettings?.[APIConfigurationKey.mode]?.agentType);
        this._collectionMode = this._setAgentCollectionMode(collectionSettings?.[APIConfigurationKey.mode]?.collectionMode);
    }

    getElementSettings() {
        return this._elementSettings;
    }

    getCustomInputElementSettings() {
        return this._customInputElementSettings;
    }

    getAgentType() {
        return this._agentType;
    }

    getAgentMode() {
        return this._collectionMode;
    }

    /**
     *
     * @param collectionMode
     * @returns {string|*|string}
     * agentType: primary -> collectionMode: full
     * agentType: secondary -> collectionMode: full or lean
     */
    _setAgentCollectionMode(collectionMode) {
       if(this._agentType === AgentType.PRIMARY){
           return CollectionMode.FULL;
       }

       return this._validateAgentMode(collectionMode);
    }

    _validateAgentType(agentType) {
        if (Object.values(AgentType).includes(agentType)) {
            return agentType;
        }

        const defaultAgentType = AgentType.PRIMARY;
        if (agentType !== undefined) { // Warn only if an invalid value was actually provided
            Log.warn(`Invalid agent type: ${agentType}. Defaulting to ${defaultAgentType} agent type.`);
        }
        return defaultAgentType;
    }

    _validateAgentMode(collectionMode) {
        if (Object.values(CollectionMode).includes(collectionMode)) {
            return collectionMode;
        }

        const defaultCollectionMode = CollectionMode.LEAN;
        if (collectionMode !== undefined) { // Warn only if an invalid value was actually provided
            Log.warn(`Invalid collection mode: ${collectionMode}. Defaulting to ${defaultCollectionMode} collection mode.`);
        }
        return defaultCollectionMode;
    }
}

