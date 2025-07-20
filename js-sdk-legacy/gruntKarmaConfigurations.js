const integrationTestsFiles = [
    'src/main/samples/DefaultCustomerApi.js',

    'tests/integration/main/GlobalHooks.js',
    'tests/integration/main/FrameSpec.js',
    'tests/integration/main/ConfigSpec.js',
    'tests/integration/main/ContextSpec.js',
    'tests/integration/main/events/WebComponentSpec.js',
    'tests/integration/main/SessionSpec.js',
    'tests/integration/main/HeartBeatSampleSpec.js',
    'tests/integration/main/ServerStateSpec.js',
    'tests/integration/main/MetadataSpec.js',
    'tests/integration/main/CustomerApiSpec.js',
    'tests/integration/main/ConfigurationChanger.js',
    'tests/integration/main/api/CoordinatesMaskingConfigurationUpdaterSpec.js',
    'tests/integration/main/events/LightSensorEventsSpec.js',
    'tests/integration/main/events/ElementsEventsSpec.js',
    'tests/integration/main/events/OrientationEventsSpec.js',
    'tests/integration/main/events/accelerometer/AccelerometerEventsSpec.js',
    'tests/integration/main/events/ElementEventsUnmaskedValueFeatureSpec.js',
    'tests/integration/main/events/WindowEventsSpec.js',
    'tests/integration/main/events/Key/KeyMaskingSpec.js',
    'tests/integration/main/events/Key/KeyEventsSpec.js',
    'tests/integration/main/events/TouchEventSpec.js',
    'tests/integration/main/events/PinchZoomEventsSpec.js',
    'tests/integration/main/events/ScriptEventsSpec.js',
    'tests/integration/main/events/DataOriginSpec.js',
    'tests/integration/main/events/MouseEventsSpec.js',
    'tests/integration/main/events/TapEventsSpec.js',
    'tests/integration/main/events/RestoredMuidEventHandlerSpec.js',
    'tests/integration/main/events/ClipboardEventsSpec.js',
    'tests/integration/main/FontsPerformanceMeasurement.js',
    'tests/integration/main/HeartBeatMessagesSpec.js',

    { pattern: 'tests/integration/dummyScriptOne.js', included: false, served: true },
];

const crossDomainIntegrationTestsFiles = [
    'node_modules/regenerator-runtime/runtime.js', // Generators for async await
    'node_modules/promise-polyfill/dist/polyfill.min.js', // Promise polyfill
    'src/main/samples/DefaultCustomerApi.js',
    'tests/integration/crossdomain/**/*.js',
    { pattern: 'tests/integration/dummyScriptOne.js', included: false, served: true },
    { pattern: 'tempClasses/mainInternal.debug.bundle.js', included: true, served: true },
];

// load relevant files for slave setup
const integrationSlaveTestsFiles = [
    'node_modules/regenerator-runtime/runtime.js', // Generators for async await
    'node_modules/promise-polyfill/dist/polyfill.min.js', // Promise polyfill
    'tests/integration/slave/**/*.js',
    { pattern: 'tests/integration/dummyScriptOne.js', included: false, served: true },
    { pattern: 'tempClasses/slaveInternal.debug.bundle.js', included: true, served: true },
];

// load relevant files for slave bootstrap setup
const integrationSlaveBootstrapTestsFiles = [
    'node_modules/regenerator-runtime/runtime.js', // Generators for async await
    'node_modules/promise-polyfill/dist/polyfill.min.js', // Promise polyfill
    'tests/integration/slavebootstrap/**/*.js',
    { pattern: 'tests/integration/dummyScriptOne.js', included: false, served: true },
    { pattern: 'tempClasses/slaveInternal.debug.bundle.js', included: true, served: true },
];

