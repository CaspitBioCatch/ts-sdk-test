/**
 * The implementation is taken from https://github.com/beatgammit/base64-js
 * I took only the btoa since there is no need in atob and for this reason I did not
 * embed all the library
 */
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

/* eslint-disable no-cond-assign, no-bitwise, no-mixed-operators */
export const btoa = self.btoa ? self.btoa.bind(self)
    : function (input) {
        const str = String(input);
        let output = '';

        for (
            // initialize result and counter
            let block, charCode, idx = 0, map = chars;
            // if the next str index does not exist:
            //   change the mapping table to "="
            //   check if d has no fractional digits
            str.charAt(idx | 0) || (map = '=', idx % 1);
            // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
            output += map.charAt(63 & block >> 8 - idx % 1 * 8)
        ) {
            charCode = str.charCodeAt(idx += 3 / 4);
            if (charCode > 0xFF) {
                throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
            }
            block = block << 8 | charCode;
        }

        return output;
    };

/* eslint-enable no-cond-assign, no-bitwise, no-mixed-operators */
