import Log from '../../../../../technicalServices/log/Logger';
import BaseFontsScanner from './OldBaseFontsScanner';
import { SPAN_TAG } from './OldBaseFontsScanner';

/**
 * Does the font calculation in an multi-task manner:
 * Instead of iterating the provided fonts synchronically - it posting dedicated window task per each font.
 * The intention was to fix Latency during page load for prospect users, reported by some of our customers.
 * see - https://biocatch.atlassian.net/browse/BC-38110
 * The idea was to keep the original synchronic behavior, while remotely configure for the problematic customers the alternative
 * behavior implemented on that class.   the 'legacy' behavior now captured within the BatchFontsScanner.
 */
export default class OldOffloadFontsScanner extends BaseFontsScanner {
    /**
     * @param {CDUtils} domUtils
     */
    constructor(domUtils) {
        super(domUtils);
        this._getElementOffsetTask = this._getElementOffsetTask.bind(this);
        this._lastChunck = true;
    }

    scan(fonts, fontFamily) {
        return this.init()
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
        if (!this._spanArray) {
            callback([]);
            return [];
        }

        const allSpans = this._spanArray.getElementsByTagName(SPAN_TAG);

        const createTaskIterator = (start, end, values) => {
            let _nextIndex = start;
            const _availableFonts = [];
            const _callback = callback;
            const _fontsArray = fonts;
            const _fontFamily = fontFamily;

            const taskIterator = {
                next: function () {
                    let nextValue = null;
                    if (_nextIndex < end) {
                        nextValue = values[_nextIndex];
                        _nextIndex++;
                        return nextValue;
                    }
                    return null;
                },

                reset: function () {
                    _nextIndex = 0;
                },

                addFont: function (font) {
                    _availableFonts.push(font);
                },

                runCallback: function () {
                    _callback(_availableFonts);
                },

                getFontsArray: function () {
                    return _fontsArray;
                },

                getFontFamily: function () {
                    return _fontFamily;
                },

                getAvailableFonts: function () {
                    return _availableFonts;
                },
            };
            return taskIterator;
        };

        const taskIterator = createTaskIterator(
            0,
            Math.min(fonts.length, this._chunkSize),
            allSpans,
        );

        // First execution
        this._lastChunck = true;
        this._applyFontsToSpanElements(taskIterator, 0);
    }

    /**
     *
     * @param {Object} spansTaskIterator
     * @param {Number} fontsLoopIndex
     */
    _applyFontsToSpanElements(spansTaskIterator, fontsLoopIndex) {
        Log.trace(`[FONTS-COLLECTOR][VERSION1] Checking font ${fontsLoopIndex}.`);

        let nextElement = spansTaskIterator.next();
        const fontsArray = spansTaskIterator.getFontsArray();
        const fontFamily = spansTaskIterator.getFontFamily();
        while (nextElement !== null && fontsLoopIndex < fontsArray.length) {
            nextElement.style.fontFamily = fontsArray[fontsLoopIndex] + ', ' + fontFamily;
            nextElement.id = fontsArray[fontsLoopIndex];
            fontsLoopIndex++;
            nextElement = spansTaskIterator.next();
        }

        spansTaskIterator.reset();
        if (fontsLoopIndex >= fontsArray.length) {
            // eslint-disable-next-line no-console
            // console.log('calling callback', spansTaskIterator.getAvailableFonts());

            /** one more run for the rest of the tail */
            if (this._lastChunck) {
                this._lastChunck = false;
                return window.setTimeout(() => {
                    this._getElementOffsetTask(
                        spansTaskIterator,
                        fontsLoopIndex,
                    );
                }, 0);
            }

            spansTaskIterator.runCallback();
        } else {
            window.setTimeout(() => {
                this._getElementOffsetTask(spansTaskIterator, fontsLoopIndex);
            }, 0);
        }
    }

    /**
     * Get the offset width/height information of the requested element
     * and execute the provided callback when finished
     * @param {Object} spansTaskIterator
     * @param {Number} fontsLoopIndex
     * @param {Number} indexOfBaseFonts
     */
    _getElementOffsetTask(spansTaskIterator, fontsLoopIndex) {
        const fontFamily = spansTaskIterator.getFontFamily();
        const baseFontDefaultWidth =
            this._defaultWidth[fontFamily];
        const baseFontDefaultHeight =
            this._defaultHeight[fontFamily];

        const element = spansTaskIterator.next();
        if (element && element.offsetWidth) {
            const diffWidth = Math.abs(
                element.offsetWidth - baseFontDefaultWidth,
            );
            const diffHeight = Math.abs(
                element.offsetHeight - baseFontDefaultHeight,
            );

            this._allFontsDiffs.push([element.id, diffWidth, diffHeight]);
            if (diffWidth > 1 || diffHeight > 1) {
                spansTaskIterator.addFont(element.id);
            }
            window.setTimeout(() => {
                this._getElementOffsetTask(spansTaskIterator, fontsLoopIndex);
            }, 0);
        } else {
            spansTaskIterator.reset();
            this._applyFontsToSpanElements(spansTaskIterator, fontsLoopIndex);
        }
    }

    isSupported() {
        return true;
    }
}
