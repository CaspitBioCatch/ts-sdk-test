import LogMessage from './LogMessage';

export default class LogMessageBuilder {
    constructor(dataPacker) {
        this._dataPacker = dataPacker;
    }

    build(data) {
        const logMessage = new LogMessage();

        logMessage.setData(this._dataPacker.pack(data));

        return logMessage;
    }
}
