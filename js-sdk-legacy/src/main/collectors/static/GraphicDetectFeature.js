import DataCollector from '../DataCollector';
import Log from '../../technicalServices/log/Logger';
import GraphicDetectContract from "../../contract/staticContracts/GraphicDetectContract";

const featureSettings = {
    configKey: 'isVMDetection',
    isDefault: false,
    shouldRunPerContext: false,
    shouldRunPerSession: true,
    shouldRun: true,
    isFrameRelated: false,
    runInUns: false,
    runInSlave: false,
    runInLean: false,
    isRunning: false,
    instance: null,
};

export default class GraphicDetectFeature extends DataCollector {
    static getDefaultSettings() {
        return featureSettings;
    }

    constructor(dataQ, configurations) {
        super();
        this._dataQ = dataQ;
        this._configurations = configurations;
        this.canvasId = 'cd_canvas';
    }

    startFeature() {
        try {
            if (this._configurations && this._configurations.isGraphCardEnabled()) {
                this._getMappedRenderInfo();
            }
        } catch (error) {
            Log.error(`Failed collecting Graphic Card information. ${error}`);
        }
    }

    /**
     * Get rendering info - graphic card with version if exists
     * and send to server
     */
    _getMappedRenderInfo() {
        Log.info('Collecting Graphic Card props');

        const graphicInfo = {renderer: 'unknown', vendor: '', version: 'unknown', supportedExtensions: ''};
        if (window.WebGLRenderingContext || window.WebGL2RenderingContext) {
            const canvas = document.createElement('canvas');
            canvas.id = this.canvasId;
            const gl = canvas.getContext('experimental-webgl');

            if (gl) {
                const dbgRenderInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (dbgRenderInfo != null) {
                    graphicInfo.renderer = gl
                        .getParameter(dbgRenderInfo.UNMASKED_RENDERER_WEBGL);
                    graphicInfo.vendor = gl
                        .getParameter(dbgRenderInfo.UNMASKED_VENDOR_WEBGL);
                    graphicInfo.supportedExtensions = gl.getSupportedExtensions().join(',');

                    const stringIntel = 'Intel';
                    const stringHDgraphics = 'HD Graphics';

                    const stringBDW = 'BDW (5th gen core)';
                    const stringSKL = 'SKL (6th gen core)';

                    if (graphicInfo.renderer.indexOf(stringIntel) > -1 && graphicInfo.renderer.indexOf(stringHDgraphics) > -1) {
                        const numberPattern = /\d+/g;
                        const matches = graphicInfo.renderer.match(numberPattern);
                        if (matches) {
                            const minVersion = matches[0];

                            if (minVersion > 500 && minVersion < 599) {
                                graphicInfo.version = stringSKL;
                            }

                            if (minVersion > 5300 && minVersion < 6999) {
                                graphicInfo.version = stringBDW;
                            }
                        }
                    }
                }
            }
        }
        let graphicDetectContract = new GraphicDetectContract(graphicInfo.renderer, graphicInfo.vendor, graphicInfo.version, graphicInfo.supportedExtensions);
        let graphicDetectData = graphicDetectContract.buildQueueMessage();
        
        this._dataQ.addToQueue('static_fields', graphicDetectData, false);

        Log.info('Graphic Card props collected');
    }
}
