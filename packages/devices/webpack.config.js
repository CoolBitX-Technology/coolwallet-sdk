var path = require('path')

module.exports = {
  entry: ['./index'],
  output: {
    path: path.join(__dirname, 'lib'),
    filename: 'devices.js'
  }
}