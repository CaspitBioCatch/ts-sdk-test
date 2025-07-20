import { SystemFrameName } from '../../../../../core/frames/SystemFrameName';
import Log from '../../../../../technicalServices/log/Logger';

export const SPAN_TAG = 'span';

export default class BaseFontsScanner {
    constructor(domUtils) {
        this._domUtils = domUtils;
        // a font will be compared against all the four default fonts, base fonts.
        // and if it doesn't match all 4 then that font is not available.
        this._baseFonts = ['rat-fonts', 'monospace', 'sans-serif', 'serif'];
        // we use m or w because these two characters take up the maximum width.
        // And we use a LLi so that the same matching fonts can get separated
        this._testString = "mmmmmmmmmmlli";
        // we test using 72px font size, we may use any size. I guess larger the better.//
        this._testSize = '72px';
        this._chunkSize = 30;
        this._defaultWidth = {};
        this._defaultHeight = {};
        this._body = null;
        this._iframe = null;
        this._spanArray = null;
        this._allFontsDiffs = [];
    }

    release() {
        if (this._body && this._iframe) {
            this._body.removeChild(this._iframe);
        }
        this._iframe = null;
        this._spanArray = null;
        this._allFontsDiffs = [];
    }

    init() {
        return new Promise((resolve, reject) => {
            try {
                this.initCallback(resolve);
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Prepare the Scanner for the font detection tests
     * @param callback - Called once the Scanner is initialized and ready for the test
     * @returns {string}
     */
    initCallback(callback) {
        this._body = document.body;
        if (!this._body) {
            return '';
        }

        // Create the iframe so we can do the fonts detection behind the scenes without being noticed
        // IFrame visibility is set to hidden with width & height of 0 so it will not take any space
        this._iframe = document.createElement('iframe');

        //use sandbox to allow the minimum level of capability necessary for the content of the iframe
        //to do it's job
        //in FontScanner usage - the iframe and the iframe's parent document are Same Origin
        //and we allow to reach up into the parent
        this._iframe.setAttribute('sandbox', 'allow-same-origin');

        this._iframe.id = SystemFrameName.fontDetectionFrame;
        this._iframe.style.visibility = 'hidden';
        this._iframe.style.zIndex = '-1';
        this._iframe.style.width = 0;
        this._iframe.style.height = 0;
        this._iframe.style.position = 'absolute';
        this._iframe.style.top = '-9999px';
        this._iframe.style.left = '-9999px';
        this._iframe.style.border = 'none';
        this._iframe.style.margin = '0';
        this._iframe.style.padding = '0';
        this._iframe.style.overflow = 'hidden';
        this._body.appendChild(this._iframe);

        // ie8 requires adding a body + frame must have a size do we null it...
        if (!this._iframe.contentDocument.body) {
            this._iframe.style.width = null;
            this._iframe.style.height = null;
            this._iframe.contentDocument.appendChild(
                document.createElement('body'),
            );
        }

        this._domUtils.onWindowDocumentReady(this._iframe.contentWindow, () => {
            this._createCalculationElements(callback);
        });
    }

    /**
     * Create all the elements required for the font test
     * @param callback - Once all elements are created the callback is called to continue to process
     * @private
     */
    _createCalculationElements(callback) {
        // Create a SPAN in the document to get the width of the text we use to test
        const span = document.createElement('span');
        span.style.fontSize = this._testSize;
        span.style.visibility = 'hidden';
        span.style.position = 'absolute';
        span.style.zIndex = '-1';
        span.style.lineHeight = 'normal';
        span.innerHTML = this._testString;

        for (let i = 0; i < this._baseFonts.length; i++) {
            // get the default width for the three base fonts
            span.style.fontFamily = this._baseFonts[i];
            this._iframe.contentDocument.body.appendChild(span);
            this._defaultWidth[this._baseFonts[i]] = span.offsetWidth; // width for the default font
            this._defaultHeight[this._baseFonts[i]] = span.offsetHeight; // height for the default font
            this._iframe.contentDocument.body.removeChild(span);
        }
        Log.debug(`FontsScanner:init - base fonts width: 
                ${this._baseFonts[0]}:${this._defaultWidth[this._baseFonts[0]]};
                ${this._baseFonts[1]}:${this._defaultWidth[this._baseFonts[1]]};
                ${this._baseFonts[2]}:${this._defaultWidth[this._baseFonts[2]]};
                ${this._baseFonts[3]}:${this._defaultWidth[this._baseFonts[3]]}`
        );
        Log.debug(`FontsScanner:init - base fonts height: 
                ${this._baseFonts[0]}:${this._defaultHeight[this._baseFonts[0]]};
                ${this._baseFonts[1]}:${this._defaultHeight[this._baseFonts[1]]};
                ${this._baseFonts[2]}:${this._defaultHeight[this._baseFonts[2]]};
                ${this._baseFonts[3]}:${this._defaultHeight[this._baseFonts[3]]}`
        );
        // the span array for all the tests
        this._createSpanArray();

        callback();
    }

    /**
     * create array of spans for testing in chunks
     */
    _createSpanArray() {
        const currDiv = document.createElement('div');
        currDiv.id = 'currentDiv';
        currDiv.style.position = 'absolute';
        currDiv.style.visibility = 'hidden';
        for (let i = 0; i < this._chunkSize; i++) {
            const s1 = document.createElement('span');
            s1.style.lineHeight = 'normal';
            s1.style.position = 'absolute';
            s1.style.zIndex = '-1';
            s1.style.fontSize = this._testSize;
            s1.innerHTML = this._testString;
            currDiv.appendChild(s1);
            const br = document.createElement('br');
            currDiv.appendChild(br);
        }

        this._iframe.contentDocument.body.appendChild(currDiv);
        this._spanArray = currDiv;
    }

    getAllFontsDiffs() {
        return this._allFontsDiffs;
    }
}
