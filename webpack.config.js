const path = require('path');

const config = {
  target: 'web',
  entry: {
    index: './src/index.js',
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'myLib.js',
    library: 'CaspitBioCatch',
    libraryTarget: 'umd',
    globalObject: 'this',
    umdNamedDefine: true,
  },
  watchOptions: {
    aggregateTimeout: 600,
    ignored: /node_modules/,
  },
  plugins: [
    {
        apply: (compiler) => {
          compiler.hooks.done.tap("DonePlugin", (stats) => {
            console.log("Compile is done !");
            setTimeout(() => {
              process.exit(0);
            });
          });
        },
      },
  ],
  resolve: {
    extensions: ['.js'],
  },
};

module.exports = (env, argv) => {
  if (argv.mode === 'development') {
    // * add some development rules here
  } else if (argv.mode === 'production') {
    // * add some prod rules here
  } else {
    throw new Error('Specify env');
  }

  return config;
};