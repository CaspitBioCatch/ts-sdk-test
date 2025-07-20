import DataCollector from '../DataCollector';

const featureSettings = {
    configKey: 'isScriptsFeature',
    isDefault: false,
    shouldRunPerContext: true,
    shouldRunPerSession: false,
    shouldRun: true,
    isFrameRelated: false,
    runInUns: true,
    runInSlave: false,
    runInLean: false,
    isRunning: false,
    instance: null,
};

export default class ScriptsFeature extends DataCollector {
    static getDefaultSettings() {
        return featureSettings;
    }

    constructor(dataQ, scriptsRepository) {
        super();
        this._dataQ = dataQ;
        this._timeoutValue = 1000; // timeout 1 sec
        this._scriptsRepository = scriptsRepository;
        this._runDetectionLoopBinded = this._runDetectionLoop.bind(this);
    }

    _checkScriptsData() {
        const scriptList = document.scripts;
        for (let i = 0; i < scriptList.length; i++) {
            const scriptRef = {
                src: scriptList[i].src,
                text: scriptList[i].text,
            };

            if (!this._scriptsRepository.exists(scriptRef)) {
                this._scriptsRepository.add(scriptRef);
                this._dataQ.addToQueue('scripts', [null, scriptRef.src, scriptRef.textHash]);
            }
        }
    }

    _runDetectionLoop() {
        this._checkScriptsData();

        this._timer = setTimeout(this._runDetectionLoopBinded, this._timeoutValue);
        // increase the timeout every time so we won't run this so many times
        if (this._timeoutValue < 536870911) {
            this._timeoutValue *= 4;
        }
    }

    startFeature() {
        this._runDetectionLoop();
    }

    stopFeature() {
        if (this._timer) {
            clearTimeout(this._timer);
        }
    }
}
