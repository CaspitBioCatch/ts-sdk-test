const fs_extra = require('fs-extra');
const chalk = require('chalk');
const _log = console.log;
const path = require('path');
const version = require('./version.js');

// Bluebirdjs has support for each
const bb = require("bluebird");
const { merge } = require('webpack-merge');
const babelConfig = require('./scripts/webpack/babel.loader.config.js');
const crossDomainArtifactConfig = require('./scripts/webpack/crossdomain.artifact.config.js');

const webpackUtils = require('./scripts/webpack/webpackUtils.js');

const copyFiles = [
    {
        source: path.resolve(__dirname, 'tempClasses/main.debug.bundle.npm.js'),
        destination: path.resolve(__dirname, 'npm-configs/artifact.debug.npm.js')
    },
    {
        source: path.resolve(__dirname, 'tempClasses/main.debug.bundle.npm.js.map'),
        destination: path.resolve(__dirname, 'npm-configs/artifact.debug.npm.js.map')
    },
];

const webpackConfig = merge(babelConfig, crossDomainArtifactConfig, {
    mode: 'development', // Development mode
    target: ['web', 'es5'],
    devtool: 'source-map', // Enable source maps
    stats: true,
    optimization: {
        minimize: false, // Disable minification
    },
    entry: {
        main: './src/npm/entry.js',
        slaveInternal: './src/slave/slaveInternal.js',
        slave: './src/slave/slave.js',
        worker: './src/worker/worker.js',
        crossclient: './src/crossclient/crossclient.js'
    },
    plugins: [
        {
            apply: (compiler) => {
                compiler.hooks.done.tapPromise(
                    'ReplaceScriptVersion',
                    (stats) => {
                        const replaceArr = [];

                        replaceArr.push(webpackUtils.replaceFileContent(
                            path.resolve(__dirname, 'tempClasses/main.debug.bundle.npm.js'),
                            '@@scriptVersion',
                            version.formattedString
                        ));

                        return bb.all(replaceArr).then(() => {
                            return true;
                        }).catch((err) => {
                            //if (err) throw err;
                        });
                    }
                )
            }
        },
        {
            apply: (compiler) => {
                compiler.hooks.done.tapAsync(
                    'DebugFiles',
                    (stats, callback) => {
                        bb.mapSeries(
                            copyFiles,
                            function (fileObj, index, length) {
                                return fs_extra.copy(fileObj.source, fileObj.destination).then(() => {
                                    return fileObj;
                                }).catch((err) => {
                                    if (err) throw err
                                });
                            }).then((result) => {
                                _log(chalk.green("DebugFiles is finished"));
                                result.forEach((file_obj) => {
                                    _log(chalk.green("File: ", file_obj.source, " Copied to: ", file_obj.destination));
                                });

                                callback();
                            });
                    }
                );
            }
        },
        {
            apply: (compiler) => {
                compiler.hooks.done.tap("DonePlugin", (stats) => {
                    console.log("Debug compile is done !");
                    setTimeout(() => {
                        process.exit(0);
                    });
                });
            },
        },
    ],
    output: {
        filename: (chunkData) => {
            return '[name]' + '.debug.bundle.npm.js';
        },
        path: path.resolve(__dirname, 'tempClasses'),
        library: {
            name: "biocatch",
            type: "umd",
            export: "default"
        }
    }
});

module.exports = webpackConfig;