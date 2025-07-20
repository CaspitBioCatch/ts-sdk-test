/**
 * Karma webpack configuration
 */

const { merge } = require('webpack-merge');
const babelConfig = require('./babel.loader.config.js');

const webpackConfig = merge(babelConfig,{
    module: {
        unknownContextCritical: false,
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        plugins: ['babel-plugin-istanbul'] // Ensures coverage instrumentation
                    }
                }
            }
        ]
    },
    mode: 'development',
    target: ['web', 'es5'],
    devtool: 'eval-source-map'
});

module.exports = webpackConfig;
