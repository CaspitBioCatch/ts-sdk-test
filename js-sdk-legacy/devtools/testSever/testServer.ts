//============== DEPENDENCIES ==============
var express           = require('express');
var bodyParser        = require('body-parser');
var fs                = require('fs');
var https             = require('https');
var path              = require('path');
var expressReact      = require('express-react-views');
var setting           = require('./testServer.json');
var handle_data = require('./scripts/handle_data');

//------------------------------------------

/**
 * Get params from args
 */
var argv       = require('optimist').argv;
//===============EXPRESS INIT===============
var testServerApp = express();
/** view */
testServerApp.set('views', __dirname + '/views');
testServerApp.set('view engine', 'jsx');
testServerApp.engine('jsx', expressReact.createEngine({ beautify: true }));
//------------------------------------------

//=============== STATICS  =================
testServerApp.use(express.static(path.join(__dirname, './statics')));
testServerApp.use(bodyParser.text());
//------------------------------------------

//===============  ROUTES  =================
var app_routes = require('./scripts/app_routes');
testServerApp.use('/', app_routes);
//------------------------------------------

/**
 * node testServer -p 8000 --cors --ssl --cert 20245029-localhost.cert --key 20245029-localhost.key
 * usage:
 * 'usage: http-server [path] [options]',
 '',
 'options:',
 '  -p           Port to use [8080]', (443) for ssl??
 '  -a           Address to use [0.0.0.0]',
 '  --cors[=headers]   Enable CORS via the "Access-Control-Allow-Origin" header',
 '                     Optionally provide CORS headers list separated by commas',
 '  -S --ssl     Enable https.',
 '  -C --cert    Path to ssl cert file (default: cert.pem).',
 '  -K --key     Path to ssl key file (default: key.pem).',
 * 
 */
function setServer () {
    var port = argv.p || setting.server.port,
        host = argv.a || setting.server.host,
        ssl = !!argv.S || !!argv.ssl;

    var options = {};

    if (argv.cors) {
        //options.cors = true;
        options.headers = {};
        options.headers['Access-Control-Allow-Origin'] = '*';
        options.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Range';

        /*if (typeof argv.cors === 'string') {
            options.corsHeaders = argv.cors;
        }*/
    }

    if (ssl) {
        options.key = fs.readFileSync(argv.key);
        options.cert = fs.readFileSync(argv.cert);
        var server = https.createServer(options, testServerApp);
        server.listen(port, function () {
            console.log('======= Test Server =======');
            console.log("Listening on ssl port: " + port + ".");
            console.log('---------------------------');
        });
    } else {
        testServerApp.listen(setting.server.port, function () {
            console.log('======= Test Server =======');
            console.log("Listening on port: " + port + ".");
            console.log('---------------------------');
        });
    }

    handle_data.init();
}

//============= START SERVER ===============
setServer();