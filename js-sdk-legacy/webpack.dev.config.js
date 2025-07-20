/**
 * We use the following plugins:
 * https://github.com/babel/babel-loader - Support the import/export of ES6 modules
 * https://babeljs.io/docs/en/babel-plugin-transform-class-properties/ - allow static and arrow functions
 * to be created as class properties
 * https://www.npmjs.com/package/git-revision-webpack-plugin - to produce short git version tags
 */

const fs = require('fs');
const fs_extra = require('fs-extra');
const chalk = require('chalk');
const _log = console.log;
const path = require('path');
const version = require('./version');

// Bluebirdjs has support for each
const bb = require("bluebird");
const { merge } = require('webpack-merge');
const eslintConfig = require('./scripts/webpack/eslint.loader.config.js');
const babelConfig = require('./scripts/webpack/babel.loader.config.js');
const crossDomainArtifactConfig = require('./scripts/webpack/crossdomain.artifact.config');

const webpackUtils = require('./scripts/webpack/webpackUtils.js');

const copyFiles = {
    // Dev (not minified + source maps) files
    development: [
        {
            source: path.resolve(__dirname, 'tempClasses/main.debug.bundle.js'),
            destination: path.resolve(__dirname, 'dist/debug/sloth' + version.formattedString + '.js'),
        },
        {
            source: path.resolve(__dirname, 'tempClasses/main.debug.bundle.js.map'),
            destination: path.resolve(__dirname, 'dist/debug/sloth' + version.formattedString + '.js.map'),
        },
        {
            source: path.resolve(__dirname, 'tempClasses/slave.debug.bundle.js'),
            destination: path.resolve(__dirname, 'dist/debug') + '/slave' + version.formattedString + '.js',
        },
        {
            source: path.resolve(__dirname, 'tempClasses/webcompdemo.debug.bundle.js'),
            destination: path.resolve(__dirname, 'dist/debug/webcompdemo' + version.formattedString + '.js'),
        },
    ],
};

const webpackConfig = merge(eslintConfig, babelConfig, crossDomainArtifactConfig, {
    mode: 'development',
    target: ['web', 'es5'],
    devtool: "source-map",
    stats: true,
    entry: {
        main: './src/main/system/main.js',
        slaveInternal: './src/slave/slaveInternal.js',
        slave: './src/slave/slave.js',
        worker: './src/worker/worker.js',
        crossclient: './src/crossclient/crossclient.js',
        webcompdemo: './src/webcompdemo/webcompdemo.js',
    },
    plugins: [
        {
            apply: (compiler) => {
                compiler.hooks.done.tapPromise(
                    'ReplaceScriptVersion',
                    (stats) => {
                        const replaceArr = [];

                        replaceArr.push(webpackUtils.replaceFileContent(
                            path.resolve(__dirname, 'tempClasses/main.debug.bundle.js'),
                            '@@scriptVersion',
                            version.formattedString
                        ));
                        replaceArr.push(webpackUtils.replaceFileContent(
                            path.resolve(__dirname, 'tempClasses/main.debug.bundle.js.map'),
                            '@@scriptVersion',
                            version.formattedString
                        ));

                        replaceArr.push(webpackUtils.replaceFileContent(
                            path.resolve(__dirname, 'tempClasses/slave.debug.bundle.js'),
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
                    'DevelopmentFiles',
                    (stats, callback) => {
                        bb.mapSeries(
                            copyFiles.development,
                            function (fileObj, index, length) {
                                return fs_extra.copy(fileObj.source, fileObj.destination).then(() => {
                                    return fileObj;
                                }).catch((err) => {
                                    if (err) throw err
                                });
                            }).then((result) => {
                            _log(chalk.green("DevelopmentFiles is finished"));
                            result.forEach((file_obj) => {
                                _log(chalk.green("File: ", file_obj.source, " Copied to: ", file_obj.destination));
                            });
                            bb.all([
                                webpackUtils.replaceFileContent(
                                    path.resolve(__dirname, 'dist/debug') + '/sloth' + version.formattedString + '.js',
                                    'main.debug.bundle.js.map',
                                    'sloth' + version.formattedString + '.js.map'
                                )]
                            ).then(() => {
                                // Signal webpack our cheerful copying and writing to the file system is completed.
                                callback();
                            });
                        });
                    })
            }
        }
    ],
    output: {
        filename: (chunkData) => {
            return '[name].debug.bundle.js';
        },
        path: path.resolve(__dirname, 'tempClasses'),
        library: "cdwpb"
    }
});

module.exports = webpackConfig
