import Log from '../../technicalServices/log/Logger';
import {ConfigurationDefaultValues} from "../../../worker/communication/ConfigurationDefaultValues";
import {ConfigurationFields} from "../configuration/ConfigurationFields";

/**
 * Class handles work with the persistent storage of the sid. It works with both localstorage and cookie to provide
 * read and write operations
 */
export default class SidRepository {
    constructor(utils, storageUtilsWrapper, configurationRepository) {
        this.sidKey = 'cdSNum';
        this._utils = utils;
        this._storageUtilsWrapper = storageUtilsWrapper
        this.COOKIE_EXPIRATION_IN_MILLISECONDS = this.getExpirationTime(configurationRepository);

    }
    onConfigUpdate(configurationRepository){
        let updatedExpirationTime = this.getExpirationTime(configurationRepository)
        if(this._setExpirationTime(updatedExpirationTime)) {
            this.COOKIE_EXPIRATION_IN_MILLISECONDS = updatedExpirationTime;
        }
    }
    getExpirationTime(configurationRepository){
        let cdsNumExpirationTime = configurationRepository.get(ConfigurationFields.cdsNumExpirationTime)
        return this._utils.minutesToMilliseconds(this._validateCDSNumExpirationTime(cdsNumExpirationTime));
    }
    _validateCDSNumExpirationTime(cdsNumExpirationTime){
        if (cdsNumExpirationTime < ConfigurationDefaultValues. MIN_CDS_NUM_EXPIRATION_TIME || cdsNumExpirationTime > ConfigurationDefaultValues. MAX_CDS_NUM_EXPIRATION_TIME){
            return ConfigurationDefaultValues. DEFAULT_CDS_NUM_EXPIRATION_TIME
        }
        return cdsNumExpirationTime
    }
    _setExpirationTime(expirationTime) {
        // Set expiration both to local storage and to cookie
        if (this._storageUtilsWrapper.setExpirationInCookie(this.sidKey,expirationTime) === ConfigurationDefaultValues.FAILURE_IN_CHANGED_EXPIRATION){
            Log.warn(`Failed set expiration time ${expirationTime} in cookie.`);
            return false;
        }
        if (this._storageUtilsWrapper.setExpirationInLocalStorage(this.sidKey, expirationTime) === ConfigurationDefaultValues.FAILURE_IN_CHANGED_EXPIRATION) {
            Log.warn(`Failed set expiration time ${expirationTime} in local storage.`);
            this._storageUtilsWrapper.setExpirationInCookie(this.sidKey, this._utils.minutesToMilliseconds(ConfigurationDefaultValues.DEFAULT_CDS_NUM_EXPIRATION_TIME));
            return false;
        }
        return true;
    }

    /**
     * Get the sid from the storage. Will try to load it from the cookie and if not found will try the local storage
     * Reason for this order is that cookies are more resilient to domain changes
     * @returns The stored sid or null if not found
     */
    get() {
        // First try to get the sid from the cookie and validate it.
        const sidFromCookie = this._storageUtilsWrapper.getCookie(this.sidKey);
        let sid = this._validateSid(sidFromCookie);

        // If the sid doesn't exist or was not valid we try to get it from the local storage
        if (!sid) {
            Log.info('Sid was not found in cookie. Trying to get it from the local storage.');
            const sidFromLocalStorage = this._storageUtilsWrapper.getFromLocalStorage(this.sidKey);
            sid = this._validateSid(sidFromLocalStorage);

            if (!sid) {
                Log.info('Sid was not found in local storage.');
                return null;
            }
        }

        return sid;
    }

    /**
     * store the data in localStorage or in cookie for session
     * @param sid - The updated sid
     */
    set(sid) {
        let val = sid;
        val = this._validateSid(val);
        if (!val) {
            Log.error(`Sid ${sid} is invalid. Will not save it.`);
            return;
        }

        // Save both to local storage and to cookie
        if (!this._storageUtilsWrapper.saveToLocalStorage(this.sidKey, val, this.COOKIE_EXPIRATION_IN_MILLISECONDS)) {
            Log.error(`Failed saving sid ${sid} to local storage.`);
        }

        // Set the sid cookie. We use the cookie expiration configuration to prevent expiration at end of session
        if (!this._storageUtilsWrapper.setCookie(this.sidKey, val, this.COOKIE_EXPIRATION_IN_MILLISECONDS)) {
            Log.error(`Failed saving sid ${sid} to cookie.`);
        }
    }

    /**
     * validates the sid
     * @param sidFull
     */
    _validateSid(sidFull) {
        return sidFull || null;
    }
}
