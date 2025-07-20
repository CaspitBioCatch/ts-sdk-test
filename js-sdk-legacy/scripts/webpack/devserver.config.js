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
const _error = console.error;
const path = require('path');

// Bluebirdjs has support for each
const bb = require("bluebird");

const webpackUtils = require('./webpackUtils.js');

const projectRootDir = path.resolve(__dirname, '../..');
const copyFiles = {
    // Files that are served by the Webpack Dev Server.
    devserver: [
        {
            source: path.resolve(projectRootDir, 'src/main/samples/') + '/DefaultCustomerApi.js',
            destination: path.resolve(projectRootDir, 'devtools/public/customerJs') + '/DefaultCustomerApi.js',
        },
        {
            source: path.resolve(projectRootDir, 'tempClasses/main.debug.bundle.js'),
            destination: path.resolve(projectRootDir, 'devtools/public/customerJs/slothDebug_DevVersion.js'),
        },
        {
            source: path.resolve(projectRootDir, 'tempClasses/main.debug.bundle.js.map'),
            destination: path.resolve(projectRootDir, 'devtools/public/customerJs/slothDebug_DevVersion.js.map'),
        },
        {
            source: path.resolve(projectRootDir, 'tempClasses/main.bundle.js'),
            destination: path.resolve(projectRootDir, 'devtools/public/customerJs/sloth_DevVersion.js'),
        },
        {
            source: path.resolve(projectRootDir, 'tempClasses/main.bundle.obfuscated.js'),
            destination: path.resolve(projectRootDir, 'devtools/public/customerJs/slothObfuscated_DevVersion.js'),
        },
        {
            source: path.resolve(projectRootDir, 'tempClasses/slaveInternal.bundle.js'),
            destination: path.resolve(projectRootDir, 'devtools/public/customerJs/slave_DevVersion.js'),
        },
        {
            source: path.resolve(projectRootDir, 'tempClasses/slaveInternal.debug.bundle.js'),
            destination: path.resolve(projectRootDir, 'devtools/public/customerJs/slaveDebug_DevVersion.js'),
        },
        {
            source: path.resolve(projectRootDir, 'tempClasses/slaveInternal.bundle.obfuscated.js'),
            destination: path.resolve(projectRootDir, 'devtools/public/customerJs/slaveObfuscated_DevVersion.js'),
        },
        {
            source: path.resolve(projectRootDir, 'tempClasses/worker.debug.bundle.js.map'),
            destination: path.resolve(projectRootDir, 'devtools/public/customerJs/workerDebug_DevVersion.js.map'),
        },
        {
            source: path.resolve(projectRootDir, 'tempClasses/worker.bundle.js'),
            destination: path.resolve(projectRootDir, 'devtools/public/customerJs/worker_DevVersion.js'),
        },
        {
            source: path.resolve(projectRootDir, 'tempClasses/webcompdemo.debug.bundle.js'),
            destination: path.resolve(projectRootDir, 'devtools/public/customerJs/webcompdemo.debug.bundle.js'),
        },
    ],
};

// Now includes webpack-dev-server V4 support
// https://github.com/webpack/webpack-dev-server/blob/master/migration-v4.md
const webpackConfig = {
    devServer: {
        allowedHosts: [
            'localhost',
        ],
        client: {
            overlay: false,
        },
        devMiddleware: {
            writeToDisk: true, // By default, the dev server doesn't write the compiled files to the output.path
        },
        https: {
            key: fs.readFileSync(path.resolve(projectRootDir, "devtools/certificates") + "/key.pem"),
            cert: fs.readFileSync(path.resolve(projectRootDir, "devtools/certificates") + "/cert.pem"),
        },
        open: 'test.html',
        port: 9000,
        static: {
            directory: path.resolve(projectRootDir, 'devtools/public'),
        },
    },
    watchOptions: {
        ignored: [
            path.resolve(projectRootDir, 'devtools') + "/**",
            path.resolve(projectRootDir, 'dist') + "/**",
            path.resolve(projectRootDir, 'tempClasses') + "/**",
            path.resolve(projectRootDir, 'node_modules') + "/**",
        ]
    },
    plugins: [
        {
            apply: (compiler) => {
                compiler.hooks.done.tapAsync(
                    'DevServerCopyFiles',
                    (stats, callback) => {
                        bb.mapSeries(
                            copyFiles.devserver,
                            function (fileObj, index, length) {
                                return fs_extra.copy(fileObj.source, fileObj.destination).then(() => {
                                    return fileObj;
                                }).catch((err) => {
                                    if (err) throw err
                                });
                            }).then((result) => {
                            _log(chalk.green("DevServerCopyFiles is finished"));
                            result.forEach((file_obj) => {
                                _log(chalk.green("File: ", file_obj.source, " Copied to: ", file_obj.destination));
                            });
                            bb.all([
                                webpackUtils.replaceFileContent(
                                    path.resolve(projectRootDir, 'devtools/public/customerJs') + '/slothDebug_DevVersion.js',
                                    'main.debug.bundle.js.map',
                                    'slothDebug_DevVersion.js.map'
                                )]
                            ).then(() => {
                                // Signal webpack our cheerful copying and writing to the file system is completed.
                                callback();
                            }).catch((err) => {
                                _error("Error while running DevServerCopyFiles");
                                if (err) throw err;
                            });
                        }).catch((err) => {
                            _error("Error while running DevServerCopyFiles");
                            if (err) throw err;
                        });
                    })
            }
        }
    ],
};

module.exports = webpackConfig;
