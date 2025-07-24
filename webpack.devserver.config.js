const fs = require('fs');
const fs_extra = require('fs-extra');
const chalk = require('chalk');
const _log = console.log;
const _error = console.error;
const path = require('path');

// Bluebirdjs has support for each
const bb = require("bluebird");

const projectRootDir = path.resolve(__dirname, './');

function replaceFileContent(src, search, replace) {
    if (!fs.existsSync(src)) {
        throw src + " File not found";
    }
    let file_content = fs.readFileSync(src, 'utf8');
    const final_content = file_content.replace(search, replace);
    return fs.writeFile(src, final_content, (err) => {
        if (err) throw err;
    });
}

const copyFiles = {
    // Files that are served by the Webpack Dev Server.
    devserver: [
        {
            source: path.resolve(projectRootDir, 'public') + '/DefaultCustomerApi.js',
            destination: path.resolve(projectRootDir, 'public/customerJs') + '/DefaultCustomerApi.js',
        },
        {
            source: path.resolve(projectRootDir, 'tempClasses/main.debug.bundle.js'),
            destination: path.resolve(projectRootDir, 'public/customerJs/main.js'),
        },
        {
            source: path.resolve(projectRootDir, 'tempClasses/worker.debug.bundle.js'),
            destination: path.resolve(projectRootDir, 'public/customerJs/worker.js'),
        },
    ]
}

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
        server: {
            type: 'https',
            options: {
                key: fs.readFileSync(path.resolve(projectRootDir, "devtools/certificates") + "/key.pem"),
                cert: fs.readFileSync(path.resolve(projectRootDir, "devtools/certificates") + "/cert.pem"),
            },
        },
        open: 'test.html',
        port: 9000,
        static: {
            directory: path.resolve(projectRootDir, 'public'),
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
                            // letting webpack know we finished with the copying
                            callback();
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
