/**
 * We use the following plugins:
 * https://github.com/babel/babel-loader - Support the import/export of ES6 modules
 * https://babeljs.io/docs/en/babel-plugin-transform-class-properties/ - allow static and arrow functions
 * to be created as class properties
 * https://www.npmjs.com/package/git-revision-webpack-plugin - to produce short git version tags
 */

const fs_extra = require('fs-extra');
const chalk = require('chalk');
const _log = console.log;
const path = require('path');
const JavaScriptObfuscator = require('webpack-obfuscator');
const obfuscationOptions = 'obfuscation-option.json';
const version = require('./version');

// Bluebirdjs has support for each
const bb = require("bluebird");
const { merge } = require('webpack-merge');
const eslintConfig = require('./scripts/webpack/eslint.loader.config.js');
const babelConfig = require('./scripts/webpack/babel.loader.config.js');
const crossDomainArtifactConfig = require('./scripts/webpack/crossdomain.artifact.config');

const webpackUtils = require('./scripts/webpack/webpackUtils.js');

const copyFiles =  [
    {
        source: path.resolve(__dirname, 'tempClasses/main.bundle.obfuscated.js'),
        destination: path.resolve(__dirname, 'dist/sloth' + version.formattedString + '.obfuscated.js')
    },
    {
        source: path.resolve(__dirname, 'tempClasses/slave.bundle.obfuscated.js'),
        destination: path.resolve(__dirname, 'dist/slave' + version.formattedString + '.obfuscated.js')
    },
    {
        source: path.resolve(__dirname, 'tempClasses/crossclient.bundle.obfuscated.js'),
        destination: path.resolve(__dirname, 'dist/crossdomain' + version.formattedString + '.obfuscated.js')
    },
];

const webpackConfig = merge(babelConfig, crossDomainArtifactConfig, {
    mode: 'production',
    target: ['web', 'es5'],
    stats: true,
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
                        const replaceArr  = [];

                        replaceArr.push(webpackUtils.replaceFileContent(
                            path.resolve(__dirname, 'tempClasses/main.bundle.obfuscated.js'),
                            '@@scriptVersion',
                            version.formattedString
                        ));

                        return bb.all(replaceArr).then( () => {
                            // Signal webpack our cheerful copying and writing to the file system is completed.
                            return true;
                        }).catch( (err) => {
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
                            copyFiles,
                            function( fileObj, index, length ) {
                                return fs_extra.copy(fileObj.source, fileObj.destination).then( () => {
                                    return fileObj;
                                }).catch( (err) => {
                                    if (err) throw err
                                });
                            }).then( (result) => {
                            _log(chalk.green("ProductionFiles is finished"));
                            result.forEach( (file_obj) => {
                                _log(chalk.green("File: ", file_obj.source, " Copied to: ", file_obj.destination));
                            });

                            callback();

                        });
                    }
                );
            }
        },
        new JavaScriptObfuscator(obfuscationOptions)
    ],
    output: {
        filename: (chunkData) => {
            return '[name]' + '.bundle.obfuscated.js';
        },
        path: path.resolve(__dirname, 'tempClasses'),
        library: "cdwpb"
    }
});

module.exports = webpackConfig;