const safariMobileBrowsers = ['ios15_Safari'];
const safariDesktopBrowsers = ['macOS_Safari_16', 'macOS_Safari_15'];
// Comment out the android legacy devices since they have very low availability in browserstack and cause many build failures
const androidBrowsers = ['android13_Chrome', 'android12_Chrome', 'android11_Chrome'];
const legacyBrowsers = ['win_Chrome_Oldest_Supported', 'win_FF_Oldest_Supported', 'win_Opera_Oldest_Supported'];
// Latest Mac Opera and FF next are currently commented out due to a bug in BrowserStack. Uncomment it once bug is fixed.
const macBrowsers = ['macOS_Chrome_Latest', 'macOS_Opera_Latest'/*'macOS_Firefox_Latest'*/];
// Next FF is currently disabled due to browserstack issues
//Waiting for browser stack to solve this issue, crypto js not working on firefox
const windowsBrowsers = ['win_Chrome_Latest', /*'win_Firefox_Latest',*/
    'win_Edge_Latest'];
const winBetaBrowsers = ['win_Chrome_Next', 'win_Edge_Next', 'win_Firefox_Next'];
const macOSWBetaBrowsers = ['macOS_Chrome_Next', 'macOS_Safari_Next', 'macOS_Firefox_Next'];
const iosBetaBrowsers = ['ios15_Safari'];
const androidBetaBrowsers = ['android12_Chrome'];


const ciBrowsers = safariMobileBrowsers.concat(safariDesktopBrowsers).concat(macBrowsers)
    .concat(windowsBrowsers);
const safariBrowsers = safariDesktopBrowsers.concat(safariMobileBrowsers);
const ciBrowsersExcludingSafari = windowsBrowsers.concat(macBrowsers).concat(androidBrowsers)
const allBrowsers = ciBrowsersExcludingSafari.concat(safariBrowsers);
const crossdomainBrowsers = windowsBrowsers.concat(androidBrowsers).concat(macBrowsers);
// slave integration browsers, which includes MessageChannel support.
const ciSlaveBrowsers = windowsBrowsers.concat(macBrowsers).concat(androidBrowsers);
const ciSlaveLatestBetaBrowsers = winBetaBrowsers.concat(macOSWBetaBrowsers);

const webpackConfig = require('./scripts/webpack/webpack.karma.config.js');
const webpackIntegConfig = require('./scripts/webpack/webpack.karma.integ.config.js');
const slimWebpackConfig = require('./scripts/webpack/webpack.karma.slim.config.js');
const devWebpackConfig = require('./scripts/webpack/webpack.karma.dev.config.js');
const unitWebpackConfig = require('./scripts/webpack/webpack.karma.unit.config.js');

function _createUnitTestsOptions(overriddenOptions = {}) {
    const unitTestsOptionsDefault = {
        browsers: [],
        outputDir: 'unitTests',
        useSpecReporter: false,
        useProgressReporter: false,
        useDotsReporter: true,
        useJUnitReporter: true,
        userCoverageReporter: true,
        userBrowserStackReporter: true,
        hostname: 'localhost',
        singleRun: true,
        autoWatch: false,
        browserStack: {
            username: 'clientteamautoma1',
            accessKey: 'mronzeUyApXvCMm51dq4',
        },
        webpack: webpackConfig,
    };

    return { ...unitTestsOptionsDefault, ...overriddenOptions };
}

function _createUnitTestsConfiguration(options = _createUnitTestsOptions()) {
    const reporters = [];
    if (options.useSpecReporter) {
        reporters.push('spec');
    }

    if (options.useProgressReporter) {
        reporters.push('progress');
    }

    if (options.useDotsReporter) {
        reporters.push('dots');
    }

    if (options.useJUnitReporter) {
        reporters.push('junit');
    }

    if(options.userBrowserStackReporter) {
        reporters.push('BrowserStack');
    }

    if (options.userCoverageReporter) {
        reporters.push('coverage');
    }

    return {
        singleRun: options.singleRun,
        autoWatch: options.autoWatch,
        browsers: options.browsers,
        reporters,
        captureTimeout: 120000,
        browserNoActivityTimeout: 120000,
        browserDisconnectTimeout: 120000,
        browserSocketTimeout: 120000,
        browserDisconnectTolerance: 2,
        hostname: options.hostname,
        junitReporter: {
            outputDir: `${process.env.TEST_REPORTS_FOLDER_PATH || 'test-reports'}/${options.outputDir}`,
            suite: 'unitTests',
        },
        specReporter: {
            // maxLogLines: 5,             // limit number of lines logged per test
            // suppressErrorSummary: true, // do not print error summary
            // suppressFailed: false,      // do not print information about failed tests
            suppressPassed: false, // do not print information about passed tests
            // suppressSkipped: true,      // do not print information about skipped tests
            showSpecTiming: true, // print the time elapsed for each spec
            failFast: false, // test would finish with error when a first fail occurs.
        },
        coverageReporter: {
            dir: `${process.env.CODE_COVERAGE_REPORTS_FOLDER_PATH || 'code-coverage-reports'}/${options.outputDir}`,
            reporters: [
                { type: 'lcov', subdir: '.' },            // Generate LCOV report for CI tools like SonarQube
                { type: 'text-summary' },                 // Print summary to the terminal
                { type: 'html', subdir: 'html-report' },  // Generate HTML report for visual inspection
                { type: 'json-summary', subdir: '.' }     // Generate JSON summary for programmatic usage
            ],
            fixWebpackSourcePaths: true,  // Ensure correct source paths for Webpack-processed files
            combineBrowserReports: true,  // Combine coverage from different browsers
            skipFilesWithNoCoverage: true // Skip files with no coverage
        },

        browserStack: options.browserStack,
        webpack: options.webpack,
    };
}

