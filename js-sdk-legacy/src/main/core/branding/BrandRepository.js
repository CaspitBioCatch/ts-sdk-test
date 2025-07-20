import Log from '../../technicalServices/log/Logger';

export default class BrandRepository {
    constructor(utils, storageUtilsWrapper) {
        this.brandKey = 'brand';
        this._utils = utils;
        this._storageUtilsWrapper = storageUtilsWrapper
        this.COOKIE_EXPIRATION_IN_MILLISECONDS = this._utils.minutesToMilliseconds(365 * 24 * 60);
    }

    get() {
        // First try to get the brand from the cookie and validate it.
        const brandFromCookie = this._storageUtilsWrapper.getCookie(this.brandKey);
        let brand = this._validateBrand(brandFromCookie);

        // If the sid doesn't exist or was not valid we try to get it from the local storage
        if (!brand) {
            Log.debug('Brand was not found in cookie. Trying to get it from the local storage.');
            const brandFromLocalStorage = this._storageUtilsWrapper.getFromLocalStorage(this.brandKey);
            brand = this._validateBrand(brandFromLocalStorage);

            if (!brand) {
                Log.debug('Brand was not found in local storage.');
                return null;
            }
        }

        return brand;
    }

    set(brand) {
        let val = this._validateBrand(brand);
        if (!val) {
            Log.error(`Brand ${brand} is invalid. Will not save it.`);
            return;
        }

        // Save both to local storage and to cookie
        if (!this._storageUtilsWrapper.saveToLocalStorage(this.brandKey, val)) {
            Log.error(`Failed saving brand ${brand} to local storage.`);
        }

        // Set the sid cookie. We use the cookie expiration configuration to prevent expiration at end of session
        if (!this._storageUtilsWrapper.setCookie(this.brandKey, val, this.COOKIE_EXPIRATION_IN_MILLISECONDS)) {
            Log.error(`Failed saving brand ${brand} to cookie.`);
        }
    }

    _validateBrand(brandFull) {
        return brandFull || null;
    }
}
