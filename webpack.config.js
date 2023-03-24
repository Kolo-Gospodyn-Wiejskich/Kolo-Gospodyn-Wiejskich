const path = require('path');
const Dotenv = require('dotenv-webpack');

module.exports = {
  entry: './js/index.js',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'js/dist'),
  },
  resolve: {
    fallback: {
      os: require.resolve('os-browserify/browser'),
      path: require.resolve('path-browserify'),
    },
  },
  plugins: [new Dotenv()],
};