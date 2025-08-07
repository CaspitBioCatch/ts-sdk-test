const path = require('path');

const { merge } = require('webpack-merge');
const eslintConfig = require('./scripts/webpack/eslint.loader.config.js');
const babelConfig = require('./scripts/webpack/babel.loader.config.js');

const webpackConfig = merge(eslintConfig, babelConfig, {
    mode: 'development',
    target: ['web', 'es5'],
    devtool: "inline-source-map",
    stats: true,
    entry: {
        main: './dist/src/index.js',
        worker: './js-sdk-legacy/src/worker/worker.js',
        slave: './js-sdk-legacy/src/slave/slave.js',
    },
    output: {
        filename: () => {
            return '[name].debug.bundle.js';
        },
        path: path.resolve(__dirname, 'tempClasses'),
        library: "cdwpb",
        devtoolModuleFilenameTemplate: '../[resource-path]'
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src')
        }
    }
});

module.exports = webpackConfig

