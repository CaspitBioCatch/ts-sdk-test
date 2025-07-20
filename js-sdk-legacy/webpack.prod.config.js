/**
 * Webpack Production build configuration
 */

const fs_extra = require('fs-extra');
const chalk = require('chalk');
const _log = console.log;
const path = require('path');
const version = require('./version');

// Bluebirdjs has support for each
const bb = require("bluebird");
const { merge } = require('webpack-merge');
const uglifyConfig = require('./scripts/webpack/terser.plugin.config.js');
const eslintConfig = require('./scripts/webpack/eslint.loader.config.js');
const babelConfig = require('./scripts/webpack/babel.loader.config.js');
const crossDomainArtifactConfig = require('./scripts/webpack/crossdomain.artifact.config');

const webpackUtils = require('./scripts/webpack/webpackUtils.js');

const copyFiles = {
    // Production files
    production: [
        {
            source: path.resolve(__dirname, 'tempClasses/main.bundle.js'),
            destination: path.resolve(__dirname, 'dist/sloth' + version.formattedString + '.min.js')
        },
        {
            source: path.resolve(__dirname, 'tempClasses/slave.bundle.js'),
            destination: path.resolve(__dirname, 'dist/slave' + version.formattedString + '.min.js')
        },
        {
            source: path.resolve(__dirname, 'tempClasses/worker.bundle.js'),
            destination: path.resolve(__dirname, 'dist/worker' + version.formattedString + '.min.js')
        },
        {
            source: path.resolve(__dirname, 'tempClasses/crossclient.bundle.js'),
            destination: path.resolve(__dirname, 'dist/crossdomain' + version.formattedString + '.min.js')
        },
    ]
};

const webpackConfig = merge(uglifyConfig, eslintConfig, babelConfig, crossDomainArtifactConfig, {
    mode: 'production',
    stats: true,
    target: ['web', 'es5'],
    entry: {
        main: './src/main/system/main.js',
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
                            path.resolve(__dirname, 'tempClasses/main.bundle.js'),
                            '@@scriptVersion',
                            version.formattedString
                        ));

                        replaceArr.push(webpackUtils.replaceFileContent(
                            path.resolve(__dirname, 'tempClasses/slave.bundle.js'),
                            '@@scriptVersion',
                            version.formattedString
                        ));

                        return bb.all(replaceArr).then(() => {
                            // Signal webpack our cheerful copying and writing to the file system is completed.
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
                    'ProductionFiles',
                    (stats, callback) => {
                        bb.mapSeries(
                            copyFiles.production,
                            function (fileObj, index, length) {
                                return fs_extra.copy(fileObj.source, fileObj.destination).then(() => {
                                    return fileObj;
                                }).catch((err) => {
                                    if (err) throw err
                                });
                            }).then((result) => {
                            _log(chalk.green("ProductionFiles is finished"));
                            result.forEach((file_obj) => {
                                _log(chalk.green("File: ", file_obj.source, " Copied to: ", file_obj.destination));
                            });

                            callback();

                        });
                    }
                );
            }
        }
    ],
    output: {
        filename: (chunkData) => {
            return '[name].bundle.js';
        },
        path: path.resolve(__dirname, 'tempClasses'),
        library: "cdwpb"
    }
});

module.exports = webpackConfig;
