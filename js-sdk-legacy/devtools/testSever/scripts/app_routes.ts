
//============== DEPENDENCIES ==============
var express = require('express');
var handle_data = require('./handle_data');
//------------------------------------------

var router  = express.Router();

var config = {"androidMaxVersion":22,"chromeMaxVersion":54,"logLevel":2,"defaultQueueSize":250,"featureConfiguration":-8388609,"iosMaxVersion":8,"mozillaMacOsMaxVersion":50,"mozillaMaxVersion":50,"msieMaxVersion":20,"safariMaxVersion":11,"stackTraceEnabled":false,"success":true};


router.get('/', function (request, response) {
    response.render('page_main', {});
});

router.get('/shirley', function (request, response) {
    //response.setHeader("Access-Control-Allow-Origin", "http://example.com");

    response.json({"hello":"world"});
});

/**
 * example:
 * /client/v3/web/wup?cid=bcqa&sid=1473003292441-a9b15791-98f5-46b3-815d-9f752444cc4d&csid=1234&muid=9E612366
 */
router.get('/client/v3/web/wup', function (request, response) {
    var cid = request.query.cid;
    var sid = request.query.sid;
    var csid = request.query.csid;

    var compData = request.body;

    handle_data.saveWup(sid, cid, csid, compData, (res) => {
        if (res) {
            //var asStr = JSON.stringify(res);
            //response.json(asStr);
            response.json(res);
        } else {
            response.json(config);
        }
    });
});

/**
 * /client/v3/web/wup?cid=bcqa&sid=1473003292441-a9b15791-98f5-46b3-815d-9f752444cc4d&csid=1234&muid=9E612366
 */
router.post('/client/v3/web/wup', function (request, response) {
    var cid = request.query.cid;
    var sid = request.query.sid;
    var csid = request.query.csid;

    var compData = request.body;

    handle_data.saveWup(sid, cid, csid, compData, (res) => {
        // save to a cid directory, file name sid
        if (res) {
            //var asStr = JSON.stringify(res);
            //response.json(asStr);
            response.json(res);
        } else {
            response.json(config);
        }
    });
});

/**
 * example:
 * https://localhost:8099/data/bcqa/1473003292441-a9b15791-98f5-46b3-815d-9f7554314444
 */
router.get('/data/:cid/:sid', function (request, response) {
    //response.setHeader("Access-Control-Allow-Origin", "http://example.com");
    var sid = request.params.sid;
    var cid = request.params.cid;

    var res = handle_data.getSession(sid, cid);
    response.json(res);
});

/**
 * this is for thw wup from the client
 * example:
 * https://localhost:8099/data/bcqa/1473003292441-a9b15791-98f5-46b3-815d-9f7554314444
 */
router.post('/lastWup', function (request, response) {
    var res = handle_data.getLastWup();
    response.json(res);
});

/**
 * this is for browser viewing
 * example:
 * https://localhost:8099/data/bcqa/1473003292441-a9b15791-98f5-46b3-815d-9f7554314444
 */
router.get('/lastWup', function (request, response) {
    var res = handle_data.getLastWup();
    response.json(res);
});

/**
 * example: https://localhost:8099/clear/bcqa
 */
router.get('/clear/:cid', function (request, response) {
    //response.setHeader("Access-Control-Allow-Origin", "http://example.com");
    var cid = request.params.cid;
    var res = handle_data.clearData(cid);
    response.json("clear data for customer: " + cid + " - " + res);
});

export = router;
