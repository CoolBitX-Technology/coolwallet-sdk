const path = require('path');

module.exports = {
  entry: './index.js',
  resolve: {
    extensions: ['.js'],
  },
  output: {
    path: path.join(__dirname, '/lib'),
    filename: 'index.js',
    libraryTarget: 'umd',
    library: 'devices',
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
  }
};
