/**
 * Istanbul loader configuration
 */

const webpackConfig = {
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.js$/,
                use: {
                    loader: 'istanbul-instrumenter-loader',
                    options: {
                        esModules: true,
                        produceSourceMap: true,
                    },
                },
                enforce: 'post',
                exclude: /node_modules|\.spec\.js$/,
            },
        ]
    },
};

module.exports = webpackConfig;
