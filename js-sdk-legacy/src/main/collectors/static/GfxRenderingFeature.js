import DataCollector from '../DataCollector';
import GfxRenderingContract from "../../contract/staticContracts/GfxRenderingContract";

const featureSettings = {
    configKey: 'isGfxRendering',
    isDefault: false,
    shouldRunPerContext: false,
    shouldRunPerSession: false,
    shouldRun: true,
    isFrameRelated: false,
    runInUns: false,
    runInSlave: true,
    runInLean: true,
    isRunning: false,
    instance: null,
};

// Use a common font type to retain the same rendering across different browsers
const CANVAS_TEXT_FIRST_FONT = '11pt Times New Roman';
const CANVAS_TEXT_SECOND_FONT = '18pt Arial';
const CANVAS_TEXT_THIRD_FONT = '14pt Georgia';
const CANVAS_TEXT_FOURTH_FONT = '16pt Verdana';
const CANVAS_TEXT_WIDTH = 320;
const CANVAS_TEXT_HEIGHT = 120;

const CANVAS_GEOMETRY_WIDTH = 256;
const CANVAS_GEOMETRY_HEIGHT = 256;

const CANVAS_RENDERING_NOISE_DETECTED_VAL = "0";

export class CanvasModel {
    constructor() {
        this.winding = false;
        this.text = "";
        this.geometry = "";
    }
}

/**
 * The purpose of this class is to collect data about the rendering capabilities of the browser
 * The collector should report the following:
 * 1. Whether the browser supports the winding rule for canvas rendering
 * 2. A hash of the text rendering capabilities of the browser
 * 3. A hash of the geometry rendering capabilities of the browser
 * In case the browser has a plugin that applies noise to the rendering, for example alters a single pixel,
 * the second attempt to encode the canvas will result in a different hash - in that case "0" is assigned to both text and geometry
 */
export default class GfxRenderingFeature extends DataCollector {

    static getDefaultSettings() {
        return featureSettings;
    }

    /**
     * @param {DataQueue} dataQ
     * @param {Utils} CDUtils
     */
    constructor(dataQ, utils) {
        super();
        this._dataQ = dataQ;
        this._utils = utils;
        this._metric = 'GFX';

        // This element doesn't have to be added to the DOM
        this.canvasElement = null;
        this.canvasContext = null;
        this._addToQueueAndCleanUp = this.addToQueueAndCleanUp.bind(this);
    }

    startFeature() {
        this.initCanvasAndContext();
        if (this.isCanvas2DSupported( this.canvasElement, this.canvasContext)) {
            this.generateCanvasData();

        }
    }

    addToQueueAndCleanUp(canvasData) {
        const gfxContract = new GfxRenderingContract(canvasData.winding, canvasData.text, canvasData.geometry);
        const gfxData = gfxContract.buildQueueMessage();
        this._dataQ.addToQueue('static_fields', gfxData, false);
        this.cleanUp();
    }

    initCanvasAndContext() {
        // Without exposing an initiator, proper spying and stubbing cannot be performed
        if (this.canvasElement === null || this.canvasContext === null ) {
            this.canvasElement = document.createElement('canvas');
            this.canvasContext = this.buildCanvasContext(this.canvasElement);
        }
    }

    cleanUp() {
        // Clean up
        this.canvasContext = null;
        this.canvasElement = null;
    }

    /**
     * Generates the data for the canvas rendering
     * @param callback
     */
    generateCanvasData() {

        const canvasData = new CanvasModel();

        canvasData.winding = this.hasWinding(this.canvasContext);

        this.renderTextImage(this.canvasElement, this.canvasContext);
        const textImageFP1 = this.canvasToText(this.canvasElement);
        const textImageFP2 = this.canvasToText(this.canvasElement);
        // Compare between the results of the calls to dataToURL()
        // If noise is applied by the browser, it's useless to report the actual fingerprint
        // The change of a single pixel is enough to alter the signature
        if (
            (textImageFP1.length === 0 || textImageFP2.length === 0) ||
            textImageFP1 !== textImageFP2) {
            canvasData.text = CANVAS_RENDERING_NOISE_DETECTED_VAL;
            canvasData.geometry = CANVAS_RENDERING_NOISE_DETECTED_VAL;
            this._addToQueueAndCleanUp(canvasData);
        } else {
            this.hashCanvasText(textImageFP1).then((canvasDataText) => {
                canvasData.text = canvasDataText || CANVAS_RENDERING_NOISE_DETECTED_VAL;
                this.renderGeometryImage(this.canvasElement, this.canvasContext);

                return this.hashCanvasText(this.canvasToText(this.canvasElement))
            }).then((canvasDataGeometry) => {
                canvasData.geometry = canvasDataGeometry || CANVAS_RENDERING_NOISE_DETECTED_VAL;
                this._addToQueueAndCleanUp(canvasData);
            });
        }
    }

