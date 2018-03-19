var path = require('path')
const CopyPlugin = require('copy-webpack-plugin')
const webpack = require('webpack')
const entry = require('./package.json').main

module.exports = {
  entry,
  target: 'node',
  output: {
    path: path.join(__dirname, 'build'),
    filename: 'index.js'
  },
  plugins: [
    new CopyPlugin([
      { from: 'manifest.konnector' },
      { from: 'package.json' },
      { from: 'README.md' },
      { from: 'LICENSE' }
    ]),
    new webpack.DefinePlugin({
      API_URL: JSON.stringify(process.env.API_URL)
    })
  ]
}
