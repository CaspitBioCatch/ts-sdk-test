const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const version = require('../../version');

const projectRootDir = path.resolve(__dirname, '../..');

const webpackConfig = {
    plugins: [
        new HtmlWebpackPlugin(
            {
                filename: path.resolve(projectRootDir, 'dist/crossdomain.html'),
                template: path.resolve(projectRootDir, 'src/crossclient/index.html'),
                inject: false,
                templateParameters: {
                    CCFULLNAME: 'crossdomain' + version.formattedString + '.min.js'
                }
            }
        )
    ],
};

module.exports = webpackConfig;
