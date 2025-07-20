import Log from '../technicalServices/log/Logger';

export default class MuidService {
    constructor(utils, dataQ, storageUtilsWrapper, configurationRepository) {
        this.muid = null;
        this._utils = utils;
        this._storageUtilsWrapper = storageUtilsWrapper
        this._dataQ = dataQ;
        this._configurationRepository = configurationRepository;
        this.EXPIRATION = utils.minutesToMilliseconds(365 * 24 * 60);
    }

    /**
     * Try and keep the muid - machine uid for ever. save in cookie and storage, and
     * use the one that exists if it does, and always save again for a year expiration
     * and eventually send to server
     */
    initMuid() {
        // Try to find muid in either cookie or local storage
        const tempCookie = this._storageUtilsWrapper.getCookie('bmuid');
        const tempStorage = this._storageUtilsWrapper.getFromLocalStorage('bmuid');
        this.muid = tempCookie || tempStorage; // if either one of them exists
        this.muid = this._utils.StorageUtils.validateBcId(this.muid);

        // If muid was not found in storage we generate one
        if (!this.muid) {
            this.muid = this._utils.dateNow() + '-' + this._utils.generateUUID().toUpperCase();
            Log.info(`Generated a new muid: ${this.muid}`);
        }

        this._saveAndSendMuid();
        Log.info(`Muid is: ${this.muid}`);
    }

    updateMuid(restoredMuid){
        if(!restoredMuid){
            Log.warn('MUID is not defined');
            return;
        }
        this.muid = restoredMuid;
        this.muid = this._utils.StorageUtils.validateBcId(this.muid);

        if(!this.muid){
            Log.warn('Invalid format of restored MUID');
            return;
        }

        this._saveAndSendMuid();
        Log.info(`Restored MUID is: ${this.muid}`);
    }

    _saveAndSendMuid(){
        this._setStorageAndCookieKey();
        this._addMuidToQueue();
    }

    // Save muid to cookie and local storage
    _setStorageAndCookieKey(){
        this._storageUtilsWrapper.setCookie('bmuid',this.muid,this.EXPIRATION);
        this._storageUtilsWrapper.saveToLocalStorage('bmuid',this.muid);
    }

    // Send muid to server
    _addMuidToQueue(){
        this._dataQ.addToQueue('static_fields',['muid',this.muid],false);
    }


}
