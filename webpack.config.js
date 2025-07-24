/**
 * We use the following plugins:
 * https://github.com/babel/babel-loader - Support the import/export of ES6 modules
 * https://babeljs.io/docs/en/babel-plugin-transform-class-properties/ - allow static and arrow functions
 * to be created as class properties
 * https://www.npmjs.com/package/git-revision-webpack-plugin - to produce short git version tags
 */

const path = require('path');

// Bluebirdjs has support for each
const { merge } = require('webpack-merge');
const eslintConfig = require('./scripts/webpack/eslint.loader.config.js');
const babelConfig = require('./scripts/webpack/babel.loader.config.js');

const webpackConfig = merge(eslintConfig, babelConfig, {
    mode: 'development',
    target: ['web', 'es5'],
    devtool: "source-map",
    stats: true,
    entry: {
        main: './dist/src/index.js',
        worker: './js-sdk-legacy/src/worker/worker.js'
    },
    output: {
        filename: (chunkData) => {
            return '[name].debug.bundle.js';
        },
        path: path.resolve(__dirname, 'tempClasses'),
        library: "cdwpb"
    }
});

module.exports = webpackConfig

