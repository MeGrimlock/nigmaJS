// Manual build script to verify the build process
const webpack = require('webpack');
const config = require('../webpack.config.js');

console.log('Starting manual build...');

webpack(config, (err, stats) => {
    if (err) {
        console.error('Build error:', err);
        return;
    }

    if (stats.hasErrors()) {
        console.error('Build stats errors:', stats.toJson().errors);
        return;
    }

    console.log('Build completed successfully!');
    console.log('Build stats:', stats.toString({ colors: true, chunks: false, modules: false }));
});
