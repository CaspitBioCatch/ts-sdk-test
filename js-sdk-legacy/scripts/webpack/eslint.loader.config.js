/**
 * eslint loader configuration
 */

const ESLintPlugin = require('eslint-webpack-plugin');

const eslintOptions =  {
    eslintPath: 'eslint',
    failOnWarning: true,
    failOnError: true,
    emitWarning: true,
    emitError: true,
};

const options = {
    extensions: ['js', 'jsx', 'jsx'],
    exclude: [
        'src/worker/libs/',
    ],
    ...eslintOptions, // these are the options we'd previously passed in
}


const webpackConfig = {
    module: {
        rules: {
            plugins: [new ESLintPlugin(options)],
        }
    }
}

module.exports = webpackConfig;
