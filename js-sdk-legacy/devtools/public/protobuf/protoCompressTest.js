"use strict";

function b64ToUint6(nChr) {

    return nChr > 64 && nChr < 91 ?
    nChr - 65
        : nChr > 96 && nChr < 123 ?
    nChr - 71
        : nChr > 47 && nChr < 58 ?
    nChr + 4
        : nChr === 43 ?
        62
        : nChr === 47 ?
        63
        :
        0;
}

function base64DecToArr(sBase64, nBlocksSize) {
    var sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ""), nInLen = sB64Enc.length,
        nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2, taBytes = new Uint8Array(nOutLen);

    for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
        nMod4 = nInIdx & 3;
        nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
        if (nMod4 === 3 || nInLen - nInIdx === 1) {
            for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
                taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
            }
            nUint24 = 0;
        }
    }
    return taBytes;
}


function removeWrappingCharacter(str, wrappingCharacter) {

    //Set default wrapping character if not defined
    wrappingCharacter = wrappingCharacter || '"';

    //Check if first and last character are equal to wrappingCharacter
    if (str[0] === wrappingCharacter && str[str.length-1] === wrappingCharacter) {
        return str.substring(1, str.length-1);
    }
    else {
        return str;
    }
}

function prettifyJsonString(jsonString) {
    try {
        var obj = JSON.parse(jsonString);
        var pretty = JSON.stringify(obj, undefined, 4);
        return pretty;
    }
    catch (e) {
        alert("Can't pretiffy, please see developer tools log");
        console.log('Pretiffy Error:', e);
        return jsonString;
    }
}

function prettifyTextAreaById(textAreaId) {
    var textAreaElement = document.getElementById(textAreaId);
    var textAreaValue = textAreaElement.value;
    textAreaElement.value = prettifyJsonString(textAreaValue);
}

function showError(error, preText) {
    var preText = preText || "Error";
    var errorText='';
    if (typeof(error) === 'object' && 'message' in error) {
        errorText = error.message
    }
    else {
        errorText = error;
    }
    alert(preText + ": " + errorText);
}

var origProtoBuilder = null;

var OrigWup = null;

var isReady = false;

function initProtoStructures() {
    origProtoBuilder = dcodeIO.ProtoBuf.loadProtoFile('/protobuf/protocol.html');
    var origCD = origProtoBuilder.build("CD");
    OrigWup = origCD.Protocol.BaseRequest;

    isReady = true;
}

window.onload = function () {
    initProtoStructures();
};

//protoBuf -> Base64 -> decoding to array (Uint8Array) -> compression (using pako lib) -> Base64 encoding

function protoBufCompress(protoCompressCtor, jsonToCompress) {
    var origWup = new protoCompressCtor(jsonToCompress);
    var compressed = btoa(pako.deflateRaw(base64DecToArr(origWup.toBase64()), {to: 'string'}));
    return compressed;
}

function compress() {
    if (!isReady) {
        alert('Not ready yet, give me a few moments and retry...');
        return;
    }
    try {
        var compressTA = document.getElementById('compressTA');
        var compressBy = document.getElementById('compressBy');
        var compressRatioElem = document.getElementById('compressRatio');

        var textToCompress = compressTA.value;
        var lenBeforeCompress = textToCompress.length;

        var jsonToCompress = JSON.parse(textToCompress);
        var compressed = null;
        switch (compressBy.value) {
            case 'protobuf':
                compressed = protoBufCompress(OrigWup, jsonToCompress);
                break;
            case 'msgpack':
                compressed = msgpack.encode(jsonToCompress);
                compressed = pako.deflateRaw(compressed, {to: 'string'});
                compressed = btoa(compressed);
                break;
            case 'onlyzip':
                compressed = pako.deflateRaw(JSON.stringify(jsonToCompress), {to: 'string'});
                compressed = btoa(compressed);
        }


        var lenAfterCompress = compressed.length;
        console.log(lenAfterCompress);
        var compressRatio = ((lenBeforeCompress - lenAfterCompress) / lenBeforeCompress) * 100;
        compressRatioElem.innerHTML = 'Original length: ' + lenBeforeCompress + '\n Compresses length: ' +
                lenAfterCompress + '\n Compressed by ' + compressRatio + '%';
        var compressResultTA = document.getElementById('compressResultTA');
        compressResultTA.value = compressed;
    }
    catch (ex) {
        showError(ex, 'Failed to encode');
    }

	
}

function uncompress() {
    try {
        var uncompressTA = document.getElementById('uncompressTA');
        var uncompressResultTA = document.getElementById('uncompressResultTA');

        var textToUnCompress = removeWrappingCharacter(uncompressTA.value);

        var unB64 = atob(textToUnCompress);
        var unzipped = pako.inflateRaw(unB64);
        var compressBy = document.getElementById('compressBy');
        var uncompressed = null;
        switch (compressBy.value) {
            case 'protobuf':
                uncompressed = OrigWup.decode(unzipped);
                break;
            case 'msgpack':
                uncompressed = msgpack.decode(unzipped);
                break;
            case 'onlyzip':
                var str = new TextDecoder("utf-8").decode(unzipped);
                uncompressed = JSON.parse(str);
                break;
        }
        var decodedValue = JSON.stringify(uncompressed);
        uncompressResultTA.value = decodedValue;
    }
    catch(ex) {
        showError(ex, 'Failed to decode');
    }
}