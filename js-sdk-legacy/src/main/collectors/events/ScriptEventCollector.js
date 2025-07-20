/**
 * e.target.id = testPointer
 e.target.namespaceURI = http://www.w3.org/1999/xhtml
 e.target.outerHTML = <script src="TestPointer.js" type="text/javascript" id="testPointer"></script>
 e.target.src = http://localhost:63342/TestFeature/TestPointer.js
 e.target.type = text/javascript
 */
import DataCollector from '../DataCollector';
import Log from '../../technicalServices/log/Logger';

export const ScriptEventType = {
    load: 0,
};

const featureSettings = {
    configKey: 'isScriptExecuteEve',
    isDefault: false,
    shouldRunPerContext: false,
    shouldRunPerSession: false,
    shouldRun: true,
    isFrameRelated: false,
    runInSlave: false,
    runInLean: false,
    runInUns: false,
    isRunning: false,
    instance: null,
};

export const EventStructure = ['eventSequence', 'timestamp', 'eventType', 'scriptId', 'namespaceURI', 'outerHTML', 'scriptSource', 'scriptType'];

export default class ScriptEventCollector extends DataCollector {
    static getDefaultSettings() {
        return featureSettings;
    }

    constructor(utils, dataQueue) {
        super();
        this._onScriptExecuteEventFunc = this._onScriptExecuteEvent.bind(this);
        this._dataQueue = dataQueue;
        this._utils = utils;
    }

    _onScriptExecuteEvent(e) {
        if (e && e.target && (e.type !== 'load' || e.target.nodeName.toLowerCase() === 'script')) {
            try {
                const time = this.getEventTimestamp(e);
                const eventSeq = this._utils.StorageUtils.getAndUpdateEventSequenceNumber();

                let type = ScriptEventType[e.type];
                if (this._utils.isUndefinedNull(type)) {
                    type = -1;
                }

                // the if is for performance optimization
                if (Log.isDebug()) {
                    Log.trace('got event ' + e.type + ', ' + type + ', scriptSrc: ' + e.target.src + ' at time ' + time);
                }

                this._dataQueue.addToQueue('script_events',
                    this._utils.convertToArrayByMap(EventStructure,
                        {
                            eventSequence: eventSeq,
                            timestamp: time,
                            eventType: type,
                            scriptId: e.target.id || '',
                            namespaceURI: e.target.namespaceURI || '',
                            outerHTML: e.target.outerHTML || '',
                            scriptSource: e.target.src || '',
                            scriptType: e.target.type || '',
                        }));
            } catch (err) {
                Log.error(`error on getScriptExecuteEvent ${err.toString()}`);
            }
        }
    }

    startFeature() {
        this._utils.addEventListener(document, 'load', this._onScriptExecuteEventFunc, true);
    }

    stopFeature() {
        this._utils.removeEventListener(document, 'load', this._onScriptExecuteEventFunc, true);
    }
}
