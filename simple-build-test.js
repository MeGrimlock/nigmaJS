// Simple test to verify if Node.js works
console.log('Node.js is working!');
console.log('Current directory:', process.cwd());

// Try to require webpack
try {
    const webpack = require('webpack');
    console.log('Webpack is available, version:', webpack.version);
} catch (e) {
    console.log('Webpack not available:', e.message);
}

// Try to require the config
try {
    const config = require('./webpack.config.js');
    console.log('Webpack config loaded successfully');
    console.log('Entry point:', config.entry);
} catch (e) {
    console.log('Config load error:', e.message);
}
