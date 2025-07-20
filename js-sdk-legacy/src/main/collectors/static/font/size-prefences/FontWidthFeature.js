import DataCollector from '../../../DataCollector';
import Log from "../../../../technicalServices/log/Logger";

const featureSettings = {
    configKey: 'isFontWidthFeature',
    isDefault: false,
    shouldRunPerContext: false,
    shouldRunPerSession: true,
    shouldRun: false,
    isFrameRelated: false,
    runInUns: false,
    runInSlave: true,
    runInLean: true,
    isRunning: false,
    instance: null,
};

/**
  FontWidthFeature creates a clean <iframe>, renders the test string “mmMwWLliI0fiflO&1” in seven common font families,
  measures each span’s pixel width, and returns a JSON payload. The width values vary across operating systems, browser engines, 
  DPI, and zoom settings, producing a numeric “width-fingerprint.” 
  This complements FontEmojiFeature, which measures the bounding box of 80 emoji, 
  and FontMathFeature, which measures a complex MathML formula in a math font. 
  Together the three collectors build a richer typographic profile for fingerprinting and rendering diagnostics.
 */
export default class FontWidthFeature extends DataCollector {
    static getDefaultSettings() {
        return featureSettings;
    }

    constructor(dataQ, document = window.document, devicePixelRatio = window.devicePixelRatio) {
        super();
        this._dataQ = dataQ;
        this._document = document;
        this._devicePixelRatio = devicePixelRatio;
    }

    _measureFontWidths() {
        const fontStyles = {
            default: [],
            apple: [{ font: "-apple-system-body" }],
            serif: [{ fontFamily: "serif" }],
            sans: [{ fontFamily: "sans-serif" }],
            mono: [{ fontFamily: "monospace" }],
            min: [{ fontSize: "1px" }],
            system: [{ fontFamily: "system-ui" }],
        };

        const testString = "mmMwWLliI0fiflO&1";
        const defaultWidth = 4000;

        function createTestEnvironment(callback, width = defaultWidth) {
            const iframe = this._document.createElement("iframe");
            this._document.body.appendChild(iframe);
            const doc = iframe.contentDocument;
            doc.open();
            doc.write(
                '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body></body></html>'
            );
            doc.close();
            const result = callback(doc, doc.body, width);
            this._document.body.removeChild(iframe);
            return result;
        }

        function prepareDocument(doc, body, width) {
            body.style.width = `${width}px`;
            body.style.webkitTextSizeAdjust = body.style.textSizeAdjust = "none";

            if (this._isZoomNeeded()) {
                body.style.zoom = `${1 / this._devicePixelRatio}`;
            } else if (this._isZoomResetNeeded()) {
                body.style.zoom = "reset";
            }

            const testDiv = doc.createElement("div");
            testDiv.textContent = Array.from(
                { length: (width / 20) >> 0 },
                () => "word"
            ).join(" ");
            body.appendChild(testDiv);
        }

        function measureFonts(doc, body) {
            const elements = {};
            const results = {};

            for (const [key, styles] of Object.entries(fontStyles)) {
                const style = styles[0] || {};
                const span = doc.createElement("span");

                span.textContent = testString;
                span.style.whiteSpace = "nowrap";

                Object.entries(style).forEach(([prop, val]) => {
                    if (val !== undefined) span.style[prop] = val;
                });

                elements[key] = span;
                body.append(doc.createElement("br"), span);
            }

            Object.keys(fontStyles).forEach((key) => {
                results[key] = elements[key].getBoundingClientRect().width;
            });

            return results;
        }

        return createTestEnvironment.call(this, (doc, body, width) => {
            prepareDocument.call(this, doc, body, width);
            return measureFonts(doc, body);
        });
    }

    _isZoomNeeded() {
        return true;
    }

    _isZoomResetNeeded() {
        return false;
    }

    async startFeature() {
        try {
            const fontWidthInfo = this._measureFontWidths();
            this._dataQ.addToQueue('static_fields', ['font_width_info', fontWidthInfo], false);
        } catch (error) {
            Log.error('Failed to collect font width information', error);
        }
    }
}
  