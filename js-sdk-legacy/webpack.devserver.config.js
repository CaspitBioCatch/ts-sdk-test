/**
 * Webpack config file for dev server setup.
 * @type {merge}
 */

const { merge } = require('webpack-merge');
const devConfig = require('./webpack.dev.config.js');
const prodConfig = require('./webpack.prod.config.js');
const devServerConfig = require('./scripts/webpack/devserver.config.js');
const testServerConfig = require('./scripts/webpack/testserver.config.js');

module.exports = (env, argv) => {
    if (argv.mode === 'production') {
        return merge(prodConfig, devServerConfig);
    }
    else if(argv.mode === 'development'){
        if(env.goal === 'integration') {
            return merge(devConfig, testServerConfig);
        }
        return merge(devConfig, devServerConfig);
    }
    else{
        throw new Error(`Unknown mode ${argv.mode}`);
    }
};
