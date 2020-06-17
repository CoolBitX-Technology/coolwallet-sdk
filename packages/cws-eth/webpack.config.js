const path = require('path');

module.exports = {
  entry: './src/index.js',
  resolve: {
    extensions: ['.js'],
  },
  output: {
    path: path.join(__dirname, '/lib'),
    filename: 'index.js',
    libraryTarget: 'umd',
    library: 'eth',
    umdNamedDefine: true,
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  externals: {
    '@coolwallet/core': '@coolwallet/core',
    web3: 'web3',
    rlp: 'rlp',
    elliptic: 'elliptic',
    'eth-sig-util': 'eth-sig-util'
  }
};
