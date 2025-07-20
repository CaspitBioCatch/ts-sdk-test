// Karma configuration
// Generated on Mon Feb 01 2016 16:29:19 GMT+0200 (Jerusalem Standard Time)

const ChromeOldestSupportedVersion = 100;
const FirefoxOldestSupportedVersion = 100;
const SafariOldestSupportedVersion = 11;
const OperaOldestSupportedVersion = 100;

const buildNumber = process.env.GITHUB_RUN_NUMBER || 0;

const webpackConfig = require('./scripts/webpack/webpack.karma.config.js');

module.exports = function (config) {
    config.set({
        // base path that will be used to resolve all patterns (eg. files, exclude)
        // JsClient folder
        basePath: '',

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['mocha', 'sinon', 'chai'],

        webpack: webpackConfig,

        webpackMiddleware: {
            stats: 'normal',
        },

        preprocessors: {
            'src/**/*.js': ['webpack', 'coverage', 'sourcemap'],  // Ensure source files are instrumented

            // Integration tests
            'tests/integration/**/*.js': ['webpack'],
            // Unit tests
            'tests/unit/**/*Spec.js': ['webpack'],
            'tests/unit/mocks/*.js': ['webpack'],
            'tests/*.js': ['webpack'],
            'tests/unit/helpers/polyfillsLoader.js': ['webpack'], // To apply the polyfills
        },

        client: {
            captureConsole: true,
            mocha: {
                timeout: 60000,
            },
        },

        // test results reporter to use
        // possible values: 'dots', 'progress', 'spec' ...
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['spec', 'junit', 'coverage'],

        // web server port
        port: 9876,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,

        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['Chrome'],

        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: false,

        // Concurrency level
        // how many browser should be started simultaneous
        concurrency: 25, // Default is value Infinity,

        browserStack: {
            username: 'clientteamautoma1',
            accessKey: 'mronzeUyApXvCMm51dq4',
            forcelocal: true
        },
        customLaunchers: {
            win_Chrome_Next: {
                'base': 'BrowserStack',
                'os_version': '11',
                'browser_version': 'latest-beta',
                'device': null,
                'os': 'Windows',
                'browser': 'chrome',
                'project': 'JS',
                'build': buildNumber,
            },
            win_Chrome_Latest: {
                'base': 'BrowserStack',
                'os_version': '11',
                'device': null,
                'os': 'Windows',
                'browser': 'chrome',
                'project': 'JS',
                'build': buildNumber,
            },
            win_Chrome_Oldest_Supported: {
                'base': 'BrowserStack',
                'os_version': '10',
                'device': null,
                'os': 'Windows',
                'browser': 'chrome',
                'browser_version': ChromeOldestSupportedVersion,
                'project': 'JS',
                'build': buildNumber,
            },
            win_Firefox_Next: {
                'base': 'BrowserStack',
                'os_version': '11',
                'browser_version': 'latest-beta',
                'device': null,
                'os': 'Windows',
                'browser': 'firefox',
                'project': 'JS',
                'build': buildNumber,
            },
            win_Firefox_Latest: {
                'base': 'BrowserStack',
                'os_version': '11',
                'device': null,
                'os': 'Windows',
                'browser': 'firefox',
                'project': 'JS',
                'build': buildNumber,
            },
            win_Opera_Latest: {
                'base': 'BrowserStack',
                'os_version': '11',
                'device': null,
                'os': 'Windows',
                'browser': 'opera',
                'project': 'JS',
                'build': buildNumber,
            },
            win_Opera_Oldest_Supported: {
                'base': 'BrowserStack',
                'os_version': '10',
                'browser_version': OperaOldestSupportedVersion,
                'device': null,
                'os': 'Windows',
                'browser': 'opera',
                'project': 'JS',
                'build': buildNumber,
            },
            win_FF_Oldest_Supported: {
                'base': 'BrowserStack',
                'os_version': '10',
                'device': null,
                'os': 'Windows',
                'browser': 'firefox',
                'browser_version': FirefoxOldestSupportedVersion,
                'project': 'JS',
                'build': buildNumber,
            },
            win_Edge_Next: {
                'base': 'BrowserStack',
                'os_version': '1',
                'browser_version': 'latest-beta',
                'device': null,
                'os': 'Windows',
                'browser': 'edge',
                'project': 'JS',
                'build': buildNumber,
            },
            win_Edge_Latest: {
                'base': 'BrowserStack',
                'os_version': '11',
                'device': null,
                'os': 'Windows',
                'browser': 'edge',
                'project': 'JS',
                'build': buildNumber,
            },
            macOS_Chrome_Next: {
                'base': 'BrowserStack',
                'os_version': 'Ventura',
                'browser_version': 'latest-beta',
                'device': null,
                'os': 'OS X',
                'browser': 'chrome',
                'project': 'JS',
                'build': buildNumber,
            },
            macOS_Chrome_Latest: {
                'base': 'BrowserStack',
                'os_version': 'Ventura',
                'device': null,
                'os': 'OS X',
                'browser': 'chrome',
                'project': 'JS',
                'build': buildNumber,
            },
            macOS_Firefox_Next: {
                'base': 'BrowserStack',
                'os_version': 'Ventura',
                'browser_version': 'latest-beta',
                'device': null,
                'os': 'OS X',
                'browser': 'firefox',
                'project': 'JS',
                'build': buildNumber,
            },
            macOS_Firefox_Latest: {
                'base': 'BrowserStack',
                'os_version': 'Ventura',
                'device': null,
                'os': 'OS X',
                'browser': 'firefox',
                'project': 'JS',
                'build': buildNumber,
            },
            macOS_Safari_Next: {
                'base': 'BrowserStack',
                'os_version': 'Ventura',
                'browser_version': 'latest-beta',
                'device': null,
                'os': 'OS X',
                'browser': 'safari',
                'project': 'JS',
                'build': buildNumber,
            },
            macOS_Safari_16: {
                'base': 'BrowserStack',
                'os_version': 'Ventura',
                'device': null,
                'os': 'OS X',
                'browser': 'safari',
                'project': 'JS',
                'build': buildNumber,
            },
            macOS_Safari_15: {
                'base': 'BrowserStack',
                'os_version': 'Monterey',
                'device': null,
                'os': 'OS X',
                'browser': 'safari',
                'project': 'JS',
                'build': buildNumber,
            },
            macOS_Safari_14: {
                'base': 'BrowserStack',
                'os_version': 'Monterey',
                'device': null,
                'os': 'OS X',
                'browser': 'safari',
                'project': 'JS',
                'build': buildNumber,
            },
            macOS_Safari_13: {
                'base': 'BrowserStack',
                'os_version': 'Monterey',
                'device': null,
                'os': 'OS X',
                'browser': 'safari',
                'project': 'JS',
                'build': buildNumber,
            },
            macOS_Safari_Oldest_Supported: {
                'base': 'BrowserStack',
                'os_version': 'Monterey',
                'browser_version': SafariOldestSupportedVersion,
                'device': null,
                'os': 'OS X',
                'browser': 'safari',
                'project': 'JS',
                'build': buildNumber,
            },
            macOS_Opera_Latest: {
                'base': 'BrowserStack',
                'os_version': 'Ventura',
                'device': null,
                'os': 'OS X',
                'browser': 'opera',
                'project': 'JS',
                'build': buildNumber,
            },
            ios15_Safari: {
                'base': 'BrowserStack',
                'real_mobile': 'true',
                'device': 'iPhone 13',
                'os_version': '15',
                'os': 'iOS',
                'browser': 'iphone',
                'project': 'JS',
                'build': buildNumber,
            },
            ios14_Safari: {
                'base': 'BrowserStack',
                'real_mobile': 'true',
                'device': 'iPhone 11',
                'os_version': '14',
                'os': 'iOS',
                'browser': 'iphone',
                'project': 'JS',
                'build': buildNumber,
            },
            ios13_Safari: {
                'base': 'BrowserStack',
                'real_mobile': 'true',
                'device': 'iPhone 11 Pro Max',
                'os_version': '13.2',
                'os': 'iOS',
                'browser': 'iphone',
                'project': 'JS',
                'build': buildNumber,
            },
            ios12_Safari: {
                'base': 'BrowserStack',
                'real_mobile': 'true',
                'device': 'iPhone XS',
                'os_version': '12.1',
                'os': 'iOS',
                'browser': 'iphone',
                'project': 'JS',
                'build': buildNumber,
            },
            ios11_Safari: {
                'base': 'BrowserStack',
                'real_mobile': 'true',
                'device': 'iPhone X',
                'os_version': '11.0',
                'os': 'iOS',
                'browser': 'iphone',
                'project': 'JS',
                'build': buildNumber,
            },
            android13_next: {
                'base': 'BrowserStack',
                'browser_version': 'latest-beta',
                'real_mobile': true,
                'os': 'android',
                'os_version': '13.0',
                'browser': 'android',
                'device': 'Google Pixel 6 Pro',
                'project': 'JS',
                'build': buildNumber,
            },
            android13_Chrome: {
                'base': 'BrowserStack',
                'browser_version': 'latest',
                'real_mobile': true,
                'os': 'android',
                'os_version': '13.0',
                'browser': 'android',
                'device': 'Google Pixel 7 Pro',
                'project': 'JS',
                'build': buildNumber,
            },
            android12_Chrome: {
                'base': 'BrowserStack',
                'browser_version': 'latest',
                'real_mobile': true,
                'os': 'android',
                'os_version': '12.0',
                'browser': 'android',
                'device': 'Google Pixel 6 Pro',
                'project': 'JS',
                'build': buildNumber,
            },
            android11_Chrome: {
                'base': 'BrowserStack',
                'browser_version': 'latest',
                'real_mobile': true,
                'os': 'android',
                'os_version': '11.0',
                'browser': 'android',
                'device': 'Google Pixel 5',
                'project': 'JS',
                'build': buildNumber,
            },
        },
    });
};
