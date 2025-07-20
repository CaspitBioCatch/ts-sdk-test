import Log from '../technicalServices/log/Logger';

/**
 * Class catches global exceptions from our script and sends log
 */
export default class GlobalExceptionHandler {
    constructor(cdUtils, scriptName) {
        this._cdUtils = cdUtils;
        this._scriptName = scriptName;
        this._cdUtils.addEventListener(window, 'error', this._handleException.bind(this));
    }

    /**
     * validates the sid has the predefined value of timestamp-sid
     * @param error
     */
    _handleException(errorEvent) {
        if (this._scriptName && this._scriptName === errorEvent.filename) {
            const errorMessage = this._buildErrorMessage(errorEvent);
            Log.error(`caught unhandled exception. ${errorMessage}`);
        }
    }

    _buildErrorMessage(errorEvent) {
        if (!errorEvent.error) {
            return errorEvent.message;
        }

        const errorString = errorEvent.error.toString();
        const callStack = errorEvent.error.stack ? errorEvent.error.stack : '';

        return `${errorString}, Line: ${errorEvent.lineno}, Column: ${errorEvent.colno}. Stacktrace: ${callStack}`;
    }
}
