/**
 * Karma webpack configuration
 */
const { merge } = require('webpack-merge');
const babelConfig = require('./babel.loader.config.js');

const { ProvidePlugin } = require('webpack')

const webpackConfig = merge(babelConfig,{
    module: {
        unknownContextCritical: false,
    },
    mode: 'production',
    target: ['web', 'es5'],
    devtool: 'eval-source-map',
    plugins: [
        new ProvidePlugin({
            process: 'process',
        }),
    ]
});

module.exports = webpackConfig;
