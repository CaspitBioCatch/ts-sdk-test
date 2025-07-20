/**
 * Karma webpack configuration
 */
const { merge } = require('webpack-merge');
const babelConfig = require('./babel.loader.config.js');

const webpackConfig = merge(babelConfig,{
    module: {
        unknownContextCritical: false,
    },
    mode: 'production',
    target: ['web', 'es5']
});

module.exports = webpackConfig;
