import {ConfigurationFields} from "../core/configuration/ConfigurationFields";

export default class StorageUtilsWrapper {
    constructor(utils, configurationRepository) {
        this.isSecureSameSite = configurationRepository.get(ConfigurationFields.enableSameSiteNoneAndSecureCookies);
        this._utils = utils;
    }

    getCookie(key) {
        return this._utils.StorageUtils.getCookie(key);
    }

    setCookie(key, value, miliSec) {
        return this._utils.StorageUtils.setCookie(key, value, miliSec, this.isSecureSameSite);
    }
    //returns 0 upon set success, -1 upon set failure, 0 if cookie dose not exist
    setExpirationInCookie(key, expirationTime){
        return this._utils.StorageUtils.setExpirationInCookie(key, expirationTime)
    }
    getFromLocalStorage(key) {
        return this._utils.StorageUtils.getFromLocalStorage(key);
    }

    saveToLocalStorage(key, value, expiration) {
        return this._utils.StorageUtils.saveToLocalStorage(key, value, expiration);
    }
    //returns 0 upon set success, -1 upon set failure, 0 if cookie dose not exist
    setExpirationInLocalStorage(key, expirationTime){
       return this._utils.StorageUtils.setExpirationInLocalStorage(key, expirationTime);
    }

    removeFromLocalStorage(key) {
        return this._utils.StorageUtils.removeFromLocalStorage(key);
    }

    removeCookie(key) {
        return this._utils.StorageUtils.removeCookie(key);
    }
}
