import { SPAN_TAG } from './OldBaseFontsScanner';
import BaseFontsScanner from './OldBaseFontsScanner';

export default class OldBatchFontsScanner extends BaseFontsScanner {

    constructor(domUtils) {
        super(domUtils);
    }
    
    scan(fonts, fontFamily) {
        return this.init() // Init from super base class
            .then(() => {
                return new Promise((resolve, reject) => {
                    try {
                        this.detectCallback(fonts, fontFamily, resolve);
                    } catch (error) {
                        reject(error);
                    }
                });
            })
            .catch((error) => {
                return Promise.reject(error);
            });
    }    

    /**
     * @param {Array} fonts
     * @param {Number} fontFamily
     * @param {Function} callback
     */
    detectCallback(fonts, fontFamily, callback) {
        const availableFonts = [];
        let index = 0;
        let currentLoopIndex = 0;

        if (!this._spanArray) {
            callback(availableFonts);
            return availableFonts;
        }

        const allSpans = this._spanArray.getElementsByTagName(SPAN_TAG);
        const baseFontDefaultWidth =
            this._defaultWidth[fontFamily];

        const baseFontDefaultHeight =
            this._defaultHeight[fontFamily];

        const checkDetection = (arryOfSpans) => {
            arryOfSpans.forEach((span) => {
                const diffWidth = Math.abs(
                    span.offsetWidth - baseFontDefaultWidth,
                );
                const diffHeight = Math.abs(
                    span.offsetHeight - baseFontDefaultHeight,
                );
                // collect all the diffs of all fonts in case we see the issue of all fonts.
                // If it happens the FontDetectionFeature will take this and send to server for analysis
                this._allFontsDiffs.push([span.id, diffWidth, diffHeight]);
                if (diffWidth > 1 || diffHeight > 1) {
                    availableFonts[index] = span.id;
                    index++;
                }
            });
        };

        fonts.forEach((font) => {
            if (currentLoopIndex >= this._chunkSize) {
                currentLoopIndex = 0;
                checkDetection(Array.from(allSpans));
            }

            allSpans[currentLoopIndex].style.fontFamily =
                font + ',' + fontFamily;
            allSpans[currentLoopIndex].id = font;
            currentLoopIndex++;
        });

        /** one more run for the rest of the tail */
        if (currentLoopIndex < this._chunkSize) {
            checkDetection(Array.from(allSpans).slice(0, currentLoopIndex));
        }

        callback(availableFonts);
    }
}
