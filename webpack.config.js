;

const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: path.resolve(__dirname, 'editor.js'),
  output: {
    path: path.resolve(__dirname, '../../apps/chat/public/dist'),
    filename: 'meme-editor.min.js',
    libraryTarget: 'umd',
    library: {
        name: 'MemeEditor',
        type: 'umd',
          // add this to export your class to the library
        export: "default"
    },
  },

  mode: 'production',
  optimization: {
    // minimize: false,
    // minimizer: [new TerserPlugin()],
  },
  plugins: [

  ],
};
