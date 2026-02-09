const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// Ensure audio assets (e.g. .ogg) are bundled for all platforms including web
config.resolver.assetExts = [...config.resolver.assetExts, 'ogg'];
module.exports = config;