function _createIntegrationTestsOptions(overriddenOptions = {}) {
    const integrationTestsOptionsDefault = {
        browsers: [],
        files: integrationTestsFiles,
        outputDir: 'integrationTests',
        useSpecReporter: false,
        useProgressReporter: false,
        useDotsReporter: true,
        useJUnitReporter: true,
        userCoverageReporter: true,
        userBrowserStackReporter: true,
        hostname: 'localhost',
        singleRun: true,
        autoWatch: false,
        browserStack: {
            username: 'clientteamautoma2',
            accessKey: 'Uzkdy7urAiTxh6xNzdQP',
        },
        webpack: webpackIntegConfig,
    };

    return { ...integrationTestsOptionsDefault, ...overriddenOptions };
}

function _createCrossDomainIntegrationTestsOptions(overriddenOptions = {}) {
    const integrationTestsOptionsDefault = {
        browsers: [],
        files: crossDomainIntegrationTestsFiles,
        outputDir: 'crossDomainIntegrationTests',
        useSpecReporter: false,
        useProgressReporter: false,
        useDotsReporter: true,
        useJUnitReporter: true,
        userCoverageReporter: true,
        userBrowserStackReporter: true,
        hostname: 'localhost',
        singleRun: true,
        autoWatch: false,
        browserStack: {
            username: 'clientteamautoma2',
            accessKey: 'Uzkdy7urAiTxh6xNzdQP',
        },
        webpack: webpackIntegConfig,
    };

    return { ...integrationTestsOptionsDefault, ...overriddenOptions };
}

function _createIntegrationTestsConfiguration(options = _createIntegrationTestsOptions()) {
    if (!options) {
        throw new Error('Invalid options parameter. Options must contain a value');
    }

    if (!options.browsers || options.browsers.length === 0) {
        throw new Error('Invalid browsers list. Browsers list must contain at least 1 browser.');
    }

    const reporters = [];
    if (options.useSpecReporter) {
        reporters.push('spec');
    }

    if (options.useProgressReporter) {
        reporters.push('progress');
    }

    if (options.useDotsReporter) {
        reporters.push('dots');
    }

    if (options.useJUnitReporter) {
        reporters.push('junit');
    }

    if(options.userBrowserStackReporter) {
        reporters.push('BrowserStack');
    }

    if (options.userCoverageReporter) {
        reporters.push('coverage');
    }


    return {
        options: {
            files: options.files,
            exclude: [], // for overriding the exclude in the common options
        },
        singleRun: options.singleRun,
        autoWatch: options.autoWatch,
        browsers: options.browsers,
        reporters,
        captureTimeout: 120000,
        browserNoActivityTimeout: 120000,
        browserDisconnectTimeout: 120000,
        browserSocketTimeout: 120000,
        browserDisconnectTolerance: 3,
        hostname: options.hostname,
        coverageReporter: {
            dir: `${process.env.CODE_COVERAGE_REPORTS_FOLDER_PATH || 'code-coverage-reports'}/${options.outputDir}`,
            reporters: [
                { type: 'lcov', subdir: '.' },            // Generate LCOV report for CI tools like SonarQube
                { type: 'text-summary' },                 // Print summary to the terminal
                { type: 'html', subdir: 'html-report' },  // Generate HTML report for visual inspection
                { type: 'json-summary', subdir: '.' }     // Generate JSON summary for programmatic usage
            ],
            fixWebpackSourcePaths: true,  // Ensure correct source paths for Webpack-processed files
            combineBrowserReports: true,  // Combine coverage from different browsers
            skipFilesWithNoCoverage: true // Skip files with no coverage
        },
        junitReporter: {
            outputDir: `${process.env.TEST_REPORTS_FOLDER_PATH || 'test-reports'}/${options.outputDir}`,
            suite: 'integrationTests',
        },
        specReporter: {
            // maxLogLines: 5,             // limit number of lines logged per test
            // suppressErrorSummary: true, // do not print error summary
            // suppressFailed: false,      // do not print information about failed tests
            suppressPassed: false, // do not print information about passed tests
            // suppressSkipped: true,      // do not print information about skipped tests
            showSpecTiming: true, // print the time elapsed for each spec
            failFast: false, // test would finish with error when a first fail occurs.
        },
        browserStack: options.browserStack,
        webpack: options.webpack,
    };
}

