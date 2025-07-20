/**
 * Babel loader configuration
 */

const webpackConfig = {
    module: {
        rules: [
            {
                oneOf: [
                    {
                        test: /\.js$/,
                        exclude: /(node_modules|bower_components)/,
                        use: {
                            loader: 'babel-loader',
                            options: {
                                presets: [["@babel/preset-env"]]
                            },
                        }
                    }
                ]
            }
        ]
    }
};

module.exports = webpackConfig;
