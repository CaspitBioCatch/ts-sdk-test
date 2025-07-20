import DataCollector from '../../../DataCollector';
import Log from "../../../../technicalServices/log/Logger";

const featureSettings = {
    configKey: 'isFontEmojiFeature',
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
FontEmojiFeature momentarily inserts 80 invisible emoji characters,
measures their getBoundingClientRect() values, and sends a JSON payload with:
position (x/y/left/right/top/bottom), size (width/height), and the font family name.
• Because no font-family is specified, the browser falls back to the device’s 
default emoji font (Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, etc.).
• The resulting width and height vary with operating system, browser engine, resolution, 
zoom level, and even font updates, creating a rendering “fingerprint” unique to each environment.
• After the measurement the span is removed, so the process has no visual impact on the page.
**/
export default class FontEmojiFeature extends DataCollector {
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
    }

    _renderEmojis() {
        const emojis = Array.from({ length: 80 }, (_, i) =>
            String.fromCodePoint(128512 + i)
        ).join("");
    
        const span = this._document.createElement("span");
        span.style.whiteSpace = "nowrap";
        span.innerHTML = emojis;
        this._document.body.append(span);
    
        const result = this._getBoundingBox(span, this._window);
        span.remove();
    
        return result;
    }

    async startFeature() {
        try {
            const emojiFontInfo = this._renderEmojis();
            this._dataQ.addToQueue('static_fields', ['font_emoji_info', emojiFontInfo], false);
        } catch (error) {
            this._logger.error('Failed to collect emoji font information', error);
        }
    }
}
  