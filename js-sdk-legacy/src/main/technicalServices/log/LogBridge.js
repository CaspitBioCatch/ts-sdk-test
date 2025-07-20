import LogAggregator from "../../../worker/LogAggregator";

export default class LogBridge {
    constructor(logAggregator, url, msgPrefix = '') {
        this.sn = 0;
        this.url = url;
        this.logAggregator = logAggregator;
        this.msgPrefix = msgPrefix ;
    }

    log(msg, logLevel, sessionIdentifiers) {
        this.logAggregator.add(
            {eventName: 'log',
                data: {
                msg: this.msgPrefix + msg,
                ...sessionIdentifiers,
                url: this.url,
                level: logLevel,
                sn: this.sn++,
        }});
    }

    setLogLevel(logLevel) {
        if (this.logAggregator instanceof LogAggregator) {
            this.logAggregator.setLogLevel(logLevel);
        }
    }

    clearLogEntriesByLogLevel(logLevel) {
        this.logAggregator.filterOutByLogLevel(logLevel);
    }
}