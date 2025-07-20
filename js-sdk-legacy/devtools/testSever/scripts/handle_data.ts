/**
 * Created by ShirleyK on 20/10/2016.
 */

var pako = require('pako');
var msgpack = require('msgpack-lite');
var fs = require('fs');

var basePath = "";
var currWup = "no wup";
    
function init () {
    basePath = "./statics";
    if (!fs.existsSync(basePath)){
        fs.mkdirSync(basePath);
    }
    basePath += "/output";
    if (!fs.existsSync(basePath)){
        fs.mkdirSync(basePath);
    }
    basePath += "/sessions";
    if (!fs.existsSync(basePath)){
        fs.mkdirSync(basePath);
    }
}

function decodeWup(compData) {
    try {
        var unB64 = new Buffer(compData, 'base64').toString('binary');
        var unzipped = pako.inflateRaw(unB64);

        return msgpack.decode(unzipped);
        //return result1;
    }
    catch (ex) {
        console.log("Failed to decode: " + ex);
    }
}

function saveWup(sid, cid, csid, rawData, cb) {

    var path = basePath + "/" + cid;

    var result = decodeWup(rawData);
    var asStr = JSON.stringify(result); //
    currWup = asStr;

    if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
    }

    path +=  "/" + sid;
    // open the file for appending - 'a'
    fs.open(path + "_raw.json", 'a+', function (err, id) {
        if (!err) {
            fs.write(id, rawData + "\r\n", null, 'utf8', function (e) {
                console.log('added raw wup');
                fs.close(id, function () {
                    console.log('raw file closed');
                });
                if (e) {
                    cb("failed writing to file");
                    return;
                }
            });
        }
        else {
            cb("failed opening raw file for writing");
            return;
        }
    });

    fs.open(path + "_decoded.json", 'a+', function (err, id) {
        if (!err) {
            fs.write(id, asStr + "\r\n", null, 'utf8', function (e) {
                console.log('added wup');
                fs.close(id, function () {
                    console.log('file closed');
                });
                if (e) {
                    cb("failed writing to file");
                } else {
                    cb(result);
                }
            });
        }
        else {
            cb("failed opening decoded file for writing");
        }
    });
}

/**
 * remove entire directories by customer names - (bcqa, etc..)
 * @param cid
 */
function clearData(cid) {
    var path = basePath + "/" + cid;
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file) {
            var curPath = path + "/" + file;
            fs.unlinkSync(curPath);
        });
        fs.rmdirSync(path);
        return "success";
    }
    return "folder doesn't exist"
}

/**
 * read all the data of the session and return it
 * @param sid
 * @param cid
 * @returns {string}
 */
function getSession(sid, cid) {
    var path = basePath + "/" + cid;
    if (fs.existsSync(path)) {
        path += "/" + sid + "_decoded.json";
        try {
            var fileContents = fs.readFileSync(path, 'utf8');
            console.log('successfully read session file');
            return fileContents;
        } catch (err) {
            return err.message;
        }
    }
    return "folder doesn't exist"
}

/**
 * get the last wup decoded, for testing purposes
 * @returns {string}
 */
function getLastWup() {
    return currWup;
}

exports.saveWup = saveWup;
exports.init = init;
exports.clearData = clearData;
exports.getSession = getSession;
exports.getLastWup = getLastWup;