    /**
     * @param {HTMLCanvasElement} canvasElement
     */
    buildCanvasContext(canvasElement) {
        canvasElement.width = 1;
        canvasElement.height = 1;
        return canvasElement.getContext('2d');
    }

    /**
     * @param {HTMLCanvasElement} canvas
     * @param {CanvasRenderingContext2D} context
     */
    isCanvas2DSupported(canvas, context) {
        return !!(context && canvas.toDataURL);
    }

    /**
     * Renders a text image in the given context2D
     * @param {HTMLCanvasElement} canvasElement
     * @param {CanvasRenderingContext2D} canvasContext
     */
    renderTextImage(canvasElement, canvasContext) {
        canvasElement.width = CANVAS_TEXT_WIDTH;
        canvasElement.height = CANVAS_TEXT_HEIGHT;

        // Create gradient background
        const gradient = canvasContext.createLinearGradient(0, 0, CANVAS_TEXT_WIDTH, CANVAS_TEXT_HEIGHT);
        gradient.addColorStop(0, '#f60');
        gradient.addColorStop(1, '#069');
        canvasContext.fillStyle = gradient;
        canvasContext.fillRect(0, 0, CANVAS_TEXT_WIDTH, CANVAS_TEXT_HEIGHT);

        canvasContext.textBaseline = 'alphabetic';
        canvasContext.fillStyle = '#fff';
        
        // First text with first font
        canvasContext.font = CANVAS_TEXT_FIRST_FONT;
        // Add more diverse Unicode and Emojis
        const printedText = `DHO YbmPx KTGUL CQrSfJ iNvZAEW ${String.fromCharCode(55357, 56835)} \u{1F604} \u{1F4A9} \u{2693} \u{2194}`; // Smiling face, Pile of Poo, Anchor, Left-right arrow
        canvasContext.fillText(printedText, 2, 15);
        
        // Second text with second font and rotation
        canvasContext.save();
        canvasContext.translate(4, 45);
        canvasContext.rotate(0.1);
        canvasContext.font = CANVAS_TEXT_SECOND_FONT;
        canvasContext.fillStyle = 'rgba(102, 204, 0, 0.7)';
        canvasContext.fillText(printedText, 0, 0);
        canvasContext.restore();

        // Third text with third font and shadow
        canvasContext.font = CANVAS_TEXT_THIRD_FONT;
        canvasContext.shadowColor = 'rgba(0, 0, 0, 0.5)';
        canvasContext.shadowBlur = 2;
        canvasContext.shadowOffsetX = 1;
        canvasContext.shadowOffsetY = 1;
        canvasContext.fillStyle = '#ff0';
        // Apply skew transformation
        canvasContext.save();
        canvasContext.transform(1, 0.1, 0, 1, 0, 0); // Skew horizontally
        canvasContext.fillText(printedText, 2, 75);
        canvasContext.restore();
        canvasContext.shadowColor = 'transparent'; // Reset shadow

        // Fourth text with fourth font and pattern
        const pattern = canvasContext.createPattern(this.createPatternCanvas(), 'repeat');
        canvasContext.font = CANVAS_TEXT_FOURTH_FONT;
        canvasContext.fillStyle = pattern;
        canvasContext.fillText(printedText, 2, 100);
    }

