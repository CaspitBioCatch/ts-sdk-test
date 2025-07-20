
let moment = require('moment');
let os = require('os');

let bsSeleniumDesiredCapabilities = {
    "browserstack.user": "eitambelahousky1",
    "browserstack.key": "2gL991gA9eyqz7vUDJdd",
    "build": process.env.SHIPPABLE_BUILD_NUMBER || `${os.hostname}-${moment().format('YYYY-MM-DD')}`,
    "project": "JS"
};

let ciLlocal = {
    start_process : false,
    selenium_port  : 80,
    selenium_host  : "hub-cloud.browserstack.com",
    desiredCapabilities: Object.assign({ "browserstack.local": true }, bsSeleniumDesiredCapabilities)
};

let nightwatchConf =  {
    "src_folders" : ["tests/e2e/tests"],
    "output_folder" : "test-reports",

    "selenium" : {
        "start_process" : true,
        "server_path" : process.env.CI ?  "" : "./bin/selenium/selenium-server-standalone-3.7.1.jar",
        "port" : 4444,
        "cli_args" : {
            "webdriver.chrome.driver" : "./bin/selenium/chromedriver"
        }
    },

    "test_settings" : {
        "default" : {
            "launch_url" : "https://localhost:8000",
            "selenium_port"  : 4444,
            "selenium_host"  : "localhost",
            "request_timeout_options": {
                "timeout": 30000,
                "retry_attempts": 3
            },
            "silent": true,
            "screenshots" : {
                "enabled" : false,
                "path" : ""
            },
            "desiredCapabilities": {
                "browserName": "chrome"
            }
        },

        chrome: {
            desiredCapabilities: Object.assign({ browser: "chrome" }, ciLlocal.desiredCapabilities),
        },
        firefox: {
            desiredCapabilities: Object.assign({ browser: "firefox" }, ciLlocal.desiredCapabilities),
        },
        safari: {
            desiredCapabilities: Object.assign({ browser: "Safari", browser_version: '11.0' }, ciLlocal.desiredCapabilities),
        },
        ie : {
            desiredCapabilities: Object.assign({ browser: "IE", browser_version: '11.0', os_version: '10' },
                ciLlocal.desiredCapabilities),
        },
        edge : {
            desiredCapabilities: Object.assign({ browser: "Edge" }, ciLlocal.desiredCapabilities),
        },
        android: {
            desiredCapabilities: Object.assign({ browser: "android", "os": "android", "os_version": "7.0",
                "device": "Samsung Galaxy S8", "real_mobile": true }, ciLlocal.desiredCapabilities),
        }
    }

};

// Code to copy the ciLocal to each browser
for(let browser in nightwatchConf.test_settings) {
    if (browser !== 'default') {
        let browserConfig = nightwatchConf.test_settings[browser];
        browserConfig['selenium_host'] = ciLlocal.selenium_host;
        browserConfig['selenium_port'] = ciLlocal.selenium_port;
    }
}


module.exports = nightwatchConf;



