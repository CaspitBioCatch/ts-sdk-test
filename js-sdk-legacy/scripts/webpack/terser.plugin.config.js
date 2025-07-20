/**
 * Uglifier plugin configuration
 */

const TerserPlugin = require('terser-webpack-plugin');

const terserConfig = {
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        test: /\.js(\?.*)?$/i, // Apply minification to JavaScript files
        terserOptions: {
          compress: {
            drop_console: true, // Remove console logs
          },
          mangle: true, // Enable name mangling for compression
        },
      }),
    ],
  },
};

module.exports = terserConfig;
