/**
 * This polyfill is needed for browsers that don't support TextEncoder
 * TextEncoder is used in the HashService file for hashing the body of the request
 * @param {Object} scope - the scope of the window
 */
export default function apply(scope) {
    if (typeof TextEncoder === 'undefined') {
        scope.TextEncoder = function TextEncoder() {};
        TextEncoder.prototype.encode = function(str) {
            var utf8 = [];
            for (var i = 0; i < str.length; i++) {
                var charcode = str.charCodeAt(i);
                if (charcode < 0x80) utf8.push(charcode);
                else if (charcode < 0x800) {
                    utf8.push(0xc0 | (charcode >> 6),
                        0x80 | (charcode & 0x3f));
                } else if (charcode < 0xd800 || charcode >= 0xe000) {
                    utf8.push(0xe0 | (charcode >> 12),
                        0x80 | ((charcode>>6) & 0x3f),
                        0x80 | (charcode & 0x3f));
                }
                // surrogate pair
                else {
                    i++;
                    // UTF-16 encodes 0x10000-0x10FFFF by subtracting 0x10000 and splitting into two 16-bit characters
                    charcode = 0x10000 + (((charcode & 0x3ff)<<10) | (str.charCodeAt(i) & 0x3ff));
                    utf8.push(0xf0 | (charcode >>18),
                        0x80 | ((charcode>>12) & 0x3f),
                        0x80 | ((charcode>>6) & 0x3f),
                        0x80 | (charcode & 0x3f));
                }
            }
            return new Uint8Array(utf8);
        };
    }
}