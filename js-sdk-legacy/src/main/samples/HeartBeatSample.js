/**
 Once page is loaded, call startListen method to start listen to heartBeat messages
 */
export default class HeartBeatSample {
    constructor(heartBeatIntervalMs = 5000, maxCheckAttempts = 3) {
        this.heartBeatEventsCounter = 0;
        this.heartBeatStatus = '';
        this.heartBeatInterval = heartBeatIntervalMs;
        this.maxCheckAttempts = maxCheckAttempts;
    }

    startListen() {
        this._setHeartBeatListener();
        setInterval(this._checkHeartBeatStatus.bind(this), this.heartBeatInterval);
    }

    _setHeartBeatListener() {
        window.addEventListener('message', (event) => {
            if (event.data.type === 'cdHeartbeat') {
                this.heartBeatEventsCounter += 1;
                this.heartBeatStatus = event.data.data;
            }
        });
    }

    _checkHeartBeatStatus() {
        this.maxCheckAttempts -= 1;
        if (this.maxCheckAttempts === 0) {
            // here a REPORT_ACTION should be taken(refer to the bottom of the file)
        }
        if (this.heartBeatStatus === 'Ok') {
            // write to log || update status
        } else if (typeof (this.heartBeatStatus) === 'object') {
            console.log("heartBeat errors:");
            this.heartBeatStatus.map(errorNumber => console.log(errorNumber));
            // here a REPORT_ACTION should be taken(refer to the bottom of the file)
        }
    }
}

/**
 * REPORT_ACTION
 * An API request should be sent to BioCatch server with the following information:

 "action":"update"

 "jsStatus":"js_unavailable"/”error(X)”

 "uuid":"<uuid>"

 "customerSessionID":"<csid>"

 "brand":"<brand>"

 "customerID":"<cid>"

 "userAgent":"<userAgent>"
 */
