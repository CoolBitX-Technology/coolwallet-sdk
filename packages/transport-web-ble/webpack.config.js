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
    library: 'transport-web-ble',
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
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-proposal-class-properties']
          }
        }
      }
    ]
  },
  externals: /^(@coolwallet.*|react|react-native)/
};
