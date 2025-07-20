import DataCollector from '../../../DataCollector';
import Log from "../../../../technicalServices/log/Logger";

const featureSettings = {
    configKey: 'isFontMathFeature',
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
 FontMathFeature renders a complex MathML formula (∏ with multi-scripts), measures its getBoundingClientRect(),
  and returns a JSON object containing position, size, and the chosen font family.
• Because the node is <math>, the browser must load a dedicated math font—Cambria Math on Windows,
 Apple Symbols / STIX on macOS, STIX-Two-Math / Noto Math on Android/Linux—which is exposed in the font field.
• Math fonts include an OpenType MATH table and are processed by the MathML engine, 
  yielding much larger variability in width/height than regular text.
• That variability—together with the actual font name—differs by OS, browser engine, DPI, zoom level, and font version,
  producing a distinctive “rendering fingerprint” for each device.
• After measuring, the element is removed 
 */
export default class FontMathFeature extends DataCollector {
    static getDefaultSettings() {
        return featureSettings;
    }

    constructor(dataQ, window = global.window, document = global.document, logger = Log) {
        super();
        this._dataQ = dataQ;
        this._window = window;
        this._document = document;
        this._logger = logger;
    }

    _getBoundingBox(element, win) {
        try {
            const boundingRect = element.getBoundingClientRect();
            const properties = [
                "x", "y", "left", "right", "bottom",
                "height", "top", "width",
            ];
        
            const boundingBox = {};
            properties.forEach((prop) => {
                if (prop in boundingRect) {
                    boundingBox[prop] = boundingRect[prop];
                }
            });
        
            const fontFamily = win
                .getComputedStyle(element, null)
                .getPropertyValue("font-family");
            boundingBox.font = fontFamily;
        
            return boundingBox;
        } catch (error) {
            this._logger.error('Failed to get bounding box', error);
            return null;
        }
    }

    _renderMathFormulas() {
        try {
            let mathContent = "<mrow><munderover><mmultiscripts><mo>∏</mo>";
        
            function createMultiScripts(main, sub1, sub2, pre1, pre2) {
                return `<mmultiscripts><mi>${main}</mi><mi>${sub1}</mi><mi>${sub2}</mi>
                        <mprescripts></mprescripts><mi>${pre1}</mi><mi>${pre2}</mi></mmultiscripts>`;
            }
        
            const scriptData = [
                ["𝔈", "υ", "τ", "ρ", "σ"],
                ["𝔇", "π", "ο", "ν", "ξ"],
                ["𝔄", "δ", "γ", "α", "β"],
                ["𝔅", "θ", "η", "ε", "ζ"],
                ["𝔉", "ω", "ψ", "ϕ", "χ"],
                ["ℭ", "μ", "λ", "ι", "κ"],
            ];
        
            scriptData.forEach((s) => {
                mathContent += createMultiScripts(s[0], s[1], s[2], s[3], s[4]);
            });
            mathContent += "</munderover></mrow>";
        
            const mathElement = this._document.createElement("math");
            mathElement.style.whiteSpace = "nowrap";
            mathElement.innerHTML = mathContent;
            this._document.body.append(mathElement);
        
            const result = this._getBoundingBox(mathElement, this._window);
            mathElement.remove();
        
            return result;
        } catch (error) {
            this._logger.error('Failed to render math formulas', error);
            return null;
        }
    }

    async startFeature() {
        try {
            const mathFontInfo = this._renderMathFormulas();
            if (mathFontInfo) {
                this._dataQ.addToQueue('static_fields', ['font_math_info', mathFontInfo], false);
            }
        } catch (error) {
            this._logger.error('Failed to collect math font information', error);
        }
    }
}
  