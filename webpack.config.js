const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
	entry: {
		// app: "./src/index.js"
		app: './src/index.js'
	},
	output: {
		path: path.resolve(__dirname, 'build'),
		filename: 'js/nigma.min.js'
	},
	// Loaders
	module: {
		rules: [
			// JavaScript/JSX Files
			{
				test: /\.(js|jsx)$/,
				exclude: /node_modules/,
				use: ['babel-loader']
			},
			// CSS Files
			{
				test: /\.css$/,
				use: ['style-loader', 'css-loader']
			}
		]
	} /* ,
	// Plugins
	plugins: [
		new HtmlWebpackPlugin({
			filename: "index.html",
			template: "./index.html"
		})
	] */
};
