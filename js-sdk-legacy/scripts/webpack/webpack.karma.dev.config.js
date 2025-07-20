/**
 * Karma webpack configuration
 */

const { merge } = require('webpack-merge');
const eslintConfig = require('./eslint.loader.config.js');
const webpackKarmaConfig = require('./webpack.karma.config');

const webpackConfig = merge(eslintConfig, webpackKarmaConfig, {
    mode: 'development',
    target: ['web', 'es5'],
    devtool: 'eval-source-map'
});

module.exports = webpackConfig;
