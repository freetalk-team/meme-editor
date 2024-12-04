;

const path = require('path');

module.exports = {
  entry: path.resolve(__dirname, 'public/editor.js'),
  output: {
    path: path.resolve(__dirname, 'public/dist'),
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
  optimization: {},
  plugins: [],
};
