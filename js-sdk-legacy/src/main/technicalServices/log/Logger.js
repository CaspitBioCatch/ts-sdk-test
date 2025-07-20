// eslint-disable-next-line max-classes-per-file
import { LogLevel } from './LogLevel';
import { ConfigurationFields } from '../../core/configuration/ConfigurationFields';

export default class Log {
    static setLogger(logger) {
        this._logger = logger;
    }

    static attachSessionIdentifiers(sessionIdentifiers) {
        if (!this._logger) {
            return;
        }

        return this._logger.attachSessionIdentifiers(sessionIdentifiers);
    }

    static isDebug() {
        if (!this._logger) {
            return;
        }

        return this._logger.isDebug();
    }

    static error(msg, ex) {
        if (!this._logger) {
            return;
        }

        this._logger.error(msg, ex || null);
    }

    static warn(msg, ex) {
        if (!this._logger) {
            return;
        }

        this._logger.warn(msg, ex || null);
    }

    static trace(msg) {
        if (!this._logger) {
            return;
        }

        this._logger.trace(msg);
    }

    static debug(msg) {
        if (!this._logger) {
            return;
        }

        this._logger.debug(msg);
    }

    static info(msg) {
        if (!this._logger) {
            return;
        }

        this._logger.info(msg);
    }
}

export class Logger {
    constructor(logBridge, logLevel) {
        this._logBridge = logBridge;
        this._logLevel = logLevel || LogLevel.INFO;
        this._sessionIdentifiers = {};
    }

    attachSessionIdentifiers(sessionIdentifiers) {
        // add the provided identifiers to the existing ones.
        Object.assign(this._sessionIdentifiers, sessionIdentifiers);
    }

    trace(msg) {
        this._sendToLogBridge(msg, LogLevel.DEBUG); // The server does not support trace
    }

    debug(msg) {
        this._sendToLogBridge(msg, LogLevel.DEBUG);
    }

    info(msg) {
        this._sendToLogBridge(msg, LogLevel.INFO);
    }

    warn(msg, ex) {
        this._sendToLogBridge(msg, LogLevel.WARN, ex);
    }

    error(msg, ex) {
        this._sendToLogBridge(msg, LogLevel.ERROR, ex);
    }

    isDebug() {
        return this._logLevel === LogLevel.DEBUG;
    }

    updateLogConfig(configurationRepository) {
        this._logLevel = configurationRepository.get(ConfigurationFields.logLevel) || this._logLevel;
        this._logBridge.setLogLevel(this._logLevel);
        this._logBridge.clearLogEntriesByLogLevel(this._logLevel);
    }

    _sendToLogBridge(msg, logLevel, ex) {
        if (logLevel >= this._logLevel) {
            if (ex && ex.stack) {
                msg += ` ;stack: ${ex.stack}`;
            }
            this._logBridge.log(msg, logLevel, this._sessionIdentifiers);
        }
    }
}
