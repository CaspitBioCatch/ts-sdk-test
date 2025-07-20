import DataCollector from '../DataCollector';

const featureSettings = {
    configKey: 'isPrintEvents',
    isDefault: false,
    shouldRunPerContext: false,
    shouldRunPerSession: false,
    shouldRun: false,
    isFrameRelated: false,
    runInSlave: false,
    runInLean: false,
    runInUns: false,
    isRunning: false,
    instance: null,
};

export const PrintEventType = {
    printDialogOpened: 1,
    printDialogClosed: 0,
};

export const EventStructure = ['eventSequence', 'timestamp', 'printDialogState'];

export default class PrintEventCollector extends DataCollector {
    static getDefaultSettings() {
        return featureSettings;
    }

    constructor(utils, dataQueue) {
        super();

        this._utils = utils;
        this._dataQueue = dataQueue;
        this._addToEventQueueFunc = this._addToEventQueue.bind(this);
        this._myAfterPrintFunc = this._myAfterPrint.bind(this);
    }

    _myAfterPrint() {
        this._addToEventQueueFunc(PrintEventType.printDialogClosed); // printDialogClosed = -1
        window.removeEventListener('focus', this._myAfterPrintFunc);
    }

    _onBeforePrintEvent() {
        this._addToEventQueueFunc(PrintEventType.printDialogOpened); // printDialogOpened = 1

        // "afterprint" doesn't work well for some browsers
        // All browsers dispatch a "focus" event on the window object
        // so we listen to the "focus" event to detect when the print dialog is being closed
        this._utils.addEventListener(window, 'focus', this._myAfterPrintFunc.bind(this));
    }

    // (1, -1) = (print dialog opened, print dialog closed)
    _addToEventQueue(printDialogState) {
        const time = this.getEventTimestamp();
        const eventSeq = this._utils.StorageUtils.getAndUpdateEventSequenceNumber();

        this._dataQueue.addToQueue('print_events',
            this._utils.convertToArrayByMap(EventStructure,
                {
                    eventSequence: eventSeq,
                    timestamp: time,
                    printDialogState,
                }));
    }

    startFeature() {
        this._utils.addEventListener(window, 'beforeprint', this._onBeforePrintEvent.bind(this));
    }

    stopFeature() {
        this._utils.removeEventListener(window, 'beforeprint', this._onBeforePrintEvent.bind(this), true);
    }
}