    createPatternCanvas() {
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = 20;
        patternCanvas.height = 20;
        const patternCtx = patternCanvas.getContext('2d');
        patternCtx.fillStyle = '#f00';
        patternCtx.fillRect(0, 0, 10, 10);
        patternCtx.fillStyle = '#00f';
        patternCtx.fillRect(10, 10, 10, 10);
        return patternCanvas;
    }

    /**
     *
     * @param {HTMLCanvasElement} canvasElement
     * @param {CanvasRenderingContext2D} canvasContext
     */
    renderGeometryImage(canvasElement, canvasContext) {
        canvasElement.width = CANVAS_GEOMETRY_WIDTH;
        canvasElement.height = CANVAS_GEOMETRY_HEIGHT;

        // Create complex gradient background
        const gradient = canvasContext.createRadialGradient(
            CANVAS_GEOMETRY_WIDTH/2, CANVAS_GEOMETRY_HEIGHT/2, 0,
            CANVAS_GEOMETRY_WIDTH/2, CANVAS_GEOMETRY_HEIGHT/2, CANVAS_GEOMETRY_WIDTH/2
        );
        gradient.addColorStop(0, '#f2f');
        gradient.addColorStop(0.5, '#2ff');
        gradient.addColorStop(1, '#ff2');
        canvasContext.fillStyle = gradient;
        canvasContext.fillRect(0, 0, CANVAS_GEOMETRY_WIDTH, CANVAS_GEOMETRY_HEIGHT);

        // Draw complex shapes with different composite operations
        canvasContext.globalCompositeOperation = 'multiply';
        const pointsArray = [
            ['#f2f', 40, 40],
            ['#2ff', 80, 40],
            ['#ff2', 60, 80]
        ];
        for (const [color, x, y] of pointsArray) {
            canvasContext.fillStyle = color;
            canvasContext.beginPath();
            canvasContext.arc(x, y, 40, 0, 2 * Math.PI, true);
            canvasContext.closePath();
            canvasContext.fill();
        }

        // Add more complex shapes
        canvasContext.globalCompositeOperation = 'screen';
        canvasContext.fillStyle = '#f9c';
        canvasContext.beginPath();
        canvasContext.arc(60, 60, 60, 0, 2 * Math.PI, true);
        canvasContext.arc(60, 60, 20, 0, 2 * Math.PI, true);
        canvasContext.fill('evenodd');

        // Add Bezier curves with a different blend mode
        canvasContext.globalCompositeOperation = 'difference'; // Changed from overlay
        canvasContext.beginPath();
        canvasContext.moveTo(20, 20);
        canvasContext.bezierCurveTo(40, 40, 60, 40, 80, 20);
        canvasContext.strokeStyle = '#0f0';
        canvasContext.lineWidth = 3;
        canvasContext.stroke();

        // Add more complex patterns with another blend mode
        canvasContext.globalCompositeOperation = 'luminosity'; // Changed from soft-light
        for (let i = 0; i < 5; i++) {
            canvasContext.beginPath();
            canvasContext.moveTo(0, i * 50);
            canvasContext.lineTo(CANVAS_GEOMETRY_WIDTH, i * 50);
            canvasContext.strokeStyle = `rgba(255, 255, 255, ${0.2 + i * 0.1})`;
            canvasContext.stroke();
        }
    }

    /**
     *
     * @param {HTMLCanvasElement} canvasElement
     */
    canvasToText(canvasElement) {
        try {
            // toDataURL always returns a base64 encoded string or a SecurityError
            return canvasElement.toDataURL().split(',')[1];
        } catch (SecurityError) {
            return "";
        }
    }

    /**
     *
     * @param {string} data
     * @returns {Promise}
     */
    hashCanvasText(data) {
        return this._utils.digest_sha256(data).then( (hash) => {
          return hash;
        }).catch( () => {
            return "";
        });
    }

    /**
     *
     * @param {CanvasRenderingContext2D} canvasContext
     * @private
     * https://blog.coderfy.io/making-sense-of-canvas-winding-rules
     * Some machines/GPUs support winding and some do not.
     */
    hasWinding(canvasContext) {
        canvasContext.rect(0, 0, 10, 10);
        canvasContext.rect(2, 2, 6, 6);
        return !canvasContext.isPointInPath(5, 5, 'evenodd');
    }


}
