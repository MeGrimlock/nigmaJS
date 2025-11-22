const path = require("path");
const webpack = require("webpack");

module.exports = {
  entry: {
    nigma: "./src/index.js"
  },
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "js/nigma.min.js",
    library: "nigmajs",
    libraryTarget: "umd",
    globalObject: "this"
  },
  // Loaders
  module: {
    rules: [
      // JavaScript/JSX Files
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ["babel-loader"]
      },
      // CSS Files
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      }
    ]
  },
  resolve: {
    fallback: {
      "buffer": require.resolve("buffer/"),
      "stream": require.resolve("stream-browserify"),
      "crypto": require.resolve("crypto-browserify"),
      "process": require.resolve("process/browser"),
      "vm": require.resolve("vm-browserify"),
      "fs": false,
      "path": false,
      "os": false
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer']
    })
  ]
};