function _createKarmaConfiguration() {
    return {
        options: {
            configFile: 'karma.conf.js',
            singleRun: true,
            // These are the files common for the dev and ciUT
            files: [
                'src/main/samples/DefaultSlaveCustomerApi.js',
                { pattern: 'src/main/**/*.js', included: true, served: true, watched: true },
                { pattern: 'node_modules/**/*', watched: false, included: false, served: false },  // exclude node_modules
                { pattern: 'tests/unit/main/**/*Spec.js', included: true, served: true },
                { pattern: 'tests/unit/npm/**/*Spec.js', included: true, served: true },
                'tests/unit/helpers/polyfillsLoader.js',
                'tests/unit/mocks/mockObjects.js',
                { pattern: 'tests/unit/main/technicalServices/dummyDedicatedWorker.js', included: false, served: true },
                { pattern: 'tests/unit/main/collectors/perContext/dummyScriptTwo.js', included: false, served: true },
                { pattern: 'tests/unit/main/collectors/perContext/dummyScriptOne.js', included: false, served: true },
                {
                    pattern: 'tests/unit/main/technicalServices/WorkerCommunicatorDummyDedicatedWorker.js',
                    included: false,
                    served: true,
                },
                { pattern: 'tests/unit/dummyPage.html', included: false, served: true },
                { pattern: 'tests/unit/dummyScript.js', included: false, served: true },
                { pattern: 'tests/unit/dummyScript2.js', included: false, served: true },

                { pattern: 'tests/unit/slave/**/*Spec.js', included: true, served: true },
                { pattern: 'tests/unit/worker/**/*Spec.js', included: true, served: true },
            ],

            // list of files to exclude
            exclude: [
                'tests/integration/*Spec.js',
                'src/main/system/StartPoint.js',
                'src/webcompdemo/webcompdemo.js',
                'src/main/system/main.js',
                'src/main/samples/DefaultCustomerApi.js',
                'src/worker/ServerWorkerStartPoint.js',
                'src/worker/ServerWorkerCode.js',
                'src/worker/libs/**/*.min.js', // exclude minified files
            ],
        },
        unitTests: _createUnitTestsConfiguration(_createUnitTestsOptions({
            browsers: ['Chrome'],
            singleRun: true,
            autoWatch: false,
            useDotsReporter: false,
            useSpecReporter: true,
            userCoverageReporter: true,
            webpack: slimWebpackConfig,
        })),
        unitTestsDev: _createUnitTestsConfiguration(_createUnitTestsOptions({
            browsers: ['Chrome'],
            singleRun: false,
            autoWatch: true,
            useDotsReporter: false,
            useSpecReporter: true,
            webpack: devWebpackConfig,
        })),
        ciUT: _createUnitTestsConfiguration(_createUnitTestsOptions({ browsers: ciBrowsers })),
        ciUTMinOutput: _createUnitTestsConfiguration(_createUnitTestsOptions({ browsers: ciBrowsers })),
        ciUTExcludingIosMinOutput: _createUnitTestsConfiguration(_createUnitTestsOptions({
            browsers: ciBrowsersExcludingSafari,
            browserStack: {
                username: 'clientteamautoma6',
                accessKey: 'V7QpFkzp5U9gU3JYmFzK',
                forcelocal: true,
            },
            webpack: unitWebpackConfig,
        })),
        ciUTSafariMinOutput: _createUnitTestsConfiguration(_createUnitTestsOptions({
            browsers: safariBrowsers,
            hostname: 'bs-local.com',
            browserStack: {
                username: 'clientteamautoma5',
                accessKey: 'fUrAzwUNXGGRx5iHMKaZ',
                forcelocal: true,
            },
            webpack: unitWebpackConfig,
            outputDir: 'safariUnitTests',
        })),
        ciUTAndroidMinOutput: _createUnitTestsConfiguration(_createUnitTestsOptions({ browsers: androidBrowsers })),
        ciUTMacMinOutput: _createUnitTestsConfiguration(_createUnitTestsOptions({ browsers: macBrowsers })),
        ciUTWindowsMinOutput: _createUnitTestsConfiguration(_createUnitTestsOptions({ browsers: windowsBrowsers })),
        ciUTLegacyMinOutput: _createUnitTestsConfiguration(_createUnitTestsOptions({ browsers: legacyBrowsers })),
        integrationTests: _createIntegrationTestsConfiguration(_createIntegrationTestsOptions({
            browsers: ['Chrome'],
            singleRun: true,
            autoWatch: false,
            useDotsReporter: false,
            useSpecReporter: true,
            userCoverageReporter: true,
            userBrowserStackReporter: false,
            webpack: slimWebpackConfig,
        })),
        integrationTestsDev: _createIntegrationTestsConfiguration(_createIntegrationTestsOptions({
            browsers: ['Chrome'],
            singleRun: false,
            autoWatch: true,
            useDotsReporter: false,
            useSpecReporter: true,
            userBrowserStackReporter: false,
            webpack: devWebpackConfig,
        })),
        crossDomainIntegrationTestsDev: _createIntegrationTestsConfiguration(_createCrossDomainIntegrationTestsOptions({
            browsers: ['Chrome'],
            singleRun: false,
            autoWatch: true,
            useDotsReporter: false,
            useSpecReporter: true,
            userBrowserStackReporter: false,
            webpack: slimWebpackConfig,
        })),
        // slave integration tests suite
        slaveIntegration: _createIntegrationTestsConfiguration(_createIntegrationTestsOptions({
            browsers: ['Chrome'],
            files: integrationSlaveTestsFiles,
            outputDir: 'slaveIntegrationTests',
            singleRun: false,
            autoWatch: true,
            useDotsReporter: false,
            useSpecReporter: true,
            userBrowserStackReporter: false,
        })),
        // slave bootstrap integration tests suite
        slaveBootstrapIntegration: _createIntegrationTestsConfiguration(_createIntegrationTestsOptions({
            browsers: ['Chrome'],
            files: integrationSlaveBootstrapTestsFiles,
            outputDir: 'slaveIntegrationTests',
            singleRun: false,
            autoWatch: true,
            useDotsReporter: false,
            useSpecReporter: true,
            userBrowserStackReporter: false,
        })),
        ciIT: _createIntegrationTestsConfiguration(_createIntegrationTestsOptions({ browsers: ciBrowsers })),
        ciITMinOutput: _createIntegrationTestsConfiguration(_createIntegrationTestsOptions({ browsers: ciBrowsers })),
        ciITSlaveMinOutput: _createIntegrationTestsConfiguration(_createIntegrationTestsOptions({
            browsers: ciSlaveBrowsers,
            files: integrationSlaveTestsFiles,
            outputDir: 'slaveIntegrationTests',
            browserStack: {
                username: 'clientteamautoma4',
                accessKey: 'MGgSzLsnZap7yzPwfJRb',
                forcelocal: true,
            },
        })),
        ciITExcludingIosMinOutput: _createIntegrationTestsConfiguration(_createIntegrationTestsOptions({
            browsers: ciBrowsersExcludingSafari,
            browserStack: {
                username: 'clientteamautoma3',
                accessKey: 'nxs72Hvs4ZEQE3LZQJqC',
                forcelocal: true,
            },
        })),
        ciITSafariMinOutput: _createIntegrationTestsConfiguration(_createIntegrationTestsOptions({
            browsers: safariBrowsers,
            hostname: 'bs-local.com',
            browserStack: {
                username: 'clientteamautoma2',
                accessKey: 'Uzkdy7urAiTxh6xNzdQP',
                forcelocal: true,
            },
        })),
        ciCDITMinOutput: _createIntegrationTestsConfiguration(_createCrossDomainIntegrationTestsOptions({
            browsers: crossdomainBrowsers,
            hostname: 'bs-local.com',
            browserStack: {
                username: 'clientteamautoma2',
                accessKey: 'Uzkdy7urAiTxh6xNzdQP',
                forcelocal: true,
            },
        })),
        ciITOperaMinOutput: _createIntegrationTestsConfiguration(_createIntegrationTestsOptions({
            browsers: ['win_Opera_Latest'],
            hostname: 'bs-local.com',
            browserStack: {
                username: 'clientteamautoma1',
                accessKey: 'mronzeUyApXvCMm51dq4',
                forcelocal: true,
            },
        })),
        ciITLatestBetaMinOutputWin: _createIntegrationTestsConfiguration(_createIntegrationTestsOptions({
            browsers: winBetaBrowsers,
            hostname: 'bs-local.com',
            browserStack: {
                username: 'clientteamautoma2',
                accessKey: 'Uzkdy7urAiTxh6xNzdQP',
                forcelocal: true,
            },
        })),
        ciITLatestBetaMinOutputMacOS: _createIntegrationTestsConfiguration(_createIntegrationTestsOptions({
            browsers: macOSWBetaBrowsers,
            hostname: 'bs-local.com',
            browserStack: {
                username: 'clientteamautoma3',
                accessKey: 'nxs72Hvs4ZEQE3LZQJqC',
                forcelocal: true,
            },
        })),
        ciITLatestBetaMinOutputAndroid: _createIntegrationTestsConfiguration(_createIntegrationTestsOptions({
            browsers: androidBetaBrowsers,
            hostname: 'bs-local.com',
            browserStack: {
                username: 'clientteamautoma5',
                accessKey: 'fUrAzwUNXGGRx5iHMKaZ',
                forcelocal: true,
            },
        })),
        ciITLatestBetaMinOutputIOS: _createIntegrationTestsConfiguration(_createIntegrationTestsOptions({
            browsers: iosBetaBrowsers,
            hostname: 'bs-local.com',
            browserStack: {
                username: 'clientteamautoma4',
                accessKey: 'MGgSzLsnZap7yzPwfJRb',
                forcelocal: true,
            },
        })),
        ciITSlaveLatestBetaMinOutput: _createIntegrationTestsConfiguration(_createIntegrationTestsOptions({
            browsers: ciSlaveLatestBetaBrowsers,
            files: integrationSlaveTestsFiles,
            outputDir: 'slaveIntegrationTests',
            browserStack: {
                username: 'clientteamautoma4',
                accessKey: 'MGgSzLsnZap7yzPwfJRb',
                forcelocal: true,
            },
        })),
        ciITAndroidMinOutput: _createIntegrationTestsConfiguration(_createIntegrationTestsOptions({ browsers: androidBrowsers })),
        ciITMacMinOutput: _createIntegrationTestsConfiguration(_createIntegrationTestsOptions({ browsers: macBrowsers })),
        ciITWindowsMinOutput: _createIntegrationTestsConfiguration(_createIntegrationTestsOptions({ browsers: windowsBrowsers })),
        ciITLegacyMinOutput: _createIntegrationTestsConfiguration(_createIntegrationTestsOptions({ browsers: legacyBrowsers })),
    };
}

module.exports = function createGruntKarmaConfiguration() {
    return _createKarmaConfiguration();
};