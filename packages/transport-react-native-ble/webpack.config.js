const path = require('path');

module.exports = {
  entry: './src/index.js',
  resolve: {
    extensions: ['.js'],
  },
  output: {
    path: path.join(__dirname, '/lib'),
    filename: 'transport-react-native-ble.min.js',
    libraryTarget: 'umd',
    library: 'transport-react-native-ble',
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
            presets: ['module:metro-react-native-babel-preset'],
          }
        }
      }
    ]
  },
  externals: /^(@coolwallet.*|react|react-native)/
};
