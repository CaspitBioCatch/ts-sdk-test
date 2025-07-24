var cdwpb;
/******/ (function() { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./js-sdk-legacy/node_modules/crypto-js/aes.js":
/*!*****************************************************!*\
  !*** ./js-sdk-legacy/node_modules/crypto-js/aes.js ***!
  \*****************************************************/
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory, undef) {
	if (true) {
		// CommonJS
		module.exports = exports = factory(__webpack_require__(/*! ./core */ "./js-sdk-legacy/node_modules/crypto-js/core.js"), __webpack_require__(/*! ./enc-base64 */ "./js-sdk-legacy/node_modules/crypto-js/enc-base64.js"), __webpack_require__(/*! ./md5 */ "./js-sdk-legacy/node_modules/crypto-js/md5.js"), __webpack_require__(/*! ./evpkdf */ "./js-sdk-legacy/node_modules/crypto-js/evpkdf.js"), __webpack_require__(/*! ./cipher-core */ "./js-sdk-legacy/node_modules/crypto-js/cipher-core.js"));
	}
	else // removed by dead control flow
{}
}(this, function (CryptoJS) {

	(function () {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var BlockCipher = C_lib.BlockCipher;
	    var C_algo = C.algo;

	    // Lookup tables
	    var SBOX = [];
	    var INV_SBOX = [];
	    var SUB_MIX_0 = [];
	    var SUB_MIX_1 = [];
	    var SUB_MIX_2 = [];
	    var SUB_MIX_3 = [];
	    var INV_SUB_MIX_0 = [];
	    var INV_SUB_MIX_1 = [];
	    var INV_SUB_MIX_2 = [];
	    var INV_SUB_MIX_3 = [];

	    // Compute lookup tables
	    (function () {
	        // Compute double table
	        var d = [];
	        for (var i = 0; i < 256; i++) {
	            if (i < 128) {
	                d[i] = i << 1;
	            } else {
	                d[i] = (i << 1) ^ 0x11b;
	            }
	        }

	        // Walk GF(2^8)
	        var x = 0;
	        var xi = 0;
	        for (var i = 0; i < 256; i++) {
	            // Compute sbox
	            var sx = xi ^ (xi << 1) ^ (xi << 2) ^ (xi << 3) ^ (xi << 4);
	            sx = (sx >>> 8) ^ (sx & 0xff) ^ 0x63;
	            SBOX[x] = sx;
	            INV_SBOX[sx] = x;

	            // Compute multiplication
	            var x2 = d[x];
	            var x4 = d[x2];
	            var x8 = d[x4];

	            // Compute sub bytes, mix columns tables
	            var t = (d[sx] * 0x101) ^ (sx * 0x1010100);
	            SUB_MIX_0[x] = (t << 24) | (t >>> 8);
	            SUB_MIX_1[x] = (t << 16) | (t >>> 16);
	            SUB_MIX_2[x] = (t << 8)  | (t >>> 24);
	            SUB_MIX_3[x] = t;

	            // Compute inv sub bytes, inv mix columns tables
	            var t = (x8 * 0x1010101) ^ (x4 * 0x10001) ^ (x2 * 0x101) ^ (x * 0x1010100);
	            INV_SUB_MIX_0[sx] = (t << 24) | (t >>> 8);
	            INV_SUB_MIX_1[sx] = (t << 16) | (t >>> 16);
	            INV_SUB_MIX_2[sx] = (t << 8)  | (t >>> 24);
	            INV_SUB_MIX_3[sx] = t;

	            // Compute next counter
	            if (!x) {
	                x = xi = 1;
	            } else {
	                x = x2 ^ d[d[d[x8 ^ x2]]];
	                xi ^= d[d[xi]];
	            }
	        }
	    }());

	    // Precomputed Rcon lookup
	    var RCON = [0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];

	    /**
	     * AES block cipher algorithm.
	     */
	    var AES = C_algo.AES = BlockCipher.extend({
	        _doReset: function () {
	            var t;

	            // Skip reset of nRounds has been set before and key did not change
	            if (this._nRounds && this._keyPriorReset === this._key) {
	                return;
	            }

	            // Shortcuts
	            var key = this._keyPriorReset = this._key;
	            var keyWords = key.words;
	            var keySize = key.sigBytes / 4;

	            // Compute number of rounds
	            var nRounds = this._nRounds = keySize + 6;

	            // Compute number of key schedule rows
	            var ksRows = (nRounds + 1) * 4;

	            // Compute key schedule
	            var keySchedule = this._keySchedule = [];
	            for (var ksRow = 0; ksRow < ksRows; ksRow++) {
	                if (ksRow < keySize) {
	                    keySchedule[ksRow] = keyWords[ksRow];
	                } else {
	                    t = keySchedule[ksRow - 1];

	                    if (!(ksRow % keySize)) {
	                        // Rot word
	                        t = (t << 8) | (t >>> 24);

	                        // Sub word
	                        t = (SBOX[t >>> 24] << 24) | (SBOX[(t >>> 16) & 0xff] << 16) | (SBOX[(t >>> 8) & 0xff] << 8) | SBOX[t & 0xff];

	                        // Mix Rcon
	                        t ^= RCON[(ksRow / keySize) | 0] << 24;
	                    } else if (keySize > 6 && ksRow % keySize == 4) {
	                        // Sub word
	                        t = (SBOX[t >>> 24] << 24) | (SBOX[(t >>> 16) & 0xff] << 16) | (SBOX[(t >>> 8) & 0xff] << 8) | SBOX[t & 0xff];
	                    }

	                    keySchedule[ksRow] = keySchedule[ksRow - keySize] ^ t;
	                }
	            }

	            // Compute inv key schedule
	            var invKeySchedule = this._invKeySchedule = [];
	            for (var invKsRow = 0; invKsRow < ksRows; invKsRow++) {
	                var ksRow = ksRows - invKsRow;

	                if (invKsRow % 4) {
	                    var t = keySchedule[ksRow];
	                } else {
	                    var t = keySchedule[ksRow - 4];
	                }

	                if (invKsRow < 4 || ksRow <= 4) {
	                    invKeySchedule[invKsRow] = t;
	                } else {
	                    invKeySchedule[invKsRow] = INV_SUB_MIX_0[SBOX[t >>> 24]] ^ INV_SUB_MIX_1[SBOX[(t >>> 16) & 0xff]] ^
	                                               INV_SUB_MIX_2[SBOX[(t >>> 8) & 0xff]] ^ INV_SUB_MIX_3[SBOX[t & 0xff]];
	                }
	            }
	        },

	        encryptBlock: function (M, offset) {
	            this._doCryptBlock(M, offset, this._keySchedule, SUB_MIX_0, SUB_MIX_1, SUB_MIX_2, SUB_MIX_3, SBOX);
	        },

	        decryptBlock: function (M, offset) {
	            // Swap 2nd and 4th rows
	            var t = M[offset + 1];
	            M[offset + 1] = M[offset + 3];
	            M[offset + 3] = t;

	            this._doCryptBlock(M, offset, this._invKeySchedule, INV_SUB_MIX_0, INV_SUB_MIX_1, INV_SUB_MIX_2, INV_SUB_MIX_3, INV_SBOX);

	            // Inv swap 2nd and 4th rows
	            var t = M[offset + 1];
	            M[offset + 1] = M[offset + 3];
	            M[offset + 3] = t;
	        },

	        _doCryptBlock: function (M, offset, keySchedule, SUB_MIX_0, SUB_MIX_1, SUB_MIX_2, SUB_MIX_3, SBOX) {
	            // Shortcut
	            var nRounds = this._nRounds;

	            // Get input, add round key
	            var s0 = M[offset]     ^ keySchedule[0];
	            var s1 = M[offset + 1] ^ keySchedule[1];
	            var s2 = M[offset + 2] ^ keySchedule[2];
	            var s3 = M[offset + 3] ^ keySchedule[3];

	            // Key schedule row counter
	            var ksRow = 4;

	            // Rounds
	            for (var round = 1; round < nRounds; round++) {
	                // Shift rows, sub bytes, mix columns, add round key
	                var t0 = SUB_MIX_0[s0 >>> 24] ^ SUB_MIX_1[(s1 >>> 16) & 0xff] ^ SUB_MIX_2[(s2 >>> 8) & 0xff] ^ SUB_MIX_3[s3 & 0xff] ^ keySchedule[ksRow++];
	                var t1 = SUB_MIX_0[s1 >>> 24] ^ SUB_MIX_1[(s2 >>> 16) & 0xff] ^ SUB_MIX_2[(s3 >>> 8) & 0xff] ^ SUB_MIX_3[s0 & 0xff] ^ keySchedule[ksRow++];
	                var t2 = SUB_MIX_0[s2 >>> 24] ^ SUB_MIX_1[(s3 >>> 16) & 0xff] ^ SUB_MIX_2[(s0 >>> 8) & 0xff] ^ SUB_MIX_3[s1 & 0xff] ^ keySchedule[ksRow++];
	                var t3 = SUB_MIX_0[s3 >>> 24] ^ SUB_MIX_1[(s0 >>> 16) & 0xff] ^ SUB_MIX_2[(s1 >>> 8) & 0xff] ^ SUB_MIX_3[s2 & 0xff] ^ keySchedule[ksRow++];

	                // Update state
	                s0 = t0;
	                s1 = t1;
	                s2 = t2;
	                s3 = t3;
	            }

	            // Shift rows, sub bytes, add round key
	            var t0 = ((SBOX[s0 >>> 24] << 24) | (SBOX[(s1 >>> 16) & 0xff] << 16) | (SBOX[(s2 >>> 8) & 0xff] << 8) | SBOX[s3 & 0xff]) ^ keySchedule[ksRow++];
	            var t1 = ((SBOX[s1 >>> 24] << 24) | (SBOX[(s2 >>> 16) & 0xff] << 16) | (SBOX[(s3 >>> 8) & 0xff] << 8) | SBOX[s0 & 0xff]) ^ keySchedule[ksRow++];
	            var t2 = ((SBOX[s2 >>> 24] << 24) | (SBOX[(s3 >>> 16) & 0xff] << 16) | (SBOX[(s0 >>> 8) & 0xff] << 8) | SBOX[s1 & 0xff]) ^ keySchedule[ksRow++];
	            var t3 = ((SBOX[s3 >>> 24] << 24) | (SBOX[(s0 >>> 16) & 0xff] << 16) | (SBOX[(s1 >>> 8) & 0xff] << 8) | SBOX[s2 & 0xff]) ^ keySchedule[ksRow++];

	            // Set output
	            M[offset]     = t0;
	            M[offset + 1] = t1;
	            M[offset + 2] = t2;
	            M[offset + 3] = t3;
	        },

	        keySize: 256/32
	    });

	    /**
	     * Shortcut functions to the cipher's object interface.
	     *
	     * @example
	     *
	     *     var ciphertext = CryptoJS.AES.encrypt(message, key, cfg);
	     *     var plaintext  = CryptoJS.AES.decrypt(ciphertext, key, cfg);
	     */
	    C.AES = BlockCipher._createHelper(AES);
	}());


	return CryptoJS.AES;

}));

/***/ }),

/***/ "./js-sdk-legacy/node_modules/crypto-js/blowfish.js":
/*!**********************************************************!*\
  !*** ./js-sdk-legacy/node_modules/crypto-js/blowfish.js ***!
  \**********************************************************/
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory, undef) {
	if (true) {
		// CommonJS
		module.exports = exports = factory(__webpack_require__(/*! ./core */ "./js-sdk-legacy/node_modules/crypto-js/core.js"), __webpack_require__(/*! ./enc-base64 */ "./js-sdk-legacy/node_modules/crypto-js/enc-base64.js"), __webpack_require__(/*! ./md5 */ "./js-sdk-legacy/node_modules/crypto-js/md5.js"), __webpack_require__(/*! ./evpkdf */ "./js-sdk-legacy/node_modules/crypto-js/evpkdf.js"), __webpack_require__(/*! ./cipher-core */ "./js-sdk-legacy/node_modules/crypto-js/cipher-core.js"));
	}
	else // removed by dead control flow
{}
}(this, function (CryptoJS) {

	(function () {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var BlockCipher = C_lib.BlockCipher;
	    var C_algo = C.algo;

	    const N = 16;

	    //Origin pbox and sbox, derived from PI
	    const ORIG_P = [
	        0x243F6A88, 0x85A308D3, 0x13198A2E, 0x03707344,
	        0xA4093822, 0x299F31D0, 0x082EFA98, 0xEC4E6C89,
	        0x452821E6, 0x38D01377, 0xBE5466CF, 0x34E90C6C,
	        0xC0AC29B7, 0xC97C50DD, 0x3F84D5B5, 0xB5470917,
	        0x9216D5D9, 0x8979FB1B
	    ];

	    const ORIG_S = [
	        [   0xD1310BA6, 0x98DFB5AC, 0x2FFD72DB, 0xD01ADFB7,
	            0xB8E1AFED, 0x6A267E96, 0xBA7C9045, 0xF12C7F99,
	            0x24A19947, 0xB3916CF7, 0x0801F2E2, 0x858EFC16,
	            0x636920D8, 0x71574E69, 0xA458FEA3, 0xF4933D7E,
	            0x0D95748F, 0x728EB658, 0x718BCD58, 0x82154AEE,
	            0x7B54A41D, 0xC25A59B5, 0x9C30D539, 0x2AF26013,
	            0xC5D1B023, 0x286085F0, 0xCA417918, 0xB8DB38EF,
	            0x8E79DCB0, 0x603A180E, 0x6C9E0E8B, 0xB01E8A3E,
	            0xD71577C1, 0xBD314B27, 0x78AF2FDA, 0x55605C60,
	            0xE65525F3, 0xAA55AB94, 0x57489862, 0x63E81440,
	            0x55CA396A, 0x2AAB10B6, 0xB4CC5C34, 0x1141E8CE,
	            0xA15486AF, 0x7C72E993, 0xB3EE1411, 0x636FBC2A,
	            0x2BA9C55D, 0x741831F6, 0xCE5C3E16, 0x9B87931E,
	            0xAFD6BA33, 0x6C24CF5C, 0x7A325381, 0x28958677,
	            0x3B8F4898, 0x6B4BB9AF, 0xC4BFE81B, 0x66282193,
	            0x61D809CC, 0xFB21A991, 0x487CAC60, 0x5DEC8032,
	            0xEF845D5D, 0xE98575B1, 0xDC262302, 0xEB651B88,
	            0x23893E81, 0xD396ACC5, 0x0F6D6FF3, 0x83F44239,
	            0x2E0B4482, 0xA4842004, 0x69C8F04A, 0x9E1F9B5E,
	            0x21C66842, 0xF6E96C9A, 0x670C9C61, 0xABD388F0,
	            0x6A51A0D2, 0xD8542F68, 0x960FA728, 0xAB5133A3,
	            0x6EEF0B6C, 0x137A3BE4, 0xBA3BF050, 0x7EFB2A98,
	            0xA1F1651D, 0x39AF0176, 0x66CA593E, 0x82430E88,
	            0x8CEE8619, 0x456F9FB4, 0x7D84A5C3, 0x3B8B5EBE,
	            0xE06F75D8, 0x85C12073, 0x401A449F, 0x56C16AA6,
	            0x4ED3AA62, 0x363F7706, 0x1BFEDF72, 0x429B023D,
	            0x37D0D724, 0xD00A1248, 0xDB0FEAD3, 0x49F1C09B,
	            0x075372C9, 0x80991B7B, 0x25D479D8, 0xF6E8DEF7,
	            0xE3FE501A, 0xB6794C3B, 0x976CE0BD, 0x04C006BA,
	            0xC1A94FB6, 0x409F60C4, 0x5E5C9EC2, 0x196A2463,
	            0x68FB6FAF, 0x3E6C53B5, 0x1339B2EB, 0x3B52EC6F,
	            0x6DFC511F, 0x9B30952C, 0xCC814544, 0xAF5EBD09,
	            0xBEE3D004, 0xDE334AFD, 0x660F2807, 0x192E4BB3,
	            0xC0CBA857, 0x45C8740F, 0xD20B5F39, 0xB9D3FBDB,
	            0x5579C0BD, 0x1A60320A, 0xD6A100C6, 0x402C7279,
	            0x679F25FE, 0xFB1FA3CC, 0x8EA5E9F8, 0xDB3222F8,
	            0x3C7516DF, 0xFD616B15, 0x2F501EC8, 0xAD0552AB,
	            0x323DB5FA, 0xFD238760, 0x53317B48, 0x3E00DF82,
	            0x9E5C57BB, 0xCA6F8CA0, 0x1A87562E, 0xDF1769DB,
	            0xD542A8F6, 0x287EFFC3, 0xAC6732C6, 0x8C4F5573,
	            0x695B27B0, 0xBBCA58C8, 0xE1FFA35D, 0xB8F011A0,
	            0x10FA3D98, 0xFD2183B8, 0x4AFCB56C, 0x2DD1D35B,
	            0x9A53E479, 0xB6F84565, 0xD28E49BC, 0x4BFB9790,
	            0xE1DDF2DA, 0xA4CB7E33, 0x62FB1341, 0xCEE4C6E8,
	            0xEF20CADA, 0x36774C01, 0xD07E9EFE, 0x2BF11FB4,
	            0x95DBDA4D, 0xAE909198, 0xEAAD8E71, 0x6B93D5A0,
	            0xD08ED1D0, 0xAFC725E0, 0x8E3C5B2F, 0x8E7594B7,
	            0x8FF6E2FB, 0xF2122B64, 0x8888B812, 0x900DF01C,
	            0x4FAD5EA0, 0x688FC31C, 0xD1CFF191, 0xB3A8C1AD,
	            0x2F2F2218, 0xBE0E1777, 0xEA752DFE, 0x8B021FA1,
	            0xE5A0CC0F, 0xB56F74E8, 0x18ACF3D6, 0xCE89E299,
	            0xB4A84FE0, 0xFD13E0B7, 0x7CC43B81, 0xD2ADA8D9,
	            0x165FA266, 0x80957705, 0x93CC7314, 0x211A1477,
	            0xE6AD2065, 0x77B5FA86, 0xC75442F5, 0xFB9D35CF,
	            0xEBCDAF0C, 0x7B3E89A0, 0xD6411BD3, 0xAE1E7E49,
	            0x00250E2D, 0x2071B35E, 0x226800BB, 0x57B8E0AF,
	            0x2464369B, 0xF009B91E, 0x5563911D, 0x59DFA6AA,
	            0x78C14389, 0xD95A537F, 0x207D5BA2, 0x02E5B9C5,
	            0x83260376, 0x6295CFA9, 0x11C81968, 0x4E734A41,
	            0xB3472DCA, 0x7B14A94A, 0x1B510052, 0x9A532915,
	            0xD60F573F, 0xBC9BC6E4, 0x2B60A476, 0x81E67400,
	            0x08BA6FB5, 0x571BE91F, 0xF296EC6B, 0x2A0DD915,
	            0xB6636521, 0xE7B9F9B6, 0xFF34052E, 0xC5855664,
	            0x53B02D5D, 0xA99F8FA1, 0x08BA4799, 0x6E85076A   ],
	        [   0x4B7A70E9, 0xB5B32944, 0xDB75092E, 0xC4192623,
	            0xAD6EA6B0, 0x49A7DF7D, 0x9CEE60B8, 0x8FEDB266,
	            0xECAA8C71, 0x699A17FF, 0x5664526C, 0xC2B19EE1,
	            0x193602A5, 0x75094C29, 0xA0591340, 0xE4183A3E,
	            0x3F54989A, 0x5B429D65, 0x6B8FE4D6, 0x99F73FD6,
	            0xA1D29C07, 0xEFE830F5, 0x4D2D38E6, 0xF0255DC1,
	            0x4CDD2086, 0x8470EB26, 0x6382E9C6, 0x021ECC5E,
	            0x09686B3F, 0x3EBAEFC9, 0x3C971814, 0x6B6A70A1,
	            0x687F3584, 0x52A0E286, 0xB79C5305, 0xAA500737,
	            0x3E07841C, 0x7FDEAE5C, 0x8E7D44EC, 0x5716F2B8,
	            0xB03ADA37, 0xF0500C0D, 0xF01C1F04, 0x0200B3FF,
	            0xAE0CF51A, 0x3CB574B2, 0x25837A58, 0xDC0921BD,
	            0xD19113F9, 0x7CA92FF6, 0x94324773, 0x22F54701,
	            0x3AE5E581, 0x37C2DADC, 0xC8B57634, 0x9AF3DDA7,
	            0xA9446146, 0x0FD0030E, 0xECC8C73E, 0xA4751E41,
	            0xE238CD99, 0x3BEA0E2F, 0x3280BBA1, 0x183EB331,
	            0x4E548B38, 0x4F6DB908, 0x6F420D03, 0xF60A04BF,
	            0x2CB81290, 0x24977C79, 0x5679B072, 0xBCAF89AF,
	            0xDE9A771F, 0xD9930810, 0xB38BAE12, 0xDCCF3F2E,
	            0x5512721F, 0x2E6B7124, 0x501ADDE6, 0x9F84CD87,
	            0x7A584718, 0x7408DA17, 0xBC9F9ABC, 0xE94B7D8C,
	            0xEC7AEC3A, 0xDB851DFA, 0x63094366, 0xC464C3D2,
	            0xEF1C1847, 0x3215D908, 0xDD433B37, 0x24C2BA16,
	            0x12A14D43, 0x2A65C451, 0x50940002, 0x133AE4DD,
	            0x71DFF89E, 0x10314E55, 0x81AC77D6, 0x5F11199B,
	            0x043556F1, 0xD7A3C76B, 0x3C11183B, 0x5924A509,
	            0xF28FE6ED, 0x97F1FBFA, 0x9EBABF2C, 0x1E153C6E,
	            0x86E34570, 0xEAE96FB1, 0x860E5E0A, 0x5A3E2AB3,
	            0x771FE71C, 0x4E3D06FA, 0x2965DCB9, 0x99E71D0F,
	            0x803E89D6, 0x5266C825, 0x2E4CC978, 0x9C10B36A,
	            0xC6150EBA, 0x94E2EA78, 0xA5FC3C53, 0x1E0A2DF4,
	            0xF2F74EA7, 0x361D2B3D, 0x1939260F, 0x19C27960,
	            0x5223A708, 0xF71312B6, 0xEBADFE6E, 0xEAC31F66,
	            0xE3BC4595, 0xA67BC883, 0xB17F37D1, 0x018CFF28,
	            0xC332DDEF, 0xBE6C5AA5, 0x65582185, 0x68AB9802,
	            0xEECEA50F, 0xDB2F953B, 0x2AEF7DAD, 0x5B6E2F84,
	            0x1521B628, 0x29076170, 0xECDD4775, 0x619F1510,
	            0x13CCA830, 0xEB61BD96, 0x0334FE1E, 0xAA0363CF,
	            0xB5735C90, 0x4C70A239, 0xD59E9E0B, 0xCBAADE14,
	            0xEECC86BC, 0x60622CA7, 0x9CAB5CAB, 0xB2F3846E,
	            0x648B1EAF, 0x19BDF0CA, 0xA02369B9, 0x655ABB50,
	            0x40685A32, 0x3C2AB4B3, 0x319EE9D5, 0xC021B8F7,
	            0x9B540B19, 0x875FA099, 0x95F7997E, 0x623D7DA8,
	            0xF837889A, 0x97E32D77, 0x11ED935F, 0x16681281,
	            0x0E358829, 0xC7E61FD6, 0x96DEDFA1, 0x7858BA99,
	            0x57F584A5, 0x1B227263, 0x9B83C3FF, 0x1AC24696,
	            0xCDB30AEB, 0x532E3054, 0x8FD948E4, 0x6DBC3128,
	            0x58EBF2EF, 0x34C6FFEA, 0xFE28ED61, 0xEE7C3C73,
	            0x5D4A14D9, 0xE864B7E3, 0x42105D14, 0x203E13E0,
	            0x45EEE2B6, 0xA3AAABEA, 0xDB6C4F15, 0xFACB4FD0,
	            0xC742F442, 0xEF6ABBB5, 0x654F3B1D, 0x41CD2105,
	            0xD81E799E, 0x86854DC7, 0xE44B476A, 0x3D816250,
	            0xCF62A1F2, 0x5B8D2646, 0xFC8883A0, 0xC1C7B6A3,
	            0x7F1524C3, 0x69CB7492, 0x47848A0B, 0x5692B285,
	            0x095BBF00, 0xAD19489D, 0x1462B174, 0x23820E00,
	            0x58428D2A, 0x0C55F5EA, 0x1DADF43E, 0x233F7061,
	            0x3372F092, 0x8D937E41, 0xD65FECF1, 0x6C223BDB,
	            0x7CDE3759, 0xCBEE7460, 0x4085F2A7, 0xCE77326E,
	            0xA6078084, 0x19F8509E, 0xE8EFD855, 0x61D99735,
	            0xA969A7AA, 0xC50C06C2, 0x5A04ABFC, 0x800BCADC,
	            0x9E447A2E, 0xC3453484, 0xFDD56705, 0x0E1E9EC9,
	            0xDB73DBD3, 0x105588CD, 0x675FDA79, 0xE3674340,
	            0xC5C43465, 0x713E38D8, 0x3D28F89E, 0xF16DFF20,
	            0x153E21E7, 0x8FB03D4A, 0xE6E39F2B, 0xDB83ADF7   ],
	        [   0xE93D5A68, 0x948140F7, 0xF64C261C, 0x94692934,
	            0x411520F7, 0x7602D4F7, 0xBCF46B2E, 0xD4A20068,
	            0xD4082471, 0x3320F46A, 0x43B7D4B7, 0x500061AF,
	            0x1E39F62E, 0x97244546, 0x14214F74, 0xBF8B8840,
	            0x4D95FC1D, 0x96B591AF, 0x70F4DDD3, 0x66A02F45,
	            0xBFBC09EC, 0x03BD9785, 0x7FAC6DD0, 0x31CB8504,
	            0x96EB27B3, 0x55FD3941, 0xDA2547E6, 0xABCA0A9A,
	            0x28507825, 0x530429F4, 0x0A2C86DA, 0xE9B66DFB,
	            0x68DC1462, 0xD7486900, 0x680EC0A4, 0x27A18DEE,
	            0x4F3FFEA2, 0xE887AD8C, 0xB58CE006, 0x7AF4D6B6,
	            0xAACE1E7C, 0xD3375FEC, 0xCE78A399, 0x406B2A42,
	            0x20FE9E35, 0xD9F385B9, 0xEE39D7AB, 0x3B124E8B,
	            0x1DC9FAF7, 0x4B6D1856, 0x26A36631, 0xEAE397B2,
	            0x3A6EFA74, 0xDD5B4332, 0x6841E7F7, 0xCA7820FB,
	            0xFB0AF54E, 0xD8FEB397, 0x454056AC, 0xBA489527,
	            0x55533A3A, 0x20838D87, 0xFE6BA9B7, 0xD096954B,
	            0x55A867BC, 0xA1159A58, 0xCCA92963, 0x99E1DB33,
	            0xA62A4A56, 0x3F3125F9, 0x5EF47E1C, 0x9029317C,
	            0xFDF8E802, 0x04272F70, 0x80BB155C, 0x05282CE3,
	            0x95C11548, 0xE4C66D22, 0x48C1133F, 0xC70F86DC,
	            0x07F9C9EE, 0x41041F0F, 0x404779A4, 0x5D886E17,
	            0x325F51EB, 0xD59BC0D1, 0xF2BCC18F, 0x41113564,
	            0x257B7834, 0x602A9C60, 0xDFF8E8A3, 0x1F636C1B,
	            0x0E12B4C2, 0x02E1329E, 0xAF664FD1, 0xCAD18115,
	            0x6B2395E0, 0x333E92E1, 0x3B240B62, 0xEEBEB922,
	            0x85B2A20E, 0xE6BA0D99, 0xDE720C8C, 0x2DA2F728,
	            0xD0127845, 0x95B794FD, 0x647D0862, 0xE7CCF5F0,
	            0x5449A36F, 0x877D48FA, 0xC39DFD27, 0xF33E8D1E,
	            0x0A476341, 0x992EFF74, 0x3A6F6EAB, 0xF4F8FD37,
	            0xA812DC60, 0xA1EBDDF8, 0x991BE14C, 0xDB6E6B0D,
	            0xC67B5510, 0x6D672C37, 0x2765D43B, 0xDCD0E804,
	            0xF1290DC7, 0xCC00FFA3, 0xB5390F92, 0x690FED0B,
	            0x667B9FFB, 0xCEDB7D9C, 0xA091CF0B, 0xD9155EA3,
	            0xBB132F88, 0x515BAD24, 0x7B9479BF, 0x763BD6EB,
	            0x37392EB3, 0xCC115979, 0x8026E297, 0xF42E312D,
	            0x6842ADA7, 0xC66A2B3B, 0x12754CCC, 0x782EF11C,
	            0x6A124237, 0xB79251E7, 0x06A1BBE6, 0x4BFB6350,
	            0x1A6B1018, 0x11CAEDFA, 0x3D25BDD8, 0xE2E1C3C9,
	            0x44421659, 0x0A121386, 0xD90CEC6E, 0xD5ABEA2A,
	            0x64AF674E, 0xDA86A85F, 0xBEBFE988, 0x64E4C3FE,
	            0x9DBC8057, 0xF0F7C086, 0x60787BF8, 0x6003604D,
	            0xD1FD8346, 0xF6381FB0, 0x7745AE04, 0xD736FCCC,
	            0x83426B33, 0xF01EAB71, 0xB0804187, 0x3C005E5F,
	            0x77A057BE, 0xBDE8AE24, 0x55464299, 0xBF582E61,
	            0x4E58F48F, 0xF2DDFDA2, 0xF474EF38, 0x8789BDC2,
	            0x5366F9C3, 0xC8B38E74, 0xB475F255, 0x46FCD9B9,
	            0x7AEB2661, 0x8B1DDF84, 0x846A0E79, 0x915F95E2,
	            0x466E598E, 0x20B45770, 0x8CD55591, 0xC902DE4C,
	            0xB90BACE1, 0xBB8205D0, 0x11A86248, 0x7574A99E,
	            0xB77F19B6, 0xE0A9DC09, 0x662D09A1, 0xC4324633,
	            0xE85A1F02, 0x09F0BE8C, 0x4A99A025, 0x1D6EFE10,
	            0x1AB93D1D, 0x0BA5A4DF, 0xA186F20F, 0x2868F169,
	            0xDCB7DA83, 0x573906FE, 0xA1E2CE9B, 0x4FCD7F52,
	            0x50115E01, 0xA70683FA, 0xA002B5C4, 0x0DE6D027,
	            0x9AF88C27, 0x773F8641, 0xC3604C06, 0x61A806B5,
	            0xF0177A28, 0xC0F586E0, 0x006058AA, 0x30DC7D62,
	            0x11E69ED7, 0x2338EA63, 0x53C2DD94, 0xC2C21634,
	            0xBBCBEE56, 0x90BCB6DE, 0xEBFC7DA1, 0xCE591D76,
	            0x6F05E409, 0x4B7C0188, 0x39720A3D, 0x7C927C24,
	            0x86E3725F, 0x724D9DB9, 0x1AC15BB4, 0xD39EB8FC,
	            0xED545578, 0x08FCA5B5, 0xD83D7CD3, 0x4DAD0FC4,
	            0x1E50EF5E, 0xB161E6F8, 0xA28514D9, 0x6C51133C,
	            0x6FD5C7E7, 0x56E14EC4, 0x362ABFCE, 0xDDC6C837,
	            0xD79A3234, 0x92638212, 0x670EFA8E, 0x406000E0  ],
	        [   0x3A39CE37, 0xD3FAF5CF, 0xABC27737, 0x5AC52D1B,
	            0x5CB0679E, 0x4FA33742, 0xD3822740, 0x99BC9BBE,
	            0xD5118E9D, 0xBF0F7315, 0xD62D1C7E, 0xC700C47B,
	            0xB78C1B6B, 0x21A19045, 0xB26EB1BE, 0x6A366EB4,
	            0x5748AB2F, 0xBC946E79, 0xC6A376D2, 0x6549C2C8,
	            0x530FF8EE, 0x468DDE7D, 0xD5730A1D, 0x4CD04DC6,
	            0x2939BBDB, 0xA9BA4650, 0xAC9526E8, 0xBE5EE304,
	            0xA1FAD5F0, 0x6A2D519A, 0x63EF8CE2, 0x9A86EE22,
	            0xC089C2B8, 0x43242EF6, 0xA51E03AA, 0x9CF2D0A4,
	            0x83C061BA, 0x9BE96A4D, 0x8FE51550, 0xBA645BD6,
	            0x2826A2F9, 0xA73A3AE1, 0x4BA99586, 0xEF5562E9,
	            0xC72FEFD3, 0xF752F7DA, 0x3F046F69, 0x77FA0A59,
	            0x80E4A915, 0x87B08601, 0x9B09E6AD, 0x3B3EE593,
	            0xE990FD5A, 0x9E34D797, 0x2CF0B7D9, 0x022B8B51,
	            0x96D5AC3A, 0x017DA67D, 0xD1CF3ED6, 0x7C7D2D28,
	            0x1F9F25CF, 0xADF2B89B, 0x5AD6B472, 0x5A88F54C,
	            0xE029AC71, 0xE019A5E6, 0x47B0ACFD, 0xED93FA9B,
	            0xE8D3C48D, 0x283B57CC, 0xF8D56629, 0x79132E28,
	            0x785F0191, 0xED756055, 0xF7960E44, 0xE3D35E8C,
	            0x15056DD4, 0x88F46DBA, 0x03A16125, 0x0564F0BD,
	            0xC3EB9E15, 0x3C9057A2, 0x97271AEC, 0xA93A072A,
	            0x1B3F6D9B, 0x1E6321F5, 0xF59C66FB, 0x26DCF319,
	            0x7533D928, 0xB155FDF5, 0x03563482, 0x8ABA3CBB,
	            0x28517711, 0xC20AD9F8, 0xABCC5167, 0xCCAD925F,
	            0x4DE81751, 0x3830DC8E, 0x379D5862, 0x9320F991,
	            0xEA7A90C2, 0xFB3E7BCE, 0x5121CE64, 0x774FBE32,
	            0xA8B6E37E, 0xC3293D46, 0x48DE5369, 0x6413E680,
	            0xA2AE0810, 0xDD6DB224, 0x69852DFD, 0x09072166,
	            0xB39A460A, 0x6445C0DD, 0x586CDECF, 0x1C20C8AE,
	            0x5BBEF7DD, 0x1B588D40, 0xCCD2017F, 0x6BB4E3BB,
	            0xDDA26A7E, 0x3A59FF45, 0x3E350A44, 0xBCB4CDD5,
	            0x72EACEA8, 0xFA6484BB, 0x8D6612AE, 0xBF3C6F47,
	            0xD29BE463, 0x542F5D9E, 0xAEC2771B, 0xF64E6370,
	            0x740E0D8D, 0xE75B1357, 0xF8721671, 0xAF537D5D,
	            0x4040CB08, 0x4EB4E2CC, 0x34D2466A, 0x0115AF84,
	            0xE1B00428, 0x95983A1D, 0x06B89FB4, 0xCE6EA048,
	            0x6F3F3B82, 0x3520AB82, 0x011A1D4B, 0x277227F8,
	            0x611560B1, 0xE7933FDC, 0xBB3A792B, 0x344525BD,
	            0xA08839E1, 0x51CE794B, 0x2F32C9B7, 0xA01FBAC9,
	            0xE01CC87E, 0xBCC7D1F6, 0xCF0111C3, 0xA1E8AAC7,
	            0x1A908749, 0xD44FBD9A, 0xD0DADECB, 0xD50ADA38,
	            0x0339C32A, 0xC6913667, 0x8DF9317C, 0xE0B12B4F,
	            0xF79E59B7, 0x43F5BB3A, 0xF2D519FF, 0x27D9459C,
	            0xBF97222C, 0x15E6FC2A, 0x0F91FC71, 0x9B941525,
	            0xFAE59361, 0xCEB69CEB, 0xC2A86459, 0x12BAA8D1,
	            0xB6C1075E, 0xE3056A0C, 0x10D25065, 0xCB03A442,
	            0xE0EC6E0E, 0x1698DB3B, 0x4C98A0BE, 0x3278E964,
	            0x9F1F9532, 0xE0D392DF, 0xD3A0342B, 0x8971F21E,
	            0x1B0A7441, 0x4BA3348C, 0xC5BE7120, 0xC37632D8,
	            0xDF359F8D, 0x9B992F2E, 0xE60B6F47, 0x0FE3F11D,
	            0xE54CDA54, 0x1EDAD891, 0xCE6279CF, 0xCD3E7E6F,
	            0x1618B166, 0xFD2C1D05, 0x848FD2C5, 0xF6FB2299,
	            0xF523F357, 0xA6327623, 0x93A83531, 0x56CCCD02,
	            0xACF08162, 0x5A75EBB5, 0x6E163697, 0x88D273CC,
	            0xDE966292, 0x81B949D0, 0x4C50901B, 0x71C65614,
	            0xE6C6C7BD, 0x327A140A, 0x45E1D006, 0xC3F27B9A,
	            0xC9AA53FD, 0x62A80F00, 0xBB25BFE2, 0x35BDD2F6,
	            0x71126905, 0xB2040222, 0xB6CBCF7C, 0xCD769C2B,
	            0x53113EC0, 0x1640E3D3, 0x38ABBD60, 0x2547ADF0,
	            0xBA38209C, 0xF746CE76, 0x77AFA1C5, 0x20756060,
	            0x85CBFE4E, 0x8AE88DD8, 0x7AAAF9B0, 0x4CF9AA7E,
	            0x1948C25C, 0x02FB8A8C, 0x01C36AE4, 0xD6EBE1F9,
	            0x90D4F869, 0xA65CDEA0, 0x3F09252D, 0xC208E69F,
	            0xB74E6132, 0xCE77E25B, 0x578FDFE3, 0x3AC372E6  ]
	    ];

	    var BLOWFISH_CTX = {
	        pbox: [],
	        sbox: []
	    }

	    function F(ctx, x){
	        let a = (x >> 24) & 0xFF;
	        let b = (x >> 16) & 0xFF;
	        let c = (x >> 8) & 0xFF;
	        let d = x & 0xFF;

	        let y = ctx.sbox[0][a] + ctx.sbox[1][b];
	        y = y ^ ctx.sbox[2][c];
	        y = y + ctx.sbox[3][d];

	        return y;
	    }

	    function BlowFish_Encrypt(ctx, left, right){
	        let Xl = left;
	        let Xr = right;
	        let temp;

	        for(let i = 0; i < N; ++i){
	            Xl = Xl ^ ctx.pbox[i];
	            Xr = F(ctx, Xl) ^ Xr;

	            temp = Xl;
	            Xl = Xr;
	            Xr = temp;
	        }

	        temp = Xl;
	        Xl = Xr;
	        Xr = temp;

	        Xr = Xr ^ ctx.pbox[N];
	        Xl = Xl ^ ctx.pbox[N + 1];

	        return {left: Xl, right: Xr};
	    }

	    function BlowFish_Decrypt(ctx, left, right){
	        let Xl = left;
	        let Xr = right;
	        let temp;

	        for(let i = N + 1; i > 1; --i){
	            Xl = Xl ^ ctx.pbox[i];
	            Xr = F(ctx, Xl) ^ Xr;

	            temp = Xl;
	            Xl = Xr;
	            Xr = temp;
	        }

	        temp = Xl;
	        Xl = Xr;
	        Xr = temp;

	        Xr = Xr ^ ctx.pbox[1];
	        Xl = Xl ^ ctx.pbox[0];

	        return {left: Xl, right: Xr};
	    }

	    /**
	     * Initialization ctx's pbox and sbox.
	     *
	     * @param {Object} ctx The object has pbox and sbox.
	     * @param {Array} key An array of 32-bit words.
	     * @param {int} keysize The length of the key.
	     *
	     * @example
	     *
	     *     BlowFishInit(BLOWFISH_CTX, key, 128/32);
	     */
	    function BlowFishInit(ctx, key, keysize)
	    {
	        for(let Row = 0; Row < 4; Row++)
	        {
	            ctx.sbox[Row] = [];
	            for(let Col = 0; Col < 256; Col++)
	            {
	                ctx.sbox[Row][Col] = ORIG_S[Row][Col];
	            }
	        }

	        let keyIndex = 0;
	        for(let index = 0; index < N + 2; index++)
	        {
	            ctx.pbox[index] = ORIG_P[index] ^ key[keyIndex];
	            keyIndex++;
	            if(keyIndex >= keysize)
	            {
	                keyIndex = 0;
	            }
	        }

	        let Data1 = 0;
	        let Data2 = 0;
	        let res = 0;
	        for(let i = 0; i < N + 2; i += 2)
	        {
	            res = BlowFish_Encrypt(ctx, Data1, Data2);
	            Data1 = res.left;
	            Data2 = res.right;
	            ctx.pbox[i] = Data1;
	            ctx.pbox[i + 1] = Data2;
	        }

	        for(let i = 0; i < 4; i++)
	        {
	            for(let j = 0; j < 256; j += 2)
	            {
	                res = BlowFish_Encrypt(ctx, Data1, Data2);
	                Data1 = res.left;
	                Data2 = res.right;
	                ctx.sbox[i][j] = Data1;
	                ctx.sbox[i][j + 1] = Data2;
	            }
	        }

	        return true;
	    }

	    /**
	     * Blowfish block cipher algorithm.
	     */
	    var Blowfish = C_algo.Blowfish = BlockCipher.extend({
	        _doReset: function () {
	            // Skip reset of nRounds has been set before and key did not change
	            if (this._keyPriorReset === this._key) {
	                return;
	            }

	            // Shortcuts
	            var key = this._keyPriorReset = this._key;
	            var keyWords = key.words;
	            var keySize = key.sigBytes / 4;

	            //Initialization pbox and sbox
	            BlowFishInit(BLOWFISH_CTX, keyWords, keySize);
	        },

	        encryptBlock: function (M, offset) {
	            var res = BlowFish_Encrypt(BLOWFISH_CTX, M[offset], M[offset + 1]);
	            M[offset] = res.left;
	            M[offset + 1] = res.right;
	        },

	        decryptBlock: function (M, offset) {
	            var res = BlowFish_Decrypt(BLOWFISH_CTX, M[offset], M[offset + 1]);
	            M[offset] = res.left;
	            M[offset + 1] = res.right;
	        },

	        blockSize: 64/32,

	        keySize: 128/32,

	        ivSize: 64/32
	    });

	    /**
	     * Shortcut functions to the cipher's object interface.
	     *
	     * @example
	     *
	     *     var ciphertext = CryptoJS.Blowfish.encrypt(message, key, cfg);
	     *     var plaintext  = CryptoJS.Blowfish.decrypt(ciphertext, key, cfg);
	     */
	    C.Blowfish = BlockCipher._createHelper(Blowfish);
	}());


	return CryptoJS.Blowfish;

}));

/***/ }),

/***/ "./js-sdk-legacy/node_modules/crypto-js/cipher-core.js":
/*!*************************************************************!*\
  !*** ./js-sdk-legacy/node_modules/crypto-js/cipher-core.js ***!
  \*************************************************************/
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory, undef) {
	if (true) {
		// CommonJS
		module.exports = exports = factory(__webpack_require__(/*! ./core */ "./js-sdk-legacy/node_modules/crypto-js/core.js"), __webpack_require__(/*! ./evpkdf */ "./js-sdk-legacy/node_modules/crypto-js/evpkdf.js"));
	}
	else // removed by dead control flow
{}
}(this, function (CryptoJS) {

	/**
	 * Cipher core components.
	 */
	CryptoJS.lib.Cipher || (function (undefined) {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var Base = C_lib.Base;
	    var WordArray = C_lib.WordArray;
	    var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm;
	    var C_enc = C.enc;
	    var Utf8 = C_enc.Utf8;
	    var Base64 = C_enc.Base64;
	    var C_algo = C.algo;
	    var EvpKDF = C_algo.EvpKDF;

	    /**
	     * Abstract base cipher template.
	     *
	     * @property {number} keySize This cipher's key size. Default: 4 (128 bits)
	     * @property {number} ivSize This cipher's IV size. Default: 4 (128 bits)
	     * @property {number} _ENC_XFORM_MODE A constant representing encryption mode.
	     * @property {number} _DEC_XFORM_MODE A constant representing decryption mode.
	     */
	    var Cipher = C_lib.Cipher = BufferedBlockAlgorithm.extend({
	        /**
	         * Configuration options.
	         *
	         * @property {WordArray} iv The IV to use for this operation.
	         */
	        cfg: Base.extend(),

	        /**
	         * Creates this cipher in encryption mode.
	         *
	         * @param {WordArray} key The key.
	         * @param {Object} cfg (Optional) The configuration options to use for this operation.
	         *
	         * @return {Cipher} A cipher instance.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var cipher = CryptoJS.algo.AES.createEncryptor(keyWordArray, { iv: ivWordArray });
	         */
	        createEncryptor: function (key, cfg) {
	            return this.create(this._ENC_XFORM_MODE, key, cfg);
	        },

	        /**
	         * Creates this cipher in decryption mode.
	         *
	         * @param {WordArray} key The key.
	         * @param {Object} cfg (Optional) The configuration options to use for this operation.
	         *
	         * @return {Cipher} A cipher instance.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var cipher = CryptoJS.algo.AES.createDecryptor(keyWordArray, { iv: ivWordArray });
	         */
	        createDecryptor: function (key, cfg) {
	            return this.create(this._DEC_XFORM_MODE, key, cfg);
	        },

	        /**
	         * Initializes a newly created cipher.
	         *
	         * @param {number} xformMode Either the encryption or decryption transormation mode constant.
	         * @param {WordArray} key The key.
	         * @param {Object} cfg (Optional) The configuration options to use for this operation.
	         *
	         * @example
	         *
	         *     var cipher = CryptoJS.algo.AES.create(CryptoJS.algo.AES._ENC_XFORM_MODE, keyWordArray, { iv: ivWordArray });
	         */
	        init: function (xformMode, key, cfg) {
	            // Apply config defaults
	            this.cfg = this.cfg.extend(cfg);

	            // Store transform mode and key
	            this._xformMode = xformMode;
	            this._key = key;

	            // Set initial values
	            this.reset();
	        },

	        /**
	         * Resets this cipher to its initial state.
	         *
	         * @example
	         *
	         *     cipher.reset();
	         */
	        reset: function () {
	            // Reset data buffer
	            BufferedBlockAlgorithm.reset.call(this);

	            // Perform concrete-cipher logic
	            this._doReset();
	        },

	        /**
	         * Adds data to be encrypted or decrypted.
	         *
	         * @param {WordArray|string} dataUpdate The data to encrypt or decrypt.
	         *
	         * @return {WordArray} The data after processing.
	         *
	         * @example
	         *
	         *     var encrypted = cipher.process('data');
	         *     var encrypted = cipher.process(wordArray);
	         */
	        process: function (dataUpdate) {
	            // Append
	            this._append(dataUpdate);

	            // Process available blocks
	            return this._process();
	        },

	        /**
	         * Finalizes the encryption or decryption process.
	         * Note that the finalize operation is effectively a destructive, read-once operation.
	         *
	         * @param {WordArray|string} dataUpdate The final data to encrypt or decrypt.
	         *
	         * @return {WordArray} The data after final processing.
	         *
	         * @example
	         *
	         *     var encrypted = cipher.finalize();
	         *     var encrypted = cipher.finalize('data');
	         *     var encrypted = cipher.finalize(wordArray);
	         */
	        finalize: function (dataUpdate) {
	            // Final data update
	            if (dataUpdate) {
	                this._append(dataUpdate);
	            }

	            // Perform concrete-cipher logic
	            var finalProcessedData = this._doFinalize();

	            return finalProcessedData;
	        },

	        keySize: 128/32,

	        ivSize: 128/32,

	        _ENC_XFORM_MODE: 1,

	        _DEC_XFORM_MODE: 2,

	        /**
	         * Creates shortcut functions to a cipher's object interface.
	         *
	         * @param {Cipher} cipher The cipher to create a helper for.
	         *
	         * @return {Object} An object with encrypt and decrypt shortcut functions.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var AES = CryptoJS.lib.Cipher._createHelper(CryptoJS.algo.AES);
	         */
	        _createHelper: (function () {
	            function selectCipherStrategy(key) {
	                if (typeof key == 'string') {
	                    return PasswordBasedCipher;
	                } else {
	                    return SerializableCipher;
	                }
	            }

	            return function (cipher) {
	                return {
	                    encrypt: function (message, key, cfg) {
	                        return selectCipherStrategy(key).encrypt(cipher, message, key, cfg);
	                    },

	                    decrypt: function (ciphertext, key, cfg) {
	                        return selectCipherStrategy(key).decrypt(cipher, ciphertext, key, cfg);
	                    }
	                };
	            };
	        }())
	    });

	    /**
	     * Abstract base stream cipher template.
	     *
	     * @property {number} blockSize The number of 32-bit words this cipher operates on. Default: 1 (32 bits)
	     */
	    var StreamCipher = C_lib.StreamCipher = Cipher.extend({
	        _doFinalize: function () {
	            // Process partial blocks
	            var finalProcessedBlocks = this._process(!!'flush');

	            return finalProcessedBlocks;
	        },

	        blockSize: 1
	    });

	    /**
	     * Mode namespace.
	     */
	    var C_mode = C.mode = {};

	    /**
	     * Abstract base block cipher mode template.
	     */
	    var BlockCipherMode = C_lib.BlockCipherMode = Base.extend({
	        /**
	         * Creates this mode for encryption.
	         *
	         * @param {Cipher} cipher A block cipher instance.
	         * @param {Array} iv The IV words.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var mode = CryptoJS.mode.CBC.createEncryptor(cipher, iv.words);
	         */
	        createEncryptor: function (cipher, iv) {
	            return this.Encryptor.create(cipher, iv);
	        },

	        /**
	         * Creates this mode for decryption.
	         *
	         * @param {Cipher} cipher A block cipher instance.
	         * @param {Array} iv The IV words.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var mode = CryptoJS.mode.CBC.createDecryptor(cipher, iv.words);
	         */
	        createDecryptor: function (cipher, iv) {
	            return this.Decryptor.create(cipher, iv);
	        },

	        /**
	         * Initializes a newly created mode.
	         *
	         * @param {Cipher} cipher A block cipher instance.
	         * @param {Array} iv The IV words.
	         *
	         * @example
	         *
	         *     var mode = CryptoJS.mode.CBC.Encryptor.create(cipher, iv.words);
	         */
	        init: function (cipher, iv) {
	            this._cipher = cipher;
	            this._iv = iv;
	        }
	    });

	    /**
	     * Cipher Block Chaining mode.
	     */
	    var CBC = C_mode.CBC = (function () {
	        /**
	         * Abstract base CBC mode.
	         */
	        var CBC = BlockCipherMode.extend();

	        /**
	         * CBC encryptor.
	         */
	        CBC.Encryptor = CBC.extend({
	            /**
	             * Processes the data block at offset.
	             *
	             * @param {Array} words The data words to operate on.
	             * @param {number} offset The offset where the block starts.
	             *
	             * @example
	             *
	             *     mode.processBlock(data.words, offset);
	             */
	            processBlock: function (words, offset) {
	                // Shortcuts
	                var cipher = this._cipher;
	                var blockSize = cipher.blockSize;

	                // XOR and encrypt
	                xorBlock.call(this, words, offset, blockSize);
	                cipher.encryptBlock(words, offset);

	                // Remember this block to use with next block
	                this._prevBlock = words.slice(offset, offset + blockSize);
	            }
	        });

	        /**
	         * CBC decryptor.
	         */
	        CBC.Decryptor = CBC.extend({
	            /**
	             * Processes the data block at offset.
	             *
	             * @param {Array} words The data words to operate on.
	             * @param {number} offset The offset where the block starts.
	             *
	             * @example
	             *
	             *     mode.processBlock(data.words, offset);
	             */
	            processBlock: function (words, offset) {
	                // Shortcuts
	                var cipher = this._cipher;
	                var blockSize = cipher.blockSize;

	                // Remember this block to use with next block
	                var thisBlock = words.slice(offset, offset + blockSize);

	                // Decrypt and XOR
	                cipher.decryptBlock(words, offset);
	                xorBlock.call(this, words, offset, blockSize);

	                // This block becomes the previous block
	                this._prevBlock = thisBlock;
	            }
	        });

	        function xorBlock(words, offset, blockSize) {
	            var block;

	            // Shortcut
	            var iv = this._iv;

	            // Choose mixing block
	            if (iv) {
	                block = iv;

	                // Remove IV for subsequent blocks
	                this._iv = undefined;
	            } else {
	                block = this._prevBlock;
	            }

	            // XOR blocks
	            for (var i = 0; i < blockSize; i++) {
	                words[offset + i] ^= block[i];
	            }
	        }

	        return CBC;
	    }());

	    /**
	     * Padding namespace.
	     */
	    var C_pad = C.pad = {};

	    /**
	     * PKCS #5/7 padding strategy.
	     */
	    var Pkcs7 = C_pad.Pkcs7 = {
	        /**
	         * Pads data using the algorithm defined in PKCS #5/7.
	         *
	         * @param {WordArray} data The data to pad.
	         * @param {number} blockSize The multiple that the data should be padded to.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     CryptoJS.pad.Pkcs7.pad(wordArray, 4);
	         */
	        pad: function (data, blockSize) {
	            // Shortcut
	            var blockSizeBytes = blockSize * 4;

	            // Count padding bytes
	            var nPaddingBytes = blockSizeBytes - data.sigBytes % blockSizeBytes;

	            // Create padding word
	            var paddingWord = (nPaddingBytes << 24) | (nPaddingBytes << 16) | (nPaddingBytes << 8) | nPaddingBytes;

	            // Create padding
	            var paddingWords = [];
	            for (var i = 0; i < nPaddingBytes; i += 4) {
	                paddingWords.push(paddingWord);
	            }
	            var padding = WordArray.create(paddingWords, nPaddingBytes);

	            // Add padding
	            data.concat(padding);
	        },

	        /**
	         * Unpads data that had been padded using the algorithm defined in PKCS #5/7.
	         *
	         * @param {WordArray} data The data to unpad.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     CryptoJS.pad.Pkcs7.unpad(wordArray);
	         */
	        unpad: function (data) {
	            // Get number of padding bytes from last byte
	            var nPaddingBytes = data.words[(data.sigBytes - 1) >>> 2] & 0xff;

	            // Remove padding
	            data.sigBytes -= nPaddingBytes;
	        }
	    };

	    /**
	     * Abstract base block cipher template.
	     *
	     * @property {number} blockSize The number of 32-bit words this cipher operates on. Default: 4 (128 bits)
	     */
	    var BlockCipher = C_lib.BlockCipher = Cipher.extend({
	        /**
	         * Configuration options.
	         *
	         * @property {Mode} mode The block mode to use. Default: CBC
	         * @property {Padding} padding The padding strategy to use. Default: Pkcs7
	         */
	        cfg: Cipher.cfg.extend({
	            mode: CBC,
	            padding: Pkcs7
	        }),

	        reset: function () {
	            var modeCreator;

	            // Reset cipher
	            Cipher.reset.call(this);

	            // Shortcuts
	            var cfg = this.cfg;
	            var iv = cfg.iv;
	            var mode = cfg.mode;

	            // Reset block mode
	            if (this._xformMode == this._ENC_XFORM_MODE) {
	                modeCreator = mode.createEncryptor;
	            } else /* if (this._xformMode == this._DEC_XFORM_MODE) */ {
	                modeCreator = mode.createDecryptor;
	                // Keep at least one block in the buffer for unpadding
	                this._minBufferSize = 1;
	            }

	            if (this._mode && this._mode.__creator == modeCreator) {
	                this._mode.init(this, iv && iv.words);
	            } else {
	                this._mode = modeCreator.call(mode, this, iv && iv.words);
	                this._mode.__creator = modeCreator;
	            }
	        },

	        _doProcessBlock: function (words, offset) {
	            this._mode.processBlock(words, offset);
	        },

	        _doFinalize: function () {
	            var finalProcessedBlocks;

	            // Shortcut
	            var padding = this.cfg.padding;

	            // Finalize
	            if (this._xformMode == this._ENC_XFORM_MODE) {
	                // Pad data
	                padding.pad(this._data, this.blockSize);

	                // Process final blocks
	                finalProcessedBlocks = this._process(!!'flush');
	            } else /* if (this._xformMode == this._DEC_XFORM_MODE) */ {
	                // Process final blocks
	                finalProcessedBlocks = this._process(!!'flush');

	                // Unpad data
	                padding.unpad(finalProcessedBlocks);
	            }

	            return finalProcessedBlocks;
	        },

	        blockSize: 128/32
	    });

	    /**
	     * A collection of cipher parameters.
	     *
	     * @property {WordArray} ciphertext The raw ciphertext.
	     * @property {WordArray} key The key to this ciphertext.
	     * @property {WordArray} iv The IV used in the ciphering operation.
	     * @property {WordArray} salt The salt used with a key derivation function.
	     * @property {Cipher} algorithm The cipher algorithm.
	     * @property {Mode} mode The block mode used in the ciphering operation.
	     * @property {Padding} padding The padding scheme used in the ciphering operation.
	     * @property {number} blockSize The block size of the cipher.
	     * @property {Format} formatter The default formatting strategy to convert this cipher params object to a string.
	     */
	    var CipherParams = C_lib.CipherParams = Base.extend({
	        /**
	         * Initializes a newly created cipher params object.
	         *
	         * @param {Object} cipherParams An object with any of the possible cipher parameters.
	         *
	         * @example
	         *
	         *     var cipherParams = CryptoJS.lib.CipherParams.create({
	         *         ciphertext: ciphertextWordArray,
	         *         key: keyWordArray,
	         *         iv: ivWordArray,
	         *         salt: saltWordArray,
	         *         algorithm: CryptoJS.algo.AES,
	         *         mode: CryptoJS.mode.CBC,
	         *         padding: CryptoJS.pad.PKCS7,
	         *         blockSize: 4,
	         *         formatter: CryptoJS.format.OpenSSL
	         *     });
	         */
	        init: function (cipherParams) {
	            this.mixIn(cipherParams);
	        },

	        /**
	         * Converts this cipher params object to a string.
	         *
	         * @param {Format} formatter (Optional) The formatting strategy to use.
	         *
	         * @return {string} The stringified cipher params.
	         *
	         * @throws Error If neither the formatter nor the default formatter is set.
	         *
	         * @example
	         *
	         *     var string = cipherParams + '';
	         *     var string = cipherParams.toString();
	         *     var string = cipherParams.toString(CryptoJS.format.OpenSSL);
	         */
	        toString: function (formatter) {
	            return (formatter || this.formatter).stringify(this);
	        }
	    });

	    /**
	     * Format namespace.
	     */
	    var C_format = C.format = {};

	    /**
	     * OpenSSL formatting strategy.
	     */
	    var OpenSSLFormatter = C_format.OpenSSL = {
	        /**
	         * Converts a cipher params object to an OpenSSL-compatible string.
	         *
	         * @param {CipherParams} cipherParams The cipher params object.
	         *
	         * @return {string} The OpenSSL-compatible string.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var openSSLString = CryptoJS.format.OpenSSL.stringify(cipherParams);
	         */
	        stringify: function (cipherParams) {
	            var wordArray;

	            // Shortcuts
	            var ciphertext = cipherParams.ciphertext;
	            var salt = cipherParams.salt;

	            // Format
	            if (salt) {
	                wordArray = WordArray.create([0x53616c74, 0x65645f5f]).concat(salt).concat(ciphertext);
	            } else {
	                wordArray = ciphertext;
	            }

	            return wordArray.toString(Base64);
	        },

	        /**
	         * Converts an OpenSSL-compatible string to a cipher params object.
	         *
	         * @param {string} openSSLStr The OpenSSL-compatible string.
	         *
	         * @return {CipherParams} The cipher params object.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var cipherParams = CryptoJS.format.OpenSSL.parse(openSSLString);
	         */
	        parse: function (openSSLStr) {
	            var salt;

	            // Parse base64
	            var ciphertext = Base64.parse(openSSLStr);

	            // Shortcut
	            var ciphertextWords = ciphertext.words;

	            // Test for salt
	            if (ciphertextWords[0] == 0x53616c74 && ciphertextWords[1] == 0x65645f5f) {
	                // Extract salt
	                salt = WordArray.create(ciphertextWords.slice(2, 4));

	                // Remove salt from ciphertext
	                ciphertextWords.splice(0, 4);
	                ciphertext.sigBytes -= 16;
	            }

	            return CipherParams.create({ ciphertext: ciphertext, salt: salt });
	        }
	    };

	    /**
	     * A cipher wrapper that returns ciphertext as a serializable cipher params object.
	     */
	    var SerializableCipher = C_lib.SerializableCipher = Base.extend({
	        /**
	         * Configuration options.
	         *
	         * @property {Formatter} format The formatting strategy to convert cipher param objects to and from a string. Default: OpenSSL
	         */
	        cfg: Base.extend({
	            format: OpenSSLFormatter
	        }),

	        /**
	         * Encrypts a message.
	         *
	         * @param {Cipher} cipher The cipher algorithm to use.
	         * @param {WordArray|string} message The message to encrypt.
	         * @param {WordArray} key The key.
	         * @param {Object} cfg (Optional) The configuration options to use for this operation.
	         *
	         * @return {CipherParams} A cipher params object.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key);
	         *     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key, { iv: iv });
	         *     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key, { iv: iv, format: CryptoJS.format.OpenSSL });
	         */
	        encrypt: function (cipher, message, key, cfg) {
	            // Apply config defaults
	            cfg = this.cfg.extend(cfg);

	            // Encrypt
	            var encryptor = cipher.createEncryptor(key, cfg);
	            var ciphertext = encryptor.finalize(message);

	            // Shortcut
	            var cipherCfg = encryptor.cfg;

	            // Create and return serializable cipher params
	            return CipherParams.create({
	                ciphertext: ciphertext,
	                key: key,
	                iv: cipherCfg.iv,
	                algorithm: cipher,
	                mode: cipherCfg.mode,
	                padding: cipherCfg.padding,
	                blockSize: cipher.blockSize,
	                formatter: cfg.format
	            });
	        },

	        /**
	         * Decrypts serialized ciphertext.
	         *
	         * @param {Cipher} cipher The cipher algorithm to use.
	         * @param {CipherParams|string} ciphertext The ciphertext to decrypt.
	         * @param {WordArray} key The key.
	         * @param {Object} cfg (Optional) The configuration options to use for this operation.
	         *
	         * @return {WordArray} The plaintext.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var plaintext = CryptoJS.lib.SerializableCipher.decrypt(CryptoJS.algo.AES, formattedCiphertext, key, { iv: iv, format: CryptoJS.format.OpenSSL });
	         *     var plaintext = CryptoJS.lib.SerializableCipher.decrypt(CryptoJS.algo.AES, ciphertextParams, key, { iv: iv, format: CryptoJS.format.OpenSSL });
	         */
	        decrypt: function (cipher, ciphertext, key, cfg) {
	            // Apply config defaults
	            cfg = this.cfg.extend(cfg);

	            // Convert string to CipherParams
	            ciphertext = this._parse(ciphertext, cfg.format);

	            // Decrypt
	            var plaintext = cipher.createDecryptor(key, cfg).finalize(ciphertext.ciphertext);

	            return plaintext;
	        },

	        /**
	         * Converts serialized ciphertext to CipherParams,
	         * else assumed CipherParams already and returns ciphertext unchanged.
	         *
	         * @param {CipherParams|string} ciphertext The ciphertext.
	         * @param {Formatter} format The formatting strategy to use to parse serialized ciphertext.
	         *
	         * @return {CipherParams} The unserialized ciphertext.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var ciphertextParams = CryptoJS.lib.SerializableCipher._parse(ciphertextStringOrParams, format);
	         */
	        _parse: function (ciphertext, format) {
	            if (typeof ciphertext == 'string') {
	                return format.parse(ciphertext, this);
	            } else {
	                return ciphertext;
	            }
	        }
	    });

	    /**
	     * Key derivation function namespace.
	     */
	    var C_kdf = C.kdf = {};

	    /**
	     * OpenSSL key derivation function.
	     */
	    var OpenSSLKdf = C_kdf.OpenSSL = {
	        /**
	         * Derives a key and IV from a password.
	         *
	         * @param {string} password The password to derive from.
	         * @param {number} keySize The size in words of the key to generate.
	         * @param {number} ivSize The size in words of the IV to generate.
	         * @param {WordArray|string} salt (Optional) A 64-bit salt to use. If omitted, a salt will be generated randomly.
	         *
	         * @return {CipherParams} A cipher params object with the key, IV, and salt.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var derivedParams = CryptoJS.kdf.OpenSSL.execute('Password', 256/32, 128/32);
	         *     var derivedParams = CryptoJS.kdf.OpenSSL.execute('Password', 256/32, 128/32, 'saltsalt');
	         */
	        execute: function (password, keySize, ivSize, salt, hasher) {
	            // Generate random salt
	            if (!salt) {
	                salt = WordArray.random(64/8);
	            }

	            // Derive key and IV
	            if (!hasher) {
	                var key = EvpKDF.create({ keySize: keySize + ivSize }).compute(password, salt);
	            } else {
	                var key = EvpKDF.create({ keySize: keySize + ivSize, hasher: hasher }).compute(password, salt);
	            }


	            // Separate key and IV
	            var iv = WordArray.create(key.words.slice(keySize), ivSize * 4);
	            key.sigBytes = keySize * 4;

	            // Return params
	            return CipherParams.create({ key: key, iv: iv, salt: salt });
	        }
	    };

	    /**
	     * A serializable cipher wrapper that derives the key from a password,
	     * and returns ciphertext as a serializable cipher params object.
	     */
	    var PasswordBasedCipher = C_lib.PasswordBasedCipher = SerializableCipher.extend({
	        /**
	         * Configuration options.
	         *
	         * @property {KDF} kdf The key derivation function to use to generate a key and IV from a password. Default: OpenSSL
	         */
	        cfg: SerializableCipher.cfg.extend({
	            kdf: OpenSSLKdf
	        }),

	        /**
	         * Encrypts a message using a password.
	         *
	         * @param {Cipher} cipher The cipher algorithm to use.
	         * @param {WordArray|string} message The message to encrypt.
	         * @param {string} password The password.
	         * @param {Object} cfg (Optional) The configuration options to use for this operation.
	         *
	         * @return {CipherParams} A cipher params object.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var ciphertextParams = CryptoJS.lib.PasswordBasedCipher.encrypt(CryptoJS.algo.AES, message, 'password');
	         *     var ciphertextParams = CryptoJS.lib.PasswordBasedCipher.encrypt(CryptoJS.algo.AES, message, 'password', { format: CryptoJS.format.OpenSSL });
	         */
	        encrypt: function (cipher, message, password, cfg) {
	            // Apply config defaults
	            cfg = this.cfg.extend(cfg);

	            // Derive key and other params
	            var derivedParams = cfg.kdf.execute(password, cipher.keySize, cipher.ivSize, cfg.salt, cfg.hasher);

	            // Add IV to config
	            cfg.iv = derivedParams.iv;

	            // Encrypt
	            var ciphertext = SerializableCipher.encrypt.call(this, cipher, message, derivedParams.key, cfg);

	            // Mix in derived params
	            ciphertext.mixIn(derivedParams);

	            return ciphertext;
	        },

	        /**
	         * Decrypts serialized ciphertext using a password.
	         *
	         * @param {Cipher} cipher The cipher algorithm to use.
	         * @param {CipherParams|string} ciphertext The ciphertext to decrypt.
	         * @param {string} password The password.
	         * @param {Object} cfg (Optional) The configuration options to use for this operation.
	         *
	         * @return {WordArray} The plaintext.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var plaintext = CryptoJS.lib.PasswordBasedCipher.decrypt(CryptoJS.algo.AES, formattedCiphertext, 'password', { format: CryptoJS.format.OpenSSL });
	         *     var plaintext = CryptoJS.lib.PasswordBasedCipher.decrypt(CryptoJS.algo.AES, ciphertextParams, 'password', { format: CryptoJS.format.OpenSSL });
	         */
	        decrypt: function (cipher, ciphertext, password, cfg) {
	            // Apply config defaults
	            cfg = this.cfg.extend(cfg);

	            // Convert string to CipherParams
	            ciphertext = this._parse(ciphertext, cfg.format);

	            // Derive key and other params
	            var derivedParams = cfg.kdf.execute(password, cipher.keySize, cipher.ivSize, ciphertext.salt, cfg.hasher);

	            // Add IV to config
	            cfg.iv = derivedParams.iv;

	            // Decrypt
	            var plaintext = SerializableCipher.decrypt.call(this, cipher, ciphertext, derivedParams.key, cfg);

	            return plaintext;
	        }
	    });
	}());


}));

/***/ }),

/***/ "./js-sdk-legacy/node_modules/crypto-js/core.js":
/*!******************************************************!*\
  !*** ./js-sdk-legacy/node_modules/crypto-js/core.js ***!
  \******************************************************/
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory) {
	if (true) {
		// CommonJS
		module.exports = exports = factory();
	}
	else // removed by dead control flow
{}
}(this, function () {

	/*globals window, global, require*/

	/**
	 * CryptoJS core components.
	 */
	var CryptoJS = CryptoJS || (function (Math, undefined) {

	    var crypto;

	    // Native crypto from window (Browser)
	    if (typeof window !== 'undefined' && window.crypto) {
	        crypto = window.crypto;
	    }

	    // Native crypto in web worker (Browser)
	    if (typeof self !== 'undefined' && self.crypto) {
	        crypto = self.crypto;
	    }

	    // Native crypto from worker
	    if (typeof globalThis !== 'undefined' && globalThis.crypto) {
	        crypto = globalThis.crypto;
	    }

	    // Native (experimental IE 11) crypto from window (Browser)
	    if (!crypto && typeof window !== 'undefined' && window.msCrypto) {
	        crypto = window.msCrypto;
	    }

	    // Native crypto from global (NodeJS)
	    if (!crypto && typeof __webpack_require__.g !== 'undefined' && __webpack_require__.g.crypto) {
	        crypto = __webpack_require__.g.crypto;
	    }

	    // Native crypto import via require (NodeJS)
	    if (!crypto && "function" === 'function') {
	        try {
	            crypto = __webpack_require__(/*! crypto */ "?dc1c");
	        } catch (err) {}
	    }

	    /*
	     * Cryptographically secure pseudorandom number generator
	     *
	     * As Math.random() is cryptographically not safe to use
	     */
	    var cryptoSecureRandomInt = function () {
	        if (crypto) {
	            // Use getRandomValues method (Browser)
	            if (typeof crypto.getRandomValues === 'function') {
	                try {
	                    return crypto.getRandomValues(new Uint32Array(1))[0];
	                } catch (err) {}
	            }

	            // Use randomBytes method (NodeJS)
	            if (typeof crypto.randomBytes === 'function') {
	                try {
	                    return crypto.randomBytes(4).readInt32LE();
	                } catch (err) {}
	            }
	        }

	        throw new Error('Native crypto module could not be used to get secure random number.');
	    };

	    /*
	     * Local polyfill of Object.create

	     */
	    var create = Object.create || (function () {
	        function F() {}

	        return function (obj) {
	            var subtype;

	            F.prototype = obj;

	            subtype = new F();

	            F.prototype = null;

	            return subtype;
	        };
	    }());

	    /**
	     * CryptoJS namespace.
	     */
	    var C = {};

	    /**
	     * Library namespace.
	     */
	    var C_lib = C.lib = {};

	    /**
	     * Base object for prototypal inheritance.
	     */
	    var Base = C_lib.Base = (function () {


	        return {
	            /**
	             * Creates a new object that inherits from this object.
	             *
	             * @param {Object} overrides Properties to copy into the new object.
	             *
	             * @return {Object} The new object.
	             *
	             * @static
	             *
	             * @example
	             *
	             *     var MyType = CryptoJS.lib.Base.extend({
	             *         field: 'value',
	             *
	             *         method: function () {
	             *         }
	             *     });
	             */
	            extend: function (overrides) {
	                // Spawn
	                var subtype = create(this);

	                // Augment
	                if (overrides) {
	                    subtype.mixIn(overrides);
	                }

	                // Create default initializer
	                if (!subtype.hasOwnProperty('init') || this.init === subtype.init) {
	                    subtype.init = function () {
	                        subtype.$super.init.apply(this, arguments);
	                    };
	                }

	                // Initializer's prototype is the subtype object
	                subtype.init.prototype = subtype;

	                // Reference supertype
	                subtype.$super = this;

	                return subtype;
	            },

	            /**
	             * Extends this object and runs the init method.
	             * Arguments to create() will be passed to init().
	             *
	             * @return {Object} The new object.
	             *
	             * @static
	             *
	             * @example
	             *
	             *     var instance = MyType.create();
	             */
	            create: function () {
	                var instance = this.extend();
	                instance.init.apply(instance, arguments);

	                return instance;
	            },

	            /**
	             * Initializes a newly created object.
	             * Override this method to add some logic when your objects are created.
	             *
	             * @example
	             *
	             *     var MyType = CryptoJS.lib.Base.extend({
	             *         init: function () {
	             *             // ...
	             *         }
	             *     });
	             */
	            init: function () {
	            },

	            /**
	             * Copies properties into this object.
	             *
	             * @param {Object} properties The properties to mix in.
	             *
	             * @example
	             *
	             *     MyType.mixIn({
	             *         field: 'value'
	             *     });
	             */
	            mixIn: function (properties) {
	                for (var propertyName in properties) {
	                    if (properties.hasOwnProperty(propertyName)) {
	                        this[propertyName] = properties[propertyName];
	                    }
	                }

	                // IE won't copy toString using the loop above
	                if (properties.hasOwnProperty('toString')) {
	                    this.toString = properties.toString;
	                }
	            },

	            /**
	             * Creates a copy of this object.
	             *
	             * @return {Object} The clone.
	             *
	             * @example
	             *
	             *     var clone = instance.clone();
	             */
	            clone: function () {
	                return this.init.prototype.extend(this);
	            }
	        };
	    }());

	    /**
	     * An array of 32-bit words.
	     *
	     * @property {Array} words The array of 32-bit words.
	     * @property {number} sigBytes The number of significant bytes in this word array.
	     */
	    var WordArray = C_lib.WordArray = Base.extend({
	        /**
	         * Initializes a newly created word array.
	         *
	         * @param {Array} words (Optional) An array of 32-bit words.
	         * @param {number} sigBytes (Optional) The number of significant bytes in the words.
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.lib.WordArray.create();
	         *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607]);
	         *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607], 6);
	         */
	        init: function (words, sigBytes) {
	            words = this.words = words || [];

	            if (sigBytes != undefined) {
	                this.sigBytes = sigBytes;
	            } else {
	                this.sigBytes = words.length * 4;
	            }
	        },

	        /**
	         * Converts this word array to a string.
	         *
	         * @param {Encoder} encoder (Optional) The encoding strategy to use. Default: CryptoJS.enc.Hex
	         *
	         * @return {string} The stringified word array.
	         *
	         * @example
	         *
	         *     var string = wordArray + '';
	         *     var string = wordArray.toString();
	         *     var string = wordArray.toString(CryptoJS.enc.Utf8);
	         */
	        toString: function (encoder) {
	            return (encoder || Hex).stringify(this);
	        },

	        /**
	         * Concatenates a word array to this word array.
	         *
	         * @param {WordArray} wordArray The word array to append.
	         *
	         * @return {WordArray} This word array.
	         *
	         * @example
	         *
	         *     wordArray1.concat(wordArray2);
	         */
	        concat: function (wordArray) {
	            // Shortcuts
	            var thisWords = this.words;
	            var thatWords = wordArray.words;
	            var thisSigBytes = this.sigBytes;
	            var thatSigBytes = wordArray.sigBytes;

	            // Clamp excess bits
	            this.clamp();

	            // Concat
	            if (thisSigBytes % 4) {
	                // Copy one byte at a time
	                for (var i = 0; i < thatSigBytes; i++) {
	                    var thatByte = (thatWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
	                    thisWords[(thisSigBytes + i) >>> 2] |= thatByte << (24 - ((thisSigBytes + i) % 4) * 8);
	                }
	            } else {
	                // Copy one word at a time
	                for (var j = 0; j < thatSigBytes; j += 4) {
	                    thisWords[(thisSigBytes + j) >>> 2] = thatWords[j >>> 2];
	                }
	            }
	            this.sigBytes += thatSigBytes;

	            // Chainable
	            return this;
	        },

	        /**
	         * Removes insignificant bits.
	         *
	         * @example
	         *
	         *     wordArray.clamp();
	         */
	        clamp: function () {
	            // Shortcuts
	            var words = this.words;
	            var sigBytes = this.sigBytes;

	            // Clamp
	            words[sigBytes >>> 2] &= 0xffffffff << (32 - (sigBytes % 4) * 8);
	            words.length = Math.ceil(sigBytes / 4);
	        },

	        /**
	         * Creates a copy of this word array.
	         *
	         * @return {WordArray} The clone.
	         *
	         * @example
	         *
	         *     var clone = wordArray.clone();
	         */
	        clone: function () {
	            var clone = Base.clone.call(this);
	            clone.words = this.words.slice(0);

	            return clone;
	        },

	        /**
	         * Creates a word array filled with random bytes.
	         *
	         * @param {number} nBytes The number of random bytes to generate.
	         *
	         * @return {WordArray} The random word array.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.lib.WordArray.random(16);
	         */
	        random: function (nBytes) {
	            var words = [];

	            for (var i = 0; i < nBytes; i += 4) {
	                words.push(cryptoSecureRandomInt());
	            }

	            return new WordArray.init(words, nBytes);
	        }
	    });

	    /**
	     * Encoder namespace.
	     */
	    var C_enc = C.enc = {};

	    /**
	     * Hex encoding strategy.
	     */
	    var Hex = C_enc.Hex = {
	        /**
	         * Converts a word array to a hex string.
	         *
	         * @param {WordArray} wordArray The word array.
	         *
	         * @return {string} The hex string.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var hexString = CryptoJS.enc.Hex.stringify(wordArray);
	         */
	        stringify: function (wordArray) {
	            // Shortcuts
	            var words = wordArray.words;
	            var sigBytes = wordArray.sigBytes;

	            // Convert
	            var hexChars = [];
	            for (var i = 0; i < sigBytes; i++) {
	                var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
	                hexChars.push((bite >>> 4).toString(16));
	                hexChars.push((bite & 0x0f).toString(16));
	            }

	            return hexChars.join('');
	        },

	        /**
	         * Converts a hex string to a word array.
	         *
	         * @param {string} hexStr The hex string.
	         *
	         * @return {WordArray} The word array.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.enc.Hex.parse(hexString);
	         */
	        parse: function (hexStr) {
	            // Shortcut
	            var hexStrLength = hexStr.length;

	            // Convert
	            var words = [];
	            for (var i = 0; i < hexStrLength; i += 2) {
	                words[i >>> 3] |= parseInt(hexStr.substr(i, 2), 16) << (24 - (i % 8) * 4);
	            }

	            return new WordArray.init(words, hexStrLength / 2);
	        }
	    };

	    /**
	     * Latin1 encoding strategy.
	     */
	    var Latin1 = C_enc.Latin1 = {
	        /**
	         * Converts a word array to a Latin1 string.
	         *
	         * @param {WordArray} wordArray The word array.
	         *
	         * @return {string} The Latin1 string.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var latin1String = CryptoJS.enc.Latin1.stringify(wordArray);
	         */
	        stringify: function (wordArray) {
	            // Shortcuts
	            var words = wordArray.words;
	            var sigBytes = wordArray.sigBytes;

	            // Convert
	            var latin1Chars = [];
	            for (var i = 0; i < sigBytes; i++) {
	                var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
	                latin1Chars.push(String.fromCharCode(bite));
	            }

	            return latin1Chars.join('');
	        },

	        /**
	         * Converts a Latin1 string to a word array.
	         *
	         * @param {string} latin1Str The Latin1 string.
	         *
	         * @return {WordArray} The word array.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.enc.Latin1.parse(latin1String);
	         */
	        parse: function (latin1Str) {
	            // Shortcut
	            var latin1StrLength = latin1Str.length;

	            // Convert
	            var words = [];
	            for (var i = 0; i < latin1StrLength; i++) {
	                words[i >>> 2] |= (latin1Str.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
	            }

	            return new WordArray.init(words, latin1StrLength);
	        }
	    };

	    /**
	     * UTF-8 encoding strategy.
	     */
	    var Utf8 = C_enc.Utf8 = {
	        /**
	         * Converts a word array to a UTF-8 string.
	         *
	         * @param {WordArray} wordArray The word array.
	         *
	         * @return {string} The UTF-8 string.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var utf8String = CryptoJS.enc.Utf8.stringify(wordArray);
	         */
	        stringify: function (wordArray) {
	            try {
	                return decodeURIComponent(escape(Latin1.stringify(wordArray)));
	            } catch (e) {
	                throw new Error('Malformed UTF-8 data');
	            }
	        },

	        /**
	         * Converts a UTF-8 string to a word array.
	         *
	         * @param {string} utf8Str The UTF-8 string.
	         *
	         * @return {WordArray} The word array.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.enc.Utf8.parse(utf8String);
	         */
	        parse: function (utf8Str) {
	            return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
	        }
	    };

	    /**
	     * Abstract buffered block algorithm template.
	     *
	     * The property blockSize must be implemented in a concrete subtype.
	     *
	     * @property {number} _minBufferSize The number of blocks that should be kept unprocessed in the buffer. Default: 0
	     */
	    var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm = Base.extend({
	        /**
	         * Resets this block algorithm's data buffer to its initial state.
	         *
	         * @example
	         *
	         *     bufferedBlockAlgorithm.reset();
	         */
	        reset: function () {
	            // Initial values
	            this._data = new WordArray.init();
	            this._nDataBytes = 0;
	        },

	        /**
	         * Adds new data to this block algorithm's buffer.
	         *
	         * @param {WordArray|string} data The data to append. Strings are converted to a WordArray using UTF-8.
	         *
	         * @example
	         *
	         *     bufferedBlockAlgorithm._append('data');
	         *     bufferedBlockAlgorithm._append(wordArray);
	         */
	        _append: function (data) {
	            // Convert string to WordArray, else assume WordArray already
	            if (typeof data == 'string') {
	                data = Utf8.parse(data);
	            }

	            // Append
	            this._data.concat(data);
	            this._nDataBytes += data.sigBytes;
	        },

	        /**
	         * Processes available data blocks.
	         *
	         * This method invokes _doProcessBlock(offset), which must be implemented by a concrete subtype.
	         *
	         * @param {boolean} doFlush Whether all blocks and partial blocks should be processed.
	         *
	         * @return {WordArray} The processed data.
	         *
	         * @example
	         *
	         *     var processedData = bufferedBlockAlgorithm._process();
	         *     var processedData = bufferedBlockAlgorithm._process(!!'flush');
	         */
	        _process: function (doFlush) {
	            var processedWords;

	            // Shortcuts
	            var data = this._data;
	            var dataWords = data.words;
	            var dataSigBytes = data.sigBytes;
	            var blockSize = this.blockSize;
	            var blockSizeBytes = blockSize * 4;

	            // Count blocks ready
	            var nBlocksReady = dataSigBytes / blockSizeBytes;
	            if (doFlush) {
	                // Round up to include partial blocks
	                nBlocksReady = Math.ceil(nBlocksReady);
	            } else {
	                // Round down to include only full blocks,
	                // less the number of blocks that must remain in the buffer
	                nBlocksReady = Math.max((nBlocksReady | 0) - this._minBufferSize, 0);
	            }

	            // Count words ready
	            var nWordsReady = nBlocksReady * blockSize;

	            // Count bytes ready
	            var nBytesReady = Math.min(nWordsReady * 4, dataSigBytes);

	            // Process blocks
	            if (nWordsReady) {
	                for (var offset = 0; offset < nWordsReady; offset += blockSize) {
	                    // Perform concrete-algorithm logic
	                    this._doProcessBlock(dataWords, offset);
	                }

	                // Remove processed words
	                processedWords = dataWords.splice(0, nWordsReady);
	                data.sigBytes -= nBytesReady;
	            }

	            // Return processed words
	            return new WordArray.init(processedWords, nBytesReady);
	        },

	        /**
	         * Creates a copy of this object.
	         *
	         * @return {Object} The clone.
	         *
	         * @example
	         *
	         *     var clone = bufferedBlockAlgorithm.clone();
	         */
	        clone: function () {
	            var clone = Base.clone.call(this);
	            clone._data = this._data.clone();

	            return clone;
	        },

	        _minBufferSize: 0
	    });

	    /**
	     * Abstract hasher template.
	     *
	     * @property {number} blockSize The number of 32-bit words this hasher operates on. Default: 16 (512 bits)
	     */
	    var Hasher = C_lib.Hasher = BufferedBlockAlgorithm.extend({
	        /**
	         * Configuration options.
	         */
	        cfg: Base.extend(),

	        /**
	         * Initializes a newly created hasher.
	         *
	         * @param {Object} cfg (Optional) The configuration options to use for this hash computation.
	         *
	         * @example
	         *
	         *     var hasher = CryptoJS.algo.SHA256.create();
	         */
	        init: function (cfg) {
	            // Apply config defaults
	            this.cfg = this.cfg.extend(cfg);

	            // Set initial values
	            this.reset();
	        },

	        /**
	         * Resets this hasher to its initial state.
	         *
	         * @example
	         *
	         *     hasher.reset();
	         */
	        reset: function () {
	            // Reset data buffer
	            BufferedBlockAlgorithm.reset.call(this);

	            // Perform concrete-hasher logic
	            this._doReset();
	        },

	        /**
	         * Updates this hasher with a message.
	         *
	         * @param {WordArray|string} messageUpdate The message to append.
	         *
	         * @return {Hasher} This hasher.
	         *
	         * @example
	         *
	         *     hasher.update('message');
	         *     hasher.update(wordArray);
	         */
	        update: function (messageUpdate) {
	            // Append
	            this._append(messageUpdate);

	            // Update the hash
	            this._process();

	            // Chainable
	            return this;
	        },

	        /**
	         * Finalizes the hash computation.
	         * Note that the finalize operation is effectively a destructive, read-once operation.
	         *
	         * @param {WordArray|string} messageUpdate (Optional) A final message update.
	         *
	         * @return {WordArray} The hash.
	         *
	         * @example
	         *
	         *     var hash = hasher.finalize();
	         *     var hash = hasher.finalize('message');
	         *     var hash = hasher.finalize(wordArray);
	         */
	        finalize: function (messageUpdate) {
	            // Final message update
	            if (messageUpdate) {
	                this._append(messageUpdate);
	            }

	            // Perform concrete-hasher logic
	            var hash = this._doFinalize();

	            return hash;
	        },

	        blockSize: 512/32,

	        /**
	         * Creates a shortcut function to a hasher's object interface.
	         *
	         * @param {Hasher} hasher The hasher to create a helper for.
	         *
	         * @return {Function} The shortcut function.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var SHA256 = CryptoJS.lib.Hasher._createHelper(CryptoJS.algo.SHA256);
	         */
	        _createHelper: function (hasher) {
	            return function (message, cfg) {
	                return new hasher.init(cfg).finalize(message);
	            };
	        },

	        /**
	         * Creates a shortcut function to the HMAC's object interface.
	         *
	         * @param {Hasher} hasher The hasher to use in this HMAC helper.
	         *
	         * @return {Function} The shortcut function.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var HmacSHA256 = CryptoJS.lib.Hasher._createHmacHelper(CryptoJS.algo.SHA256);
	         */
	        _createHmacHelper: function (hasher) {
	            return function (message, key) {
	                return new C_algo.HMAC.init(hasher, key).finalize(message);
	            };
	        }
	    });

	    /**
	     * Algorithm namespace.
	     */
	    var C_algo = C.algo = {};

	    return C;
	}(Math));


	return CryptoJS;

}));

/***/ }),

/***/ "./js-sdk-legacy/node_modules/crypto-js/enc-base64.js":
/*!************************************************************!*\
  !*** ./js-sdk-legacy/node_modules/crypto-js/enc-base64.js ***!
  \************************************************************/
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory) {
	if (true) {
		// CommonJS
		module.exports = exports = factory(__webpack_require__(/*! ./core */ "./js-sdk-legacy/node_modules/crypto-js/core.js"));
	}
	else // removed by dead control flow
{}
}(this, function (CryptoJS) {

	(function () {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var WordArray = C_lib.WordArray;
	    var C_enc = C.enc;

	    /**
	     * Base64 encoding strategy.
	     */
	    var Base64 = C_enc.Base64 = {
	        /**
	         * Converts a word array to a Base64 string.
	         *
	         * @param {WordArray} wordArray The word array.
	         *
	         * @return {string} The Base64 string.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var base64String = CryptoJS.enc.Base64.stringify(wordArray);
	         */
	        stringify: function (wordArray) {
	            // Shortcuts
	            var words = wordArray.words;
	            var sigBytes = wordArray.sigBytes;
	            var map = this._map;

	            // Clamp excess bits
	            wordArray.clamp();

	            // Convert
	            var base64Chars = [];
	            for (var i = 0; i < sigBytes; i += 3) {
	                var byte1 = (words[i >>> 2]       >>> (24 - (i % 4) * 8))       & 0xff;
	                var byte2 = (words[(i + 1) >>> 2] >>> (24 - ((i + 1) % 4) * 8)) & 0xff;
	                var byte3 = (words[(i + 2) >>> 2] >>> (24 - ((i + 2) % 4) * 8)) & 0xff;

	                var triplet = (byte1 << 16) | (byte2 << 8) | byte3;

	                for (var j = 0; (j < 4) && (i + j * 0.75 < sigBytes); j++) {
	                    base64Chars.push(map.charAt((triplet >>> (6 * (3 - j))) & 0x3f));
	                }
	            }

	            // Add padding
	            var paddingChar = map.charAt(64);
	            if (paddingChar) {
	                while (base64Chars.length % 4) {
	                    base64Chars.push(paddingChar);
	                }
	            }

	            return base64Chars.join('');
	        },

	        /**
	         * Converts a Base64 string to a word array.
	         *
	         * @param {string} base64Str The Base64 string.
	         *
	         * @return {WordArray} The word array.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.enc.Base64.parse(base64String);
	         */
	        parse: function (base64Str) {
	            // Shortcuts
	            var base64StrLength = base64Str.length;
	            var map = this._map;
	            var reverseMap = this._reverseMap;

	            if (!reverseMap) {
	                    reverseMap = this._reverseMap = [];
	                    for (var j = 0; j < map.length; j++) {
	                        reverseMap[map.charCodeAt(j)] = j;
	                    }
	            }

	            // Ignore padding
	            var paddingChar = map.charAt(64);
	            if (paddingChar) {
	                var paddingIndex = base64Str.indexOf(paddingChar);
	                if (paddingIndex !== -1) {
	                    base64StrLength = paddingIndex;
	                }
	            }

	            // Convert
	            return parseLoop(base64Str, base64StrLength, reverseMap);

	        },

	        _map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
	    };

	    function parseLoop(base64Str, base64StrLength, reverseMap) {
	      var words = [];
	      var nBytes = 0;
	      for (var i = 0; i < base64StrLength; i++) {
	          if (i % 4) {
	              var bits1 = reverseMap[base64Str.charCodeAt(i - 1)] << ((i % 4) * 2);
	              var bits2 = reverseMap[base64Str.charCodeAt(i)] >>> (6 - (i % 4) * 2);
	              var bitsCombined = bits1 | bits2;
	              words[nBytes >>> 2] |= bitsCombined << (24 - (nBytes % 4) * 8);
	              nBytes++;
	          }
	      }
	      return WordArray.create(words, nBytes);
	    }
	}());


	return CryptoJS.enc.Base64;

}));

/***/ }),

/***/ "./js-sdk-legacy/node_modules/crypto-js/enc-base64url.js":
/*!***************************************************************!*\
  !*** ./js-sdk-legacy/node_modules/crypto-js/enc-base64url.js ***!
  \***************************************************************/
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory) {
	if (true) {
		// CommonJS
		module.exports = exports = factory(__webpack_require__(/*! ./core */ "./js-sdk-legacy/node_modules/crypto-js/core.js"));
	}
	else // removed by dead control flow
{}
}(this, function (CryptoJS) {

	(function () {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var WordArray = C_lib.WordArray;
	    var C_enc = C.enc;

	    /**
	     * Base64url encoding strategy.
	     */
	    var Base64url = C_enc.Base64url = {
	        /**
	         * Converts a word array to a Base64url string.
	         *
	         * @param {WordArray} wordArray The word array.
	         *
	         * @param {boolean} urlSafe Whether to use url safe
	         *
	         * @return {string} The Base64url string.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var base64String = CryptoJS.enc.Base64url.stringify(wordArray);
	         */
	        stringify: function (wordArray, urlSafe) {
	            if (urlSafe === undefined) {
	                urlSafe = true
	            }
	            // Shortcuts
	            var words = wordArray.words;
	            var sigBytes = wordArray.sigBytes;
	            var map = urlSafe ? this._safe_map : this._map;

	            // Clamp excess bits
	            wordArray.clamp();

	            // Convert
	            var base64Chars = [];
	            for (var i = 0; i < sigBytes; i += 3) {
	                var byte1 = (words[i >>> 2]       >>> (24 - (i % 4) * 8))       & 0xff;
	                var byte2 = (words[(i + 1) >>> 2] >>> (24 - ((i + 1) % 4) * 8)) & 0xff;
	                var byte3 = (words[(i + 2) >>> 2] >>> (24 - ((i + 2) % 4) * 8)) & 0xff;

	                var triplet = (byte1 << 16) | (byte2 << 8) | byte3;

	                for (var j = 0; (j < 4) && (i + j * 0.75 < sigBytes); j++) {
	                    base64Chars.push(map.charAt((triplet >>> (6 * (3 - j))) & 0x3f));
	                }
	            }

	            // Add padding
	            var paddingChar = map.charAt(64);
	            if (paddingChar) {
	                while (base64Chars.length % 4) {
	                    base64Chars.push(paddingChar);
	                }
	            }

	            return base64Chars.join('');
	        },

	        /**
	         * Converts a Base64url string to a word array.
	         *
	         * @param {string} base64Str The Base64url string.
	         *
	         * @param {boolean} urlSafe Whether to use url safe
	         *
	         * @return {WordArray} The word array.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.enc.Base64url.parse(base64String);
	         */
	        parse: function (base64Str, urlSafe) {
	            if (urlSafe === undefined) {
	                urlSafe = true
	            }

	            // Shortcuts
	            var base64StrLength = base64Str.length;
	            var map = urlSafe ? this._safe_map : this._map;
	            var reverseMap = this._reverseMap;

	            if (!reverseMap) {
	                reverseMap = this._reverseMap = [];
	                for (var j = 0; j < map.length; j++) {
	                    reverseMap[map.charCodeAt(j)] = j;
	                }
	            }

	            // Ignore padding
	            var paddingChar = map.charAt(64);
	            if (paddingChar) {
	                var paddingIndex = base64Str.indexOf(paddingChar);
	                if (paddingIndex !== -1) {
	                    base64StrLength = paddingIndex;
	                }
	            }

	            // Convert
	            return parseLoop(base64Str, base64StrLength, reverseMap);

	        },

	        _map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
	        _safe_map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',
	    };

	    function parseLoop(base64Str, base64StrLength, reverseMap) {
	        var words = [];
	        var nBytes = 0;
	        for (var i = 0; i < base64StrLength; i++) {
	            if (i % 4) {
	                var bits1 = reverseMap[base64Str.charCodeAt(i - 1)] << ((i % 4) * 2);
	                var bits2 = reverseMap[base64Str.charCodeAt(i)] >>> (6 - (i % 4) * 2);
	                var bitsCombined = bits1 | bits2;
	                words[nBytes >>> 2] |= bitsCombined << (24 - (nBytes % 4) * 8);
	                nBytes++;
	            }
	        }
	        return WordArray.create(words, nBytes);
	    }
	}());


	return CryptoJS.enc.Base64url;

}));

/***/ }),

/***/ "./js-sdk-legacy/node_modules/crypto-js/enc-utf16.js":
/*!***********************************************************!*\
  !*** ./js-sdk-legacy/node_modules/crypto-js/enc-utf16.js ***!
  \***********************************************************/
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory) {
	if (true) {
		// CommonJS
		module.exports = exports = factory(__webpack_require__(/*! ./core */ "./js-sdk-legacy/node_modules/crypto-js/core.js"));
	}
	else // removed by dead control flow
{}
}(this, function (CryptoJS) {

	(function () {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var WordArray = C_lib.WordArray;
	    var C_enc = C.enc;

	    /**
	     * UTF-16 BE encoding strategy.
	     */
	    var Utf16BE = C_enc.Utf16 = C_enc.Utf16BE = {
	        /**
	         * Converts a word array to a UTF-16 BE string.
	         *
	         * @param {WordArray} wordArray The word array.
	         *
	         * @return {string} The UTF-16 BE string.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var utf16String = CryptoJS.enc.Utf16.stringify(wordArray);
	         */
	        stringify: function (wordArray) {
	            // Shortcuts
	            var words = wordArray.words;
	            var sigBytes = wordArray.sigBytes;

	            // Convert
	            var utf16Chars = [];
	            for (var i = 0; i < sigBytes; i += 2) {
	                var codePoint = (words[i >>> 2] >>> (16 - (i % 4) * 8)) & 0xffff;
	                utf16Chars.push(String.fromCharCode(codePoint));
	            }

	            return utf16Chars.join('');
	        },

	        /**
	         * Converts a UTF-16 BE string to a word array.
	         *
	         * @param {string} utf16Str The UTF-16 BE string.
	         *
	         * @return {WordArray} The word array.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.enc.Utf16.parse(utf16String);
	         */
	        parse: function (utf16Str) {
	            // Shortcut
	            var utf16StrLength = utf16Str.length;

	            // Convert
	            var words = [];
	            for (var i = 0; i < utf16StrLength; i++) {
	                words[i >>> 1] |= utf16Str.charCodeAt(i) << (16 - (i % 2) * 16);
	            }

	            return WordArray.create(words, utf16StrLength * 2);
	        }
	    };

	    /**
	     * UTF-16 LE encoding strategy.
	     */
	    C_enc.Utf16LE = {
	        /**
	         * Converts a word array to a UTF-16 LE string.
	         *
	         * @param {WordArray} wordArray The word array.
	         *
	         * @return {string} The UTF-16 LE string.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var utf16Str = CryptoJS.enc.Utf16LE.stringify(wordArray);
	         */
	        stringify: function (wordArray) {
	            // Shortcuts
	            var words = wordArray.words;
	            var sigBytes = wordArray.sigBytes;

	            // Convert
	            var utf16Chars = [];
	            for (var i = 0; i < sigBytes; i += 2) {
	                var codePoint = swapEndian((words[i >>> 2] >>> (16 - (i % 4) * 8)) & 0xffff);
	                utf16Chars.push(String.fromCharCode(codePoint));
	            }

	            return utf16Chars.join('');
	        },

	        /**
	         * Converts a UTF-16 LE string to a word array.
	         *
	         * @param {string} utf16Str The UTF-16 LE string.
	         *
	         * @return {WordArray} The word array.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.enc.Utf16LE.parse(utf16Str);
	         */
	        parse: function (utf16Str) {
	            // Shortcut
	            var utf16StrLength = utf16Str.length;

	            // Convert
	            var words = [];
	            for (var i = 0; i < utf16StrLength; i++) {
	                words[i >>> 1] |= swapEndian(utf16Str.charCodeAt(i) << (16 - (i % 2) * 16));
	            }

	            return WordArray.create(words, utf16StrLength * 2);
	        }
	    };

	    function swapEndian(word) {
	        return ((word << 8) & 0xff00ff00) | ((word >>> 8) & 0x00ff00ff);
	    }
	}());


	return CryptoJS.enc.Utf16;

}));

/***/ }),

/***/ "./js-sdk-legacy/node_modules/crypto-js/evpkdf.js":
/*!********************************************************!*\
  !*** ./js-sdk-legacy/node_modules/crypto-js/evpkdf.js ***!
  \********************************************************/
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory, undef) {
	if (true) {
		// CommonJS
		module.exports = exports = factory(__webpack_require__(/*! ./core */ "./js-sdk-legacy/node_modules/crypto-js/core.js"), __webpack_require__(/*! ./sha1 */ "./js-sdk-legacy/node_modules/crypto-js/sha1.js"), __webpack_require__(/*! ./hmac */ "./js-sdk-legacy/node_modules/crypto-js/hmac.js"));
	}
	else // removed by dead control flow
{}
}(this, function (CryptoJS) {

	(function () {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var Base = C_lib.Base;
	    var WordArray = C_lib.WordArray;
	    var C_algo = C.algo;
	    var MD5 = C_algo.MD5;

	    /**
	     * This key derivation function is meant to conform with EVP_BytesToKey.
	     * www.openssl.org/docs/crypto/EVP_BytesToKey.html
	     */
	    var EvpKDF = C_algo.EvpKDF = Base.extend({
	        /**
	         * Configuration options.
	         *
	         * @property {number} keySize The key size in words to generate. Default: 4 (128 bits)
	         * @property {Hasher} hasher The hash algorithm to use. Default: MD5
	         * @property {number} iterations The number of iterations to perform. Default: 1
	         */
	        cfg: Base.extend({
	            keySize: 128/32,
	            hasher: MD5,
	            iterations: 1
	        }),

	        /**
	         * Initializes a newly created key derivation function.
	         *
	         * @param {Object} cfg (Optional) The configuration options to use for the derivation.
	         *
	         * @example
	         *
	         *     var kdf = CryptoJS.algo.EvpKDF.create();
	         *     var kdf = CryptoJS.algo.EvpKDF.create({ keySize: 8 });
	         *     var kdf = CryptoJS.algo.EvpKDF.create({ keySize: 8, iterations: 1000 });
	         */
	        init: function (cfg) {
	            this.cfg = this.cfg.extend(cfg);
	        },

	        /**
	         * Derives a key from a password.
	         *
	         * @param {WordArray|string} password The password.
	         * @param {WordArray|string} salt A salt.
	         *
	         * @return {WordArray} The derived key.
	         *
	         * @example
	         *
	         *     var key = kdf.compute(password, salt);
	         */
	        compute: function (password, salt) {
	            var block;

	            // Shortcut
	            var cfg = this.cfg;

	            // Init hasher
	            var hasher = cfg.hasher.create();

	            // Initial values
	            var derivedKey = WordArray.create();

	            // Shortcuts
	            var derivedKeyWords = derivedKey.words;
	            var keySize = cfg.keySize;
	            var iterations = cfg.iterations;

	            // Generate key
	            while (derivedKeyWords.length < keySize) {
	                if (block) {
	                    hasher.update(block);
	                }
	                block = hasher.update(password).finalize(salt);
	                hasher.reset();

	                // Iterations
	                for (var i = 1; i < iterations; i++) {
	                    block = hasher.finalize(block);
	                    hasher.reset();
	                }

	                derivedKey.concat(block);
	            }
	            derivedKey.sigBytes = keySize * 4;

	            return derivedKey;
	        }
	    });

	    /**
	     * Derives a key from a password.
	     *
	     * @param {WordArray|string} password The password.
	     * @param {WordArray|string} salt A salt.
	     * @param {Object} cfg (Optional) The configuration options to use for this computation.
	     *
	     * @return {WordArray} The derived key.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var key = CryptoJS.EvpKDF(password, salt);
	     *     var key = CryptoJS.EvpKDF(password, salt, { keySize: 8 });
	     *     var key = CryptoJS.EvpKDF(password, salt, { keySize: 8, iterations: 1000 });
	     */
	    C.EvpKDF = function (password, salt, cfg) {
	        return EvpKDF.create(cfg).compute(password, salt);
	    };
	}());


	return CryptoJS.EvpKDF;

}));

/***/ }),

/***/ "./js-sdk-legacy/node_modules/crypto-js/format-hex.js":
/*!************************************************************!*\
  !*** ./js-sdk-legacy/node_modules/crypto-js/format-hex.js ***!
  \************************************************************/
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory, undef) {
	if (true) {
		// CommonJS
		module.exports = exports = factory(__webpack_require__(/*! ./core */ "./js-sdk-legacy/node_modules/crypto-js/core.js"), __webpack_require__(/*! ./cipher-core */ "./js-sdk-legacy/node_modules/crypto-js/cipher-core.js"));
	}
	else // removed by dead control flow
{}
}(this, function (CryptoJS) {

	(function (undefined) {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var CipherParams = C_lib.CipherParams;
	    var C_enc = C.enc;
	    var Hex = C_enc.Hex;
	    var C_format = C.format;

	    var HexFormatter = C_format.Hex = {
	        /**
	         * Converts the ciphertext of a cipher params object to a hexadecimally encoded string.
	         *
	         * @param {CipherParams} cipherParams The cipher params object.
	         *
	         * @return {string} The hexadecimally encoded string.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var hexString = CryptoJS.format.Hex.stringify(cipherParams);
	         */
	        stringify: function (cipherParams) {
	            return cipherParams.ciphertext.toString(Hex);
	        },

	        /**
	         * Converts a hexadecimally encoded ciphertext string to a cipher params object.
	         *
	         * @param {string} input The hexadecimally encoded string.
	         *
	         * @return {CipherParams} The cipher params object.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var cipherParams = CryptoJS.format.Hex.parse(hexString);
	         */
	        parse: function (input) {
	            var ciphertext = Hex.parse(input);
	            return CipherParams.create({ ciphertext: ciphertext });
	        }
	    };
	}());


	return CryptoJS.format.Hex;

}));

/***/ }),

/***/ "./js-sdk-legacy/node_modules/crypto-js/hmac.js":
/*!******************************************************!*\
  !*** ./js-sdk-legacy/node_modules/crypto-js/hmac.js ***!
  \******************************************************/
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory) {
	if (true) {
		// CommonJS
		module.exports = exports = factory(__webpack_require__(/*! ./core */ "./js-sdk-legacy/node_modules/crypto-js/core.js"));
	}
	else // removed by dead control flow
{}
}(this, function (CryptoJS) {

	(function () {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var Base = C_lib.Base;
	    var C_enc = C.enc;
	    var Utf8 = C_enc.Utf8;
	    var C_algo = C.algo;

	    /**
	     * HMAC algorithm.
	     */
	    var HMAC = C_algo.HMAC = Base.extend({
	        /**
	         * Initializes a newly created HMAC.
	         *
	         * @param {Hasher} hasher The hash algorithm to use.
	         * @param {WordArray|string} key The secret key.
	         *
	         * @example
	         *
	         *     var hmacHasher = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, key);
	         */
	        init: function (hasher, key) {
	            // Init hasher
	            hasher = this._hasher = new hasher.init();

	            // Convert string to WordArray, else assume WordArray already
	            if (typeof key == 'string') {
	                key = Utf8.parse(key);
	            }

	            // Shortcuts
	            var hasherBlockSize = hasher.blockSize;
	            var hasherBlockSizeBytes = hasherBlockSize * 4;

	            // Allow arbitrary length keys
	            if (key.sigBytes > hasherBlockSizeBytes) {
	                key = hasher.finalize(key);
	            }

	            // Clamp excess bits
	            key.clamp();

	            // Clone key for inner and outer pads
	            var oKey = this._oKey = key.clone();
	            var iKey = this._iKey = key.clone();

	            // Shortcuts
	            var oKeyWords = oKey.words;
	            var iKeyWords = iKey.words;

	            // XOR keys with pad constants
	            for (var i = 0; i < hasherBlockSize; i++) {
	                oKeyWords[i] ^= 0x5c5c5c5c;
	                iKeyWords[i] ^= 0x36363636;
	            }
	            oKey.sigBytes = iKey.sigBytes = hasherBlockSizeBytes;

	            // Set initial values
	            this.reset();
	        },

	        /**
	         * Resets this HMAC to its initial state.
	         *
	         * @example
	         *
	         *     hmacHasher.reset();
	         */
	        reset: function () {
	            // Shortcut
	            var hasher = this._hasher;

	            // Reset
	            hasher.reset();
	            hasher.update(this._iKey);
	        },

	        /**
	         * Updates this HMAC with a message.
	         *
	         * @param {WordArray|string} messageUpdate The message to append.
	         *
	         * @return {HMAC} This HMAC instance.
	         *
	         * @example
	         *
	         *     hmacHasher.update('message');
	         *     hmacHasher.update(wordArray);
	         */
	        update: function (messageUpdate) {
	            this._hasher.update(messageUpdate);

	            // Chainable
	            return this;
	        },

	        /**
	         * Finalizes the HMAC computation.
	         * Note that the finalize operation is effectively a destructive, read-once operation.
	         *
	         * @param {WordArray|string} messageUpdate (Optional) A final message update.
	         *
	         * @return {WordArray} The HMAC.
	         *
	         * @example
	         *
	         *     var hmac = hmacHasher.finalize();
	         *     var hmac = hmacHasher.finalize('message');
	         *     var hmac = hmacHasher.finalize(wordArray);
	         */
	        finalize: function (messageUpdate) {
	            // Shortcut
	            var hasher = this._hasher;

	            // Compute HMAC
	            var innerHash = hasher.finalize(messageUpdate);
	            hasher.reset();
	            var hmac = hasher.finalize(this._oKey.clone().concat(innerHash));

	            return hmac;
	        }
	    });
	}());


}));

/***/ }),

/***/ "./js-sdk-legacy/node_modules/crypto-js/index.js":
/*!*******************************************************!*\
  !*** ./js-sdk-legacy/node_modules/crypto-js/index.js ***!
  \*******************************************************/
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory, undef) {
	if (true) {
		// CommonJS
		module.exports = exports = factory(__webpack_require__(/*! ./core */ "./js-sdk-legacy/node_modules/crypto-js/core.js"), __webpack_require__(/*! ./x64-core */ "./js-sdk-legacy/node_modules/crypto-js/x64-core.js"), __webpack_require__(/*! ./lib-typedarrays */ "./js-sdk-legacy/node_modules/crypto-js/lib-typedarrays.js"), __webpack_require__(/*! ./enc-utf16 */ "./js-sdk-legacy/node_modules/crypto-js/enc-utf16.js"), __webpack_require__(/*! ./enc-base64 */ "./js-sdk-legacy/node_modules/crypto-js/enc-base64.js"), __webpack_require__(/*! ./enc-base64url */ "./js-sdk-legacy/node_modules/crypto-js/enc-base64url.js"), __webpack_require__(/*! ./md5 */ "./js-sdk-legacy/node_modules/crypto-js/md5.js"), __webpack_require__(/*! ./sha1 */ "./js-sdk-legacy/node_modules/crypto-js/sha1.js"), __webpack_require__(/*! ./sha256 */ "./js-sdk-legacy/node_modules/crypto-js/sha256.js"), __webpack_require__(/*! ./sha224 */ "./js-sdk-legacy/node_modules/crypto-js/sha224.js"), __webpack_require__(/*! ./sha512 */ "./js-sdk-legacy/node_modules/crypto-js/sha512.js"), __webpack_require__(/*! ./sha384 */ "./js-sdk-legacy/node_modules/crypto-js/sha384.js"), __webpack_require__(/*! ./sha3 */ "./js-sdk-legacy/node_modules/crypto-js/sha3.js"), __webpack_require__(/*! ./ripemd160 */ "./js-sdk-legacy/node_modules/crypto-js/ripemd160.js"), __webpack_require__(/*! ./hmac */ "./js-sdk-legacy/node_modules/crypto-js/hmac.js"), __webpack_require__(/*! ./pbkdf2 */ "./js-sdk-legacy/node_modules/crypto-js/pbkdf2.js"), __webpack_require__(/*! ./evpkdf */ "./js-sdk-legacy/node_modules/crypto-js/evpkdf.js"), __webpack_require__(/*! ./cipher-core */ "./js-sdk-legacy/node_modules/crypto-js/cipher-core.js"), __webpack_require__(/*! ./mode-cfb */ "./js-sdk-legacy/node_modules/crypto-js/mode-cfb.js"), __webpack_require__(/*! ./mode-ctr */ "./js-sdk-legacy/node_modules/crypto-js/mode-ctr.js"), __webpack_require__(/*! ./mode-ctr-gladman */ "./js-sdk-legacy/node_modules/crypto-js/mode-ctr-gladman.js"), __webpack_require__(/*! ./mode-ofb */ "./js-sdk-legacy/node_modules/crypto-js/mode-ofb.js"), __webpack_require__(/*! ./mode-ecb */ "./js-sdk-legacy/node_modules/crypto-js/mode-ecb.js"), __webpack_require__(/*! ./pad-ansix923 */ "./js-sdk-legacy/node_modules/crypto-js/pad-ansix923.js"), __webpack_require__(/*! ./pad-iso10126 */ "./js-sdk-legacy/node_modules/crypto-js/pad-iso10126.js"), __webpack_require__(/*! ./pad-iso97971 */ "./js-sdk-legacy/node_modules/crypto-js/pad-iso97971.js"), __webpack_require__(/*! ./pad-zeropadding */ "./js-sdk-legacy/node_modules/crypto-js/pad-zeropadding.js"), __webpack_require__(/*! ./pad-nopadding */ "./js-sdk-legacy/node_modules/crypto-js/pad-nopadding.js"), __webpack_require__(/*! ./format-hex */ "./js-sdk-legacy/node_modules/crypto-js/format-hex.js"), __webpack_require__(/*! ./aes */ "./js-sdk-legacy/node_modules/crypto-js/aes.js"), __webpack_require__(/*! ./tripledes */ "./js-sdk-legacy/node_modules/crypto-js/tripledes.js"), __webpack_require__(/*! ./rc4 */ "./js-sdk-legacy/node_modules/crypto-js/rc4.js"), __webpack_require__(/*! ./rabbit */ "./js-sdk-legacy/node_modules/crypto-js/rabbit.js"), __webpack_require__(/*! ./rabbit-legacy */ "./js-sdk-legacy/node_modules/crypto-js/rabbit-legacy.js"), __webpack_require__(/*! ./blowfish */ "./js-sdk-legacy/node_modules/crypto-js/blowfish.js"));
	}
	else // removed by dead control flow
{}
}(this, function (CryptoJS) {

	return CryptoJS;

}));

/***/ }),

/***/ "./js-sdk-legacy/node_modules/crypto-js/lib-typedarrays.js":
/*!*****************************************************************!*\
  !*** ./js-sdk-legacy/node_modules/crypto-js/lib-typedarrays.js ***!
  \*****************************************************************/
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory) {
	if (true) {
		// CommonJS
		module.exports = exports = factory(__webpack_require__(/*! ./core */ "./js-sdk-legacy/node_modules/crypto-js/core.js"));
	}
	else // removed by dead control flow
{}
}(this, function (CryptoJS) {

	(function () {
	    // Check if typed arrays are supported
	    if (typeof ArrayBuffer != 'function') {
	        return;
	    }

	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var WordArray = C_lib.WordArray;

	    // Reference original init
	    var superInit = WordArray.init;

	    // Augment WordArray.init to handle typed arrays
	    var subInit = WordArray.init = function (typedArray) {
	        // Convert buffers to uint8
	        if (typedArray instanceof ArrayBuffer) {
	            typedArray = new Uint8Array(typedArray);
	        }

	        // Convert other array views to uint8
	        if (
	            typedArray instanceof Int8Array ||
	            (typeof Uint8ClampedArray !== "undefined" && typedArray instanceof Uint8ClampedArray) ||
	            typedArray instanceof Int16Array ||
	            typedArray instanceof Uint16Array ||
	            typedArray instanceof Int32Array ||
	            typedArray instanceof Uint32Array ||
	            typedArray instanceof Float32Array ||
	            typedArray instanceof Float64Array
	        ) {
	            typedArray = new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
	        }

	        // Handle Uint8Array
	        if (typedArray instanceof Uint8Array) {
	            // Shortcut
	            var typedArrayByteLength = typedArray.byteLength;

	            // Extract bytes
	            var words = [];
	            for (var i = 0; i < typedArrayByteLength; i++) {
	                words[i >>> 2] |= typedArray[i] << (24 - (i % 4) * 8);
	            }

	            // Initialize this word array
	            superInit.call(this, words, typedArrayByteLength);
	        } else {
	            // Else call normal init
	            superInit.apply(this, arguments);
	        }
	    };

	    subInit.prototype = WordArray;
	}());


	return CryptoJS.lib.WordArray;

}));

/***/ }),

/***/ "./js-sdk-legacy/node_modules/crypto-js/md5.js":
/*!*****************************************************!*\
  !*** ./js-sdk-legacy/node_modules/crypto-js/md5.js ***!
  \*****************************************************/
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory) {
	if (true) {
		// CommonJS
		module.exports = exports = factory(__webpack_require__(/*! ./core */ "./js-sdk-legacy/node_modules/crypto-js/core.js"));
	}
	else // removed by dead control flow
{}
}(this, function (CryptoJS) {

	(function (Math) {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var WordArray = C_lib.WordArray;
	    var Hasher = C_lib.Hasher;
	    var C_algo = C.algo;

	    // Constants table
	    var T = [];

	    // Compute constants
	    (function () {
	        for (var i = 0; i < 64; i++) {
	            T[i] = (Math.abs(Math.sin(i + 1)) * 0x100000000) | 0;
	        }
	    }());

	    /**
	     * MD5 hash algorithm.
	     */
	    var MD5 = C_algo.MD5 = Hasher.extend({
	        _doReset: function () {
	            this._hash = new WordArray.init([
	                0x67452301, 0xefcdab89,
	                0x98badcfe, 0x10325476
	            ]);
	        },

	        _doProcessBlock: function (M, offset) {
	            // Swap endian
	            for (var i = 0; i < 16; i++) {
	                // Shortcuts
	                var offset_i = offset + i;
	                var M_offset_i = M[offset_i];

	                M[offset_i] = (
	                    (((M_offset_i << 8)  | (M_offset_i >>> 24)) & 0x00ff00ff) |
	                    (((M_offset_i << 24) | (M_offset_i >>> 8))  & 0xff00ff00)
	                );
	            }

	            // Shortcuts
	            var H = this._hash.words;

	            var M_offset_0  = M[offset + 0];
	            var M_offset_1  = M[offset + 1];
	            var M_offset_2  = M[offset + 2];
	            var M_offset_3  = M[offset + 3];
	            var M_offset_4  = M[offset + 4];
	            var M_offset_5  = M[offset + 5];
	            var M_offset_6  = M[offset + 6];
	            var M_offset_7  = M[offset + 7];
	            var M_offset_8  = M[offset + 8];
	            var M_offset_9  = M[offset + 9];
	            var M_offset_10 = M[offset + 10];
	            var M_offset_11 = M[offset + 11];
	            var M_offset_12 = M[offset + 12];
	            var M_offset_13 = M[offset + 13];
	            var M_offset_14 = M[offset + 14];
	            var M_offset_15 = M[offset + 15];

	            // Working variables
	            var a = H[0];
	            var b = H[1];
	            var c = H[2];
	            var d = H[3];

	            // Computation
	            a = FF(a, b, c, d, M_offset_0,  7,  T[0]);
	            d = FF(d, a, b, c, M_offset_1,  12, T[1]);
	            c = FF(c, d, a, b, M_offset_2,  17, T[2]);
	            b = FF(b, c, d, a, M_offset_3,  22, T[3]);
	            a = FF(a, b, c, d, M_offset_4,  7,  T[4]);
	            d = FF(d, a, b, c, M_offset_5,  12, T[5]);
	            c = FF(c, d, a, b, M_offset_6,  17, T[6]);
	            b = FF(b, c, d, a, M_offset_7,  22, T[7]);
	            a = FF(a, b, c, d, M_offset_8,  7,  T[8]);
	            d = FF(d, a, b, c, M_offset_9,  12, T[9]);
	            c = FF(c, d, a, b, M_offset_10, 17, T[10]);
	            b = FF(b, c, d, a, M_offset_11, 22, T[11]);
	            a = FF(a, b, c, d, M_offset_12, 7,  T[12]);
	            d = FF(d, a, b, c, M_offset_13, 12, T[13]);
	            c = FF(c, d, a, b, M_offset_14, 17, T[14]);
	            b = FF(b, c, d, a, M_offset_15, 22, T[15]);

	            a = GG(a, b, c, d, M_offset_1,  5,  T[16]);
	            d = GG(d, a, b, c, M_offset_6,  9,  T[17]);
	            c = GG(c, d, a, b, M_offset_11, 14, T[18]);
	            b = GG(b, c, d, a, M_offset_0,  20, T[19]);
	            a = GG(a, b, c, d, M_offset_5,  5,  T[20]);
	            d = GG(d, a, b, c, M_offset_10, 9,  T[21]);
	            c = GG(c, d, a, b, M_offset_15, 14, T[22]);
	            b = GG(b, c, d, a, M_offset_4,  20, T[23]);
	            a = GG(a, b, c, d, M_offset_9,  5,  T[24]);
	            d = GG(d, a, b, c, M_offset_14, 9,  T[25]);
	            c = GG(c, d, a, b, M_offset_3,  14, T[26]);
	            b = GG(b, c, d, a, M_offset_8,  20, T[27]);
	            a = GG(a, b, c, d, M_offset_13, 5,  T[28]);
	            d = GG(d, a, b, c, M_offset_2,  9,  T[29]);
	            c = GG(c, d, a, b, M_offset_7,  14, T[30]);
	            b = GG(b, c, d, a, M_offset_12, 20, T[31]);

	            a = HH(a, b, c, d, M_offset_5,  4,  T[32]);
	            d = HH(d, a, b, c, M_offset_8,  11, T[33]);
	            c = HH(c, d, a, b, M_offset_11, 16, T[34]);
	            b = HH(b, c, d, a, M_offset_14, 23, T[35]);
	            a = HH(a, b, c, d, M_offset_1,  4,  T[36]);
	            d = HH(d, a, b, c, M_offset_4,  11, T[37]);
	            c = HH(c, d, a, b, M_offset_7,  16, T[38]);
	            b = HH(b, c, d, a, M_offset_10, 23, T[39]);
	            a = HH(a, b, c, d, M_offset_13, 4,  T[40]);
	            d = HH(d, a, b, c, M_offset_0,  11, T[41]);
	            c = HH(c, d, a, b, M_offset_3,  16, T[42]);
	            b = HH(b, c, d, a, M_offset_6,  23, T[43]);
	            a = HH(a, b, c, d, M_offset_9,  4,  T[44]);
	            d = HH(d, a, b, c, M_offset_12, 11, T[45]);
	            c = HH(c, d, a, b, M_offset_15, 16, T[46]);
	            b = HH(b, c, d, a, M_offset_2,  23, T[47]);

	            a = II(a, b, c, d, M_offset_0,  6,  T[48]);
	            d = II(d, a, b, c, M_offset_7,  10, T[49]);
	            c = II(c, d, a, b, M_offset_14, 15, T[50]);
	            b = II(b, c, d, a, M_offset_5,  21, T[51]);
	            a = II(a, b, c, d, M_offset_12, 6,  T[52]);
	            d = II(d, a, b, c, M_offset_3,  10, T[53]);
	            c = II(c, d, a, b, M_offset_10, 15, T[54]);
	            b = II(b, c, d, a, M_offset_1,  21, T[55]);
	            a = II(a, b, c, d, M_offset_8,  6,  T[56]);
	            d = II(d, a, b, c, M_offset_15, 10, T[57]);
	            c = II(c, d, a, b, M_offset_6,  15, T[58]);
	            b = II(b, c, d, a, M_offset_13, 21, T[59]);
	            a = II(a, b, c, d, M_offset_4,  6,  T[60]);
	            d = II(d, a, b, c, M_offset_11, 10, T[61]);
	            c = II(c, d, a, b, M_offset_2,  15, T[62]);
	            b = II(b, c, d, a, M_offset_9,  21, T[63]);

	            // Intermediate hash value
	            H[0] = (H[0] + a) | 0;
	            H[1] = (H[1] + b) | 0;
	            H[2] = (H[2] + c) | 0;
	            H[3] = (H[3] + d) | 0;
	        },

	        _doFinalize: function () {
	            // Shortcuts
	            var data = this._data;
	            var dataWords = data.words;

	            var nBitsTotal = this._nDataBytes * 8;
	            var nBitsLeft = data.sigBytes * 8;

	            // Add padding
	            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);

	            var nBitsTotalH = Math.floor(nBitsTotal / 0x100000000);
	            var nBitsTotalL = nBitsTotal;
	            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = (
	                (((nBitsTotalH << 8)  | (nBitsTotalH >>> 24)) & 0x00ff00ff) |
	                (((nBitsTotalH << 24) | (nBitsTotalH >>> 8))  & 0xff00ff00)
	            );
	            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = (
	                (((nBitsTotalL << 8)  | (nBitsTotalL >>> 24)) & 0x00ff00ff) |
	                (((nBitsTotalL << 24) | (nBitsTotalL >>> 8))  & 0xff00ff00)
	            );

	            data.sigBytes = (dataWords.length + 1) * 4;

	            // Hash final blocks
	            this._process();

	            // Shortcuts
	            var hash = this._hash;
	            var H = hash.words;

	            // Swap endian
	            for (var i = 0; i < 4; i++) {
	                // Shortcut
	                var H_i = H[i];

	                H[i] = (((H_i << 8)  | (H_i >>> 24)) & 0x00ff00ff) |
	                       (((H_i << 24) | (H_i >>> 8))  & 0xff00ff00);
	            }

	            // Return final computed hash
	            return hash;
	        },

	        clone: function () {
	            var clone = Hasher.clone.call(this);
	            clone._hash = this._hash.clone();

	            return clone;
	        }
	    });

	    function FF(a, b, c, d, x, s, t) {
	        var n = a + ((b & c) | (~b & d)) + x + t;
	        return ((n << s) | (n >>> (32 - s))) + b;
	    }

	    function GG(a, b, c, d, x, s, t) {
	        var n = a + ((b & d) | (c & ~d)) + x + t;
	        return ((n << s) | (n >>> (32 - s))) + b;
	    }

	    function HH(a, b, c, d, x, s, t) {
	        var n = a + (b ^ c ^ d) + x + t;
	        return ((n << s) | (n >>> (32 - s))) + b;
	    }

	    function II(a, b, c, d, x, s, t) {
	        var n = a + (c ^ (b | ~d)) + x + t;
	        return ((n << s) | (n >>> (32 - s))) + b;
	    }

	    /**
	     * Shortcut function to the hasher's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     *
	     * @return {WordArray} The hash.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hash = CryptoJS.MD5('message');
	     *     var hash = CryptoJS.MD5(wordArray);
	     */
	    C.MD5 = Hasher._createHelper(MD5);

	    /**
	     * Shortcut function to the HMAC's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     * @param {WordArray|string} key The secret key.
	     *
	     * @return {WordArray} The HMAC.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hmac = CryptoJS.HmacMD5(message, key);
	     */
	    C.HmacMD5 = Hasher._createHmacHelper(MD5);
	}(Math));


	return CryptoJS.MD5;

}));

/***/ }),

/***/ "./js-sdk-legacy/node_modules/crypto-js/mode-cfb.js":
/*!**********************************************************!*\
  !*** ./js-sdk-legacy/node_modules/crypto-js/mode-cfb.js ***!
  \**********************************************************/
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory, undef) {
	if (true) {
		// CommonJS
		module.exports = exports = factory(__webpack_require__(/*! ./core */ "./js-sdk-legacy/node_modules/crypto-js/core.js"), __webpack_require__(/*! ./cipher-core */ "./js-sdk-legacy/node_modules/crypto-js/cipher-core.js"));
	}
	else // removed by dead control flow
{}
}(this, function (CryptoJS) {

	/**
	 * Cipher Feedback block mode.
	 */
	CryptoJS.mode.CFB = (function () {
	    var CFB = CryptoJS.lib.BlockCipherMode.extend();

	    CFB.Encryptor = CFB.extend({
	        processBlock: function (words, offset) {
	            // Shortcuts
	            var cipher = this._cipher;
	            var blockSize = cipher.blockSize;

	            generateKeystreamAndEncrypt.call(this, words, offset, blockSize, cipher);

	            // Remember this block to use with next block
	            this._prevBlock = words.slice(offset, offset + blockSize);
	        }
	    });

	    CFB.Decryptor = CFB.extend({
	        processBlock: function (words, offset) {
	            // Shortcuts
	            var cipher = this._cipher;
	            var blockSize = cipher.blockSize;

	            // Remember this block to use with next block
	            var thisBlock = words.slice(offset, offset + blockSize);

	            generateKeystreamAndEncrypt.call(this, words, offset, blockSize, cipher);

	            // This block becomes the previous block
	            this._prevBlock = thisBlock;
	        }
	    });

	    function generateKeystreamAndEncrypt(words, offset, blockSize, cipher) {
	        var keystream;

	        // Shortcut
	        var iv = this._iv;

	        // Generate keystream
	        if (iv) {
	            keystream = iv.slice(0);

	            // Remove IV for subsequent blocks
	            this._iv = undefined;
	        } else {
	            keystream = this._prevBlock;
	        }
	        cipher.encryptBlock(keystream, 0);

	        // Encrypt
	        for (var i = 0; i < blockSize; i++) {
	            words[offset + i] ^= keystream[i];
	        }
	    }

	    return CFB;
	}());


	return CryptoJS.mode.CFB;

}));

/***/ }),

/***/ "./js-sdk-legacy/node_modules/crypto-js/mode-ctr-gladman.js":
/*!******************************************************************!*\
  !*** ./js-sdk-legacy/node_modules/crypto-js/mode-ctr-gladman.js ***!
  \******************************************************************/
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory, undef) {
	if (true) {
		// CommonJS
		module.exports = exports = factory(__webpack_require__(/*! ./core */ "./js-sdk-legacy/node_modules/crypto-js/core.js"), __webpack_require__(/*! ./cipher-core */ "./js-sdk-legacy/node_modules/crypto-js/cipher-core.js"));
	}
	else // removed by dead control flow
{}
}(this, function (CryptoJS) {

	/** @preserve
	 * Counter block mode compatible with  Dr Brian Gladman fileenc.c
	 * derived from CryptoJS.mode.CTR
	 * Jan Hruby jhruby.web@gmail.com
	 */
	CryptoJS.mode.CTRGladman = (function () {
	    var CTRGladman = CryptoJS.lib.BlockCipherMode.extend();

		function incWord(word)
		{
			if (((word >> 24) & 0xff) === 0xff) { //overflow
			var b1 = (word >> 16)&0xff;
			var b2 = (word >> 8)&0xff;
			var b3 = word & 0xff;

			if (b1 === 0xff) // overflow b1
			{
			b1 = 0;
			if (b2 === 0xff)
			{
				b2 = 0;
				if (b3 === 0xff)
				{
					b3 = 0;
				}
				else
				{
					++b3;
				}
			}
			else
			{
				++b2;
			}
			}
			else
			{
			++b1;
			}

			word = 0;
			word += (b1 << 16);
			word += (b2 << 8);
			word += b3;
			}
			else
			{
			word += (0x01 << 24);
			}
			return word;
		}

		function incCounter(counter)
		{
			if ((counter[0] = incWord(counter[0])) === 0)
			{
				// encr_data in fileenc.c from  Dr Brian Gladman's counts only with DWORD j < 8
				counter[1] = incWord(counter[1]);
			}
			return counter;
		}

	    var Encryptor = CTRGladman.Encryptor = CTRGladman.extend({
	        processBlock: function (words, offset) {
	            // Shortcuts
	            var cipher = this._cipher
	            var blockSize = cipher.blockSize;
	            var iv = this._iv;
	            var counter = this._counter;

	            // Generate keystream
	            if (iv) {
	                counter = this._counter = iv.slice(0);

	                // Remove IV for subsequent blocks
	                this._iv = undefined;
	            }

				incCounter(counter);

				var keystream = counter.slice(0);
	            cipher.encryptBlock(keystream, 0);

	            // Encrypt
	            for (var i = 0; i < blockSize; i++) {
	                words[offset + i] ^= keystream[i];
	            }
	        }
	    });

	    CTRGladman.Decryptor = Encryptor;

	    return CTRGladman;
	}());




	return CryptoJS.mode.CTRGladman;

}));

/***/ }),

/***/ "./js-sdk-legacy/node_modules/crypto-js/mode-ctr.js":
/*!**********************************************************!*\
  !*** ./js-sdk-legacy/node_modules/crypto-js/mode-ctr.js ***!
  \**********************************************************/
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory, undef) {
	if (true) {
		// CommonJS
		module.exports = exports = factory(__webpack_require__(/*! ./core */ "./js-sdk-legacy/node_modules/crypto-js/core.js"), __webpack_require__(/*! ./cipher-core */ "./js-sdk-legacy/node_modules/crypto-js/cipher-core.js"));
	}
	else // removed by dead control flow
{}
}(this, function (CryptoJS) {

	/**
	 * Counter block mode.
	 */
	CryptoJS.mode.CTR = (function () {
	    var CTR = CryptoJS.lib.BlockCipherMode.extend();

	    var Encryptor = CTR.Encryptor = CTR.extend({
	        processBlock: function (words, offset) {
	            // Shortcuts
	            var cipher = this._cipher
	            var blockSize = cipher.blockSize;
	            var iv = this._iv;
	            var counter = this._counter;

	            // Generate keystream
	            if (iv) {
	                counter = this._counter = iv.slice(0);

	                // Remove IV for subsequent blocks
	                this._iv = undefined;
	            }
	            var keystream = counter.slice(0);
	            cipher.encryptBlock(keystream, 0);

	            // Increment counter
	            counter[blockSize - 1] = (counter[blockSize - 1] + 1) | 0

	            // Encrypt
	            for (var i = 0; i < blockSize; i++) {
	                words[offset + i] ^= keystream[i];
	            }
	        }
	    });

	    CTR.Decryptor = Encryptor;

	    return CTR;
	}());


	return CryptoJS.mode.CTR;

}));

/***/ }),

/***/ "./js-sdk-legacy/node_modules/crypto-js/mode-ecb.js":
/*!**********************************************************!*\
  !*** ./js-sdk-legacy/node_modules/crypto-js/mode-ecb.js ***!
  \**********************************************************/
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory, undef) {
	if (true) {
		// CommonJS
		module.exports = exports = factory(__webpack_require__(/*! ./core */ "./js-sdk-legacy/node_modules/crypto-js/core.js"), __webpack_require__(/*! ./cipher-core */ "./js-sdk-legacy/node_modules/crypto-js/cipher-core.js"));
	}
	else // removed by dead control flow
{}
}(this, function (CryptoJS) {

	/**
	 * Electronic Codebook block mode.
	 */
	CryptoJS.mode.ECB = (function () {
	    var ECB = CryptoJS.lib.BlockCipherMode.extend();

	    ECB.Encryptor = ECB.extend({
	        processBlock: function (words, offset) {
	            this._cipher.encryptBlock(words, offset);
	        }
	    });

	    ECB.Decryptor = ECB.extend({
	        processBlock: function (words, offset) {
	            this._cipher.decryptBlock(words, offset);
	        }
	    });

	    return ECB;
	}());


	return CryptoJS.mode.ECB;

}));

/***/ }),

/***/ "./js-sdk-legacy/node_modules/crypto-js/mode-ofb.js":
/*!**********************************************************!*\
  !*** ./js-sdk-legacy/node_modules/crypto-js/mode-ofb.js ***!
  \**********************************************************/
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory, undef) {
	if (true) {
		// CommonJS
		module.exports = exports = factory(__webpack_require__(/*! ./core */ "./js-sdk-legacy/node_modules/crypto-js/core.js"), __webpack_require__(/*! ./cipher-core */ "./js-sdk-legacy/node_modules/crypto-js/cipher-core.js"));
	}
	else // removed by dead control flow
{}
}(this, function (CryptoJS) {

	/**
	 * Output Feedback block mode.
	 */
	CryptoJS.mode.OFB = (function () {
	    var OFB = CryptoJS.lib.BlockCipherMode.extend();

	    var Encryptor = OFB.Encryptor = OFB.extend({
	        processBlock: function (words, offset) {
	            // Shortcuts
	            var cipher = this._cipher
	            var blockSize = cipher.blockSize;
	            var iv = this._iv;
	            var keystream = this._keystream;

	            // Generate keystream
	            if (iv) {
	                keystream = this._keystream = iv.slice(0);

	                // Remove IV for subsequent blocks
	                this._iv = undefined;
	            }
	            cipher.encryptBlock(keystream, 0);

	            // Encrypt
	            for (var i = 0; i < blockSize; i++) {
	                words[offset + i] ^= keystream[i];
	            }
	        }
	    });

	    OFB.Decryptor = Encryptor;

	    return OFB;
	}());


	return CryptoJS.mode.OFB;

}));

/***/ }),

/***/ "./js-sdk-legacy/node_modules/crypto-js/pad-ansix923.js":
/*!**************************************************************!*\
  !*** ./js-sdk-legacy/node_modules/crypto-js/pad-ansix923.js ***!
  \**************************************************************/
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory, undef) {
	if (true) {
		// CommonJS
		module.exports = exports = factory(__webpack_require__(/*! ./core */ "./js-sdk-legacy/node_modules/crypto-js/core.js"), __webpack_require__(/*! ./cipher-core */ "./js-sdk-legacy/node_modules/crypto-js/cipher-core.js"));
	}
	else // removed by dead control flow
{}
}(this, function (CryptoJS) {

	/**
	 * ANSI X.923 padding strategy.
	 */
	CryptoJS.pad.AnsiX923 = {
	    pad: function (data, blockSize) {
	        // Shortcuts
	        var dataSigBytes = data.sigBytes;
	        var blockSizeBytes = blockSize * 4;

	        // Count padding bytes
	        var nPaddingBytes = blockSizeBytes - dataSigBytes % blockSizeBytes;

	        // Compute last byte position
	        var lastBytePos = dataSigBytes + nPaddingBytes - 1;

	        // Pad
	        data.clamp();
	        data.words[lastBytePos >>> 2] |= nPaddingBytes << (24 - (lastBytePos % 4) * 8);
	        data.sigBytes += nPaddingBytes;
	    },

	    unpad: function (data) {
	        // Get number of padding bytes from last byte
	        var nPaddingBytes = data.words[(data.sigBytes - 1) >>> 2] & 0xff;

	        // Remove padding
	        data.sigBytes -= nPaddingBytes;
	    }
	};


	return CryptoJS.pad.Ansix923;

}));

/***/ }),

/***/ "./js-sdk-legacy/node_modules/crypto-js/pad-iso10126.js":
/*!**************************************************************!*\
  !*** ./js-sdk-legacy/node_modules/crypto-js/pad-iso10126.js ***!
  \**************************************************************/
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory, undef) {
	if (true) {
		// CommonJS
		module.exports = exports = factory(__webpack_require__(/*! ./core */ "./js-sdk-legacy/node_modules/crypto-js/core.js"), __webpack_require__(/*! ./cipher-core */ "./js-sdk-legacy/node_modules/crypto-js/cipher-core.js"));
	}
	else // removed by dead control flow
{}
}(this, function (CryptoJS) {

	/**
	 * ISO 10126 padding strategy.
	 */
	CryptoJS.pad.Iso10126 = {
	    pad: function (data, blockSize) {
	        // Shortcut
	        var blockSizeBytes = blockSize * 4;

	        // Count padding bytes
	        var nPaddingBytes = blockSizeBytes - data.sigBytes % blockSizeBytes;

	        // Pad
	        data.concat(CryptoJS.lib.WordArray.random(nPaddingBytes - 1)).
	             concat(CryptoJS.lib.WordArray.create([nPaddingBytes << 24], 1));
	    },

	    unpad: function (data) {
	        // Get number of padding bytes from last byte
	        var nPaddingBytes = data.words[(data.sigBytes - 1) >>> 2] & 0xff;

	        // Remove padding
	        data.sigBytes -= nPaddingBytes;
	    }
	};


	return CryptoJS.pad.Iso10126;

}));

/***/ }),

/***/ "./js-sdk-legacy/node_modules/crypto-js/pad-iso97971.js":
/*!**************************************************************!*\
  !*** ./js-sdk-legacy/node_modules/crypto-js/pad-iso97971.js ***!
  \**************************************************************/
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory, undef) {
	if (true) {
		// CommonJS
		module.exports = exports = factory(__webpack_require__(/*! ./core */ "./js-sdk-legacy/node_modules/crypto-js/core.js"), __webpack_require__(/*! ./cipher-core */ "./js-sdk-legacy/node_modules/crypto-js/cipher-core.js"));
	}
	else // removed by dead control flow
{}
}(this, function (CryptoJS) {

	/**
	 * ISO/IEC 9797-1 Padding Method 2.
	 */
	CryptoJS.pad.Iso97971 = {
	    pad: function (data, blockSize) {
	        // Add 0x80 byte
	        data.concat(CryptoJS.lib.WordArray.create([0x80000000], 1));

	        // Zero pad the rest
	        CryptoJS.pad.ZeroPadding.pad(data, blockSize);
	    },

	    unpad: function (data) {
	        // Remove zero padding
	        CryptoJS.pad.ZeroPadding.unpad(data);

	        // Remove one more byte -- the 0x80 byte
	        data.sigBytes--;
	    }
	};


	return CryptoJS.pad.Iso97971;

}));

/***/ }),

/***/ "./js-sdk-legacy/node_modules/crypto-js/pad-nopadding.js":
/*!***************************************************************!*\
  !*** ./js-sdk-legacy/node_modules/crypto-js/pad-nopadding.js ***!
  \***************************************************************/
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory, undef) {
	if (true) {
		// CommonJS
		module.exports = exports = factory(__webpack_require__(/*! ./core */ "./js-sdk-legacy/node_modules/crypto-js/core.js"), __webpack_require__(/*! ./cipher-core */ "./js-sdk-legacy/node_modules/crypto-js/cipher-core.js"));
	}
	else // removed by dead control flow
{}
}(this, function (CryptoJS) {

	/**
	 * A noop padding strategy.
	 */
	CryptoJS.pad.NoPadding = {
	    pad: function () {
	    },

	    unpad: function () {
	    }
	};


	return CryptoJS.pad.NoPadding;

}));

/***/ }),

/***/ "./js-sdk-legacy/node_modules/crypto-js/pad-zeropadding.js":
/*!*****************************************************************!*\
  !*** ./js-sdk-legacy/node_modules/crypto-js/pad-zeropadding.js ***!
  \*****************************************************************/
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory, undef) {
	if (true) {
		// CommonJS
		module.exports = exports = factory(__webpack_require__(/*! ./core */ "./js-sdk-legacy/node_modules/crypto-js/core.js"), __webpack_require__(/*! ./cipher-core */ "./js-sdk-legacy/node_modules/crypto-js/cipher-core.js"));
	}
	else // removed by dead control flow
{}
}(this, function (CryptoJS) {

	/**
	 * Zero padding strategy.
	 */
	CryptoJS.pad.ZeroPadding = {
	    pad: function (data, blockSize) {
	        // Shortcut
	        var blockSizeBytes = blockSize * 4;

	        // Pad
	        data.clamp();
	        data.sigBytes += blockSizeBytes - ((data.sigBytes % blockSizeBytes) || blockSizeBytes);
	    },

	    unpad: function (data) {
	        // Shortcut
	        var dataWords = data.words;

	        // Unpad
	        var i = data.sigBytes - 1;
	        for (var i = data.sigBytes - 1; i >= 0; i--) {
	            if (((dataWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff)) {
	                data.sigBytes = i + 1;
	                break;
	            }
	        }
	    }
	};


	return CryptoJS.pad.ZeroPadding;

}));

/***/ }),

/***/ "./js-sdk-legacy/node_modules/crypto-js/pbkdf2.js":
/*!********************************************************!*\
  !*** ./js-sdk-legacy/node_modules/crypto-js/pbkdf2.js ***!
  \********************************************************/
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory, undef) {
	if (true) {
		// CommonJS
		module.exports = exports = factory(__webpack_require__(/*! ./core */ "./js-sdk-legacy/node_modules/crypto-js/core.js"), __webpack_require__(/*! ./sha256 */ "./js-sdk-legacy/node_modules/crypto-js/sha256.js"), __webpack_require__(/*! ./hmac */ "./js-sdk-legacy/node_modules/crypto-js/hmac.js"));
	}
	else // removed by dead control flow
{}
}(this, function (CryptoJS) {

	(function () {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var Base = C_lib.Base;
	    var WordArray = C_lib.WordArray;
	    var C_algo = C.algo;
	    var SHA256 = C_algo.SHA256;
	    var HMAC = C_algo.HMAC;

	    /**
	     * Password-Based Key Derivation Function 2 algorithm.
	     */
	    var PBKDF2 = C_algo.PBKDF2 = Base.extend({
	        /**
	         * Configuration options.
	         *
	         * @property {number} keySize The key size in words to generate. Default: 4 (128 bits)
	         * @property {Hasher} hasher The hasher to use. Default: SHA256
	         * @property {number} iterations The number of iterations to perform. Default: 250000
	         */
	        cfg: Base.extend({
	            keySize: 128/32,
	            hasher: SHA256,
	            iterations: 250000
	        }),

	        /**
	         * Initializes a newly created key derivation function.
	         *
	         * @param {Object} cfg (Optional) The configuration options to use for the derivation.
	         *
	         * @example
	         *
	         *     var kdf = CryptoJS.algo.PBKDF2.create();
	         *     var kdf = CryptoJS.algo.PBKDF2.create({ keySize: 8 });
	         *     var kdf = CryptoJS.algo.PBKDF2.create({ keySize: 8, iterations: 1000 });
	         */
	        init: function (cfg) {
	            this.cfg = this.cfg.extend(cfg);
	        },

	        /**
	         * Computes the Password-Based Key Derivation Function 2.
	         *
	         * @param {WordArray|string} password The password.
	         * @param {WordArray|string} salt A salt.
	         *
	         * @return {WordArray} The derived key.
	         *
	         * @example
	         *
	         *     var key = kdf.compute(password, salt);
	         */
	        compute: function (password, salt) {
	            // Shortcut
	            var cfg = this.cfg;

	            // Init HMAC
	            var hmac = HMAC.create(cfg.hasher, password);

	            // Initial values
	            var derivedKey = WordArray.create();
	            var blockIndex = WordArray.create([0x00000001]);

	            // Shortcuts
	            var derivedKeyWords = derivedKey.words;
	            var blockIndexWords = blockIndex.words;
	            var keySize = cfg.keySize;
	            var iterations = cfg.iterations;

	            // Generate key
	            while (derivedKeyWords.length < keySize) {
	                var block = hmac.update(salt).finalize(blockIndex);
	                hmac.reset();

	                // Shortcuts
	                var blockWords = block.words;
	                var blockWordsLength = blockWords.length;

	                // Iterations
	                var intermediate = block;
	                for (var i = 1; i < iterations; i++) {
	                    intermediate = hmac.finalize(intermediate);
	                    hmac.reset();

	                    // Shortcut
	                    var intermediateWords = intermediate.words;

	                    // XOR intermediate with block
	                    for (var j = 0; j < blockWordsLength; j++) {
	                        blockWords[j] ^= intermediateWords[j];
	                    }
	                }

	                derivedKey.concat(block);
	                blockIndexWords[0]++;
	            }
	            derivedKey.sigBytes = keySize * 4;

	            return derivedKey;
	        }
	    });

	    /**
	     * Computes the Password-Based Key Derivation Function 2.
	     *
	     * @param {WordArray|string} password The password.
	     * @param {WordArray|string} salt A salt.
	     * @param {Object} cfg (Optional) The configuration options to use for this computation.
	     *
	     * @return {WordArray} The derived key.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var key = CryptoJS.PBKDF2(password, salt);
	     *     var key = CryptoJS.PBKDF2(password, salt, { keySize: 8 });
	     *     var key = CryptoJS.PBKDF2(password, salt, { keySize: 8, iterations: 1000 });
	     */
	    C.PBKDF2 = function (password, salt, cfg) {
	        return PBKDF2.create(cfg).compute(password, salt);
	    };
	}());


	return CryptoJS.PBKDF2;

}));

/***/ }),

/***/ "./js-sdk-legacy/node_modules/crypto-js/rabbit-legacy.js":
/*!***************************************************************!*\
  !*** ./js-sdk-legacy/node_modules/crypto-js/rabbit-legacy.js ***!
  \***************************************************************/
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory, undef) {
	if (true) {
		// CommonJS
		module.exports = exports = factory(__webpack_require__(/*! ./core */ "./js-sdk-legacy/node_modules/crypto-js/core.js"), __webpack_require__(/*! ./enc-base64 */ "./js-sdk-legacy/node_modules/crypto-js/enc-base64.js"), __webpack_require__(/*! ./md5 */ "./js-sdk-legacy/node_modules/crypto-js/md5.js"), __webpack_require__(/*! ./evpkdf */ "./js-sdk-legacy/node_modules/crypto-js/evpkdf.js"), __webpack_require__(/*! ./cipher-core */ "./js-sdk-legacy/node_modules/crypto-js/cipher-core.js"));
	}
	else // removed by dead control flow
{}
}(this, function (CryptoJS) {

	(function () {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var StreamCipher = C_lib.StreamCipher;
	    var C_algo = C.algo;

	    // Reusable objects
	    var S  = [];
	    var C_ = [];
	    var G  = [];

	    /**
	     * Rabbit stream cipher algorithm.
	     *
	     * This is a legacy version that neglected to convert the key to little-endian.
	     * This error doesn't affect the cipher's security,
	     * but it does affect its compatibility with other implementations.
	     */
	    var RabbitLegacy = C_algo.RabbitLegacy = StreamCipher.extend({
	        _doReset: function () {
	            // Shortcuts
	            var K = this._key.words;
	            var iv = this.cfg.iv;

	            // Generate initial state values
	            var X = this._X = [
	                K[0], (K[3] << 16) | (K[2] >>> 16),
	                K[1], (K[0] << 16) | (K[3] >>> 16),
	                K[2], (K[1] << 16) | (K[0] >>> 16),
	                K[3], (K[2] << 16) | (K[1] >>> 16)
	            ];

	            // Generate initial counter values
	            var C = this._C = [
	                (K[2] << 16) | (K[2] >>> 16), (K[0] & 0xffff0000) | (K[1] & 0x0000ffff),
	                (K[3] << 16) | (K[3] >>> 16), (K[1] & 0xffff0000) | (K[2] & 0x0000ffff),
	                (K[0] << 16) | (K[0] >>> 16), (K[2] & 0xffff0000) | (K[3] & 0x0000ffff),
	                (K[1] << 16) | (K[1] >>> 16), (K[3] & 0xffff0000) | (K[0] & 0x0000ffff)
	            ];

	            // Carry bit
	            this._b = 0;

	            // Iterate the system four times
	            for (var i = 0; i < 4; i++) {
	                nextState.call(this);
	            }

	            // Modify the counters
	            for (var i = 0; i < 8; i++) {
	                C[i] ^= X[(i + 4) & 7];
	            }

	            // IV setup
	            if (iv) {
	                // Shortcuts
	                var IV = iv.words;
	                var IV_0 = IV[0];
	                var IV_1 = IV[1];

	                // Generate four subvectors
	                var i0 = (((IV_0 << 8) | (IV_0 >>> 24)) & 0x00ff00ff) | (((IV_0 << 24) | (IV_0 >>> 8)) & 0xff00ff00);
	                var i2 = (((IV_1 << 8) | (IV_1 >>> 24)) & 0x00ff00ff) | (((IV_1 << 24) | (IV_1 >>> 8)) & 0xff00ff00);
	                var i1 = (i0 >>> 16) | (i2 & 0xffff0000);
	                var i3 = (i2 << 16)  | (i0 & 0x0000ffff);

	                // Modify counter values
	                C[0] ^= i0;
	                C[1] ^= i1;
	                C[2] ^= i2;
	                C[3] ^= i3;
	                C[4] ^= i0;
	                C[5] ^= i1;
	                C[6] ^= i2;
	                C[7] ^= i3;

	                // Iterate the system four times
	                for (var i = 0; i < 4; i++) {
	                    nextState.call(this);
	                }
	            }
	        },

	        _doProcessBlock: function (M, offset) {
	            // Shortcut
	            var X = this._X;

	            // Iterate the system
	            nextState.call(this);

	            // Generate four keystream words
	            S[0] = X[0] ^ (X[5] >>> 16) ^ (X[3] << 16);
	            S[1] = X[2] ^ (X[7] >>> 16) ^ (X[5] << 16);
	            S[2] = X[4] ^ (X[1] >>> 16) ^ (X[7] << 16);
	            S[3] = X[6] ^ (X[3] >>> 16) ^ (X[1] << 16);

	            for (var i = 0; i < 4; i++) {
	                // Swap endian
	                S[i] = (((S[i] << 8)  | (S[i] >>> 24)) & 0x00ff00ff) |
	                       (((S[i] << 24) | (S[i] >>> 8))  & 0xff00ff00);

	                // Encrypt
	                M[offset + i] ^= S[i];
	            }
	        },

	        blockSize: 128/32,

	        ivSize: 64/32
	    });

	    function nextState() {
	        // Shortcuts
	        var X = this._X;
	        var C = this._C;

	        // Save old counter values
	        for (var i = 0; i < 8; i++) {
	            C_[i] = C[i];
	        }

	        // Calculate new counter values
	        C[0] = (C[0] + 0x4d34d34d + this._b) | 0;
	        C[1] = (C[1] + 0xd34d34d3 + ((C[0] >>> 0) < (C_[0] >>> 0) ? 1 : 0)) | 0;
	        C[2] = (C[2] + 0x34d34d34 + ((C[1] >>> 0) < (C_[1] >>> 0) ? 1 : 0)) | 0;
	        C[3] = (C[3] + 0x4d34d34d + ((C[2] >>> 0) < (C_[2] >>> 0) ? 1 : 0)) | 0;
	        C[4] = (C[4] + 0xd34d34d3 + ((C[3] >>> 0) < (C_[3] >>> 0) ? 1 : 0)) | 0;
	        C[5] = (C[5] + 0x34d34d34 + ((C[4] >>> 0) < (C_[4] >>> 0) ? 1 : 0)) | 0;
	        C[6] = (C[6] + 0x4d34d34d + ((C[5] >>> 0) < (C_[5] >>> 0) ? 1 : 0)) | 0;
	        C[7] = (C[7] + 0xd34d34d3 + ((C[6] >>> 0) < (C_[6] >>> 0) ? 1 : 0)) | 0;
	        this._b = (C[7] >>> 0) < (C_[7] >>> 0) ? 1 : 0;

	        // Calculate the g-values
	        for (var i = 0; i < 8; i++) {
	            var gx = X[i] + C[i];

	            // Construct high and low argument for squaring
	            var ga = gx & 0xffff;
	            var gb = gx >>> 16;

	            // Calculate high and low result of squaring
	            var gh = ((((ga * ga) >>> 17) + ga * gb) >>> 15) + gb * gb;
	            var gl = (((gx & 0xffff0000) * gx) | 0) + (((gx & 0x0000ffff) * gx) | 0);

	            // High XOR low
	            G[i] = gh ^ gl;
	        }

	        // Calculate new state values
	        X[0] = (G[0] + ((G[7] << 16) | (G[7] >>> 16)) + ((G[6] << 16) | (G[6] >>> 16))) | 0;
	        X[1] = (G[1] + ((G[0] << 8)  | (G[0] >>> 24)) + G[7]) | 0;
	        X[2] = (G[2] + ((G[1] << 16) | (G[1] >>> 16)) + ((G[0] << 16) | (G[0] >>> 16))) | 0;
	        X[3] = (G[3] + ((G[2] << 8)  | (G[2] >>> 24)) + G[1]) | 0;
	        X[4] = (G[4] + ((G[3] << 16) | (G[3] >>> 16)) + ((G[2] << 16) | (G[2] >>> 16))) | 0;
	        X[5] = (G[5] + ((G[4] << 8)  | (G[4] >>> 24)) + G[3]) | 0;
	        X[6] = (G[6] + ((G[5] << 16) | (G[5] >>> 16)) + ((G[4] << 16) | (G[4] >>> 16))) | 0;
	        X[7] = (G[7] + ((G[6] << 8)  | (G[6] >>> 24)) + G[5]) | 0;
	    }

	    /**
	     * Shortcut functions to the cipher's object interface.
	     *
	     * @example
	     *
	     *     var ciphertext = CryptoJS.RabbitLegacy.encrypt(message, key, cfg);
	     *     var plaintext  = CryptoJS.RabbitLegacy.decrypt(ciphertext, key, cfg);
	     */
	    C.RabbitLegacy = StreamCipher._createHelper(RabbitLegacy);
	}());


	return CryptoJS.RabbitLegacy;

}));

/***/ }),

/***/ "./js-sdk-legacy/node_modules/crypto-js/rabbit.js":
/*!********************************************************!*\
  !*** ./js-sdk-legacy/node_modules/crypto-js/rabbit.js ***!
  \********************************************************/
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory, undef) {
	if (true) {
		// CommonJS
		module.exports = exports = factory(__webpack_require__(/*! ./core */ "./js-sdk-legacy/node_modules/crypto-js/core.js"), __webpack_require__(/*! ./enc-base64 */ "./js-sdk-legacy/node_modules/crypto-js/enc-base64.js"), __webpack_require__(/*! ./md5 */ "./js-sdk-legacy/node_modules/crypto-js/md5.js"), __webpack_require__(/*! ./evpkdf */ "./js-sdk-legacy/node_modules/crypto-js/evpkdf.js"), __webpack_require__(/*! ./cipher-core */ "./js-sdk-legacy/node_modules/crypto-js/cipher-core.js"));
	}
	else // removed by dead control flow
{}
}(this, function (CryptoJS) {

	(function () {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var StreamCipher = C_lib.StreamCipher;
	    var C_algo = C.algo;

	    // Reusable objects
	    var S  = [];
	    var C_ = [];
	    var G  = [];

	    /**
	     * Rabbit stream cipher algorithm
	     */
	    var Rabbit = C_algo.Rabbit = StreamCipher.extend({
	        _doReset: function () {
	            // Shortcuts
	            var K = this._key.words;
	            var iv = this.cfg.iv;

	            // Swap endian
	            for (var i = 0; i < 4; i++) {
	                K[i] = (((K[i] << 8)  | (K[i] >>> 24)) & 0x00ff00ff) |
	                       (((K[i] << 24) | (K[i] >>> 8))  & 0xff00ff00);
	            }

	            // Generate initial state values
	            var X = this._X = [
	                K[0], (K[3] << 16) | (K[2] >>> 16),
	                K[1], (K[0] << 16) | (K[3] >>> 16),
	                K[2], (K[1] << 16) | (K[0] >>> 16),
	                K[3], (K[2] << 16) | (K[1] >>> 16)
	            ];

	            // Generate initial counter values
	            var C = this._C = [
	                (K[2] << 16) | (K[2] >>> 16), (K[0] & 0xffff0000) | (K[1] & 0x0000ffff),
	                (K[3] << 16) | (K[3] >>> 16), (K[1] & 0xffff0000) | (K[2] & 0x0000ffff),
	                (K[0] << 16) | (K[0] >>> 16), (K[2] & 0xffff0000) | (K[3] & 0x0000ffff),
	                (K[1] << 16) | (K[1] >>> 16), (K[3] & 0xffff0000) | (K[0] & 0x0000ffff)
	            ];

	            // Carry bit
	            this._b = 0;

	            // Iterate the system four times
	            for (var i = 0; i < 4; i++) {
	                nextState.call(this);
	            }

	            // Modify the counters
	            for (var i = 0; i < 8; i++) {
	                C[i] ^= X[(i + 4) & 7];
	            }

	            // IV setup
	            if (iv) {
	                // Shortcuts
	                var IV = iv.words;
	                var IV_0 = IV[0];
	                var IV_1 = IV[1];

	                // Generate four subvectors
	                var i0 = (((IV_0 << 8) | (IV_0 >>> 24)) & 0x00ff00ff) | (((IV_0 << 24) | (IV_0 >>> 8)) & 0xff00ff00);
	                var i2 = (((IV_1 << 8) | (IV_1 >>> 24)) & 0x00ff00ff) | (((IV_1 << 24) | (IV_1 >>> 8)) & 0xff00ff00);
	                var i1 = (i0 >>> 16) | (i2 & 0xffff0000);
	                var i3 = (i2 << 16)  | (i0 & 0x0000ffff);

	                // Modify counter values
	                C[0] ^= i0;
	                C[1] ^= i1;
	                C[2] ^= i2;
	                C[3] ^= i3;
	                C[4] ^= i0;
	                C[5] ^= i1;
	                C[6] ^= i2;
	                C[7] ^= i3;

	                // Iterate the system four times
	                for (var i = 0; i < 4; i++) {
	                    nextState.call(this);
	                }
	            }
	        },

	        _doProcessBlock: function (M, offset) {
	            // Shortcut
	            var X = this._X;

	            // Iterate the system
	            nextState.call(this);

	            // Generate four keystream words
	            S[0] = X[0] ^ (X[5] >>> 16) ^ (X[3] << 16);
	            S[1] = X[2] ^ (X[7] >>> 16) ^ (X[5] << 16);
	            S[2] = X[4] ^ (X[1] >>> 16) ^ (X[7] << 16);
	            S[3] = X[6] ^ (X[3] >>> 16) ^ (X[1] << 16);

	            for (var i = 0; i < 4; i++) {
	                // Swap endian
	                S[i] = (((S[i] << 8)  | (S[i] >>> 24)) & 0x00ff00ff) |
	                       (((S[i] << 24) | (S[i] >>> 8))  & 0xff00ff00);

	                // Encrypt
	                M[offset + i] ^= S[i];
	            }
	        },

	        blockSize: 128/32,

	        ivSize: 64/32
	    });

	    function nextState() {
	        // Shortcuts
	        var X = this._X;
	        var C = this._C;

	        // Save old counter values
	        for (var i = 0; i < 8; i++) {
	            C_[i] = C[i];
	        }

	        // Calculate new counter values
	        C[0] = (C[0] + 0x4d34d34d + this._b) | 0;
	        C[1] = (C[1] + 0xd34d34d3 + ((C[0] >>> 0) < (C_[0] >>> 0) ? 1 : 0)) | 0;
	        C[2] = (C[2] + 0x34d34d34 + ((C[1] >>> 0) < (C_[1] >>> 0) ? 1 : 0)) | 0;
	        C[3] = (C[3] + 0x4d34d34d + ((C[2] >>> 0) < (C_[2] >>> 0) ? 1 : 0)) | 0;
	        C[4] = (C[4] + 0xd34d34d3 + ((C[3] >>> 0) < (C_[3] >>> 0) ? 1 : 0)) | 0;
	        C[5] = (C[5] + 0x34d34d34 + ((C[4] >>> 0) < (C_[4] >>> 0) ? 1 : 0)) | 0;
	        C[6] = (C[6] + 0x4d34d34d + ((C[5] >>> 0) < (C_[5] >>> 0) ? 1 : 0)) | 0;
	        C[7] = (C[7] + 0xd34d34d3 + ((C[6] >>> 0) < (C_[6] >>> 0) ? 1 : 0)) | 0;
	        this._b = (C[7] >>> 0) < (C_[7] >>> 0) ? 1 : 0;

	        // Calculate the g-values
	        for (var i = 0; i < 8; i++) {
	            var gx = X[i] + C[i];

	            // Construct high and low argument for squaring
	            var ga = gx & 0xffff;
	            var gb = gx >>> 16;

	            // Calculate high and low result of squaring
	            var gh = ((((ga * ga) >>> 17) + ga * gb) >>> 15) + gb * gb;
	            var gl = (((gx & 0xffff0000) * gx) | 0) + (((gx & 0x0000ffff) * gx) | 0);

	            // High XOR low
	            G[i] = gh ^ gl;
	        }

	        // Calculate new state values
	        X[0] = (G[0] + ((G[7] << 16) | (G[7] >>> 16)) + ((G[6] << 16) | (G[6] >>> 16))) | 0;
	        X[1] = (G[1] + ((G[0] << 8)  | (G[0] >>> 24)) + G[7]) | 0;
	        X[2] = (G[2] + ((G[1] << 16) | (G[1] >>> 16)) + ((G[0] << 16) | (G[0] >>> 16))) | 0;
	        X[3] = (G[3] + ((G[2] << 8)  | (G[2] >>> 24)) + G[1]) | 0;
	        X[4] = (G[4] + ((G[3] << 16) | (G[3] >>> 16)) + ((G[2] << 16) | (G[2] >>> 16))) | 0;
	        X[5] = (G[5] + ((G[4] << 8)  | (G[4] >>> 24)) + G[3]) | 0;
	        X[6] = (G[6] + ((G[5] << 16) | (G[5] >>> 16)) + ((G[4] << 16) | (G[4] >>> 16))) | 0;
	        X[7] = (G[7] + ((G[6] << 8)  | (G[6] >>> 24)) + G[5]) | 0;
	    }

	    /**
	     * Shortcut functions to the cipher's object interface.
	     *
	     * @example
	     *
	     *     var ciphertext = CryptoJS.Rabbit.encrypt(message, key, cfg);
	     *     var plaintext  = CryptoJS.Rabbit.decrypt(ciphertext, key, cfg);
	     */
	    C.Rabbit = StreamCipher._createHelper(Rabbit);
	}());


	return CryptoJS.Rabbit;

}));

/***/ }),

/***/ "./js-sdk-legacy/node_modules/crypto-js/rc4.js":
/*!*****************************************************!*\
  !*** ./js-sdk-legacy/node_modules/crypto-js/rc4.js ***!
  \*****************************************************/
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory, undef) {
	if (true) {
		// CommonJS
		module.exports = exports = factory(__webpack_require__(/*! ./core */ "./js-sdk-legacy/node_modules/crypto-js/core.js"), __webpack_require__(/*! ./enc-base64 */ "./js-sdk-legacy/node_modules/crypto-js/enc-base64.js"), __webpack_require__(/*! ./md5 */ "./js-sdk-legacy/node_modules/crypto-js/md5.js"), __webpack_require__(/*! ./evpkdf */ "./js-sdk-legacy/node_modules/crypto-js/evpkdf.js"), __webpack_require__(/*! ./cipher-core */ "./js-sdk-legacy/node_modules/crypto-js/cipher-core.js"));
	}
	else // removed by dead control flow
{}
}(this, function (CryptoJS) {

	(function () {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var StreamCipher = C_lib.StreamCipher;
	    var C_algo = C.algo;

	    /**
	     * RC4 stream cipher algorithm.
	     */
	    var RC4 = C_algo.RC4 = StreamCipher.extend({
	        _doReset: function () {
	            // Shortcuts
	            var key = this._key;
	            var keyWords = key.words;
	            var keySigBytes = key.sigBytes;

	            // Init sbox
	            var S = this._S = [];
	            for (var i = 0; i < 256; i++) {
	                S[i] = i;
	            }

	            // Key setup
	            for (var i = 0, j = 0; i < 256; i++) {
	                var keyByteIndex = i % keySigBytes;
	                var keyByte = (keyWords[keyByteIndex >>> 2] >>> (24 - (keyByteIndex % 4) * 8)) & 0xff;

	                j = (j + S[i] + keyByte) % 256;

	                // Swap
	                var t = S[i];
	                S[i] = S[j];
	                S[j] = t;
	            }

	            // Counters
	            this._i = this._j = 0;
	        },

	        _doProcessBlock: function (M, offset) {
	            M[offset] ^= generateKeystreamWord.call(this);
	        },

	        keySize: 256/32,

	        ivSize: 0
	    });

	    function generateKeystreamWord() {
	        // Shortcuts
	        var S = this._S;
	        var i = this._i;
	        var j = this._j;

	        // Generate keystream word
	        var keystreamWord = 0;
	        for (var n = 0; n < 4; n++) {
	            i = (i + 1) % 256;
	            j = (j + S[i]) % 256;

	            // Swap
	            var t = S[i];
	            S[i] = S[j];
	            S[j] = t;

	            keystreamWord |= S[(S[i] + S[j]) % 256] << (24 - n * 8);
	        }

	        // Update counters
	        this._i = i;
	        this._j = j;

	        return keystreamWord;
	    }

	    /**
	     * Shortcut functions to the cipher's object interface.
	     *
	     * @example
	     *
	     *     var ciphertext = CryptoJS.RC4.encrypt(message, key, cfg);
	     *     var plaintext  = CryptoJS.RC4.decrypt(ciphertext, key, cfg);
	     */
	    C.RC4 = StreamCipher._createHelper(RC4);

	    /**
	     * Modified RC4 stream cipher algorithm.
	     */
	    var RC4Drop = C_algo.RC4Drop = RC4.extend({
	        /**
	         * Configuration options.
	         *
	         * @property {number} drop The number of keystream words to drop. Default 192
	         */
	        cfg: RC4.cfg.extend({
	            drop: 192
	        }),

	        _doReset: function () {
	            RC4._doReset.call(this);

	            // Drop
	            for (var i = this.cfg.drop; i > 0; i--) {
	                generateKeystreamWord.call(this);
	            }
	        }
	    });

	    /**
	     * Shortcut functions to the cipher's object interface.
	     *
	     * @example
	     *
	     *     var ciphertext = CryptoJS.RC4Drop.encrypt(message, key, cfg);
	     *     var plaintext  = CryptoJS.RC4Drop.decrypt(ciphertext, key, cfg);
	     */
	    C.RC4Drop = StreamCipher._createHelper(RC4Drop);
	}());


	return CryptoJS.RC4;

}));

/***/ }),

/***/ "./js-sdk-legacy/node_modules/crypto-js/ripemd160.js":
/*!***********************************************************!*\
  !*** ./js-sdk-legacy/node_modules/crypto-js/ripemd160.js ***!
  \***********************************************************/
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory) {
	if (true) {
		// CommonJS
		module.exports = exports = factory(__webpack_require__(/*! ./core */ "./js-sdk-legacy/node_modules/crypto-js/core.js"));
	}
	else // removed by dead control flow
{}
}(this, function (CryptoJS) {

	/** @preserve
	(c) 2012 by Cédric Mesnil. All rights reserved.

	Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

	    - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
	    - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	*/

	(function (Math) {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var WordArray = C_lib.WordArray;
	    var Hasher = C_lib.Hasher;
	    var C_algo = C.algo;

	    // Constants table
	    var _zl = WordArray.create([
	        0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15,
	        7,  4, 13,  1, 10,  6, 15,  3, 12,  0,  9,  5,  2, 14, 11,  8,
	        3, 10, 14,  4,  9, 15,  8,  1,  2,  7,  0,  6, 13, 11,  5, 12,
	        1,  9, 11, 10,  0,  8, 12,  4, 13,  3,  7, 15, 14,  5,  6,  2,
	        4,  0,  5,  9,  7, 12,  2, 10, 14,  1,  3,  8, 11,  6, 15, 13]);
	    var _zr = WordArray.create([
	        5, 14,  7,  0,  9,  2, 11,  4, 13,  6, 15,  8,  1, 10,  3, 12,
	        6, 11,  3,  7,  0, 13,  5, 10, 14, 15,  8, 12,  4,  9,  1,  2,
	        15,  5,  1,  3,  7, 14,  6,  9, 11,  8, 12,  2, 10,  0,  4, 13,
	        8,  6,  4,  1,  3, 11, 15,  0,  5, 12,  2, 13,  9,  7, 10, 14,
	        12, 15, 10,  4,  1,  5,  8,  7,  6,  2, 13, 14,  0,  3,  9, 11]);
	    var _sl = WordArray.create([
	         11, 14, 15, 12,  5,  8,  7,  9, 11, 13, 14, 15,  6,  7,  9,  8,
	        7, 6,   8, 13, 11,  9,  7, 15,  7, 12, 15,  9, 11,  7, 13, 12,
	        11, 13,  6,  7, 14,  9, 13, 15, 14,  8, 13,  6,  5, 12,  7,  5,
	          11, 12, 14, 15, 14, 15,  9,  8,  9, 14,  5,  6,  8,  6,  5, 12,
	        9, 15,  5, 11,  6,  8, 13, 12,  5, 12, 13, 14, 11,  8,  5,  6 ]);
	    var _sr = WordArray.create([
	        8,  9,  9, 11, 13, 15, 15,  5,  7,  7,  8, 11, 14, 14, 12,  6,
	        9, 13, 15,  7, 12,  8,  9, 11,  7,  7, 12,  7,  6, 15, 13, 11,
	        9,  7, 15, 11,  8,  6,  6, 14, 12, 13,  5, 14, 13, 13,  7,  5,
	        15,  5,  8, 11, 14, 14,  6, 14,  6,  9, 12,  9, 12,  5, 15,  8,
	        8,  5, 12,  9, 12,  5, 14,  6,  8, 13,  6,  5, 15, 13, 11, 11 ]);

	    var _hl =  WordArray.create([ 0x00000000, 0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC, 0xA953FD4E]);
	    var _hr =  WordArray.create([ 0x50A28BE6, 0x5C4DD124, 0x6D703EF3, 0x7A6D76E9, 0x00000000]);

	    /**
	     * RIPEMD160 hash algorithm.
	     */
	    var RIPEMD160 = C_algo.RIPEMD160 = Hasher.extend({
	        _doReset: function () {
	            this._hash  = WordArray.create([0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0]);
	        },

	        _doProcessBlock: function (M, offset) {

	            // Swap endian
	            for (var i = 0; i < 16; i++) {
	                // Shortcuts
	                var offset_i = offset + i;
	                var M_offset_i = M[offset_i];

	                // Swap
	                M[offset_i] = (
	                    (((M_offset_i << 8)  | (M_offset_i >>> 24)) & 0x00ff00ff) |
	                    (((M_offset_i << 24) | (M_offset_i >>> 8))  & 0xff00ff00)
	                );
	            }
	            // Shortcut
	            var H  = this._hash.words;
	            var hl = _hl.words;
	            var hr = _hr.words;
	            var zl = _zl.words;
	            var zr = _zr.words;
	            var sl = _sl.words;
	            var sr = _sr.words;

	            // Working variables
	            var al, bl, cl, dl, el;
	            var ar, br, cr, dr, er;

	            ar = al = H[0];
	            br = bl = H[1];
	            cr = cl = H[2];
	            dr = dl = H[3];
	            er = el = H[4];
	            // Computation
	            var t;
	            for (var i = 0; i < 80; i += 1) {
	                t = (al +  M[offset+zl[i]])|0;
	                if (i<16){
		            t +=  f1(bl,cl,dl) + hl[0];
	                } else if (i<32) {
		            t +=  f2(bl,cl,dl) + hl[1];
	                } else if (i<48) {
		            t +=  f3(bl,cl,dl) + hl[2];
	                } else if (i<64) {
		            t +=  f4(bl,cl,dl) + hl[3];
	                } else {// if (i<80) {
		            t +=  f5(bl,cl,dl) + hl[4];
	                }
	                t = t|0;
	                t =  rotl(t,sl[i]);
	                t = (t+el)|0;
	                al = el;
	                el = dl;
	                dl = rotl(cl, 10);
	                cl = bl;
	                bl = t;

	                t = (ar + M[offset+zr[i]])|0;
	                if (i<16){
		            t +=  f5(br,cr,dr) + hr[0];
	                } else if (i<32) {
		            t +=  f4(br,cr,dr) + hr[1];
	                } else if (i<48) {
		            t +=  f3(br,cr,dr) + hr[2];
	                } else if (i<64) {
		            t +=  f2(br,cr,dr) + hr[3];
	                } else {// if (i<80) {
		            t +=  f1(br,cr,dr) + hr[4];
	                }
	                t = t|0;
	                t =  rotl(t,sr[i]) ;
	                t = (t+er)|0;
	                ar = er;
	                er = dr;
	                dr = rotl(cr, 10);
	                cr = br;
	                br = t;
	            }
	            // Intermediate hash value
	            t    = (H[1] + cl + dr)|0;
	            H[1] = (H[2] + dl + er)|0;
	            H[2] = (H[3] + el + ar)|0;
	            H[3] = (H[4] + al + br)|0;
	            H[4] = (H[0] + bl + cr)|0;
	            H[0] =  t;
	        },

	        _doFinalize: function () {
	            // Shortcuts
	            var data = this._data;
	            var dataWords = data.words;

	            var nBitsTotal = this._nDataBytes * 8;
	            var nBitsLeft = data.sigBytes * 8;

	            // Add padding
	            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
	            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = (
	                (((nBitsTotal << 8)  | (nBitsTotal >>> 24)) & 0x00ff00ff) |
	                (((nBitsTotal << 24) | (nBitsTotal >>> 8))  & 0xff00ff00)
	            );
	            data.sigBytes = (dataWords.length + 1) * 4;

	            // Hash final blocks
	            this._process();

	            // Shortcuts
	            var hash = this._hash;
	            var H = hash.words;

	            // Swap endian
	            for (var i = 0; i < 5; i++) {
	                // Shortcut
	                var H_i = H[i];

	                // Swap
	                H[i] = (((H_i << 8)  | (H_i >>> 24)) & 0x00ff00ff) |
	                       (((H_i << 24) | (H_i >>> 8))  & 0xff00ff00);
	            }

	            // Return final computed hash
	            return hash;
	        },

	        clone: function () {
	            var clone = Hasher.clone.call(this);
	            clone._hash = this._hash.clone();

	            return clone;
	        }
	    });


	    function f1(x, y, z) {
	        return ((x) ^ (y) ^ (z));

	    }

	    function f2(x, y, z) {
	        return (((x)&(y)) | ((~x)&(z)));
	    }

	    function f3(x, y, z) {
	        return (((x) | (~(y))) ^ (z));
	    }

	    function f4(x, y, z) {
	        return (((x) & (z)) | ((y)&(~(z))));
	    }

	    function f5(x, y, z) {
	        return ((x) ^ ((y) |(~(z))));

	    }

	    function rotl(x,n) {
	        return (x<<n) | (x>>>(32-n));
	    }


	    /**
	     * Shortcut function to the hasher's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     *
	     * @return {WordArray} The hash.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hash = CryptoJS.RIPEMD160('message');
	     *     var hash = CryptoJS.RIPEMD160(wordArray);
	     */
	    C.RIPEMD160 = Hasher._createHelper(RIPEMD160);

	    /**
	     * Shortcut function to the HMAC's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     * @param {WordArray|string} key The secret key.
	     *
	     * @return {WordArray} The HMAC.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hmac = CryptoJS.HmacRIPEMD160(message, key);
	     */
	    C.HmacRIPEMD160 = Hasher._createHmacHelper(RIPEMD160);
	}(Math));


	return CryptoJS.RIPEMD160;

}));

/***/ }),

/***/ "./js-sdk-legacy/node_modules/crypto-js/sha1.js":
/*!******************************************************!*\
  !*** ./js-sdk-legacy/node_modules/crypto-js/sha1.js ***!
  \******************************************************/
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory) {
	if (true) {
		// CommonJS
		module.exports = exports = factory(__webpack_require__(/*! ./core */ "./js-sdk-legacy/node_modules/crypto-js/core.js"));
	}
	else // removed by dead control flow
{}
}(this, function (CryptoJS) {

	(function () {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var WordArray = C_lib.WordArray;
	    var Hasher = C_lib.Hasher;
	    var C_algo = C.algo;

	    // Reusable object
	    var W = [];

	    /**
	     * SHA-1 hash algorithm.
	     */
	    var SHA1 = C_algo.SHA1 = Hasher.extend({
	        _doReset: function () {
	            this._hash = new WordArray.init([
	                0x67452301, 0xefcdab89,
	                0x98badcfe, 0x10325476,
	                0xc3d2e1f0
	            ]);
	        },

	        _doProcessBlock: function (M, offset) {
	            // Shortcut
	            var H = this._hash.words;

	            // Working variables
	            var a = H[0];
	            var b = H[1];
	            var c = H[2];
	            var d = H[3];
	            var e = H[4];

	            // Computation
	            for (var i = 0; i < 80; i++) {
	                if (i < 16) {
	                    W[i] = M[offset + i] | 0;
	                } else {
	                    var n = W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16];
	                    W[i] = (n << 1) | (n >>> 31);
	                }

	                var t = ((a << 5) | (a >>> 27)) + e + W[i];
	                if (i < 20) {
	                    t += ((b & c) | (~b & d)) + 0x5a827999;
	                } else if (i < 40) {
	                    t += (b ^ c ^ d) + 0x6ed9eba1;
	                } else if (i < 60) {
	                    t += ((b & c) | (b & d) | (c & d)) - 0x70e44324;
	                } else /* if (i < 80) */ {
	                    t += (b ^ c ^ d) - 0x359d3e2a;
	                }

	                e = d;
	                d = c;
	                c = (b << 30) | (b >>> 2);
	                b = a;
	                a = t;
	            }

	            // Intermediate hash value
	            H[0] = (H[0] + a) | 0;
	            H[1] = (H[1] + b) | 0;
	            H[2] = (H[2] + c) | 0;
	            H[3] = (H[3] + d) | 0;
	            H[4] = (H[4] + e) | 0;
	        },

	        _doFinalize: function () {
	            // Shortcuts
	            var data = this._data;
	            var dataWords = data.words;

	            var nBitsTotal = this._nDataBytes * 8;
	            var nBitsLeft = data.sigBytes * 8;

	            // Add padding
	            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
	            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = Math.floor(nBitsTotal / 0x100000000);
	            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = nBitsTotal;
	            data.sigBytes = dataWords.length * 4;

	            // Hash final blocks
	            this._process();

	            // Return final computed hash
	            return this._hash;
	        },

	        clone: function () {
	            var clone = Hasher.clone.call(this);
	            clone._hash = this._hash.clone();

	            return clone;
	        }
	    });

	    /**
	     * Shortcut function to the hasher's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     *
	     * @return {WordArray} The hash.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hash = CryptoJS.SHA1('message');
	     *     var hash = CryptoJS.SHA1(wordArray);
	     */
	    C.SHA1 = Hasher._createHelper(SHA1);

	    /**
	     * Shortcut function to the HMAC's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     * @param {WordArray|string} key The secret key.
	     *
	     * @return {WordArray} The HMAC.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hmac = CryptoJS.HmacSHA1(message, key);
	     */
	    C.HmacSHA1 = Hasher._createHmacHelper(SHA1);
	}());


	return CryptoJS.SHA1;

}));

/***/ }),

/***/ "./js-sdk-legacy/node_modules/crypto-js/sha224.js":
/*!********************************************************!*\
  !*** ./js-sdk-legacy/node_modules/crypto-js/sha224.js ***!
  \********************************************************/
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory, undef) {
	if (true) {
		// CommonJS
		module.exports = exports = factory(__webpack_require__(/*! ./core */ "./js-sdk-legacy/node_modules/crypto-js/core.js"), __webpack_require__(/*! ./sha256 */ "./js-sdk-legacy/node_modules/crypto-js/sha256.js"));
	}
	else // removed by dead control flow
{}
}(this, function (CryptoJS) {

	(function () {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var WordArray = C_lib.WordArray;
	    var C_algo = C.algo;
	    var SHA256 = C_algo.SHA256;

	    /**
	     * SHA-224 hash algorithm.
	     */
	    var SHA224 = C_algo.SHA224 = SHA256.extend({
	        _doReset: function () {
	            this._hash = new WordArray.init([
	                0xc1059ed8, 0x367cd507, 0x3070dd17, 0xf70e5939,
	                0xffc00b31, 0x68581511, 0x64f98fa7, 0xbefa4fa4
	            ]);
	        },

	        _doFinalize: function () {
	            var hash = SHA256._doFinalize.call(this);

	            hash.sigBytes -= 4;

	            return hash;
	        }
	    });

	    /**
	     * Shortcut function to the hasher's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     *
	     * @return {WordArray} The hash.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hash = CryptoJS.SHA224('message');
	     *     var hash = CryptoJS.SHA224(wordArray);
	     */
	    C.SHA224 = SHA256._createHelper(SHA224);

	    /**
	     * Shortcut function to the HMAC's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     * @param {WordArray|string} key The secret key.
	     *
	     * @return {WordArray} The HMAC.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hmac = CryptoJS.HmacSHA224(message, key);
	     */
	    C.HmacSHA224 = SHA256._createHmacHelper(SHA224);
	}());


	return CryptoJS.SHA224;

}));

/***/ }),

/***/ "./js-sdk-legacy/node_modules/crypto-js/sha256.js":
/*!********************************************************!*\
  !*** ./js-sdk-legacy/node_modules/crypto-js/sha256.js ***!
  \********************************************************/
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory) {
	if (true) {
		// CommonJS
		module.exports = exports = factory(__webpack_require__(/*! ./core */ "./js-sdk-legacy/node_modules/crypto-js/core.js"));
	}
	else // removed by dead control flow
{}
}(this, function (CryptoJS) {

	(function (Math) {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var WordArray = C_lib.WordArray;
	    var Hasher = C_lib.Hasher;
	    var C_algo = C.algo;

	    // Initialization and round constants tables
	    var H = [];
	    var K = [];

	    // Compute constants
	    (function () {
	        function isPrime(n) {
	            var sqrtN = Math.sqrt(n);
	            for (var factor = 2; factor <= sqrtN; factor++) {
	                if (!(n % factor)) {
	                    return false;
	                }
	            }

	            return true;
	        }

	        function getFractionalBits(n) {
	            return ((n - (n | 0)) * 0x100000000) | 0;
	        }

	        var n = 2;
	        var nPrime = 0;
	        while (nPrime < 64) {
	            if (isPrime(n)) {
	                if (nPrime < 8) {
	                    H[nPrime] = getFractionalBits(Math.pow(n, 1 / 2));
	                }
	                K[nPrime] = getFractionalBits(Math.pow(n, 1 / 3));

	                nPrime++;
	            }

	            n++;
	        }
	    }());

	    // Reusable object
	    var W = [];

	    /**
	     * SHA-256 hash algorithm.
	     */
	    var SHA256 = C_algo.SHA256 = Hasher.extend({
	        _doReset: function () {
	            this._hash = new WordArray.init(H.slice(0));
	        },

	        _doProcessBlock: function (M, offset) {
	            // Shortcut
	            var H = this._hash.words;

	            // Working variables
	            var a = H[0];
	            var b = H[1];
	            var c = H[2];
	            var d = H[3];
	            var e = H[4];
	            var f = H[5];
	            var g = H[6];
	            var h = H[7];

	            // Computation
	            for (var i = 0; i < 64; i++) {
	                if (i < 16) {
	                    W[i] = M[offset + i] | 0;
	                } else {
	                    var gamma0x = W[i - 15];
	                    var gamma0  = ((gamma0x << 25) | (gamma0x >>> 7))  ^
	                                  ((gamma0x << 14) | (gamma0x >>> 18)) ^
	                                   (gamma0x >>> 3);

	                    var gamma1x = W[i - 2];
	                    var gamma1  = ((gamma1x << 15) | (gamma1x >>> 17)) ^
	                                  ((gamma1x << 13) | (gamma1x >>> 19)) ^
	                                   (gamma1x >>> 10);

	                    W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16];
	                }

	                var ch  = (e & f) ^ (~e & g);
	                var maj = (a & b) ^ (a & c) ^ (b & c);

	                var sigma0 = ((a << 30) | (a >>> 2)) ^ ((a << 19) | (a >>> 13)) ^ ((a << 10) | (a >>> 22));
	                var sigma1 = ((e << 26) | (e >>> 6)) ^ ((e << 21) | (e >>> 11)) ^ ((e << 7)  | (e >>> 25));

	                var t1 = h + sigma1 + ch + K[i] + W[i];
	                var t2 = sigma0 + maj;

	                h = g;
	                g = f;
	                f = e;
	                e = (d + t1) | 0;
	                d = c;
	                c = b;
	                b = a;
	                a = (t1 + t2) | 0;
	            }

	            // Intermediate hash value
	            H[0] = (H[0] + a) | 0;
	            H[1] = (H[1] + b) | 0;
	            H[2] = (H[2] + c) | 0;
	            H[3] = (H[3] + d) | 0;
	            H[4] = (H[4] + e) | 0;
	            H[5] = (H[5] + f) | 0;
	            H[6] = (H[6] + g) | 0;
	            H[7] = (H[7] + h) | 0;
	        },

	        _doFinalize: function () {
	            // Shortcuts
	            var data = this._data;
	            var dataWords = data.words;

	            var nBitsTotal = this._nDataBytes * 8;
	            var nBitsLeft = data.sigBytes * 8;

	            // Add padding
	            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
	            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = Math.floor(nBitsTotal / 0x100000000);
	            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = nBitsTotal;
	            data.sigBytes = dataWords.length * 4;

	            // Hash final blocks
	            this._process();

	            // Return final computed hash
	            return this._hash;
	        },

	        clone: function () {
	            var clone = Hasher.clone.call(this);
	            clone._hash = this._hash.clone();

	            return clone;
	        }
	    });

	    /**
	     * Shortcut function to the hasher's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     *
	     * @return {WordArray} The hash.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hash = CryptoJS.SHA256('message');
	     *     var hash = CryptoJS.SHA256(wordArray);
	     */
	    C.SHA256 = Hasher._createHelper(SHA256);

	    /**
	     * Shortcut function to the HMAC's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     * @param {WordArray|string} key The secret key.
	     *
	     * @return {WordArray} The HMAC.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hmac = CryptoJS.HmacSHA256(message, key);
	     */
	    C.HmacSHA256 = Hasher._createHmacHelper(SHA256);
	}(Math));


	return CryptoJS.SHA256;

}));

/***/ }),

/***/ "./js-sdk-legacy/node_modules/crypto-js/sha3.js":
/*!******************************************************!*\
  !*** ./js-sdk-legacy/node_modules/crypto-js/sha3.js ***!
  \******************************************************/
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory, undef) {
	if (true) {
		// CommonJS
		module.exports = exports = factory(__webpack_require__(/*! ./core */ "./js-sdk-legacy/node_modules/crypto-js/core.js"), __webpack_require__(/*! ./x64-core */ "./js-sdk-legacy/node_modules/crypto-js/x64-core.js"));
	}
	else // removed by dead control flow
{}
}(this, function (CryptoJS) {

	(function (Math) {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var WordArray = C_lib.WordArray;
	    var Hasher = C_lib.Hasher;
	    var C_x64 = C.x64;
	    var X64Word = C_x64.Word;
	    var C_algo = C.algo;

	    // Constants tables
	    var RHO_OFFSETS = [];
	    var PI_INDEXES  = [];
	    var ROUND_CONSTANTS = [];

	    // Compute Constants
	    (function () {
	        // Compute rho offset constants
	        var x = 1, y = 0;
	        for (var t = 0; t < 24; t++) {
	            RHO_OFFSETS[x + 5 * y] = ((t + 1) * (t + 2) / 2) % 64;

	            var newX = y % 5;
	            var newY = (2 * x + 3 * y) % 5;
	            x = newX;
	            y = newY;
	        }

	        // Compute pi index constants
	        for (var x = 0; x < 5; x++) {
	            for (var y = 0; y < 5; y++) {
	                PI_INDEXES[x + 5 * y] = y + ((2 * x + 3 * y) % 5) * 5;
	            }
	        }

	        // Compute round constants
	        var LFSR = 0x01;
	        for (var i = 0; i < 24; i++) {
	            var roundConstantMsw = 0;
	            var roundConstantLsw = 0;

	            for (var j = 0; j < 7; j++) {
	                if (LFSR & 0x01) {
	                    var bitPosition = (1 << j) - 1;
	                    if (bitPosition < 32) {
	                        roundConstantLsw ^= 1 << bitPosition;
	                    } else /* if (bitPosition >= 32) */ {
	                        roundConstantMsw ^= 1 << (bitPosition - 32);
	                    }
	                }

	                // Compute next LFSR
	                if (LFSR & 0x80) {
	                    // Primitive polynomial over GF(2): x^8 + x^6 + x^5 + x^4 + 1
	                    LFSR = (LFSR << 1) ^ 0x71;
	                } else {
	                    LFSR <<= 1;
	                }
	            }

	            ROUND_CONSTANTS[i] = X64Word.create(roundConstantMsw, roundConstantLsw);
	        }
	    }());

	    // Reusable objects for temporary values
	    var T = [];
	    (function () {
	        for (var i = 0; i < 25; i++) {
	            T[i] = X64Word.create();
	        }
	    }());

	    /**
	     * SHA-3 hash algorithm.
	     */
	    var SHA3 = C_algo.SHA3 = Hasher.extend({
	        /**
	         * Configuration options.
	         *
	         * @property {number} outputLength
	         *   The desired number of bits in the output hash.
	         *   Only values permitted are: 224, 256, 384, 512.
	         *   Default: 512
	         */
	        cfg: Hasher.cfg.extend({
	            outputLength: 512
	        }),

	        _doReset: function () {
	            var state = this._state = []
	            for (var i = 0; i < 25; i++) {
	                state[i] = new X64Word.init();
	            }

	            this.blockSize = (1600 - 2 * this.cfg.outputLength) / 32;
	        },

	        _doProcessBlock: function (M, offset) {
	            // Shortcuts
	            var state = this._state;
	            var nBlockSizeLanes = this.blockSize / 2;

	            // Absorb
	            for (var i = 0; i < nBlockSizeLanes; i++) {
	                // Shortcuts
	                var M2i  = M[offset + 2 * i];
	                var M2i1 = M[offset + 2 * i + 1];

	                // Swap endian
	                M2i = (
	                    (((M2i << 8)  | (M2i >>> 24)) & 0x00ff00ff) |
	                    (((M2i << 24) | (M2i >>> 8))  & 0xff00ff00)
	                );
	                M2i1 = (
	                    (((M2i1 << 8)  | (M2i1 >>> 24)) & 0x00ff00ff) |
	                    (((M2i1 << 24) | (M2i1 >>> 8))  & 0xff00ff00)
	                );

	                // Absorb message into state
	                var lane = state[i];
	                lane.high ^= M2i1;
	                lane.low  ^= M2i;
	            }

	            // Rounds
	            for (var round = 0; round < 24; round++) {
	                // Theta
	                for (var x = 0; x < 5; x++) {
	                    // Mix column lanes
	                    var tMsw = 0, tLsw = 0;
	                    for (var y = 0; y < 5; y++) {
	                        var lane = state[x + 5 * y];
	                        tMsw ^= lane.high;
	                        tLsw ^= lane.low;
	                    }

	                    // Temporary values
	                    var Tx = T[x];
	                    Tx.high = tMsw;
	                    Tx.low  = tLsw;
	                }
	                for (var x = 0; x < 5; x++) {
	                    // Shortcuts
	                    var Tx4 = T[(x + 4) % 5];
	                    var Tx1 = T[(x + 1) % 5];
	                    var Tx1Msw = Tx1.high;
	                    var Tx1Lsw = Tx1.low;

	                    // Mix surrounding columns
	                    var tMsw = Tx4.high ^ ((Tx1Msw << 1) | (Tx1Lsw >>> 31));
	                    var tLsw = Tx4.low  ^ ((Tx1Lsw << 1) | (Tx1Msw >>> 31));
	                    for (var y = 0; y < 5; y++) {
	                        var lane = state[x + 5 * y];
	                        lane.high ^= tMsw;
	                        lane.low  ^= tLsw;
	                    }
	                }

	                // Rho Pi
	                for (var laneIndex = 1; laneIndex < 25; laneIndex++) {
	                    var tMsw;
	                    var tLsw;

	                    // Shortcuts
	                    var lane = state[laneIndex];
	                    var laneMsw = lane.high;
	                    var laneLsw = lane.low;
	                    var rhoOffset = RHO_OFFSETS[laneIndex];

	                    // Rotate lanes
	                    if (rhoOffset < 32) {
	                        tMsw = (laneMsw << rhoOffset) | (laneLsw >>> (32 - rhoOffset));
	                        tLsw = (laneLsw << rhoOffset) | (laneMsw >>> (32 - rhoOffset));
	                    } else /* if (rhoOffset >= 32) */ {
	                        tMsw = (laneLsw << (rhoOffset - 32)) | (laneMsw >>> (64 - rhoOffset));
	                        tLsw = (laneMsw << (rhoOffset - 32)) | (laneLsw >>> (64 - rhoOffset));
	                    }

	                    // Transpose lanes
	                    var TPiLane = T[PI_INDEXES[laneIndex]];
	                    TPiLane.high = tMsw;
	                    TPiLane.low  = tLsw;
	                }

	                // Rho pi at x = y = 0
	                var T0 = T[0];
	                var state0 = state[0];
	                T0.high = state0.high;
	                T0.low  = state0.low;

	                // Chi
	                for (var x = 0; x < 5; x++) {
	                    for (var y = 0; y < 5; y++) {
	                        // Shortcuts
	                        var laneIndex = x + 5 * y;
	                        var lane = state[laneIndex];
	                        var TLane = T[laneIndex];
	                        var Tx1Lane = T[((x + 1) % 5) + 5 * y];
	                        var Tx2Lane = T[((x + 2) % 5) + 5 * y];

	                        // Mix rows
	                        lane.high = TLane.high ^ (~Tx1Lane.high & Tx2Lane.high);
	                        lane.low  = TLane.low  ^ (~Tx1Lane.low  & Tx2Lane.low);
	                    }
	                }

	                // Iota
	                var lane = state[0];
	                var roundConstant = ROUND_CONSTANTS[round];
	                lane.high ^= roundConstant.high;
	                lane.low  ^= roundConstant.low;
	            }
	        },

	        _doFinalize: function () {
	            // Shortcuts
	            var data = this._data;
	            var dataWords = data.words;
	            var nBitsTotal = this._nDataBytes * 8;
	            var nBitsLeft = data.sigBytes * 8;
	            var blockSizeBits = this.blockSize * 32;

	            // Add padding
	            dataWords[nBitsLeft >>> 5] |= 0x1 << (24 - nBitsLeft % 32);
	            dataWords[((Math.ceil((nBitsLeft + 1) / blockSizeBits) * blockSizeBits) >>> 5) - 1] |= 0x80;
	            data.sigBytes = dataWords.length * 4;

	            // Hash final blocks
	            this._process();

	            // Shortcuts
	            var state = this._state;
	            var outputLengthBytes = this.cfg.outputLength / 8;
	            var outputLengthLanes = outputLengthBytes / 8;

	            // Squeeze
	            var hashWords = [];
	            for (var i = 0; i < outputLengthLanes; i++) {
	                // Shortcuts
	                var lane = state[i];
	                var laneMsw = lane.high;
	                var laneLsw = lane.low;

	                // Swap endian
	                laneMsw = (
	                    (((laneMsw << 8)  | (laneMsw >>> 24)) & 0x00ff00ff) |
	                    (((laneMsw << 24) | (laneMsw >>> 8))  & 0xff00ff00)
	                );
	                laneLsw = (
	                    (((laneLsw << 8)  | (laneLsw >>> 24)) & 0x00ff00ff) |
	                    (((laneLsw << 24) | (laneLsw >>> 8))  & 0xff00ff00)
	                );

	                // Squeeze state to retrieve hash
	                hashWords.push(laneLsw);
	                hashWords.push(laneMsw);
	            }

	            // Return final computed hash
	            return new WordArray.init(hashWords, outputLengthBytes);
	        },

	        clone: function () {
	            var clone = Hasher.clone.call(this);

	            var state = clone._state = this._state.slice(0);
	            for (var i = 0; i < 25; i++) {
	                state[i] = state[i].clone();
	            }

	            return clone;
	        }
	    });

	    /**
	     * Shortcut function to the hasher's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     *
	     * @return {WordArray} The hash.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hash = CryptoJS.SHA3('message');
	     *     var hash = CryptoJS.SHA3(wordArray);
	     */
	    C.SHA3 = Hasher._createHelper(SHA3);

	    /**
	     * Shortcut function to the HMAC's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     * @param {WordArray|string} key The secret key.
	     *
	     * @return {WordArray} The HMAC.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hmac = CryptoJS.HmacSHA3(message, key);
	     */
	    C.HmacSHA3 = Hasher._createHmacHelper(SHA3);
	}(Math));


	return CryptoJS.SHA3;

}));

/***/ }),

/***/ "./js-sdk-legacy/node_modules/crypto-js/sha384.js":
/*!********************************************************!*\
  !*** ./js-sdk-legacy/node_modules/crypto-js/sha384.js ***!
  \********************************************************/
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory, undef) {
	if (true) {
		// CommonJS
		module.exports = exports = factory(__webpack_require__(/*! ./core */ "./js-sdk-legacy/node_modules/crypto-js/core.js"), __webpack_require__(/*! ./x64-core */ "./js-sdk-legacy/node_modules/crypto-js/x64-core.js"), __webpack_require__(/*! ./sha512 */ "./js-sdk-legacy/node_modules/crypto-js/sha512.js"));
	}
	else // removed by dead control flow
{}
}(this, function (CryptoJS) {

	(function () {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_x64 = C.x64;
	    var X64Word = C_x64.Word;
	    var X64WordArray = C_x64.WordArray;
	    var C_algo = C.algo;
	    var SHA512 = C_algo.SHA512;

	    /**
	     * SHA-384 hash algorithm.
	     */
	    var SHA384 = C_algo.SHA384 = SHA512.extend({
	        _doReset: function () {
	            this._hash = new X64WordArray.init([
	                new X64Word.init(0xcbbb9d5d, 0xc1059ed8), new X64Word.init(0x629a292a, 0x367cd507),
	                new X64Word.init(0x9159015a, 0x3070dd17), new X64Word.init(0x152fecd8, 0xf70e5939),
	                new X64Word.init(0x67332667, 0xffc00b31), new X64Word.init(0x8eb44a87, 0x68581511),
	                new X64Word.init(0xdb0c2e0d, 0x64f98fa7), new X64Word.init(0x47b5481d, 0xbefa4fa4)
	            ]);
	        },

	        _doFinalize: function () {
	            var hash = SHA512._doFinalize.call(this);

	            hash.sigBytes -= 16;

	            return hash;
	        }
	    });

	    /**
	     * Shortcut function to the hasher's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     *
	     * @return {WordArray} The hash.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hash = CryptoJS.SHA384('message');
	     *     var hash = CryptoJS.SHA384(wordArray);
	     */
	    C.SHA384 = SHA512._createHelper(SHA384);

	    /**
	     * Shortcut function to the HMAC's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     * @param {WordArray|string} key The secret key.
	     *
	     * @return {WordArray} The HMAC.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hmac = CryptoJS.HmacSHA384(message, key);
	     */
	    C.HmacSHA384 = SHA512._createHmacHelper(SHA384);
	}());


	return CryptoJS.SHA384;

}));

/***/ }),

/***/ "./js-sdk-legacy/node_modules/crypto-js/sha512.js":
/*!********************************************************!*\
  !*** ./js-sdk-legacy/node_modules/crypto-js/sha512.js ***!
  \********************************************************/
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory, undef) {
	if (true) {
		// CommonJS
		module.exports = exports = factory(__webpack_require__(/*! ./core */ "./js-sdk-legacy/node_modules/crypto-js/core.js"), __webpack_require__(/*! ./x64-core */ "./js-sdk-legacy/node_modules/crypto-js/x64-core.js"));
	}
	else // removed by dead control flow
{}
}(this, function (CryptoJS) {

	(function () {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var Hasher = C_lib.Hasher;
	    var C_x64 = C.x64;
	    var X64Word = C_x64.Word;
	    var X64WordArray = C_x64.WordArray;
	    var C_algo = C.algo;

	    function X64Word_create() {
	        return X64Word.create.apply(X64Word, arguments);
	    }

	    // Constants
	    var K = [
	        X64Word_create(0x428a2f98, 0xd728ae22), X64Word_create(0x71374491, 0x23ef65cd),
	        X64Word_create(0xb5c0fbcf, 0xec4d3b2f), X64Word_create(0xe9b5dba5, 0x8189dbbc),
	        X64Word_create(0x3956c25b, 0xf348b538), X64Word_create(0x59f111f1, 0xb605d019),
	        X64Word_create(0x923f82a4, 0xaf194f9b), X64Word_create(0xab1c5ed5, 0xda6d8118),
	        X64Word_create(0xd807aa98, 0xa3030242), X64Word_create(0x12835b01, 0x45706fbe),
	        X64Word_create(0x243185be, 0x4ee4b28c), X64Word_create(0x550c7dc3, 0xd5ffb4e2),
	        X64Word_create(0x72be5d74, 0xf27b896f), X64Word_create(0x80deb1fe, 0x3b1696b1),
	        X64Word_create(0x9bdc06a7, 0x25c71235), X64Word_create(0xc19bf174, 0xcf692694),
	        X64Word_create(0xe49b69c1, 0x9ef14ad2), X64Word_create(0xefbe4786, 0x384f25e3),
	        X64Word_create(0x0fc19dc6, 0x8b8cd5b5), X64Word_create(0x240ca1cc, 0x77ac9c65),
	        X64Word_create(0x2de92c6f, 0x592b0275), X64Word_create(0x4a7484aa, 0x6ea6e483),
	        X64Word_create(0x5cb0a9dc, 0xbd41fbd4), X64Word_create(0x76f988da, 0x831153b5),
	        X64Word_create(0x983e5152, 0xee66dfab), X64Word_create(0xa831c66d, 0x2db43210),
	        X64Word_create(0xb00327c8, 0x98fb213f), X64Word_create(0xbf597fc7, 0xbeef0ee4),
	        X64Word_create(0xc6e00bf3, 0x3da88fc2), X64Word_create(0xd5a79147, 0x930aa725),
	        X64Word_create(0x06ca6351, 0xe003826f), X64Word_create(0x14292967, 0x0a0e6e70),
	        X64Word_create(0x27b70a85, 0x46d22ffc), X64Word_create(0x2e1b2138, 0x5c26c926),
	        X64Word_create(0x4d2c6dfc, 0x5ac42aed), X64Word_create(0x53380d13, 0x9d95b3df),
	        X64Word_create(0x650a7354, 0x8baf63de), X64Word_create(0x766a0abb, 0x3c77b2a8),
	        X64Word_create(0x81c2c92e, 0x47edaee6), X64Word_create(0x92722c85, 0x1482353b),
	        X64Word_create(0xa2bfe8a1, 0x4cf10364), X64Word_create(0xa81a664b, 0xbc423001),
	        X64Word_create(0xc24b8b70, 0xd0f89791), X64Word_create(0xc76c51a3, 0x0654be30),
	        X64Word_create(0xd192e819, 0xd6ef5218), X64Word_create(0xd6990624, 0x5565a910),
	        X64Word_create(0xf40e3585, 0x5771202a), X64Word_create(0x106aa070, 0x32bbd1b8),
	        X64Word_create(0x19a4c116, 0xb8d2d0c8), X64Word_create(0x1e376c08, 0x5141ab53),
	        X64Word_create(0x2748774c, 0xdf8eeb99), X64Word_create(0x34b0bcb5, 0xe19b48a8),
	        X64Word_create(0x391c0cb3, 0xc5c95a63), X64Word_create(0x4ed8aa4a, 0xe3418acb),
	        X64Word_create(0x5b9cca4f, 0x7763e373), X64Word_create(0x682e6ff3, 0xd6b2b8a3),
	        X64Word_create(0x748f82ee, 0x5defb2fc), X64Word_create(0x78a5636f, 0x43172f60),
	        X64Word_create(0x84c87814, 0xa1f0ab72), X64Word_create(0x8cc70208, 0x1a6439ec),
	        X64Word_create(0x90befffa, 0x23631e28), X64Word_create(0xa4506ceb, 0xde82bde9),
	        X64Word_create(0xbef9a3f7, 0xb2c67915), X64Word_create(0xc67178f2, 0xe372532b),
	        X64Word_create(0xca273ece, 0xea26619c), X64Word_create(0xd186b8c7, 0x21c0c207),
	        X64Word_create(0xeada7dd6, 0xcde0eb1e), X64Word_create(0xf57d4f7f, 0xee6ed178),
	        X64Word_create(0x06f067aa, 0x72176fba), X64Word_create(0x0a637dc5, 0xa2c898a6),
	        X64Word_create(0x113f9804, 0xbef90dae), X64Word_create(0x1b710b35, 0x131c471b),
	        X64Word_create(0x28db77f5, 0x23047d84), X64Word_create(0x32caab7b, 0x40c72493),
	        X64Word_create(0x3c9ebe0a, 0x15c9bebc), X64Word_create(0x431d67c4, 0x9c100d4c),
	        X64Word_create(0x4cc5d4be, 0xcb3e42b6), X64Word_create(0x597f299c, 0xfc657e2a),
	        X64Word_create(0x5fcb6fab, 0x3ad6faec), X64Word_create(0x6c44198c, 0x4a475817)
	    ];

	    // Reusable objects
	    var W = [];
	    (function () {
	        for (var i = 0; i < 80; i++) {
	            W[i] = X64Word_create();
	        }
	    }());

	    /**
	     * SHA-512 hash algorithm.
	     */
	    var SHA512 = C_algo.SHA512 = Hasher.extend({
	        _doReset: function () {
	            this._hash = new X64WordArray.init([
	                new X64Word.init(0x6a09e667, 0xf3bcc908), new X64Word.init(0xbb67ae85, 0x84caa73b),
	                new X64Word.init(0x3c6ef372, 0xfe94f82b), new X64Word.init(0xa54ff53a, 0x5f1d36f1),
	                new X64Word.init(0x510e527f, 0xade682d1), new X64Word.init(0x9b05688c, 0x2b3e6c1f),
	                new X64Word.init(0x1f83d9ab, 0xfb41bd6b), new X64Word.init(0x5be0cd19, 0x137e2179)
	            ]);
	        },

	        _doProcessBlock: function (M, offset) {
	            // Shortcuts
	            var H = this._hash.words;

	            var H0 = H[0];
	            var H1 = H[1];
	            var H2 = H[2];
	            var H3 = H[3];
	            var H4 = H[4];
	            var H5 = H[5];
	            var H6 = H[6];
	            var H7 = H[7];

	            var H0h = H0.high;
	            var H0l = H0.low;
	            var H1h = H1.high;
	            var H1l = H1.low;
	            var H2h = H2.high;
	            var H2l = H2.low;
	            var H3h = H3.high;
	            var H3l = H3.low;
	            var H4h = H4.high;
	            var H4l = H4.low;
	            var H5h = H5.high;
	            var H5l = H5.low;
	            var H6h = H6.high;
	            var H6l = H6.low;
	            var H7h = H7.high;
	            var H7l = H7.low;

	            // Working variables
	            var ah = H0h;
	            var al = H0l;
	            var bh = H1h;
	            var bl = H1l;
	            var ch = H2h;
	            var cl = H2l;
	            var dh = H3h;
	            var dl = H3l;
	            var eh = H4h;
	            var el = H4l;
	            var fh = H5h;
	            var fl = H5l;
	            var gh = H6h;
	            var gl = H6l;
	            var hh = H7h;
	            var hl = H7l;

	            // Rounds
	            for (var i = 0; i < 80; i++) {
	                var Wil;
	                var Wih;

	                // Shortcut
	                var Wi = W[i];

	                // Extend message
	                if (i < 16) {
	                    Wih = Wi.high = M[offset + i * 2]     | 0;
	                    Wil = Wi.low  = M[offset + i * 2 + 1] | 0;
	                } else {
	                    // Gamma0
	                    var gamma0x  = W[i - 15];
	                    var gamma0xh = gamma0x.high;
	                    var gamma0xl = gamma0x.low;
	                    var gamma0h  = ((gamma0xh >>> 1) | (gamma0xl << 31)) ^ ((gamma0xh >>> 8) | (gamma0xl << 24)) ^ (gamma0xh >>> 7);
	                    var gamma0l  = ((gamma0xl >>> 1) | (gamma0xh << 31)) ^ ((gamma0xl >>> 8) | (gamma0xh << 24)) ^ ((gamma0xl >>> 7) | (gamma0xh << 25));

	                    // Gamma1
	                    var gamma1x  = W[i - 2];
	                    var gamma1xh = gamma1x.high;
	                    var gamma1xl = gamma1x.low;
	                    var gamma1h  = ((gamma1xh >>> 19) | (gamma1xl << 13)) ^ ((gamma1xh << 3) | (gamma1xl >>> 29)) ^ (gamma1xh >>> 6);
	                    var gamma1l  = ((gamma1xl >>> 19) | (gamma1xh << 13)) ^ ((gamma1xl << 3) | (gamma1xh >>> 29)) ^ ((gamma1xl >>> 6) | (gamma1xh << 26));

	                    // W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16]
	                    var Wi7  = W[i - 7];
	                    var Wi7h = Wi7.high;
	                    var Wi7l = Wi7.low;

	                    var Wi16  = W[i - 16];
	                    var Wi16h = Wi16.high;
	                    var Wi16l = Wi16.low;

	                    Wil = gamma0l + Wi7l;
	                    Wih = gamma0h + Wi7h + ((Wil >>> 0) < (gamma0l >>> 0) ? 1 : 0);
	                    Wil = Wil + gamma1l;
	                    Wih = Wih + gamma1h + ((Wil >>> 0) < (gamma1l >>> 0) ? 1 : 0);
	                    Wil = Wil + Wi16l;
	                    Wih = Wih + Wi16h + ((Wil >>> 0) < (Wi16l >>> 0) ? 1 : 0);

	                    Wi.high = Wih;
	                    Wi.low  = Wil;
	                }

	                var chh  = (eh & fh) ^ (~eh & gh);
	                var chl  = (el & fl) ^ (~el & gl);
	                var majh = (ah & bh) ^ (ah & ch) ^ (bh & ch);
	                var majl = (al & bl) ^ (al & cl) ^ (bl & cl);

	                var sigma0h = ((ah >>> 28) | (al << 4))  ^ ((ah << 30)  | (al >>> 2)) ^ ((ah << 25) | (al >>> 7));
	                var sigma0l = ((al >>> 28) | (ah << 4))  ^ ((al << 30)  | (ah >>> 2)) ^ ((al << 25) | (ah >>> 7));
	                var sigma1h = ((eh >>> 14) | (el << 18)) ^ ((eh >>> 18) | (el << 14)) ^ ((eh << 23) | (el >>> 9));
	                var sigma1l = ((el >>> 14) | (eh << 18)) ^ ((el >>> 18) | (eh << 14)) ^ ((el << 23) | (eh >>> 9));

	                // t1 = h + sigma1 + ch + K[i] + W[i]
	                var Ki  = K[i];
	                var Kih = Ki.high;
	                var Kil = Ki.low;

	                var t1l = hl + sigma1l;
	                var t1h = hh + sigma1h + ((t1l >>> 0) < (hl >>> 0) ? 1 : 0);
	                var t1l = t1l + chl;
	                var t1h = t1h + chh + ((t1l >>> 0) < (chl >>> 0) ? 1 : 0);
	                var t1l = t1l + Kil;
	                var t1h = t1h + Kih + ((t1l >>> 0) < (Kil >>> 0) ? 1 : 0);
	                var t1l = t1l + Wil;
	                var t1h = t1h + Wih + ((t1l >>> 0) < (Wil >>> 0) ? 1 : 0);

	                // t2 = sigma0 + maj
	                var t2l = sigma0l + majl;
	                var t2h = sigma0h + majh + ((t2l >>> 0) < (sigma0l >>> 0) ? 1 : 0);

	                // Update working variables
	                hh = gh;
	                hl = gl;
	                gh = fh;
	                gl = fl;
	                fh = eh;
	                fl = el;
	                el = (dl + t1l) | 0;
	                eh = (dh + t1h + ((el >>> 0) < (dl >>> 0) ? 1 : 0)) | 0;
	                dh = ch;
	                dl = cl;
	                ch = bh;
	                cl = bl;
	                bh = ah;
	                bl = al;
	                al = (t1l + t2l) | 0;
	                ah = (t1h + t2h + ((al >>> 0) < (t1l >>> 0) ? 1 : 0)) | 0;
	            }

	            // Intermediate hash value
	            H0l = H0.low  = (H0l + al);
	            H0.high = (H0h + ah + ((H0l >>> 0) < (al >>> 0) ? 1 : 0));
	            H1l = H1.low  = (H1l + bl);
	            H1.high = (H1h + bh + ((H1l >>> 0) < (bl >>> 0) ? 1 : 0));
	            H2l = H2.low  = (H2l + cl);
	            H2.high = (H2h + ch + ((H2l >>> 0) < (cl >>> 0) ? 1 : 0));
	            H3l = H3.low  = (H3l + dl);
	            H3.high = (H3h + dh + ((H3l >>> 0) < (dl >>> 0) ? 1 : 0));
	            H4l = H4.low  = (H4l + el);
	            H4.high = (H4h + eh + ((H4l >>> 0) < (el >>> 0) ? 1 : 0));
	            H5l = H5.low  = (H5l + fl);
	            H5.high = (H5h + fh + ((H5l >>> 0) < (fl >>> 0) ? 1 : 0));
	            H6l = H6.low  = (H6l + gl);
	            H6.high = (H6h + gh + ((H6l >>> 0) < (gl >>> 0) ? 1 : 0));
	            H7l = H7.low  = (H7l + hl);
	            H7.high = (H7h + hh + ((H7l >>> 0) < (hl >>> 0) ? 1 : 0));
	        },

	        _doFinalize: function () {
	            // Shortcuts
	            var data = this._data;
	            var dataWords = data.words;

	            var nBitsTotal = this._nDataBytes * 8;
	            var nBitsLeft = data.sigBytes * 8;

	            // Add padding
	            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
	            dataWords[(((nBitsLeft + 128) >>> 10) << 5) + 30] = Math.floor(nBitsTotal / 0x100000000);
	            dataWords[(((nBitsLeft + 128) >>> 10) << 5) + 31] = nBitsTotal;
	            data.sigBytes = dataWords.length * 4;

	            // Hash final blocks
	            this._process();

	            // Convert hash to 32-bit word array before returning
	            var hash = this._hash.toX32();

	            // Return final computed hash
	            return hash;
	        },

	        clone: function () {
	            var clone = Hasher.clone.call(this);
	            clone._hash = this._hash.clone();

	            return clone;
	        },

	        blockSize: 1024/32
	    });

	    /**
	     * Shortcut function to the hasher's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     *
	     * @return {WordArray} The hash.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hash = CryptoJS.SHA512('message');
	     *     var hash = CryptoJS.SHA512(wordArray);
	     */
	    C.SHA512 = Hasher._createHelper(SHA512);

	    /**
	     * Shortcut function to the HMAC's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     * @param {WordArray|string} key The secret key.
	     *
	     * @return {WordArray} The HMAC.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hmac = CryptoJS.HmacSHA512(message, key);
	     */
	    C.HmacSHA512 = Hasher._createHmacHelper(SHA512);
	}());


	return CryptoJS.SHA512;

}));

/***/ }),

/***/ "./js-sdk-legacy/node_modules/crypto-js/tripledes.js":
/*!***********************************************************!*\
  !*** ./js-sdk-legacy/node_modules/crypto-js/tripledes.js ***!
  \***********************************************************/
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory, undef) {
	if (true) {
		// CommonJS
		module.exports = exports = factory(__webpack_require__(/*! ./core */ "./js-sdk-legacy/node_modules/crypto-js/core.js"), __webpack_require__(/*! ./enc-base64 */ "./js-sdk-legacy/node_modules/crypto-js/enc-base64.js"), __webpack_require__(/*! ./md5 */ "./js-sdk-legacy/node_modules/crypto-js/md5.js"), __webpack_require__(/*! ./evpkdf */ "./js-sdk-legacy/node_modules/crypto-js/evpkdf.js"), __webpack_require__(/*! ./cipher-core */ "./js-sdk-legacy/node_modules/crypto-js/cipher-core.js"));
	}
	else // removed by dead control flow
{}
}(this, function (CryptoJS) {

	(function () {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var WordArray = C_lib.WordArray;
	    var BlockCipher = C_lib.BlockCipher;
	    var C_algo = C.algo;

	    // Permuted Choice 1 constants
	    var PC1 = [
	        57, 49, 41, 33, 25, 17, 9,  1,
	        58, 50, 42, 34, 26, 18, 10, 2,
	        59, 51, 43, 35, 27, 19, 11, 3,
	        60, 52, 44, 36, 63, 55, 47, 39,
	        31, 23, 15, 7,  62, 54, 46, 38,
	        30, 22, 14, 6,  61, 53, 45, 37,
	        29, 21, 13, 5,  28, 20, 12, 4
	    ];

	    // Permuted Choice 2 constants
	    var PC2 = [
	        14, 17, 11, 24, 1,  5,
	        3,  28, 15, 6,  21, 10,
	        23, 19, 12, 4,  26, 8,
	        16, 7,  27, 20, 13, 2,
	        41, 52, 31, 37, 47, 55,
	        30, 40, 51, 45, 33, 48,
	        44, 49, 39, 56, 34, 53,
	        46, 42, 50, 36, 29, 32
	    ];

	    // Cumulative bit shift constants
	    var BIT_SHIFTS = [1,  2,  4,  6,  8,  10, 12, 14, 15, 17, 19, 21, 23, 25, 27, 28];

	    // SBOXes and round permutation constants
	    var SBOX_P = [
	        {
	            0x0: 0x808200,
	            0x10000000: 0x8000,
	            0x20000000: 0x808002,
	            0x30000000: 0x2,
	            0x40000000: 0x200,
	            0x50000000: 0x808202,
	            0x60000000: 0x800202,
	            0x70000000: 0x800000,
	            0x80000000: 0x202,
	            0x90000000: 0x800200,
	            0xa0000000: 0x8200,
	            0xb0000000: 0x808000,
	            0xc0000000: 0x8002,
	            0xd0000000: 0x800002,
	            0xe0000000: 0x0,
	            0xf0000000: 0x8202,
	            0x8000000: 0x0,
	            0x18000000: 0x808202,
	            0x28000000: 0x8202,
	            0x38000000: 0x8000,
	            0x48000000: 0x808200,
	            0x58000000: 0x200,
	            0x68000000: 0x808002,
	            0x78000000: 0x2,
	            0x88000000: 0x800200,
	            0x98000000: 0x8200,
	            0xa8000000: 0x808000,
	            0xb8000000: 0x800202,
	            0xc8000000: 0x800002,
	            0xd8000000: 0x8002,
	            0xe8000000: 0x202,
	            0xf8000000: 0x800000,
	            0x1: 0x8000,
	            0x10000001: 0x2,
	            0x20000001: 0x808200,
	            0x30000001: 0x800000,
	            0x40000001: 0x808002,
	            0x50000001: 0x8200,
	            0x60000001: 0x200,
	            0x70000001: 0x800202,
	            0x80000001: 0x808202,
	            0x90000001: 0x808000,
	            0xa0000001: 0x800002,
	            0xb0000001: 0x8202,
	            0xc0000001: 0x202,
	            0xd0000001: 0x800200,
	            0xe0000001: 0x8002,
	            0xf0000001: 0x0,
	            0x8000001: 0x808202,
	            0x18000001: 0x808000,
	            0x28000001: 0x800000,
	            0x38000001: 0x200,
	            0x48000001: 0x8000,
	            0x58000001: 0x800002,
	            0x68000001: 0x2,
	            0x78000001: 0x8202,
	            0x88000001: 0x8002,
	            0x98000001: 0x800202,
	            0xa8000001: 0x202,
	            0xb8000001: 0x808200,
	            0xc8000001: 0x800200,
	            0xd8000001: 0x0,
	            0xe8000001: 0x8200,
	            0xf8000001: 0x808002
	        },
	        {
	            0x0: 0x40084010,
	            0x1000000: 0x4000,
	            0x2000000: 0x80000,
	            0x3000000: 0x40080010,
	            0x4000000: 0x40000010,
	            0x5000000: 0x40084000,
	            0x6000000: 0x40004000,
	            0x7000000: 0x10,
	            0x8000000: 0x84000,
	            0x9000000: 0x40004010,
	            0xa000000: 0x40000000,
	            0xb000000: 0x84010,
	            0xc000000: 0x80010,
	            0xd000000: 0x0,
	            0xe000000: 0x4010,
	            0xf000000: 0x40080000,
	            0x800000: 0x40004000,
	            0x1800000: 0x84010,
	            0x2800000: 0x10,
	            0x3800000: 0x40004010,
	            0x4800000: 0x40084010,
	            0x5800000: 0x40000000,
	            0x6800000: 0x80000,
	            0x7800000: 0x40080010,
	            0x8800000: 0x80010,
	            0x9800000: 0x0,
	            0xa800000: 0x4000,
	            0xb800000: 0x40080000,
	            0xc800000: 0x40000010,
	            0xd800000: 0x84000,
	            0xe800000: 0x40084000,
	            0xf800000: 0x4010,
	            0x10000000: 0x0,
	            0x11000000: 0x40080010,
	            0x12000000: 0x40004010,
	            0x13000000: 0x40084000,
	            0x14000000: 0x40080000,
	            0x15000000: 0x10,
	            0x16000000: 0x84010,
	            0x17000000: 0x4000,
	            0x18000000: 0x4010,
	            0x19000000: 0x80000,
	            0x1a000000: 0x80010,
	            0x1b000000: 0x40000010,
	            0x1c000000: 0x84000,
	            0x1d000000: 0x40004000,
	            0x1e000000: 0x40000000,
	            0x1f000000: 0x40084010,
	            0x10800000: 0x84010,
	            0x11800000: 0x80000,
	            0x12800000: 0x40080000,
	            0x13800000: 0x4000,
	            0x14800000: 0x40004000,
	            0x15800000: 0x40084010,
	            0x16800000: 0x10,
	            0x17800000: 0x40000000,
	            0x18800000: 0x40084000,
	            0x19800000: 0x40000010,
	            0x1a800000: 0x40004010,
	            0x1b800000: 0x80010,
	            0x1c800000: 0x0,
	            0x1d800000: 0x4010,
	            0x1e800000: 0x40080010,
	            0x1f800000: 0x84000
	        },
	        {
	            0x0: 0x104,
	            0x100000: 0x0,
	            0x200000: 0x4000100,
	            0x300000: 0x10104,
	            0x400000: 0x10004,
	            0x500000: 0x4000004,
	            0x600000: 0x4010104,
	            0x700000: 0x4010000,
	            0x800000: 0x4000000,
	            0x900000: 0x4010100,
	            0xa00000: 0x10100,
	            0xb00000: 0x4010004,
	            0xc00000: 0x4000104,
	            0xd00000: 0x10000,
	            0xe00000: 0x4,
	            0xf00000: 0x100,
	            0x80000: 0x4010100,
	            0x180000: 0x4010004,
	            0x280000: 0x0,
	            0x380000: 0x4000100,
	            0x480000: 0x4000004,
	            0x580000: 0x10000,
	            0x680000: 0x10004,
	            0x780000: 0x104,
	            0x880000: 0x4,
	            0x980000: 0x100,
	            0xa80000: 0x4010000,
	            0xb80000: 0x10104,
	            0xc80000: 0x10100,
	            0xd80000: 0x4000104,
	            0xe80000: 0x4010104,
	            0xf80000: 0x4000000,
	            0x1000000: 0x4010100,
	            0x1100000: 0x10004,
	            0x1200000: 0x10000,
	            0x1300000: 0x4000100,
	            0x1400000: 0x100,
	            0x1500000: 0x4010104,
	            0x1600000: 0x4000004,
	            0x1700000: 0x0,
	            0x1800000: 0x4000104,
	            0x1900000: 0x4000000,
	            0x1a00000: 0x4,
	            0x1b00000: 0x10100,
	            0x1c00000: 0x4010000,
	            0x1d00000: 0x104,
	            0x1e00000: 0x10104,
	            0x1f00000: 0x4010004,
	            0x1080000: 0x4000000,
	            0x1180000: 0x104,
	            0x1280000: 0x4010100,
	            0x1380000: 0x0,
	            0x1480000: 0x10004,
	            0x1580000: 0x4000100,
	            0x1680000: 0x100,
	            0x1780000: 0x4010004,
	            0x1880000: 0x10000,
	            0x1980000: 0x4010104,
	            0x1a80000: 0x10104,
	            0x1b80000: 0x4000004,
	            0x1c80000: 0x4000104,
	            0x1d80000: 0x4010000,
	            0x1e80000: 0x4,
	            0x1f80000: 0x10100
	        },
	        {
	            0x0: 0x80401000,
	            0x10000: 0x80001040,
	            0x20000: 0x401040,
	            0x30000: 0x80400000,
	            0x40000: 0x0,
	            0x50000: 0x401000,
	            0x60000: 0x80000040,
	            0x70000: 0x400040,
	            0x80000: 0x80000000,
	            0x90000: 0x400000,
	            0xa0000: 0x40,
	            0xb0000: 0x80001000,
	            0xc0000: 0x80400040,
	            0xd0000: 0x1040,
	            0xe0000: 0x1000,
	            0xf0000: 0x80401040,
	            0x8000: 0x80001040,
	            0x18000: 0x40,
	            0x28000: 0x80400040,
	            0x38000: 0x80001000,
	            0x48000: 0x401000,
	            0x58000: 0x80401040,
	            0x68000: 0x0,
	            0x78000: 0x80400000,
	            0x88000: 0x1000,
	            0x98000: 0x80401000,
	            0xa8000: 0x400000,
	            0xb8000: 0x1040,
	            0xc8000: 0x80000000,
	            0xd8000: 0x400040,
	            0xe8000: 0x401040,
	            0xf8000: 0x80000040,
	            0x100000: 0x400040,
	            0x110000: 0x401000,
	            0x120000: 0x80000040,
	            0x130000: 0x0,
	            0x140000: 0x1040,
	            0x150000: 0x80400040,
	            0x160000: 0x80401000,
	            0x170000: 0x80001040,
	            0x180000: 0x80401040,
	            0x190000: 0x80000000,
	            0x1a0000: 0x80400000,
	            0x1b0000: 0x401040,
	            0x1c0000: 0x80001000,
	            0x1d0000: 0x400000,
	            0x1e0000: 0x40,
	            0x1f0000: 0x1000,
	            0x108000: 0x80400000,
	            0x118000: 0x80401040,
	            0x128000: 0x0,
	            0x138000: 0x401000,
	            0x148000: 0x400040,
	            0x158000: 0x80000000,
	            0x168000: 0x80001040,
	            0x178000: 0x40,
	            0x188000: 0x80000040,
	            0x198000: 0x1000,
	            0x1a8000: 0x80001000,
	            0x1b8000: 0x80400040,
	            0x1c8000: 0x1040,
	            0x1d8000: 0x80401000,
	            0x1e8000: 0x400000,
	            0x1f8000: 0x401040
	        },
	        {
	            0x0: 0x80,
	            0x1000: 0x1040000,
	            0x2000: 0x40000,
	            0x3000: 0x20000000,
	            0x4000: 0x20040080,
	            0x5000: 0x1000080,
	            0x6000: 0x21000080,
	            0x7000: 0x40080,
	            0x8000: 0x1000000,
	            0x9000: 0x20040000,
	            0xa000: 0x20000080,
	            0xb000: 0x21040080,
	            0xc000: 0x21040000,
	            0xd000: 0x0,
	            0xe000: 0x1040080,
	            0xf000: 0x21000000,
	            0x800: 0x1040080,
	            0x1800: 0x21000080,
	            0x2800: 0x80,
	            0x3800: 0x1040000,
	            0x4800: 0x40000,
	            0x5800: 0x20040080,
	            0x6800: 0x21040000,
	            0x7800: 0x20000000,
	            0x8800: 0x20040000,
	            0x9800: 0x0,
	            0xa800: 0x21040080,
	            0xb800: 0x1000080,
	            0xc800: 0x20000080,
	            0xd800: 0x21000000,
	            0xe800: 0x1000000,
	            0xf800: 0x40080,
	            0x10000: 0x40000,
	            0x11000: 0x80,
	            0x12000: 0x20000000,
	            0x13000: 0x21000080,
	            0x14000: 0x1000080,
	            0x15000: 0x21040000,
	            0x16000: 0x20040080,
	            0x17000: 0x1000000,
	            0x18000: 0x21040080,
	            0x19000: 0x21000000,
	            0x1a000: 0x1040000,
	            0x1b000: 0x20040000,
	            0x1c000: 0x40080,
	            0x1d000: 0x20000080,
	            0x1e000: 0x0,
	            0x1f000: 0x1040080,
	            0x10800: 0x21000080,
	            0x11800: 0x1000000,
	            0x12800: 0x1040000,
	            0x13800: 0x20040080,
	            0x14800: 0x20000000,
	            0x15800: 0x1040080,
	            0x16800: 0x80,
	            0x17800: 0x21040000,
	            0x18800: 0x40080,
	            0x19800: 0x21040080,
	            0x1a800: 0x0,
	            0x1b800: 0x21000000,
	            0x1c800: 0x1000080,
	            0x1d800: 0x40000,
	            0x1e800: 0x20040000,
	            0x1f800: 0x20000080
	        },
	        {
	            0x0: 0x10000008,
	            0x100: 0x2000,
	            0x200: 0x10200000,
	            0x300: 0x10202008,
	            0x400: 0x10002000,
	            0x500: 0x200000,
	            0x600: 0x200008,
	            0x700: 0x10000000,
	            0x800: 0x0,
	            0x900: 0x10002008,
	            0xa00: 0x202000,
	            0xb00: 0x8,
	            0xc00: 0x10200008,
	            0xd00: 0x202008,
	            0xe00: 0x2008,
	            0xf00: 0x10202000,
	            0x80: 0x10200000,
	            0x180: 0x10202008,
	            0x280: 0x8,
	            0x380: 0x200000,
	            0x480: 0x202008,
	            0x580: 0x10000008,
	            0x680: 0x10002000,
	            0x780: 0x2008,
	            0x880: 0x200008,
	            0x980: 0x2000,
	            0xa80: 0x10002008,
	            0xb80: 0x10200008,
	            0xc80: 0x0,
	            0xd80: 0x10202000,
	            0xe80: 0x202000,
	            0xf80: 0x10000000,
	            0x1000: 0x10002000,
	            0x1100: 0x10200008,
	            0x1200: 0x10202008,
	            0x1300: 0x2008,
	            0x1400: 0x200000,
	            0x1500: 0x10000000,
	            0x1600: 0x10000008,
	            0x1700: 0x202000,
	            0x1800: 0x202008,
	            0x1900: 0x0,
	            0x1a00: 0x8,
	            0x1b00: 0x10200000,
	            0x1c00: 0x2000,
	            0x1d00: 0x10002008,
	            0x1e00: 0x10202000,
	            0x1f00: 0x200008,
	            0x1080: 0x8,
	            0x1180: 0x202000,
	            0x1280: 0x200000,
	            0x1380: 0x10000008,
	            0x1480: 0x10002000,
	            0x1580: 0x2008,
	            0x1680: 0x10202008,
	            0x1780: 0x10200000,
	            0x1880: 0x10202000,
	            0x1980: 0x10200008,
	            0x1a80: 0x2000,
	            0x1b80: 0x202008,
	            0x1c80: 0x200008,
	            0x1d80: 0x0,
	            0x1e80: 0x10000000,
	            0x1f80: 0x10002008
	        },
	        {
	            0x0: 0x100000,
	            0x10: 0x2000401,
	            0x20: 0x400,
	            0x30: 0x100401,
	            0x40: 0x2100401,
	            0x50: 0x0,
	            0x60: 0x1,
	            0x70: 0x2100001,
	            0x80: 0x2000400,
	            0x90: 0x100001,
	            0xa0: 0x2000001,
	            0xb0: 0x2100400,
	            0xc0: 0x2100000,
	            0xd0: 0x401,
	            0xe0: 0x100400,
	            0xf0: 0x2000000,
	            0x8: 0x2100001,
	            0x18: 0x0,
	            0x28: 0x2000401,
	            0x38: 0x2100400,
	            0x48: 0x100000,
	            0x58: 0x2000001,
	            0x68: 0x2000000,
	            0x78: 0x401,
	            0x88: 0x100401,
	            0x98: 0x2000400,
	            0xa8: 0x2100000,
	            0xb8: 0x100001,
	            0xc8: 0x400,
	            0xd8: 0x2100401,
	            0xe8: 0x1,
	            0xf8: 0x100400,
	            0x100: 0x2000000,
	            0x110: 0x100000,
	            0x120: 0x2000401,
	            0x130: 0x2100001,
	            0x140: 0x100001,
	            0x150: 0x2000400,
	            0x160: 0x2100400,
	            0x170: 0x100401,
	            0x180: 0x401,
	            0x190: 0x2100401,
	            0x1a0: 0x100400,
	            0x1b0: 0x1,
	            0x1c0: 0x0,
	            0x1d0: 0x2100000,
	            0x1e0: 0x2000001,
	            0x1f0: 0x400,
	            0x108: 0x100400,
	            0x118: 0x2000401,
	            0x128: 0x2100001,
	            0x138: 0x1,
	            0x148: 0x2000000,
	            0x158: 0x100000,
	            0x168: 0x401,
	            0x178: 0x2100400,
	            0x188: 0x2000001,
	            0x198: 0x2100000,
	            0x1a8: 0x0,
	            0x1b8: 0x2100401,
	            0x1c8: 0x100401,
	            0x1d8: 0x400,
	            0x1e8: 0x2000400,
	            0x1f8: 0x100001
	        },
	        {
	            0x0: 0x8000820,
	            0x1: 0x20000,
	            0x2: 0x8000000,
	            0x3: 0x20,
	            0x4: 0x20020,
	            0x5: 0x8020820,
	            0x6: 0x8020800,
	            0x7: 0x800,
	            0x8: 0x8020000,
	            0x9: 0x8000800,
	            0xa: 0x20800,
	            0xb: 0x8020020,
	            0xc: 0x820,
	            0xd: 0x0,
	            0xe: 0x8000020,
	            0xf: 0x20820,
	            0x80000000: 0x800,
	            0x80000001: 0x8020820,
	            0x80000002: 0x8000820,
	            0x80000003: 0x8000000,
	            0x80000004: 0x8020000,
	            0x80000005: 0x20800,
	            0x80000006: 0x20820,
	            0x80000007: 0x20,
	            0x80000008: 0x8000020,
	            0x80000009: 0x820,
	            0x8000000a: 0x20020,
	            0x8000000b: 0x8020800,
	            0x8000000c: 0x0,
	            0x8000000d: 0x8020020,
	            0x8000000e: 0x8000800,
	            0x8000000f: 0x20000,
	            0x10: 0x20820,
	            0x11: 0x8020800,
	            0x12: 0x20,
	            0x13: 0x800,
	            0x14: 0x8000800,
	            0x15: 0x8000020,
	            0x16: 0x8020020,
	            0x17: 0x20000,
	            0x18: 0x0,
	            0x19: 0x20020,
	            0x1a: 0x8020000,
	            0x1b: 0x8000820,
	            0x1c: 0x8020820,
	            0x1d: 0x20800,
	            0x1e: 0x820,
	            0x1f: 0x8000000,
	            0x80000010: 0x20000,
	            0x80000011: 0x800,
	            0x80000012: 0x8020020,
	            0x80000013: 0x20820,
	            0x80000014: 0x20,
	            0x80000015: 0x8020000,
	            0x80000016: 0x8000000,
	            0x80000017: 0x8000820,
	            0x80000018: 0x8020820,
	            0x80000019: 0x8000020,
	            0x8000001a: 0x8000800,
	            0x8000001b: 0x0,
	            0x8000001c: 0x20800,
	            0x8000001d: 0x820,
	            0x8000001e: 0x20020,
	            0x8000001f: 0x8020800
	        }
	    ];

	    // Masks that select the SBOX input
	    var SBOX_MASK = [
	        0xf8000001, 0x1f800000, 0x01f80000, 0x001f8000,
	        0x0001f800, 0x00001f80, 0x000001f8, 0x8000001f
	    ];

	    /**
	     * DES block cipher algorithm.
	     */
	    var DES = C_algo.DES = BlockCipher.extend({
	        _doReset: function () {
	            // Shortcuts
	            var key = this._key;
	            var keyWords = key.words;

	            // Select 56 bits according to PC1
	            var keyBits = [];
	            for (var i = 0; i < 56; i++) {
	                var keyBitPos = PC1[i] - 1;
	                keyBits[i] = (keyWords[keyBitPos >>> 5] >>> (31 - keyBitPos % 32)) & 1;
	            }

	            // Assemble 16 subkeys
	            var subKeys = this._subKeys = [];
	            for (var nSubKey = 0; nSubKey < 16; nSubKey++) {
	                // Create subkey
	                var subKey = subKeys[nSubKey] = [];

	                // Shortcut
	                var bitShift = BIT_SHIFTS[nSubKey];

	                // Select 48 bits according to PC2
	                for (var i = 0; i < 24; i++) {
	                    // Select from the left 28 key bits
	                    subKey[(i / 6) | 0] |= keyBits[((PC2[i] - 1) + bitShift) % 28] << (31 - i % 6);

	                    // Select from the right 28 key bits
	                    subKey[4 + ((i / 6) | 0)] |= keyBits[28 + (((PC2[i + 24] - 1) + bitShift) % 28)] << (31 - i % 6);
	                }

	                // Since each subkey is applied to an expanded 32-bit input,
	                // the subkey can be broken into 8 values scaled to 32-bits,
	                // which allows the key to be used without expansion
	                subKey[0] = (subKey[0] << 1) | (subKey[0] >>> 31);
	                for (var i = 1; i < 7; i++) {
	                    subKey[i] = subKey[i] >>> ((i - 1) * 4 + 3);
	                }
	                subKey[7] = (subKey[7] << 5) | (subKey[7] >>> 27);
	            }

	            // Compute inverse subkeys
	            var invSubKeys = this._invSubKeys = [];
	            for (var i = 0; i < 16; i++) {
	                invSubKeys[i] = subKeys[15 - i];
	            }
	        },

	        encryptBlock: function (M, offset) {
	            this._doCryptBlock(M, offset, this._subKeys);
	        },

	        decryptBlock: function (M, offset) {
	            this._doCryptBlock(M, offset, this._invSubKeys);
	        },

	        _doCryptBlock: function (M, offset, subKeys) {
	            // Get input
	            this._lBlock = M[offset];
	            this._rBlock = M[offset + 1];

	            // Initial permutation
	            exchangeLR.call(this, 4,  0x0f0f0f0f);
	            exchangeLR.call(this, 16, 0x0000ffff);
	            exchangeRL.call(this, 2,  0x33333333);
	            exchangeRL.call(this, 8,  0x00ff00ff);
	            exchangeLR.call(this, 1,  0x55555555);

	            // Rounds
	            for (var round = 0; round < 16; round++) {
	                // Shortcuts
	                var subKey = subKeys[round];
	                var lBlock = this._lBlock;
	                var rBlock = this._rBlock;

	                // Feistel function
	                var f = 0;
	                for (var i = 0; i < 8; i++) {
	                    f |= SBOX_P[i][((rBlock ^ subKey[i]) & SBOX_MASK[i]) >>> 0];
	                }
	                this._lBlock = rBlock;
	                this._rBlock = lBlock ^ f;
	            }

	            // Undo swap from last round
	            var t = this._lBlock;
	            this._lBlock = this._rBlock;
	            this._rBlock = t;

	            // Final permutation
	            exchangeLR.call(this, 1,  0x55555555);
	            exchangeRL.call(this, 8,  0x00ff00ff);
	            exchangeRL.call(this, 2,  0x33333333);
	            exchangeLR.call(this, 16, 0x0000ffff);
	            exchangeLR.call(this, 4,  0x0f0f0f0f);

	            // Set output
	            M[offset] = this._lBlock;
	            M[offset + 1] = this._rBlock;
	        },

	        keySize: 64/32,

	        ivSize: 64/32,

	        blockSize: 64/32
	    });

	    // Swap bits across the left and right words
	    function exchangeLR(offset, mask) {
	        var t = ((this._lBlock >>> offset) ^ this._rBlock) & mask;
	        this._rBlock ^= t;
	        this._lBlock ^= t << offset;
	    }

	    function exchangeRL(offset, mask) {
	        var t = ((this._rBlock >>> offset) ^ this._lBlock) & mask;
	        this._lBlock ^= t;
	        this._rBlock ^= t << offset;
	    }

	    /**
	     * Shortcut functions to the cipher's object interface.
	     *
	     * @example
	     *
	     *     var ciphertext = CryptoJS.DES.encrypt(message, key, cfg);
	     *     var plaintext  = CryptoJS.DES.decrypt(ciphertext, key, cfg);
	     */
	    C.DES = BlockCipher._createHelper(DES);

	    /**
	     * Triple-DES block cipher algorithm.
	     */
	    var TripleDES = C_algo.TripleDES = BlockCipher.extend({
	        _doReset: function () {
	            // Shortcuts
	            var key = this._key;
	            var keyWords = key.words;
	            // Make sure the key length is valid (64, 128 or >= 192 bit)
	            if (keyWords.length !== 2 && keyWords.length !== 4 && keyWords.length < 6) {
	                throw new Error('Invalid key length - 3DES requires the key length to be 64, 128, 192 or >192.');
	            }

	            // Extend the key according to the keying options defined in 3DES standard
	            var key1 = keyWords.slice(0, 2);
	            var key2 = keyWords.length < 4 ? keyWords.slice(0, 2) : keyWords.slice(2, 4);
	            var key3 = keyWords.length < 6 ? keyWords.slice(0, 2) : keyWords.slice(4, 6);

	            // Create DES instances
	            this._des1 = DES.createEncryptor(WordArray.create(key1));
	            this._des2 = DES.createEncryptor(WordArray.create(key2));
	            this._des3 = DES.createEncryptor(WordArray.create(key3));
	        },

	        encryptBlock: function (M, offset) {
	            this._des1.encryptBlock(M, offset);
	            this._des2.decryptBlock(M, offset);
	            this._des3.encryptBlock(M, offset);
	        },

	        decryptBlock: function (M, offset) {
	            this._des3.decryptBlock(M, offset);
	            this._des2.encryptBlock(M, offset);
	            this._des1.decryptBlock(M, offset);
	        },

	        keySize: 192/32,

	        ivSize: 64/32,

	        blockSize: 64/32
	    });

	    /**
	     * Shortcut functions to the cipher's object interface.
	     *
	     * @example
	     *
	     *     var ciphertext = CryptoJS.TripleDES.encrypt(message, key, cfg);
	     *     var plaintext  = CryptoJS.TripleDES.decrypt(ciphertext, key, cfg);
	     */
	    C.TripleDES = BlockCipher._createHelper(TripleDES);
	}());


	return CryptoJS.TripleDES;

}));

/***/ }),

/***/ "./js-sdk-legacy/node_modules/crypto-js/x64-core.js":
/*!**********************************************************!*\
  !*** ./js-sdk-legacy/node_modules/crypto-js/x64-core.js ***!
  \**********************************************************/
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory) {
	if (true) {
		// CommonJS
		module.exports = exports = factory(__webpack_require__(/*! ./core */ "./js-sdk-legacy/node_modules/crypto-js/core.js"));
	}
	else // removed by dead control flow
{}
}(this, function (CryptoJS) {

	(function (undefined) {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var Base = C_lib.Base;
	    var X32WordArray = C_lib.WordArray;

	    /**
	     * x64 namespace.
	     */
	    var C_x64 = C.x64 = {};

	    /**
	     * A 64-bit word.
	     */
	    var X64Word = C_x64.Word = Base.extend({
	        /**
	         * Initializes a newly created 64-bit word.
	         *
	         * @param {number} high The high 32 bits.
	         * @param {number} low The low 32 bits.
	         *
	         * @example
	         *
	         *     var x64Word = CryptoJS.x64.Word.create(0x00010203, 0x04050607);
	         */
	        init: function (high, low) {
	            this.high = high;
	            this.low = low;
	        }

	        /**
	         * Bitwise NOTs this word.
	         *
	         * @return {X64Word} A new x64-Word object after negating.
	         *
	         * @example
	         *
	         *     var negated = x64Word.not();
	         */
	        // not: function () {
	            // var high = ~this.high;
	            // var low = ~this.low;

	            // return X64Word.create(high, low);
	        // },

	        /**
	         * Bitwise ANDs this word with the passed word.
	         *
	         * @param {X64Word} word The x64-Word to AND with this word.
	         *
	         * @return {X64Word} A new x64-Word object after ANDing.
	         *
	         * @example
	         *
	         *     var anded = x64Word.and(anotherX64Word);
	         */
	        // and: function (word) {
	            // var high = this.high & word.high;
	            // var low = this.low & word.low;

	            // return X64Word.create(high, low);
	        // },

	        /**
	         * Bitwise ORs this word with the passed word.
	         *
	         * @param {X64Word} word The x64-Word to OR with this word.
	         *
	         * @return {X64Word} A new x64-Word object after ORing.
	         *
	         * @example
	         *
	         *     var ored = x64Word.or(anotherX64Word);
	         */
	        // or: function (word) {
	            // var high = this.high | word.high;
	            // var low = this.low | word.low;

	            // return X64Word.create(high, low);
	        // },

	        /**
	         * Bitwise XORs this word with the passed word.
	         *
	         * @param {X64Word} word The x64-Word to XOR with this word.
	         *
	         * @return {X64Word} A new x64-Word object after XORing.
	         *
	         * @example
	         *
	         *     var xored = x64Word.xor(anotherX64Word);
	         */
	        // xor: function (word) {
	            // var high = this.high ^ word.high;
	            // var low = this.low ^ word.low;

	            // return X64Word.create(high, low);
	        // },

	        /**
	         * Shifts this word n bits to the left.
	         *
	         * @param {number} n The number of bits to shift.
	         *
	         * @return {X64Word} A new x64-Word object after shifting.
	         *
	         * @example
	         *
	         *     var shifted = x64Word.shiftL(25);
	         */
	        // shiftL: function (n) {
	            // if (n < 32) {
	                // var high = (this.high << n) | (this.low >>> (32 - n));
	                // var low = this.low << n;
	            // } else {
	                // var high = this.low << (n - 32);
	                // var low = 0;
	            // }

	            // return X64Word.create(high, low);
	        // },

	        /**
	         * Shifts this word n bits to the right.
	         *
	         * @param {number} n The number of bits to shift.
	         *
	         * @return {X64Word} A new x64-Word object after shifting.
	         *
	         * @example
	         *
	         *     var shifted = x64Word.shiftR(7);
	         */
	        // shiftR: function (n) {
	            // if (n < 32) {
	                // var low = (this.low >>> n) | (this.high << (32 - n));
	                // var high = this.high >>> n;
	            // } else {
	                // var low = this.high >>> (n - 32);
	                // var high = 0;
	            // }

	            // return X64Word.create(high, low);
	        // },

	        /**
	         * Rotates this word n bits to the left.
	         *
	         * @param {number} n The number of bits to rotate.
	         *
	         * @return {X64Word} A new x64-Word object after rotating.
	         *
	         * @example
	         *
	         *     var rotated = x64Word.rotL(25);
	         */
	        // rotL: function (n) {
	            // return this.shiftL(n).or(this.shiftR(64 - n));
	        // },

	        /**
	         * Rotates this word n bits to the right.
	         *
	         * @param {number} n The number of bits to rotate.
	         *
	         * @return {X64Word} A new x64-Word object after rotating.
	         *
	         * @example
	         *
	         *     var rotated = x64Word.rotR(7);
	         */
	        // rotR: function (n) {
	            // return this.shiftR(n).or(this.shiftL(64 - n));
	        // },

	        /**
	         * Adds this word with the passed word.
	         *
	         * @param {X64Word} word The x64-Word to add with this word.
	         *
	         * @return {X64Word} A new x64-Word object after adding.
	         *
	         * @example
	         *
	         *     var added = x64Word.add(anotherX64Word);
	         */
	        // add: function (word) {
	            // var low = (this.low + word.low) | 0;
	            // var carry = (low >>> 0) < (this.low >>> 0) ? 1 : 0;
	            // var high = (this.high + word.high + carry) | 0;

	            // return X64Word.create(high, low);
	        // }
	    });

	    /**
	     * An array of 64-bit words.
	     *
	     * @property {Array} words The array of CryptoJS.x64.Word objects.
	     * @property {number} sigBytes The number of significant bytes in this word array.
	     */
	    var X64WordArray = C_x64.WordArray = Base.extend({
	        /**
	         * Initializes a newly created word array.
	         *
	         * @param {Array} words (Optional) An array of CryptoJS.x64.Word objects.
	         * @param {number} sigBytes (Optional) The number of significant bytes in the words.
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.x64.WordArray.create();
	         *
	         *     var wordArray = CryptoJS.x64.WordArray.create([
	         *         CryptoJS.x64.Word.create(0x00010203, 0x04050607),
	         *         CryptoJS.x64.Word.create(0x18191a1b, 0x1c1d1e1f)
	         *     ]);
	         *
	         *     var wordArray = CryptoJS.x64.WordArray.create([
	         *         CryptoJS.x64.Word.create(0x00010203, 0x04050607),
	         *         CryptoJS.x64.Word.create(0x18191a1b, 0x1c1d1e1f)
	         *     ], 10);
	         */
	        init: function (words, sigBytes) {
	            words = this.words = words || [];

	            if (sigBytes != undefined) {
	                this.sigBytes = sigBytes;
	            } else {
	                this.sigBytes = words.length * 8;
	            }
	        },

	        /**
	         * Converts this 64-bit word array to a 32-bit word array.
	         *
	         * @return {CryptoJS.lib.WordArray} This word array's data as a 32-bit word array.
	         *
	         * @example
	         *
	         *     var x32WordArray = x64WordArray.toX32();
	         */
	        toX32: function () {
	            // Shortcuts
	            var x64Words = this.words;
	            var x64WordsLength = x64Words.length;

	            // Convert
	            var x32Words = [];
	            for (var i = 0; i < x64WordsLength; i++) {
	                var x64Word = x64Words[i];
	                x32Words.push(x64Word.high);
	                x32Words.push(x64Word.low);
	            }

	            return X32WordArray.create(x32Words, this.sigBytes);
	        },

	        /**
	         * Creates a copy of this word array.
	         *
	         * @return {X64WordArray} The clone.
	         *
	         * @example
	         *
	         *     var clone = x64WordArray.clone();
	         */
	        clone: function () {
	            var clone = Base.clone.call(this);

	            // Clone "words" array
	            var words = clone.words = this.words.slice(0);

	            // Clone each X64Word object
	            var wordsLength = words.length;
	            for (var i = 0; i < wordsLength; i++) {
	                words[i] = words[i].clone();
	            }

	            return clone;
	        }
	    });
	}());


	return CryptoJS;

}));

/***/ }),

/***/ "./js-sdk-legacy/src/main/collectors/static/font/collection/v2/types/FontMigrationStage.js":
/*!*************************************************************************************************!*\
  !*** ./js-sdk-legacy/src/main/collectors/static/font/collection/v2/types/FontMigrationStage.js ***!
  \*************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/**
 * FontMigrationStage
 * 
 * Defines the different stages of font collection migration from V1 to V2.
 * Each stage represents a different phase in the migration process:
 * 
 * V1_ONLY (0): Only V1 collector is active
 * DUAL_COLLECTION_V1_PRIORITY (1): Both collectors active, V1 is primary
 * DUAL_COLLECTION_V2_PRIORITY (2): Both collectors active, V2 is primary
 * V2_ONLY (3): Only V2 collector is active
 */

var FontMigrationStage = {
  V1_ONLY: "0",
  DUAL_COLLECTION_V1_PRIORITY: "1",
  DUAL_COLLECTION_V2_PRIORITY: "2",
  V2_ONLY: "3",
  /**
   * Checks if a given stage is valid
   * @param {string} stage - The migration stage to validate
   * @returns {boolean} True if the stage is valid, false otherwise
   */
  isValid: function isValid(stage) {
    return Object.values(FontMigrationStage).includes(stage);
  },
  /**
   * Gets a description of what each stage represents
   * @param {string} stage - The migration stage to get description for
   * @returns {string} Description of the stage
   */
  getDescription: function getDescription(stage) {
    var descriptions = _defineProperty(_defineProperty(_defineProperty(_defineProperty({}, FontMigrationStage.V1_ONLY, "Only V1 collector is active"), FontMigrationStage.DUAL_COLLECTION_V1_PRIORITY, "Both collectors active, V1 is primary"), FontMigrationStage.DUAL_COLLECTION_V2_PRIORITY, "Both collectors active, V2 is primary"), FontMigrationStage.V2_ONLY, "Only V2 collector is active");
    return descriptions[stage] || "Unknown stage";
  }
};
/* harmony default export */ __webpack_exports__["default"] = (FontMigrationStage);

/***/ }),

/***/ "./js-sdk-legacy/src/main/common/polyfills/TextEncoderPolyfill.js":
/*!************************************************************************!*\
  !*** ./js-sdk-legacy/src/main/common/polyfills/TextEncoderPolyfill.js ***!
  \************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ apply; }
/* harmony export */ });
/**
 * This polyfill is needed for browsers that don't support TextEncoder
 * TextEncoder is used in the HashService file for hashing the body of the request
 * @param {Object} scope - the scope of the window
 */
function apply(scope) {
  if (typeof TextEncoder === 'undefined') {
    scope.TextEncoder = function TextEncoder() {};
    TextEncoder.prototype.encode = function (str) {
      var utf8 = [];
      for (var i = 0; i < str.length; i++) {
        var charcode = str.charCodeAt(i);
        if (charcode < 0x80) utf8.push(charcode);else if (charcode < 0x800) {
          utf8.push(0xc0 | charcode >> 6, 0x80 | charcode & 0x3f);
        } else if (charcode < 0xd800 || charcode >= 0xe000) {
          utf8.push(0xe0 | charcode >> 12, 0x80 | charcode >> 6 & 0x3f, 0x80 | charcode & 0x3f);
        }
        // surrogate pair
        else {
          i++;
          // UTF-16 encodes 0x10000-0x10FFFF by subtracting 0x10000 and splitting into two 16-bit characters
          charcode = 0x10000 + ((charcode & 0x3ff) << 10 | str.charCodeAt(i) & 0x3ff);
          utf8.push(0xf0 | charcode >> 18, 0x80 | charcode >> 12 & 0x3f, 0x80 | charcode >> 6 & 0x3f, 0x80 | charcode & 0x3f);
        }
      }
      return new Uint8Array(utf8);
    };
  }
}

/***/ }),

/***/ "./js-sdk-legacy/src/main/const/communication.js":
/*!*******************************************************!*\
  !*** ./js-sdk-legacy/src/main/const/communication.js ***!
  \*******************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   POST: function() { return /* binding */ POST; },
/* harmony export */   minifiedUrlV3Path: function() { return /* binding */ minifiedUrlV3Path; },
/* harmony export */   minifiedUrlV4Path: function() { return /* binding */ minifiedUrlV4Path; },
/* harmony export */   serverProtocolV3: function() { return /* binding */ serverProtocolV3; },
/* harmony export */   serverProtocolV4: function() { return /* binding */ serverProtocolV4; },
/* harmony export */   wupUrlV3Path: function() { return /* binding */ wupUrlV3Path; },
/* harmony export */   wupUrlV4Path: function() { return /* binding */ wupUrlV4Path; }
/* harmony export */ });
// wup url constants
var wupUrlV4Path = 'api/v4/wup';
var wupUrlV3Path = 'client/v3.1/web/wup';
var minifiedUrlV3Path = 'v3.1';
var minifiedUrlV4Path = 'v4';
var serverProtocolV3 = 3;
var serverProtocolV4 = 4;

// server request methods constants
var POST = 'POST';

/***/ }),

/***/ "./js-sdk-legacy/src/main/const/hashing.js":
/*!*************************************************!*\
  !*** ./js-sdk-legacy/src/main/const/hashing.js ***!
  \*************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   sha256Hash: function() { return /* binding */ sha256Hash; },
/* harmony export */   sha256HeaderName: function() { return /* binding */ sha256HeaderName; }
/* harmony export */ });
// sha256 hash constants for wup messages hashing
var sha256Hash = 'SHA-256';
var sha256HeaderName = 'X-h';

/***/ }),

/***/ "./js-sdk-legacy/src/main/contract/AgentType.js":
/*!******************************************************!*\
  !*** ./js-sdk-legacy/src/main/contract/AgentType.js ***!
  \******************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AgentType: function() { return /* binding */ AgentType; }
/* harmony export */ });
var AgentType = {
  PRIMARY: "primary",
  SECONDARY: "secondary"
};
Object.freeze(AgentType);

/***/ }),

/***/ "./js-sdk-legacy/src/main/core/configuration/ConfigurationFields.js":
/*!**************************************************************************!*\
  !*** ./js-sdk-legacy/src/main/core/configuration/ConfigurationFields.js ***!
  \**************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ConfigurationFields: function() { return /* binding */ ConfigurationFields; }
/* harmony export */ });
var ConfigurationFields = {
  resetSessionApiThreshold: 'resetSessionApiThreshold',
  dataWupDispatchRateSettings: 'dataWupDispatchRateSettings',
  logWupDispatchRateSettings: 'logWupDispatchRateSettings',
  logServerURL: 'logAddress',
  enableMinifiedLogUri: 'enableMinifiedLogUri',
  forceDynamicDataWupDispatchSettings: 'forceDynamicDataWupDispatchSettings',
  wupStatisticsLogIntervalMs: 'wupStatisticsLogIntervalMs',
  serverCommunicationSettings: 'serverCommunicationSettings',
  wupResponseTimeout: 'wupResponseTimeout',
  // Deprecated
  wupMessageRequestTimeout: 'wupMessageRequestTimeout',
  logMessageRequestTimeout: 'logMessageRequestTimeout',
  collectKeyRegionValue: 'collectKeyRegionValue',
  crossDomainsList: 'crossDomainsList',
  crossDomainsTimeout: 'crossDomainsTimeout',
  isMutationObserver: 'isMutationObserver',
  isEnabled: 'isEnabled',
  slaveChannelHandshakeTimeout: 'slaveChannelHandshakeTimeout',
  slaveAliveMessageInterval: 'slaveAliveMessageInterval',
  collectCustomElementAttribute: 'collectCustomElementAttribute',
  customElementAttribute: 'customElementAttribute',
  enableFramesProcessing: 'enableFramesProcessing',
  enableSameSiteNoneAndSecureCookies: 'enableSameSiteNoneAndSecureCookies',
  wupServerURL: 'wupServerURL',
  logAddress: 'logAddress',
  isCaptureKeyEvents: 'isCaptureKeyEvents',
  locationEventsTimeoutMsec: 'locationEventsTimeoutMsec',
  heartBeatMessageInterval: 'heartBeatMessageInterval',
  isMotionAroundTouchEnabled: 'isMotionAroundTouchEnabled',
  motionPaddingAroundTouchMSec: 'motionPaddingAroundTouchMSec',
  isMotionOnSessionStart: 'isMotionOnSessionStart',
  motionPaddingOnSessionStartMSec: 'motionPaddingOnSessionStartMSec',
  isVMDetection: 'isVMDetection',
  isScrollCollect: 'isScrollCollect',
  isContextPropsFeature: 'isContextPropsFeature',
  isCrossDomain: 'isCrossdomain',
  gyroEventsThreshold: 'gyroEventsThreshold',
  gyroEventsSamplePeriod: 'gyroEventsSamplePeriod',
  dataQPassWorkerInterval: 'dataQPassWorkerInterval',
  accelerometerEventsSamplePeriod: 'accelerometerEventsSamplePeriod',
  orientationEventsThreshold: 'orientationEventsThreshold',
  orientationEventsSamplePeriod: 'orientationEventsSamplePeriod',
  isAudioDetection: 'isAudioDetection',
  stateChangeEnabled: 'stateChangeEnabled',
  logLevel: 'logLevel',
  enableCustomElementsProcessing: 'enableCustomElementsProcessing',
  keyEventsMaskSpecialChars: 'keyEventsMaskSpecialChars',
  collectSelectElementBlurAndFocusEvents: 'collectSelectElementBlurAndFocusEvents',
  allowedUnmaskedValuesList: 'allowedUnmaskedValuesList',
  enableUnmaskedValues: 'enableUnmaskedValues',
  wupMessageNumToRetry: 'wupMessageNumToRetry',
  wupMessageRetryInterval: 'wupMessageRetryInterval',
  wupIncrementalGrowthBetweenFailures: 'wupIncrementalGrowthBetweenFailures',
  wupMaxIntervalBetweenFailures: 'wupMaxIntervalBetweenFailures',
  logMessageNumToRetry: 'logMessageNumToRetry',
  logMessageRetryInterval: 'logMessageRetryInterval',
  logIncrementalGrowthBetweenFailures: 'logIncrementalGrowthBetweenFailures',
  logMaxIntervalBetweenFailures: 'logMaxIntervalBetweenFailures',
  cdsNumExpirationTime: 'cdsNumExpirationTime',
  enableCoordinatesMasking: 'enableCoordinatesMasking',
  maskElementsAttributes: 'maskElementsAttributes',
  enableAcknowledgeMessageEvents: 'enableAcknowledgeMessageEvents',
  timeTillClearingElementsBufferQueueTimeout: 'timeTillClearingElementsBufferQueueTimeout',
  acknowledgeDataDispatchingRate: 'acknowledgeDataDispatchingRate',
  isChannelSupportsAckMessageLogic: 'isChannelSupportsAckMessageLogic',
  parentElementSelector: 'parentElementSelector',
  childElementWithCustomAttribute: 'childElementWithCustomAttribute',
  elementDataAttribute: 'elementDataAttribute',
  customButtons: 'customButtons',
  enableElementHierarchy: 'enableElementHierarchy',
  enableElementCategory: 'enableElementCategory',
  agentType: 'agentType',
  collectionMode: 'collectionMode',
  enableWupMessagesHashing: 'enableWupMessagesHashing',
  enableStartupCustomerSessionId: 'enableStartupCustomerSessionId',
  offloadFontsCollectionEnabled: 'offloadFontsCollectionEnabled',
  mutationMaxChunkSize: 'mutationMaxChunkSize',
  mutationChunkDelayMs: 'mutationChunkDelayMs',
  passwordIdMaskingList: 'passwordIdMaskingList',
  elementUniqueIDConfiguration: 'elementUniqueIDConfiguration',
  fontCollection: 'fontCollection',
  useLegacyZeroTimeout: 'useLegacyZeroTimeout'
};

/***/ }),

/***/ "./js-sdk-legacy/src/main/core/configuration/ConfigurationRepository.js":
/*!******************************************************************************!*\
  !*** ./js-sdk-legacy/src/main/core/configuration/ConfigurationRepository.js ***!
  \******************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ConfigurationDefaultTemplates: function() { return /* binding */ ConfigurationDefaultTemplates; },
/* harmony export */   "default": function() { return /* binding */ ConfigurationRepository; }
/* harmony export */ });
/* harmony import */ var _ConfigurationFields__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./ConfigurationFields */ "./js-sdk-legacy/src/main/core/configuration/ConfigurationFields.js");
/* harmony import */ var _technicalServices_log_LogLevel__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../technicalServices/log/LogLevel */ "./js-sdk-legacy/src/main/technicalServices/log/LogLevel.js");
/* harmony import */ var _infrastructure_CDMap__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../infrastructure/CDMap */ "./js-sdk-legacy/src/main/infrastructure/CDMap.js");
/* harmony import */ var _collectors_static_font_collection_v2_types_FontMigrationStage__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../collectors/static/font/collection/v2/types/FontMigrationStage */ "./js-sdk-legacy/src/main/collectors/static/font/collection/v2/types/FontMigrationStage.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }




var ConfigurationDefaultTemplates = {
  defaultDynamicWupDispatchRateConfiguration: {
    type: 'dynamic'
  },
  defaultIncrementalWupDispatchRateConfiguration: {
    type: 'incremental',
    // (incremental, constant)
    initialRateValueMs: 500,
    // The initial rate
    incrementStepMs: 500,
    // The rate increment rate
    incrementStopMs: 5000,
    // At what rate value do we stop incrementing
    incrementStartWupSendCount: 20 // After how many wups do we start increasing
  }
};

/**
 * List of config keys allowed to be modified only via local configuration.
 *
 * @type {string[]}
 */
var configOverrideBlackList = [
/**
 * This keys should be modified only from local configuration, to prevent security treat
 * in which sensitive inputs masking could be disabled remotely.
 * For example, by man-in-the middle attack.
 */
_ConfigurationFields__WEBPACK_IMPORTED_MODULE_0__.ConfigurationFields.keyEventsMaskSpecialChars, _ConfigurationFields__WEBPACK_IMPORTED_MODULE_0__.ConfigurationFields.passwordIdMaskingList, _ConfigurationFields__WEBPACK_IMPORTED_MODULE_0__.ConfigurationFields.maskElementsAttributes, _ConfigurationFields__WEBPACK_IMPORTED_MODULE_0__.ConfigurationFields.allowedUnmaskedValuesList, _ConfigurationFields__WEBPACK_IMPORTED_MODULE_0__.ConfigurationFields.enableUnmaskedValues, _ConfigurationFields__WEBPACK_IMPORTED_MODULE_0__.ConfigurationFields.enableCoordinatesMasking];
var ConfigurationRepository = /*#__PURE__*/function () {
  function ConfigurationRepository() {
    _classCallCheck(this, ConfigurationRepository);
    // Dictionary holds the config values which require parsing so we can parse them when they arrive from the server
    this._requireParseFields = _infrastructure_CDMap__WEBPACK_IMPORTED_MODULE_2__.create();
    this._requireParseFields.set(_ConfigurationFields__WEBPACK_IMPORTED_MODULE_0__.ConfigurationFields.dataWupDispatchRateSettings, _ConfigurationFields__WEBPACK_IMPORTED_MODULE_0__.ConfigurationFields.dataWupDispatchRateSettings);
    this._requireParseFields.set(_ConfigurationFields__WEBPACK_IMPORTED_MODULE_0__.ConfigurationFields.logWupDispatchRateSettings, _ConfigurationFields__WEBPACK_IMPORTED_MODULE_0__.ConfigurationFields.logWupDispatchRateSettings);
    this._requireParseFields.set(_ConfigurationFields__WEBPACK_IMPORTED_MODULE_0__.ConfigurationFields.crossDomainsList, _ConfigurationFields__WEBPACK_IMPORTED_MODULE_0__.ConfigurationFields.crossDomainsList);
    this._requireParseFields.set(_ConfigurationFields__WEBPACK_IMPORTED_MODULE_0__.ConfigurationFields.allowedUnmaskedValuesList, _ConfigurationFields__WEBPACK_IMPORTED_MODULE_0__.ConfigurationFields.allowedUnmaskedValuesList);
    this._requireParseFields.set(_ConfigurationFields__WEBPACK_IMPORTED_MODULE_0__.ConfigurationFields.serverCommunicationSettings, _ConfigurationFields__WEBPACK_IMPORTED_MODULE_0__.ConfigurationFields.serverCommunicationSettings);
    this._configurationList = {};
    // For subscribing to configuration updates
    this.configDefault = {
      logLevel: _technicalServices_log_LogLevel__WEBPACK_IMPORTED_MODULE_1__.LogLevel.INFO,
      isCrossdomain: false,
      isGfxRendering: false,
      isAudioDetectFeature: false,
      enableEmuidFeature: false,
      crossDomainsList: [],
      crossDomainsTimeout: 5000,
      orientationEventsSamplePeriod: 300,
      orientationEventsThreshold: 1,
      stateChangeEnabled: false,
      accelerometerEventsSamplePeriod: 0,
      dataQPassWorkerInterval: 500,
      gyroEventsSamplePeriod: 0,
      gyroEventsThreshold: 0.3,
      isContextPropsFeature: true,
      isEnabled: true,
      isResetEveryLoad: false,
      isScrollCollect: true,
      isVMDetection: true,
      isAudioDetection: false,
      wupStatisticsLogIntervalMs: 30000,
      heartBeatMessageInterval: 5000,
      resetSessionApiThreshold: 20000,
      wupMessageRequestTimeout: 5000,
      logMessageRequestTimeout: 5000,
      slaveChannelHandshakeTimeout: 60000,
      slaveAliveMessageInterval: 100,
      forceDynamicDataWupDispatchSettings: true,
      dataWupDispatchRateSettings: ConfigurationDefaultTemplates.defaultDynamicWupDispatchRateConfiguration,
      logWupDispatchRateSettings: {
        type: 'constant',
        // (incremental, constant)
        initialRateValueMs: 2500 // The initial rate
      },
      serverCommunicationSettings: {
        queueLoadThreshold: 100
      },
      collectKeyRegionValue: false,
      isMutationObserver: true,
      collectCustomElementAttribute: true,
      isCaptureKeyEvents: false,
      locationEventsTimeoutMsec: 10000,
      isMotionAroundTouchEnabled: true,
      motionPaddingAroundTouchMSec: 3000,
      isMotionOnSessionStart: true,
      motionPaddingOnSessionStartMSec: 20000,
      keyEventsMaskSpecialChars: false,
      collectSelectElementBlurAndFocusEvents: false,
      enableUnmaskedValues: false,
      allowedUnmaskedValuesList: [],
      wupMessageNumToRetry: 5,
      wupMessageRetryInterval: 1000,
      wupIncrementalGrowthBetweenFailures: 3500,
      wupMaxIntervalBetweenFailures: 16000,
      logMessageNumToRetry: 5,
      logMessageRetryInterval: 1000,
      logIncrementalGrowthBetweenFailures: 3500,
      logMaxIntervalBetweenFailures: 16000,
      cdsNumExpirationTime: 60,
      enableCoordinatesMasking: false,
      acknowledgeDataDispatchingRate: 3000,
      passwordIdMaskingList: [],
      isFontWidthFeature: false,
      isFontMathFeature: false,
      isFontEmojiFeature: false,
      isStorageFeature: false,
      isKeyboardLayoutFeature: false,
      isScreenHighResFeature: false,
      isBatteryStatusFeature: false,
      isNavigatorFeature: false,
      isWebglFeature: false,
      isWebRTCFeature: false,
      isSpeechVoicesFeature: false,
      isDRMFeature: false,
      isBrowserExtensionsFeature: false,
      isAdblockerListsFeature: false,
      elementUniqueIDConfiguration: {
        componentsFormat: "{tagName}_{index}_{id}_{className}_{ariaLabel}_{containerInfo}_{hierarchyPath}",
        hierarchyFormat: "{tagName}_{index}",
        enabledTags: ["input", "textarea", "button", "select", "div", "span"]
      },
      offloadFontsCollectionEnabled: true,
      fontCollection: JSON.stringify({
        "migrationMode": _collectors_static_font_collection_v2_types_FontMigrationStage__WEBPACK_IMPORTED_MODULE_3__["default"].V1_ONLY,
        "v2": {
          "batchSize": 5,
          "timeoutGap": 0
        }
      }),
      enableElementHierarchy: false,
      enableElementCategory: true
    };
    this.loadConfigurations(this.configDefault);
  }

  /**
   * Indicates if we are using the a configuration which was updated from the server or not
   * @returns boolean True if update configuration is used. False if default one is used
   */
  return _createClass(ConfigurationRepository, [{
    key: "isConfigurationUpdatedFromServer",
    value: function isConfigurationUpdatedFromServer() {
      return !this._isDefaultConfiguration;
    }

    /**
     * get a list of configurations and sets them all
     * @param config
     * @param forceOverride
     */
  }, {
    key: "loadConfigurations",
    value: function loadConfigurations(config, forceOverride) {
      var _this = this;
      if (!config) {
        return;
      }
      this._isDefaultConfiguration = config === this.configDefault;
      Object.keys(config).forEach(function (key) {
        if (forceOverride || _this._isDefaultConfiguration || !configOverrideBlackList.includes(key)) {
          var configurationValue = config[key];
          if (_this._requireParseFields.has(key)) {
            var parsedValue = _this._tryParseConfigurationValue(configurationValue);
            if (parsedValue) {
              configurationValue = parsedValue;
            }
          }
          _this._configurationList[key] = configurationValue;
        }
      });
    }

    /**
     * get specific feature value
     * @param featureName
     * @constructor
     */
  }, {
    key: "get",
    value: function get(configurationName) {
      return this._configurationList[configurationName];
    }
  }, {
    key: "set",
    value: function set(name, value) {
      this._configurationList[name] = value;
    }
  }, {
    key: "getAll",
    value: function getAll() {
      return this._configurationList;
    }
  }, {
    key: "_tryParseConfigurationValue",
    value: function _tryParseConfigurationValue(configurationValue) {
      if (typeof configurationValue !== 'string') {
        return null;
      }
      try {
        return JSON.parse(configurationValue);
      } catch (ex) {
        // swallow error
      }
      return null;
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/main/core/configuration/ConfigurationWrapperLogMessage.js":
/*!*************************************************************************************!*\
  !*** ./js-sdk-legacy/src/main/core/configuration/ConfigurationWrapperLogMessage.js ***!
  \*************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ ConfigurationWrapperLogMessage; }
/* harmony export */ });
/* harmony import */ var _ConfigurationFields__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./ConfigurationFields */ "./js-sdk-legacy/src/main/core/configuration/ConfigurationFields.js");
/* harmony import */ var _worker_communication_ReMessageSettings__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../worker/communication/ReMessageSettings */ "./js-sdk-legacy/src/worker/communication/ReMessageSettings.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }


var ConfigurationWrapperLogMessage = /*#__PURE__*/function () {
  function ConfigurationWrapperLogMessage(configurationRepository) {
    _classCallCheck(this, ConfigurationWrapperLogMessage);
    this.logMessageNumToRetry = configurationRepository.get(_ConfigurationFields__WEBPACK_IMPORTED_MODULE_0__.ConfigurationFields.logMessageNumToRetry);
    this.logMessageRetryInterval = configurationRepository.get(_ConfigurationFields__WEBPACK_IMPORTED_MODULE_0__.ConfigurationFields.logMessageRetryInterval);
    this.logIncrementalGrowthBetweenFailures = configurationRepository.get(_ConfigurationFields__WEBPACK_IMPORTED_MODULE_0__.ConfigurationFields.logIncrementalGrowthBetweenFailures);
    this.logMaxIntervalBetweenFailures = configurationRepository.get(_ConfigurationFields__WEBPACK_IMPORTED_MODULE_0__.ConfigurationFields.logMaxIntervalBetweenFailures);
  }
  return _createClass(ConfigurationWrapperLogMessage, [{
    key: "createReMessageSettings",
    value: function createReMessageSettings() {
      return new _worker_communication_ReMessageSettings__WEBPACK_IMPORTED_MODULE_1__["default"](this.logMessageNumToRetry, this.logMessageRetryInterval, this.logIncrementalGrowthBetweenFailures, this.logMaxIntervalBetweenFailures);
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/main/core/configuration/ConfigurationWrapperWupMessage.js":
/*!*************************************************************************************!*\
  !*** ./js-sdk-legacy/src/main/core/configuration/ConfigurationWrapperWupMessage.js ***!
  \*************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ ConfigurationWrapperWupMessage; }
/* harmony export */ });
/* harmony import */ var _ConfigurationFields__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./ConfigurationFields */ "./js-sdk-legacy/src/main/core/configuration/ConfigurationFields.js");
/* harmony import */ var _worker_communication_ReMessageSettings__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../worker/communication/ReMessageSettings */ "./js-sdk-legacy/src/worker/communication/ReMessageSettings.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }


var ConfigurationWrapperWupMessage = /*#__PURE__*/function () {
  function ConfigurationWrapperWupMessage(configurationRepository) {
    _classCallCheck(this, ConfigurationWrapperWupMessage);
    this.wupMessageNumToRetry = configurationRepository.get(_ConfigurationFields__WEBPACK_IMPORTED_MODULE_0__.ConfigurationFields.wupMessageNumToRetry);
    this.wupMessageRetryInterval = configurationRepository.get(_ConfigurationFields__WEBPACK_IMPORTED_MODULE_0__.ConfigurationFields.wupMessageRetryInterval);
    this.wupIncrementalGrowthBetweenFailures = configurationRepository.get(_ConfigurationFields__WEBPACK_IMPORTED_MODULE_0__.ConfigurationFields.wupIncrementalGrowthBetweenFailures);
    this.wupMaxIntervalBetweenFailures = configurationRepository.get(_ConfigurationFields__WEBPACK_IMPORTED_MODULE_0__.ConfigurationFields.wupMaxIntervalBetweenFailures);
  }
  return _createClass(ConfigurationWrapperWupMessage, [{
    key: "createReMessageSettings",
    value: function createReMessageSettings() {
      return new _worker_communication_ReMessageSettings__WEBPACK_IMPORTED_MODULE_1__["default"](this.wupMessageNumToRetry, this.wupMessageRetryInterval, this.wupIncrementalGrowthBetweenFailures, this.wupMaxIntervalBetweenFailures);
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/main/events/HeartBeatEvent.js":
/*!*********************************************************!*\
  !*** ./js-sdk-legacy/src/main/events/HeartBeatEvent.js ***!
  \*********************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ HeartBeatEvent; },
/* harmony export */   statusTypes: function() { return /* binding */ statusTypes; }
/* harmony export */ });
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
var statusTypes = {
  Ok: 'oK',
  Error: 'Error'
};
var HeartBeatEvent = /*#__PURE__*/_createClass(function HeartBeatEvent(category, status) {
  _classCallCheck(this, HeartBeatEvent);
  this.category = category;
  this.status = status;
});


/***/ }),

/***/ "./js-sdk-legacy/src/main/events/MessageBusEventType.js":
/*!**************************************************************!*\
  !*** ./js-sdk-legacy/src/main/events/MessageBusEventType.js ***!
  \**************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   MessageBusEventType: function() { return /* binding */ MessageBusEventType; }
/* harmony export */ });
var MessageBusEventType = {
  TouchEvent: 'touchEvent',
  KeyEvent: 'keyEvent',
  ConfigurationLoadedEvent: 'ConfigurationLoadedEvent',
  NewSessionStartedEvent: 'NewSessionStartedEvent',
  WupDispatchRateUpdatedEvent: 'WupDispatchRateUpdatedEvent',
  ApiContextChangeEvent: 'ApiContextChangeEvent',
  ApiResetSessionEvent: 'ApiResetSessionEvent',
  ApiCustomerMetadataEvent: 'ApiCustomerMetadataEvent',
  ApiChangeStateEvent: 'ApiChangeStateEvent',
  ApiSetCsidEvent: 'ApiSetCsidEvent',
  ApiSetPsidEvent: 'ApiSetPsidEvent',
  ApiSetCustomerBrand: 'ApiSetCustomerBrand',
  ServerStateUpdatedEvent: 'ServerStateUpdatedEvent',
  ServerRestoredMuidEvent: 'ServerRestoredMuidEvent',
  ServerNewAgentIdEvent: 'ServerNewAgentIdEvent',
  StateChangedEvent: 'StateChangedEvent',
  MutationSingleEvent: 'MutationSingleEvent',
  MutationAddedNodes: 'MutationAddedNodes',
  MutationRemovedNodes: 'MutationRemovedNodes',
  StandardInputEvent: 'StandardInputEvent',
  StandardInputFocusEvent: 'StandardInputFocusEvent',
  StandardInputBlurEvent: 'StandardInputBlurEvent',
  StandardOnClickEvent: 'StandardOnClickEvent',
  StandardOnSelectEvent: 'StandardOnSelectEvent',
  ElementFocusEvent: 'ElementFocusEvent',
  ElementBlurEvent: 'ElementBlurEvent',
  StandardOnFormSubmitEvent: 'StandardOnFormSubmitEvent',
  SyntheticInputMaskEvent: 'SyntheticInputMaskEvent',
  CutEvent: 'CutEvent',
  CopyEvent: 'CopyEvent',
  PasteEvent: 'PasteEvent',
  DeviceOrientationEvent: 'DeviceOrientationEvent',
  BeforeInstallPromptEvent: 'BeforeInstallPromptEvent',
  FocusEvent: 'FocusEvent',
  BlurEvent: 'BlurEvent',
  ResizeEvent: 'ResizeEvent',
  DOMContentLoadedEvent: 'DOMContentLoadedEvent',
  VisibilityChangeEvent: 'VisibilityChangeEvent',
  ScrollEvent: 'ScrollEvent',
  WindowMessageEvent: 'WindowMessageEvent',
  WorkerSystemStatusEvent: 'WorkerSystemStatusEvent',
  CustomElementDetectedEvent: 'CustomElementDetectedEvent',
  CustomElementAddedEvent: 'CustomElementAddedEvent',
  CustomElementRemovedEvent: 'CustomElementRemovedEvent',
  CustomElementInaccessible: 'CustomElementInaccessible',
  CustomElementSubmitted: 'CustomElementSubmitted',
  BrowserContextAdded: 'BrowserContextAdded',
  RunDefaultFeatures: 'RunDefaultFeatures',
  StopDefaultFeatures: 'StopDefaultFeatures',
  CustomInputElement: 'CustomInputElement',
  BCTracker: {
    ElementsEvent: 'BCTrackerElementsEvent',
    ElementEventsEvent: 'BCTrackerElementEventsEvent',
    KeyEvent: 'BCTrackerKeyEvent',
    TouchEvent: 'BCTrackerTouchEvent',
    MouseEvent: 'BCTrackerMouseEvent'
  }
};

/***/ }),

/***/ "./js-sdk-legacy/src/main/events/WorkerCommand.js":
/*!********************************************************!*\
  !*** ./js-sdk-legacy/src/main/events/WorkerCommand.js ***!
  \********************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   WorkerCommand: function() { return /* binding */ WorkerCommand; }
/* harmony export */ });
var WorkerCommand = {
  requestConfigurationsCommand: 'requestConfigurationsCommand',
  startNewSessionCommand: 'startNewSessionCommand',
  resumeSessionCommand: 'resumeSessionCommand',
  changeContextCommand: 'changeContextCommand',
  updateCsidCommand: 'updateCsidCommand',
  updatePsidCommand: 'updatePsidCommand',
  updateLogUrlCommand: 'updateLogUrl',
  sendDataCommand: 'sendDataCommand',
  sendLogCommand: 'sendLogCommand',
  updateBrandCommand: 'updateBrandCommand',
  stateUpdateFromStorage: 'stateUpdateFromStorage',
  setAgentTypeCommand: 'setAgentTypeCommand',
  updateAgentIdCommand: 'updateAgentIdCommand',
  enableWupMessagesHashingCommand: 'enableWupMessagesHashingCommand',
  updateSDKStateCommand: 'updateSDKState'
};

/***/ }),

/***/ "./js-sdk-legacy/src/main/events/WorkerEvent.js":
/*!******************************************************!*\
  !*** ./js-sdk-legacy/src/main/events/WorkerEvent.js ***!
  \******************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   WorkerEvent: function() { return /* binding */ WorkerEvent; }
/* harmony export */ });
var WorkerEvent = {
  NewSessionStartedEvent: 'NewSessionStartedEvent',
  ConfigurationLoadedEvent: 'ConfigurationLoadedEvent',
  ServerStateUpdatedEvent: 'ServerStateUpdatedEvent',
  HeartBeatStatusEvent: 'HeartBeatStatusEvent',
  ServerRestoredMuidEvent: 'ServerRestoredMuidEvent',
  SetAgentTypeEvent: 'SetAgentTypeEvent',
  ServerNewAgentIdEvent: 'ServerNewAgentIdEvent'
};

/***/ }),

/***/ "./js-sdk-legacy/src/main/infrastructure/CDEvent.js":
/*!**********************************************************!*\
  !*** ./js-sdk-legacy/src/main/infrastructure/CDEvent.js ***!
  \**********************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ CDEvent; }
/* harmony export */ });
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var CDEvent = /*#__PURE__*/function () {
  function CDEvent() {
    _classCallCheck(this, CDEvent);
    this._listeners = [];
  }
  return _createClass(CDEvent, [{
    key: "subscribe",
    value: function subscribe(listener) {
      this._listeners.push(listener);
    }
  }, {
    key: "publish",
    value: function publish(args) {
      for (var i = 0, len = this._listeners.length; i < len; i++) {
        this._listeners[i](args);
      }
    }
  }, {
    key: "unsubscribe",
    value: function unsubscribe(callback) {
      for (var i = 0, len = this._listeners.length; i < len; i++) {
        if (callback === this._listeners[i]) {
          this._listeners.splice(i, 1);
          break;
        }
      }
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/main/infrastructure/CDMap.js":
/*!********************************************************!*\
  !*** ./js-sdk-legacy/src/main/infrastructure/CDMap.js ***!
  \********************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   create: function() { return /* binding */ create; },
/* harmony export */   createLocal: function() { return /* binding */ createLocal; }
/* harmony export */ });
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/*
 * A polyfill for unsupported mode. This polyfill has O(n) on all methods so its a big piece of junk but will due for our needs
 * @constructor
 */
var CDMap = /*#__PURE__*/function () {
  function CDMap() {
    _classCallCheck(this, CDMap);
    this._pairs = [];
    this.size = 0;
  }
  return _createClass(CDMap, [{
    key: "has",
    value: function has(key) {
      return this._indexOf(key) > -1;
    }
  }, {
    key: "get",
    value: function get(key) {
      var index = this._indexOf(key);
      if (index > -1) {
        return this._pairs[index][1];
      }
      return undefined;
    }
  }, {
    key: "set",
    value: function set(key, value) {
      var index = this._indexOf(key);
      if (index > -1) {
        this._pairs[index][1] = value;
      } else {
        this._pairs.push([key, value]);
        this.size++;
      }
    }
  }, {
    key: "delete",
    value: function _delete(key) {
      var index = this._indexOf(key);
      if (index > -1) {
        this._pairs.splice(index, 1);
        this.size--;
        return true;
      }
      return false;
    }
  }, {
    key: "forEach",
    value: function forEach(cb) {
      for (var i = 0; i < this._pairs.length; i++) {
        cb(this._pairs[i][1], this._pairs[i][0]);
      }
    }
  }, {
    key: "clear",
    value: function clear() {
      this._pairs = [];
    }
  }, {
    key: "_indexOf",
    value: function _indexOf(key) {
      for (var i = 0; i < this._pairs.length; i++) {
        if (this._pairs[i][0] === key) {
          return i;
        }
      }
      return -1;
    }
  }]);
}();
var create = function create() {
  var Ctor = self.Map || CDMap;
  return new Ctor();
};
var createLocal = function createLocal() {
  return new CDMap();
};

/***/ }),

/***/ "./js-sdk-legacy/src/main/infrastructure/CDPort.js":
/*!*********************************************************!*\
  !*** ./js-sdk-legacy/src/main/infrastructure/CDPort.js ***!
  \*********************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ CDPort; }
/* harmony export */ });
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var CDPort = /*#__PURE__*/function () {
  function CDPort(nativeWorker) {
    _classCallCheck(this, CDPort);
    this._portNativeWorker = nativeWorker;
  }

  /* eslint-disable prefer-rest-params */
  return _createClass(CDPort, [{
    key: "postMessage",
    value: function postMessage() {
      this._portNativeWorker.postMessage.apply(this._portNativeWorker, arguments);
    }

    /* eslint-enable prefer-rest-params */
  }, {
    key: "close",
    value: function close() {
      this._portNativeWorker.terminate();
    }

    // in the original is was set onmessage using a setter but since IE8 does not support setters I changed
  }, {
    key: "setonmessage",
    value: function setonmessage(cb) {
      this._portNativeWorker.onmessage = cb;
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/main/infrastructure/CDSet.js":
/*!********************************************************!*\
  !*** ./js-sdk-legacy/src/main/infrastructure/CDSet.js ***!
  \********************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   create: function() { return /* binding */ create; },
/* harmony export */   createLocal: function() { return /* binding */ createLocal; }
/* harmony export */ });
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/*
 * A polyfill for unsupported mode. It is not a full polyfill since it does not support Object as a value and more,
 * but enough for our needs...
 * @constructor
 */
var CDSet = /*#__PURE__*/function () {
  function CDSet() {
    _classCallCheck(this, CDSet);
    this._set = [];
    this.size = 0;
  }
  return _createClass(CDSet, [{
    key: "add",
    value: function add(val) {
      this._set.push(val);
      this.size++;
      return this; // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/add
    }
  }, {
    key: "has",
    value: function has(val) {
      return this._set.indexOf(val) > -1;
    }
  }, {
    key: "delete",
    value: function _delete(val) {
      for (var i = 0; i < this._set.length; i++) {
        if (this._set[i] === val) {
          this._set.splice(i, 1);
          this.size--;
          return true; // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/delete
        }
      }
      return false;
    }
  }, {
    key: "forEach",
    value: function forEach(cb) {
      for (var i = 0; i < this._set.length; i++) {
        cb(this._set[i]);
      }
    }
  }, {
    key: "clear",
    value: function clear() {
      this._set = [];
    }
  }]);
}();
var create = function create() {
  var initial_values = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var Ctor = self.Set || CDSet;
  var set = new Ctor();
  for (var i = 0; i < initial_values.length; i++) {
    set.add(initial_values[i]);
  }
  return set;
};
var createLocal = function createLocal() {
  var initial_values = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var set = new CDSet();
  for (var i = 0; i < initial_values.length; i++) {
    set.add(initial_values[i]);
  }
  return set;
};

/***/ }),

/***/ "./js-sdk-legacy/src/main/infrastructure/HttpRequestFactory.js":
/*!*********************************************************************!*\
  !*** ./js-sdk-legacy/src/main/infrastructure/HttpRequestFactory.js ***!
  \*********************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ HttpRequestFactory; }
/* harmony export */ });
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/**
 * Factory for creating an http request object. If XmlHttpRequest with cors support is available it is used. Otherwise if XDomainRequest is supported it is used.
 * If both are not supported we use XmlHttpRequest...
 */
var HttpRequestFactory = /*#__PURE__*/function () {
  function HttpRequestFactory() {
    _classCallCheck(this, HttpRequestFactory);
  }
  return _createClass(HttpRequestFactory, null, [{
    key: "create",
    value: function create() {
      // Notice that the order of the conditions is important!
      // Best option is if we have XMLHttpRequest with CORS support
      if (self.XMLHttpRequest && Object.prototype.hasOwnProperty.call(XMLHttpRequest.prototype, 'withCredentials')) {
        return new XMLHttpRequest();
      }
      if (self.XDomainRequest) {
        // Second option is if we have XDomainRequest which also supports CORS (God bless Microsoft)
        return new XDomainRequest();
      }
      if (!self.XMLHttpRequest) {
        throw new Error('There is no supported http request object');
      }

      // If non of the above is available and the XmlHttpRequest is available we use it without the CORS support
      return new XMLHttpRequest();
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/main/infrastructure/Queue.js":
/*!********************************************************!*\
  !*** ./js-sdk-legacy/src/main/infrastructure/Queue.js ***!
  \********************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ Queue; }
/* harmony export */ });
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var Queue = /*#__PURE__*/function () {
  function Queue() {
    _classCallCheck(this, Queue);
    this._buffer = [];
  }
  return _createClass(Queue, [{
    key: "hasItems",
    value: function hasItems() {
      return this.length() > 0;
    }
  }, {
    key: "length",
    value: function length() {
      return this._buffer.length;
    }
  }, {
    key: "enqueue",
    value: function enqueue(item) {
      this._buffer.push(item);
    }
  }, {
    key: "enqueueToHead",
    value: function enqueueToHead(item) {
      this._buffer.unshift(item);
    }
  }, {
    key: "dequeue",
    value: function dequeue() {
      return this._buffer.shift();
    }
  }, {
    key: "getItem",
    value: function getItem(index) {
      return this._buffer[index];
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/main/technicalServices/DOMUtils.js":
/*!**************************************************************!*\
  !*** ./js-sdk-legacy/src/main/technicalServices/DOMUtils.js ***!
  \**************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ DOMUtils; }
/* harmony export */ });
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function isPassiveSupported() {
  var isPassive = false;
  try {
    // Test via a getter in the options object to see if the passive property is accessed
    // browsers throw exception if addEventListener gets an object and not boolean for third param
    var opts = Object.defineProperty({}, 'passive', {
      get: function get() {
        isPassive = true;
      }
    });
    window.addEventListener('test', null, opts);
  } catch (e) {
    // no support for passive
  }
  return isPassive;
}
var DOMUtils = /*#__PURE__*/function () {
  function DOMUtils() {
    _classCallCheck(this, DOMUtils);
  }
  return _createClass(DOMUtils, null, [{
    key: "addEventListener",
    value: function addEventListener(target, type, handler) {
      var isCapture = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
      var isPassive = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;
      var isOnce = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : false;
      if (this.isPassiveSupported) {
        target.addEventListener(type, handler, {
          capture: isCapture,
          passive: isPassive,
          once: isOnce
        });
      } else if (target.addEventListener) {
        target.addEventListener(type, handler, isCapture);
      } else {
        target.attachEvent('on' + type, handler); // isCapture not supported in attachEvent
      }
    }
  }, {
    key: "removeEventListener",
    value: function removeEventListener(target, type, handler) {
      var isCapture = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
      target.removeEventListener ? target.removeEventListener(type, handler, isCapture) : target.detachEvent('on' + type, handler);
    }

    // getting the HTML so that it will also work on FF
  }, {
    key: "outerHTML",
    value: function outerHTML(node) {
      return node.outerHTML || new XMLSerializer().serializeToString(node);
    }
  }, {
    key: "onDocumentBody",
    value: function onDocumentBody(frame, callback) {
      if (frame.document.body) {
        callback();
      } else {
        window.addEventListener ? window.addEventListener('DOMContentLoaded', callback, true) : window.attachEvent('onload', callback); // Old IE does not support DOMContentLoaded
      }
    }
  }, {
    key: "onPageLoad",
    value: function onPageLoad(frame, callback) {
      DOMUtils.addEventListener(frame, 'load', callback, true);
      if (frame.contentWindow && frame.contentWindow.document.readyState === 'complete' || frame.document && frame.document.readyState === 'complete') {
        // since we still want to listen every time a frame is loaded
        callback();
      }
    }
  }, {
    key: "awaitWindowDocumentReady",
    value: function awaitWindowDocumentReady(contentWindow) {
      var _this = this;
      return new Promise(function (resolve, reject) {
        try {
          _this.onWindowDocumentReady(contentWindow, function () {
            resolve();
          });
        } catch (error) {
          reject(error);
        }
      });
    }
  }, {
    key: "onWindowDocumentReady",
    value: function onWindowDocumentReady(contentWindow, callback) {
      var eventType = window.addEventListener ? 'DOMContentLoaded' : 'load';

      // We consider both states good since they both mean the dom was already loaded and we can work on the document
      if (contentWindow.document.readyState === 'complete' || contentWindow.document.readyState === 'interactive') {
        callback();
      } else {
        var onLoaded = function onLoadedWindowEvent() {
          DOMUtils.removeEventListener(contentWindow, eventType, onLoaded, true);
          callback();
        };
        DOMUtils.addEventListener(contentWindow, eventType, onLoaded, true);
      }
    }
  }, {
    key: "isWindowDocumentReady",
    value: function isWindowDocumentReady(contentWindow) {
      return contentWindow && contentWindow.document.readyState === 'complete';
    }
  }, {
    key: "canAccessIFrame",
    value: function canAccessIFrame(iframe) {
      var html = null;
      try {
        // deal with older browsers
        var doc = iframe.contentDocument || iframe.contentWindow.document;
        html = doc.body.innerHTML;
      } catch (err) {
        // do nothing
      }
      return html !== null;
    }

    // Some browsers (for example IE11) have prefixed implementation of matches function but a pollyfill is not good enough
    // since in some cases the matches function is still missing (for example, removed nodes received from mutation observer)
    // so we use this function instead...
  }, {
    key: "matches",
    value: function matches(element, selector) {
      var matchesFunc = element.matches || element.matchesSelector || element.mozMatchesSelector || element.msMatchesSelector || element.oMatchesSelector || element.webkitMatchesSelector || function (s) {
        // Get the document from the element
        var currentDocument = this.document || this.ownerDocument;

        // If we don't have a document we can't match...
        if (!currentDocument) {
          return false;
        }
        var matches = currentDocument.querySelectorAll(s);
        var i = matches.length;
        while (--i >= 0) {
          // Get the current item and check if it equals the element
          // If item property is not available we use the index access (some old browsers have issues sometimes)
          var currentItem = matches.item ? matches.item(i) : matches[i];
          if (currentItem === this) {
            break;
          }
        }
        return i > -1;
      };
      return matchesFunc.call(element, selector);
    }

    //Check if the WebWorker supports fetch API: return true || false
  }, {
    key: "isWebWorkerFetchSupported",
    value: function isWebWorkerFetchSupported() {
      var request = "Request" in self;
      var fetchInSelf = "fetch" in self;
      //IE does not support the "Request" object at all, so the if statement is for IE browsers
      if (!request) return false;
      var keepAliveInRequestPrototype = "keepalive" in Request.prototype;
      return fetchInSelf && keepAliveInRequestPrototype;
    }
  }, {
    key: "isSubtleCryptoSupported",
    value: function isSubtleCryptoSupported() {
      var subtleCrypto = 'SubtleCrypto';
      return subtleCrypto in self;
    }
  }]);
}();
_defineProperty(DOMUtils, "isPassiveSupported", isPassiveSupported());


/***/ }),

/***/ "./js-sdk-legacy/src/main/technicalServices/MessageBus.js":
/*!****************************************************************!*\
  !*** ./js-sdk-legacy/src/main/technicalServices/MessageBus.js ***!
  \****************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _infrastructure_CDMap__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../infrastructure/CDMap */ "./js-sdk-legacy/src/main/infrastructure/CDMap.js");
/* harmony import */ var _infrastructure_CDSet__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../infrastructure/CDSet */ "./js-sdk-legacy/src/main/infrastructure/CDSet.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }



/**
 *
 */
var MessageBus = /*#__PURE__*/function () {
  function MessageBus() {
    _classCallCheck(this, MessageBus);
    this.subscribers = _infrastructure_CDMap__WEBPACK_IMPORTED_MODULE_0__.create();
  }

  /**
   *
   * @param messageType
   * @param handler
   * @param isOneTime
   */
  return _createClass(MessageBus, [{
    key: "subscribe",
    value: function subscribe(messageType, handler) {
      var isOneTime = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      var listenersSet;
      var foundHandler = false;
      if (this.subscribers.has(messageType)) {
        listenersSet = this.subscribers.get(messageType);
        listenersSet && listenersSet.forEach(function (listener) {
          if (handler === listener.handler) {
            foundHandler = true;
          }
        });
      } else {
        listenersSet = _infrastructure_CDSet__WEBPACK_IMPORTED_MODULE_1__.create();
        this.subscribers.set(messageType, listenersSet);
      }
      if (!foundHandler) {
        listenersSet.add({
          handler: handler,
          isOneTime: isOneTime
        });
      }
    }

    /**
     *
     * @param messageType
     * @param handler
     */
  }, {
    key: "unsubscribe",
    value: function unsubscribe(messageType, handler) {
      if (messageType && this.subscribers.has(messageType)) {
        var listenersSet = this.subscribers.get(messageType);
        listenersSet && listenersSet.forEach(function (listener) {
          if (handler === listener.handler) {
            listenersSet["delete"](listener);
          }
        });
        if (listenersSet.size === 0) {
          this.subscribers["delete"](messageType);
        }
      }
    }

    /**
     *
     * @param messageType
     * @param message
     */
  }, {
    key: "publish",
    value: function publish(messageType, message) {
      if (!messageType) {
        throw new Error('invalid argument messageType must be defined');
      }
      this._notifySubscribers(messageType, message);
    }

    /**
     *
     * @param messageType
     * @param message
     */
  }, {
    key: "_notifySubscribers",
    value: function _notifySubscribers(messageType, message) {
      var listenersSet = this.subscribers.get(messageType);
      listenersSet && listenersSet.forEach(function (listener) {
        listener.handler(message);
        if (listener.isOneTime) {
          listenersSet["delete"](listener);
        }
      });
    }
  }]);
}();
/* harmony default export */ __webpack_exports__["default"] = (MessageBus);

/***/ }),

/***/ "./js-sdk-legacy/src/main/technicalServices/WorkerCommunicator.js":
/*!************************************************************************!*\
  !*** ./js-sdk-legacy/src/main/technicalServices/WorkerCommunicator.js ***!
  \************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ WorkerCommunicator; }
/* harmony export */ });
/* harmony import */ var _infrastructure_CDMap__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../infrastructure/CDMap */ "./js-sdk-legacy/src/main/infrastructure/CDMap.js");
/* harmony import */ var _infrastructure_CDSet__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../infrastructure/CDSet */ "./js-sdk-legacy/src/main/infrastructure/CDSet.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }



// The WorkerCommunicator can communicate between the main and the worker and also can
// exist in the worker and communicate with the main. All depends on the implementation
// of messagePort. messagePort is an object that must implement onmessage and potMessage functions
var WorkerCommunicator = /*#__PURE__*/function () {
  function WorkerCommunicator() {
    _classCallCheck(this, WorkerCommunicator);
    this._msgListeners = _infrastructure_CDMap__WEBPACK_IMPORTED_MODULE_0__.create();
  }
  return _createClass(WorkerCommunicator, [{
    key: "setMessagingPort",
    value: function setMessagingPort(messagePort) {
      var _this = this;
      this._messagePort = messagePort;
      messagePort.setonmessage(function (e) {
        var msg = e.data;
        var oneTimeListeners = [];
        // call the relevant msg listeners by the msgType
        var listenersSet = _this._msgListeners.get(msg.msgType);
        listenersSet && listenersSet.forEach(function (listener) {
          listener.callback(msg.data);
          if (listener.isOneTime) {
            oneTimeListeners.push(listener);
          }
        });

        // Remove one time listeners out side of the main foreach since otherwise you get unexpected results (think about it)
        oneTimeListeners.forEach(function (item) {
          listenersSet["delete"](item);
        });
      });
    }

    // All the parameters after data are optional. Using them is just a shortcut for calling addMessageListener separately
  }, {
    key: "sendAsync",
    value: function sendAsync(msgType, data, responseMsgType, onResponse, isOneTime) {
      if (onResponse && responseMsgType) {
        this.addMessageListener(responseMsgType, onResponse, isOneTime);
      }
      this._messagePort.postMessage({
        msgType: msgType,
        data: data
      });
    }
  }, {
    key: "addMessageListener",
    value: function addMessageListener(msgType, callback, isOneTime) {
      var listenersSet = null;
      if (this._msgListeners.has(msgType)) {
        listenersSet = this._msgListeners.get(msgType);
      } else {
        listenersSet = _infrastructure_CDSet__WEBPACK_IMPORTED_MODULE_1__.create();
        this._msgListeners.set(msgType, listenersSet);
      }
      listenersSet.add({
        callback: callback,
        isOneTime: isOneTime
      });
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/main/technicalServices/log/LogBridge.js":
/*!*******************************************************************!*\
  !*** ./js-sdk-legacy/src/main/technicalServices/log/LogBridge.js ***!
  \*******************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ LogBridge; }
/* harmony export */ });
/* harmony import */ var _worker_LogAggregator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../worker/LogAggregator */ "./js-sdk-legacy/src/worker/LogAggregator.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }

var LogBridge = /*#__PURE__*/function () {
  function LogBridge(logAggregator, url) {
    var msgPrefix = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
    _classCallCheck(this, LogBridge);
    this.sn = 0;
    this.url = url;
    this.logAggregator = logAggregator;
    this.msgPrefix = msgPrefix;
  }
  return _createClass(LogBridge, [{
    key: "log",
    value: function log(msg, logLevel, sessionIdentifiers) {
      this.logAggregator.add({
        eventName: 'log',
        data: _objectSpread(_objectSpread({
          msg: this.msgPrefix + msg
        }, sessionIdentifiers), {}, {
          url: this.url,
          level: logLevel,
          sn: this.sn++
        })
      });
    }
  }, {
    key: "setLogLevel",
    value: function setLogLevel(logLevel) {
      if (this.logAggregator instanceof _worker_LogAggregator__WEBPACK_IMPORTED_MODULE_0__["default"]) {
        this.logAggregator.setLogLevel(logLevel);
      }
    }
  }, {
    key: "clearLogEntriesByLogLevel",
    value: function clearLogEntriesByLogLevel(logLevel) {
      this.logAggregator.filterOutByLogLevel(logLevel);
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/main/technicalServices/log/LogLevel.js":
/*!******************************************************************!*\
  !*** ./js-sdk-legacy/src/main/technicalServices/log/LogLevel.js ***!
  \******************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   LogLevel: function() { return /* binding */ LogLevel; }
/* harmony export */ });
var LogLevel = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40,
  CRITICAL: 50,
  OFF: 80
};

/***/ }),

/***/ "./js-sdk-legacy/src/main/technicalServices/log/Logger.js":
/*!****************************************************************!*\
  !*** ./js-sdk-legacy/src/main/technicalServices/log/Logger.js ***!
  \****************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Logger: function() { return /* binding */ Logger; },
/* harmony export */   "default": function() { return /* binding */ Log; }
/* harmony export */ });
/* harmony import */ var _LogLevel__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./LogLevel */ "./js-sdk-legacy/src/main/technicalServices/log/LogLevel.js");
/* harmony import */ var _core_configuration_ConfigurationFields__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../core/configuration/ConfigurationFields */ "./js-sdk-legacy/src/main/core/configuration/ConfigurationFields.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// eslint-disable-next-line max-classes-per-file


var Log = /*#__PURE__*/function () {
  function Log() {
    _classCallCheck(this, Log);
  }
  return _createClass(Log, null, [{
    key: "setLogger",
    value: function setLogger(logger) {
      this._logger = logger;
    }
  }, {
    key: "attachSessionIdentifiers",
    value: function attachSessionIdentifiers(sessionIdentifiers) {
      if (!this._logger) {
        return;
      }
      return this._logger.attachSessionIdentifiers(sessionIdentifiers);
    }
  }, {
    key: "isDebug",
    value: function isDebug() {
      if (!this._logger) {
        return;
      }
      return this._logger.isDebug();
    }
  }, {
    key: "error",
    value: function error(msg, ex) {
      if (!this._logger) {
        return;
      }
      this._logger.error(msg, ex || null);
    }
  }, {
    key: "warn",
    value: function warn(msg, ex) {
      if (!this._logger) {
        return;
      }
      this._logger.warn(msg, ex || null);
    }
  }, {
    key: "trace",
    value: function trace(msg) {
      if (!this._logger) {
        return;
      }
      this._logger.trace(msg);
    }
  }, {
    key: "debug",
    value: function debug(msg) {
      if (!this._logger) {
        return;
      }
      this._logger.debug(msg);
    }
  }, {
    key: "info",
    value: function info(msg) {
      if (!this._logger) {
        return;
      }
      this._logger.info(msg);
    }
  }]);
}();

var Logger = /*#__PURE__*/function () {
  function Logger(logBridge, logLevel) {
    _classCallCheck(this, Logger);
    this._logBridge = logBridge;
    this._logLevel = logLevel || _LogLevel__WEBPACK_IMPORTED_MODULE_0__.LogLevel.INFO;
    this._sessionIdentifiers = {};
  }
  return _createClass(Logger, [{
    key: "attachSessionIdentifiers",
    value: function attachSessionIdentifiers(sessionIdentifiers) {
      // add the provided identifiers to the existing ones.
      Object.assign(this._sessionIdentifiers, sessionIdentifiers);
    }
  }, {
    key: "trace",
    value: function trace(msg) {
      this._sendToLogBridge(msg, _LogLevel__WEBPACK_IMPORTED_MODULE_0__.LogLevel.DEBUG); // The server does not support trace
    }
  }, {
    key: "debug",
    value: function debug(msg) {
      this._sendToLogBridge(msg, _LogLevel__WEBPACK_IMPORTED_MODULE_0__.LogLevel.DEBUG);
    }
  }, {
    key: "info",
    value: function info(msg) {
      this._sendToLogBridge(msg, _LogLevel__WEBPACK_IMPORTED_MODULE_0__.LogLevel.INFO);
    }
  }, {
    key: "warn",
    value: function warn(msg, ex) {
      this._sendToLogBridge(msg, _LogLevel__WEBPACK_IMPORTED_MODULE_0__.LogLevel.WARN, ex);
    }
  }, {
    key: "error",
    value: function error(msg, ex) {
      this._sendToLogBridge(msg, _LogLevel__WEBPACK_IMPORTED_MODULE_0__.LogLevel.ERROR, ex);
    }
  }, {
    key: "isDebug",
    value: function isDebug() {
      return this._logLevel === _LogLevel__WEBPACK_IMPORTED_MODULE_0__.LogLevel.DEBUG;
    }
  }, {
    key: "updateLogConfig",
    value: function updateLogConfig(configurationRepository) {
      this._logLevel = configurationRepository.get(_core_configuration_ConfigurationFields__WEBPACK_IMPORTED_MODULE_1__.ConfigurationFields.logLevel) || this._logLevel;
      this._logBridge.setLogLevel(this._logLevel);
      this._logBridge.clearLogEntriesByLogLevel(this._logLevel);
    }
  }, {
    key: "_sendToLogBridge",
    value: function _sendToLogBridge(msg, logLevel, ex) {
      if (logLevel >= this._logLevel) {
        if (ex && ex.stack) {
          msg += " ;stack: ".concat(ex.stack);
        }
        this._logBridge.log(msg, logLevel, this._sessionIdentifiers);
      }
    }
  }]);
}();

/***/ }),

/***/ "./js-sdk-legacy/src/worker/Application.js":
/*!*************************************************!*\
  !*** ./js-sdk-legacy/src/worker/Application.js ***!
  \*************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ Application; }
/* harmony export */ });
/* harmony import */ var _WorkerStartPoint__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./WorkerStartPoint */ "./js-sdk-legacy/src/worker/WorkerStartPoint.js");
/* harmony import */ var _main_common_polyfills_TextEncoderPolyfill_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../main/common/polyfills/TextEncoderPolyfill.js */ "./js-sdk-legacy/src/main/common/polyfills/TextEncoderPolyfill.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }


var Application = /*#__PURE__*/function () {
  function Application() {
    _classCallCheck(this, Application);
    (0,_main_common_polyfills_TextEncoderPolyfill_js__WEBPACK_IMPORTED_MODULE_1__["default"])(self);
  }
  return _createClass(Application, [{
    key: "start",
    value: function start() {
      new _WorkerStartPoint__WEBPACK_IMPORTED_MODULE_0__["default"]().start();
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/worker/DataAggregator.js":
/*!****************************************************!*\
  !*** ./js-sdk-legacy/src/worker/DataAggregator.js ***!
  \****************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ DataAggregator; }
/* harmony export */ });
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var DataAggregator = /*#__PURE__*/function () {
  // Server communicator should not be used by the repository but until we remove the requestId responsibility from it
  // we have to do it.
  function DataAggregator(wupServerSessionState) {
    _classCallCheck(this, DataAggregator);
    this._wupServerSessionState = wupServerSessionState;
    this.reset();
  }
  return _createClass(DataAggregator, [{
    key: "add",
    value: function add(message) {
      var eventName = message.eventName;
      var data = message.data;
      if (!eventName) {
        throw new Error('Unable to add data message. Missing eventName field');
      }
      if (!data) {
        throw new Error('Unable to add data message. Missing data field');
      }
      this._isEmpty = false;
      this._dataObj[eventName] = this._dataObj[eventName] || [];
      this._dataObj[eventName].push(data);
    }

    /**
     * Takes current data from the aggregator and removes it from the aggregator.
     * Aggregator is reset to initial empty state
     * @returns {{static_fields, key_events, mouse_events}|*}
     */
  }, {
    key: "take",
    value: function take() {
      if (!this._isEmpty) {
        this._dataObj.static_fields.push(['requestId', this._wupServerSessionState.incrementRequestId()]);
      }
      var currentDataObj = this._dataObj;
      this.reset();
      return currentDataObj;
    }
  }, {
    key: "reset",
    value: function reset() {
      this._isEmpty = true;
      this._dataObj = this.getFreshDataObj();
    }
  }, {
    key: "isEmpty",
    value: function isEmpty() {
      return this._isEmpty;
    }
  }, {
    key: "getFreshDataObj",
    value: function getFreshDataObj() {
      return {
        static_fields: [],
        key_events: [],
        mouse_events: []
      };
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/worker/DataDispatcher.js":
/*!****************************************************!*\
  !*** ./js-sdk-legacy/src/worker/DataDispatcher.js ***!
  \****************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ DataDispatcher; }
/* harmony export */ });
/* harmony import */ var _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../main/technicalServices/log/Logger */ "./js-sdk-legacy/src/main/technicalServices/log/Logger.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }


/**
 * This class runs in the worker side. Responsible for sending the data received
 * to the server. The class aggregates the data and sends it periodically to the server (_sendToServerInterval)
 *  @param serverCommunicator - ServerCommunicator class type
 *  @para, aggregator - responsible for aggregating the data and packing it for delivery
 *  @param wupCtor - Wup class
 *  @param sendRateConfigKey - interval configuration field name for updates
 *  @param sendToServerInterval - interval initial configuration
 */
var DataDispatcher = /*#__PURE__*/function () {
  function DataDispatcher(serverClient, aggregator, wupDispatchRateCalculatorFactory, wupDispatchRateSettings) {
    _classCallCheck(this, DataDispatcher);
    this._serverClient = serverClient;
    this._aggregator = aggregator;
    this._wupDispatchRateCalculatorFactory = wupDispatchRateCalculatorFactory;
    this._wupDispatchRateSettings = wupDispatchRateSettings;
    this._wupDispatchRateCalculator = this._wupDispatchRateCalculatorFactory.create(this._wupDispatchRateSettings);
    this._sendToServerInterval = this._wupDispatchRateCalculator.getRate();
    this._setDispatchInterval(this._sendToServerInterval);
  }
  return _createClass(DataDispatcher, [{
    key: "add",
    value: function add(message) {
      this._aggregator.add(message);
    }
  }, {
    key: "sendIfRequired",
    value: function sendIfRequired() {
      var shouldFlush = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      if (this._sendToServerInterval === 0 || shouldFlush) {
        this._sendToServer(shouldFlush);
      }
    }
  }, {
    key: "updateByConfig",
    value: function updateByConfig(wupDispatchRateSettings) {
      if (!wupDispatchRateSettings) {
        return;
      }
      if (wupDispatchRateSettings.type !== this._wupDispatchRateSettings.type) {
        this._wupDispatchRateCalculator = this._wupDispatchRateCalculatorFactory.create(wupDispatchRateSettings);
      } else {
        this._wupDispatchRateCalculator.updateSettings(wupDispatchRateSettings);
      }
      this._sendToServerInterval = this._wupDispatchRateCalculator.getRate();
      this._setDispatchInterval(this._sendToServerInterval);
      this._wupDispatchRateSettings = wupDispatchRateSettings;
    }
  }, {
    key: "scheduleNextDispatching",
    value: function scheduleNextDispatching() {
      // Get the new rate for dispatching the wups
      var newRate = this._wupDispatchRateCalculator.getRate();

      // Update the rate if it is different than the current one we are working at
      if (newRate !== this._sendToServerInterval) {
        this._sendToServerInterval = newRate;
        this._setDispatchInterval(this._sendToServerInterval);
      }
    }
  }, {
    key: "_sendToServer",
    value: function _sendToServer() {
      var shouldFlush = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_0__["default"].debug('Sending a message to the server');
      if (!this._serverClient.isReady()) {
        _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_0__["default"].info("".concat(this._serverClient.constructor.name, " is not ready. Message will not be sent to server"));
        return;
      }

      // If there is no data to send we abort at this point
      if (this._aggregator.isEmpty()) {
        return;
      }
      this._serverClient.sendData(this._aggregator.take(), shouldFlush);
      this.scheduleNextDispatching();
    }
  }, {
    key: "_setDispatchInterval",
    value: function _setDispatchInterval(interval) {
      if (this._sendIntervalId) {
        clearInterval(this._sendIntervalId);
        this._sendIntervalId = null;
      }
      if (interval !== 0) {
        this._sendIntervalId = setInterval(this._sendToServer.bind(this), interval);
      }
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/worker/LogAggregator.js":
/*!***************************************************!*\
  !*** ./js-sdk-legacy/src/worker/LogAggregator.js ***!
  \***************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ LogAggregator; }
/* harmony export */ });
/* harmony import */ var _main_technicalServices_log_LogLevel__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../main/technicalServices/log/LogLevel */ "./js-sdk-legacy/src/main/technicalServices/log/LogLevel.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/*
Aggregates log messages
 */

var LogAggregator = /*#__PURE__*/function () {
  function LogAggregator() {
    _classCallCheck(this, LogAggregator);
    this.reset();
  }
  return _createClass(LogAggregator, [{
    key: "setLogLevel",
    value: function setLogLevel(logLevel) {
      this._logLevel = logLevel;
    }
  }, {
    key: "add",
    value: function add(message) {
      var messageData = message.data;
      if (!messageData) {
        throw new Error('Unable to add log message. Missing data field');
      }

      //We add message to log if:
      // 1. messsage has no level (performance ("perf") events that are posted to worker for logging)
      // 2. logLevel of the message >= the level of the log
      if (!messageData.level || messageData.level >= this._logLevel) {
        this._Q.push(messageData);
      }
    }

    /**
     * Takes current data from the aggregator and removes it from the aggregator.
     * Aggregator is reset to initial empty state
     * @returns {Array}
     */
  }, {
    key: "take",
    value: function take() {
      var currentQ = this._Q;
      this.reset();
      return currentQ;
    }
  }, {
    key: "reset",
    value: function reset() {
      this._Q = [];
      this.setLogLevel(typeof this._logLevel === "undefined" ? _main_technicalServices_log_LogLevel__WEBPACK_IMPORTED_MODULE_0__.LogLevel.INFO : this._logLevel);
    }
  }, {
    key: "isEmpty",
    value: function isEmpty() {
      return this._Q.length === 0;
    }
  }, {
    key: "filterOutByLogLevel",
    value: function filterOutByLogLevel(logLevel) {
      this._Q = this._Q.filter(
      // eslint-disable-next-line no-unused-vars
      function (value, index, arr) {
        return value.level >= logLevel;
      });
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/worker/MessageProcessor.js":
/*!******************************************************!*\
  !*** ./js-sdk-legacy/src/worker/MessageProcessor.js ***!
  \******************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ MessageProcessor; }
/* harmony export */ });
/* harmony import */ var _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../main/technicalServices/log/Logger */ "./js-sdk-legacy/src/main/technicalServices/log/Logger.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }

var MessageProcessor = /*#__PURE__*/function () {
  function MessageProcessor(dataDispatcher) {
    _classCallCheck(this, MessageProcessor);
    this._dataDispatcher = dataDispatcher;
  }

  /**
   * Initial message processing. Understands if the message is an array of messages or a single message (why do we even send different structures?!?!?!?!)
   * and forwards accordingly for message processing.
   * Finally the method triggers the wup dispatcher data send if required.
   * @param message
   */
  return _createClass(MessageProcessor, [{
    key: "process",
    value: function process(message) {
      if (!message) {
        throw new Error('Invalid message received for processing.');
      }
      var shouldFlush = false;
      if (Array.isArray(message)) {
        for (var i = 0, len = message.length; i < len; i++) {
          // Check if flush was requested on one of the messages or if flush was already requested just keep it true
          shouldFlush = this._processSingleMessage(message[i]) || shouldFlush;
        }
      } else {
        // Check if flush was requested on one of the messages or if flush was already requested just keep it true
        shouldFlush = this._processSingleMessage(message) || shouldFlush;
      }
      this._dataDispatcher.sendIfRequired(shouldFlush);
    }

    /**
     * Processes a single message. Decides if the message includes a flush request or is a flush message.
     * Validates the message structure and forwards to wup dispatcher in case there is data to send
     * @param message
     * @returns {boolean} - True if a flush of data is required. False otherwise
     * @private
     */
  }, {
    key: "_processSingleMessage",
    value: function _processSingleMessage(message) {
      // If the message is a flush message containing no data we just return true for the flush
      if (this._isEmptyFlushMessage(message)) {
        return true;
      }

      // In case the message contains the shouldFlush property we mark should flush as true
      // but continue to process the data on the message
      var shouldFlush = false;
      if (message.shouldFlush) {
        shouldFlush = true;
      }
      if (this._isDataValid(message)) {
        this._dataDispatcher.add(message);
      } else {
        var logMessage = 'Received a message with invalid structure. Missing eventName or Data fields';
        _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_0__["default"].error(logMessage);
        throw new Error(logMessage);
      }
      return shouldFlush;
    }
  }, {
    key: "_isEmptyFlushMessage",
    value: function _isEmptyFlushMessage(message) {
      return message.eventName === 'flushData';
    }
  }, {
    key: "_isDataValid",
    value: function _isDataValid(message) {
      return message.eventName && message.data;
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/worker/WorkerService.js":
/*!***************************************************!*\
  !*** ./js-sdk-legacy/src/worker/WorkerService.js ***!
  \***************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ WorkerService; }
/* harmony export */ });
/* harmony import */ var _main_events_WorkerCommand__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../main/events/WorkerCommand */ "./js-sdk-legacy/src/main/events/WorkerCommand.js");
/* harmony import */ var _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../main/technicalServices/log/Logger */ "./js-sdk-legacy/src/main/technicalServices/log/Logger.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/**
 * The class is the worker api entry point. All communication to worker should start here
 */


var WorkerService = /*#__PURE__*/function () {
  function WorkerService(mainCommunicator, wupServerClient, logServerClient, configurationRepository, messageProcessor, logMessageProcessor, wupServerSessionState, dataServerCommunicator) {
    _classCallCheck(this, WorkerService);
    this._mainCommunicator = mainCommunicator;
    this._wupServerClient = wupServerClient;
    this._logServerClient = logServerClient;
    this._configurationRepository = configurationRepository;
    this._messageProcessor = messageProcessor;
    this._logMessageProcessor = logMessageProcessor;
    this._wupServerSessionState = wupServerSessionState;
    this._dataServerCommunicator = dataServerCommunicator;
  }

  /**
   * Start the worker service. Once called the service will start listening for all relevant worker commands and act upon them.
   */
  return _createClass(WorkerService, [{
    key: "start",
    value: function start() {
      _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_1__["default"].debug('Starting Worker Service');
      this._mainCommunicator.addMessageListener(_main_events_WorkerCommand__WEBPACK_IMPORTED_MODULE_0__.WorkerCommand.startNewSessionCommand, this._onStartNewSessionCommand.bind(this));
      this._mainCommunicator.addMessageListener(_main_events_WorkerCommand__WEBPACK_IMPORTED_MODULE_0__.WorkerCommand.resumeSessionCommand, this._onResumeSessionCommand.bind(this));
      this._mainCommunicator.addMessageListener(_main_events_WorkerCommand__WEBPACK_IMPORTED_MODULE_0__.WorkerCommand.changeContextCommand, this._onChangeContextCommand.bind(this));
      this._mainCommunicator.addMessageListener(_main_events_WorkerCommand__WEBPACK_IMPORTED_MODULE_0__.WorkerCommand.updateCsidCommand, this._onUpdateCsidCommand.bind(this));
      this._mainCommunicator.addMessageListener(_main_events_WorkerCommand__WEBPACK_IMPORTED_MODULE_0__.WorkerCommand.updatePsidCommand, this._onUpdatePsidCommand.bind(this));
      this._mainCommunicator.addMessageListener(_main_events_WorkerCommand__WEBPACK_IMPORTED_MODULE_0__.WorkerCommand.updateLogUrlCommand, this._onUpdateLogUrlCommand.bind(this));
      this._mainCommunicator.addMessageListener(_main_events_WorkerCommand__WEBPACK_IMPORTED_MODULE_0__.WorkerCommand.sendDataCommand, this._onSendDataCommand.bind(this));
      this._mainCommunicator.addMessageListener(_main_events_WorkerCommand__WEBPACK_IMPORTED_MODULE_0__.WorkerCommand.sendLogCommand, this._onSendLogCommand.bind(this));
      this._mainCommunicator.addMessageListener(_main_events_WorkerCommand__WEBPACK_IMPORTED_MODULE_0__.WorkerCommand.updateBrandCommand, this._onUpdateBrandCommand.bind(this));
      this._mainCommunicator.addMessageListener(_main_events_WorkerCommand__WEBPACK_IMPORTED_MODULE_0__.WorkerCommand.setAgentTypeCommand, this._setSessionAgentType.bind(this));
      this._mainCommunicator.addMessageListener(_main_events_WorkerCommand__WEBPACK_IMPORTED_MODULE_0__.WorkerCommand.updateAgentIdCommand, this._onUpdateAgentId.bind(this));
      this._mainCommunicator.addMessageListener(_main_events_WorkerCommand__WEBPACK_IMPORTED_MODULE_0__.WorkerCommand.enableWupMessagesHashingCommand, this._setWupMessagesHashing.bind(this));
    }
  }, {
    key: "_onStartNewSessionCommand",
    value: function _onStartNewSessionCommand(command) {
      this._wupServerClient.startNewSession(command.cid, command.protocolType, command.minifiedUri, command.csid, command.psid, command.muid, command.contextName, command.serverAddress);
    }
  }, {
    key: "_onResumeSessionCommand",
    value: function _onResumeSessionCommand(command) {
      this._wupServerClient.resumeSession(command.cdsnum, command.cid, command.protocolType, command.minifiedUri, command.csid, command.psid, command.muid, command.contextName, command.serverAddress, command.serverState);
    }

    /**
     * For cases where the sid is updated during and after init like customer event or late csid
     * Server expects to request ID to start from 0 every new SID. Can also be used to update the wup wrapper
     * fields - (csid, context_name etc)
     * @param data - structure of data - if contains updateParams=true, then fields objects exists,
     * otherwise pass all the data for initialization
     */
  }, {
    key: "_onChangeContextCommand",
    value: function _onChangeContextCommand(data) {
      _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_1__["default"].debug('Worker received a ChangeContextCommand from main.');
      this._wupServerSessionState.setContextName(data.contextName);
    }

    /**
     * Handles the UpdateCsidCommand. Function updates the csid in the server communicator session data and sends an update wup to the server
     * @param data - the csid
     */
  }, {
    key: "_onUpdateCsidCommand",
    value: function _onUpdateCsidCommand(data) {
      _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_1__["default"].debug("Worker received an UpdateCsidCommand from main. CSID: ".concat(data.csid, "."));
      this._wupServerClient.updateCsid(data.csid);
    }

    /**
     * Handles the UpdatePsidCommand. Function updates the psid in the server communicator session data and sends an update wup to the server
     * @param data - the psid
     */
  }, {
    key: "_onUpdatePsidCommand",
    value: function _onUpdatePsidCommand(data) {
      _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_1__["default"].debug("Worker received an UpdatePsidCommand from main. PSID: ".concat(data.psid, "."));
      this._wupServerClient.updatePsid(data.psid);
    }
  }, {
    key: "_onUpdateLogUrlCommand",
    value: function _onUpdateLogUrlCommand(data) {
      /**
       * attach the session identifiers to the worker's Log instance.
       * Log.attachSessionIdentifiers also been called from ConfigurationService.updateLogUrlToWorker so that
       * it Log static instance will be updated as well.
       */
      _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_1__["default"].attachSessionIdentifiers(data.sessionIdentifiers);
      this._logServerClient.setServerUrl(data.logAddress);
    }
  }, {
    key: "_onSendDataCommand",
    value: function _onSendDataCommand(message) {
      this._messageProcessor.process(message);
    }
  }, {
    key: "_onSendLogCommand",
    value: function _onSendLogCommand(message) {
      this._logMessageProcessor.process(message);
    }
  }, {
    key: "_onUpdateBrandCommand",
    value: function _onUpdateBrandCommand(data) {
      this._wupServerClient.updateBrand(data.brand);
    }
  }, {
    key: "_setSessionAgentType",
    value: function _setSessionAgentType(data) {
      this._wupServerSessionState.setAgentType(data.agentType);
    }
  }, {
    key: "_onUpdateAgentId",
    value: function _onUpdateAgentId(data) {
      this._wupServerSessionState.setAgentId(data.agentId);
    }
  }, {
    key: "_setWupMessagesHashing",
    value: function _setWupMessagesHashing(data) {
      this._dataServerCommunicator.updateEnableWupMessagesHashing(data.enableWupMessagesHashing);
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/worker/WorkerStartPoint.js":
/*!******************************************************!*\
  !*** ./js-sdk-legacy/src/worker/WorkerStartPoint.js ***!
  \******************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ WorkerStartPoint; }
/* harmony export */ });
/* harmony import */ var _main_technicalServices_WorkerCommunicator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../main/technicalServices/WorkerCommunicator */ "./js-sdk-legacy/src/main/technicalServices/WorkerCommunicator.js");
/* harmony import */ var _WorkerSysLoader__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./WorkerSysLoader */ "./js-sdk-legacy/src/worker/WorkerSysLoader.js");
/* harmony import */ var _WorkerStatusCategoryType__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./WorkerStatusCategoryType */ "./js-sdk-legacy/src/worker/WorkerStatusCategoryType.js");
/* harmony import */ var _main_events_HeartBeatEvent__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../main/events/HeartBeatEvent */ "./js-sdk-legacy/src/main/events/HeartBeatEvent.js");
/* harmony import */ var _main_technicalServices_MessageBus__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../main/technicalServices/MessageBus */ "./js-sdk-legacy/src/main/technicalServices/MessageBus.js");
/* harmony import */ var _main_events_MessageBusEventType__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../main/events/MessageBusEventType */ "./js-sdk-legacy/src/main/events/MessageBusEventType.js");
/* harmony import */ var _main_infrastructure_CDPort__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../main/infrastructure/CDPort */ "./js-sdk-legacy/src/main/infrastructure/CDPort.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }








var WorkerStartPoint = /*#__PURE__*/function () {
  function WorkerStartPoint() {
    _classCallCheck(this, WorkerStartPoint);
  }
  return _createClass(WorkerStartPoint, [{
    key: "start",
    value: function start() {
      // start the system
      var mainCommunicator = new _main_technicalServices_WorkerCommunicator__WEBPACK_IMPORTED_MODULE_0__["default"]();
      var msgBus = new _main_technicalServices_MessageBus__WEBPACK_IMPORTED_MODULE_4__["default"]();
      var workerSysLoader = new _WorkerSysLoader__WEBPACK_IMPORTED_MODULE_1__["default"](mainCommunicator, msgBus);
      this._loadWorkerSystem(mainCommunicator, msgBus, workerSysLoader, new _main_infrastructure_CDPort__WEBPACK_IMPORTED_MODULE_6__["default"](self));
    }
  }, {
    key: "_loadWorkerSystem",
    value: function _loadWorkerSystem(mainCommunicator, msgBus, workerSysLoader, port) {
      try {
        mainCommunicator.setMessagingPort(port);
        workerSysLoader.loadSystem();
        msgBus.publish(_main_events_MessageBusEventType__WEBPACK_IMPORTED_MODULE_5__.MessageBusEventType.WorkerSystemStatusEvent, new _main_events_HeartBeatEvent__WEBPACK_IMPORTED_MODULE_3__["default"](_WorkerStatusCategoryType__WEBPACK_IMPORTED_MODULE_2__.WorkerStatusCategoryType.WorkerSetup, _main_events_HeartBeatEvent__WEBPACK_IMPORTED_MODULE_3__.statusTypes.Ok));
      } catch (e) {
        msgBus.publish(_main_events_MessageBusEventType__WEBPACK_IMPORTED_MODULE_5__.MessageBusEventType.WorkerSystemStatusEvent, new _main_events_HeartBeatEvent__WEBPACK_IMPORTED_MODULE_3__["default"](_WorkerStatusCategoryType__WEBPACK_IMPORTED_MODULE_2__.WorkerStatusCategoryType.WorkerSetup, _main_events_HeartBeatEvent__WEBPACK_IMPORTED_MODULE_3__.statusTypes.Error));
      }
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/worker/WorkerStatusCategoryType.js":
/*!**************************************************************!*\
  !*** ./js-sdk-legacy/src/worker/WorkerStatusCategoryType.js ***!
  \**************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   WorkerStatusCategoryType: function() { return /* binding */ WorkerStatusCategoryType; }
/* harmony export */ });
var WorkerStatusCategoryType = {
  // Worker failed to setup, error occurred during load system process
  WorkerSetup: '701',
  // Configuration was not received from WupServer
  ConfigurationReceived: '702',
  // WupServer returned invalid response
  WupServerResponse: '703',
  // Request to WupServer has failed - general error occurred
  WupServerError: '704'
};

/***/ }),

/***/ "./js-sdk-legacy/src/worker/WorkerSysLoader.js":
/*!*****************************************************!*\
  !*** ./js-sdk-legacy/src/worker/WorkerSysLoader.js ***!
  \*****************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ WorkerSysLoader; }
/* harmony export */ });
/* harmony import */ var _main_core_configuration_ConfigurationFields__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../main/core/configuration/ConfigurationFields */ "./js-sdk-legacy/src/main/core/configuration/ConfigurationFields.js");
/* harmony import */ var _main_events_WorkerEvent__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../main/events/WorkerEvent */ "./js-sdk-legacy/src/main/events/WorkerEvent.js");
/* harmony import */ var _main_core_configuration_ConfigurationRepository__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../main/core/configuration/ConfigurationRepository */ "./js-sdk-legacy/src/main/core/configuration/ConfigurationRepository.js");
/* harmony import */ var _communication_WupServerSessionState__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./communication/WupServerSessionState */ "./js-sdk-legacy/src/worker/communication/WupServerSessionState.js");
/* harmony import */ var _communication_LogRequestBodyBuilder__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./communication/LogRequestBodyBuilder */ "./js-sdk-legacy/src/worker/communication/LogRequestBodyBuilder.js");
/* harmony import */ var _communication_ServerCommunicator__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./communication/ServerCommunicator */ "./js-sdk-legacy/src/worker/communication/ServerCommunicator.js");
/* harmony import */ var _communication_LogMessageBuilder__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./communication/LogMessageBuilder */ "./js-sdk-legacy/src/worker/communication/LogMessageBuilder.js");
/* harmony import */ var _wup_DataPacker__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./wup/DataPacker */ "./js-sdk-legacy/src/worker/wup/DataPacker.js");
/* harmony import */ var _communication_LogServerClient__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./communication/LogServerClient */ "./js-sdk-legacy/src/worker/communication/LogServerClient.js");
/* harmony import */ var _wup_WupStatisticsService__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./wup/WupStatisticsService */ "./js-sdk-legacy/src/worker/wup/WupStatisticsService.js");
/* harmony import */ var _wup_dispatching_WupDispatchRateCalculatorFactory__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./wup/dispatching/WupDispatchRateCalculatorFactory */ "./js-sdk-legacy/src/worker/wup/dispatching/WupDispatchRateCalculatorFactory.js");
/* harmony import */ var _DataDispatcher__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./DataDispatcher */ "./js-sdk-legacy/src/worker/DataDispatcher.js");
/* harmony import */ var _LogAggregator__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./LogAggregator */ "./js-sdk-legacy/src/worker/LogAggregator.js");
/* harmony import */ var _MessageProcessor__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./MessageProcessor */ "./js-sdk-legacy/src/worker/MessageProcessor.js");
/* harmony import */ var _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ../main/technicalServices/log/Logger */ "./js-sdk-legacy/src/main/technicalServices/log/Logger.js");
/* harmony import */ var _communication_WupMessageBuilder__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./communication/WupMessageBuilder */ "./js-sdk-legacy/src/worker/communication/WupMessageBuilder.js");
/* harmony import */ var _communication_WupRequestBodyBuilder__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ./communication/WupRequestBodyBuilder */ "./js-sdk-legacy/src/worker/communication/WupRequestBodyBuilder.js");
/* harmony import */ var _communication_WupResponseProcessor__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ./communication/WupResponseProcessor */ "./js-sdk-legacy/src/worker/communication/WupResponseProcessor.js");
/* harmony import */ var _communication_WupServerClient__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! ./communication/WupServerClient */ "./js-sdk-legacy/src/worker/communication/WupServerClient.js");
/* harmony import */ var _DataAggregator__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! ./DataAggregator */ "./js-sdk-legacy/src/worker/DataAggregator.js");
/* harmony import */ var _events_WorkerConfigurationLoadedEventHandler__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! ./events/WorkerConfigurationLoadedEventHandler */ "./js-sdk-legacy/src/worker/events/WorkerConfigurationLoadedEventHandler.js");
/* harmony import */ var _events_WorkerNewSessionStartedEventHandler__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(/*! ./events/WorkerNewSessionStartedEventHandler */ "./js-sdk-legacy/src/worker/events/WorkerNewSessionStartedEventHandler.js");
/* harmony import */ var _events_WorkerServerStateUpdatedEventHandler__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__(/*! ./events/WorkerServerStateUpdatedEventHandler */ "./js-sdk-legacy/src/worker/events/WorkerServerStateUpdatedEventHandler.js");
/* harmony import */ var _events_WorkerWupDispatchRateUpdatedEventHandler__WEBPACK_IMPORTED_MODULE_23__ = __webpack_require__(/*! ./events/WorkerWupDispatchRateUpdatedEventHandler */ "./js-sdk-legacy/src/worker/events/WorkerWupDispatchRateUpdatedEventHandler.js");
/* harmony import */ var _WorkerService__WEBPACK_IMPORTED_MODULE_24__ = __webpack_require__(/*! ./WorkerService */ "./js-sdk-legacy/src/worker/WorkerService.js");
/* harmony import */ var _utils_WorkerUtils__WEBPACK_IMPORTED_MODULE_25__ = __webpack_require__(/*! ./utils/WorkerUtils */ "./js-sdk-legacy/src/worker/utils/WorkerUtils.js");
/* harmony import */ var _WorkerSystemStatusEventHandler__WEBPACK_IMPORTED_MODULE_26__ = __webpack_require__(/*! ./WorkerSystemStatusEventHandler */ "./js-sdk-legacy/src/worker/WorkerSystemStatusEventHandler.js");
/* harmony import */ var _main_technicalServices_log_LogBridge__WEBPACK_IMPORTED_MODULE_27__ = __webpack_require__(/*! ../main/technicalServices/log/LogBridge */ "./js-sdk-legacy/src/main/technicalServices/log/LogBridge.js");
/* harmony import */ var _communication_RetryMessage__WEBPACK_IMPORTED_MODULE_28__ = __webpack_require__(/*! ./communication/RetryMessage */ "./js-sdk-legacy/src/worker/communication/RetryMessage.js");
/* harmony import */ var _main_core_configuration_ConfigurationWrapperWupMessage__WEBPACK_IMPORTED_MODULE_29__ = __webpack_require__(/*! ../main/core/configuration/ConfigurationWrapperWupMessage */ "./js-sdk-legacy/src/main/core/configuration/ConfigurationWrapperWupMessage.js");
/* harmony import */ var _main_core_configuration_ConfigurationWrapperLogMessage__WEBPACK_IMPORTED_MODULE_30__ = __webpack_require__(/*! ../main/core/configuration/ConfigurationWrapperLogMessage */ "./js-sdk-legacy/src/main/core/configuration/ConfigurationWrapperLogMessage.js");
/* harmony import */ var _events_WorkerServerRestoredMuidEventHandler__WEBPACK_IMPORTED_MODULE_31__ = __webpack_require__(/*! ./events/WorkerServerRestoredMuidEventHandler */ "./js-sdk-legacy/src/worker/events/WorkerServerRestoredMuidEventHandler.js");
/* harmony import */ var _events_WorkerStateUpdateFromStorage__WEBPACK_IMPORTED_MODULE_32__ = __webpack_require__(/*! ./events/WorkerStateUpdateFromStorage */ "./js-sdk-legacy/src/worker/events/WorkerStateUpdateFromStorage.js");
/* harmony import */ var _events_WorkerServerNewAgentId__WEBPACK_IMPORTED_MODULE_33__ = __webpack_require__(/*! ./events/WorkerServerNewAgentId */ "./js-sdk-legacy/src/worker/events/WorkerServerNewAgentId.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// eslint-disable-next-line max-classes-per-file


































var WorkerSysLoader = /*#__PURE__*/function () {
  function WorkerSysLoader(mainCommunicator, msgBus) {
    _classCallCheck(this, WorkerSysLoader);
    this._mainCommunicator = mainCommunicator;
    this._msgBus = msgBus;
    this._eventHandlers = [];
  }
  return _createClass(WorkerSysLoader, [{
    key: "loadSystem",
    value: function loadSystem() {
      var _this = this;
      this._configurationRepository = new _main_core_configuration_ConfigurationRepository__WEBPACK_IMPORTED_MODULE_2__["default"]();
      this._wupServerSessionState = new _communication_WupServerSessionState__WEBPACK_IMPORTED_MODULE_3__["default"]();
      this._logRequestBodyBuilder = new _communication_LogRequestBodyBuilder__WEBPACK_IMPORTED_MODULE_4__["default"]();
      this._configurationWrapperLogMessage = new _main_core_configuration_ConfigurationWrapperLogMessage__WEBPACK_IMPORTED_MODULE_30__["default"](this._configurationRepository);
      this._logReMessageSettings = this._configurationWrapperLogMessage.createReMessageSettings();
      this._logRetryMessage = new _communication_RetryMessage__WEBPACK_IMPORTED_MODULE_28__["default"](this._logReMessageSettings);
      this._logServerCommunicator = new _communication_ServerCommunicator__WEBPACK_IMPORTED_MODULE_5__["default"](this._logRequestBodyBuilder, this._configurationRepository.get(_main_core_configuration_ConfigurationFields__WEBPACK_IMPORTED_MODULE_0__.ConfigurationFields.serverCommunicationSettings), _utils_WorkerUtils__WEBPACK_IMPORTED_MODULE_25__["default"], this._logRetryMessage, true, 'log');
      this._logMessageBuilder = new _communication_LogMessageBuilder__WEBPACK_IMPORTED_MODULE_6__["default"](new _wup_DataPacker__WEBPACK_IMPORTED_MODULE_7__["default"]());
      this._logServerClient = new _communication_LogServerClient__WEBPACK_IMPORTED_MODULE_8__["default"](this._logServerCommunicator, this._logMessageBuilder, this._configurationRepository);
      this._wupStatisticsService = new _wup_WupStatisticsService__WEBPACK_IMPORTED_MODULE_9__["default"](this._configurationRepository.get(_main_core_configuration_ConfigurationFields__WEBPACK_IMPORTED_MODULE_0__.ConfigurationFields.wupStatisticsLogIntervalMs));
      this._wupDispatchRateCalculatorFactory = new _wup_dispatching_WupDispatchRateCalculatorFactory__WEBPACK_IMPORTED_MODULE_10__["default"](this._wupStatisticsService, this._wupServerSessionState);
      var logAggregator = new _LogAggregator__WEBPACK_IMPORTED_MODULE_12__["default"]();
      this._logDataDispatcher = new _DataDispatcher__WEBPACK_IMPORTED_MODULE_11__["default"](this._logServerClient, logAggregator, this._wupDispatchRateCalculatorFactory, this._configurationRepository.get(_main_core_configuration_ConfigurationFields__WEBPACK_IMPORTED_MODULE_0__.ConfigurationFields.logWupDispatchRateSettings));
      var workerLogBridge = new _main_technicalServices_log_LogBridge__WEBPACK_IMPORTED_MODULE_27__["default"](logAggregator, 'worker');
      this._logMessageProcessor = new _MessageProcessor__WEBPACK_IMPORTED_MODULE_13__["default"](this._logDataDispatcher);
      var logger = new _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_14__.Logger(workerLogBridge);
      _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_14__["default"].setLogger(logger);
      this._wupMessageBuilder = new _communication_WupMessageBuilder__WEBPACK_IMPORTED_MODULE_15__["default"](this._wupServerSessionState, new _wup_DataPacker__WEBPACK_IMPORTED_MODULE_7__["default"]());
      this._wupRequestBodyBuilder = new _communication_WupRequestBodyBuilder__WEBPACK_IMPORTED_MODULE_16__["default"](this._wupServerSessionState);
      this._configurationWrapperWupMessage = new _main_core_configuration_ConfigurationWrapperWupMessage__WEBPACK_IMPORTED_MODULE_29__["default"](this._configurationRepository);
      this._wupReMessageSettings = this._configurationWrapperWupMessage.createReMessageSettings();
      this._wupRetryMessage = new _communication_RetryMessage__WEBPACK_IMPORTED_MODULE_28__["default"](this._wupReMessageSettings);
      this._dataServerCommunicator = new _communication_ServerCommunicator__WEBPACK_IMPORTED_MODULE_5__["default"](this._wupRequestBodyBuilder, this._configurationRepository.get(_main_core_configuration_ConfigurationFields__WEBPACK_IMPORTED_MODULE_0__.ConfigurationFields.serverCommunicationSettings), _utils_WorkerUtils__WEBPACK_IMPORTED_MODULE_25__["default"], this._wupRetryMessage, false, 'wup');
      this._wupResponseProcessor = new _communication_WupResponseProcessor__WEBPACK_IMPORTED_MODULE_17__["default"](this._wupServerSessionState, this._msgBus, this._configurationRepository);
      this._wupServerClient = new _communication_WupServerClient__WEBPACK_IMPORTED_MODULE_18__["default"](this._dataServerCommunicator, this._wupMessageBuilder, this._wupServerSessionState, this._wupStatisticsService, this._wupResponseProcessor, this._configurationRepository, this._msgBus);
      var wupDispatchRateSettings = this._configurationRepository.get(_main_core_configuration_ConfigurationFields__WEBPACK_IMPORTED_MODULE_0__.ConfigurationFields.forceDynamicDataWupDispatchSettings) ? _main_core_configuration_ConfigurationRepository__WEBPACK_IMPORTED_MODULE_2__.ConfigurationDefaultTemplates.defaultDynamicWupDispatchRateConfiguration : this._configurationRepository.get(_main_core_configuration_ConfigurationFields__WEBPACK_IMPORTED_MODULE_0__.ConfigurationFields.dataWupDispatchRateSettings);
      this._dataDispatcher = new _DataDispatcher__WEBPACK_IMPORTED_MODULE_11__["default"](this._wupServerClient, new _DataAggregator__WEBPACK_IMPORTED_MODULE_19__["default"](this._wupServerSessionState), this._wupDispatchRateCalculatorFactory, wupDispatchRateSettings);
      this._messageProcessor = new _MessageProcessor__WEBPACK_IMPORTED_MODULE_13__["default"](this._dataDispatcher);

      // Create the event handlers
      this._eventHandlers.push(new _events_WorkerConfigurationLoadedEventHandler__WEBPACK_IMPORTED_MODULE_20__["default"](this._msgBus, this._wupStatisticsService, this._dataDispatcher, this._logDataDispatcher, this._dataServerCommunicator, this._wupServerClient, this._logServerClient, logger, this._mainCommunicator));
      this._eventHandlers.push(new _events_WorkerNewSessionStartedEventHandler__WEBPACK_IMPORTED_MODULE_21__["default"](this._msgBus, logger, this._mainCommunicator));
      this._eventHandlers.push(new _events_WorkerServerStateUpdatedEventHandler__WEBPACK_IMPORTED_MODULE_22__["default"](this._msgBus, logger, this._mainCommunicator));
      this._eventHandlers.push(new _events_WorkerWupDispatchRateUpdatedEventHandler__WEBPACK_IMPORTED_MODULE_23__["default"](this._msgBus, this._dataDispatcher, logger));
      this._eventHandlers.push(new _WorkerSystemStatusEventHandler__WEBPACK_IMPORTED_MODULE_26__["default"](this._mainCommunicator, this._msgBus, logger));
      this._eventHandlers.push(new _events_WorkerServerRestoredMuidEventHandler__WEBPACK_IMPORTED_MODULE_31__["default"](this._msgBus, this._mainCommunicator));
      this._eventHandlers.push(new _events_WorkerStateUpdateFromStorage__WEBPACK_IMPORTED_MODULE_32__["default"](this._mainCommunicator, this._wupServerSessionState, this._logServerClient));
      this._eventHandlers.push(new _events_WorkerServerNewAgentId__WEBPACK_IMPORTED_MODULE_33__["default"](this._msgBus, this._mainCommunicator));

      // update the main with the server state on each response from server. Currently 'onServerStateUpdated' is triggered only for requestId changes
      // we should probably get rid soon and move it to the bus event handler
      this._wupServerSessionState.onServerStateUpdated.subscribe(function (serverState) {
        _this._mainCommunicator.sendAsync(_main_events_WorkerEvent__WEBPACK_IMPORTED_MODULE_1__.WorkerEvent.ServerStateUpdatedEvent, serverState);
      });
      this._workerService = new _WorkerService__WEBPACK_IMPORTED_MODULE_24__["default"](this._mainCommunicator, this._wupServerClient, this._logServerClient, this._configurationRepository, this._messageProcessor, this._logMessageProcessor, this._wupServerSessionState, this._dataServerCommunicator);
      this._workerService.start();
      _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_14__["default"].info('Loaded worker');
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/worker/WorkerSystemStatusEventHandler.js":
/*!********************************************************************!*\
  !*** ./js-sdk-legacy/src/worker/WorkerSystemStatusEventHandler.js ***!
  \********************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ WorkerSystemStatusEventHandler; }
/* harmony export */ });
/* harmony import */ var _main_events_WorkerEvent__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../main/events/WorkerEvent */ "./js-sdk-legacy/src/main/events/WorkerEvent.js");
/* harmony import */ var _main_events_MessageBusEventType__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../main/events/MessageBusEventType */ "./js-sdk-legacy/src/main/events/MessageBusEventType.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }



/**
 * The class purpose is to publish HeartBeat events to main through WorkerCommunicator
 */
var WorkerSystemStatusEventHandler = /*#__PURE__*/function () {
  /**
   *
   * @param mainCommunicator - WorkerCommunicator class
   * @param messageBus
   * @param logger
   */
  function WorkerSystemStatusEventHandler(mainCommunicator, messageBus, logger) {
    _classCallCheck(this, WorkerSystemStatusEventHandler);
    this._mainCommunicator = mainCommunicator;
    this._messageBus = messageBus;
    this._logger = logger;
    this.errors = {};
    this._messageBus.subscribe(_main_events_MessageBusEventType__WEBPACK_IMPORTED_MODULE_1__.MessageBusEventType.WorkerSystemStatusEvent, this._handle.bind(this));
  }

  /**
   * This method creates HeartBeatEvent object and publish it through workerCommunicator
   * @param heartbeatEvent
   */
  return _createClass(WorkerSystemStatusEventHandler, [{
    key: "_handle",
    value: function _handle(heartbeatEvent) {
      this._logger.debug("Sending new HeartBeatStatusEvent - ".concat(heartbeatEvent.category, ", ").concat(heartbeatEvent.status));
      this._mainCommunicator.sendAsync(_main_events_WorkerEvent__WEBPACK_IMPORTED_MODULE_0__.WorkerEvent.HeartBeatStatusEvent, heartbeatEvent);
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/worker/communication/ConfigurationDefaultValues.js":
/*!******************************************************************************!*\
  !*** ./js-sdk-legacy/src/worker/communication/ConfigurationDefaultValues.js ***!
  \******************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ConfigurationDefaultValues: function() { return /* binding */ ConfigurationDefaultValues; }
/* harmony export */ });
var ConfigurationDefaultValues = {
  DEFAULT_RETRY_NUM: 5,
  //Retry 5 times before giving up
  MIN_RETRY_NUM: 1,
  //Retry once
  MAX_RETRY_NUM: 1000,
  //Retry 1000 times before giving up

  DEFAULT_RETRY_INTERVAL: 1000,
  //1 second
  MIN_RETRY_INTERVAL: 100,
  //100 milliseconds
  MAX_RETRY_INTERVAL: 10000,
  //10 seconds

  DEFAULT_GROWTH_PER_FAILURE: 3500,
  //milliseconds
  MIN_GROWTH_PER_FAILURE: 0,
  //Start the growing interval from 0 milliseconds
  MAX_GROWTH_PER_FAILURE: 10000,
  //Increase each interval by 10 seconds

  DEFAULT_INTERVAL_LIMIT: 16000,
  //Don't increase retries for more than 16 seconds
  MIN_INTERVAL_LIMIT: 100,
  //Don't increase retries for more than 100 milliseconds
  MAX_INTERVAL_LIMIT: 300000,
  //Don't increase retries for more than 5 minutes

  MAX_REQUEST_DELAY: 6000,
  DEFAULT_CDS_NUM_EXPIRATION_TIME: 60,
  // 60 minutes
  MIN_CDS_NUM_EXPIRATION_TIME: 1,
  // 1 minutes
  MAX_CDS_NUM_EXPIRATION_TIME: 44640,
  // 44640 minutes = 1 month

  VALUE_DID_NOT_EXIST: 1,
  SUCCESS_IN_CHANGED_EXPIRATION: 0,
  FAILURE_IN_CHANGED_EXPIRATION: -1
};

/***/ }),

/***/ "./js-sdk-legacy/src/worker/communication/Constants.js":
/*!*************************************************************!*\
  !*** ./js-sdk-legacy/src/worker/communication/Constants.js ***!
  \*************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DATA_SOURCE_TYPE: function() { return /* binding */ DATA_SOURCE_TYPE; },
/* harmony export */   DEFAULT_WUP_TYPE: function() { return /* binding */ DEFAULT_WUP_TYPE; }
/* harmony export */ });
var DATA_SOURCE_TYPE = 'js';
var DEFAULT_WUP_TYPE = '0';

/***/ }),

/***/ "./js-sdk-legacy/src/worker/communication/LogMessage.js":
/*!**************************************************************!*\
  !*** ./js-sdk-legacy/src/worker/communication/LogMessage.js ***!
  \**************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ LogMessage; }
/* harmony export */ });
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var LogMessage = /*#__PURE__*/function () {
  function LogMessage() {
    _classCallCheck(this, LogMessage);
  }
  return _createClass(LogMessage, [{
    key: "setData",
    value: function setData(data) {
      this._data = data;
    }
  }, {
    key: "getInternalMessage",
    value: function getInternalMessage() {
      return this._data;
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/worker/communication/LogMessageBuilder.js":
/*!*********************************************************************!*\
  !*** ./js-sdk-legacy/src/worker/communication/LogMessageBuilder.js ***!
  \*********************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ LogMessageBuilder; }
/* harmony export */ });
/* harmony import */ var _LogMessage__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./LogMessage */ "./js-sdk-legacy/src/worker/communication/LogMessage.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }

var LogMessageBuilder = /*#__PURE__*/function () {
  function LogMessageBuilder(dataPacker) {
    _classCallCheck(this, LogMessageBuilder);
    this._dataPacker = dataPacker;
  }
  return _createClass(LogMessageBuilder, [{
    key: "build",
    value: function build(data) {
      var logMessage = new _LogMessage__WEBPACK_IMPORTED_MODULE_0__["default"]();
      logMessage.setData(this._dataPacker.pack(data));
      return logMessage;
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/worker/communication/LogRequestBodyBuilder.js":
/*!*************************************************************************!*\
  !*** ./js-sdk-legacy/src/worker/communication/LogRequestBodyBuilder.js ***!
  \*************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ LogRequestBodyBuilder; }
/* harmony export */ });
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var LogRequestBodyBuilder = /*#__PURE__*/function () {
  function LogRequestBodyBuilder() {
    _classCallCheck(this, LogRequestBodyBuilder);
  }
  return _createClass(LogRequestBodyBuilder, [{
    key: "build",
    value: function build(logMessage) {
      return logMessage.getInternalMessage();
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/worker/communication/LogServerClient.js":
/*!*******************************************************************!*\
  !*** ./js-sdk-legacy/src/worker/communication/LogServerClient.js ***!
  \*******************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ LogServerClient; }
/* harmony export */ });
/* harmony import */ var _main_core_configuration_ConfigurationFields__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../main/core/configuration/ConfigurationFields */ "./js-sdk-legacy/src/main/core/configuration/ConfigurationFields.js");
/* harmony import */ var _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../main/technicalServices/log/Logger */ "./js-sdk-legacy/src/main/technicalServices/log/Logger.js");
/* harmony import */ var _main_core_configuration_ConfigurationWrapperLogMessage__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../main/core/configuration/ConfigurationWrapperLogMessage */ "./js-sdk-legacy/src/main/core/configuration/ConfigurationWrapperLogMessage.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }



var LogServerClient = /*#__PURE__*/function () {
  function LogServerClient(serverCommunicator, logMessageBuilder, configurationRepository) {
    _classCallCheck(this, LogServerClient);
    this._serverCommunicator = serverCommunicator;
    this._logMessageBuilder = logMessageBuilder;
    this._configurationRepository = configurationRepository;
    this._serverUrl = null;
    this._MESSAGE_SEND_RETRIES = 5;
    this._requestTimeout = this._configurationRepository.get(_main_core_configuration_ConfigurationFields__WEBPACK_IMPORTED_MODULE_0__.ConfigurationFields.logMessageRequestTimeout);
  }
  return _createClass(LogServerClient, [{
    key: "setServerUrl",
    value: function setServerUrl(serverUrl) {
      this._serverUrl = serverUrl;
    }
  }, {
    key: "setIsPaused",
    value: function setIsPaused(state) {
      this._serverCommunicator.setIsPaused(state);
    }
  }, {
    key: "sendData",
    value: function sendData(data) {
      var shouldFlush = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      if (!this._serverUrl) {
        _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_1__["default"].error('Cannot send log message: server URL is not set');
        return;
      }
      var logMessage = this._logMessageBuilder.build(data);
      this._serverCommunicator.sendMessage(logMessage, this._requestTimeout, this._serverCommunicator.getRetryMessage().getMessageNumToRetry(), shouldFlush, this._onSendDataSuccess.bind(this), null, this._onSendDataFailure.bind(this), this._serverUrl);
      if (shouldFlush) {
        this._serverCommunicator.flush();
      }
    }
  }, {
    key: "isReady",
    value: function isReady() {
      return this._serverCommunicator.isReadyToSendData();
    }
  }, {
    key: "setRequestTimeout",
    value: function setRequestTimeout(timeout) {
      this._requestTimeout = timeout;
    }
  }, {
    key: "setConfigurationLogMessage",
    value: function setConfigurationLogMessage() {
      this._configurationWraperLogMessage = new _main_core_configuration_ConfigurationWrapperLogMessage__WEBPACK_IMPORTED_MODULE_2__["default"](this._configurationRepository);
      this._reLogMessageSettings = this._configurationWraperLogMessage.createReMessageSettings();
      this._serverCommunicator.getRetryMessage().updateSettings(this._reLogMessageSettings);
    }
  }, {
    key: "_onSendDataSuccess",
    value: function _onSendDataSuccess(/* responseData */
    ) {
      // No handling for responses from log server since there is no response currently
    }
  }, {
    key: "_onSendDataFailure",
    value: function _onSendDataFailure(response) {
      _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_1__["default"].warn("Failed sending log message. Error: ".concat(response, "."));
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/worker/communication/ReMessageSettings.js":
/*!*********************************************************************!*\
  !*** ./js-sdk-legacy/src/worker/communication/ReMessageSettings.js ***!
  \*********************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ ReMessageSettings; }
/* harmony export */ });
/* harmony import */ var _ConfigurationDefaultValues__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./ConfigurationDefaultValues */ "./js-sdk-legacy/src/worker/communication/ConfigurationDefaultValues.js");
/* harmony import */ var _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../main/technicalServices/log/Logger */ "./js-sdk-legacy/src/main/technicalServices/log/Logger.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }


var ReMessageSettings = /*#__PURE__*/function () {
  function ReMessageSettings(messageNumToRetry, messageRetryInterval, incrementalGrowthBetweenFailures, maxIntervalBetweenFailures) {
    _classCallCheck(this, ReMessageSettings);
    this.messageNumToRetry = messageNumToRetry;
    this.messageRetryInterval = messageRetryInterval;
    this.incrementalGrowthBetweenFailures = incrementalGrowthBetweenFailures;
    this.maxIntervalBetweenFailures = maxIntervalBetweenFailures;
    this.init();
  }
  return _createClass(ReMessageSettings, [{
    key: "init",
    value: function init() {
      this._validateReMessageSettings();
    }
  }, {
    key: "getMessageNumToRetry",
    value: function getMessageNumToRetry() {
      return this.messageNumToRetry;
    }
  }, {
    key: "getMessageRetryInterval",
    value: function getMessageRetryInterval() {
      return this.messageRetryInterval;
    }
  }, {
    key: "getMaxIntervalBetweenFailures",
    value: function getMaxIntervalBetweenFailures() {
      return this.maxIntervalBetweenFailures;
    }
  }, {
    key: "getIncrementalGrowthBetweenFailures",
    value: function getIncrementalGrowthBetweenFailures() {
      return this.incrementalGrowthBetweenFailures;
    }
  }, {
    key: "_validateReMessageSettings",
    value: function _validateReMessageSettings() {
      var logMessage = "The provided configuration is invalid, it must be  ";
      if (!isNaN(this.messageNumToRetry)) {
        var messageNumToRetryToInt = parseInt(this.messageNumToRetry);
        this.messageNumToRetry = messageNumToRetryToInt;
      } else {
        _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_1__["default"].warn("".concat(logMessage, " a number. setting to default: ").concat(_ConfigurationDefaultValues__WEBPACK_IMPORTED_MODULE_0__.ConfigurationDefaultValues.DEFAULT_RETRY_NUM));
        this.messageNumToRetry = _ConfigurationDefaultValues__WEBPACK_IMPORTED_MODULE_0__.ConfigurationDefaultValues.DEFAULT_RETRY_NUM;
      }
      if (this.messageNumToRetry < _ConfigurationDefaultValues__WEBPACK_IMPORTED_MODULE_0__.ConfigurationDefaultValues.MIN_RETRY_NUM || this.messageNumToRetry > _ConfigurationDefaultValues__WEBPACK_IMPORTED_MODULE_0__.ConfigurationDefaultValues.MAX_RETRY_NUM) {
        _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_1__["default"].warn("messageNumToRetry - ".concat(logMessage, " in the following range: \n            ").concat(_ConfigurationDefaultValues__WEBPACK_IMPORTED_MODULE_0__.ConfigurationDefaultValues.MIN_RETRY_NUM, " - ").concat(_ConfigurationDefaultValues__WEBPACK_IMPORTED_MODULE_0__.ConfigurationDefaultValues.MAX_RETRY_NUM, " setting to default: ").concat(_ConfigurationDefaultValues__WEBPACK_IMPORTED_MODULE_0__.ConfigurationDefaultValues.DEFAULT_RETRY_NUM));
        this.messageNumToRetry = _ConfigurationDefaultValues__WEBPACK_IMPORTED_MODULE_0__.ConfigurationDefaultValues.DEFAULT_RETRY_NUM;
      }
      if (this.messageRetryInterval < _ConfigurationDefaultValues__WEBPACK_IMPORTED_MODULE_0__.ConfigurationDefaultValues.MIN_RETRY_INTERVAL || this.messageRetryInterval > _ConfigurationDefaultValues__WEBPACK_IMPORTED_MODULE_0__.ConfigurationDefaultValues.MAX_RETRY_INTERVAL) {
        _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_1__["default"].warn("messageRetryInterval - ".concat(logMessage, " in the following range: \n            [").concat(_ConfigurationDefaultValues__WEBPACK_IMPORTED_MODULE_0__.ConfigurationDefaultValues.MIN_RETRY_INTERVAL, " - ").concat(_ConfigurationDefaultValues__WEBPACK_IMPORTED_MODULE_0__.ConfigurationDefaultValues.MAX_RETRY_INTERVAL, "], \n            setting to default: ").concat(_ConfigurationDefaultValues__WEBPACK_IMPORTED_MODULE_0__.ConfigurationDefaultValues.DEFAULT_RETRY_INTERVAL));
        this.messageRetryInterval = _ConfigurationDefaultValues__WEBPACK_IMPORTED_MODULE_0__.ConfigurationDefaultValues.DEFAULT_RETRY_INTERVAL;
      }
      if (this.incrementalGrowthBetweenFailures < _ConfigurationDefaultValues__WEBPACK_IMPORTED_MODULE_0__.ConfigurationDefaultValues.MIN_GROWTH_PER_FAILURE || this.incrementalGrowthBetweenFailures > _ConfigurationDefaultValues__WEBPACK_IMPORTED_MODULE_0__.ConfigurationDefaultValues.MAX_GROWTH_PER_FAILURE) {
        _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_1__["default"].warn("incrementalGrowthBetweenFailures - ".concat(logMessage, " in the following range: \n            [").concat(_ConfigurationDefaultValues__WEBPACK_IMPORTED_MODULE_0__.ConfigurationDefaultValues.MIN_GROWTH_PER_FAILURE, " - ").concat(_ConfigurationDefaultValues__WEBPACK_IMPORTED_MODULE_0__.ConfigurationDefaultValues.MAX_GROWTH_PER_FAILURE, "],\n                setting to default: ").concat(_ConfigurationDefaultValues__WEBPACK_IMPORTED_MODULE_0__.ConfigurationDefaultValues.DEFAULT_GROWTH_PER_FAILURE));
        this.incrementalGrowthBetweenFailures = _ConfigurationDefaultValues__WEBPACK_IMPORTED_MODULE_0__.ConfigurationDefaultValues.DEFAULT_GROWTH_PER_FAILURE;
      }
      if (this.maxIntervalBetweenFailures < _ConfigurationDefaultValues__WEBPACK_IMPORTED_MODULE_0__.ConfigurationDefaultValues.MIN_INTERVAL_LIMIT || this.maxIntervalBetweenFailures > _ConfigurationDefaultValues__WEBPACK_IMPORTED_MODULE_0__.ConfigurationDefaultValues.MAX_INTERVAL_LIMIT) {
        _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_1__["default"].warn("maxIntervalBetweenFailures - ".concat(logMessage, " in the following range: \n            [").concat(_ConfigurationDefaultValues__WEBPACK_IMPORTED_MODULE_0__.ConfigurationDefaultValues.MIN_INTERVAL_LIMIT, " - ").concat(_ConfigurationDefaultValues__WEBPACK_IMPORTED_MODULE_0__.ConfigurationDefaultValues.MAX_INTERVAL_LIMIT, "]\n                setting to default: ").concat(_ConfigurationDefaultValues__WEBPACK_IMPORTED_MODULE_0__.ConfigurationDefaultValues.DEFAULT_INTERVAL_LIMIT));
        this.maxIntervalBetweenFailures = _ConfigurationDefaultValues__WEBPACK_IMPORTED_MODULE_0__.ConfigurationDefaultValues.DEFAULT_INTERVAL_LIMIT;
      }
      if (this.maxIntervalBetweenFailures < this.messageRetryInterval) {
        _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_1__["default"].warn(" maxIntervalBetweenFailures - ".concat(logMessage, " greater than minimum interval: \n            [").concat(_ConfigurationDefaultValues__WEBPACK_IMPORTED_MODULE_0__.ConfigurationDefaultValues.MIN_INTERVAL_LIMIT, "], setting to defaults:\n                ").concat(_ConfigurationDefaultValues__WEBPACK_IMPORTED_MODULE_0__.ConfigurationDefaultValues.DEFAULT_INTERVAL_LIMIT));
        this.maxIntervalBetweenFailures = _ConfigurationDefaultValues__WEBPACK_IMPORTED_MODULE_0__.ConfigurationDefaultValues.DEFAULT_INTERVAL_LIMIT;
        this.messageRetryInterval = _ConfigurationDefaultValues__WEBPACK_IMPORTED_MODULE_0__.ConfigurationDefaultValues.DEFAULT_RETRY_INTERVAL;
      }
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/worker/communication/RetryMessage.js":
/*!****************************************************************!*\
  !*** ./js-sdk-legacy/src/worker/communication/RetryMessage.js ***!
  \****************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ RetryMessage; }
/* harmony export */ });
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
//  This class is responsible for the logic in case of failure to send message
var RetryMessage = /*#__PURE__*/function () {
  function RetryMessage(reMessageSettings) {
    _classCallCheck(this, RetryMessage);
    this.currentMessageNumberOfSendFailures = 0;
    this.reMessageSettings = reMessageSettings;
    this.currentInterval = this.getMessageRetryInterval();
  }
  //set to initial value
  return _createClass(RetryMessage, [{
    key: "restartMessageSettings",
    value: function restartMessageSettings() {
      this.currentMessageNumberOfSendFailures = 0;
      this.currentInterval = this.getMessageRetryInterval();
    }
    //set to initial value of the settings
  }, {
    key: "updateSettings",
    value: function updateSettings(reMessageSettings) {
      this.reMessageSettings = reMessageSettings;
    }
    //check the values under the min/max constrains
  }, {
    key: "updateAllSettings",
    value: function updateAllSettings(reMessageSettings) {
      reMessageSettings.init();
      this.reMessageSettings = reMessageSettings;
    }
    //getters
  }, {
    key: "getNumberOfSendFailures",
    value: function getNumberOfSendFailures() {
      return this.currentMessageNumberOfSendFailures;
    }
  }, {
    key: "getNextInterval",
    value: function getNextInterval() {
      return this.currentInterval;
    }

    //getters for the initial configuration. needed for testing conditions
  }, {
    key: "getMessageNumToRetry",
    value: function getMessageNumToRetry() {
      return this.reMessageSettings.getMessageNumToRetry();
    }
  }, {
    key: "getMessageRetryInterval",
    value: function getMessageRetryInterval() {
      return this.reMessageSettings.getMessageRetryInterval();
    }
  }, {
    key: "getMaxIntervalBetweenFailures",
    value: function getMaxIntervalBetweenFailures() {
      return this.reMessageSettings.getMaxIntervalBetweenFailures();
    }
  }, {
    key: "getIncrementalGrowthBetweenFailures",
    value: function getIncrementalGrowthBetweenFailures() {
      return this.reMessageSettings.getIncrementalGrowthBetweenFailures();
    }
    /**
     * @param currentMessageNumberOfSendFailures
     * @private
     */
  }, {
    key: "_incrementNumberOfSendFailures",
    value: function _incrementNumberOfSendFailures() {
      this.currentMessageNumberOfSendFailures++;
    }
  }, {
    key: "shouldReMessage",
    value: function shouldReMessage(isMandatory) {
      return isMandatory || this.getNumberOfSendFailures() < this.getMessageNumToRetry();
    }

    //calculate the next interval before remessage
  }, {
    key: "updateRetryInterval",
    value: function updateRetryInterval() {
      var nextInterval = this.currentInterval + this.currentMessageNumberOfSendFailures * this.getIncrementalGrowthBetweenFailures();
      if (nextInterval > this.getMaxIntervalBetweenFailures()) {
        this.currentInterval = this.getMaxIntervalBetweenFailures();
      } else {
        this.currentInterval = nextInterval;
      }
      this._incrementNumberOfSendFailures();
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/worker/communication/ServerCommunicator.js":
/*!**********************************************************************!*\
  !*** ./js-sdk-legacy/src/worker/communication/ServerCommunicator.js ***!
  \**********************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ ServerCommunicator; }
/* harmony export */ });
/* harmony import */ var _main_infrastructure_Queue__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../main/infrastructure/Queue */ "./js-sdk-legacy/src/main/infrastructure/Queue.js");
/* harmony import */ var _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../main/technicalServices/log/Logger */ "./js-sdk-legacy/src/main/technicalServices/log/Logger.js");
/* harmony import */ var _main_technicalServices_DOMUtils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../main/technicalServices/DOMUtils */ "./js-sdk-legacy/src/main/technicalServices/DOMUtils.js");
/* harmony import */ var _services_HashService__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../services/HashService */ "./js-sdk-legacy/src/worker/services/HashService.js");
/* harmony import */ var _main_const_hashing__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../main/const/hashing */ "./js-sdk-legacy/src/main/const/hashing.js");
/* harmony import */ var _main_const_communication__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../main/const/communication */ "./js-sdk-legacy/src/main/const/communication.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }






var ServerCommunicator = /*#__PURE__*/function () {
  function ServerCommunicator(requestBodyBuilder, settings, workerUtils, retryMessage) {
    var acceptNoResponse = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
    var messageDescriptor = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : '';
    _classCallCheck(this, ServerCommunicator);
    this._requestBodyBuilder = requestBodyBuilder;
    this.updateSettings(settings);
    this._workerUtils = workerUtils;
    this._acceptNoResponse = acceptNoResponse;
    this._messageDescriptor = messageDescriptor;
    this.retryMessage = retryMessage;
    this._dataQueue = new _main_infrastructure_Queue__WEBPACK_IMPORTED_MODULE_0__["default"]();
    this._awaitingServerResponse = false;
    this._currentSentItem = null;
    this._sendRetryTimeoutId = null;
    this._shouldRetryToSendMessage = false;

    // An id for a message for easier tracking of logs
    this._messageIdentifier = 0;
    this._enableRequestBodyHashing = false;
    this._isPaused = false;
  }
  return _createClass(ServerCommunicator, [{
    key: "updateSettings",
    value: function updateSettings(settings) {
      this._queueLoadThershold = settings.queueLoadThreshold;
    }
  }, {
    key: "getRetryMessage",
    value: function getRetryMessage() {
      return this.retryMessage;
    }
  }, {
    key: "updateEnableWupMessagesHashing",
    value: function updateEnableWupMessagesHashing(enableRequestBodyHashing) {
      this._enableRequestBodyHashing = enableRequestBodyHashing;
    }

    /**
     * Send a message to the server
     * @param message
     * @param timeout
     * @param maxNumberOfSendAttempts - The max number of send attempts for each message. 0 means infinite attempts
     * @param shouldFlush
     * @param onSuccessResponse
     * @param onMessageRetryFailure
     * @param onMessageFailure
     * @param serverUrl - The URL to send the message to
     */
  }, {
    key: "sendMessage",
    value: function sendMessage(message, timeout, maxNumberOfSendAttempts, shouldFlush, onSuccessResponse, onMessageRetryFailure, onMessageFailure, serverUrl) {
      var _this = this;
      var onSuccess = function onSuccess(responseData) {
        _this._onMessageSendSuccess(responseData, onSuccessResponse);
      };
      var onFailure = function onFailure(responseText, status, statusText) {
        _this._onMessageSendFailure(responseText, status, statusText, onMessageRetryFailure, onMessageFailure);
      };
      this._enqueueMessage(message, timeout, maxNumberOfSendAttempts, shouldFlush, onSuccess, onFailure, serverUrl);
    }
  }, {
    key: "flush",
    value: function flush() {
      this._flushData();
    }
  }, {
    key: "setIsPaused",
    value: function setIsPaused(state) {
      this._isPaused = state;
    }
  }, {
    key: "isReadyToSendData",
    value: function isReadyToSendData() {
      return !this._isPaused;
    }
  }, {
    key: "_onMessageSendSuccess",
    value: function _onMessageSendSuccess(responseData, callback) {
      this._awaitingServerResponse = false;
      this._currentSentItem = null;
      this._shouldRetryToSendMessage = false;
      this.retryMessage.restartMessageSettings();
      callback(responseData);
      this._processNextQueueItem();
    }
  }, {
    key: "_onMessageSendFailure",
    value: function _onMessageSendFailure(responseText, status, statusText, onRetryError, onError) {
      // This should'nt happen but i suspect that it does so for now lets handle the scenario as best as we can
      if (!this._currentSentItem) {
        _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_1__["default"].error("An unexpected error has occurred while handling a ".concat(this._messageDescriptor, " message send failure. Could not find sent item value. Moving to next queued item"));
        this._processNextQueueItem();
        return;
      }
      _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_1__["default"].warn("Failed sending ".concat(this._messageDescriptor, " message #").concat(this._currentSentItem.identifier, ". ").concat(this._buildFailureLog(responseText, status, statusText)));
      this._awaitingServerResponse = false;

      // If maxNumberOfSendAttempts is 0 the message is mandatory and we attempt to send until successful. Otherwise we check the number of send attempts...
      var isMandatoryMessage = this._currentSentItem.maxNumberOfSendAttempts === 0;
      if (!this._isPaused && this.retryMessage.shouldReMessage(isMandatoryMessage)) {
        this._shouldRetryToSendMessage = true;
        _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_1__["default"].info("Trying to send ".concat(this._messageDescriptor, " message #").concat(this._currentSentItem.identifier, " again. Number of send failures is ").concat(this.retryMessage.getNumberOfSendFailures()));
        this._prepareMessageForSendRetry();

        // call onRetryError
        onRetryError && onRetryError(this.retryMessage.getNumberOfSendFailures());
      } else {
        this._shouldRetryToSendMessage = false;
        this.retryMessage.restartMessageSettings();
        _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_1__["default"].warn("Discarding ".concat(this._messageDescriptor, " message #").concat(this._currentSentItem.identifier, " after ").concat(this.retryMessage.getNumberOfSendFailures(), " failed send attempts."));
        // call onRetryError before resetting _currentMessageNumberOfSendFailures
        onRetryError && onRetryError(this.retryMessage.getNumberOfSendFailures());
        this._currentSentItem = null;

        // call onError
        onError && onError(responseText);
        this._processNextQueueItem();
      }
    }
  }, {
    key: "_enqueueMessage",
    value: function _enqueueMessage(message, timeout, maxNumberOfSendAttempts, shouldFlush, onSuccess, onFailure, serverUrl) {
      this._dataQueue.enqueue({
        identifier: this._messageIdentifier++,
        messageToSend: message,
        onSuccess: onSuccess,
        onError: onFailure,
        timeout: timeout,
        maxNumberOfSendAttempts: maxNumberOfSendAttempts,
        serverUrl: serverUrl
      });
      if (!this._shouldRetryToSendMessage) {
        // Clear the retry timeout if set because we are about to retry right now.
        this._clearRetryTimeout();

        // If a flush was requested we flush all that is in the queue before sending the current item
        if (shouldFlush) {
          this._flushData();
        }
        if (!this._awaitingServerResponse) {
          // Process the next queue item if we are not currently waiting for a respomnse from server
          this._processNextQueueItem(shouldFlush);
        }
      }
    }
  }, {
    key: "_processNextQueueItem",
    value: function _processNextQueueItem() {
      var _this2 = this;
      var shouldFlush = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      var shouldDequeue = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      // No items to process
      if (!this._dataQueue.hasItems() && shouldDequeue) {
        return;
      }
      var item = null;
      if (shouldDequeue) {
        item = this._dataQueue.dequeue();
        this._currentSentItem = item;
      } else {
        item = this._currentSentItem;
      }
      var requestBody = this._requestBodyBuilder.build(item.messageToSend, shouldFlush);
      if (this._enableRequestBodyHashing) {
        _services_HashService__WEBPACK_IMPORTED_MODULE_3__["default"].hashSha256(requestBody, function (err, hashedBody) {
          if (err) {
            _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_1__["default"].error(err);
            return;
          }
          _this2._sendProcessedQueueItem(requestBody, item, shouldFlush, hashedBody);
        });
      } else {
        this._sendProcessedQueueItem(requestBody, item, shouldFlush);
      }
    }
  }, {
    key: "_sendProcessedQueueItem",
    value: function _sendProcessedQueueItem(requestBody, item, shouldFlush) {
      var hashedBody = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
      //using 'self' as there's no access to the window object from the worker.
      //Request is not supported by IE 11.
      if (_main_technicalServices_DOMUtils__WEBPACK_IMPORTED_MODULE_2__["default"].isWebWorkerFetchSupported() && shouldFlush) {
        var headers = new Headers();
        if (hashedBody) {
          headers.append(_main_const_hashing__WEBPACK_IMPORTED_MODULE_4__.sha256HeaderName, hashedBody);
        }
        var requestData = {
          method: _main_const_communication__WEBPACK_IMPORTED_MODULE_5__.POST,
          headers: headers,
          body: requestBody,
          keepalive: true
        };
        this._sendWithFetch(requestData, item.serverUrl);
      } else {
        this._sendWithXMLHttpRequest(requestBody, item, hashedBody);
      }
      this._checkQueueLength();
    }
  }, {
    key: "_sendWithFetch",
    value: function _sendWithFetch(requestOptions, serverUrl) {
      this._currentSentItem = null;
      self.fetch(serverUrl, requestOptions);
      _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_1__["default"].info('Flush data was sent by fetch');
    }
  }, {
    key: "_sendWithXMLHttpRequest",
    value: function _sendWithXMLHttpRequest(requestBody, item, hashedBody) {
      this._awaitingServerResponse = true;
      this._workerUtils.getPostUrl(item.serverUrl, _main_const_communication__WEBPACK_IMPORTED_MODULE_5__.POST, requestBody, item.onSuccess, item.onError, this._acceptNoResponse, item.timeout, hashedBody);
    }
  }, {
    key: "_checkQueueLength",
    value: function _checkQueueLength() {
      if (this._dataQueue.length() > this._queueLoadThershold) {
        _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_1__["default"].warn("Data queue has ".concat(this._dataQueue.length(), " items in queue. Might indicate slow\\unstable communication issues."));
      }
    }
  }, {
    key: "_flushData",
    value: function _flushData() {
      while (this._dataQueue.hasItems()) {
        this._processNextQueueItem(true);
      }
    }
  }, {
    key: "_prepareMessageForSendRetry",
    value: function _prepareMessageForSendRetry() {
      var _this3 = this;
      this._clearRetryTimeout();
      this.retryMessage.updateRetryInterval();
      var timeBetweenRetry = this.retryMessage.getNextInterval();
      this._sendRetryTimeoutId = setTimeout(function () {
        _this3._processNextQueueItem(false, false);
      }, timeBetweenRetry);
    }
  }, {
    key: "_clearRetryTimeout",
    value: function _clearRetryTimeout() {
      if (this._sendRetryTimeoutId) {
        clearTimeout(this._sendRetryTimeoutId);
      }
    }
  }, {
    key: "_buildFailureLog",
    value: function _buildFailureLog(responseText, status, statusText) {
      var failureLog = '';
      if (responseText) {
        failureLog += "Response Text: ".concat(responseText, ".");
      }
      if (status) {
        failureLog += "Status: ".concat(status, ".");
      }
      if (statusText) {
        failureLog += "Status Text: ".concat(statusText, ".");
      }
      return failureLog;
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/worker/communication/WupMessage.js":
/*!**************************************************************!*\
  !*** ./js-sdk-legacy/src/worker/communication/WupMessage.js ***!
  \**************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ WupMessage; }
/* harmony export */ });
/* harmony import */ var _Constants__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Constants */ "./js-sdk-legacy/src/worker/communication/Constants.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }

var WupMessage = /*#__PURE__*/function () {
  function WupMessage() {
    _classCallCheck(this, WupMessage);
    this._messageStruct = {
      ds: _Constants__WEBPACK_IMPORTED_MODULE_0__.DATA_SOURCE_TYPE
    };
  }
  return _createClass(WupMessage, [{
    key: "getDataSource",
    value: function getDataSource() {
      return this._messageStruct.ds;
    }
  }, {
    key: "getSid",
    value: function getSid() {
      return this._messageStruct.cdsnum;
    }
  }, {
    key: "setSid",
    value: function setSid(sid) {
      this._messageStruct.cdsnum = sid;
    }
  }, {
    key: "getCsid",
    value: function getCsid() {
      return this._messageStruct.csid;
    }
  }, {
    key: "setCsid",
    value: function setCsid(csid) {
      this._messageStruct.csid = csid;
    }
  }, {
    key: "getPsid",
    value: function getPsid() {
      return this._messageStruct.psid;
    }
  }, {
    key: "setPsid",
    value: function setPsid(psid) {
      this._messageStruct.psid = psid;
    }
  }, {
    key: "getMuid",
    value: function getMuid() {
      return this._messageStruct.muid;
    }
  }, {
    key: "setMuid",
    value: function setMuid(muid) {
      this._messageStruct.muid = muid;
    }
  }, {
    key: "getContextName",
    value: function getContextName() {
      return this._messageStruct.context_name;
    }
  }, {
    key: "setContextName",
    value: function setContextName(contextName) {
      this._messageStruct.context_name = contextName;
    }
  }, {
    key: "getRequestId",
    value: function getRequestId() {
      return this._messageStruct.requestId;
    }
  }, {
    key: "setRequestId",
    value: function setRequestId(requestId) {
      this._messageStruct.requestId = requestId;
    }
  }, {
    key: "getSts",
    value: function getSts() {
      return this._messageStruct.sts;
    }
  }, {
    key: "setSts",
    value: function setSts(sts) {
      this._messageStruct.sts = sts;
    }
  }, {
    key: "getStd",
    value: function getStd() {
      return this._messageStruct.std;
    }
  }, {
    key: "setStd",
    value: function setStd(std) {
      this._messageStruct.std = std;
    }
  }, {
    key: "setFlush",
    value: function setFlush(flushName) {
      this._messageStruct.f = flushName;
    }
  }, {
    key: "getConfigurationName",
    value: function getConfigurationName() {
      return this._messageStruct.c;
    }
  }, {
    key: "setConfigurationName",
    value: function setConfigurationName(configurationName) {
      this._messageStruct.c = configurationName;
    }
  }, {
    key: "getData",
    value: function getData() {
      return this._messageStruct.d;
    }
  }, {
    key: "setData",
    value: function setData(data) {
      this._messageStruct.d = data;
    }
  }, {
    key: "getInternalMessage",
    value: function getInternalMessage() {
      return this._messageStruct;
    }
  }, {
    key: "setOtt",
    value: function setOtt(ott) {
      this._messageStruct.ott = ott;
    }
  }, {
    key: "getOtt",
    value: function getOtt() {
      return this._messageStruct.ott;
    }
  }, {
    key: "setAgentType",
    value: function setAgentType(agentType) {
      this._messageStruct.agent_type = agentType;
    }
  }, {
    key: "getAgentType",
    value: function getAgentType() {
      return this._messageStruct.agent_type;
    }
  }, {
    key: "setAgentId",
    value: function setAgentId(agentId) {
      this._messageStruct.agent_id = agentId;
    }
  }, {
    key: "getAgentId",
    value: function getAgentId() {
      return this._messageStruct.agent_id;
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/worker/communication/WupMessageBuilder.js":
/*!*********************************************************************!*\
  !*** ./js-sdk-legacy/src/worker/communication/WupMessageBuilder.js ***!
  \*********************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ WupMessageBuilder; }
/* harmony export */ });
/* harmony import */ var _WupMessage__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./WupMessage */ "./js-sdk-legacy/src/worker/communication/WupMessage.js");
/* harmony import */ var _Constants__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Constants */ "./js-sdk-legacy/src/worker/communication/Constants.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/**
 * Class is responsible for building a wup message.
 */


var WupMessageBuilder = /*#__PURE__*/function () {
  function WupMessageBuilder(wupServerSessionState, dataPacker) {
    _classCallCheck(this, WupMessageBuilder);
    this._wupServerSessionState = wupServerSessionState;
    this._dataPacker = dataPacker;
  }
  return _createClass(WupMessageBuilder, [{
    key: "build",
    value: function build(wupType, data) {
      var wupMessage = new _WupMessage__WEBPACK_IMPORTED_MODULE_0__["default"]();
      this._updateDataWithBrand(data);

      // Set the SID property. This might be overridden before sending the message
      wupMessage.setSid(this._wupServerSessionState.getSid());
      wupMessage.setCsid(this._wupServerSessionState.getCsid());
      wupMessage.setPsid(this._wupServerSessionState.getPsid());
      wupMessage.setMuid(this._wupServerSessionState.getMuid());
      wupMessage.setContextName(this._wupServerSessionState.getContextName());
      wupMessage.setRequestId(this._wupServerSessionState.getRequestId());
      wupMessage.setAgentType(this._wupServerSessionState.getAgentType());
      wupMessage.setAgentId(this._wupServerSessionState.getAgentId());
      if (this._wupServerSessionState.getSts() && this._wupServerSessionState.getStd()) {
        // Set the STS, STD properties. These might be overridden before sending the message
        wupMessage.setSts(this._wupServerSessionState.getSts());
        wupMessage.setStd(this._wupServerSessionState.getStd());
      }
      var ott = this._wupServerSessionState.getOtt();
      if (ott) {
        wupMessage.setOtt(ott);
      }
      if (wupType === _Constants__WEBPACK_IMPORTED_MODULE_1__.DATA_SOURCE_TYPE) {
        wupMessage.setConfigurationName(wupType);
      } else {
        wupMessage.setData([this._dataPacker.pack(data)]);
      }
      return wupMessage;
    }
  }, {
    key: "_updateDataWithBrand",
    value: function _updateDataWithBrand(data) {
      var brand = this._wupServerSessionState.getBrand();
      if (brand) {
        if (!data.static_fields) {
          data['static_fields'] = [];
        }
        data.static_fields.push(['brand', brand]);
      }
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/worker/communication/WupRequestBodyBuilder.js":
/*!*************************************************************************!*\
  !*** ./js-sdk-legacy/src/worker/communication/WupRequestBodyBuilder.js ***!
  \*************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ WupRequestBodyBuilder; }
/* harmony export */ });
/* harmony import */ var _Constants__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Constants */ "./js-sdk-legacy/src/worker/communication/Constants.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }

var WupRequestBodyBuilder = /*#__PURE__*/function () {
  function WupRequestBodyBuilder(wupServerSessionState) {
    _classCallCheck(this, WupRequestBodyBuilder);
    this._wupServerSessionState = wupServerSessionState;
  }
  return _createClass(WupRequestBodyBuilder, [{
    key: "build",
    value: function build(wupMessage) {
      var shouldFlush = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      wupMessage.setSid(this._wupServerSessionState.getSid());
      wupMessage.setSts(this._wupServerSessionState.getSts());
      wupMessage.setStd(this._wupServerSessionState.getStd());
      wupMessage.setOtt(this._wupServerSessionState.getOtt());
      if (shouldFlush) {
        wupMessage.setFlush(_Constants__WEBPACK_IMPORTED_MODULE_0__.DATA_SOURCE_TYPE);
      }
      return JSON.stringify(wupMessage.getInternalMessage());
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/worker/communication/WupResponseProcessor.js":
/*!************************************************************************!*\
  !*** ./js-sdk-legacy/src/worker/communication/WupResponseProcessor.js ***!
  \************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ WupResponseProcessor; }
/* harmony export */ });
/* harmony import */ var _main_events_MessageBusEventType__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../main/events/MessageBusEventType */ "./js-sdk-legacy/src/main/events/MessageBusEventType.js");
/* harmony import */ var _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../main/technicalServices/log/Logger */ "./js-sdk-legacy/src/main/technicalServices/log/Logger.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }


var WupResponseProcessor = /*#__PURE__*/function () {
  function WupResponseProcessor(wupServerSessionState, messageBus, configurationRepository) {
    _classCallCheck(this, WupResponseProcessor);
    this._wupServerSessionState = wupServerSessionState;
    this._messageBus = messageBus;
    this._configurationRepository = configurationRepository;
  }
  return _createClass(WupResponseProcessor, [{
    key: "process",
    value: function process(response, processConfigurations) {
      //here we are getting updates from the server and checks the nature of message and react upon
      var publishConfigurationLoadedEvent = false;
      if (processConfigurations) {
        this._wupServerSessionState.markConfigurationReceived();
        // Update the worker instance configurations
        this._configurationRepository.loadConfigurations(response);
        publishConfigurationLoadedEvent = true;
      }

      // Update sts if we received an updated one
      if (response.sts) {
        this._wupServerSessionState.setSts(response.sts);
      }

      // Update std if we received an updated one
      if (response.std) {
        this._wupServerSessionState.setStd(response.std);
      }
      if (response.ott) {
        this._wupServerSessionState.setOtt(response.ott);
      }

      // If session was reset and we have a new sid
      if (response.reset_session && response.new_sid) {
        this._wupServerSessionState.setSid(response.new_sid);
      }

      // If we get restored muid from the server
      if (response.rmd) {
        this._wupServerSessionState.setMuid(response.rmd);
        this._messageBus.publish(_main_events_MessageBusEventType__WEBPACK_IMPORTED_MODULE_0__.MessageBusEventType.ServerRestoredMuidEvent, response.rmd);
      }
      if (response.agent_id) {
        this._wupServerSessionState.setAgentId(response.agent_id);
        this._messageBus.publish(_main_events_MessageBusEventType__WEBPACK_IMPORTED_MODULE_0__.MessageBusEventType.ServerNewAgentIdEvent, response.agent_id);
      }

      // Notify on session state change
      this._messageBus.publish(_main_events_MessageBusEventType__WEBPACK_IMPORTED_MODULE_0__.MessageBusEventType.ServerStateUpdatedEvent, {
        requestId: this._wupServerSessionState.getRequestId(),
        sid: this._wupServerSessionState.getSid(),
        sts: this._wupServerSessionState.getSts(),
        std: this._wupServerSessionState.getStd(),
        ott: this._wupServerSessionState.getOtt()
      });

      // Publish the configuration loaded event if required
      if (publishConfigurationLoadedEvent) {
        this._messageBus.publish(_main_events_MessageBusEventType__WEBPACK_IMPORTED_MODULE_0__.MessageBusEventType.ConfigurationLoadedEvent, this._configurationRepository);
      }

      // If session was reset we publish a bus event to handle the case
      if (response.reset_session) {
        if (response.new_sid) {
          this._messageBus.publish(_main_events_MessageBusEventType__WEBPACK_IMPORTED_MODULE_0__.MessageBusEventType.NewSessionStartedEvent, response.new_sid);
        } else {
          _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_1__["default"].warn('Received a reset session flag from the server without a new sid. Ignoring reset.');
        }
      }
      if (response.nextWupInterval) {
        if (response.nextWupInterval !== this._wupServerSessionState.getWupDispatchRate()) {
          this._wupServerSessionState.setWupDispatchRate(response.nextWupInterval);
          this._messageBus.publish(_main_events_MessageBusEventType__WEBPACK_IMPORTED_MODULE_0__.MessageBusEventType.WupDispatchRateUpdatedEvent, this._wupServerSessionState.getWupDispatchRate());
        }
      } else {
        _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_1__["default"].warn("Received an invalid nextWupInterval value of ".concat(response.nextWupInterval, ". Ignoring value."));
      }
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/worker/communication/WupServerClient.js":
/*!*******************************************************************!*\
  !*** ./js-sdk-legacy/src/worker/communication/WupServerClient.js ***!
  \*******************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ WupServerClient; }
/* harmony export */ });
/* harmony import */ var _main_core_configuration_ConfigurationFields__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../main/core/configuration/ConfigurationFields */ "./js-sdk-legacy/src/main/core/configuration/ConfigurationFields.js");
/* harmony import */ var _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../main/technicalServices/log/Logger */ "./js-sdk-legacy/src/main/technicalServices/log/Logger.js");
/* harmony import */ var _WorkerStatusCategoryType__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../WorkerStatusCategoryType */ "./js-sdk-legacy/src/worker/WorkerStatusCategoryType.js");
/* harmony import */ var _main_events_HeartBeatEvent__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../main/events/HeartBeatEvent */ "./js-sdk-legacy/src/main/events/HeartBeatEvent.js");
/* harmony import */ var _main_events_MessageBusEventType__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../main/events/MessageBusEventType */ "./js-sdk-legacy/src/main/events/MessageBusEventType.js");
/* harmony import */ var _main_core_configuration_ConfigurationWrapperWupMessage__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../main/core/configuration/ConfigurationWrapperWupMessage */ "./js-sdk-legacy/src/main/core/configuration/ConfigurationWrapperWupMessage.js");
/* harmony import */ var _Constants__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./Constants */ "./js-sdk-legacy/src/worker/communication/Constants.js");
/* harmony import */ var _main_contract_AgentType__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../main/contract/AgentType */ "./js-sdk-legacy/src/main/contract/AgentType.js");
/* harmony import */ var _main_const_communication__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../../main/const/communication */ "./js-sdk-legacy/src/main/const/communication.js");
/* harmony import */ var _WupUrlBuilder__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./WupUrlBuilder */ "./js-sdk-legacy/src/worker/communication/WupUrlBuilder.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }











var WupServerClient = /*#__PURE__*/function () {
  function WupServerClient(serverCommunicator, wupMessageBuilder, wupServerSessionState, wupStatisticsService, wupResponseProcessor, configurationRepository, msgBus) {
    _classCallCheck(this, WupServerClient);
    this._serverCommunicator = serverCommunicator;
    this._wupMessageBuilder = wupMessageBuilder;
    this._wupServerSessionState = wupServerSessionState;
    this._wupStatisticsService = wupStatisticsService;
    this._wupResponseProcessor = wupResponseProcessor;
    this._configurationRepository = configurationRepository;
    this._msgBus = msgBus;
    // Retry infinite number of times until successful...
    this._INFINITE_MESSAGE_SEND_RETRIES = 0;
    this._retryMessage = this._serverCommunicator.getRetryMessage();
    this._MESSAGE_SEND_RETRIES = this._configurationRepository.get(_main_core_configuration_ConfigurationFields__WEBPACK_IMPORTED_MODULE_0__.ConfigurationFields.wupMessageNumToRetry);
    this._requestTimeout = this._configurationRepository.get(_main_core_configuration_ConfigurationFields__WEBPACK_IMPORTED_MODULE_0__.ConfigurationFields.wupMessageRequestTimeout);
  }
  return _createClass(WupServerClient, [{
    key: "startNewSession",
    value: function startNewSession(cid, protocolType, minifiedUriEnabled, csid, psid, muid, contextName, serverAddress) {
      this._validateCommonSessionRelatedParameters(muid, serverAddress);

      // Reset the request ID since we are starting a new session
      this._wupServerSessionState.setRequestId(0);
      //Reset the brand since the start new session arrived from the api and not from the server
      this._wupServerSessionState.setBrand(null);
      this._sendSessionMessage(null, cid, protocolType, minifiedUriEnabled, csid, psid, muid, contextName, serverAddress, null, this._wupServerSessionState.getRequestId());
    }

    /**
     * Send a new session or resume session message to the server
     * @param sid - the sid if available. If not a new session will be started.
     * @param cid
     * @param protocolType
     * @param minifiedUriEnabled
     * @param csid - csid if available
     * @param psid - psid if available
     * @param muid
     * @param contextName
     * @param serverAddress
     * @param serverState
     * @param requestId
     * @private
     */
  }, {
    key: "_sendSessionMessage",
    value: function _sendSessionMessage(sid, cid, protocolType, minifiedUriEnabled, csid, psid, muid, contextName, serverAddress, serverState, requestId) {
      var _this = this;
      this._initSession(sid, cid, protocolType, minifiedUriEnabled, csid, psid, muid, contextName, serverAddress, serverState, requestId);
      var dataToSend = this._createStaticFieldsPart();

      //We should only request for configurations if we don't have them already and if we don't have a pending request for them
      var shouldRequestConfigurations = !this._wupServerSessionState.getHasConfiguration() && !this._wupServerSessionState.getHasPendingConfigurationRequest();

      //Mark that we are requesting configuration so that we don't do double requests... This can actually
      //happen if a customer for instance calls reset session fast enough
      if (shouldRequestConfigurations) {
        this._wupServerSessionState.markConfigurationRequested();
      }

      // Build the message to be sent
      var message = this._wupMessageBuilder.build(shouldRequestConfigurations ? _Constants__WEBPACK_IMPORTED_MODULE_6__.DATA_SOURCE_TYPE : _Constants__WEBPACK_IMPORTED_MODULE_6__.DEFAULT_WUP_TYPE, dataToSend);
      var onSendSuccess = function onSendSuccess(responseData) {
        // If we don't have configurations yet, we indicate that we expect to receive configurations in the response
        _this._onSendDataSuccess(responseData, shouldRequestConfigurations);
      };
      var serverUrl = (0,_WupUrlBuilder__WEBPACK_IMPORTED_MODULE_9__.buildServerUrl)(serverAddress, protocolType, cid, minifiedUriEnabled);
      this._serverCommunicator.sendMessage(message, this._requestTimeout, shouldRequestConfigurations ? this._INFINITE_MESSAGE_SEND_RETRIES : this._MESSAGE_SEND_RETRIES, false, onSendSuccess, this._onSendDataRetryFailure.bind(this), this._onSendDataFailure.bind(this), serverUrl);
    }
  }, {
    key: "resumeSession",
    value: function resumeSession(sid, cid, protocolType, minifiedUriEnabled, csid, psid, muid, contextName, serverAddress, serverState) {
      this._validateResumeSessionRelatedParameters(sid, muid, serverAddress);

      // if request id is zero or -1 or nan then it mean reset session
      // else just config request, reload page so increment it
      var requestId = serverState && serverState.requestId ? this._wupServerSessionState.setRequestId(serverState.requestId + 1) : this._wupServerSessionState.setRequestId(0);
      this._sendSessionMessage(sid, cid, protocolType, minifiedUriEnabled, csid, psid, muid, contextName, serverAddress, serverState, requestId);
    }
  }, {
    key: "sendData",
    value: function sendData(data) {
      var shouldFlush = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var ottVal = this._wupServerSessionState.getOtt();
      var protocolType = this._wupServerSessionState.getProtocolType();
      var isV4 = protocolType === _main_const_communication__WEBPACK_IMPORTED_MODULE_8__.serverProtocolV4;
      var isV3 = protocolType === _main_const_communication__WEBPACK_IMPORTED_MODULE_8__.serverProtocolV3;
      var isStsStdExists = this._wupServerSessionState.getSts() && this._wupServerSessionState.getStd();
      if (ottVal && isV4 || isStsStdExists && isV3) {
        this._sendMessage(data, shouldFlush);
        return;
      }

      // do not send data if no sts or std on V3 and ott on V4
      var noDataInfoLog = isV4 ? 'ott' : 'sts or std';
      _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_1__["default"].error("Unable to send data. ".concat(noDataInfoLog, " is undefined"));
    }
  }, {
    key: "setRequestTimeout",
    value: function setRequestTimeout(timeout) {
      this._requestTimeout = timeout;
    }
  }, {
    key: "setConfigurationWupMessage",
    value: function setConfigurationWupMessage() {
      this._configurationWrapperWupMessage = new _main_core_configuration_ConfigurationWrapperWupMessage__WEBPACK_IMPORTED_MODULE_5__["default"](this._configurationRepository);
      this._reWupMessageSettings = this._configurationWrapperWupMessage.createReMessageSettings();
      this._retryMessage.updateSettings(this._reWupMessageSettings);
    }

    /**
     * Initializes a new session
     */
  }, {
    key: "_initSession",
    value: function _initSession(sid, cid, protocolType, minifiedUriEnabled, csid, psid, muid, contextName, serverAddress, serverState, requestId) {
      _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_1__["default"].debug("Initializing session. wupUrl:".concat(serverAddress, ", sid:").concat(sid));
      this._wupServerSessionState.setBaseServerUrl(serverAddress);
      this._wupServerSessionState.setSid(sid);
      this._wupServerSessionState.setCid(cid);
      this._wupServerSessionState.setCsid(csid);
      this._wupServerSessionState.setPsid(psid);
      this._wupServerSessionState.setMuid(muid);
      this._wupServerSessionState.setProtocolType(protocolType);
      this._wupServerSessionState.setShouldMinifyUri(minifiedUriEnabled);
      this._wupServerSessionState.setContextName(contextName || '');
      this._wupServerSessionState.setRequestId(requestId, false);
      if (serverState) {
        this._wupServerSessionState.setSts(serverState.sts);
        this._wupServerSessionState.setStd(serverState.std);
        this._wupServerSessionState.setOtt(serverState.ott);
      } else {
        // a new session is starting (maybe as a result of session id change)
        _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_1__["default"].info('Resetting server state of server communicator. Deleting sts and std');
        this._wupServerSessionState.setSts(null);
        this._wupServerSessionState.setStd(null);
        this._wupServerSessionState.setOtt(null);

        // Reset the wup statistics once a new session is starting
        this._wupStatisticsService.resetCounters();
      }
    }
  }, {
    key: "updateCsid",
    value: function updateCsid(csid) {
      // Get the next request id. In case there was no request id we get 0 but this should not happen
      var requestId = this._wupServerSessionState.incrementRequestId() || 0;
      this._wupServerSessionState.setCsid(csid);
      var data = {
        static_fields: []
      };
      data.static_fields.push(['requestId', requestId], ['contextId', this._wupServerSessionState.getContextName()], ['sessionId', this._wupServerSessionState.getSid()], ['customerSessionId', this._wupServerSessionState.getCsid()], ['partnerSessionId', this._wupServerSessionState.getPsid()], ['muid', this._wupServerSessionState.getMuid()]);
      this._sendMessage(data);
    }
  }, {
    key: "updatePsid",
    value: function updatePsid(psid) {
      // Get the next request id. In case there was no request id we get 0 but this should not happen
      var requestId = this._wupServerSessionState.incrementRequestId() || 0;
      this._wupServerSessionState.setPsid(psid);
      var data = {
        static_fields: []
      };
      data.static_fields.push(['requestId', requestId], ['contextId', this._wupServerSessionState.getContextName()], ['sessionId', this._wupServerSessionState.getSid()], ['customerSessionId', this._wupServerSessionState.getCsid()], ['partnerSessionId', this._wupServerSessionState.getPsid()], ['muid', this._wupServerSessionState.getMuid()]);
      this._sendMessage(data);
    }
  }, {
    key: "updateBrand",
    value: function updateBrand(brand) {
      this._wupServerSessionState.setBrand(brand);
    }
  }, {
    key: "isReady",
    value: function isReady() {
      var isCommonReady = this._serverCommunicator.isReadyToSendData();
      var protocolType = this._wupServerSessionState.getProtocolType();

      // on wupserver V4 the std has a default value of 'std'
      if (protocolType === _main_const_communication__WEBPACK_IMPORTED_MODULE_8__.serverProtocolV4) {
        return !!(isCommonReady && this._wupServerSessionState.getOtt());
      }
      // support for wupserver V3
      var isStsStdExists = this._wupServerSessionState.getStd() && this._wupServerSessionState.getSts();
      return !!(isCommonReady && isStsStdExists);
    }

    /**
     * Validate mandatory parameters for session resume
     * These parameters must be sent when session message is sent to server
     * @param sid
     * @param muid
     * @param serverAddress
     * @private
     */
  }, {
    key: "_validateResumeSessionRelatedParameters",
    value: function _validateResumeSessionRelatedParameters(sid, muid, serverAddress) {
      if (!sid) {
        throw new Error("Invalid sid parameter ".concat(sid, ". Unable to start new session"));
      }
      this._validateCommonSessionRelatedParameters(muid, serverAddress);
    }

    /**
     * Validate mandatory parameters for start and resume of session
     * @param muid
     * @param serverAddress
     * @private
     */
  }, {
    key: "_validateCommonSessionRelatedParameters",
    value: function _validateCommonSessionRelatedParameters(muid, serverAddress) {
      if (!muid) {
        if (this._wupServerSessionState.getAgentType() !== _main_contract_AgentType__WEBPACK_IMPORTED_MODULE_7__.AgentType.SECONDARY) {
          throw new Error("Invalid muid parameter ".concat(muid, ". Unable to start new session"));
        }
      }
      if (!serverAddress) {
        throw new Error("Invalid serverAddress parameter ".concat(serverAddress, ". Unable to start new session"));
      }
    }

    /**
     * Create the static fields message part out of the session state
     * @returns {{static_fields: Array}}
     * @private
     */
  }, {
    key: "_createStaticFieldsPart",
    value: function _createStaticFieldsPart() {
      var staticFieldsPart = {
        static_fields: []
      };
      staticFieldsPart.static_fields.push(['requestId', this._wupServerSessionState.getRequestId()], ['contextId', this._wupServerSessionState.getContextName()], ['sessionId', this._wupServerSessionState.getSid()], ['customerSessionId', this._wupServerSessionState.getCsid()], ['partnerSessionId', this._wupServerSessionState.getPsid()], ['muid', this._wupServerSessionState.getMuid()]);
      return staticFieldsPart;
    }

    /**
     * Used to send a regular wup (all except for configuration)
     * @param data
     * @param shouldFlush
     * @private
     */
  }, {
    key: "_sendMessage",
    value: function _sendMessage(data) {
      var shouldFlush = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      // Build the message to be sent
      var wupMessage = this._wupMessageBuilder.build(_Constants__WEBPACK_IMPORTED_MODULE_6__.DEFAULT_WUP_TYPE, data);
      var serverUrl = (0,_WupUrlBuilder__WEBPACK_IMPORTED_MODULE_9__.buildServerUrl)(this._wupServerSessionState.getBaseServerUrl(), this._wupServerSessionState.getProtocolType(), this._wupServerSessionState.getCid(), this._wupServerSessionState.getShouldMinifyUri());
      this._serverCommunicator.sendMessage(wupMessage, this._requestTimeout, this._MESSAGE_SEND_RETRIES, shouldFlush, this._onSendDataSuccess.bind(this), this._onSendDataRetryFailure.bind(this), this._onSendDataFailure.bind(this), serverUrl);
    }
  }, {
    key: "_onSendDataSuccess",
    value: function _onSendDataSuccess(response, expectConfiguration) {
      // If we didn't receive the parameter we default to false
      expectConfiguration = expectConfiguration || false;
      this._publishWorkerSystemStatus(_WorkerStatusCategoryType__WEBPACK_IMPORTED_MODULE_2__.WorkerStatusCategoryType.WupServerError, _main_events_HeartBeatEvent__WEBPACK_IMPORTED_MODULE_3__.statusTypes.Ok);
      this._publishWorkerSystemStatus(_WorkerStatusCategoryType__WEBPACK_IMPORTED_MODULE_2__.WorkerStatusCategoryType.WupServerError, _main_events_HeartBeatEvent__WEBPACK_IMPORTED_MODULE_3__.statusTypes.Ok);
      this._handleSuccessResponse(response, expectConfiguration);
      this._wupStatisticsService.incrementSentWupCount();
    }
  }, {
    key: "_onSendDataRetryFailure",
    value: function _onSendDataRetryFailure(retriesCount) {
      if (retriesCount === this._MESSAGE_SEND_RETRIES) {
        // connectivity error published when retries count reach max value
        this._publishWorkerSystemStatus(_WorkerStatusCategoryType__WEBPACK_IMPORTED_MODULE_2__.WorkerStatusCategoryType.WupServerError, _main_events_HeartBeatEvent__WEBPACK_IMPORTED_MODULE_3__.statusTypes.Error);
      }
    }
  }, {
    key: "_onSendDataFailure",
    value: function _onSendDataFailure(/* response */
    ) {}
  }, {
    key: "_handleSuccessResponse",
    value: function _handleSuccessResponse(response, expectConfiguration) {
      var category = expectConfiguration ? _WorkerStatusCategoryType__WEBPACK_IMPORTED_MODULE_2__.WorkerStatusCategoryType.ConfigurationReceived : _WorkerStatusCategoryType__WEBPACK_IMPORTED_MODULE_2__.WorkerStatusCategoryType.WupServerResponse;
      try {
        var parsedResponse = JSON.parse(response);

        //in the wupResponseProcessor we are using the WupServerSessionState to set the correct received from the server
        this._wupResponseProcessor.process(parsedResponse, expectConfiguration);
        this._publishWorkerSystemStatus(category, _main_events_HeartBeatEvent__WEBPACK_IMPORTED_MODULE_3__.statusTypes.Ok);
      } catch (ex) {
        this._publishWorkerSystemStatus(category, _main_events_HeartBeatEvent__WEBPACK_IMPORTED_MODULE_3__.statusTypes.Error);
        var err = "Failed to parse message from server: ".concat(ex.message);
        _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_1__["default"].error(err, ex);
      }
    }
  }, {
    key: "_publishWorkerSystemStatus",
    value: function _publishWorkerSystemStatus(category, status) {
      this._msgBus.publish(_main_events_MessageBusEventType__WEBPACK_IMPORTED_MODULE_4__.MessageBusEventType.WorkerSystemStatusEvent, new _main_events_HeartBeatEvent__WEBPACK_IMPORTED_MODULE_3__["default"](category, status));
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/worker/communication/WupServerSessionState.js":
/*!*************************************************************************!*\
  !*** ./js-sdk-legacy/src/worker/communication/WupServerSessionState.js ***!
  \*************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ WupServerSessionState; }
/* harmony export */ });
/* harmony import */ var _main_infrastructure_CDEvent__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../main/infrastructure/CDEvent */ "./js-sdk-legacy/src/main/infrastructure/CDEvent.js");
/* harmony import */ var _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../main/technicalServices/log/Logger */ "./js-sdk-legacy/src/main/technicalServices/log/Logger.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }


var DEFAULT_DISPATCH_RATE = 5000;
var WupServerSessionState = /*#__PURE__*/function () {
  function WupServerSessionState() {
    _classCallCheck(this, WupServerSessionState);
    this.onServerStateUpdated = new _main_infrastructure_CDEvent__WEBPACK_IMPORTED_MODULE_0__["default"]();
    this.reset();
  }
  return _createClass(WupServerSessionState, [{
    key: "getSts",
    value: function getSts() {
      return this._sts;
    }
  }, {
    key: "getStd",
    value: function getStd() {
      return this._std;
    }
  }, {
    key: "getSid",
    value: function getSid() {
      return this._sid;
    }
  }, {
    key: "setCid",
    value: function setCid(cid) {
      this._cid = cid;
    }
  }, {
    key: "getCid",
    value: function getCid() {
      return this._cid;
    }
  }, {
    key: "getCsid",
    value: function getCsid() {
      return this._csid;
    }
  }, {
    key: "getPsid",
    value: function getPsid() {
      return this._psid;
    }
  }, {
    key: "getMuid",
    value: function getMuid() {
      return this._muid;
    }
  }, {
    key: "getContextName",
    value: function getContextName() {
      return this._contextName;
    }
  }, {
    key: "getRequestId",
    value: function getRequestId() {
      return this._requestId;
    }
  }, {
    key: "getWupDispatchRate",
    value: function getWupDispatchRate() {
      return this._wupDispatchRate;
    }
  }, {
    key: "getBrand",
    value: function getBrand() {
      return this._brand;
    }
  }, {
    key: "setSts",
    value: function setSts(sts) {
      this._sts = sts;
    }
  }, {
    key: "setStd",
    value: function setStd(std) {
      this._std = std;
    }
  }, {
    key: "setSid",
    value: function setSid(sid) {
      this._sid = sid;
    }
  }, {
    key: "setCsid",
    value: function setCsid(csid) {
      this._csid = csid;
    }
  }, {
    key: "setPsid",
    value: function setPsid(psid) {
      this._psid = psid;
    }
  }, {
    key: "setMuid",
    value: function setMuid(muid) {
      this._muid = muid || null;
    }
  }, {
    key: "setOtt",
    value: function setOtt(ott) {
      this._ott = ott;
    }
  }, {
    key: "getOtt",
    value: function getOtt() {
      return this._ott;
    }
  }, {
    key: "setContextName",
    value: function setContextName(contextName) {
      this._contextName = contextName;
    }
  }, {
    key: "setRequestId",
    value: function setRequestId(requestId) {
      var publishChange = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      this._requestId = requestId;
      if (publishChange) {
        this._publish();
      }
      return this._requestId;
    }
  }, {
    key: "setWupDispatchRate",
    value: function setWupDispatchRate(wupDispatchRate) {
      if (!wupDispatchRate) {
        _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_1__["default"].warn("Wup dispatch rate of ".concat(wupDispatchRate, " is invalid. Ignoring update"));
        return;
      }
      this._wupDispatchRate = wupDispatchRate;
    }
  }, {
    key: "setBrand",
    value: function setBrand(brand) {
      this._brand = brand;
    }
  }, {
    key: "setAgentType",
    value: function setAgentType(agentType) {
      this._agent_type = agentType;
    }
  }, {
    key: "getAgentType",
    value: function getAgentType() {
      return this._agent_type;
    }
  }, {
    key: "setAgentId",
    value: function setAgentId(agentId) {
      this._agent_id = agentId;
    }
  }, {
    key: "getAgentId",
    value: function getAgentId() {
      return this._agent_id;
    }
  }, {
    key: "markConfigurationRequested",
    value: function markConfigurationRequested() {
      if (this._hasConfiguration) {
        _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_1__["default"].warn('We already have configuration. Ignoring the attempt to mark a pending configuration request.');
        return;
      }
      this._hasPendingConfigurationRequest = true;
    }
  }, {
    key: "markConfigurationReceived",
    value: function markConfigurationReceived() {
      if (this._hasConfiguration) {
        _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_1__["default"].warn('Marking that we received configuration although we already received configuration from the server. We shouldn\'t have received it again.');
      } else if (!this._hasPendingConfigurationRequest) {
        _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_1__["default"].warn('Marking that we received configurations although we didn\'t have a pending request for configurations.');
      }
      this._hasPendingConfigurationRequest = false;
      this._hasConfiguration = true;
    }
  }, {
    key: "getHasConfiguration",
    value: function getHasConfiguration() {
      return this._hasConfiguration;
    }
  }, {
    key: "getHasPendingConfigurationRequest",
    value: function getHasPendingConfigurationRequest() {
      return this._hasPendingConfigurationRequest;
    }
  }, {
    key: "incrementRequestId",
    value: function incrementRequestId() {
      this._requestId++;
      this._publish();
      return this._requestId;
    }
  }, {
    key: "resetRequestId",
    value: function resetRequestId() {
      this._requestId = 0;
    }
  }, {
    key: "reset",
    value: function reset() {
      this._ott = null;
      this._sts = null;
      this._std = null;
      this._sid = null;
      this._cid = null;
      this._csid = null;
      this._muid = null;
      this._contextName = null;
      this._requestId = 0;
      this._wupDispatchRate = DEFAULT_DISPATCH_RATE;
      this._hasConfiguration = false;
      this._hasPendingConfigurationRequest = false;
      this._brand = null;
      this._agent_type = null;
      this._agent_id = null;
      this._baseServerUrl = null;
      this._protocolType = null;
      this._shouldMinifyUri = false;
    }
  }, {
    key: "setBaseServerUrl",
    value: function setBaseServerUrl(url) {
      this._baseServerUrl = url;
    }
  }, {
    key: "getBaseServerUrl",
    value: function getBaseServerUrl() {
      return this._baseServerUrl;
    }
  }, {
    key: "setProtocolType",
    value: function setProtocolType(protocolType) {
      this._protocolType = protocolType;
    }
  }, {
    key: "setShouldMinifyUri",
    value: function setShouldMinifyUri(shouldMinifyUri) {
      this._shouldMinifyUri = shouldMinifyUri;
    }
  }, {
    key: "getShouldMinifyUri",
    value: function getShouldMinifyUri() {
      return this._shouldMinifyUri;
    }
  }, {
    key: "getProtocolType",
    value: function getProtocolType() {
      return this._protocolType;
    }
  }, {
    key: "_publish",
    value: function _publish() {
      this.onServerStateUpdated.publish({
        requestId: this._requestId,
        sid: this._sid,
        sts: this._sts,
        std: this._std,
        ott: this._ott
      });
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/worker/communication/WupUrlBuilder.js":
/*!*****************************************************************!*\
  !*** ./js-sdk-legacy/src/worker/communication/WupUrlBuilder.js ***!
  \*****************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   buildServerUrl: function() { return /* binding */ buildServerUrl; }
/* harmony export */ });
/* harmony import */ var _main_const_communication__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../main/const/communication */ "./js-sdk-legacy/src/main/const/communication.js");


/**
 *
 * @param baseUrl for example: https://wup-dtrackers.bc2.customers.biocatch.com
 * @param protocolType 3 for v3 and 4 for v4.
 * @param cid
 * @param minify true if should apply sub-path removal and random segment addition to make-it harder for add-blocks to black-list our server's path pattern.
 * @returns example outputs:
 * in case protocolType === 3 , and minify === false , and cid === dtrackers:
 * the result is: https://wup-dtrackers.bc2.customers.biocatch.com/client/v3.1/web/wup?cid=dtrackers
 *
 * in case protocolType === 4 , and minify === true , and cid === dtrackers:
 * the result is: https://wup-dtrackers.bc2.customers.biocatch.com/v4/random-string  (without cid when minify is true)
 */
function buildServerUrl(baseUrl, protocolType, cid, minify) {
  var path;
  if (minify) {
    if (protocolType === _main_const_communication__WEBPACK_IMPORTED_MODULE_0__.serverProtocolV3) {
      path = _main_const_communication__WEBPACK_IMPORTED_MODULE_0__.minifiedUrlV3Path;
    } else {
      path = _main_const_communication__WEBPACK_IMPORTED_MODULE_0__.minifiedUrlV4Path;
    }
    path += '/' + _generateRandomUrlSafeString();
  } else {
    if (protocolType === _main_const_communication__WEBPACK_IMPORTED_MODULE_0__.serverProtocolV3) {
      path = _main_const_communication__WEBPACK_IMPORTED_MODULE_0__.wupUrlV3Path;
    } else {
      path = _main_const_communication__WEBPACK_IMPORTED_MODULE_0__.wupUrlV4Path;
    }
    path += '?cid=' + cid;
  }
  return baseUrl + '/' + path;
}
function _generateRandomUrlSafeString() {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var length = Math.floor(Math.random() * (20 - 10 + 1)) + 10; // Random length between 10 and 20
  var randomString = '';
  for (var i = 0; i < length; i++) {
    var randomIndex = Math.floor(Math.random() * chars.length);
    randomString += chars[randomIndex];
  }
  return randomString;
}

/***/ }),

/***/ "./js-sdk-legacy/src/worker/events/WorkerConfigurationLoadedEventHandler.js":
/*!**********************************************************************************!*\
  !*** ./js-sdk-legacy/src/worker/events/WorkerConfigurationLoadedEventHandler.js ***!
  \**********************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ WorkerConfigurationLoadedEventHandler; }
/* harmony export */ });
/* harmony import */ var _main_events_MessageBusEventType__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../main/events/MessageBusEventType */ "./js-sdk-legacy/src/main/events/MessageBusEventType.js");
/* harmony import */ var _main_core_configuration_ConfigurationFields__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../main/core/configuration/ConfigurationFields */ "./js-sdk-legacy/src/main/core/configuration/ConfigurationFields.js");
/* harmony import */ var _main_core_configuration_ConfigurationRepository__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../main/core/configuration/ConfigurationRepository */ "./js-sdk-legacy/src/main/core/configuration/ConfigurationRepository.js");
/* harmony import */ var _main_events_WorkerEvent__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../main/events/WorkerEvent */ "./js-sdk-legacy/src/main/events/WorkerEvent.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/**
 * This class is for handling configuration updates in worker
 */




var WorkerConfigurationLoadedEventHandler = /*#__PURE__*/function () {
  function WorkerConfigurationLoadedEventHandler(messageBus, wupStatisticsService, dataDispatcher, logDataDispatcher, serverCommunicator, wupServerClient, logServerClient, logger, mainCommunicator) {
    _classCallCheck(this, WorkerConfigurationLoadedEventHandler);
    this._messageBus = messageBus;
    this._wupStatisticsService = wupStatisticsService;
    this._dataDispatcher = dataDispatcher;
    this._logDataDispatcher = logDataDispatcher;
    this._serverCommunicator = serverCommunicator;
    this._wupServerClient = wupServerClient;
    this._logServerClient = logServerClient;
    this._logger = logger;
    this._mainCommunicator = mainCommunicator;
    this._messageBus.subscribe(_main_events_MessageBusEventType__WEBPACK_IMPORTED_MODULE_0__.MessageBusEventType.ConfigurationLoadedEvent, this._handle.bind(this));
  }
  return _createClass(WorkerConfigurationLoadedEventHandler, [{
    key: "_handle",
    value: function _handle(configurationRepository) {
      this._wupStatisticsService.updateSettings(configurationRepository.get(_main_core_configuration_ConfigurationFields__WEBPACK_IMPORTED_MODULE_1__.ConfigurationFields.wupStatisticsLogIntervalMs));
      var wupDispatcheRateSettings = configurationRepository.get(_main_core_configuration_ConfigurationFields__WEBPACK_IMPORTED_MODULE_1__.ConfigurationFields.forceDynamicDataWupDispatchSettings) ? _main_core_configuration_ConfigurationRepository__WEBPACK_IMPORTED_MODULE_2__.ConfigurationDefaultTemplates.defaultDynamicWupDispatchRateConfiguration : configurationRepository.get(_main_core_configuration_ConfigurationFields__WEBPACK_IMPORTED_MODULE_1__.ConfigurationFields.dataWupDispatchRateSettings);
      this._dataDispatcher.updateByConfig(wupDispatcheRateSettings);
      this._logDataDispatcher.updateByConfig(configurationRepository.get(_main_core_configuration_ConfigurationFields__WEBPACK_IMPORTED_MODULE_1__.ConfigurationFields.logWupDispatchRateSettings));
      this._serverCommunicator.updateSettings(configurationRepository.get(_main_core_configuration_ConfigurationFields__WEBPACK_IMPORTED_MODULE_1__.ConfigurationFields.serverCommunicationSettings));
      this._logger.updateLogConfig(configurationRepository);

      // Update the request timeouts in wup and log server clients. wupResponseTimeout config is deprecated but we still try to take it for backwards compatibility
      this._wupServerClient.setRequestTimeout(configurationRepository.get(_main_core_configuration_ConfigurationFields__WEBPACK_IMPORTED_MODULE_1__.ConfigurationFields.wupMessageRequestTimeout) || configurationRepository.get(_main_core_configuration_ConfigurationFields__WEBPACK_IMPORTED_MODULE_1__.ConfigurationFields.wupResponseTimeout));
      this._logServerClient.setRequestTimeout(configurationRepository.get(_main_core_configuration_ConfigurationFields__WEBPACK_IMPORTED_MODULE_1__.ConfigurationFields.logMessageRequestTimeout));
      this._wupServerClient.setConfigurationWupMessage();
      this._logServerClient.setConfigurationLogMessage();

      // Notify the main thread that configurations were loaded
      this._mainCommunicator.sendAsync(_main_events_WorkerEvent__WEBPACK_IMPORTED_MODULE_3__.WorkerEvent.ConfigurationLoadedEvent, configurationRepository.getAll());
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/worker/events/WorkerNewSessionStartedEventHandler.js":
/*!********************************************************************************!*\
  !*** ./js-sdk-legacy/src/worker/events/WorkerNewSessionStartedEventHandler.js ***!
  \********************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ WorkerNewSessionStartedEventHandler; }
/* harmony export */ });
/* harmony import */ var _main_events_MessageBusEventType__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../main/events/MessageBusEventType */ "./js-sdk-legacy/src/main/events/MessageBusEventType.js");
/* harmony import */ var _main_events_WorkerEvent__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../main/events/WorkerEvent */ "./js-sdk-legacy/src/main/events/WorkerEvent.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/**
 * This class is for handling a new session in worker
 */


var WorkerNewSessionStartedEventHandler = /*#__PURE__*/function () {
  function WorkerNewSessionStartedEventHandler(messageBus, logger, mainCommunicator) {
    _classCallCheck(this, WorkerNewSessionStartedEventHandler);
    this._messageBus = messageBus;
    this._logger = logger;
    this._mainCommunicator = mainCommunicator;
    this._messageBus.subscribe(_main_events_MessageBusEventType__WEBPACK_IMPORTED_MODULE_0__.MessageBusEventType.NewSessionStartedEvent, this._handle.bind(this));
  }
  return _createClass(WorkerNewSessionStartedEventHandler, [{
    key: "_handle",
    value: function _handle(newSid) {
      this._logger.info("Worker received a new session id ".concat(newSid, " from server."));
      this._mainCommunicator.sendAsync(_main_events_WorkerEvent__WEBPACK_IMPORTED_MODULE_1__.WorkerEvent.NewSessionStartedEvent, newSid);
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/worker/events/WorkerServerNewAgentId.js":
/*!*******************************************************************!*\
  !*** ./js-sdk-legacy/src/worker/events/WorkerServerNewAgentId.js ***!
  \*******************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ WorkerServerNewAgentId; }
/* harmony export */ });
/* harmony import */ var _main_events_MessageBusEventType__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../main/events/MessageBusEventType */ "./js-sdk-legacy/src/main/events/MessageBusEventType.js");
/* harmony import */ var _main_events_WorkerEvent__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../main/events/WorkerEvent */ "./js-sdk-legacy/src/main/events/WorkerEvent.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }


var WorkerServerNewAgentId = /*#__PURE__*/function () {
  function WorkerServerNewAgentId(messageBus, mainCommunicator) {
    _classCallCheck(this, WorkerServerNewAgentId);
    this._messageBus = messageBus;
    this._mainCommunicator = mainCommunicator;
    this._messageBus.subscribe(_main_events_MessageBusEventType__WEBPACK_IMPORTED_MODULE_0__.MessageBusEventType.ServerNewAgentIdEvent, this._handle.bind(this));
  }
  return _createClass(WorkerServerNewAgentId, [{
    key: "_handle",
    value: function _handle(agentId) {
      this._mainCommunicator.sendAsync(_main_events_WorkerEvent__WEBPACK_IMPORTED_MODULE_1__.WorkerEvent.ServerNewAgentIdEvent, agentId);
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/worker/events/WorkerServerRestoredMuidEventHandler.js":
/*!*********************************************************************************!*\
  !*** ./js-sdk-legacy/src/worker/events/WorkerServerRestoredMuidEventHandler.js ***!
  \*********************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ WorkerServerRestoredMuidEventHandler; }
/* harmony export */ });
/* harmony import */ var _main_events_MessageBusEventType__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../main/events/MessageBusEventType */ "./js-sdk-legacy/src/main/events/MessageBusEventType.js");
/* harmony import */ var _main_events_WorkerEvent__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../main/events/WorkerEvent */ "./js-sdk-legacy/src/main/events/WorkerEvent.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }



/**
 * This class is for handling server response with a restored muid
 */
var WorkerServerRestoredMuidEventHandler = /*#__PURE__*/function () {
  function WorkerServerRestoredMuidEventHandler(messageBus, mainCommunicator) {
    _classCallCheck(this, WorkerServerRestoredMuidEventHandler);
    this._messageBus = messageBus;
    this._mainCommunicator = mainCommunicator;

    //getting the restored muid should be a one time event, once we get it, we remove the subscription for this event
    this._messageBus.subscribe(_main_events_MessageBusEventType__WEBPACK_IMPORTED_MODULE_0__.MessageBusEventType.ServerRestoredMuidEvent, this._handler.bind(this), true);
  }

  /**
   * when the server sends the restored muid, it will publish a messageBus event. In the main js side
   * on initialization it registers this event to react upon and update what is needed on the client side
   * @param restoredMuid - The restored muid
   */
  return _createClass(WorkerServerRestoredMuidEventHandler, [{
    key: "_handler",
    value: function _handler(restoredMuid) {
      this._mainCommunicator.sendAsync(_main_events_WorkerEvent__WEBPACK_IMPORTED_MODULE_1__.WorkerEvent.ServerRestoredMuidEvent, restoredMuid);
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/worker/events/WorkerServerStateUpdatedEventHandler.js":
/*!*********************************************************************************!*\
  !*** ./js-sdk-legacy/src/worker/events/WorkerServerStateUpdatedEventHandler.js ***!
  \*********************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ WorkerServerStateUpdatedEventHandler; }
/* harmony export */ });
/* harmony import */ var _main_events_MessageBusEventType__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../main/events/MessageBusEventType */ "./js-sdk-legacy/src/main/events/MessageBusEventType.js");
/* harmony import */ var _main_events_WorkerEvent__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../main/events/WorkerEvent */ "./js-sdk-legacy/src/main/events/WorkerEvent.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/**
 * This class is for handling a session state update (modified sts or std received from server or a requestId which was modified)
 */


var WorkerServerStateUpdatedEventHandler = /*#__PURE__*/function () {
  function WorkerServerStateUpdatedEventHandler(messageBus, logger, mainCommunicator) {
    _classCallCheck(this, WorkerServerStateUpdatedEventHandler);
    this._messageBus = messageBus;
    this._logger = logger;
    this._mainCommunicator = mainCommunicator;
    this._messageBus.subscribe(_main_events_MessageBusEventType__WEBPACK_IMPORTED_MODULE_0__.MessageBusEventType.ServerStateUpdatedEvent, this._handle.bind(this));
  }
  return _createClass(WorkerServerStateUpdatedEventHandler, [{
    key: "_handle",
    value: function _handle(newServerState) {
      this._logger.debug('Worker received an updated server state.');
      this._mainCommunicator.sendAsync(_main_events_WorkerEvent__WEBPACK_IMPORTED_MODULE_1__.WorkerEvent.ServerStateUpdatedEvent, newServerState);
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/worker/events/WorkerStateUpdateFromStorage.js":
/*!*************************************************************************!*\
  !*** ./js-sdk-legacy/src/worker/events/WorkerStateUpdateFromStorage.js ***!
  \*************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ WorkerStateUpdateFromStorage; }
/* harmony export */ });
/* harmony import */ var _main_events_WorkerCommand__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../main/events/WorkerCommand */ "./js-sdk-legacy/src/main/events/WorkerCommand.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }

var WorkerStateUpdateFromStorage = /*#__PURE__*/function () {
  function WorkerStateUpdateFromStorage(mainCommunicator, wupServerSessionState, logServerClient) {
    _classCallCheck(this, WorkerStateUpdateFromStorage);
    this._mainCommunicator = mainCommunicator;
    this._wupServerSessionState = wupServerSessionState;
    this._logServerClient = logServerClient;
    this._mainCommunicator.addMessageListener(_main_events_WorkerCommand__WEBPACK_IMPORTED_MODULE_0__.WorkerCommand.stateUpdateFromStorage, this._handle.bind(this));
    this._mainCommunicator.addMessageListener(_main_events_WorkerCommand__WEBPACK_IMPORTED_MODULE_0__.WorkerCommand.updateSDKStateCommand, this._handleStateChanged.bind(this));
  }
  return _createClass(WorkerStateUpdateFromStorage, [{
    key: "_handle",
    value: function _handle(msg) {
      if (msg !== null && msg !== void 0 && msg.requestId && (msg !== null && msg !== void 0 && msg.ott || msg !== null && msg !== void 0 && msg.sts)) {
        this._wupServerSessionState.setRequestId(msg.requestId, false);
        this._wupServerSessionState.setOtt(msg.ott);
        this._wupServerSessionState.setSts(msg.sts);
        this._wupServerSessionState.setStd(msg.std);
      }
    }
  }, {
    key: "_handleStateChanged",
    value: function _handleStateChanged(newState) {
      this._logServerClient.setIsPaused(newState.SDK_state);
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/worker/events/WorkerWupDispatchRateUpdatedEventHandler.js":
/*!*************************************************************************************!*\
  !*** ./js-sdk-legacy/src/worker/events/WorkerWupDispatchRateUpdatedEventHandler.js ***!
  \*************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ WorkerWupDispatchRateUpdatedEventHandler; }
/* harmony export */ });
/* harmony import */ var _main_events_MessageBusEventType__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../main/events/MessageBusEventType */ "./js-sdk-legacy/src/main/events/MessageBusEventType.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/**
 * This class is for handling an update to the wup dispatch rate in worker
 */

var WorkerWupDispatchRateUpdatedEventHandler = /*#__PURE__*/function () {
  function WorkerWupDispatchRateUpdatedEventHandler(messageBus, dataDispatcher, logger) {
    _classCallCheck(this, WorkerWupDispatchRateUpdatedEventHandler);
    this._messageBus = messageBus;
    this._dataDispatcher = dataDispatcher;
    this._logger = logger;
    this._messageBus.subscribe(_main_events_MessageBusEventType__WEBPACK_IMPORTED_MODULE_0__.MessageBusEventType.WupDispatchRateUpdatedEvent, this._handle.bind(this));
  }
  return _createClass(WorkerWupDispatchRateUpdatedEventHandler, [{
    key: "_handle",
    value: function _handle(newWupDispatchRate) {
      this._logger.info("Worker received a wup dispatch rate ".concat(newWupDispatchRate, " from server."));
      this._dataDispatcher.scheduleNextDispatching();
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/worker/libs/msgpack.min.js":
/*!******************************************************!*\
  !*** ./js-sdk-legacy/src/worker/libs/msgpack.min.js ***!
  \******************************************************/
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
!function (t) {
  if ("object" == ( false ? 0 : _typeof(exports)) && "undefined" != "object") module.exports = t();else if (true) !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_FACTORY__ = (t),
		__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
		(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));else // removed by dead control flow
{ var r; }
}(function () {
  return function t(r, e, n) {
    function i(f, u) {
      if (!e[f]) {
        if (!r[f]) {
          var a = undefined;
          if (!u && a) return require(f, !0);
          if (o) return o(f, !0);
          var s = new Error("Cannot find module '" + f + "'");
          throw s.code = "MODULE_NOT_FOUND", s;
        }
        var c = e[f] = {
          exports: {}
        };
        r[f][0].call(c.exports, function (t) {
          var e = r[f][1][t];
          return i(e ? e : t);
        }, c, c.exports, t, r, e, n);
      }
      return e[f].exports;
    }
    for (var o = undefined, f = 0; f < n.length; f++) i(n[f]);
    return i;
  }({
    1: [function (t, r, e) {
      e.encode = t("./encode").encode, e.decode = t("./decode").decode, e.Encoder = t("./encoder").Encoder, e.Decoder = t("./decoder").Decoder, e.createCodec = t("./ext").createCodec, e.codec = t("./codec").codec;
    }, {
      "./codec": 10,
      "./decode": 12,
      "./decoder": 13,
      "./encode": 15,
      "./encoder": 16,
      "./ext": 20
    }],
    2: [function (t, r, e) {
      (function (Buffer) {
        function t(t) {
          return t && t.isBuffer && t;
        }
        r.exports = t("undefined" != typeof Buffer && Buffer) || t(this.Buffer) || t("undefined" != typeof window && window.Buffer) || this.Buffer;
      }).call(this, t("buffer").Buffer);
    }, {
      buffer: 29
    }],
    3: [function (t, r, e) {
      function n(t, r) {
        for (var e = this, n = r || (r |= 0), i = t.length, o = 0, f = 0; f < i;) o = t.charCodeAt(f++), o < 128 ? e[n++] = o : o < 2048 ? (e[n++] = 192 | o >>> 6, e[n++] = 128 | 63 & o) : o < 55296 || o > 57343 ? (e[n++] = 224 | o >>> 12, e[n++] = 128 | o >>> 6 & 63, e[n++] = 128 | 63 & o) : (o = (o - 55296 << 10 | t.charCodeAt(f++) - 56320) + 65536, e[n++] = 240 | o >>> 18, e[n++] = 128 | o >>> 12 & 63, e[n++] = 128 | o >>> 6 & 63, e[n++] = 128 | 63 & o);
        return n - r;
      }
      function i(t, r, e) {
        var n = this,
          i = 0 | r;
        e || (e = n.length);
        for (var o = "", f = 0; i < e;) f = n[i++], f < 128 ? o += String.fromCharCode(f) : (192 === (224 & f) ? f = (31 & f) << 6 | 63 & n[i++] : 224 === (240 & f) ? f = (15 & f) << 12 | (63 & n[i++]) << 6 | 63 & n[i++] : 240 === (248 & f) && (f = (7 & f) << 18 | (63 & n[i++]) << 12 | (63 & n[i++]) << 6 | 63 & n[i++]), f >= 65536 ? (f -= 65536, o += String.fromCharCode((f >>> 10) + 55296, (1023 & f) + 56320)) : o += String.fromCharCode(f));
        return o;
      }
      function o(t, r, e, n) {
        var i;
        e || (e = 0), n || 0 === n || (n = this.length), r || (r = 0);
        var o = n - e;
        if (t === this && e < r && r < n) for (i = o - 1; i >= 0; i--) t[i + r] = this[i + e];else for (i = 0; i < o; i++) t[i + r] = this[i + e];
        return o;
      }
      e.copy = o, e.toString = i, e.write = n;
    }, {}],
    4: [function (t, r, e) {
      function n(t) {
        return new Array(t);
      }
      function i(t) {
        if (!o.isBuffer(t) && o.isView(t)) t = o.Uint8Array.from(t);else if (o.isArrayBuffer(t)) t = new Uint8Array(t);else {
          if ("string" == typeof t) return o.from.call(e, t);
          if ("number" == typeof t) throw new TypeError('"value" argument must not be a number');
        }
        return Array.prototype.slice.call(t);
      }
      var o = t("./bufferish"),
        e = r.exports = n(0);
      e.alloc = n, e.concat = o.concat, e.from = i;
    }, {
      "./bufferish": 8
    }],
    5: [function (t, r, e) {
      function n(t) {
        return new Buffer(t);
      }
      function i(t) {
        if (!o.isBuffer(t) && o.isView(t)) t = o.Uint8Array.from(t);else if (o.isArrayBuffer(t)) t = new Uint8Array(t);else {
          if ("string" == typeof t) return o.from.call(e, t);
          if ("number" == typeof t) throw new TypeError('"value" argument must not be a number');
        }
        return Buffer.from && 1 !== Buffer.from.length ? Buffer.from(t) : new Buffer(t);
      }
      var o = t("./bufferish"),
        Buffer = o.global,
        e = r.exports = o.hasBuffer ? n(0) : [];
      e.alloc = o.hasBuffer && Buffer.alloc || n, e.concat = o.concat, e.from = i;
    }, {
      "./bufferish": 8
    }],
    6: [function (t, r, e) {
      function n(t, r, e, n) {
        var o = a.isBuffer(this),
          f = a.isBuffer(t);
        if (o && f) return this.copy(t, r, e, n);
        if (c || o || f || !a.isView(this) || !a.isView(t)) return u.copy.call(this, t, r, e, n);
        var s = e || null != n ? i.call(this, e, n) : this;
        return t.set(s, r), s.length;
      }
      function i(t, r) {
        var e = this.slice || !c && this.subarray;
        if (e) return e.call(this, t, r);
        var i = a.alloc.call(this, r - t);
        return n.call(this, i, 0, t, r), i;
      }
      function o(t, r, e) {
        var n = !s && a.isBuffer(this) ? this.toString : u.toString;
        return n.apply(this, arguments);
      }
      function f(t) {
        function r() {
          var r = this[t] || u[t];
          return r.apply(this, arguments);
        }
        return r;
      }
      var u = t("./buffer-lite");
      e.copy = n, e.slice = i, e.toString = o, e.write = f("write");
      var a = t("./bufferish"),
        Buffer = a.global,
        s = a.hasBuffer && "TYPED_ARRAY_SUPPORT" in Buffer,
        c = s && !Buffer.TYPED_ARRAY_SUPPORT;
    }, {
      "./buffer-lite": 3,
      "./bufferish": 8
    }],
    7: [function (t, r, e) {
      function n(t) {
        return new Uint8Array(t);
      }
      function i(t) {
        if (o.isView(t)) {
          var r = t.byteOffset,
            n = t.byteLength;
          t = t.buffer, t.byteLength !== n && (t.slice ? t = t.slice(r, r + n) : (t = new Uint8Array(t), t.byteLength !== n && (t = Array.prototype.slice.call(t, r, r + n))));
        } else {
          if ("string" == typeof t) return o.from.call(e, t);
          if ("number" == typeof t) throw new TypeError('"value" argument must not be a number');
        }
        return new Uint8Array(t);
      }
      var o = t("./bufferish"),
        e = r.exports = o.hasArrayBuffer ? n(0) : [];
      e.alloc = n, e.concat = o.concat, e.from = i;
    }, {
      "./bufferish": 8
    }],
    8: [function (t, r, e) {
      function n(t) {
        return "string" == typeof t ? u.call(this, t) : a(this).from(t);
      }
      function i(t) {
        return a(this).alloc(t);
      }
      function o(t, r) {
        function n(t) {
          r += t.length;
        }
        function o(t) {
          a += w.copy.call(t, u, a);
        }
        r || (r = 0, Array.prototype.forEach.call(t, n));
        var f = this !== e && this || t[0],
          u = i.call(f, r),
          a = 0;
        return Array.prototype.forEach.call(t, o), u;
      }
      function f(t) {
        return t instanceof ArrayBuffer || E(t);
      }
      function u(t) {
        var r = 3 * t.length,
          e = i.call(this, r),
          n = w.write.call(e, t);
        return r !== n && (e = w.slice.call(e, 0, n)), e;
      }
      function a(t) {
        return d(t) ? g : y(t) ? b : p(t) ? v : h ? g : l ? b : v;
      }
      function s() {
        return !1;
      }
      function c(t, r) {
        return t = "[object " + t + "]", function (e) {
          return null != e && {}.toString.call(r ? e[r] : e) === t;
        };
      }
      var Buffer = e.global = t("./buffer-global"),
        h = e.hasBuffer = Buffer && !!Buffer.isBuffer,
        l = e.hasArrayBuffer = "undefined" != typeof ArrayBuffer,
        p = e.isArray = t("isarray");
      e.isArrayBuffer = l ? f : s;
      var d = e.isBuffer = h ? Buffer.isBuffer : s,
        y = e.isView = l ? ArrayBuffer.isView || c("ArrayBuffer", "buffer") : s;
      e.alloc = i, e.concat = o, e.from = n;
      var v = e.Array = t("./bufferish-array"),
        g = e.Buffer = t("./bufferish-buffer"),
        b = e.Uint8Array = t("./bufferish-uint8array"),
        w = e.prototype = t("./bufferish-proto"),
        E = c("ArrayBuffer");
    }, {
      "./buffer-global": 2,
      "./bufferish-array": 4,
      "./bufferish-buffer": 5,
      "./bufferish-proto": 6,
      "./bufferish-uint8array": 7,
      isarray: 34
    }],
    9: [function (t, r, e) {
      function n(t) {
        return this instanceof n ? (this.options = t, void this.init()) : new n(t);
      }
      function i(t) {
        for (var r in t) n.prototype[r] = o(n.prototype[r], t[r]);
      }
      function o(t, r) {
        function e() {
          return t.apply(this, arguments), r.apply(this, arguments);
        }
        return t && r ? e : t || r;
      }
      function f(t) {
        function r(t, r) {
          return r(t);
        }
        return t = t.slice(), function (e) {
          return t.reduce(r, e);
        };
      }
      function u(t) {
        return s(t) ? f(t) : t;
      }
      function a(t) {
        return new n(t);
      }
      var s = t("isarray");
      e.createCodec = a, e.install = i, e.filter = u;
      var c = t("./bufferish");
      n.prototype.init = function () {
        var t = this.options;
        return t && t.uint8array && (this.bufferish = c.Uint8Array), this;
      }, e.preset = a({
        preset: !0
      });
    }, {
      "./bufferish": 8,
      isarray: 34
    }],
    10: [function (t, r, e) {
      t("./read-core"), t("./write-core"), e.codec = {
        preset: t("./codec-base").preset
      };
    }, {
      "./codec-base": 9,
      "./read-core": 22,
      "./write-core": 25
    }],
    11: [function (t, r, e) {
      function n(t) {
        if (!(this instanceof n)) return new n(t);
        if (t && (this.options = t, t.codec)) {
          var r = this.codec = t.codec;
          r.bufferish && (this.bufferish = r.bufferish);
        }
      }
      e.DecodeBuffer = n;
      var i = t("./read-core").preset,
        o = t("./flex-buffer").FlexDecoder;
      o.mixin(n.prototype), n.prototype.codec = i, n.prototype.fetch = function () {
        return this.codec.decode(this);
      };
    }, {
      "./flex-buffer": 21,
      "./read-core": 22
    }],
    12: [function (t, r, e) {
      function n(t, r) {
        var e = new i(r);
        return e.write(t), e.read();
      }
      e.decode = n;
      var i = t("./decode-buffer").DecodeBuffer;
    }, {
      "./decode-buffer": 11
    }],
    13: [function (t, r, e) {
      function n(t) {
        return this instanceof n ? void o.call(this, t) : new n(t);
      }
      e.Decoder = n;
      var i = t("event-lite"),
        o = t("./decode-buffer").DecodeBuffer;
      n.prototype = new o(), i.mixin(n.prototype), n.prototype.decode = function (t) {
        arguments.length && this.write(t), this.flush();
      }, n.prototype.push = function (t) {
        this.emit("data", t);
      }, n.prototype.end = function (t) {
        this.decode(t), this.emit("end");
      };
    }, {
      "./decode-buffer": 11,
      "event-lite": 31
    }],
    14: [function (t, r, e) {
      function n(t) {
        if (!(this instanceof n)) return new n(t);
        if (t && (this.options = t, t.codec)) {
          var r = this.codec = t.codec;
          r.bufferish && (this.bufferish = r.bufferish);
        }
      }
      e.EncodeBuffer = n;
      var i = t("./write-core").preset,
        o = t("./flex-buffer").FlexEncoder;
      o.mixin(n.prototype), n.prototype.codec = i, n.prototype.write = function (t) {
        this.codec.encode(this, t);
      };
    }, {
      "./flex-buffer": 21,
      "./write-core": 25
    }],
    15: [function (t, r, e) {
      function n(t, r) {
        var e = new i(r);
        return e.write(t), e.read();
      }
      e.encode = n;
      var i = t("./encode-buffer").EncodeBuffer;
    }, {
      "./encode-buffer": 14
    }],
    16: [function (t, r, e) {
      function n(t) {
        return this instanceof n ? void o.call(this, t) : new n(t);
      }
      e.Encoder = n;
      var i = t("event-lite"),
        o = t("./encode-buffer").EncodeBuffer;
      n.prototype = new o(), i.mixin(n.prototype), n.prototype.encode = function (t) {
        this.write(t), this.emit("data", this.read());
      }, n.prototype.end = function (t) {
        arguments.length && this.encode(t), this.flush(), this.emit("end");
      };
    }, {
      "./encode-buffer": 14,
      "event-lite": 31
    }],
    17: [function (t, r, e) {
      function n(t, r) {
        return this instanceof n ? (this.buffer = i.from(t), void (this.type = r)) : new n(t, r);
      }
      e.ExtBuffer = n;
      var i = t("./bufferish");
    }, {
      "./bufferish": 8
    }],
    18: [function (t, r, e) {
      function n(t) {
        t.addExtPacker(14, Error, [u, i]), t.addExtPacker(1, EvalError, [u, i]), t.addExtPacker(2, RangeError, [u, i]), t.addExtPacker(3, ReferenceError, [u, i]), t.addExtPacker(4, SyntaxError, [u, i]), t.addExtPacker(5, TypeError, [u, i]), t.addExtPacker(6, URIError, [u, i]), t.addExtPacker(10, RegExp, [f, i]), t.addExtPacker(11, Boolean, [o, i]), t.addExtPacker(12, String, [o, i]), t.addExtPacker(13, Date, [Number, i]), t.addExtPacker(15, Number, [o, i]), "undefined" != typeof Uint8Array && (t.addExtPacker(17, Int8Array, c), t.addExtPacker(18, Uint8Array, c), t.addExtPacker(19, Int16Array, c), t.addExtPacker(20, Uint16Array, c), t.addExtPacker(21, Int32Array, c), t.addExtPacker(22, Uint32Array, c), t.addExtPacker(23, Float32Array, c), "undefined" != typeof Float64Array && t.addExtPacker(24, Float64Array, c), "undefined" != typeof Uint8ClampedArray && t.addExtPacker(25, Uint8ClampedArray, c), t.addExtPacker(26, ArrayBuffer, c), t.addExtPacker(29, DataView, c)), s.hasBuffer && t.addExtPacker(27, Buffer, s.from);
      }
      function i(r) {
        return a || (a = t("./encode").encode), a(r);
      }
      function o(t) {
        return t.valueOf();
      }
      function f(t) {
        t = RegExp.prototype.toString.call(t).split("/"), t.shift();
        var r = [t.pop()];
        return r.unshift(t.join("/")), r;
      }
      function u(t) {
        var r = {};
        for (var e in h) r[e] = t[e];
        return r;
      }
      e.setExtPackers = n;
      var a,
        s = t("./bufferish"),
        Buffer = s.global,
        c = s.Uint8Array.from,
        h = {
          name: 1,
          message: 1,
          stack: 1,
          columnNumber: 1,
          fileName: 1,
          lineNumber: 1
        };
    }, {
      "./bufferish": 8,
      "./encode": 15
    }],
    19: [function (t, r, e) {
      function n(t) {
        t.addExtUnpacker(14, [i, f(Error)]), t.addExtUnpacker(1, [i, f(EvalError)]), t.addExtUnpacker(2, [i, f(RangeError)]), t.addExtUnpacker(3, [i, f(ReferenceError)]), t.addExtUnpacker(4, [i, f(SyntaxError)]), t.addExtUnpacker(5, [i, f(TypeError)]), t.addExtUnpacker(6, [i, f(URIError)]), t.addExtUnpacker(10, [i, o]), t.addExtUnpacker(11, [i, u(Boolean)]), t.addExtUnpacker(12, [i, u(String)]), t.addExtUnpacker(13, [i, u(Date)]), t.addExtUnpacker(15, [i, u(Number)]), "undefined" != typeof Uint8Array && (t.addExtUnpacker(17, u(Int8Array)), t.addExtUnpacker(18, u(Uint8Array)), t.addExtUnpacker(19, [a, u(Int16Array)]), t.addExtUnpacker(20, [a, u(Uint16Array)]), t.addExtUnpacker(21, [a, u(Int32Array)]), t.addExtUnpacker(22, [a, u(Uint32Array)]), t.addExtUnpacker(23, [a, u(Float32Array)]), "undefined" != typeof Float64Array && t.addExtUnpacker(24, [a, u(Float64Array)]), "undefined" != typeof Uint8ClampedArray && t.addExtUnpacker(25, u(Uint8ClampedArray)), t.addExtUnpacker(26, a), t.addExtUnpacker(29, [a, u(DataView)])), c.hasBuffer && t.addExtUnpacker(27, u(Buffer));
      }
      function i(r) {
        return s || (s = t("./decode").decode), s(r);
      }
      function o(t) {
        return RegExp.apply(null, t);
      }
      function f(t) {
        return function (r) {
          var e = new t();
          for (var n in h) e[n] = r[n];
          return e;
        };
      }
      function u(t) {
        return function (r) {
          return new t(r);
        };
      }
      function a(t) {
        return new Uint8Array(t).buffer;
      }
      e.setExtUnpackers = n;
      var s,
        c = t("./bufferish"),
        Buffer = c.global,
        h = {
          name: 1,
          message: 1,
          stack: 1,
          columnNumber: 1,
          fileName: 1,
          lineNumber: 1
        };
    }, {
      "./bufferish": 8,
      "./decode": 12
    }],
    20: [function (t, r, e) {
      t("./read-core"), t("./write-core"), e.createCodec = t("./codec-base").createCodec;
    }, {
      "./codec-base": 9,
      "./read-core": 22,
      "./write-core": 25
    }],
    21: [function (t, r, e) {
      function n() {
        if (!(this instanceof n)) return new n();
      }
      function i() {
        if (!(this instanceof i)) return new i();
      }
      function o() {
        function t(t) {
          var r = this.offset ? p.prototype.slice.call(this.buffer, this.offset) : this.buffer;
          this.buffer = r ? t ? this.bufferish.concat([r, t]) : r : t, this.offset = 0;
        }
        function r() {
          for (; this.offset < this.buffer.length;) {
            var t,
              r = this.offset;
            try {
              t = this.fetch();
            } catch (t) {
              if (t && t.message != v) throw t;
              this.offset = r;
              break;
            }
            this.push(t);
          }
        }
        function e(t) {
          var r = this.offset,
            e = r + t;
          if (e > this.buffer.length) throw new Error(v);
          return this.offset = e, r;
        }
        return {
          bufferish: p,
          write: t,
          fetch: a,
          flush: r,
          push: c,
          pull: h,
          read: s,
          reserve: e,
          offset: 0
        };
      }
      function f() {
        function t() {
          var t = this.start;
          if (t < this.offset) {
            var r = this.start = this.offset;
            return p.prototype.slice.call(this.buffer, t, r);
          }
        }
        function r() {
          for (; this.start < this.offset;) {
            var t = this.fetch();
            t && this.push(t);
          }
        }
        function e() {
          var t = this.buffers || (this.buffers = []),
            r = t.length > 1 ? this.bufferish.concat(t) : t[0];
          return t.length = 0, r;
        }
        function n(t) {
          var r = 0 | t;
          if (this.buffer) {
            var e = this.buffer.length,
              n = 0 | this.offset,
              i = n + r;
            if (i < e) return this.offset = i, n;
            this.flush(), t = Math.max(t, Math.min(2 * e, this.maxBufferSize));
          }
          return t = Math.max(t, this.minBufferSize), this.buffer = this.bufferish.alloc(t), this.start = 0, this.offset = r, 0;
        }
        function i(t) {
          var r = t.length;
          if (r > this.minBufferSize) this.flush(), this.push(t);else {
            var e = this.reserve(r);
            p.prototype.copy.call(t, this.buffer, e);
          }
        }
        return {
          bufferish: p,
          write: u,
          fetch: t,
          flush: r,
          push: c,
          pull: e,
          read: s,
          reserve: n,
          send: i,
          maxBufferSize: y,
          minBufferSize: d,
          offset: 0,
          start: 0
        };
      }
      function u() {
        throw new Error("method not implemented: write()");
      }
      function a() {
        throw new Error("method not implemented: fetch()");
      }
      function s() {
        var t = this.buffers && this.buffers.length;
        return t ? (this.flush(), this.pull()) : this.fetch();
      }
      function c(t) {
        var r = this.buffers || (this.buffers = []);
        r.push(t);
      }
      function h() {
        var t = this.buffers || (this.buffers = []);
        return t.shift();
      }
      function l(t) {
        function r(r) {
          for (var e in t) r[e] = t[e];
          return r;
        }
        return r;
      }
      e.FlexDecoder = n, e.FlexEncoder = i;
      var p = t("./bufferish"),
        d = 2048,
        y = 65536,
        v = "BUFFER_SHORTAGE";
      n.mixin = l(o()), n.mixin(n.prototype), i.mixin = l(f()), i.mixin(i.prototype);
    }, {
      "./bufferish": 8
    }],
    22: [function (t, r, e) {
      function n(t) {
        function r(t) {
          var r = s(t),
            n = e[r];
          if (!n) throw new Error("Invalid type: " + (r ? "0x" + r.toString(16) : r));
          return n(t);
        }
        var e = c.getReadToken(t);
        return r;
      }
      function i() {
        var t = this.options;
        return this.decode = n(t), t && t.preset && a.setExtUnpackers(this), this;
      }
      function o(t, r) {
        var e = this.extUnpackers || (this.extUnpackers = []);
        e[t] = h.filter(r);
      }
      function f(t) {
        function r(r) {
          return new u(r, t);
        }
        var e = this.extUnpackers || (this.extUnpackers = []);
        return e[t] || r;
      }
      var u = t("./ext-buffer").ExtBuffer,
        a = t("./ext-unpacker"),
        s = t("./read-format").readUint8,
        c = t("./read-token"),
        h = t("./codec-base");
      h.install({
        addExtUnpacker: o,
        getExtUnpacker: f,
        init: i
      }), e.preset = i.call(h.preset);
    }, {
      "./codec-base": 9,
      "./ext-buffer": 17,
      "./ext-unpacker": 19,
      "./read-format": 23,
      "./read-token": 24
    }],
    23: [function (t, r, e) {
      function n(t) {
        var r = k.hasArrayBuffer && t && t.binarraybuffer,
          e = t && t.int64,
          n = T && t && t.usemap,
          B = {
            map: n ? o : i,
            array: f,
            str: u,
            bin: r ? s : a,
            ext: c,
            uint8: h,
            uint16: p,
            uint32: y,
            uint64: g(8, e ? E : b),
            int8: l,
            int16: d,
            int32: v,
            int64: g(8, e ? A : w),
            float32: g(4, m),
            float64: g(8, x)
          };
        return B;
      }
      function i(t, r) {
        var e,
          n = {},
          i = new Array(r),
          o = new Array(r),
          f = t.codec.decode;
        for (e = 0; e < r; e++) i[e] = f(t), o[e] = f(t);
        for (e = 0; e < r; e++) n[i[e]] = o[e];
        return n;
      }
      function o(t, r) {
        var e,
          n = new Map(),
          i = new Array(r),
          o = new Array(r),
          f = t.codec.decode;
        for (e = 0; e < r; e++) i[e] = f(t), o[e] = f(t);
        for (e = 0; e < r; e++) n.set(i[e], o[e]);
        return n;
      }
      function f(t, r) {
        for (var e = new Array(r), n = t.codec.decode, i = 0; i < r; i++) e[i] = n(t);
        return e;
      }
      function u(t, r) {
        var e = t.reserve(r),
          n = e + r;
        return _.toString.call(t.buffer, "utf-8", e, n);
      }
      function a(t, r) {
        var e = t.reserve(r),
          n = e + r,
          i = _.slice.call(t.buffer, e, n);
        return k.from(i);
      }
      function s(t, r) {
        var e = t.reserve(r),
          n = e + r,
          i = _.slice.call(t.buffer, e, n);
        return k.Uint8Array.from(i).buffer;
      }
      function c(t, r) {
        var e = t.reserve(r + 1),
          n = t.buffer[e++],
          i = e + r,
          o = t.codec.getExtUnpacker(n);
        if (!o) throw new Error("Invalid ext type: " + (n ? "0x" + n.toString(16) : n));
        var f = _.slice.call(t.buffer, e, i);
        return o(f);
      }
      function h(t) {
        var r = t.reserve(1);
        return t.buffer[r];
      }
      function l(t) {
        var r = t.reserve(1),
          e = t.buffer[r];
        return 128 & e ? e - 256 : e;
      }
      function p(t) {
        var r = t.reserve(2),
          e = t.buffer;
        return e[r++] << 8 | e[r];
      }
      function d(t) {
        var r = t.reserve(2),
          e = t.buffer,
          n = e[r++] << 8 | e[r];
        return 32768 & n ? n - 65536 : n;
      }
      function y(t) {
        var r = t.reserve(4),
          e = t.buffer;
        return 16777216 * e[r++] + (e[r++] << 16) + (e[r++] << 8) + e[r];
      }
      function v(t) {
        var r = t.reserve(4),
          e = t.buffer;
        return e[r++] << 24 | e[r++] << 16 | e[r++] << 8 | e[r];
      }
      function g(t, r) {
        return function (e) {
          var n = e.reserve(t);
          return r.call(e.buffer, n, S);
        };
      }
      function b(t) {
        return new P(this, t).toNumber();
      }
      function w(t) {
        return new R(this, t).toNumber();
      }
      function E(t) {
        return new P(this, t);
      }
      function A(t) {
        return new R(this, t);
      }
      function m(t) {
        return B.read(this, t, !1, 23, 4);
      }
      function x(t) {
        return B.read(this, t, !1, 52, 8);
      }
      var B = t("ieee754"),
        U = t("int64-buffer"),
        P = U.Uint64BE,
        R = U.Int64BE;
      e.getReadFormat = n, e.readUint8 = h;
      var k = t("./bufferish"),
        _ = t("./bufferish-proto"),
        T = "undefined" != typeof Map,
        S = !0;
    }, {
      "./bufferish": 8,
      "./bufferish-proto": 6,
      ieee754: 32,
      "int64-buffer": 33
    }],
    24: [function (t, r, e) {
      function n(t) {
        var r = s.getReadFormat(t);
        return t && t.useraw ? o(r) : i(r);
      }
      function i(t) {
        var r,
          e = new Array(256);
        for (r = 0; r <= 127; r++) e[r] = f(r);
        for (r = 128; r <= 143; r++) e[r] = a(r - 128, t.map);
        for (r = 144; r <= 159; r++) e[r] = a(r - 144, t.array);
        for (r = 160; r <= 191; r++) e[r] = a(r - 160, t.str);
        for (e[192] = f(null), e[193] = null, e[194] = f(!1), e[195] = f(!0), e[196] = u(t.uint8, t.bin), e[197] = u(t.uint16, t.bin), e[198] = u(t.uint32, t.bin), e[199] = u(t.uint8, t.ext), e[200] = u(t.uint16, t.ext), e[201] = u(t.uint32, t.ext), e[202] = t.float32, e[203] = t.float64, e[204] = t.uint8, e[205] = t.uint16, e[206] = t.uint32, e[207] = t.uint64, e[208] = t.int8, e[209] = t.int16, e[210] = t.int32, e[211] = t.int64, e[212] = a(1, t.ext), e[213] = a(2, t.ext), e[214] = a(4, t.ext), e[215] = a(8, t.ext), e[216] = a(16, t.ext), e[217] = u(t.uint8, t.str), e[218] = u(t.uint16, t.str), e[219] = u(t.uint32, t.str), e[220] = u(t.uint16, t.array), e[221] = u(t.uint32, t.array), e[222] = u(t.uint16, t.map), e[223] = u(t.uint32, t.map), r = 224; r <= 255; r++) e[r] = f(r - 256);
        return e;
      }
      function o(t) {
        var r,
          e = i(t).slice();
        for (e[217] = e[196], e[218] = e[197], e[219] = e[198], r = 160; r <= 191; r++) e[r] = a(r - 160, t.bin);
        return e;
      }
      function f(t) {
        return function () {
          return t;
        };
      }
      function u(t, r) {
        return function (e) {
          var n = t(e);
          return r(e, n);
        };
      }
      function a(t, r) {
        return function (e) {
          return r(e, t);
        };
      }
      var s = t("./read-format");
      e.getReadToken = n;
    }, {
      "./read-format": 23
    }],
    25: [function (t, r, e) {
      function n(t) {
        function r(t, r) {
          var n = e[_typeof(r)];
          if (!n) throw new Error('Unsupported type "' + _typeof(r) + '": ' + r);
          n(t, r);
        }
        var e = s.getWriteType(t);
        return r;
      }
      function i() {
        var t = this.options;
        return this.encode = n(t), t && t.preset && a.setExtPackers(this), this;
      }
      function o(t, r, e) {
        function n(r) {
          return e && (r = e(r)), new u(r, t);
        }
        e = c.filter(e);
        var i = r.name;
        if (i && "Object" !== i) {
          var o = this.extPackers || (this.extPackers = {});
          o[i] = n;
        } else {
          var f = this.extEncoderList || (this.extEncoderList = []);
          f.unshift([r, n]);
        }
      }
      function f(t) {
        var r = this.extPackers || (this.extPackers = {}),
          e = t.constructor,
          n = e && e.name && r[e.name];
        if (n) return n;
        for (var i = this.extEncoderList || (this.extEncoderList = []), o = i.length, f = 0; f < o; f++) {
          var u = i[f];
          if (e === u[0]) return u[1];
        }
      }
      var u = t("./ext-buffer").ExtBuffer,
        a = t("./ext-packer"),
        s = t("./write-type"),
        c = t("./codec-base");
      c.install({
        addExtPacker: o,
        getExtPacker: f,
        init: i
      }), e.preset = i.call(c.preset);
    }, {
      "./codec-base": 9,
      "./ext-buffer": 17,
      "./ext-packer": 18,
      "./write-type": 27
    }],
    26: [function (t, r, e) {
      function n(t) {
        return t && t.uint8array ? i() : m || E.hasBuffer && t && t.safe ? f() : o();
      }
      function i() {
        var t = o();
        return t[202] = c(202, 4, p), t[203] = c(203, 8, d), t;
      }
      function o() {
        var t = w.slice();
        return t[196] = u(196), t[197] = a(197), t[198] = s(198), t[199] = u(199), t[200] = a(200), t[201] = s(201), t[202] = c(202, 4, x.writeFloatBE || p, !0), t[203] = c(203, 8, x.writeDoubleBE || d, !0), t[204] = u(204), t[205] = a(205), t[206] = s(206), t[207] = c(207, 8, h), t[208] = u(208), t[209] = a(209), t[210] = s(210), t[211] = c(211, 8, l), t[217] = u(217), t[218] = a(218), t[219] = s(219), t[220] = a(220), t[221] = s(221), t[222] = a(222), t[223] = s(223), t;
      }
      function f() {
        var t = w.slice();
        return t[196] = c(196, 1, Buffer.prototype.writeUInt8), t[197] = c(197, 2, Buffer.prototype.writeUInt16BE), t[198] = c(198, 4, Buffer.prototype.writeUInt32BE), t[199] = c(199, 1, Buffer.prototype.writeUInt8), t[200] = c(200, 2, Buffer.prototype.writeUInt16BE), t[201] = c(201, 4, Buffer.prototype.writeUInt32BE), t[202] = c(202, 4, Buffer.prototype.writeFloatBE), t[203] = c(203, 8, Buffer.prototype.writeDoubleBE), t[204] = c(204, 1, Buffer.prototype.writeUInt8), t[205] = c(205, 2, Buffer.prototype.writeUInt16BE), t[206] = c(206, 4, Buffer.prototype.writeUInt32BE), t[207] = c(207, 8, h), t[208] = c(208, 1, Buffer.prototype.writeInt8), t[209] = c(209, 2, Buffer.prototype.writeInt16BE), t[210] = c(210, 4, Buffer.prototype.writeInt32BE), t[211] = c(211, 8, l), t[217] = c(217, 1, Buffer.prototype.writeUInt8), t[218] = c(218, 2, Buffer.prototype.writeUInt16BE), t[219] = c(219, 4, Buffer.prototype.writeUInt32BE), t[220] = c(220, 2, Buffer.prototype.writeUInt16BE), t[221] = c(221, 4, Buffer.prototype.writeUInt32BE), t[222] = c(222, 2, Buffer.prototype.writeUInt16BE), t[223] = c(223, 4, Buffer.prototype.writeUInt32BE), t;
      }
      function u(t) {
        return function (r, e) {
          var n = r.reserve(2),
            i = r.buffer;
          i[n++] = t, i[n] = e;
        };
      }
      function a(t) {
        return function (r, e) {
          var n = r.reserve(3),
            i = r.buffer;
          i[n++] = t, i[n++] = e >>> 8, i[n] = e;
        };
      }
      function s(t) {
        return function (r, e) {
          var n = r.reserve(5),
            i = r.buffer;
          i[n++] = t, i[n++] = e >>> 24, i[n++] = e >>> 16, i[n++] = e >>> 8, i[n] = e;
        };
      }
      function c(t, r, e, n) {
        return function (i, o) {
          var f = i.reserve(r + 1);
          i.buffer[f++] = t, e.call(i.buffer, o, f, n);
        };
      }
      function h(t, r) {
        new g(this, r, t);
      }
      function l(t, r) {
        new b(this, r, t);
      }
      function p(t, r) {
        y.write(this, t, r, !1, 23, 4);
      }
      function d(t, r) {
        y.write(this, t, r, !1, 52, 8);
      }
      var y = t("ieee754"),
        v = t("int64-buffer"),
        g = v.Uint64BE,
        b = v.Int64BE,
        w = t("./write-uint8").uint8,
        E = t("./bufferish"),
        Buffer = E.global,
        A = E.hasBuffer && "TYPED_ARRAY_SUPPORT" in Buffer,
        m = A && !Buffer.TYPED_ARRAY_SUPPORT,
        x = E.hasBuffer && Buffer.prototype || {};
      e.getWriteToken = n;
    }, {
      "./bufferish": 8,
      "./write-uint8": 28,
      ieee754: 32,
      "int64-buffer": 33
    }],
    27: [function (t, r, e) {
      function n(t) {
        function r(t, r) {
          var e = r ? 195 : 194;
          _[e](t, r);
        }
        function e(t, r) {
          var e,
            n = 0 | r;
          return r !== n ? (e = 203, void _[e](t, r)) : (e = -32 <= n && n <= 127 ? 255 & n : 0 <= n ? n <= 255 ? 204 : n <= 65535 ? 205 : 206 : -128 <= n ? 208 : -32768 <= n ? 209 : 210, void _[e](t, n));
        }
        function n(t, r) {
          var e = 207;
          _[e](t, r.toArray());
        }
        function o(t, r) {
          var e = 211;
          _[e](t, r.toArray());
        }
        function v(t) {
          return t < 32 ? 1 : t <= 255 ? 2 : t <= 65535 ? 3 : 5;
        }
        function g(t) {
          return t < 32 ? 1 : t <= 65535 ? 3 : 5;
        }
        function b(t) {
          function r(r, e) {
            var n = e.length,
              i = 5 + 3 * n;
            r.offset = r.reserve(i);
            var o = r.buffer,
              f = t(n),
              u = r.offset + f;
            n = s.write.call(o, e, u);
            var a = t(n);
            if (f !== a) {
              var c = u + a - f,
                h = u + n;
              s.copy.call(o, o, c, u, h);
            }
            var l = 1 === a ? 160 + n : a <= 3 ? 215 + a : 219;
            _[l](r, n), r.offset += n;
          }
          return r;
        }
        function w(t, r) {
          if (null === r) return A(t, r);
          if (I(r)) return Y(t, r);
          if (i(r)) return m(t, r);
          if (f.isUint64BE(r)) return n(t, r);
          if (u.isInt64BE(r)) return o(t, r);
          var e = t.codec.getExtPacker(r);
          return e && (r = e(r)), r instanceof l ? U(t, r) : void D(t, r);
        }
        function E(t, r) {
          return I(r) ? k(t, r) : void w(t, r);
        }
        function A(t, r) {
          var e = 192;
          _[e](t, r);
        }
        function m(t, r) {
          var e = r.length,
            n = e < 16 ? 144 + e : e <= 65535 ? 220 : 221;
          _[n](t, e);
          for (var i = t.codec.encode, o = 0; o < e; o++) i(t, r[o]);
        }
        function x(t, r) {
          var e = r.length,
            n = e < 255 ? 196 : e <= 65535 ? 197 : 198;
          _[n](t, e), t.send(r);
        }
        function B(t, r) {
          x(t, new Uint8Array(r));
        }
        function U(t, r) {
          var e = r.buffer,
            n = e.length,
            i = y[n] || (n < 255 ? 199 : n <= 65535 ? 200 : 201);
          _[i](t, n), h[r.type](t), t.send(e);
        }
        function P(t, r) {
          var e = Object.keys(r),
            n = e.length,
            i = n < 16 ? 128 + n : n <= 65535 ? 222 : 223;
          _[i](t, n);
          var o = t.codec.encode;
          e.forEach(function (e) {
            o(t, e), o(t, r[e]);
          });
        }
        function R(t, r) {
          if (!(r instanceof Map)) return P(t, r);
          var e = r.size,
            n = e < 16 ? 128 + e : e <= 65535 ? 222 : 223;
          _[n](t, e);
          var i = t.codec.encode;
          r.forEach(function (r, e, n) {
            i(t, e), i(t, r);
          });
        }
        function k(t, r) {
          var e = r.length,
            n = e < 32 ? 160 + e : e <= 65535 ? 218 : 219;
          _[n](t, e), t.send(r);
        }
        var _ = c.getWriteToken(t),
          T = t && t.useraw,
          S = p && t && t.binarraybuffer,
          I = S ? a.isArrayBuffer : a.isBuffer,
          Y = S ? B : x,
          C = d && t && t.usemap,
          D = C ? R : P,
          O = {
            "boolean": r,
            "function": A,
            number: e,
            object: T ? E : w,
            string: b(T ? g : v),
            symbol: A,
            undefined: A
          };
        return O;
      }
      var i = t("isarray"),
        o = t("int64-buffer"),
        f = o.Uint64BE,
        u = o.Int64BE,
        a = t("./bufferish"),
        s = t("./bufferish-proto"),
        c = t("./write-token"),
        h = t("./write-uint8").uint8,
        l = t("./ext-buffer").ExtBuffer,
        p = "undefined" != typeof Uint8Array,
        d = "undefined" != typeof Map,
        y = [];
      y[1] = 212, y[2] = 213, y[4] = 214, y[8] = 215, y[16] = 216, e.getWriteType = n;
    }, {
      "./bufferish": 8,
      "./bufferish-proto": 6,
      "./ext-buffer": 17,
      "./write-token": 26,
      "./write-uint8": 28,
      "int64-buffer": 33,
      isarray: 34
    }],
    28: [function (t, r, e) {
      function n(t) {
        return function (r) {
          var e = r.reserve(1);
          r.buffer[e] = t;
        };
      }
      for (var i = e.uint8 = new Array(256), o = 0; o <= 255; o++) i[o] = n(o);
    }, {}],
    29: [function (t, r, e) {
      (function (r) {
        "use strict";

        function n() {
          try {
            var t = new Uint8Array(1);
            return t.__proto__ = {
              __proto__: Uint8Array.prototype,
              foo: function foo() {
                return 42;
              }
            }, 42 === t.foo() && "function" == typeof t.subarray && 0 === t.subarray(1, 1).byteLength;
          } catch (t) {
            return !1;
          }
        }
        function i() {
          return Buffer.TYPED_ARRAY_SUPPORT ? 2147483647 : 1073741823;
        }
        function o(t, r) {
          if (i() < r) throw new RangeError("Invalid typed array length");
          return Buffer.TYPED_ARRAY_SUPPORT ? (t = new Uint8Array(r), t.__proto__ = Buffer.prototype) : (null === t && (t = new Buffer(r)), t.length = r), t;
        }
        function Buffer(t, r, e) {
          if (!(Buffer.TYPED_ARRAY_SUPPORT || this instanceof Buffer)) return new Buffer(t, r, e);
          if ("number" == typeof t) {
            if ("string" == typeof r) throw new Error("If encoding is specified then the first argument must be a string");
            return s(this, t);
          }
          return f(this, t, r, e);
        }
        function f(t, r, e, n) {
          if ("number" == typeof r) throw new TypeError('"value" argument must not be a number');
          return "undefined" != typeof ArrayBuffer && r instanceof ArrayBuffer ? l(t, r, e, n) : "string" == typeof r ? c(t, r, e) : p(t, r);
        }
        function u(t) {
          if ("number" != typeof t) throw new TypeError('"size" argument must be a number');
          if (t < 0) throw new RangeError('"size" argument must not be negative');
        }
        function a(t, r, e, n) {
          return u(r), r <= 0 ? o(t, r) : void 0 !== e ? "string" == typeof n ? o(t, r).fill(e, n) : o(t, r).fill(e) : o(t, r);
        }
        function s(t, r) {
          if (u(r), t = o(t, r < 0 ? 0 : 0 | d(r)), !Buffer.TYPED_ARRAY_SUPPORT) for (var e = 0; e < r; ++e) t[e] = 0;
          return t;
        }
        function c(t, r, e) {
          if ("string" == typeof e && "" !== e || (e = "utf8"), !Buffer.isEncoding(e)) throw new TypeError('"encoding" must be a valid string encoding');
          var n = 0 | v(r, e);
          t = o(t, n);
          var i = t.write(r, e);
          return i !== n && (t = t.slice(0, i)), t;
        }
        function h(t, r) {
          var e = r.length < 0 ? 0 : 0 | d(r.length);
          t = o(t, e);
          for (var n = 0; n < e; n += 1) t[n] = 255 & r[n];
          return t;
        }
        function l(t, r, e, n) {
          if (r.byteLength, e < 0 || r.byteLength < e) throw new RangeError("'offset' is out of bounds");
          if (r.byteLength < e + (n || 0)) throw new RangeError("'length' is out of bounds");
          return r = void 0 === e && void 0 === n ? new Uint8Array(r) : void 0 === n ? new Uint8Array(r, e) : new Uint8Array(r, e, n), Buffer.TYPED_ARRAY_SUPPORT ? (t = r, t.__proto__ = Buffer.prototype) : t = h(t, r), t;
        }
        function p(t, r) {
          if (Buffer.isBuffer(r)) {
            var e = 0 | d(r.length);
            return t = o(t, e), 0 === t.length ? t : (r.copy(t, 0, 0, e), t);
          }
          if (r) {
            if ("undefined" != typeof ArrayBuffer && r.buffer instanceof ArrayBuffer || "length" in r) return "number" != typeof r.length || H(r.length) ? o(t, 0) : h(t, r);
            if ("Buffer" === r.type && Q(r.data)) return h(t, r.data);
          }
          throw new TypeError("First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.");
        }
        function d(t) {
          if (t >= i()) throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + i().toString(16) + " bytes");
          return 0 | t;
        }
        function y(t) {
          return +t != t && (t = 0), Buffer.alloc(+t);
        }
        function v(t, r) {
          if (Buffer.isBuffer(t)) return t.length;
          if ("undefined" != typeof ArrayBuffer && "function" == typeof ArrayBuffer.isView && (ArrayBuffer.isView(t) || t instanceof ArrayBuffer)) return t.byteLength;
          "string" != typeof t && (t = "" + t);
          var e = t.length;
          if (0 === e) return 0;
          for (var n = !1;;) switch (r) {
            case "ascii":
            case "latin1":
            case "binary":
              return e;
            case "utf8":
            case "utf-8":
            case void 0:
              return q(t).length;
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
              return 2 * e;
            case "hex":
              return e >>> 1;
            case "base64":
              return X(t).length;
            default:
              if (n) return q(t).length;
              r = ("" + r).toLowerCase(), n = !0;
          }
        }
        function g(t, r, e) {
          var n = !1;
          if ((void 0 === r || r < 0) && (r = 0), r > this.length) return "";
          if ((void 0 === e || e > this.length) && (e = this.length), e <= 0) return "";
          if (e >>>= 0, r >>>= 0, e <= r) return "";
          for (t || (t = "utf8");;) switch (t) {
            case "hex":
              return I(this, r, e);
            case "utf8":
            case "utf-8":
              return k(this, r, e);
            case "ascii":
              return T(this, r, e);
            case "latin1":
            case "binary":
              return S(this, r, e);
            case "base64":
              return R(this, r, e);
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
              return Y(this, r, e);
            default:
              if (n) throw new TypeError("Unknown encoding: " + t);
              t = (t + "").toLowerCase(), n = !0;
          }
        }
        function b(t, r, e) {
          var n = t[r];
          t[r] = t[e], t[e] = n;
        }
        function w(t, r, e, n, i) {
          if (0 === t.length) return -1;
          if ("string" == typeof e ? (n = e, e = 0) : e > 2147483647 ? e = 2147483647 : e < -2147483648 && (e = -2147483648), e = +e, isNaN(e) && (e = i ? 0 : t.length - 1), e < 0 && (e = t.length + e), e >= t.length) {
            if (i) return -1;
            e = t.length - 1;
          } else if (e < 0) {
            if (!i) return -1;
            e = 0;
          }
          if ("string" == typeof r && (r = Buffer.from(r, n)), Buffer.isBuffer(r)) return 0 === r.length ? -1 : E(t, r, e, n, i);
          if ("number" == typeof r) return r = 255 & r, Buffer.TYPED_ARRAY_SUPPORT && "function" == typeof Uint8Array.prototype.indexOf ? i ? Uint8Array.prototype.indexOf.call(t, r, e) : Uint8Array.prototype.lastIndexOf.call(t, r, e) : E(t, [r], e, n, i);
          throw new TypeError("val must be string, number or Buffer");
        }
        function E(t, r, e, n, i) {
          function o(t, r) {
            return 1 === f ? t[r] : t.readUInt16BE(r * f);
          }
          var f = 1,
            u = t.length,
            a = r.length;
          if (void 0 !== n && (n = String(n).toLowerCase(), "ucs2" === n || "ucs-2" === n || "utf16le" === n || "utf-16le" === n)) {
            if (t.length < 2 || r.length < 2) return -1;
            f = 2, u /= 2, a /= 2, e /= 2;
          }
          var s;
          if (i) {
            var c = -1;
            for (s = e; s < u; s++) if (o(t, s) === o(r, c === -1 ? 0 : s - c)) {
              if (c === -1 && (c = s), s - c + 1 === a) return c * f;
            } else c !== -1 && (s -= s - c), c = -1;
          } else for (e + a > u && (e = u - a), s = e; s >= 0; s--) {
            for (var h = !0, l = 0; l < a; l++) if (o(t, s + l) !== o(r, l)) {
              h = !1;
              break;
            }
            if (h) return s;
          }
          return -1;
        }
        function A(t, r, e, n) {
          e = Number(e) || 0;
          var i = t.length - e;
          n ? (n = Number(n), n > i && (n = i)) : n = i;
          var o = r.length;
          if (o % 2 !== 0) throw new TypeError("Invalid hex string");
          n > o / 2 && (n = o / 2);
          for (var f = 0; f < n; ++f) {
            var u = parseInt(r.substr(2 * f, 2), 16);
            if (isNaN(u)) return f;
            t[e + f] = u;
          }
          return f;
        }
        function m(t, r, e, n) {
          return G(q(r, t.length - e), t, e, n);
        }
        function x(t, r, e, n) {
          return G(W(r), t, e, n);
        }
        function B(t, r, e, n) {
          return x(t, r, e, n);
        }
        function U(t, r, e, n) {
          return G(X(r), t, e, n);
        }
        function P(t, r, e, n) {
          return G(J(r, t.length - e), t, e, n);
        }
        function R(t, r, e) {
          return 0 === r && e === t.length ? Z.fromByteArray(t) : Z.fromByteArray(t.slice(r, e));
        }
        function k(t, r, e) {
          e = Math.min(t.length, e);
          for (var n = [], i = r; i < e;) {
            var o = t[i],
              f = null,
              u = o > 239 ? 4 : o > 223 ? 3 : o > 191 ? 2 : 1;
            if (i + u <= e) {
              var a, s, c, h;
              switch (u) {
                case 1:
                  o < 128 && (f = o);
                  break;
                case 2:
                  a = t[i + 1], 128 === (192 & a) && (h = (31 & o) << 6 | 63 & a, h > 127 && (f = h));
                  break;
                case 3:
                  a = t[i + 1], s = t[i + 2], 128 === (192 & a) && 128 === (192 & s) && (h = (15 & o) << 12 | (63 & a) << 6 | 63 & s, h > 2047 && (h < 55296 || h > 57343) && (f = h));
                  break;
                case 4:
                  a = t[i + 1], s = t[i + 2], c = t[i + 3], 128 === (192 & a) && 128 === (192 & s) && 128 === (192 & c) && (h = (15 & o) << 18 | (63 & a) << 12 | (63 & s) << 6 | 63 & c, h > 65535 && h < 1114112 && (f = h));
              }
            }
            null === f ? (f = 65533, u = 1) : f > 65535 && (f -= 65536, n.push(f >>> 10 & 1023 | 55296), f = 56320 | 1023 & f), n.push(f), i += u;
          }
          return _(n);
        }
        function _(t) {
          var r = t.length;
          if (r <= $) return String.fromCharCode.apply(String, t);
          for (var e = "", n = 0; n < r;) e += String.fromCharCode.apply(String, t.slice(n, n += $));
          return e;
        }
        function T(t, r, e) {
          var n = "";
          e = Math.min(t.length, e);
          for (var i = r; i < e; ++i) n += String.fromCharCode(127 & t[i]);
          return n;
        }
        function S(t, r, e) {
          var n = "";
          e = Math.min(t.length, e);
          for (var i = r; i < e; ++i) n += String.fromCharCode(t[i]);
          return n;
        }
        function I(t, r, e) {
          var n = t.length;
          (!r || r < 0) && (r = 0), (!e || e < 0 || e > n) && (e = n);
          for (var i = "", o = r; o < e; ++o) i += V(t[o]);
          return i;
        }
        function Y(t, r, e) {
          for (var n = t.slice(r, e), i = "", o = 0; o < n.length; o += 2) i += String.fromCharCode(n[o] + 256 * n[o + 1]);
          return i;
        }
        function C(t, r, e) {
          if (t % 1 !== 0 || t < 0) throw new RangeError("offset is not uint");
          if (t + r > e) throw new RangeError("Trying to access beyond buffer length");
        }
        function D(t, r, e, n, i, o) {
          if (!Buffer.isBuffer(t)) throw new TypeError('"buffer" argument must be a Buffer instance');
          if (r > i || r < o) throw new RangeError('"value" argument is out of bounds');
          if (e + n > t.length) throw new RangeError("Index out of range");
        }
        function O(t, r, e, n) {
          r < 0 && (r = 65535 + r + 1);
          for (var i = 0, o = Math.min(t.length - e, 2); i < o; ++i) t[e + i] = (r & 255 << 8 * (n ? i : 1 - i)) >>> 8 * (n ? i : 1 - i);
        }
        function L(t, r, e, n) {
          r < 0 && (r = 4294967295 + r + 1);
          for (var i = 0, o = Math.min(t.length - e, 4); i < o; ++i) t[e + i] = r >>> 8 * (n ? i : 3 - i) & 255;
        }
        function M(t, r, e, n, i, o) {
          if (e + n > t.length) throw new RangeError("Index out of range");
          if (e < 0) throw new RangeError("Index out of range");
        }
        function N(t, r, e, n, i) {
          return i || M(t, r, e, 4, 3.4028234663852886e38, -3.4028234663852886e38), K.write(t, r, e, n, 23, 4), e + 4;
        }
        function F(t, r, e, n, i) {
          return i || M(t, r, e, 8, 1.7976931348623157e308, -1.7976931348623157e308), K.write(t, r, e, n, 52, 8), e + 8;
        }
        function j(t) {
          if (t = z(t).replace(tt, ""), t.length < 2) return "";
          for (; t.length % 4 !== 0;) t += "=";
          return t;
        }
        function z(t) {
          return t.trim ? t.trim() : t.replace(/^\s+|\s+$/g, "");
        }
        function V(t) {
          return t < 16 ? "0" + t.toString(16) : t.toString(16);
        }
        function q(t, r) {
          r = r || 1 / 0;
          for (var e, n = t.length, i = null, o = [], f = 0; f < n; ++f) {
            if (e = t.charCodeAt(f), e > 55295 && e < 57344) {
              if (!i) {
                if (e > 56319) {
                  (r -= 3) > -1 && o.push(239, 191, 189);
                  continue;
                }
                if (f + 1 === n) {
                  (r -= 3) > -1 && o.push(239, 191, 189);
                  continue;
                }
                i = e;
                continue;
              }
              if (e < 56320) {
                (r -= 3) > -1 && o.push(239, 191, 189), i = e;
                continue;
              }
              e = (i - 55296 << 10 | e - 56320) + 65536;
            } else i && (r -= 3) > -1 && o.push(239, 191, 189);
            if (i = null, e < 128) {
              if ((r -= 1) < 0) break;
              o.push(e);
            } else if (e < 2048) {
              if ((r -= 2) < 0) break;
              o.push(e >> 6 | 192, 63 & e | 128);
            } else if (e < 65536) {
              if ((r -= 3) < 0) break;
              o.push(e >> 12 | 224, e >> 6 & 63 | 128, 63 & e | 128);
            } else {
              if (!(e < 1114112)) throw new Error("Invalid code point");
              if ((r -= 4) < 0) break;
              o.push(e >> 18 | 240, e >> 12 & 63 | 128, e >> 6 & 63 | 128, 63 & e | 128);
            }
          }
          return o;
        }
        function W(t) {
          for (var r = [], e = 0; e < t.length; ++e) r.push(255 & t.charCodeAt(e));
          return r;
        }
        function J(t, r) {
          for (var e, n, i, o = [], f = 0; f < t.length && !((r -= 2) < 0); ++f) e = t.charCodeAt(f), n = e >> 8, i = e % 256, o.push(i), o.push(n);
          return o;
        }
        function X(t) {
          return Z.toByteArray(j(t));
        }
        function G(t, r, e, n) {
          for (var i = 0; i < n && !(i + e >= r.length || i >= t.length); ++i) r[i + e] = t[i];
          return i;
        }
        function H(t) {
          return t !== t;
        }
        var Z = t("base64-js"),
          K = t("ieee754"),
          Q = t("isarray");
        e.Buffer = Buffer, e.SlowBuffer = y, e.INSPECT_MAX_BYTES = 50, Buffer.TYPED_ARRAY_SUPPORT = void 0 !== r.TYPED_ARRAY_SUPPORT ? r.TYPED_ARRAY_SUPPORT : n(), e.kMaxLength = i(), Buffer.poolSize = 8192, Buffer._augment = function (t) {
          return t.__proto__ = Buffer.prototype, t;
        }, Buffer.from = function (t, r, e) {
          return f(null, t, r, e);
        }, Buffer.TYPED_ARRAY_SUPPORT && (Buffer.prototype.__proto__ = Uint8Array.prototype, Buffer.__proto__ = Uint8Array, "undefined" != typeof Symbol && Symbol.species && Buffer[Symbol.species] === Buffer && Object.defineProperty(Buffer, Symbol.species, {
          value: null,
          configurable: !0
        })), Buffer.alloc = function (t, r, e) {
          return a(null, t, r, e);
        }, Buffer.allocUnsafe = function (t) {
          return s(null, t);
        }, Buffer.allocUnsafeSlow = function (t) {
          return s(null, t);
        }, Buffer.isBuffer = function (t) {
          return !(null == t || !t._isBuffer);
        }, Buffer.compare = function (t, r) {
          if (!Buffer.isBuffer(t) || !Buffer.isBuffer(r)) throw new TypeError("Arguments must be Buffers");
          if (t === r) return 0;
          for (var e = t.length, n = r.length, i = 0, o = Math.min(e, n); i < o; ++i) if (t[i] !== r[i]) {
            e = t[i], n = r[i];
            break;
          }
          return e < n ? -1 : n < e ? 1 : 0;
        }, Buffer.isEncoding = function (t) {
          switch (String(t).toLowerCase()) {
            case "hex":
            case "utf8":
            case "utf-8":
            case "ascii":
            case "latin1":
            case "binary":
            case "base64":
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
              return !0;
            default:
              return !1;
          }
        }, Buffer.concat = function (t, r) {
          if (!Q(t)) throw new TypeError('"list" argument must be an Array of Buffers');
          if (0 === t.length) return Buffer.alloc(0);
          var e;
          if (void 0 === r) for (r = 0, e = 0; e < t.length; ++e) r += t[e].length;
          var n = Buffer.allocUnsafe(r),
            i = 0;
          for (e = 0; e < t.length; ++e) {
            var o = t[e];
            if (!Buffer.isBuffer(o)) throw new TypeError('"list" argument must be an Array of Buffers');
            o.copy(n, i), i += o.length;
          }
          return n;
        }, Buffer.byteLength = v, Buffer.prototype._isBuffer = !0, Buffer.prototype.swap16 = function () {
          var t = this.length;
          if (t % 2 !== 0) throw new RangeError("Buffer size must be a multiple of 16-bits");
          for (var r = 0; r < t; r += 2) b(this, r, r + 1);
          return this;
        }, Buffer.prototype.swap32 = function () {
          var t = this.length;
          if (t % 4 !== 0) throw new RangeError("Buffer size must be a multiple of 32-bits");
          for (var r = 0; r < t; r += 4) b(this, r, r + 3), b(this, r + 1, r + 2);
          return this;
        }, Buffer.prototype.swap64 = function () {
          var t = this.length;
          if (t % 8 !== 0) throw new RangeError("Buffer size must be a multiple of 64-bits");
          for (var r = 0; r < t; r += 8) b(this, r, r + 7), b(this, r + 1, r + 6), b(this, r + 2, r + 5), b(this, r + 3, r + 4);
          return this;
        }, Buffer.prototype.toString = function () {
          var t = 0 | this.length;
          return 0 === t ? "" : 0 === arguments.length ? k(this, 0, t) : g.apply(this, arguments);
        }, Buffer.prototype.equals = function (t) {
          if (!Buffer.isBuffer(t)) throw new TypeError("Argument must be a Buffer");
          return this === t || 0 === Buffer.compare(this, t);
        }, Buffer.prototype.inspect = function () {
          var t = "",
            r = e.INSPECT_MAX_BYTES;
          return this.length > 0 && (t = this.toString("hex", 0, r).match(/.{2}/g).join(" "), this.length > r && (t += " ... ")), "<Buffer " + t + ">";
        }, Buffer.prototype.compare = function (t, r, e, n, i) {
          if (!Buffer.isBuffer(t)) throw new TypeError("Argument must be a Buffer");
          if (void 0 === r && (r = 0), void 0 === e && (e = t ? t.length : 0), void 0 === n && (n = 0), void 0 === i && (i = this.length), r < 0 || e > t.length || n < 0 || i > this.length) throw new RangeError("out of range index");
          if (n >= i && r >= e) return 0;
          if (n >= i) return -1;
          if (r >= e) return 1;
          if (r >>>= 0, e >>>= 0, n >>>= 0, i >>>= 0, this === t) return 0;
          for (var o = i - n, f = e - r, u = Math.min(o, f), a = this.slice(n, i), s = t.slice(r, e), c = 0; c < u; ++c) if (a[c] !== s[c]) {
            o = a[c], f = s[c];
            break;
          }
          return o < f ? -1 : f < o ? 1 : 0;
        }, Buffer.prototype.includes = function (t, r, e) {
          return this.indexOf(t, r, e) !== -1;
        }, Buffer.prototype.indexOf = function (t, r, e) {
          return w(this, t, r, e, !0);
        }, Buffer.prototype.lastIndexOf = function (t, r, e) {
          return w(this, t, r, e, !1);
        }, Buffer.prototype.write = function (t, r, e, n) {
          if (void 0 === r) n = "utf8", e = this.length, r = 0;else if (void 0 === e && "string" == typeof r) n = r, e = this.length, r = 0;else {
            if (!isFinite(r)) throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
            r = 0 | r, isFinite(e) ? (e = 0 | e, void 0 === n && (n = "utf8")) : (n = e, e = void 0);
          }
          var i = this.length - r;
          if ((void 0 === e || e > i) && (e = i), t.length > 0 && (e < 0 || r < 0) || r > this.length) throw new RangeError("Attempt to write outside buffer bounds");
          n || (n = "utf8");
          for (var o = !1;;) switch (n) {
            case "hex":
              return A(this, t, r, e);
            case "utf8":
            case "utf-8":
              return m(this, t, r, e);
            case "ascii":
              return x(this, t, r, e);
            case "latin1":
            case "binary":
              return B(this, t, r, e);
            case "base64":
              return U(this, t, r, e);
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
              return P(this, t, r, e);
            default:
              if (o) throw new TypeError("Unknown encoding: " + n);
              n = ("" + n).toLowerCase(), o = !0;
          }
        }, Buffer.prototype.toJSON = function () {
          return {
            type: "Buffer",
            data: Array.prototype.slice.call(this._arr || this, 0)
          };
        };
        var $ = 4096;
        Buffer.prototype.slice = function (t, r) {
          var e = this.length;
          t = ~~t, r = void 0 === r ? e : ~~r, t < 0 ? (t += e, t < 0 && (t = 0)) : t > e && (t = e), r < 0 ? (r += e, r < 0 && (r = 0)) : r > e && (r = e), r < t && (r = t);
          var n;
          if (Buffer.TYPED_ARRAY_SUPPORT) n = this.subarray(t, r), n.__proto__ = Buffer.prototype;else {
            var i = r - t;
            n = new Buffer(i, void 0);
            for (var o = 0; o < i; ++o) n[o] = this[o + t];
          }
          return n;
        }, Buffer.prototype.readUIntLE = function (t, r, e) {
          t = 0 | t, r = 0 | r, e || C(t, r, this.length);
          for (var n = this[t], i = 1, o = 0; ++o < r && (i *= 256);) n += this[t + o] * i;
          return n;
        }, Buffer.prototype.readUIntBE = function (t, r, e) {
          t = 0 | t, r = 0 | r, e || C(t, r, this.length);
          for (var n = this[t + --r], i = 1; r > 0 && (i *= 256);) n += this[t + --r] * i;
          return n;
        }, Buffer.prototype.readUInt8 = function (t, r) {
          return r || C(t, 1, this.length), this[t];
        }, Buffer.prototype.readUInt16LE = function (t, r) {
          return r || C(t, 2, this.length), this[t] | this[t + 1] << 8;
        }, Buffer.prototype.readUInt16BE = function (t, r) {
          return r || C(t, 2, this.length), this[t] << 8 | this[t + 1];
        }, Buffer.prototype.readUInt32LE = function (t, r) {
          return r || C(t, 4, this.length), (this[t] | this[t + 1] << 8 | this[t + 2] << 16) + 16777216 * this[t + 3];
        }, Buffer.prototype.readUInt32BE = function (t, r) {
          return r || C(t, 4, this.length), 16777216 * this[t] + (this[t + 1] << 16 | this[t + 2] << 8 | this[t + 3]);
        }, Buffer.prototype.readIntLE = function (t, r, e) {
          t = 0 | t, r = 0 | r, e || C(t, r, this.length);
          for (var n = this[t], i = 1, o = 0; ++o < r && (i *= 256);) n += this[t + o] * i;
          return i *= 128, n >= i && (n -= Math.pow(2, 8 * r)), n;
        }, Buffer.prototype.readIntBE = function (t, r, e) {
          t = 0 | t, r = 0 | r, e || C(t, r, this.length);
          for (var n = r, i = 1, o = this[t + --n]; n > 0 && (i *= 256);) o += this[t + --n] * i;
          return i *= 128, o >= i && (o -= Math.pow(2, 8 * r)), o;
        }, Buffer.prototype.readInt8 = function (t, r) {
          return r || C(t, 1, this.length), 128 & this[t] ? (255 - this[t] + 1) * -1 : this[t];
        }, Buffer.prototype.readInt16LE = function (t, r) {
          r || C(t, 2, this.length);
          var e = this[t] | this[t + 1] << 8;
          return 32768 & e ? 4294901760 | e : e;
        }, Buffer.prototype.readInt16BE = function (t, r) {
          r || C(t, 2, this.length);
          var e = this[t + 1] | this[t] << 8;
          return 32768 & e ? 4294901760 | e : e;
        }, Buffer.prototype.readInt32LE = function (t, r) {
          return r || C(t, 4, this.length), this[t] | this[t + 1] << 8 | this[t + 2] << 16 | this[t + 3] << 24;
        }, Buffer.prototype.readInt32BE = function (t, r) {
          return r || C(t, 4, this.length), this[t] << 24 | this[t + 1] << 16 | this[t + 2] << 8 | this[t + 3];
        }, Buffer.prototype.readFloatLE = function (t, r) {
          return r || C(t, 4, this.length), K.read(this, t, !0, 23, 4);
        }, Buffer.prototype.readFloatBE = function (t, r) {
          return r || C(t, 4, this.length), K.read(this, t, !1, 23, 4);
        }, Buffer.prototype.readDoubleLE = function (t, r) {
          return r || C(t, 8, this.length), K.read(this, t, !0, 52, 8);
        }, Buffer.prototype.readDoubleBE = function (t, r) {
          return r || C(t, 8, this.length), K.read(this, t, !1, 52, 8);
        }, Buffer.prototype.writeUIntLE = function (t, r, e, n) {
          if (t = +t, r = 0 | r, e = 0 | e, !n) {
            var i = Math.pow(2, 8 * e) - 1;
            D(this, t, r, e, i, 0);
          }
          var o = 1,
            f = 0;
          for (this[r] = 255 & t; ++f < e && (o *= 256);) this[r + f] = t / o & 255;
          return r + e;
        }, Buffer.prototype.writeUIntBE = function (t, r, e, n) {
          if (t = +t, r = 0 | r, e = 0 | e, !n) {
            var i = Math.pow(2, 8 * e) - 1;
            D(this, t, r, e, i, 0);
          }
          var o = e - 1,
            f = 1;
          for (this[r + o] = 255 & t; --o >= 0 && (f *= 256);) this[r + o] = t / f & 255;
          return r + e;
        }, Buffer.prototype.writeUInt8 = function (t, r, e) {
          return t = +t, r = 0 | r, e || D(this, t, r, 1, 255, 0), Buffer.TYPED_ARRAY_SUPPORT || (t = Math.floor(t)), this[r] = 255 & t, r + 1;
        }, Buffer.prototype.writeUInt16LE = function (t, r, e) {
          return t = +t, r = 0 | r, e || D(this, t, r, 2, 65535, 0), Buffer.TYPED_ARRAY_SUPPORT ? (this[r] = 255 & t, this[r + 1] = t >>> 8) : O(this, t, r, !0), r + 2;
        }, Buffer.prototype.writeUInt16BE = function (t, r, e) {
          return t = +t, r = 0 | r, e || D(this, t, r, 2, 65535, 0), Buffer.TYPED_ARRAY_SUPPORT ? (this[r] = t >>> 8, this[r + 1] = 255 & t) : O(this, t, r, !1), r + 2;
        }, Buffer.prototype.writeUInt32LE = function (t, r, e) {
          return t = +t, r = 0 | r, e || D(this, t, r, 4, 4294967295, 0), Buffer.TYPED_ARRAY_SUPPORT ? (this[r + 3] = t >>> 24, this[r + 2] = t >>> 16, this[r + 1] = t >>> 8, this[r] = 255 & t) : L(this, t, r, !0), r + 4;
        }, Buffer.prototype.writeUInt32BE = function (t, r, e) {
          return t = +t, r = 0 | r, e || D(this, t, r, 4, 4294967295, 0), Buffer.TYPED_ARRAY_SUPPORT ? (this[r] = t >>> 24, this[r + 1] = t >>> 16, this[r + 2] = t >>> 8, this[r + 3] = 255 & t) : L(this, t, r, !1), r + 4;
        }, Buffer.prototype.writeIntLE = function (t, r, e, n) {
          if (t = +t, r = 0 | r, !n) {
            var i = Math.pow(2, 8 * e - 1);
            D(this, t, r, e, i - 1, -i);
          }
          var o = 0,
            f = 1,
            u = 0;
          for (this[r] = 255 & t; ++o < e && (f *= 256);) t < 0 && 0 === u && 0 !== this[r + o - 1] && (u = 1), this[r + o] = (t / f >> 0) - u & 255;
          return r + e;
        }, Buffer.prototype.writeIntBE = function (t, r, e, n) {
          if (t = +t, r = 0 | r, !n) {
            var i = Math.pow(2, 8 * e - 1);
            D(this, t, r, e, i - 1, -i);
          }
          var o = e - 1,
            f = 1,
            u = 0;
          for (this[r + o] = 255 & t; --o >= 0 && (f *= 256);) t < 0 && 0 === u && 0 !== this[r + o + 1] && (u = 1), this[r + o] = (t / f >> 0) - u & 255;
          return r + e;
        }, Buffer.prototype.writeInt8 = function (t, r, e) {
          return t = +t, r = 0 | r, e || D(this, t, r, 1, 127, -128), Buffer.TYPED_ARRAY_SUPPORT || (t = Math.floor(t)), t < 0 && (t = 255 + t + 1), this[r] = 255 & t, r + 1;
        }, Buffer.prototype.writeInt16LE = function (t, r, e) {
          return t = +t, r = 0 | r, e || D(this, t, r, 2, 32767, -32768), Buffer.TYPED_ARRAY_SUPPORT ? (this[r] = 255 & t, this[r + 1] = t >>> 8) : O(this, t, r, !0), r + 2;
        }, Buffer.prototype.writeInt16BE = function (t, r, e) {
          return t = +t, r = 0 | r, e || D(this, t, r, 2, 32767, -32768), Buffer.TYPED_ARRAY_SUPPORT ? (this[r] = t >>> 8, this[r + 1] = 255 & t) : O(this, t, r, !1), r + 2;
        }, Buffer.prototype.writeInt32LE = function (t, r, e) {
          return t = +t, r = 0 | r, e || D(this, t, r, 4, 2147483647, -2147483648), Buffer.TYPED_ARRAY_SUPPORT ? (this[r] = 255 & t, this[r + 1] = t >>> 8, this[r + 2] = t >>> 16, this[r + 3] = t >>> 24) : L(this, t, r, !0), r + 4;
        }, Buffer.prototype.writeInt32BE = function (t, r, e) {
          return t = +t, r = 0 | r, e || D(this, t, r, 4, 2147483647, -2147483648), t < 0 && (t = 4294967295 + t + 1), Buffer.TYPED_ARRAY_SUPPORT ? (this[r] = t >>> 24, this[r + 1] = t >>> 16, this[r + 2] = t >>> 8, this[r + 3] = 255 & t) : L(this, t, r, !1), r + 4;
        }, Buffer.prototype.writeFloatLE = function (t, r, e) {
          return N(this, t, r, !0, e);
        }, Buffer.prototype.writeFloatBE = function (t, r, e) {
          return N(this, t, r, !1, e);
        }, Buffer.prototype.writeDoubleLE = function (t, r, e) {
          return F(this, t, r, !0, e);
        }, Buffer.prototype.writeDoubleBE = function (t, r, e) {
          return F(this, t, r, !1, e);
        }, Buffer.prototype.copy = function (t, r, e, n) {
          if (e || (e = 0), n || 0 === n || (n = this.length), r >= t.length && (r = t.length), r || (r = 0), n > 0 && n < e && (n = e), n === e) return 0;
          if (0 === t.length || 0 === this.length) return 0;
          if (r < 0) throw new RangeError("targetStart out of bounds");
          if (e < 0 || e >= this.length) throw new RangeError("sourceStart out of bounds");
          if (n < 0) throw new RangeError("sourceEnd out of bounds");
          n > this.length && (n = this.length), t.length - r < n - e && (n = t.length - r + e);
          var i,
            o = n - e;
          if (this === t && e < r && r < n) for (i = o - 1; i >= 0; --i) t[i + r] = this[i + e];else if (o < 1e3 || !Buffer.TYPED_ARRAY_SUPPORT) for (i = 0; i < o; ++i) t[i + r] = this[i + e];else Uint8Array.prototype.set.call(t, this.subarray(e, e + o), r);
          return o;
        }, Buffer.prototype.fill = function (t, r, e, n) {
          if ("string" == typeof t) {
            if ("string" == typeof r ? (n = r, r = 0, e = this.length) : "string" == typeof e && (n = e, e = this.length), 1 === t.length) {
              var i = t.charCodeAt(0);
              i < 256 && (t = i);
            }
            if (void 0 !== n && "string" != typeof n) throw new TypeError("encoding must be a string");
            if ("string" == typeof n && !Buffer.isEncoding(n)) throw new TypeError("Unknown encoding: " + n);
          } else "number" == typeof t && (t = 255 & t);
          if (r < 0 || this.length < r || this.length < e) throw new RangeError("Out of range index");
          if (e <= r) return this;
          r >>>= 0, e = void 0 === e ? this.length : e >>> 0, t || (t = 0);
          var o;
          if ("number" == typeof t) for (o = r; o < e; ++o) this[o] = t;else {
            var f = Buffer.isBuffer(t) ? t : q(new Buffer(t, n).toString()),
              u = f.length;
            for (o = 0; o < e - r; ++o) this[o + r] = f[o % u];
          }
          return this;
        };
        var tt = /[^+\/0-9A-Za-z-_]/g;
      }).call(this, "undefined" != typeof __webpack_require__.g ? __webpack_require__.g : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {});
    }, {
      "base64-js": 30,
      ieee754: 32,
      isarray: 34
    }],
    30: [function (t, r, e) {
      "use strict";

      function n(t) {
        var r = t.length;
        if (r % 4 > 0) throw new Error("Invalid string. Length must be a multiple of 4");
        return "=" === t[r - 2] ? 2 : "=" === t[r - 1] ? 1 : 0;
      }
      function i(t) {
        return 3 * t.length / 4 - n(t);
      }
      function o(t) {
        var r,
          e,
          i,
          o,
          f,
          u,
          a = t.length;
        f = n(t), u = new h(3 * a / 4 - f), i = f > 0 ? a - 4 : a;
        var s = 0;
        for (r = 0, e = 0; r < i; r += 4, e += 3) o = c[t.charCodeAt(r)] << 18 | c[t.charCodeAt(r + 1)] << 12 | c[t.charCodeAt(r + 2)] << 6 | c[t.charCodeAt(r + 3)], u[s++] = o >> 16 & 255, u[s++] = o >> 8 & 255, u[s++] = 255 & o;
        return 2 === f ? (o = c[t.charCodeAt(r)] << 2 | c[t.charCodeAt(r + 1)] >> 4, u[s++] = 255 & o) : 1 === f && (o = c[t.charCodeAt(r)] << 10 | c[t.charCodeAt(r + 1)] << 4 | c[t.charCodeAt(r + 2)] >> 2, u[s++] = o >> 8 & 255, u[s++] = 255 & o), u;
      }
      function f(t) {
        return s[t >> 18 & 63] + s[t >> 12 & 63] + s[t >> 6 & 63] + s[63 & t];
      }
      function u(t, r, e) {
        for (var n, i = [], o = r; o < e; o += 3) n = (t[o] << 16) + (t[o + 1] << 8) + t[o + 2], i.push(f(n));
        return i.join("");
      }
      function a(t) {
        for (var r, e = t.length, n = e % 3, i = "", o = [], f = 16383, a = 0, c = e - n; a < c; a += f) o.push(u(t, a, a + f > c ? c : a + f));
        return 1 === n ? (r = t[e - 1], i += s[r >> 2], i += s[r << 4 & 63], i += "==") : 2 === n && (r = (t[e - 2] << 8) + t[e - 1], i += s[r >> 10], i += s[r >> 4 & 63], i += s[r << 2 & 63], i += "="), o.push(i), o.join("");
      }
      e.byteLength = i, e.toByteArray = o, e.fromByteArray = a;
      for (var s = [], c = [], h = "undefined" != typeof Uint8Array ? Uint8Array : Array, l = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", p = 0, d = l.length; p < d; ++p) s[p] = l[p], c[l.charCodeAt(p)] = p;
      c["-".charCodeAt(0)] = 62, c["_".charCodeAt(0)] = 63;
    }, {}],
    31: [function (t, r, e) {
      function n() {
        if (!(this instanceof n)) return new n();
      }
      !function (t) {
        function e(t) {
          for (var r in s) t[r] = s[r];
          return t;
        }
        function n(t, r) {
          return u(this, t).push(r), this;
        }
        function i(t, r) {
          function e() {
            o.call(n, t, e), r.apply(this, arguments);
          }
          var n = this;
          return e.originalListener = r, u(n, t).push(e), n;
        }
        function o(t, r) {
          function e(t) {
            return t !== r && t.originalListener !== r;
          }
          var n,
            i = this;
          if (arguments.length) {
            if (r) {
              if (n = u(i, t, !0)) {
                if (n = n.filter(e), !n.length) return o.call(i, t);
                i[a][t] = n;
              }
            } else if (n = i[a], n && (delete n[t], !Object.keys(n).length)) return o.call(i);
          } else delete i[a];
          return i;
        }
        function f(t, r) {
          function e(t) {
            t.call(o);
          }
          function n(t) {
            t.call(o, r);
          }
          function i(t) {
            t.apply(o, s);
          }
          var o = this,
            f = u(o, t, !0);
          if (!f) return !1;
          var a = arguments.length;
          if (1 === a) f.forEach(e);else if (2 === a) f.forEach(n);else {
            var s = Array.prototype.slice.call(arguments, 1);
            f.forEach(i);
          }
          return !!f.length;
        }
        function u(t, r, e) {
          if (!e || t[a]) {
            var n = t[a] || (t[a] = {});
            return n[r] || (n[r] = []);
          }
        }
        "undefined" != typeof r && (r.exports = t);
        var a = "listeners",
          s = {
            on: n,
            once: i,
            off: o,
            emit: f
          };
        e(t.prototype), t.mixin = e;
      }(n);
    }, {}],
    32: [function (t, r, e) {
      e.read = function (t, r, e, n, i) {
        var o,
          f,
          u = 8 * i - n - 1,
          a = (1 << u) - 1,
          s = a >> 1,
          c = -7,
          h = e ? i - 1 : 0,
          l = e ? -1 : 1,
          p = t[r + h];
        for (h += l, o = p & (1 << -c) - 1, p >>= -c, c += u; c > 0; o = 256 * o + t[r + h], h += l, c -= 8);
        for (f = o & (1 << -c) - 1, o >>= -c, c += n; c > 0; f = 256 * f + t[r + h], h += l, c -= 8);
        if (0 === o) o = 1 - s;else {
          if (o === a) return f ? NaN : (p ? -1 : 1) * (1 / 0);
          f += Math.pow(2, n), o -= s;
        }
        return (p ? -1 : 1) * f * Math.pow(2, o - n);
      }, e.write = function (t, r, e, n, i, o) {
        var f,
          u,
          a,
          s = 8 * o - i - 1,
          c = (1 << s) - 1,
          h = c >> 1,
          l = 23 === i ? Math.pow(2, -24) - Math.pow(2, -77) : 0,
          p = n ? 0 : o - 1,
          d = n ? 1 : -1,
          y = r < 0 || 0 === r && 1 / r < 0 ? 1 : 0;
        for (r = Math.abs(r), isNaN(r) || r === 1 / 0 ? (u = isNaN(r) ? 1 : 0, f = c) : (f = Math.floor(Math.log(r) / Math.LN2), r * (a = Math.pow(2, -f)) < 1 && (f--, a *= 2), r += f + h >= 1 ? l / a : l * Math.pow(2, 1 - h), r * a >= 2 && (f++, a /= 2), f + h >= c ? (u = 0, f = c) : f + h >= 1 ? (u = (r * a - 1) * Math.pow(2, i), f += h) : (u = r * Math.pow(2, h - 1) * Math.pow(2, i), f = 0)); i >= 8; t[e + p] = 255 & u, p += d, u /= 256, i -= 8);
        for (f = f << i | u, s += i; s > 0; t[e + p] = 255 & f, p += d, f /= 256, s -= 8);
        t[e + p - d] |= 128 * y;
      };
    }, {}],
    33: [function (t, r, e) {
      (function (Buffer) {
        var t, r, n, i;
        !function (e) {
          function o(t, r, n) {
            function i(t, r, e, n) {
              return this instanceof i ? v(this, t, r, e, n) : new i(t, r, e, n);
            }
            function o(t) {
              return !(!t || !t[F]);
            }
            function v(t, r, e, n, i) {
              if (E && A && (r instanceof A && (r = new E(r)), n instanceof A && (n = new E(n))), !(r || e || n || g)) return void (t.buffer = h(m, 0));
              if (!s(r, e)) {
                var o = g || Array;
                i = e, n = r, e = 0, r = new o(8);
              }
              t.buffer = r, t.offset = e |= 0, b !== _typeof(n) && ("string" == typeof n ? x(r, e, n, i || 10) : s(n, i) ? c(r, e, n, i) : "number" == typeof i ? (k(r, e + T, n), k(r, e + S, i)) : n > 0 ? O(r, e, n) : n < 0 ? L(r, e, n) : c(r, e, m, 0));
            }
            function x(t, r, e, n) {
              var i = 0,
                o = e.length,
                f = 0,
                u = 0;
              "-" === e[0] && i++;
              for (var a = i; i < o;) {
                var s = parseInt(e[i++], n);
                if (!(s >= 0)) break;
                u = u * n + s, f = f * n + Math.floor(u / B), u %= B;
              }
              a && (f = ~f, u ? u = B - u : f++), k(t, r + T, f), k(t, r + S, u);
            }
            function P() {
              var t = this.buffer,
                r = this.offset,
                e = _(t, r + T),
                i = _(t, r + S);
              return n || (e |= 0), e ? e * B + i : i;
            }
            function R(t) {
              var r = this.buffer,
                e = this.offset,
                i = _(r, e + T),
                o = _(r, e + S),
                f = "",
                u = !n && 2147483648 & i;
              for (u && (i = ~i, o = B - o), t = t || 10;;) {
                var a = i % t * B + o;
                if (i = Math.floor(i / t), o = Math.floor(a / t), f = (a % t).toString(t) + f, !i && !o) break;
              }
              return u && (f = "-" + f), f;
            }
            function k(t, r, e) {
              t[r + D] = 255 & e, e >>= 8, t[r + C] = 255 & e, e >>= 8, t[r + Y] = 255 & e, e >>= 8, t[r + I] = 255 & e;
            }
            function _(t, r) {
              return t[r + I] * U + (t[r + Y] << 16) + (t[r + C] << 8) + t[r + D];
            }
            var T = r ? 0 : 4,
              S = r ? 4 : 0,
              I = r ? 0 : 3,
              Y = r ? 1 : 2,
              C = r ? 2 : 1,
              D = r ? 3 : 0,
              O = r ? l : d,
              L = r ? p : y,
              M = i.prototype,
              N = "is" + t,
              F = "_" + N;
            return M.buffer = void 0, M.offset = 0, M[F] = !0, M.toNumber = P, M.toString = R, M.toJSON = P, M.toArray = f, w && (M.toBuffer = u), E && (M.toArrayBuffer = a), i[N] = o, e[t] = i, i;
          }
          function f(t) {
            var r = this.buffer,
              e = this.offset;
            return g = null, t !== !1 && 0 === e && 8 === r.length && x(r) ? r : h(r, e);
          }
          function u(t) {
            var r = this.buffer,
              e = this.offset;
            if (g = w, t !== !1 && 0 === e && 8 === r.length && Buffer.isBuffer(r)) return r;
            var n = new w(8);
            return c(n, 0, r, e), n;
          }
          function a(t) {
            var r = this.buffer,
              e = this.offset,
              n = r.buffer;
            if (g = E, t !== !1 && 0 === e && n instanceof A && 8 === n.byteLength) return n;
            var i = new E(8);
            return c(i, 0, r, e), i.buffer;
          }
          function s(t, r) {
            var e = t && t.length;
            return r |= 0, e && r + 8 <= e && "string" != typeof t[r];
          }
          function c(t, r, e, n) {
            r |= 0, n |= 0;
            for (var i = 0; i < 8; i++) t[r++] = 255 & e[n++];
          }
          function h(t, r) {
            return Array.prototype.slice.call(t, r, r + 8);
          }
          function l(t, r, e) {
            for (var n = r + 8; n > r;) t[--n] = 255 & e, e /= 256;
          }
          function p(t, r, e) {
            var n = r + 8;
            for (e++; n > r;) t[--n] = 255 & -e ^ 255, e /= 256;
          }
          function d(t, r, e) {
            for (var n = r + 8; r < n;) t[r++] = 255 & e, e /= 256;
          }
          function y(t, r, e) {
            var n = r + 8;
            for (e++; r < n;) t[r++] = 255 & -e ^ 255, e /= 256;
          }
          function v(t) {
            return !!t && "[object Array]" == Object.prototype.toString.call(t);
          }
          var g,
            b = "undefined",
            w = b !== _typeof(Buffer) && Buffer,
            E = b !== (typeof Uint8Array === "undefined" ? "undefined" : _typeof(Uint8Array)) && Uint8Array,
            A = b !== (typeof ArrayBuffer === "undefined" ? "undefined" : _typeof(ArrayBuffer)) && ArrayBuffer,
            m = [0, 0, 0, 0, 0, 0, 0, 0],
            x = Array.isArray || v,
            B = 4294967296,
            U = 16777216;
          t = o("Uint64BE", !0, !0), r = o("Int64BE", !0, !1), n = o("Uint64LE", !1, !0), i = o("Int64LE", !1, !1);
        }("object" == _typeof(e) && "string" != typeof e.nodeName ? e : this || {});
      }).call(this, t("buffer").Buffer);
    }, {
      buffer: 29
    }],
    34: [function (t, r, e) {
      var n = {}.toString;
      r.exports = Array.isArray || function (t) {
        return "[object Array]" == n.call(t);
      };
    }, {}]
  }, {}, [1])(1);
});

/***/ }),

/***/ "./js-sdk-legacy/src/worker/libs/pako.min.js":
/*!***************************************************!*\
  !*** ./js-sdk-legacy/src/worker/libs/pako.min.js ***!
  \***************************************************/
/***/ (function(module, exports) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
!function (t) {
  if ("object" == ( false ? 0 : _typeof(exports)) && "undefined" != "object") module.exports = t();else if (true) !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_FACTORY__ = (t),
		__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
		(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));else // removed by dead control flow
{}
}(function () {
  return function r(s, o, l) {
    function h(e, t) {
      if (!o[e]) {
        if (!s[e]) {
          var a = undefined;
          if (!t && a) return require(e, !0);
          if (d) return d(e, !0);
          var i = new Error("Cannot find module '" + e + "'");
          throw i.code = "MODULE_NOT_FOUND", i;
        }
        var n = o[e] = {
          exports: {}
        };
        s[e][0].call(n.exports, function (t) {
          return h(s[e][1][t] || t);
        }, n, n.exports, r, s, o, l);
      }
      return o[e].exports;
    }
    for (var d = undefined, t = 0; t < l.length; t++) h(l[t]);
    return h;
  }({
    1: [function (t, e, a) {
      "use strict";

      var s = t("./zlib/deflate"),
        o = t("./utils/common"),
        l = t("./utils/strings"),
        n = t("./zlib/messages"),
        r = t("./zlib/zstream"),
        h = Object.prototype.toString,
        d = 0,
        f = -1,
        _ = 0,
        u = 8;
      function c(t) {
        if (!(this instanceof c)) return new c(t);
        this.options = o.assign({
          level: f,
          method: u,
          chunkSize: 16384,
          windowBits: 15,
          memLevel: 8,
          strategy: _,
          to: ""
        }, t || {});
        var e = this.options;
        e.raw && 0 < e.windowBits ? e.windowBits = -e.windowBits : e.gzip && 0 < e.windowBits && e.windowBits < 16 && (e.windowBits += 16), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new r(), this.strm.avail_out = 0;
        var a = s.deflateInit2(this.strm, e.level, e.method, e.windowBits, e.memLevel, e.strategy);
        if (a !== d) throw new Error(n[a]);
        if (e.header && s.deflateSetHeader(this.strm, e.header), e.dictionary) {
          var i;
          if (i = "string" == typeof e.dictionary ? l.string2buf(e.dictionary) : "[object ArrayBuffer]" === h.call(e.dictionary) ? new Uint8Array(e.dictionary) : e.dictionary, (a = s.deflateSetDictionary(this.strm, i)) !== d) throw new Error(n[a]);
          this._dict_set = !0;
        }
      }
      function i(t, e) {
        var a = new c(e);
        if (a.push(t, !0), a.err) throw a.msg || n[a.err];
        return a.result;
      }
      c.prototype.push = function (t, e) {
        var a,
          i,
          n = this.strm,
          r = this.options.chunkSize;
        if (this.ended) return !1;
        i = e === ~~e ? e : !0 === e ? 4 : 0, "string" == typeof t ? n.input = l.string2buf(t) : "[object ArrayBuffer]" === h.call(t) ? n.input = new Uint8Array(t) : n.input = t, n.next_in = 0, n.avail_in = n.input.length;
        do {
          if (0 === n.avail_out && (n.output = new o.Buf8(r), n.next_out = 0, n.avail_out = r), 1 !== (a = s.deflate(n, i)) && a !== d) return this.onEnd(a), !(this.ended = !0);
          0 !== n.avail_out && (0 !== n.avail_in || 4 !== i && 2 !== i) || ("string" === this.options.to ? this.onData(l.buf2binstring(o.shrinkBuf(n.output, n.next_out))) : this.onData(o.shrinkBuf(n.output, n.next_out)));
        } while ((0 < n.avail_in || 0 === n.avail_out) && 1 !== a);
        return 4 === i ? (a = s.deflateEnd(this.strm), this.onEnd(a), this.ended = !0, a === d) : 2 !== i || (this.onEnd(d), !(n.avail_out = 0));
      }, c.prototype.onData = function (t) {
        this.chunks.push(t);
      }, c.prototype.onEnd = function (t) {
        t === d && ("string" === this.options.to ? this.result = this.chunks.join("") : this.result = o.flattenChunks(this.chunks)), this.chunks = [], this.err = t, this.msg = this.strm.msg;
      }, a.Deflate = c, a.deflate = i, a.deflateRaw = function (t, e) {
        return (e = e || {}).raw = !0, i(t, e);
      }, a.gzip = function (t, e) {
        return (e = e || {}).gzip = !0, i(t, e);
      };
    }, {
      "./utils/common": 3,
      "./utils/strings": 4,
      "./zlib/deflate": 8,
      "./zlib/messages": 13,
      "./zlib/zstream": 15
    }],
    2: [function (t, e, a) {
      "use strict";

      var f = t("./zlib/inflate"),
        _ = t("./utils/common"),
        u = t("./utils/strings"),
        c = t("./zlib/constants"),
        i = t("./zlib/messages"),
        n = t("./zlib/zstream"),
        r = t("./zlib/gzheader"),
        b = Object.prototype.toString;
      function s(t) {
        if (!(this instanceof s)) return new s(t);
        this.options = _.assign({
          chunkSize: 16384,
          windowBits: 0,
          to: ""
        }, t || {});
        var e = this.options;
        e.raw && 0 <= e.windowBits && e.windowBits < 16 && (e.windowBits = -e.windowBits, 0 === e.windowBits && (e.windowBits = -15)), !(0 <= e.windowBits && e.windowBits < 16) || t && t.windowBits || (e.windowBits += 32), 15 < e.windowBits && e.windowBits < 48 && 0 == (15 & e.windowBits) && (e.windowBits |= 15), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new n(), this.strm.avail_out = 0;
        var a = f.inflateInit2(this.strm, e.windowBits);
        if (a !== c.Z_OK) throw new Error(i[a]);
        if (this.header = new r(), f.inflateGetHeader(this.strm, this.header), e.dictionary && ("string" == typeof e.dictionary ? e.dictionary = u.string2buf(e.dictionary) : "[object ArrayBuffer]" === b.call(e.dictionary) && (e.dictionary = new Uint8Array(e.dictionary)), e.raw && (a = f.inflateSetDictionary(this.strm, e.dictionary)) !== c.Z_OK)) throw new Error(i[a]);
      }
      function o(t, e) {
        var a = new s(e);
        if (a.push(t, !0), a.err) throw a.msg || i[a.err];
        return a.result;
      }
      s.prototype.push = function (t, e) {
        var a,
          i,
          n,
          r,
          s,
          o = this.strm,
          l = this.options.chunkSize,
          h = this.options.dictionary,
          d = !1;
        if (this.ended) return !1;
        i = e === ~~e ? e : !0 === e ? c.Z_FINISH : c.Z_NO_FLUSH, "string" == typeof t ? o.input = u.binstring2buf(t) : "[object ArrayBuffer]" === b.call(t) ? o.input = new Uint8Array(t) : o.input = t, o.next_in = 0, o.avail_in = o.input.length;
        do {
          if (0 === o.avail_out && (o.output = new _.Buf8(l), o.next_out = 0, o.avail_out = l), (a = f.inflate(o, c.Z_NO_FLUSH)) === c.Z_NEED_DICT && h && (a = f.inflateSetDictionary(this.strm, h)), a === c.Z_BUF_ERROR && !0 === d && (a = c.Z_OK, d = !1), a !== c.Z_STREAM_END && a !== c.Z_OK) return this.onEnd(a), !(this.ended = !0);
          o.next_out && (0 !== o.avail_out && a !== c.Z_STREAM_END && (0 !== o.avail_in || i !== c.Z_FINISH && i !== c.Z_SYNC_FLUSH) || ("string" === this.options.to ? (n = u.utf8border(o.output, o.next_out), r = o.next_out - n, s = u.buf2string(o.output, n), o.next_out = r, o.avail_out = l - r, r && _.arraySet(o.output, o.output, n, r, 0), this.onData(s)) : this.onData(_.shrinkBuf(o.output, o.next_out)))), 0 === o.avail_in && 0 === o.avail_out && (d = !0);
        } while ((0 < o.avail_in || 0 === o.avail_out) && a !== c.Z_STREAM_END);
        return a === c.Z_STREAM_END && (i = c.Z_FINISH), i === c.Z_FINISH ? (a = f.inflateEnd(this.strm), this.onEnd(a), this.ended = !0, a === c.Z_OK) : i !== c.Z_SYNC_FLUSH || (this.onEnd(c.Z_OK), !(o.avail_out = 0));
      }, s.prototype.onData = function (t) {
        this.chunks.push(t);
      }, s.prototype.onEnd = function (t) {
        t === c.Z_OK && ("string" === this.options.to ? this.result = this.chunks.join("") : this.result = _.flattenChunks(this.chunks)), this.chunks = [], this.err = t, this.msg = this.strm.msg;
      }, a.Inflate = s, a.inflate = o, a.inflateRaw = function (t, e) {
        return (e = e || {}).raw = !0, o(t, e);
      }, a.ungzip = o;
    }, {
      "./utils/common": 3,
      "./utils/strings": 4,
      "./zlib/constants": 6,
      "./zlib/gzheader": 9,
      "./zlib/inflate": 11,
      "./zlib/messages": 13,
      "./zlib/zstream": 15
    }],
    3: [function (t, e, a) {
      "use strict";

      var i = "undefined" != typeof Uint8Array && "undefined" != typeof Uint16Array && "undefined" != typeof Int32Array;
      a.assign = function (t) {
        for (var e, a, i = Array.prototype.slice.call(arguments, 1); i.length;) {
          var n = i.shift();
          if (n) {
            if ("object" != _typeof(n)) throw new TypeError(n + "must be non-object");
            for (var r in n) e = n, a = r, Object.prototype.hasOwnProperty.call(e, a) && (t[r] = n[r]);
          }
        }
        return t;
      }, a.shrinkBuf = function (t, e) {
        return t.length === e ? t : t.subarray ? t.subarray(0, e) : (t.length = e, t);
      };
      var n = {
          arraySet: function arraySet(t, e, a, i, n) {
            if (e.subarray && t.subarray) t.set(e.subarray(a, a + i), n);else for (var r = 0; r < i; r++) t[n + r] = e[a + r];
          },
          flattenChunks: function flattenChunks(t) {
            var e, a, i, n, r, s;
            for (e = i = 0, a = t.length; e < a; e++) i += t[e].length;
            for (s = new Uint8Array(i), e = n = 0, a = t.length; e < a; e++) r = t[e], s.set(r, n), n += r.length;
            return s;
          }
        },
        r = {
          arraySet: function arraySet(t, e, a, i, n) {
            for (var r = 0; r < i; r++) t[n + r] = e[a + r];
          },
          flattenChunks: function flattenChunks(t) {
            return [].concat.apply([], t);
          }
        };
      a.setTyped = function (t) {
        t ? (a.Buf8 = Uint8Array, a.Buf16 = Uint16Array, a.Buf32 = Int32Array, a.assign(a, n)) : (a.Buf8 = Array, a.Buf16 = Array, a.Buf32 = Array, a.assign(a, r));
      }, a.setTyped(i);
    }, {}],
    4: [function (t, e, a) {
      "use strict";

      var l = t("./common"),
        n = !0,
        r = !0;
      try {
        String.fromCharCode.apply(null, [0]);
      } catch (t) {
        n = !1;
      }
      try {
        String.fromCharCode.apply(null, new Uint8Array(1));
      } catch (t) {
        r = !1;
      }
      for (var h = new l.Buf8(256), i = 0; i < 256; i++) h[i] = 252 <= i ? 6 : 248 <= i ? 5 : 240 <= i ? 4 : 224 <= i ? 3 : 192 <= i ? 2 : 1;
      function d(t, e) {
        if (e < 65534 && (t.subarray && r || !t.subarray && n)) return String.fromCharCode.apply(null, l.shrinkBuf(t, e));
        for (var a = "", i = 0; i < e; i++) a += String.fromCharCode(t[i]);
        return a;
      }
      h[254] = h[254] = 1, a.string2buf = function (t) {
        var e,
          a,
          i,
          n,
          r,
          s = t.length,
          o = 0;
        for (n = 0; n < s; n++) 55296 == (64512 & (a = t.charCodeAt(n))) && n + 1 < s && 56320 == (64512 & (i = t.charCodeAt(n + 1))) && (a = 65536 + (a - 55296 << 10) + (i - 56320), n++), o += a < 128 ? 1 : a < 2048 ? 2 : a < 65536 ? 3 : 4;
        for (e = new l.Buf8(o), n = r = 0; r < o; n++) 55296 == (64512 & (a = t.charCodeAt(n))) && n + 1 < s && 56320 == (64512 & (i = t.charCodeAt(n + 1))) && (a = 65536 + (a - 55296 << 10) + (i - 56320), n++), a < 128 ? e[r++] = a : (a < 2048 ? e[r++] = 192 | a >>> 6 : (a < 65536 ? e[r++] = 224 | a >>> 12 : (e[r++] = 240 | a >>> 18, e[r++] = 128 | a >>> 12 & 63), e[r++] = 128 | a >>> 6 & 63), e[r++] = 128 | 63 & a);
        return e;
      }, a.buf2binstring = function (t) {
        return d(t, t.length);
      }, a.binstring2buf = function (t) {
        for (var e = new l.Buf8(t.length), a = 0, i = e.length; a < i; a++) e[a] = t.charCodeAt(a);
        return e;
      }, a.buf2string = function (t, e) {
        var a,
          i,
          n,
          r,
          s = e || t.length,
          o = new Array(2 * s);
        for (a = i = 0; a < s;) if ((n = t[a++]) < 128) o[i++] = n;else if (4 < (r = h[n])) o[i++] = 65533, a += r - 1;else {
          for (n &= 2 === r ? 31 : 3 === r ? 15 : 7; 1 < r && a < s;) n = n << 6 | 63 & t[a++], r--;
          1 < r ? o[i++] = 65533 : n < 65536 ? o[i++] = n : (n -= 65536, o[i++] = 55296 | n >> 10 & 1023, o[i++] = 56320 | 1023 & n);
        }
        return d(o, i);
      }, a.utf8border = function (t, e) {
        var a;
        for ((e = e || t.length) > t.length && (e = t.length), a = e - 1; 0 <= a && 128 == (192 & t[a]);) a--;
        return a < 0 ? e : 0 === a ? e : a + h[t[a]] > e ? a : e;
      };
    }, {
      "./common": 3
    }],
    5: [function (t, e, a) {
      "use strict";

      e.exports = function (t, e, a, i) {
        for (var n = 65535 & t | 0, r = t >>> 16 & 65535 | 0, s = 0; 0 !== a;) {
          for (a -= s = 2e3 < a ? 2e3 : a; r = r + (n = n + e[i++] | 0) | 0, --s;);
          n %= 65521, r %= 65521;
        }
        return n | r << 16 | 0;
      };
    }, {}],
    6: [function (t, e, a) {
      "use strict";

      e.exports = {
        Z_NO_FLUSH: 0,
        Z_PARTIAL_FLUSH: 1,
        Z_SYNC_FLUSH: 2,
        Z_FULL_FLUSH: 3,
        Z_FINISH: 4,
        Z_BLOCK: 5,
        Z_TREES: 6,
        Z_OK: 0,
        Z_STREAM_END: 1,
        Z_NEED_DICT: 2,
        Z_ERRNO: -1,
        Z_STREAM_ERROR: -2,
        Z_DATA_ERROR: -3,
        Z_BUF_ERROR: -5,
        Z_NO_COMPRESSION: 0,
        Z_BEST_SPEED: 1,
        Z_BEST_COMPRESSION: 9,
        Z_DEFAULT_COMPRESSION: -1,
        Z_FILTERED: 1,
        Z_HUFFMAN_ONLY: 2,
        Z_RLE: 3,
        Z_FIXED: 4,
        Z_DEFAULT_STRATEGY: 0,
        Z_BINARY: 0,
        Z_TEXT: 1,
        Z_UNKNOWN: 2,
        Z_DEFLATED: 8
      };
    }, {}],
    7: [function (t, e, a) {
      "use strict";

      var o = function () {
        for (var t, e = [], a = 0; a < 256; a++) {
          t = a;
          for (var i = 0; i < 8; i++) t = 1 & t ? 3988292384 ^ t >>> 1 : t >>> 1;
          e[a] = t;
        }
        return e;
      }();
      e.exports = function (t, e, a, i) {
        var n = o,
          r = i + a;
        t ^= -1;
        for (var s = i; s < r; s++) t = t >>> 8 ^ n[255 & (t ^ e[s])];
        return -1 ^ t;
      };
    }, {}],
    8: [function (t, e, a) {
      "use strict";

      var l,
        _ = t("../utils/common"),
        h = t("./trees"),
        u = t("./adler32"),
        c = t("./crc32"),
        i = t("./messages"),
        d = 0,
        f = 4,
        b = 0,
        g = -2,
        m = -1,
        w = 4,
        n = 2,
        p = 8,
        v = 9,
        r = 286,
        s = 30,
        o = 19,
        k = 2 * r + 1,
        y = 15,
        x = 3,
        z = 258,
        B = z + x + 1,
        S = 42,
        E = 113,
        A = 1,
        Z = 2,
        R = 3,
        C = 4;
      function N(t, e) {
        return t.msg = i[e], e;
      }
      function O(t) {
        return (t << 1) - (4 < t ? 9 : 0);
      }
      function D(t) {
        for (var e = t.length; 0 <= --e;) t[e] = 0;
      }
      function I(t) {
        var e = t.state,
          a = e.pending;
        a > t.avail_out && (a = t.avail_out), 0 !== a && (_.arraySet(t.output, e.pending_buf, e.pending_out, a, t.next_out), t.next_out += a, e.pending_out += a, t.total_out += a, t.avail_out -= a, e.pending -= a, 0 === e.pending && (e.pending_out = 0));
      }
      function U(t, e) {
        h._tr_flush_block(t, 0 <= t.block_start ? t.block_start : -1, t.strstart - t.block_start, e), t.block_start = t.strstart, I(t.strm);
      }
      function T(t, e) {
        t.pending_buf[t.pending++] = e;
      }
      function F(t, e) {
        t.pending_buf[t.pending++] = e >>> 8 & 255, t.pending_buf[t.pending++] = 255 & e;
      }
      function L(t, e) {
        var a,
          i,
          n = t.max_chain_length,
          r = t.strstart,
          s = t.prev_length,
          o = t.nice_match,
          l = t.strstart > t.w_size - B ? t.strstart - (t.w_size - B) : 0,
          h = t.window,
          d = t.w_mask,
          f = t.prev,
          _ = t.strstart + z,
          u = h[r + s - 1],
          c = h[r + s];
        t.prev_length >= t.good_match && (n >>= 2), o > t.lookahead && (o = t.lookahead);
        do {
          if (h[(a = e) + s] === c && h[a + s - 1] === u && h[a] === h[r] && h[++a] === h[r + 1]) {
            r += 2, a++;
            do {} while (h[++r] === h[++a] && h[++r] === h[++a] && h[++r] === h[++a] && h[++r] === h[++a] && h[++r] === h[++a] && h[++r] === h[++a] && h[++r] === h[++a] && h[++r] === h[++a] && r < _);
            if (i = z - (_ - r), r = _ - z, s < i) {
              if (t.match_start = e, o <= (s = i)) break;
              u = h[r + s - 1], c = h[r + s];
            }
          }
        } while ((e = f[e & d]) > l && 0 != --n);
        return s <= t.lookahead ? s : t.lookahead;
      }
      function H(t) {
        var e,
          a,
          i,
          n,
          r,
          s,
          o,
          l,
          h,
          d,
          f = t.w_size;
        do {
          if (n = t.window_size - t.lookahead - t.strstart, t.strstart >= f + (f - B)) {
            for (_.arraySet(t.window, t.window, f, f, 0), t.match_start -= f, t.strstart -= f, t.block_start -= f, e = a = t.hash_size; i = t.head[--e], t.head[e] = f <= i ? i - f : 0, --a;);
            for (e = a = f; i = t.prev[--e], t.prev[e] = f <= i ? i - f : 0, --a;);
            n += f;
          }
          if (0 === t.strm.avail_in) break;
          if (s = t.strm, o = t.window, l = t.strstart + t.lookahead, h = n, d = void 0, d = s.avail_in, h < d && (d = h), a = 0 === d ? 0 : (s.avail_in -= d, _.arraySet(o, s.input, s.next_in, d, l), 1 === s.state.wrap ? s.adler = u(s.adler, o, d, l) : 2 === s.state.wrap && (s.adler = c(s.adler, o, d, l)), s.next_in += d, s.total_in += d, d), t.lookahead += a, t.lookahead + t.insert >= x) for (r = t.strstart - t.insert, t.ins_h = t.window[r], t.ins_h = (t.ins_h << t.hash_shift ^ t.window[r + 1]) & t.hash_mask; t.insert && (t.ins_h = (t.ins_h << t.hash_shift ^ t.window[r + x - 1]) & t.hash_mask, t.prev[r & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = r, r++, t.insert--, !(t.lookahead + t.insert < x)););
        } while (t.lookahead < B && 0 !== t.strm.avail_in);
      }
      function j(t, e) {
        for (var a, i;;) {
          if (t.lookahead < B) {
            if (H(t), t.lookahead < B && e === d) return A;
            if (0 === t.lookahead) break;
          }
          if (a = 0, t.lookahead >= x && (t.ins_h = (t.ins_h << t.hash_shift ^ t.window[t.strstart + x - 1]) & t.hash_mask, a = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart), 0 !== a && t.strstart - a <= t.w_size - B && (t.match_length = L(t, a)), t.match_length >= x) {
            if (i = h._tr_tally(t, t.strstart - t.match_start, t.match_length - x), t.lookahead -= t.match_length, t.match_length <= t.max_lazy_match && t.lookahead >= x) {
              for (t.match_length--; t.strstart++, t.ins_h = (t.ins_h << t.hash_shift ^ t.window[t.strstart + x - 1]) & t.hash_mask, a = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart, 0 != --t.match_length;);
              t.strstart++;
            } else t.strstart += t.match_length, t.match_length = 0, t.ins_h = t.window[t.strstart], t.ins_h = (t.ins_h << t.hash_shift ^ t.window[t.strstart + 1]) & t.hash_mask;
          } else i = h._tr_tally(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++;
          if (i && (U(t, !1), 0 === t.strm.avail_out)) return A;
        }
        return t.insert = t.strstart < x - 1 ? t.strstart : x - 1, e === f ? (U(t, !0), 0 === t.strm.avail_out ? R : C) : t.last_lit && (U(t, !1), 0 === t.strm.avail_out) ? A : Z;
      }
      function K(t, e) {
        for (var a, i, n;;) {
          if (t.lookahead < B) {
            if (H(t), t.lookahead < B && e === d) return A;
            if (0 === t.lookahead) break;
          }
          if (a = 0, t.lookahead >= x && (t.ins_h = (t.ins_h << t.hash_shift ^ t.window[t.strstart + x - 1]) & t.hash_mask, a = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart), t.prev_length = t.match_length, t.prev_match = t.match_start, t.match_length = x - 1, 0 !== a && t.prev_length < t.max_lazy_match && t.strstart - a <= t.w_size - B && (t.match_length = L(t, a), t.match_length <= 5 && (1 === t.strategy || t.match_length === x && 4096 < t.strstart - t.match_start) && (t.match_length = x - 1)), t.prev_length >= x && t.match_length <= t.prev_length) {
            for (n = t.strstart + t.lookahead - x, i = h._tr_tally(t, t.strstart - 1 - t.prev_match, t.prev_length - x), t.lookahead -= t.prev_length - 1, t.prev_length -= 2; ++t.strstart <= n && (t.ins_h = (t.ins_h << t.hash_shift ^ t.window[t.strstart + x - 1]) & t.hash_mask, a = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart), 0 != --t.prev_length;);
            if (t.match_available = 0, t.match_length = x - 1, t.strstart++, i && (U(t, !1), 0 === t.strm.avail_out)) return A;
          } else if (t.match_available) {
            if ((i = h._tr_tally(t, 0, t.window[t.strstart - 1])) && U(t, !1), t.strstart++, t.lookahead--, 0 === t.strm.avail_out) return A;
          } else t.match_available = 1, t.strstart++, t.lookahead--;
        }
        return t.match_available && (i = h._tr_tally(t, 0, t.window[t.strstart - 1]), t.match_available = 0), t.insert = t.strstart < x - 1 ? t.strstart : x - 1, e === f ? (U(t, !0), 0 === t.strm.avail_out ? R : C) : t.last_lit && (U(t, !1), 0 === t.strm.avail_out) ? A : Z;
      }
      function M(t, e, a, i, n) {
        this.good_length = t, this.max_lazy = e, this.nice_length = a, this.max_chain = i, this.func = n;
      }
      function P() {
        this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = p, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new _.Buf16(2 * k), this.dyn_dtree = new _.Buf16(2 * (2 * s + 1)), this.bl_tree = new _.Buf16(2 * (2 * o + 1)), D(this.dyn_ltree), D(this.dyn_dtree), D(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new _.Buf16(y + 1), this.heap = new _.Buf16(2 * r + 1), D(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new _.Buf16(2 * r + 1), D(this.depth), this.l_buf = 0, this.lit_bufsize = 0, this.last_lit = 0, this.d_buf = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
      }
      function Y(t) {
        var e;
        return t && t.state ? (t.total_in = t.total_out = 0, t.data_type = n, (e = t.state).pending = 0, e.pending_out = 0, e.wrap < 0 && (e.wrap = -e.wrap), e.status = e.wrap ? S : E, t.adler = 2 === e.wrap ? 0 : 1, e.last_flush = d, h._tr_init(e), b) : N(t, g);
      }
      function q(t) {
        var e,
          a = Y(t);
        return a === b && ((e = t.state).window_size = 2 * e.w_size, D(e.head), e.max_lazy_match = l[e.level].max_lazy, e.good_match = l[e.level].good_length, e.nice_match = l[e.level].nice_length, e.max_chain_length = l[e.level].max_chain, e.strstart = 0, e.block_start = 0, e.lookahead = 0, e.insert = 0, e.match_length = e.prev_length = x - 1, e.match_available = 0, e.ins_h = 0), a;
      }
      function G(t, e, a, i, n, r) {
        if (!t) return g;
        var s = 1;
        if (e === m && (e = 6), i < 0 ? (s = 0, i = -i) : 15 < i && (s = 2, i -= 16), n < 1 || v < n || a !== p || i < 8 || 15 < i || e < 0 || 9 < e || r < 0 || w < r) return N(t, g);
        8 === i && (i = 9);
        var o = new P();
        return (t.state = o).strm = t, o.wrap = s, o.gzhead = null, o.w_bits = i, o.w_size = 1 << o.w_bits, o.w_mask = o.w_size - 1, o.hash_bits = n + 7, o.hash_size = 1 << o.hash_bits, o.hash_mask = o.hash_size - 1, o.hash_shift = ~~((o.hash_bits + x - 1) / x), o.window = new _.Buf8(2 * o.w_size), o.head = new _.Buf16(o.hash_size), o.prev = new _.Buf16(o.w_size), o.lit_bufsize = 1 << n + 6, o.pending_buf_size = 4 * o.lit_bufsize, o.pending_buf = new _.Buf8(o.pending_buf_size), o.d_buf = 1 * o.lit_bufsize, o.l_buf = 3 * o.lit_bufsize, o.level = e, o.strategy = r, o.method = a, q(t);
      }
      l = [new M(0, 0, 0, 0, function (t, e) {
        var a = 65535;
        for (a > t.pending_buf_size - 5 && (a = t.pending_buf_size - 5);;) {
          if (t.lookahead <= 1) {
            if (H(t), 0 === t.lookahead && e === d) return A;
            if (0 === t.lookahead) break;
          }
          t.strstart += t.lookahead, t.lookahead = 0;
          var i = t.block_start + a;
          if ((0 === t.strstart || t.strstart >= i) && (t.lookahead = t.strstart - i, t.strstart = i, U(t, !1), 0 === t.strm.avail_out)) return A;
          if (t.strstart - t.block_start >= t.w_size - B && (U(t, !1), 0 === t.strm.avail_out)) return A;
        }
        return t.insert = 0, e === f ? (U(t, !0), 0 === t.strm.avail_out ? R : C) : (t.strstart > t.block_start && (U(t, !1), t.strm.avail_out), A);
      }), new M(4, 4, 8, 4, j), new M(4, 5, 16, 8, j), new M(4, 6, 32, 32, j), new M(4, 4, 16, 16, K), new M(8, 16, 32, 32, K), new M(8, 16, 128, 128, K), new M(8, 32, 128, 256, K), new M(32, 128, 258, 1024, K), new M(32, 258, 258, 4096, K)], a.deflateInit = function (t, e) {
        return G(t, e, p, 15, 8, 0);
      }, a.deflateInit2 = G, a.deflateReset = q, a.deflateResetKeep = Y, a.deflateSetHeader = function (t, e) {
        return t && t.state ? 2 !== t.state.wrap ? g : (t.state.gzhead = e, b) : g;
      }, a.deflate = function (t, e) {
        var a, i, n, r;
        if (!t || !t.state || 5 < e || e < 0) return t ? N(t, g) : g;
        if (i = t.state, !t.output || !t.input && 0 !== t.avail_in || 666 === i.status && e !== f) return N(t, 0 === t.avail_out ? -5 : g);
        if (i.strm = t, a = i.last_flush, i.last_flush = e, i.status === S) if (2 === i.wrap) t.adler = 0, T(i, 31), T(i, 139), T(i, 8), i.gzhead ? (T(i, (i.gzhead.text ? 1 : 0) + (i.gzhead.hcrc ? 2 : 0) + (i.gzhead.extra ? 4 : 0) + (i.gzhead.name ? 8 : 0) + (i.gzhead.comment ? 16 : 0)), T(i, 255 & i.gzhead.time), T(i, i.gzhead.time >> 8 & 255), T(i, i.gzhead.time >> 16 & 255), T(i, i.gzhead.time >> 24 & 255), T(i, 9 === i.level ? 2 : 2 <= i.strategy || i.level < 2 ? 4 : 0), T(i, 255 & i.gzhead.os), i.gzhead.extra && i.gzhead.extra.length && (T(i, 255 & i.gzhead.extra.length), T(i, i.gzhead.extra.length >> 8 & 255)), i.gzhead.hcrc && (t.adler = c(t.adler, i.pending_buf, i.pending, 0)), i.gzindex = 0, i.status = 69) : (T(i, 0), T(i, 0), T(i, 0), T(i, 0), T(i, 0), T(i, 9 === i.level ? 2 : 2 <= i.strategy || i.level < 2 ? 4 : 0), T(i, 3), i.status = E);else {
          var s = p + (i.w_bits - 8 << 4) << 8;
          s |= (2 <= i.strategy || i.level < 2 ? 0 : i.level < 6 ? 1 : 6 === i.level ? 2 : 3) << 6, 0 !== i.strstart && (s |= 32), s += 31 - s % 31, i.status = E, F(i, s), 0 !== i.strstart && (F(i, t.adler >>> 16), F(i, 65535 & t.adler)), t.adler = 1;
        }
        if (69 === i.status) if (i.gzhead.extra) {
          for (n = i.pending; i.gzindex < (65535 & i.gzhead.extra.length) && (i.pending !== i.pending_buf_size || (i.gzhead.hcrc && i.pending > n && (t.adler = c(t.adler, i.pending_buf, i.pending - n, n)), I(t), n = i.pending, i.pending !== i.pending_buf_size));) T(i, 255 & i.gzhead.extra[i.gzindex]), i.gzindex++;
          i.gzhead.hcrc && i.pending > n && (t.adler = c(t.adler, i.pending_buf, i.pending - n, n)), i.gzindex === i.gzhead.extra.length && (i.gzindex = 0, i.status = 73);
        } else i.status = 73;
        if (73 === i.status) if (i.gzhead.name) {
          n = i.pending;
          do {
            if (i.pending === i.pending_buf_size && (i.gzhead.hcrc && i.pending > n && (t.adler = c(t.adler, i.pending_buf, i.pending - n, n)), I(t), n = i.pending, i.pending === i.pending_buf_size)) {
              r = 1;
              break;
            }
            T(i, r = i.gzindex < i.gzhead.name.length ? 255 & i.gzhead.name.charCodeAt(i.gzindex++) : 0);
          } while (0 !== r);
          i.gzhead.hcrc && i.pending > n && (t.adler = c(t.adler, i.pending_buf, i.pending - n, n)), 0 === r && (i.gzindex = 0, i.status = 91);
        } else i.status = 91;
        if (91 === i.status) if (i.gzhead.comment) {
          n = i.pending;
          do {
            if (i.pending === i.pending_buf_size && (i.gzhead.hcrc && i.pending > n && (t.adler = c(t.adler, i.pending_buf, i.pending - n, n)), I(t), n = i.pending, i.pending === i.pending_buf_size)) {
              r = 1;
              break;
            }
            T(i, r = i.gzindex < i.gzhead.comment.length ? 255 & i.gzhead.comment.charCodeAt(i.gzindex++) : 0);
          } while (0 !== r);
          i.gzhead.hcrc && i.pending > n && (t.adler = c(t.adler, i.pending_buf, i.pending - n, n)), 0 === r && (i.status = 103);
        } else i.status = 103;
        if (103 === i.status && (i.gzhead.hcrc ? (i.pending + 2 > i.pending_buf_size && I(t), i.pending + 2 <= i.pending_buf_size && (T(i, 255 & t.adler), T(i, t.adler >> 8 & 255), t.adler = 0, i.status = E)) : i.status = E), 0 !== i.pending) {
          if (I(t), 0 === t.avail_out) return i.last_flush = -1, b;
        } else if (0 === t.avail_in && O(e) <= O(a) && e !== f) return N(t, -5);
        if (666 === i.status && 0 !== t.avail_in) return N(t, -5);
        if (0 !== t.avail_in || 0 !== i.lookahead || e !== d && 666 !== i.status) {
          var o = 2 === i.strategy ? function (t, e) {
            for (var a;;) {
              if (0 === t.lookahead && (H(t), 0 === t.lookahead)) {
                if (e === d) return A;
                break;
              }
              if (t.match_length = 0, a = h._tr_tally(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++, a && (U(t, !1), 0 === t.strm.avail_out)) return A;
            }
            return t.insert = 0, e === f ? (U(t, !0), 0 === t.strm.avail_out ? R : C) : t.last_lit && (U(t, !1), 0 === t.strm.avail_out) ? A : Z;
          }(i, e) : 3 === i.strategy ? function (t, e) {
            for (var a, i, n, r, s = t.window;;) {
              if (t.lookahead <= z) {
                if (H(t), t.lookahead <= z && e === d) return A;
                if (0 === t.lookahead) break;
              }
              if (t.match_length = 0, t.lookahead >= x && 0 < t.strstart && (i = s[n = t.strstart - 1]) === s[++n] && i === s[++n] && i === s[++n]) {
                r = t.strstart + z;
                do {} while (i === s[++n] && i === s[++n] && i === s[++n] && i === s[++n] && i === s[++n] && i === s[++n] && i === s[++n] && i === s[++n] && n < r);
                t.match_length = z - (r - n), t.match_length > t.lookahead && (t.match_length = t.lookahead);
              }
              if (t.match_length >= x ? (a = h._tr_tally(t, 1, t.match_length - x), t.lookahead -= t.match_length, t.strstart += t.match_length, t.match_length = 0) : (a = h._tr_tally(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++), a && (U(t, !1), 0 === t.strm.avail_out)) return A;
            }
            return t.insert = 0, e === f ? (U(t, !0), 0 === t.strm.avail_out ? R : C) : t.last_lit && (U(t, !1), 0 === t.strm.avail_out) ? A : Z;
          }(i, e) : l[i.level].func(i, e);
          if (o !== R && o !== C || (i.status = 666), o === A || o === R) return 0 === t.avail_out && (i.last_flush = -1), b;
          if (o === Z && (1 === e ? h._tr_align(i) : 5 !== e && (h._tr_stored_block(i, 0, 0, !1), 3 === e && (D(i.head), 0 === i.lookahead && (i.strstart = 0, i.block_start = 0, i.insert = 0))), I(t), 0 === t.avail_out)) return i.last_flush = -1, b;
        }
        return e !== f ? b : i.wrap <= 0 ? 1 : (2 === i.wrap ? (T(i, 255 & t.adler), T(i, t.adler >> 8 & 255), T(i, t.adler >> 16 & 255), T(i, t.adler >> 24 & 255), T(i, 255 & t.total_in), T(i, t.total_in >> 8 & 255), T(i, t.total_in >> 16 & 255), T(i, t.total_in >> 24 & 255)) : (F(i, t.adler >>> 16), F(i, 65535 & t.adler)), I(t), 0 < i.wrap && (i.wrap = -i.wrap), 0 !== i.pending ? b : 1);
      }, a.deflateEnd = function (t) {
        var e;
        return t && t.state ? (e = t.state.status) !== S && 69 !== e && 73 !== e && 91 !== e && 103 !== e && e !== E && 666 !== e ? N(t, g) : (t.state = null, e === E ? N(t, -3) : b) : g;
      }, a.deflateSetDictionary = function (t, e) {
        var a,
          i,
          n,
          r,
          s,
          o,
          l,
          h,
          d = e.length;
        if (!t || !t.state) return g;
        if (2 === (r = (a = t.state).wrap) || 1 === r && a.status !== S || a.lookahead) return g;
        for (1 === r && (t.adler = u(t.adler, e, d, 0)), a.wrap = 0, d >= a.w_size && (0 === r && (D(a.head), a.strstart = 0, a.block_start = 0, a.insert = 0), h = new _.Buf8(a.w_size), _.arraySet(h, e, d - a.w_size, a.w_size, 0), e = h, d = a.w_size), s = t.avail_in, o = t.next_in, l = t.input, t.avail_in = d, t.next_in = 0, t.input = e, H(a); a.lookahead >= x;) {
          for (i = a.strstart, n = a.lookahead - (x - 1); a.ins_h = (a.ins_h << a.hash_shift ^ a.window[i + x - 1]) & a.hash_mask, a.prev[i & a.w_mask] = a.head[a.ins_h], a.head[a.ins_h] = i, i++, --n;);
          a.strstart = i, a.lookahead = x - 1, H(a);
        }
        return a.strstart += a.lookahead, a.block_start = a.strstart, a.insert = a.lookahead, a.lookahead = 0, a.match_length = a.prev_length = x - 1, a.match_available = 0, t.next_in = o, t.input = l, t.avail_in = s, a.wrap = r, b;
      }, a.deflateInfo = "pako deflate (from Nodeca project)";
    }, {
      "../utils/common": 3,
      "./adler32": 5,
      "./crc32": 7,
      "./messages": 13,
      "./trees": 14
    }],
    9: [function (t, e, a) {
      "use strict";

      e.exports = function () {
        this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = !1;
      };
    }, {}],
    10: [function (t, e, a) {
      "use strict";

      e.exports = function (t, e) {
        var a, i, n, r, s, o, l, h, d, f, _, u, c, b, g, m, w, p, v, k, y, x, z, B, S;
        a = t.state, i = t.next_in, B = t.input, n = i + (t.avail_in - 5), r = t.next_out, S = t.output, s = r - (e - t.avail_out), o = r + (t.avail_out - 257), l = a.dmax, h = a.wsize, d = a.whave, f = a.wnext, _ = a.window, u = a.hold, c = a.bits, b = a.lencode, g = a.distcode, m = (1 << a.lenbits) - 1, w = (1 << a.distbits) - 1;
        t: do {
          c < 15 && (u += B[i++] << c, c += 8, u += B[i++] << c, c += 8), p = b[u & m];
          e: for (;;) {
            if (u >>>= v = p >>> 24, c -= v, 0 === (v = p >>> 16 & 255)) S[r++] = 65535 & p;else {
              if (!(16 & v)) {
                if (0 == (64 & v)) {
                  p = b[(65535 & p) + (u & (1 << v) - 1)];
                  continue e;
                }
                if (32 & v) {
                  a.mode = 12;
                  break t;
                }
                t.msg = "invalid literal/length code", a.mode = 30;
                break t;
              }
              k = 65535 & p, (v &= 15) && (c < v && (u += B[i++] << c, c += 8), k += u & (1 << v) - 1, u >>>= v, c -= v), c < 15 && (u += B[i++] << c, c += 8, u += B[i++] << c, c += 8), p = g[u & w];
              a: for (;;) {
                if (u >>>= v = p >>> 24, c -= v, !(16 & (v = p >>> 16 & 255))) {
                  if (0 == (64 & v)) {
                    p = g[(65535 & p) + (u & (1 << v) - 1)];
                    continue a;
                  }
                  t.msg = "invalid distance code", a.mode = 30;
                  break t;
                }
                if (y = 65535 & p, c < (v &= 15) && (u += B[i++] << c, (c += 8) < v && (u += B[i++] << c, c += 8)), l < (y += u & (1 << v) - 1)) {
                  t.msg = "invalid distance too far back", a.mode = 30;
                  break t;
                }
                if (u >>>= v, c -= v, (v = r - s) < y) {
                  if (d < (v = y - v) && a.sane) {
                    t.msg = "invalid distance too far back", a.mode = 30;
                    break t;
                  }
                  if (z = _, (x = 0) === f) {
                    if (x += h - v, v < k) {
                      for (k -= v; S[r++] = _[x++], --v;);
                      x = r - y, z = S;
                    }
                  } else if (f < v) {
                    if (x += h + f - v, (v -= f) < k) {
                      for (k -= v; S[r++] = _[x++], --v;);
                      if (x = 0, f < k) {
                        for (k -= v = f; S[r++] = _[x++], --v;);
                        x = r - y, z = S;
                      }
                    }
                  } else if (x += f - v, v < k) {
                    for (k -= v; S[r++] = _[x++], --v;);
                    x = r - y, z = S;
                  }
                  for (; 2 < k;) S[r++] = z[x++], S[r++] = z[x++], S[r++] = z[x++], k -= 3;
                  k && (S[r++] = z[x++], 1 < k && (S[r++] = z[x++]));
                } else {
                  for (x = r - y; S[r++] = S[x++], S[r++] = S[x++], S[r++] = S[x++], 2 < (k -= 3););
                  k && (S[r++] = S[x++], 1 < k && (S[r++] = S[x++]));
                }
                break;
              }
            }
            break;
          }
        } while (i < n && r < o);
        i -= k = c >> 3, u &= (1 << (c -= k << 3)) - 1, t.next_in = i, t.next_out = r, t.avail_in = i < n ? n - i + 5 : 5 - (i - n), t.avail_out = r < o ? o - r + 257 : 257 - (r - o), a.hold = u, a.bits = c;
      };
    }, {}],
    11: [function (t, e, a) {
      "use strict";

      var Z = t("../utils/common"),
        R = t("./adler32"),
        C = t("./crc32"),
        N = t("./inffast"),
        O = t("./inftrees"),
        D = 1,
        I = 2,
        U = 0,
        T = -2,
        F = 1,
        i = 852,
        n = 592;
      function L(t) {
        return (t >>> 24 & 255) + (t >>> 8 & 65280) + ((65280 & t) << 8) + ((255 & t) << 24);
      }
      function r() {
        this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new Z.Buf16(320), this.work = new Z.Buf16(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
      }
      function s(t) {
        var e;
        return t && t.state ? (e = t.state, t.total_in = t.total_out = e.total = 0, t.msg = "", e.wrap && (t.adler = 1 & e.wrap), e.mode = F, e.last = 0, e.havedict = 0, e.dmax = 32768, e.head = null, e.hold = 0, e.bits = 0, e.lencode = e.lendyn = new Z.Buf32(i), e.distcode = e.distdyn = new Z.Buf32(n), e.sane = 1, e.back = -1, U) : T;
      }
      function o(t) {
        var e;
        return t && t.state ? ((e = t.state).wsize = 0, e.whave = 0, e.wnext = 0, s(t)) : T;
      }
      function l(t, e) {
        var a, i;
        return t && t.state ? (i = t.state, e < 0 ? (a = 0, e = -e) : (a = 1 + (e >> 4), e < 48 && (e &= 15)), e && (e < 8 || 15 < e) ? T : (null !== i.window && i.wbits !== e && (i.window = null), i.wrap = a, i.wbits = e, o(t))) : T;
      }
      function h(t, e) {
        var a, i;
        return t ? (i = new r(), (t.state = i).window = null, (a = l(t, e)) !== U && (t.state = null), a) : T;
      }
      var d,
        f,
        _ = !0;
      function H(t) {
        if (_) {
          var e;
          for (d = new Z.Buf32(512), f = new Z.Buf32(32), e = 0; e < 144;) t.lens[e++] = 8;
          for (; e < 256;) t.lens[e++] = 9;
          for (; e < 280;) t.lens[e++] = 7;
          for (; e < 288;) t.lens[e++] = 8;
          for (O(D, t.lens, 0, 288, d, 0, t.work, {
            bits: 9
          }), e = 0; e < 32;) t.lens[e++] = 5;
          O(I, t.lens, 0, 32, f, 0, t.work, {
            bits: 5
          }), _ = !1;
        }
        t.lencode = d, t.lenbits = 9, t.distcode = f, t.distbits = 5;
      }
      function j(t, e, a, i) {
        var n,
          r = t.state;
        return null === r.window && (r.wsize = 1 << r.wbits, r.wnext = 0, r.whave = 0, r.window = new Z.Buf8(r.wsize)), i >= r.wsize ? (Z.arraySet(r.window, e, a - r.wsize, r.wsize, 0), r.wnext = 0, r.whave = r.wsize) : (i < (n = r.wsize - r.wnext) && (n = i), Z.arraySet(r.window, e, a - i, n, r.wnext), (i -= n) ? (Z.arraySet(r.window, e, a - i, i, 0), r.wnext = i, r.whave = r.wsize) : (r.wnext += n, r.wnext === r.wsize && (r.wnext = 0), r.whave < r.wsize && (r.whave += n))), 0;
      }
      a.inflateReset = o, a.inflateReset2 = l, a.inflateResetKeep = s, a.inflateInit = function (t) {
        return h(t, 15);
      }, a.inflateInit2 = h, a.inflate = function (t, e) {
        var a,
          i,
          n,
          r,
          s,
          o,
          l,
          h,
          d,
          f,
          _,
          u,
          c,
          b,
          g,
          m,
          w,
          p,
          v,
          k,
          y,
          x,
          z,
          B,
          S = 0,
          E = new Z.Buf8(4),
          A = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
        if (!t || !t.state || !t.output || !t.input && 0 !== t.avail_in) return T;
        12 === (a = t.state).mode && (a.mode = 13), s = t.next_out, n = t.output, l = t.avail_out, r = t.next_in, i = t.input, o = t.avail_in, h = a.hold, d = a.bits, f = o, _ = l, x = U;
        t: for (;;) switch (a.mode) {
          case F:
            if (0 === a.wrap) {
              a.mode = 13;
              break;
            }
            for (; d < 16;) {
              if (0 === o) break t;
              o--, h += i[r++] << d, d += 8;
            }
            if (2 & a.wrap && 35615 === h) {
              E[a.check = 0] = 255 & h, E[1] = h >>> 8 & 255, a.check = C(a.check, E, 2, 0), d = h = 0, a.mode = 2;
              break;
            }
            if (a.flags = 0, a.head && (a.head.done = !1), !(1 & a.wrap) || (((255 & h) << 8) + (h >> 8)) % 31) {
              t.msg = "incorrect header check", a.mode = 30;
              break;
            }
            if (8 != (15 & h)) {
              t.msg = "unknown compression method", a.mode = 30;
              break;
            }
            if (d -= 4, y = 8 + (15 & (h >>>= 4)), 0 === a.wbits) a.wbits = y;else if (y > a.wbits) {
              t.msg = "invalid window size", a.mode = 30;
              break;
            }
            a.dmax = 1 << y, t.adler = a.check = 1, a.mode = 512 & h ? 10 : 12, d = h = 0;
            break;
          case 2:
            for (; d < 16;) {
              if (0 === o) break t;
              o--, h += i[r++] << d, d += 8;
            }
            if (a.flags = h, 8 != (255 & a.flags)) {
              t.msg = "unknown compression method", a.mode = 30;
              break;
            }
            if (57344 & a.flags) {
              t.msg = "unknown header flags set", a.mode = 30;
              break;
            }
            a.head && (a.head.text = h >> 8 & 1), 512 & a.flags && (E[0] = 255 & h, E[1] = h >>> 8 & 255, a.check = C(a.check, E, 2, 0)), d = h = 0, a.mode = 3;
          case 3:
            for (; d < 32;) {
              if (0 === o) break t;
              o--, h += i[r++] << d, d += 8;
            }
            a.head && (a.head.time = h), 512 & a.flags && (E[0] = 255 & h, E[1] = h >>> 8 & 255, E[2] = h >>> 16 & 255, E[3] = h >>> 24 & 255, a.check = C(a.check, E, 4, 0)), d = h = 0, a.mode = 4;
          case 4:
            for (; d < 16;) {
              if (0 === o) break t;
              o--, h += i[r++] << d, d += 8;
            }
            a.head && (a.head.xflags = 255 & h, a.head.os = h >> 8), 512 & a.flags && (E[0] = 255 & h, E[1] = h >>> 8 & 255, a.check = C(a.check, E, 2, 0)), d = h = 0, a.mode = 5;
          case 5:
            if (1024 & a.flags) {
              for (; d < 16;) {
                if (0 === o) break t;
                o--, h += i[r++] << d, d += 8;
              }
              a.length = h, a.head && (a.head.extra_len = h), 512 & a.flags && (E[0] = 255 & h, E[1] = h >>> 8 & 255, a.check = C(a.check, E, 2, 0)), d = h = 0;
            } else a.head && (a.head.extra = null);
            a.mode = 6;
          case 6:
            if (1024 & a.flags && (o < (u = a.length) && (u = o), u && (a.head && (y = a.head.extra_len - a.length, a.head.extra || (a.head.extra = new Array(a.head.extra_len)), Z.arraySet(a.head.extra, i, r, u, y)), 512 & a.flags && (a.check = C(a.check, i, u, r)), o -= u, r += u, a.length -= u), a.length)) break t;
            a.length = 0, a.mode = 7;
          case 7:
            if (2048 & a.flags) {
              if (0 === o) break t;
              for (u = 0; y = i[r + u++], a.head && y && a.length < 65536 && (a.head.name += String.fromCharCode(y)), y && u < o;);
              if (512 & a.flags && (a.check = C(a.check, i, u, r)), o -= u, r += u, y) break t;
            } else a.head && (a.head.name = null);
            a.length = 0, a.mode = 8;
          case 8:
            if (4096 & a.flags) {
              if (0 === o) break t;
              for (u = 0; y = i[r + u++], a.head && y && a.length < 65536 && (a.head.comment += String.fromCharCode(y)), y && u < o;);
              if (512 & a.flags && (a.check = C(a.check, i, u, r)), o -= u, r += u, y) break t;
            } else a.head && (a.head.comment = null);
            a.mode = 9;
          case 9:
            if (512 & a.flags) {
              for (; d < 16;) {
                if (0 === o) break t;
                o--, h += i[r++] << d, d += 8;
              }
              if (h !== (65535 & a.check)) {
                t.msg = "header crc mismatch", a.mode = 30;
                break;
              }
              d = h = 0;
            }
            a.head && (a.head.hcrc = a.flags >> 9 & 1, a.head.done = !0), t.adler = a.check = 0, a.mode = 12;
            break;
          case 10:
            for (; d < 32;) {
              if (0 === o) break t;
              o--, h += i[r++] << d, d += 8;
            }
            t.adler = a.check = L(h), d = h = 0, a.mode = 11;
          case 11:
            if (0 === a.havedict) return t.next_out = s, t.avail_out = l, t.next_in = r, t.avail_in = o, a.hold = h, a.bits = d, 2;
            t.adler = a.check = 1, a.mode = 12;
          case 12:
            if (5 === e || 6 === e) break t;
          case 13:
            if (a.last) {
              h >>>= 7 & d, d -= 7 & d, a.mode = 27;
              break;
            }
            for (; d < 3;) {
              if (0 === o) break t;
              o--, h += i[r++] << d, d += 8;
            }
            switch (a.last = 1 & h, d -= 1, 3 & (h >>>= 1)) {
              case 0:
                a.mode = 14;
                break;
              case 1:
                if (H(a), a.mode = 20, 6 !== e) break;
                h >>>= 2, d -= 2;
                break t;
              case 2:
                a.mode = 17;
                break;
              case 3:
                t.msg = "invalid block type", a.mode = 30;
            }
            h >>>= 2, d -= 2;
            break;
          case 14:
            for (h >>>= 7 & d, d -= 7 & d; d < 32;) {
              if (0 === o) break t;
              o--, h += i[r++] << d, d += 8;
            }
            if ((65535 & h) != (h >>> 16 ^ 65535)) {
              t.msg = "invalid stored block lengths", a.mode = 30;
              break;
            }
            if (a.length = 65535 & h, d = h = 0, a.mode = 15, 6 === e) break t;
          case 15:
            a.mode = 16;
          case 16:
            if (u = a.length) {
              if (o < u && (u = o), l < u && (u = l), 0 === u) break t;
              Z.arraySet(n, i, r, u, s), o -= u, r += u, l -= u, s += u, a.length -= u;
              break;
            }
            a.mode = 12;
            break;
          case 17:
            for (; d < 14;) {
              if (0 === o) break t;
              o--, h += i[r++] << d, d += 8;
            }
            if (a.nlen = 257 + (31 & h), h >>>= 5, d -= 5, a.ndist = 1 + (31 & h), h >>>= 5, d -= 5, a.ncode = 4 + (15 & h), h >>>= 4, d -= 4, 286 < a.nlen || 30 < a.ndist) {
              t.msg = "too many length or distance symbols", a.mode = 30;
              break;
            }
            a.have = 0, a.mode = 18;
          case 18:
            for (; a.have < a.ncode;) {
              for (; d < 3;) {
                if (0 === o) break t;
                o--, h += i[r++] << d, d += 8;
              }
              a.lens[A[a.have++]] = 7 & h, h >>>= 3, d -= 3;
            }
            for (; a.have < 19;) a.lens[A[a.have++]] = 0;
            if (a.lencode = a.lendyn, a.lenbits = 7, z = {
              bits: a.lenbits
            }, x = O(0, a.lens, 0, 19, a.lencode, 0, a.work, z), a.lenbits = z.bits, x) {
              t.msg = "invalid code lengths set", a.mode = 30;
              break;
            }
            a.have = 0, a.mode = 19;
          case 19:
            for (; a.have < a.nlen + a.ndist;) {
              for (; m = (S = a.lencode[h & (1 << a.lenbits) - 1]) >>> 16 & 255, w = 65535 & S, !((g = S >>> 24) <= d);) {
                if (0 === o) break t;
                o--, h += i[r++] << d, d += 8;
              }
              if (w < 16) h >>>= g, d -= g, a.lens[a.have++] = w;else {
                if (16 === w) {
                  for (B = g + 2; d < B;) {
                    if (0 === o) break t;
                    o--, h += i[r++] << d, d += 8;
                  }
                  if (h >>>= g, d -= g, 0 === a.have) {
                    t.msg = "invalid bit length repeat", a.mode = 30;
                    break;
                  }
                  y = a.lens[a.have - 1], u = 3 + (3 & h), h >>>= 2, d -= 2;
                } else if (17 === w) {
                  for (B = g + 3; d < B;) {
                    if (0 === o) break t;
                    o--, h += i[r++] << d, d += 8;
                  }
                  d -= g, y = 0, u = 3 + (7 & (h >>>= g)), h >>>= 3, d -= 3;
                } else {
                  for (B = g + 7; d < B;) {
                    if (0 === o) break t;
                    o--, h += i[r++] << d, d += 8;
                  }
                  d -= g, y = 0, u = 11 + (127 & (h >>>= g)), h >>>= 7, d -= 7;
                }
                if (a.have + u > a.nlen + a.ndist) {
                  t.msg = "invalid bit length repeat", a.mode = 30;
                  break;
                }
                for (; u--;) a.lens[a.have++] = y;
              }
            }
            if (30 === a.mode) break;
            if (0 === a.lens[256]) {
              t.msg = "invalid code -- missing end-of-block", a.mode = 30;
              break;
            }
            if (a.lenbits = 9, z = {
              bits: a.lenbits
            }, x = O(D, a.lens, 0, a.nlen, a.lencode, 0, a.work, z), a.lenbits = z.bits, x) {
              t.msg = "invalid literal/lengths set", a.mode = 30;
              break;
            }
            if (a.distbits = 6, a.distcode = a.distdyn, z = {
              bits: a.distbits
            }, x = O(I, a.lens, a.nlen, a.ndist, a.distcode, 0, a.work, z), a.distbits = z.bits, x) {
              t.msg = "invalid distances set", a.mode = 30;
              break;
            }
            if (a.mode = 20, 6 === e) break t;
          case 20:
            a.mode = 21;
          case 21:
            if (6 <= o && 258 <= l) {
              t.next_out = s, t.avail_out = l, t.next_in = r, t.avail_in = o, a.hold = h, a.bits = d, N(t, _), s = t.next_out, n = t.output, l = t.avail_out, r = t.next_in, i = t.input, o = t.avail_in, h = a.hold, d = a.bits, 12 === a.mode && (a.back = -1);
              break;
            }
            for (a.back = 0; m = (S = a.lencode[h & (1 << a.lenbits) - 1]) >>> 16 & 255, w = 65535 & S, !((g = S >>> 24) <= d);) {
              if (0 === o) break t;
              o--, h += i[r++] << d, d += 8;
            }
            if (m && 0 == (240 & m)) {
              for (p = g, v = m, k = w; m = (S = a.lencode[k + ((h & (1 << p + v) - 1) >> p)]) >>> 16 & 255, w = 65535 & S, !(p + (g = S >>> 24) <= d);) {
                if (0 === o) break t;
                o--, h += i[r++] << d, d += 8;
              }
              h >>>= p, d -= p, a.back += p;
            }
            if (h >>>= g, d -= g, a.back += g, a.length = w, 0 === m) {
              a.mode = 26;
              break;
            }
            if (32 & m) {
              a.back = -1, a.mode = 12;
              break;
            }
            if (64 & m) {
              t.msg = "invalid literal/length code", a.mode = 30;
              break;
            }
            a.extra = 15 & m, a.mode = 22;
          case 22:
            if (a.extra) {
              for (B = a.extra; d < B;) {
                if (0 === o) break t;
                o--, h += i[r++] << d, d += 8;
              }
              a.length += h & (1 << a.extra) - 1, h >>>= a.extra, d -= a.extra, a.back += a.extra;
            }
            a.was = a.length, a.mode = 23;
          case 23:
            for (; m = (S = a.distcode[h & (1 << a.distbits) - 1]) >>> 16 & 255, w = 65535 & S, !((g = S >>> 24) <= d);) {
              if (0 === o) break t;
              o--, h += i[r++] << d, d += 8;
            }
            if (0 == (240 & m)) {
              for (p = g, v = m, k = w; m = (S = a.distcode[k + ((h & (1 << p + v) - 1) >> p)]) >>> 16 & 255, w = 65535 & S, !(p + (g = S >>> 24) <= d);) {
                if (0 === o) break t;
                o--, h += i[r++] << d, d += 8;
              }
              h >>>= p, d -= p, a.back += p;
            }
            if (h >>>= g, d -= g, a.back += g, 64 & m) {
              t.msg = "invalid distance code", a.mode = 30;
              break;
            }
            a.offset = w, a.extra = 15 & m, a.mode = 24;
          case 24:
            if (a.extra) {
              for (B = a.extra; d < B;) {
                if (0 === o) break t;
                o--, h += i[r++] << d, d += 8;
              }
              a.offset += h & (1 << a.extra) - 1, h >>>= a.extra, d -= a.extra, a.back += a.extra;
            }
            if (a.offset > a.dmax) {
              t.msg = "invalid distance too far back", a.mode = 30;
              break;
            }
            a.mode = 25;
          case 25:
            if (0 === l) break t;
            if (u = _ - l, a.offset > u) {
              if ((u = a.offset - u) > a.whave && a.sane) {
                t.msg = "invalid distance too far back", a.mode = 30;
                break;
              }
              u > a.wnext ? (u -= a.wnext, c = a.wsize - u) : c = a.wnext - u, u > a.length && (u = a.length), b = a.window;
            } else b = n, c = s - a.offset, u = a.length;
            for (l < u && (u = l), l -= u, a.length -= u; n[s++] = b[c++], --u;);
            0 === a.length && (a.mode = 21);
            break;
          case 26:
            if (0 === l) break t;
            n[s++] = a.length, l--, a.mode = 21;
            break;
          case 27:
            if (a.wrap) {
              for (; d < 32;) {
                if (0 === o) break t;
                o--, h |= i[r++] << d, d += 8;
              }
              if (_ -= l, t.total_out += _, a.total += _, _ && (t.adler = a.check = a.flags ? C(a.check, n, _, s - _) : R(a.check, n, _, s - _)), _ = l, (a.flags ? h : L(h)) !== a.check) {
                t.msg = "incorrect data check", a.mode = 30;
                break;
              }
              d = h = 0;
            }
            a.mode = 28;
          case 28:
            if (a.wrap && a.flags) {
              for (; d < 32;) {
                if (0 === o) break t;
                o--, h += i[r++] << d, d += 8;
              }
              if (h !== (4294967295 & a.total)) {
                t.msg = "incorrect length check", a.mode = 30;
                break;
              }
              d = h = 0;
            }
            a.mode = 29;
          case 29:
            x = 1;
            break t;
          case 30:
            x = -3;
            break t;
          case 31:
            return -4;
          case 32:
          default:
            return T;
        }
        return t.next_out = s, t.avail_out = l, t.next_in = r, t.avail_in = o, a.hold = h, a.bits = d, (a.wsize || _ !== t.avail_out && a.mode < 30 && (a.mode < 27 || 4 !== e)) && j(t, t.output, t.next_out, _ - t.avail_out) ? (a.mode = 31, -4) : (f -= t.avail_in, _ -= t.avail_out, t.total_in += f, t.total_out += _, a.total += _, a.wrap && _ && (t.adler = a.check = a.flags ? C(a.check, n, _, t.next_out - _) : R(a.check, n, _, t.next_out - _)), t.data_type = a.bits + (a.last ? 64 : 0) + (12 === a.mode ? 128 : 0) + (20 === a.mode || 15 === a.mode ? 256 : 0), (0 === f && 0 === _ || 4 === e) && x === U && (x = -5), x);
      }, a.inflateEnd = function (t) {
        if (!t || !t.state) return T;
        var e = t.state;
        return e.window && (e.window = null), t.state = null, U;
      }, a.inflateGetHeader = function (t, e) {
        var a;
        return t && t.state ? 0 == (2 & (a = t.state).wrap) ? T : ((a.head = e).done = !1, U) : T;
      }, a.inflateSetDictionary = function (t, e) {
        var a,
          i = e.length;
        return t && t.state ? 0 !== (a = t.state).wrap && 11 !== a.mode ? T : 11 === a.mode && R(1, e, i, 0) !== a.check ? -3 : j(t, e, i, i) ? (a.mode = 31, -4) : (a.havedict = 1, U) : T;
      }, a.inflateInfo = "pako inflate (from Nodeca project)";
    }, {
      "../utils/common": 3,
      "./adler32": 5,
      "./crc32": 7,
      "./inffast": 10,
      "./inftrees": 12
    }],
    12: [function (t, e, a) {
      "use strict";

      var D = t("../utils/common"),
        I = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0],
        U = [16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78],
        T = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577, 0, 0],
        F = [16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 29, 64, 64];
      e.exports = function (t, e, a, i, n, r, s, o) {
        var l,
          h,
          d,
          f,
          _,
          u,
          c,
          b,
          g,
          m = o.bits,
          w = 0,
          p = 0,
          v = 0,
          k = 0,
          y = 0,
          x = 0,
          z = 0,
          B = 0,
          S = 0,
          E = 0,
          A = null,
          Z = 0,
          R = new D.Buf16(16),
          C = new D.Buf16(16),
          N = null,
          O = 0;
        for (w = 0; w <= 15; w++) R[w] = 0;
        for (p = 0; p < i; p++) R[e[a + p]]++;
        for (y = m, k = 15; 1 <= k && 0 === R[k]; k--);
        if (k < y && (y = k), 0 === k) return n[r++] = 20971520, n[r++] = 20971520, o.bits = 1, 0;
        for (v = 1; v < k && 0 === R[v]; v++);
        for (y < v && (y = v), w = B = 1; w <= 15; w++) if (B <<= 1, (B -= R[w]) < 0) return -1;
        if (0 < B && (0 === t || 1 !== k)) return -1;
        for (C[1] = 0, w = 1; w < 15; w++) C[w + 1] = C[w] + R[w];
        for (p = 0; p < i; p++) 0 !== e[a + p] && (s[C[e[a + p]]++] = p);
        if (0 === t ? (A = N = s, u = 19) : 1 === t ? (A = I, Z -= 257, N = U, O -= 257, u = 256) : (A = T, N = F, u = -1), w = v, _ = r, z = p = E = 0, d = -1, f = (S = 1 << (x = y)) - 1, 1 === t && 852 < S || 2 === t && 592 < S) return 1;
        for (;;) {
          for (c = w - z, s[p] < u ? (b = 0, g = s[p]) : s[p] > u ? (b = N[O + s[p]], g = A[Z + s[p]]) : (b = 96, g = 0), l = 1 << w - z, v = h = 1 << x; n[_ + (E >> z) + (h -= l)] = c << 24 | b << 16 | g | 0, 0 !== h;);
          for (l = 1 << w - 1; E & l;) l >>= 1;
          if (0 !== l ? (E &= l - 1, E += l) : E = 0, p++, 0 == --R[w]) {
            if (w === k) break;
            w = e[a + s[p]];
          }
          if (y < w && (E & f) !== d) {
            for (0 === z && (z = y), _ += v, B = 1 << (x = w - z); x + z < k && !((B -= R[x + z]) <= 0);) x++, B <<= 1;
            if (S += 1 << x, 1 === t && 852 < S || 2 === t && 592 < S) return 1;
            n[d = E & f] = y << 24 | x << 16 | _ - r | 0;
          }
        }
        return 0 !== E && (n[_ + E] = w - z << 24 | 64 << 16 | 0), o.bits = y, 0;
      };
    }, {
      "../utils/common": 3
    }],
    13: [function (t, e, a) {
      "use strict";

      e.exports = {
        2: "need dictionary",
        1: "stream end",
        0: "",
        "-1": "file error",
        "-2": "stream error",
        "-3": "data error",
        "-4": "insufficient memory",
        "-5": "buffer error",
        "-6": "incompatible version"
      };
    }, {}],
    14: [function (t, e, a) {
      "use strict";

      var l = t("../utils/common"),
        o = 0,
        h = 1;
      function i(t) {
        for (var e = t.length; 0 <= --e;) t[e] = 0;
      }
      var d = 0,
        s = 29,
        f = 256,
        _ = f + 1 + s,
        u = 30,
        c = 19,
        g = 2 * _ + 1,
        m = 15,
        n = 16,
        b = 7,
        w = 256,
        p = 16,
        v = 17,
        k = 18,
        y = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0],
        x = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13],
        z = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7],
        B = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15],
        S = new Array(2 * (_ + 2));
      i(S);
      var E = new Array(2 * u);
      i(E);
      var A = new Array(512);
      i(A);
      var Z = new Array(256);
      i(Z);
      var R = new Array(s);
      i(R);
      var C,
        N,
        O,
        D = new Array(u);
      function I(t, e, a, i, n) {
        this.static_tree = t, this.extra_bits = e, this.extra_base = a, this.elems = i, this.max_length = n, this.has_stree = t && t.length;
      }
      function r(t, e) {
        this.dyn_tree = t, this.max_code = 0, this.stat_desc = e;
      }
      function U(t) {
        return t < 256 ? A[t] : A[256 + (t >>> 7)];
      }
      function T(t, e) {
        t.pending_buf[t.pending++] = 255 & e, t.pending_buf[t.pending++] = e >>> 8 & 255;
      }
      function F(t, e, a) {
        t.bi_valid > n - a ? (t.bi_buf |= e << t.bi_valid & 65535, T(t, t.bi_buf), t.bi_buf = e >> n - t.bi_valid, t.bi_valid += a - n) : (t.bi_buf |= e << t.bi_valid & 65535, t.bi_valid += a);
      }
      function L(t, e, a) {
        F(t, a[2 * e], a[2 * e + 1]);
      }
      function H(t, e) {
        for (var a = 0; a |= 1 & t, t >>>= 1, a <<= 1, 0 < --e;);
        return a >>> 1;
      }
      function j(t, e, a) {
        var i,
          n,
          r = new Array(m + 1),
          s = 0;
        for (i = 1; i <= m; i++) r[i] = s = s + a[i - 1] << 1;
        for (n = 0; n <= e; n++) {
          var o = t[2 * n + 1];
          0 !== o && (t[2 * n] = H(r[o]++, o));
        }
      }
      function K(t) {
        var e;
        for (e = 0; e < _; e++) t.dyn_ltree[2 * e] = 0;
        for (e = 0; e < u; e++) t.dyn_dtree[2 * e] = 0;
        for (e = 0; e < c; e++) t.bl_tree[2 * e] = 0;
        t.dyn_ltree[2 * w] = 1, t.opt_len = t.static_len = 0, t.last_lit = t.matches = 0;
      }
      function M(t) {
        8 < t.bi_valid ? T(t, t.bi_buf) : 0 < t.bi_valid && (t.pending_buf[t.pending++] = t.bi_buf), t.bi_buf = 0, t.bi_valid = 0;
      }
      function P(t, e, a, i) {
        var n = 2 * e,
          r = 2 * a;
        return t[n] < t[r] || t[n] === t[r] && i[e] <= i[a];
      }
      function Y(t, e, a) {
        for (var i = t.heap[a], n = a << 1; n <= t.heap_len && (n < t.heap_len && P(e, t.heap[n + 1], t.heap[n], t.depth) && n++, !P(e, i, t.heap[n], t.depth));) t.heap[a] = t.heap[n], a = n, n <<= 1;
        t.heap[a] = i;
      }
      function q(t, e, a) {
        var i,
          n,
          r,
          s,
          o = 0;
        if (0 !== t.last_lit) for (; i = t.pending_buf[t.d_buf + 2 * o] << 8 | t.pending_buf[t.d_buf + 2 * o + 1], n = t.pending_buf[t.l_buf + o], o++, 0 === i ? L(t, n, e) : (L(t, (r = Z[n]) + f + 1, e), 0 !== (s = y[r]) && F(t, n -= R[r], s), L(t, r = U(--i), a), 0 !== (s = x[r]) && F(t, i -= D[r], s)), o < t.last_lit;);
        L(t, w, e);
      }
      function G(t, e) {
        var a,
          i,
          n,
          r = e.dyn_tree,
          s = e.stat_desc.static_tree,
          o = e.stat_desc.has_stree,
          l = e.stat_desc.elems,
          h = -1;
        for (t.heap_len = 0, t.heap_max = g, a = 0; a < l; a++) 0 !== r[2 * a] ? (t.heap[++t.heap_len] = h = a, t.depth[a] = 0) : r[2 * a + 1] = 0;
        for (; t.heap_len < 2;) r[2 * (n = t.heap[++t.heap_len] = h < 2 ? ++h : 0)] = 1, t.depth[n] = 0, t.opt_len--, o && (t.static_len -= s[2 * n + 1]);
        for (e.max_code = h, a = t.heap_len >> 1; 1 <= a; a--) Y(t, r, a);
        for (n = l; a = t.heap[1], t.heap[1] = t.heap[t.heap_len--], Y(t, r, 1), i = t.heap[1], t.heap[--t.heap_max] = a, t.heap[--t.heap_max] = i, r[2 * n] = r[2 * a] + r[2 * i], t.depth[n] = (t.depth[a] >= t.depth[i] ? t.depth[a] : t.depth[i]) + 1, r[2 * a + 1] = r[2 * i + 1] = n, t.heap[1] = n++, Y(t, r, 1), 2 <= t.heap_len;);
        t.heap[--t.heap_max] = t.heap[1], function (t, e) {
          var a,
            i,
            n,
            r,
            s,
            o,
            l = e.dyn_tree,
            h = e.max_code,
            d = e.stat_desc.static_tree,
            f = e.stat_desc.has_stree,
            _ = e.stat_desc.extra_bits,
            u = e.stat_desc.extra_base,
            c = e.stat_desc.max_length,
            b = 0;
          for (r = 0; r <= m; r++) t.bl_count[r] = 0;
          for (l[2 * t.heap[t.heap_max] + 1] = 0, a = t.heap_max + 1; a < g; a++) c < (r = l[2 * l[2 * (i = t.heap[a]) + 1] + 1] + 1) && (r = c, b++), l[2 * i + 1] = r, h < i || (t.bl_count[r]++, s = 0, u <= i && (s = _[i - u]), o = l[2 * i], t.opt_len += o * (r + s), f && (t.static_len += o * (d[2 * i + 1] + s)));
          if (0 !== b) {
            do {
              for (r = c - 1; 0 === t.bl_count[r];) r--;
              t.bl_count[r]--, t.bl_count[r + 1] += 2, t.bl_count[c]--, b -= 2;
            } while (0 < b);
            for (r = c; 0 !== r; r--) for (i = t.bl_count[r]; 0 !== i;) h < (n = t.heap[--a]) || (l[2 * n + 1] !== r && (t.opt_len += (r - l[2 * n + 1]) * l[2 * n], l[2 * n + 1] = r), i--);
          }
        }(t, e), j(r, h, t.bl_count);
      }
      function X(t, e, a) {
        var i,
          n,
          r = -1,
          s = e[1],
          o = 0,
          l = 7,
          h = 4;
        for (0 === s && (l = 138, h = 3), e[2 * (a + 1) + 1] = 65535, i = 0; i <= a; i++) n = s, s = e[2 * (i + 1) + 1], ++o < l && n === s || (o < h ? t.bl_tree[2 * n] += o : 0 !== n ? (n !== r && t.bl_tree[2 * n]++, t.bl_tree[2 * p]++) : o <= 10 ? t.bl_tree[2 * v]++ : t.bl_tree[2 * k]++, r = n, (o = 0) === s ? (l = 138, h = 3) : n === s ? (l = 6, h = 3) : (l = 7, h = 4));
      }
      function W(t, e, a) {
        var i,
          n,
          r = -1,
          s = e[1],
          o = 0,
          l = 7,
          h = 4;
        for (0 === s && (l = 138, h = 3), i = 0; i <= a; i++) if (n = s, s = e[2 * (i + 1) + 1], !(++o < l && n === s)) {
          if (o < h) for (; L(t, n, t.bl_tree), 0 != --o;);else 0 !== n ? (n !== r && (L(t, n, t.bl_tree), o--), L(t, p, t.bl_tree), F(t, o - 3, 2)) : o <= 10 ? (L(t, v, t.bl_tree), F(t, o - 3, 3)) : (L(t, k, t.bl_tree), F(t, o - 11, 7));
          r = n, (o = 0) === s ? (l = 138, h = 3) : n === s ? (l = 6, h = 3) : (l = 7, h = 4);
        }
      }
      i(D);
      var J = !1;
      function Q(t, e, a, i) {
        var n, r, s, o;
        F(t, (d << 1) + (i ? 1 : 0), 3), r = e, s = a, o = !0, M(n = t), o && (T(n, s), T(n, ~s)), l.arraySet(n.pending_buf, n.window, r, s, n.pending), n.pending += s;
      }
      a._tr_init = function (t) {
        J || (function () {
          var t,
            e,
            a,
            i,
            n,
            r = new Array(m + 1);
          for (i = a = 0; i < s - 1; i++) for (R[i] = a, t = 0; t < 1 << y[i]; t++) Z[a++] = i;
          for (Z[a - 1] = i, i = n = 0; i < 16; i++) for (D[i] = n, t = 0; t < 1 << x[i]; t++) A[n++] = i;
          for (n >>= 7; i < u; i++) for (D[i] = n << 7, t = 0; t < 1 << x[i] - 7; t++) A[256 + n++] = i;
          for (e = 0; e <= m; e++) r[e] = 0;
          for (t = 0; t <= 143;) S[2 * t + 1] = 8, t++, r[8]++;
          for (; t <= 255;) S[2 * t + 1] = 9, t++, r[9]++;
          for (; t <= 279;) S[2 * t + 1] = 7, t++, r[7]++;
          for (; t <= 287;) S[2 * t + 1] = 8, t++, r[8]++;
          for (j(S, _ + 1, r), t = 0; t < u; t++) E[2 * t + 1] = 5, E[2 * t] = H(t, 5);
          C = new I(S, y, f + 1, _, m), N = new I(E, x, 0, u, m), O = new I(new Array(0), z, 0, c, b);
        }(), J = !0), t.l_desc = new r(t.dyn_ltree, C), t.d_desc = new r(t.dyn_dtree, N), t.bl_desc = new r(t.bl_tree, O), t.bi_buf = 0, t.bi_valid = 0, K(t);
      }, a._tr_stored_block = Q, a._tr_flush_block = function (t, e, a, i) {
        var n,
          r,
          s = 0;
        0 < t.level ? (2 === t.strm.data_type && (t.strm.data_type = function (t) {
          var e,
            a = 4093624447;
          for (e = 0; e <= 31; e++, a >>>= 1) if (1 & a && 0 !== t.dyn_ltree[2 * e]) return o;
          if (0 !== t.dyn_ltree[18] || 0 !== t.dyn_ltree[20] || 0 !== t.dyn_ltree[26]) return h;
          for (e = 32; e < f; e++) if (0 !== t.dyn_ltree[2 * e]) return h;
          return o;
        }(t)), G(t, t.l_desc), G(t, t.d_desc), s = function (t) {
          var e;
          for (X(t, t.dyn_ltree, t.l_desc.max_code), X(t, t.dyn_dtree, t.d_desc.max_code), G(t, t.bl_desc), e = c - 1; 3 <= e && 0 === t.bl_tree[2 * B[e] + 1]; e--);
          return t.opt_len += 3 * (e + 1) + 5 + 5 + 4, e;
        }(t), n = t.opt_len + 3 + 7 >>> 3, (r = t.static_len + 3 + 7 >>> 3) <= n && (n = r)) : n = r = a + 5, a + 4 <= n && -1 !== e ? Q(t, e, a, i) : 4 === t.strategy || r === n ? (F(t, 2 + (i ? 1 : 0), 3), q(t, S, E)) : (F(t, 4 + (i ? 1 : 0), 3), function (t, e, a, i) {
          var n;
          for (F(t, e - 257, 5), F(t, a - 1, 5), F(t, i - 4, 4), n = 0; n < i; n++) F(t, t.bl_tree[2 * B[n] + 1], 3);
          W(t, t.dyn_ltree, e - 1), W(t, t.dyn_dtree, a - 1);
        }(t, t.l_desc.max_code + 1, t.d_desc.max_code + 1, s + 1), q(t, t.dyn_ltree, t.dyn_dtree)), K(t), i && M(t);
      }, a._tr_tally = function (t, e, a) {
        return t.pending_buf[t.d_buf + 2 * t.last_lit] = e >>> 8 & 255, t.pending_buf[t.d_buf + 2 * t.last_lit + 1] = 255 & e, t.pending_buf[t.l_buf + t.last_lit] = 255 & a, t.last_lit++, 0 === e ? t.dyn_ltree[2 * a]++ : (t.matches++, e--, t.dyn_ltree[2 * (Z[a] + f + 1)]++, t.dyn_dtree[2 * U(e)]++), t.last_lit === t.lit_bufsize - 1;
      }, a._tr_align = function (t) {
        var e;
        F(t, 2, 3), L(t, w, S), 16 === (e = t).bi_valid ? (T(e, e.bi_buf), e.bi_buf = 0, e.bi_valid = 0) : 8 <= e.bi_valid && (e.pending_buf[e.pending++] = 255 & e.bi_buf, e.bi_buf >>= 8, e.bi_valid -= 8);
      };
    }, {
      "../utils/common": 3
    }],
    15: [function (t, e, a) {
      "use strict";

      e.exports = function () {
        this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
      };
    }, {}],
    "/": [function (t, e, a) {
      "use strict";

      var i = {};
      (0, t("./lib/utils/common").assign)(i, t("./lib/deflate"), t("./lib/inflate"), t("./lib/zlib/constants")), e.exports = i;
    }, {
      "./lib/deflate": 1,
      "./lib/inflate": 2,
      "./lib/utils/common": 3,
      "./lib/zlib/constants": 6
    }]
  }, {}, [])("/");
});

/***/ }),

/***/ "./js-sdk-legacy/src/worker/services/HashService.js":
/*!**********************************************************!*\
  !*** ./js-sdk-legacy/src/worker/services/HashService.js ***!
  \**********************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ HashService; }
/* harmony export */ });
/* harmony import */ var _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../main/technicalServices/log/Logger */ "./js-sdk-legacy/src/main/technicalServices/log/Logger.js");
/* harmony import */ var _main_const_hashing__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../main/const/hashing */ "./js-sdk-legacy/src/main/const/hashing.js");
/* harmony import */ var _main_technicalServices_DOMUtils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../main/technicalServices/DOMUtils */ "./js-sdk-legacy/src/main/technicalServices/DOMUtils.js");
/* harmony import */ var crypto_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! crypto-js */ "./js-sdk-legacy/node_modules/crypto-js/index.js");
/* harmony import */ var crypto_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(crypto_js__WEBPACK_IMPORTED_MODULE_3__);
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }




var HashService = /*#__PURE__*/function () {
  function HashService() {
    _classCallCheck(this, HashService);
  }
  return _createClass(HashService, null, [{
    key: "hashSha256",
    value: function hashSha256(data, callback) {
      if (!_main_technicalServices_DOMUtils__WEBPACK_IMPORTED_MODULE_2__["default"].isSubtleCryptoSupported()) {
        _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_0__["default"].info('HashService: SubtleCrypto is not supported using fallback hashing');
        callback(null, crypto_js__WEBPACK_IMPORTED_MODULE_3___default().SHA256(data).toString((crypto_js__WEBPACK_IMPORTED_MODULE_3___default().enc).Hex));
        return;
      }
      var encoder = new TextEncoder();
      var dataEncoded = encoder.encode(data);
      crypto.subtle.digest(_main_const_hashing__WEBPACK_IMPORTED_MODULE_1__.sha256Hash, dataEncoded).then(function (hashBuffer) {
        var hashArray = Array.from(new Uint8Array(hashBuffer));
        var hashHex = hashArray.map(function (b) {
          return b.toString(16).padStart(2, '0');
        }).join('');
        callback(null, hashHex);
      })["catch"](function (error) {
        callback(error);
      });
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/worker/utils/Btoa.js":
/*!************************************************!*\
  !*** ./js-sdk-legacy/src/worker/utils/Btoa.js ***!
  \************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   btoa: function() { return /* binding */ btoa; }
/* harmony export */ });
/**
 * The implementation is taken from https://github.com/beatgammit/base64-js
 * I took only the btoa since there is no need in atob and for this reason I did not
 * embed all the library
 */
var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

/* eslint-disable no-cond-assign, no-bitwise, no-mixed-operators */
var btoa = self.btoa ? self.btoa.bind(self) : function (input) {
  var str = String(input);
  var output = '';
  for (
  // initialize result and counter
  var block, charCode, idx = 0, map = chars;
  // if the next str index does not exist:
  //   change the mapping table to "="
  //   check if d has no fractional digits
  str.charAt(idx | 0) || (map = '=', idx % 1);
  // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
  output += map.charAt(63 & block >> 8 - idx % 1 * 8)) {
    charCode = str.charCodeAt(idx += 3 / 4);
    if (charCode > 0xFF) {
      throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
    }
    block = block << 8 | charCode;
  }
  return output;
};

/* eslint-enable no-cond-assign, no-bitwise, no-mixed-operators */

/***/ }),

/***/ "./js-sdk-legacy/src/worker/utils/WorkerUtils.js":
/*!*******************************************************!*\
  !*** ./js-sdk-legacy/src/worker/utils/WorkerUtils.js ***!
  \*******************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ WorkerUtils; }
/* harmony export */ });
/* harmony import */ var _main_infrastructure_HttpRequestFactory__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../main/infrastructure/HttpRequestFactory */ "./js-sdk-legacy/src/main/infrastructure/HttpRequestFactory.js");
/* harmony import */ var _main_const_hashing__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../main/const/hashing */ "./js-sdk-legacy/src/main/const/hashing.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }


var WorkerUtils = /*#__PURE__*/function () {
  function WorkerUtils() {
    _classCallCheck(this, WorkerUtils);
  }
  return _createClass(WorkerUtils, null, [{
    key: "isUndefinedNull",
    value: function isUndefinedNull(x) {
      return x === null || x === undefined || typeof x === 'undefined';
    }
  }, {
    key: "getPostUrl",
    value: function getPostUrl(url, method, data, onSuccess, onError, acceptNoResponse, timeout, hashedBody) {
      var httpRequest = _main_infrastructure_HttpRequestFactory__WEBPACK_IMPORTED_MODULE_0__["default"].create();
      try {
        if (httpRequest instanceof self.XMLHttpRequest) {
          httpRequest.open(method, url, true);
          httpRequest.timeout = timeout || 12000;
          if (hashedBody) {
            // custom header must be set after request opened and before it has sent
            httpRequest.setRequestHeader(_main_const_hashing__WEBPACK_IMPORTED_MODULE_1__.sha256HeaderName, hashedBody);
          }
          httpRequest.onload = function () {
            if (httpRequest.status === 200 || httpRequest.status === 204 && acceptNoResponse) {
              onSuccess && onSuccess(httpRequest.responseText);
            } else {
              onError && onError(httpRequest.responseText, httpRequest.status, httpRequest.statusText);
            }
          };
          httpRequest.onerror = function () {
            onError && onError(httpRequest.responseText, httpRequest.status, httpRequest.statusText);
          };
          httpRequest.ontimeout = function () {
            onError && onError('timeout');
          };
          httpRequest.onabort = function () {
            onError && onError('abort');
          };
          httpRequest.send(data);
        } else {
          httpRequest.onload = function () {
            onSuccess && httpRequest.responseText && onSuccess(httpRequest.responseText);
          };
          httpRequest.onerror = function () {
            onError && onError(httpRequest.responseText, httpRequest.status, httpRequest.statusText);
          };
          httpRequest.onprogress = function () {};
          httpRequest.ontimeout = function () {
            onError && onError('timeout');
          };
          httpRequest.open(method, url, true);
          if (hashedBody) {
            httpRequest.setRequestHeader(_main_const_hashing__WEBPACK_IMPORTED_MODULE_1__.sha256HeaderName, hashedBody);
          }
          httpRequest.timeout = timeout || 12000;

          // This is a workaround in IE<10 bug that aborts Cross-Domain XHR sometimes. See Commit a2ccf977b75cabce7582b4cbb45a06caa5d08f86
          setTimeout(function () {
            httpRequest.send(data);
          }, 0);
        }
      } catch (e) {
        /* eslint-disable */
        console.log("ERROR ERROR ERROR. URL: ".concat(url, ". ").concat(e, "."));
        throw e;
        /* eslint-enable */
      }
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/worker/wup/DataPacker.js":
/*!****************************************************!*\
  !*** ./js-sdk-legacy/src/worker/wup/DataPacker.js ***!
  \****************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ DataPacker; }
/* harmony export */ });
/* harmony import */ var _utils_Btoa__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/Btoa */ "./js-sdk-legacy/src/worker/utils/Btoa.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }

var msgpack = __webpack_require__(/*! ../libs/msgpack.min */ "./js-sdk-legacy/src/worker/libs/msgpack.min.js");
var pako = __webpack_require__(/*! ../libs/pako.min */ "./js-sdk-legacy/src/worker/libs/pako.min.js");
var DataPacker = /*#__PURE__*/function () {
  function DataPacker() {
    _classCallCheck(this, DataPacker);
    this._compressData = function (data) {
      var compressed = msgpack.encode(data);
      compressed = pako.deflateRaw(compressed, {
        to: 'string'
      });
      // exports.btoa is the browser one if exist or the one we bring with us (Btoa.js) if not
      return (0,_utils_Btoa__WEBPACK_IMPORTED_MODULE_0__.btoa)(compressed);
    };
  }
  return _createClass(DataPacker, [{
    key: "pack",
    value: function pack(data) {
      return this._getCompressedData(data);
    }
  }, {
    key: "_getCompressedData",
    value: function _getCompressedData(data) {
      return this._compressData(data);
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/worker/wup/WupStatisticsService.js":
/*!**************************************************************!*\
  !*** ./js-sdk-legacy/src/worker/wup/WupStatisticsService.js ***!
  \**************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ WupStatisticsService; }
/* harmony export */ });
/* harmony import */ var _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../main/technicalServices/log/Logger */ "./js-sdk-legacy/src/main/technicalServices/log/Logger.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }

var WupStatisticsService = /*#__PURE__*/function () {
  function WupStatisticsService(statisticsLogIntervalMs) {
    _classCallCheck(this, WupStatisticsService);
    this._statisticsLogIntervalMs = statisticsLogIntervalMs;
    this.resetCounters();
    this._setPeriodicStatisticsLog();
  }
  return _createClass(WupStatisticsService, [{
    key: "getSentWupsCount",
    value: function getSentWupsCount() {
      return this._sentWupsCount;
    }
  }, {
    key: "incrementSentWupCount",
    value: function incrementSentWupCount() {
      this._sentWupsCount++;
      this._sentWupsInCurrentIntervalCount++;
    }
  }, {
    key: "updateSettings",
    value: function updateSettings(statisticsLogInterval) {
      this._statisticsLogIntervalMs = statisticsLogInterval;
      this._setPeriodicStatisticsLog();
    }
  }, {
    key: "resetCounters",
    value: function resetCounters() {
      this._sentWupsCount = 0;
      this._sentWupsInCurrentIntervalCount = 0;
    }

    /**
     * Stop the wup statistics service. This will stop the periodic statistics log
     */
  }, {
    key: "stop",
    value: function stop() {
      this._stopPeriodicStatisticsLog();
    }
  }, {
    key: "_writeStatisticsLog",
    value: function _writeStatisticsLog() {
      // If no wups were sent we don't want to log the statistics
      if (this._sentWupsInCurrentIntervalCount === 0) {
        return;
      }
      _main_technicalServices_log_Logger__WEBPACK_IMPORTED_MODULE_0__["default"].debug("Sent ".concat(this._sentWupsInCurrentIntervalCount, " wup in the last ").concat(this._statisticsLogIntervalMs, " ms. Sent a total of ").concat(this._sentWupsCount, " in the session"));
      this._sentWupsInCurrentIntervalCount = 0;
    }
  }, {
    key: "_stopPeriodicStatisticsLog",
    value: function _stopPeriodicStatisticsLog() {
      if (this._periodicLogIntervalId) {
        clearInterval(this._periodicLogIntervalId);
      }
    }
  }, {
    key: "_setPeriodicStatisticsLog",
    value: function _setPeriodicStatisticsLog() {
      this._stopPeriodicStatisticsLog();
      this._periodicLogIntervalId = setInterval(this._writeStatisticsLog.bind(this), this._statisticsLogIntervalMs);
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/worker/wup/dispatching/WupDispatchConstantRateCalculator.js":
/*!***************************************************************************************!*\
  !*** ./js-sdk-legacy/src/worker/wup/dispatching/WupDispatchConstantRateCalculator.js ***!
  \***************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ WupDispatchConstantRateCalculator; }
/* harmony export */ });
/* harmony import */ var _WupDispatchRateType__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./WupDispatchRateType */ "./js-sdk-legacy/src/worker/wup/dispatching/WupDispatchRateType.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/**
 * Class is responsible for calculating the wup dispatch constant rate.
 */

var WupDispatchConstantRateCalculator = /*#__PURE__*/function () {
  function WupDispatchConstantRateCalculator(wupDispatchRateSettings) {
    _classCallCheck(this, WupDispatchConstantRateCalculator);
    this.updateSettings(wupDispatchRateSettings);
  }

  /**
   * Get the next dispatch rate
   * @returns {*}
   */
  return _createClass(WupDispatchConstantRateCalculator, [{
    key: "getRate",
    value: function getRate() {
      return this._currentRate;
    }
  }, {
    key: "updateSettings",
    value: function updateSettings(wupDispatchRateSettings) {
      if (wupDispatchRateSettings.type !== _WupDispatchRateType__WEBPACK_IMPORTED_MODULE_0__.WupDispatchRateType.constant) {
        throw new Error('Invalid settings provided to constant calculator');
      }
      this._currentRate = wupDispatchRateSettings.initialRateValueMs;
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/worker/wup/dispatching/WupDispatchDynamicRateCalculator.js":
/*!**************************************************************************************!*\
  !*** ./js-sdk-legacy/src/worker/wup/dispatching/WupDispatchDynamicRateCalculator.js ***!
  \**************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ WupDispatchDynamicRateCalculator; }
/* harmony export */ });
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/**
 * Class is responsible for calculating the wup dispatch dynamic rate.
 */
var WupDispatchDynamicRateCalculator = /*#__PURE__*/function () {
  function WupDispatchDynamicRateCalculator(wupServerSessionState) {
    _classCallCheck(this, WupDispatchDynamicRateCalculator);
    this._wupServerSessionState = wupServerSessionState;
  }

  /**
   * Get the next dispatch rate
   * @returns {*}
   */
  return _createClass(WupDispatchDynamicRateCalculator, [{
    key: "getRate",
    value: function getRate() {
      return this._wupServerSessionState.getWupDispatchRate();
    }
  }, {
    key: "updateSettings",
    value: function updateSettings() {}
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/worker/wup/dispatching/WupDispatchIncrementalRateCalculator.js":
/*!******************************************************************************************!*\
  !*** ./js-sdk-legacy/src/worker/wup/dispatching/WupDispatchIncrementalRateCalculator.js ***!
  \******************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ WupDispatchIncrementalRateCalculator; }
/* harmony export */ });
/* harmony import */ var _WupDispatchRateType__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./WupDispatchRateType */ "./js-sdk-legacy/src/worker/wup/dispatching/WupDispatchRateType.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/**
 * Class is responsible for calculating the wup dispatch incremental rate.
 */

var WupDispatchIncrementalRateCalculator = /*#__PURE__*/function () {
  function WupDispatchIncrementalRateCalculator(wupDispatchRateSettings, wupStatisticsService) {
    _classCallCheck(this, WupDispatchIncrementalRateCalculator);
    this._wupStatisticsService = wupStatisticsService;
    this.updateSettings(wupDispatchRateSettings);
  }

  /**
   * Get the next dispatch rate
   * @returns {*}
   */
  return _createClass(WupDispatchIncrementalRateCalculator, [{
    key: "getRate",
    value: function getRate() {
      if (this._wupStatisticsService.getSentWupsCount() < this._incrementStartWupSendCount) {
        return this._currentRate;
      }
      var nextRate = this._currentRate + this._incrementStepMs;
      if (nextRate <= this._incrementStopMs) {
        this._currentRate = nextRate;
      }
      return this._currentRate;
    }
  }, {
    key: "updateSettings",
    value: function updateSettings(wupDispatchRateSettings) {
      if (wupDispatchRateSettings.type !== _WupDispatchRateType__WEBPACK_IMPORTED_MODULE_0__.WupDispatchRateType.incremental) {
        throw new Error('Invalid settings provided to incremental calculator');
      }
      this._currentRate = wupDispatchRateSettings.initialRateValueMs;
      this._incrementStepMs = wupDispatchRateSettings.incrementStepMs;
      this._incrementStopMs = wupDispatchRateSettings.incrementStopMs;
      this._incrementStartWupSendCount = wupDispatchRateSettings.incrementStartWupSendCount;
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/worker/wup/dispatching/WupDispatchRateCalculatorFactory.js":
/*!**************************************************************************************!*\
  !*** ./js-sdk-legacy/src/worker/wup/dispatching/WupDispatchRateCalculatorFactory.js ***!
  \**************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ WupDispatchRateCalculatorFactory; }
/* harmony export */ });
/* harmony import */ var _WupDispatchRateType__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./WupDispatchRateType */ "./js-sdk-legacy/src/worker/wup/dispatching/WupDispatchRateType.js");
/* harmony import */ var _WupDispatchConstantRateCalculator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./WupDispatchConstantRateCalculator */ "./js-sdk-legacy/src/worker/wup/dispatching/WupDispatchConstantRateCalculator.js");
/* harmony import */ var _WupDispatchIncrementalRateCalculator__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./WupDispatchIncrementalRateCalculator */ "./js-sdk-legacy/src/worker/wup/dispatching/WupDispatchIncrementalRateCalculator.js");
/* harmony import */ var _WupDispatchDynamicRateCalculator__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./WupDispatchDynamicRateCalculator */ "./js-sdk-legacy/src/worker/wup/dispatching/WupDispatchDynamicRateCalculator.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/**
 * Class is responsible for creating a wup dispatch calculator. It support 2 rate calculator types (incremental, constant)
 */




var WupDispatchRateCalculatorFactory = /*#__PURE__*/function () {
  function WupDispatchRateCalculatorFactory(wupStatisticsService, wupServerSessionState) {
    _classCallCheck(this, WupDispatchRateCalculatorFactory);
    this._wupStatisticsService = wupStatisticsService;
    this._wupServerSessionState = wupServerSessionState;
  }
  return _createClass(WupDispatchRateCalculatorFactory, [{
    key: "create",
    value: function create(settings) {
      if (settings.type === _WupDispatchRateType__WEBPACK_IMPORTED_MODULE_0__.WupDispatchRateType.constant) {
        return new _WupDispatchConstantRateCalculator__WEBPACK_IMPORTED_MODULE_1__["default"](settings);
      }
      if (settings.type === _WupDispatchRateType__WEBPACK_IMPORTED_MODULE_0__.WupDispatchRateType.incremental) {
        return new _WupDispatchIncrementalRateCalculator__WEBPACK_IMPORTED_MODULE_2__["default"](settings, this._wupStatisticsService);
      }
      if (settings.type === _WupDispatchRateType__WEBPACK_IMPORTED_MODULE_0__.WupDispatchRateType.dynamic) {
        return new _WupDispatchDynamicRateCalculator__WEBPACK_IMPORTED_MODULE_3__["default"](this._wupServerSessionState);
      }
      throw new Error("Unsupported dispatch rate type ".concat(settings.type));
    }
  }]);
}();


/***/ }),

/***/ "./js-sdk-legacy/src/worker/wup/dispatching/WupDispatchRateType.js":
/*!*************************************************************************!*\
  !*** ./js-sdk-legacy/src/worker/wup/dispatching/WupDispatchRateType.js ***!
  \*************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   WupDispatchRateType: function() { return /* binding */ WupDispatchRateType; }
/* harmony export */ });
var WupDispatchRateType = {
  incremental: 'incremental',
  constant: 'constant',
  dynamic: 'dynamic'
};

/***/ }),

/***/ "?dc1c":
/*!************************!*\
  !*** crypto (ignored) ***!
  \************************/
/***/ (function() {

/* (ignored) */

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	!function() {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = function(module) {
/******/ 			var getter = module && module.__esModule ?
/******/ 				function() { return module['default']; } :
/******/ 				function() { return module; };
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	!function() {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = function(exports, definition) {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	!function() {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	!function() {
/******/ 		__webpack_require__.o = function(obj, prop) { return Object.prototype.hasOwnProperty.call(obj, prop); }
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	!function() {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = function(exports) {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	}();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
!function() {
"use strict";
/*!********************************************!*\
  !*** ./js-sdk-legacy/src/worker/worker.js ***!
  \********************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _Application__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Application */ "./js-sdk-legacy/src/worker/Application.js");

new _Application__WEBPACK_IMPORTED_MODULE_0__["default"]().start();
}();
cdwpb = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=worker.debug.bundle.js.map